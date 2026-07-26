"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import axios from "axios";
import toast from "react-hot-toast";

type Role = "ADMIN" | "MEMBER";

interface SidebarProps {
  role: Role;
  className?: string;
}

const adminLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: FileText },
];

const memberLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "My Leads", icon: FileText },
];

export function Sidebar({ role, className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "ADMIN" ? adminLinks : memberLinks;

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  const renderNavLinks = (onClick?: () => void) => (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-1 py-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="py-4 border-t border-border mt-auto">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className={cn("hidden md:flex flex-col w-64 border-r border-border bg-card px-4", className)}>
        <div className="h-14 flex items-center border-b border-border mb-2">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs">LN</span>
            </div>
            LeadNexa
          </Link>
        </div>
        {renderNavLinks()}
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden flex h-14 items-center border-b border-border bg-card px-4 fixed top-0 w-full z-30">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4 flex flex-col">
            <div className="h-10 flex items-center mb-2">
              <span className="font-bold text-lg">LeadNexa</span>
            </div>
            {renderNavLinks()}
          </SheetContent>
        </Sheet>
        <span className="font-bold text-lg ml-2">LeadNexa</span>
      </div>
    </>
  );
}
