"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import axios from "axios";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ModeToggle } from "@/components/ModeToggle";

const navLinks = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Contact",
    href: "/#lead-form",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: number; name?: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/auth/me")
      .then((res) => {
        if (res.data?.data?.user) setUser(res.data.data.user);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/70">
      <nav
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="LeadNexa home"
        >
          <Image
            src="/Images/Logo/logo_light.svg"
            alt="LeadNexa"
            width={300}
            height={72}
            priority
            className="block h-10 w-auto dark:hidden sm:h-11"
          />

          <Image
            src="/Images/Logo/logo_dark.svg"
            alt="LeadNexa"
            width={300}
            height={72}
            priority
            className="hidden h-10 w-auto dark:block sm:h-11"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.name}

                {active && (
                  <span
                    className="absolute inset-x-3 -bottom-3.25 h-0.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Actions & Mobile Menu */}
        <div className="flex items-center gap-3">
          <ModeToggle />
          
          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {!isLoading && user ? (
              <>
                <span className="text-sm font-medium text-muted-foreground mr-2">
                  Hi, {user.name}
                </span>
                <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
                  Dashboard
                </Link>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </>
            ) : !isLoading && !user ? (
              <>
                <Link href="/login" className={buttonVariants()}>
                  Log in
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center md:hidden">
            <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>

            <SheetContent side="right" className="w-75 sm:w-85">
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="text-left">
                  <Link href="/" aria-label="LeadNexa home">
                    <Image
                      src="/Images/Logo/logo_light.svg"
                      alt="LeadNexa"
                      width={220}
                      height={54}
                      className="block h-10 w-auto dark:hidden"
                    />

                    <Image
                      src="/Images/Logo/logo_dark.svg"
                      alt="LeadNexa"
                      width={220}
                      height={54}
                      className="hidden h-10 w-auto dark:block"
                    />
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <div className="flex h-full flex-col py-6">
                {/* Mobile Navigation Links */}
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => {
                    const active = isActive(link.href);

                    return (
                      <SheetClose
                        key={link.name}
                        nativeButton={false}
                        render={
                          <Link
                            href={link.href}
                            className={cn(
                              "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                              "hover:bg-muted",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          />
                        }
                      >
                        {link.name}
                      </SheetClose>
                    );
                  })}
                </div>

                {/* Mobile Actions */}
                <div className="mt-8 flex flex-col gap-3 border-t pt-6">
                  {!isLoading && user ? (
                    <>
                      <SheetClose
                        nativeButton={false}
                        render={
                          <Link
                            href="/dashboard"
                            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                          />
                        }
                      >
                        Dashboard
                      </SheetClose>

                      <Button variant="destructive" onClick={handleLogout} className="w-full gap-2">
                        <LogOut className="size-4" />
                        Log out
                      </Button>
                    </>
                  ) : !isLoading && !user ? (
                    <>
                      <SheetClose
                        nativeButton={false}
                        render={
                          <Link
                            href="/login"
                            className={cn(buttonVariants(), "w-full")}
                          />
                        }
                      >
                        Log in
                      </SheetClose>
                    </>
                  ) : null}
                </div>

                {/* Small Product Message */}
                <div className="mt-auto rounded-xl border bg-muted/40 p-4">
                  <p className="text-sm font-semibold">
                    Capture. Manage. Convert.
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    LeadNexa helps sales teams capture leads, manage
                    opportunities, and track every interaction in one place.
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}