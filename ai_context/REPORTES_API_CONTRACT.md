# Contrato de API — Reportabilidad en tiempo real (Dashboards 1 y 3)

Especificación backend para los endpoints de agregación que alimentan la nueva
sección de reportería **en tiempo real** del panel Next.js. Cubre:

- **Dashboard 1 — Torre de Control Operacional** (WIP, cuellos de botella, atascadas).
- **Dashboard 3 — Calidad e Incidencias** (morrales incompletos, resolución, costo).

> ✅ **IMPLEMENTADO Y VERIFICADO** en `servilion-backend` (rama de trabajo, sin commit).
> Archivos: `orders/report_schemas.py`, `orders/report_services.py`,
> `orders/report_api.py`, migración `orders/0005_*`, montaje en `core/api.py`.
> `manage.py check` sin issues; los 6 endpoints corren contra las 283.243 guías
> reales. **Falta commit** y la capa de caché Redis (ver §0, se puede añadir sin
> cambiar el contrato). Caveats de datos legados en §7.

> **Verificado contra el backend real** (`servilion-backend/orders/models.py`,
> `companies/models.py`, `orders/api.py`, `core/api.py`), no solo contra el
> `openapi.json`. Fuente del flujo: `FLUJO_NEGOCIO.md`.

Sigue la arquitectura **Service Layer** del proyecto: `schemas.py` (Django Ninja
`Schema`), `services.py` (lógica y consultas ORM), `api.py` (solo enruta). Tipado
estricto, `select_related` / `prefetch_related` donde haya relaciones, respuesta
**siempre agregada** (nunca listas de 282k filas).

---

## 0. Principios de "tiempo real" en este stack

`t3.micro` + ~282.000 guías ⇒ tiempo real = **agregación fresca cada pocos
segundos vía polling** (React Query `refetchInterval`), no streaming ni
materialized views.

| Endpoint | Frescura | Estrategia |
|---|---|---|
| `operations/summary` | 15–30 s | Agregación ORM directa (indexada). Sin caché o Redis TTL 10 s. |
| `operations/stalled` | 15–30 s | Consulta indexada paginada. Sin caché. |
| `operations/timeseries` | 1–5 min | `TruncDate` + `Count`. Redis TTL 120 s. |
| `quality/summary` | 1–5 min | Agregación sobre incidencias. Redis TTL 120 s. |
| `quality/garment-pareto` | 1–5 min | Agregación por tipo de prenda. Redis TTL 300 s. |
| `quality/incidents` | 15–30 s | Consulta indexada paginada. Sin caché. |

La clave de caché incluye **todos** los filtros aplicados para no mezclar vistas
de distintas empresas.

---

## 1. Ubicación y montaje

Router **propio** montado en `core/api.py` con su tag, junto a los existentes:

```python
# core/api.py
from orders.report_api import router as reports_router
api.add_router('/reports/', reports_router, tags=['Reportes'])   # -> /api/reports/...
```

Archivos nuevos en el app `orders` (reutiliza sus modelos sin inflar los
archivos existentes):

```
orders/
├── models.py            # (existente) LaundryOrder, OrderItem, MissingItemResolution, OrderStatusHistory
├── report_schemas.py    # (nuevo) Schemas de salida de reportes
├── report_services.py   # (nuevo) Lógica de agregación (funciones puras)
└── report_api.py        # (nuevo) Router -> se monta en /api/reports
```

Auth idéntica al resto: `Router(auth=JWTAuth())` + `@require_roles(User.Role.SUPERVISOR)`
en cada ruta (el rol `ADMIN` pasa siempre, ver `authentication/permissions.py`).
**No** exponer a apps de faena.

> El reporte de facturación (`/api/orders/reports/billing`) se retiró junto con
> el estado `COBRADA`: el cobro pasó a ser un proceso fuera del sistema.

---

## 2. Filtros comunes

Query params planos (mismo estilo que `list_orders` en `orders/api.py`; **no** se
usa `FilterSchema`). El filtro primario es **empresa** — la faena **no** es una
entidad del modelo (solo existe como `SiteScan` y `Company.reference_prefix`), así
que no se filtra por faena.

| Param | Tipo | Notas |
|---|---|---|
| `date_from` | `date \| None` | Filtra por `received_at` salvo que el endpoint indique otra columna. |
| `date_to` | `date \| None` | Inclusive (se traduce a `< date_to + 1 día`). |
| `company_id` | `int \| None` | **Filtro primario.** `LaundryOrder.company_id`. |
| `worker_id` | `int \| None` | Opcional. |
| `delivery_flow` | `str \| None` | `FLUJO_1` / `FLUJO_2`. Vive en `Company`, así que se filtra por `company__delivery_flow` (no hay campo en `LaundryOrder`). |

Se centralizan en un helper de `report_services.py`:

```python
# report_services.py
from datetime import date, timedelta
from django.db.models import QuerySet
from orders.models import LaundryOrder

def apply_filters(qs: QuerySet, *, date_from: date | None, date_to: date | None,
                  company_id: int | None, worker_id: int | None,
                  delivery_flow: str | None, date_field: str = 'received_at') -> QuerySet:
    if date_from:
        qs = qs.filter(**{f'{date_field}__date__gte': date_from})
    if date_to:
        qs = qs.filter(**{f'{date_field}__date__lte': date_to})
    if company_id:
        qs = qs.filter(company_id=company_id)
    if worker_id:
        qs = qs.filter(worker_id=worker_id)
    if delivery_flow:
        qs = qs.filter(company__delivery_flow=delivery_flow)
    return qs
```

---

## 3. Detección de "atascadas" sin migración de esquema

El modelo **ya trae timestamps por etapa**, así que NO hace falta añadir un
`status_changed_at`. Cada estado con relevancia de "atasco" se mide contra su
timestamp real:

| Estado | Timestamp de entrada | ¿Existe/indexado? |
|---|---|---|
| `RECIBIDA` | `received_at` | ✅ (índice compuesto `status, received_at`) |
| `INCOMPLETA` | `incomplete_at` | ✅ campo; **añadir índice** |
| `COMPLETADA` | `completed_at` | ✅ campo; **añadir índice** |
| `EN_REVISION` | `updated_at` (proxy) | ✅ indexado (`TimeStampedModel`). No hay `en_revision_at`; el estado es transitorio y auto-decidido, así que `updated_at` es un proxy aceptable. |

### Índices a añadir (una sola migración, sin columnas nuevas)

```python
# LaundryOrder.Meta.indexes  (ya existen: ['status','received_at'] y ['company','status'])
models.Index(fields=['incomplete_at']),
models.Index(fields=['completed_at']),
models.Index(fields=['delivered_at']),       # timeseries de entrega
# MissingItemResolution.Meta.indexes
models.Index(fields=['resolved_at']),
models.Index(fields=['resolution_type']),
```

Umbrales de atasco (horas en el estado; configurables, defaults):

```python
# report_services.py
STALL_THRESHOLDS_H = {'RECIBIDA': 72, 'EN_REVISION': 48, 'INCOMPLETA': 48}
STALL_TIMESTAMP    = {'RECIBIDA': 'received_at', 'EN_REVISION': 'updated_at',
                      'INCOMPLETA': 'incomplete_at'}
# WIP = trabajo ACTIVO en planta. COMPLETADA queda FUERA: significa "producida y
# despachada" (ya salió de planta), no trabajo pendiente. Incluirla inflaba el
# WIP con las ~210k guías históricas ya terminadas (bug: 210k "en proceso" y
# "atascadas"). La entrega (COMPLETADA -> ENTREGADA) se registra aparte.
IN_PLANT_STATUSES = ('RECIBIDA', 'EN_REVISION', 'INCOMPLETA')
```

**`state_since` con fallback.** El atasco y el aging se miden contra un
`state_since` anotado (`Case/When` por estado, `Coalesce(<ts>, received_at)`): el
legado dejó `incomplete_at` nulo en muchas guías INCOMPLETA, y sin fallback
quedaban fuera del cálculo.

---

# DASHBOARD 1 — Torre de Control Operacional

## 1.1 `GET /api/reports/operations/summary`

Alimenta las **tarjetas KPI** (flujo + foto de planta), el **gráfico de aging** y
el **embudo de estados**. Es el que el front pollea cada 15–30 s (cacheado 10 s).

Separa dos conceptos que NO deben mezclarse (la lección del rediseño):

- **FLUJO** — ritmo sobre una ventana (`date_from`/`date_to`, default últimos 30
  días): ingresadas (`received_at`), producidas (`completed_at`), turnaround
  recepción→producción, tasa de incompletos. Con Δ% vs. período anterior.
- **STOCK / foto de planta** — instantánea AHORA, sin ventana de fecha: WIP en
  planta (`IN_PLANT_STATUSES`), atascadas, incompletos abiertos, aging por
  tramos. No se acota por fecha para no ocultar guías viejas estancadas.

> El turnaround (recepción→producción) es el KPI estrella y está bien poblado
> (`completed_at` en ~99,8% de las guías; mediana real ~5 d). `promised_at` (SLA)
> y `delivered_at` reciente están casi vacíos en el dataset legado, así que NO se
> usan como métricas de cabecera (por eso se retiraron `at_risk_count` y la
> columna "entrega prometida").

### Response — `OperationsSummaryOut`

```python
# report_schemas.py
class StatusCount(Schema):
    status: str            # RECIBIDA | EN_REVISION | INCOMPLETA | COMPLETADA | ENTREGADA
    count: int

class AgingBucket(Schema):
    label: str             # "0-1d" | "1-2d" | "2-4d" | "4-7d" | "7d+"
    count: int

class OperationsSummaryOut(Schema):
    generated_at: datetime
    period_days: int                       # largo de la ventana de flujo
    # Flujo del período
    received: int
    produced: int                          # completadas en la ventana
    received_delta_pct: float | None       # Δ% vs período anterior comparable
    produced_delta_pct: float | None
    incomplete: int                        # incidencias surgidas en la ventana
    incomplete_rate: float
    # Turnaround recepción -> producción (guías producidas en la ventana)
    tat_p50_days: float
    tat_p90_days: float
    tat_target_days: int                   # meta de servicio (TAT_TARGET_DAYS)
    tat_on_target_pct: float
    # Foto de planta AHORA
    in_plant: int                          # WIP activo (IN_PLANT_STATUSES)
    in_plant_by_status: list[StatusCount]
    open_incomplete: int
    stalled_count: int
    oldest_in_plant_days: float
    aging: list[AgingBucket]
    by_status: list[StatusCount]           # distribución completa (contexto)
```

Detalles de implementación (ver `report_services._compute_operations_summary`):

- **Turnaround** por percentiles en Python sobre las duraciones acotadas por la
  ventana (`completed_at - received_at`): más portable que `PERCENTILE_CONT` y el
  volumen por ventana es pequeño. `tat_on_target_pct` = % dentro de
  `TAT_TARGET_DAYS`.
- **Aging** desde `state_since` (ver §3), repartido en `AGING_BUCKETS_DAYS`.
  Reemplaza a la antigüedad media (un puñado de guías zombi del archivo la
  disparaba a miles de días).
- **Δ%** compara contra la ventana previa del mismo largo.

---

## 1.2 `GET /api/reports/operations/stalled`

Alimenta la **tabla de excepciones** (guías accionables). Paginada con el
`@paginate` estándar del proyecto (devuelve `List[...]`, la paginación la envuelve
el decorador — mismo patrón que `list_orders`).

### Response — `List[StalledOrderOut]`

```python
class StalledOrderOut(Schema):
    id: int
    order_number: str | None
    reference: str
    company_name: str          # resuelto de company.name
    worker_name: str           # resuelto de worker.full_name
    status: str
    since: datetime | None     # state_since (entrada al estado, con fallback)
    age_hours: float           # horas en el estado actual
    threshold_hours: int       # umbral de su estado
```

### Servicio

```python
def get_stalled_orders(**filters) -> QuerySet:
    # Solo trabajo activo en planta: una COMPLETADA ya salió de planta, no se
    # "atasca". Así la tabla queda accionable (decenas), no inundada por el archivo.
    qs = annotate_state_since(
        apply_filters(LaundryOrder.objects.all(), **filters).filter(status__in=IN_PLANT_STATUSES)
    )
    return (qs.filter(_stalled_q(timezone.now()))
              .select_related('company', 'worker')      # evita N+1 en *_name
              .order_by('state_since'))                 # las más atascadas primero
```

---

## 1.3 `GET /api/reports/operations/timeseries`

Alimenta la **línea de ingreso vs. producción diaria**. Se muestran `received` y
`produced` (las dos series con volumen real); `delivered` viaja en el payload
pero hoy es ~0 (la entrega no se registra aún), así que el front no la dibuja.

### Response — `TimeseriesOut`

```python
class TimeseriesPoint(Schema):
    date: str          # YYYY-MM-DD (inicio del bucket)
    received: int      # guías con received_at en el bucket (ingresadas)
    produced: int      # guías con completed_at en el bucket (producidas)
    delivered: int     # guías con delivered_at en el bucket (~0 hoy)

class TimeseriesOut(Schema):
    granularity: str   # 'day' | 'week'
    points: list[TimeseriesPoint]
```

**Nota técnica:** `received` y `delivered` cuentan sobre columnas de fecha
distintas ⇒ son **dos agregaciones** (`TruncDate('received_at')` y
`TruncDate('delivered_at')`) que se fusionan por fecha en Python. No forzar un
solo `GROUP BY` sobre dos fechas. Cachear en Redis (TTL 120 s) por clave de
filtros.

---

# DASHBOARD 3 — Calidad e Incidencias

Base: guías que pasaron por `INCOMPLETA` (`incomplete_at IS NOT NULL`) y las filas
de `MissingItemResolution` (FK **directo** a `order`,
`related_name='missing_item_resolutions'`). El rango de fechas filtra por
`incomplete_at` (cuándo ocurrió la incidencia).

## 3.1 `GET /api/reports/quality/summary`

### Response — `QualitySummaryOut`

```python
class ResolutionMix(Schema):
    encontrada: int          # resolution_type = ENCONTRADA
    comprada: int            # resolution_type = COMPRADA

class QualitySummaryOut(Schema):
    generated_at: str
    total_orders: int                 # guías digitalizadas en el período (denominador)
    incomplete_orders: int            # guías que pasaron por INCOMPLETA
    incomplete_rate: float            # incomplete_orders / total_orders (0..1)
    open_incomplete: int              # aún en estado INCOMPLETA (sin resolver)
    discrepancy_rate: float           # guías con observations != '' / total_orders
    resolution_mix: ResolutionMix
    purchase_cost_total: float        # Σ purchase_cost de COMPRADA (costo interno de reposición)
    avg_resolution_hours: float       # media completed_at - incomplete_at
```

### Servicio (puntos clave)

```python
from django.db.models import Sum
from orders.models import MissingItemResolution

def get_quality_summary(**filters) -> dict:
    now = datetime.now(timezone.utc)
    # total_orders: universo de guías digitalizadas del período (filtra por received_at).
    orders = apply_filters(LaundryOrder.objects.all(), **filters)
    # incidencias: subconjunto que se volvió incompleto (mismo filtro de empresa, fecha por incomplete_at).
    incidents = apply_filters(
        LaundryOrder.objects.filter(incomplete_at__isnull=False),
        **{**filters, 'date_field': 'incomplete_at'}
    )

    total = orders.count()
    incomplete = incidents.count()

    res = MissingItemResolution.objects.filter(order__in=incidents)   # FK directo -> order
    mix = dict(res.values_list('resolution_type').annotate(c=Count('id')).values_list('resolution_type', 'c'))
    purchase_cost = res.filter(resolution_type=MissingItemResolution.ResolutionType.PURCHASED) \
                       .aggregate(s=Sum('purchase_cost'))['s'] or 0
    avg_res = incidents.filter(completed_at__isnull=False) \
                       .aggregate(d=Avg(F('completed_at') - F('incomplete_at')))['d']

    return {
        'generated_at': now.isoformat(),
        'total_orders': total,
        'incomplete_orders': incomplete,
        'incomplete_rate': round(incomplete / total, 4) if total else 0.0,
        'open_incomplete': incidents.filter(status='INCOMPLETA').count(),
        'discrepancy_rate': round(orders.exclude(observations='').count() / total, 4) if total else 0.0,
        'resolution_mix': {'encontrada': mix.get('ENCONTRADA', 0), 'comprada': mix.get('COMPRADA', 0)},
        'purchase_cost_total': float(purchase_cost),
        'avg_resolution_hours': round(avg_res.total_seconds() / 3600, 1) if avg_res else 0.0,
    }
```

## 3.2 `GET /api/reports/quality/garment-pareto`

Alimenta el **Pareto** de prendas más problemáticas (barras + línea acumulada).

### Response — `GarmentParetoOut`

```python
class GarmentParetoRow(Schema):
    name: str                 # display_name de la prenda (garment_type.name o custom_name del item)
    incident_count: int       # nº de resoluciones que involucran esta prenda
    cumulative_pct: float     # % acumulado (para la línea del Pareto)

class GarmentParetoOut(Schema):
    total_incidents: int
    rows: list[GarmentParetoRow]   # ordenadas desc por incident_count
```

Agrupa `MissingItemResolution` por la prenda (`item__garment_type__name`, con
fallback a `item__custom_name`). El `cumulative_pct` se calcula en Python tras el
`ORDER BY count DESC`. `select_related('item', 'item__garment_type')` para el
nombre.

## 3.3 `GET /api/reports/quality/incidents`

Tabla detallada de incidencias, paginada (`@paginate`). Filtros comunes +
`resolution_type` (`ENCONTRADA` | `COMPRADA` | `OPEN`).

### Response — `List[IncidentOut]`

```python
class IncidentOut(Schema):
    order_id: int
    order_number: str
    reference: str
    company_name: str
    worker_name: str
    status: str
    incomplete_at: str
    completed_at: str | None
    age_hours: float | None                    # abierta: ahora - incomplete_at
    resolutions: list[MissingItemResolutionOut]   # reutiliza el schema existente de orders/schemas.py
    observations: str
```

Servicio con `select_related('company', 'worker')` y
`prefetch_related('missing_item_resolutions')` para evitar N+1 al listar las
prendas de cada incidencia.

---

## 4. Router (`report_api.py`)

Solo enruta y delega — nada de lógica aquí.

```python
from datetime import date
from typing import List

from ninja import Router
from ninja.pagination import paginate

from authentication.auth import JWTAuth
from authentication.models import User
from authentication.permissions import require_roles
from orders import report_services as svc
from orders.report_schemas import (
    OperationsSummaryOut, StalledOrderOut, TimeseriesOut,
    QualitySummaryOut, GarmentParetoOut, IncidentOut,
)

router = Router(auth=JWTAuth())

# Filtros comunes repetidos como params; se agrupan en un dict para el service.
def _filters(company_id=None, worker_id=None, date_from=None, date_to=None, delivery_flow=None):
    return dict(company_id=company_id, worker_id=worker_id,
                date_from=date_from, date_to=date_to, delivery_flow=delivery_flow)


@router.get('/operations/summary', response=OperationsSummaryOut)
@require_roles(User.Role.SUPERVISOR)
def operations_summary(request, company_id: int | None = None, worker_id: int | None = None,
                       date_from: date | None = None, date_to: date | None = None,
                       delivery_flow: str | None = None):
    return svc.get_operations_summary(**_filters(company_id, worker_id, date_from, date_to, delivery_flow))


@router.get('/operations/stalled', response=List[StalledOrderOut])
@require_roles(User.Role.SUPERVISOR)
@paginate
def operations_stalled(request, company_id: int | None = None, worker_id: int | None = None,
                       date_from: date | None = None, date_to: date | None = None,
                       delivery_flow: str | None = None):
    return svc.get_stalled_orders(**_filters(company_id, worker_id, date_from, date_to, delivery_flow))


@router.get('/operations/timeseries', response=TimeseriesOut)
@require_roles(User.Role.SUPERVISOR)
def operations_timeseries(request, granularity: str = 'day', company_id: int | None = None,
                          worker_id: int | None = None, date_from: date | None = None,
                          date_to: date | None = None, delivery_flow: str | None = None):
    return svc.get_timeseries(granularity, **_filters(company_id, worker_id, date_from, date_to, delivery_flow))


@router.get('/quality/summary', response=QualitySummaryOut)
@require_roles(User.Role.SUPERVISOR)
def quality_summary(request, company_id: int | None = None, worker_id: int | None = None,
                    date_from: date | None = None, date_to: date | None = None,
                    delivery_flow: str | None = None):
    return svc.get_quality_summary(**_filters(company_id, worker_id, date_from, date_to, delivery_flow))


@router.get('/quality/garment-pareto', response=GarmentParetoOut)
@require_roles(User.Role.SUPERVISOR)
def quality_pareto(request, company_id: int | None = None, worker_id: int | None = None,
                   date_from: date | None = None, date_to: date | None = None,
                   delivery_flow: str | None = None):
    return svc.get_garment_pareto(**_filters(company_id, worker_id, date_from, date_to, delivery_flow))


@router.get('/quality/incidents', response=List[IncidentOut])
@require_roles(User.Role.SUPERVISOR)
@paginate
def quality_incidents(request, resolution_type: str | None = None, company_id: int | None = None,
                      worker_id: int | None = None, date_from: date | None = None,
                      date_to: date | None = None, delivery_flow: str | None = None):
    return svc.get_incidents(resolution_type, **_filters(company_id, worker_id, date_from, date_to, delivery_flow))
```

---

## 5. Resumen de endpoints

| Método | Ruta | Dashboard | Polling | Caché |
|---|---|---|---|---|
| GET | `/api/reports/operations/summary` | 1 · KPIs + embudo | 15–30 s | no / 10 s |
| GET | `/api/reports/operations/stalled` | 1 · tabla excepciones | 15–30 s | no |
| GET | `/api/reports/operations/timeseries` | 1 · línea ingreso/entrega | 1–5 min | Redis 120 s |
| GET | `/api/reports/quality/summary` | 3 · KPIs calidad | 1–5 min | Redis 120 s |
| GET | `/api/reports/quality/garment-pareto` | 3 · Pareto prendas | 1–5 min | Redis 300 s |
| GET | `/api/reports/quality/incidents` | 3 · tabla incidencias | 15–30 s | no |

Todos filtran por **empresa** (`company_id`) como dimensión principal; la faena no
es filtrable porque no existe como entidad en el modelo.

## 6. Checklist de implementación backend

- [ ] Migración: índices de §3 (`incomplete_at`, `completed_at`, `delivered_at`, `resolved_at`, `resolution_type`). **Sin columnas nuevas.**
- [ ] `orders/report_schemas.py`, `orders/report_services.py`, `orders/report_api.py`.
- [ ] Montar `reports_router` en `core/api.py` bajo `/reports/` con tag `Reportes`.
- [ ] `@require_roles(User.Role.SUPERVISOR)` en cada ruta (ADMIN pasa por `permissions.py`).
- [ ] Tests de agregación con dataset de ~1k guías; verificar con `EXPLAIN` que usan los índices.
- [ ] (Opcional) Definir constante de umbrales de atasco en settings para ajustarlos sin deploy.
- [ ] Capa de caché Redis en `timeseries` / `quality/*` (no implementada aún; §0).
- [ ] Commit de los cambios en `servilion-backend`.

---

## 7. Caveats de datos legados (observados al verificar contra la BD real)

Las agregaciones son correctas; estos números "raros" vienen de los ~283k
registros **importados del Access legado**, no de bugs. En operación normal
(guías nuevas + filtro por fecha reciente) se comportan bien:

- **`incomplete_at` no fue rellenado en la migración legada.** Por eso
  `incomplete_orders`, `incomplete_rate`, `resolution_mix`, `purchase_cost_total`
  y `avg_resolution_hours` solo reflejan incidencias **posteriores a la
  migración** (las guías nuevas sí lo fijan vía `finish_packing`). Para incluir el
  histórico habría que hacer un backfill de `incomplete_at`.
- **`open_incomplete` se cuenta por estado (`status=INCOMPLETA`), no por
  `incomplete_at`**, justo para ser robusto a lo anterior: refleja las 499 guías
  realmente incompletas hoy, no 0.
- **`stalled_count` / WIP ya NO se inflan con el archivo.** COMPLETADA salió de
  `IN_PLANT_STATUSES` (ya está "producida y despachada", no es trabajo en curso),
  así que el WIP en planta baja de ~210k a ~630 y las atascadas a decenas — reales
  y accionables. La antigüedad media (dominada por guías zombi de años atrás) se
  reemplazó por el **aging por tramos** y `oldest_in_plant_days`.
- **`discrepancy_rate = 1.0`**: el import dejó `observations` no vacío en todas
  las guías legadas. Solo afecta al histórico.
