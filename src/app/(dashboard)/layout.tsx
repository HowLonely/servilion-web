import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthGate } from "@/components/layout/auth-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
            <div className="mx-auto w-full max-w-350">{children}</div>
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
