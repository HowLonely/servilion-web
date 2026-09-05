import { describe, expect, it, vi } from "vitest";

import { applyServerErrors, parseApiError } from "./errors";

describe("API error helpers", () => {
  it("preserves structured backend errors and provides a safe fallback", () => {
    const backendError = { detail: "Datos inválidos", errors: [{ loc: ["body", "name"], msg: "Requerido" }] };
    expect(parseApiError(backendError)).toBe(backendError);
    expect(parseApiError(new Error("network"))).toEqual({
      detail: "Ocurrió un error inesperado. Intenta nuevamente.",
    });
  });

  it("maps backend validation locations to form fields", () => {
    const setError = vi.fn();
    applyServerErrors(
      { detail: "Datos inválidos", errors: [{ loc: ["body", "payload", "name"], msg: "Requerido" }] },
      setError,
    );
    expect(setError).toHaveBeenCalledWith("name", { message: "Requerido" });
  });
});