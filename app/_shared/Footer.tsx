
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  ArrowUpRight,
  Heart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const productLinks = [
  {
    name: "Lead Capture",
    href: "/#lead-form",
  },
  {
    name: "Dashboard",
    href: "/login",
  },
];

const companyLinks = [
  {
    name: "Contact",
    href: "/#lead-form",
  },
];

const quickLinks = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Login",
    href: "/login",
  },
  {
    name: "Get Started",
    href: "/#lead-form",
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t bg-background">
      {/* Background Decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="absolute -right-32 top-0 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ====================== */}
        {/* MAIN FOOTER */}
        {/* ====================== */}

        <div className="flex flex-col gap-12 py-12 md:py-16 lg:flex-row lg:justify-between lg:gap-16">
          {/* Brand Section */}
          <div className="flex max-w-md flex-col items-start">
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="LeadNexa home"
            >
              {/* Light Logo */}
              <Image
                src="/Images/Logo/logo_light.svg"
                alt="LeadNexa"
                width={300}
                height={72}
                className="block h-11 w-auto dark:hidden"
              />

              {/* Dark Logo */}
              <Image
                src="/Images/Logo/logo_dark.svg"
                alt="LeadNexa"
                width={300}
                height={72}
                className="hidden h-11 w-auto dark:block"
              />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              A modern lead management platform designed to help sales teams
              capture, assign, manage, and convert leads efficiently.
            </p>

            <p className="mt-4 text-sm font-semibold">
              Capture. Manage. Convert.
            </p>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                asChild
              >
                <Link
                  href="/#lead-form"
                  aria-label="Contact LeadNexa"
                >
                  <Mail className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-1 flex-wrap gap-10 sm:gap-16 lg:max-w-2xl lg:justify-end">
            {/* Product */}
            <FooterColumn
              title="Product"
              links={productLinks}
            />

            {/* Company */}
            <FooterColumn
              title="Company"
              links={companyLinks}
            />

            {/* Quick Links */}
            <FooterColumn
              title="Quick Links"
              links={quickLinks}
            />
          </div>
        </div>

        <Separator />

        {/* ====================== */}
        {/* DIGITAL HEROES CREDIT */}
        {/* ====================== */}

        <div className="flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            Built for{" "}
            <a
              href="https://digitalheroesco.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
            >
              Digital Heroes Training Task
              <ArrowUpRight className="size-3" />
            </a>
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Powered by</span>

            <span className="font-medium text-foreground">
              Next.js
            </span>

            <span>•</span>

            <span className="font-medium text-foreground">
              Neon
            </span>

            <span>•</span>

            <span className="font-medium text-foreground">
              Drizzle
            </span>
          </div>
        </div>

        <Separator />

        {/* ====================== */}
        {/* COPYRIGHT */}
        {/* ====================== */}

        <div className="flex flex-col items-center justify-between gap-3 py-5 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {currentYear} LeadNexa. All rights reserved.
          </p>

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Designed & built with
            <Heart className="size-3.5 fill-red-500 text-red-500" />
            for modern sales teams.
          </p>
        </div>
      </div>
    </footer>
  );
}

interface FooterLink {
  name: string;
  href: string;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

function FooterColumn({
  title,
  links,
}: FooterColumnProps) {
  return (
    <div className="flex min-w-30 flex-col">
      <h3 className="text-sm font-semibold">
        {title}
      </h3>

      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}