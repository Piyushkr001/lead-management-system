import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { UserProvider } from "@/components/dashboard/UserProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={user.role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile spacing because of fixed header */}
        <div className="h-14 md:hidden" /> 
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
          <UserProvider initialUser={user}>
            {children}
          </UserProvider>
        </main>
      </div>
    </div>
  );
}
