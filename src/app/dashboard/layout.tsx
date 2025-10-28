import RequireAuth from "@/components/auth/RequireAuth";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <ProtectedLayout>{children}</ProtectedLayout>
    </RequireAuth>
  );
}