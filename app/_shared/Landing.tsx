"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const pipeline = [
  {
    title: "New",
    value: 24,
  },
  {
    title: "Contacted",
    value: 18,
  },
  {
    title: "Qualified",
    value: 12,
  },
  {
    title: "Won",
    value: 8,
  },
];

const recentLeads = [
  {
    name: "Olivia Martin",
    company: "Northstar Labs",
    initials: "OM",
    status: "Qualified",
  },
  {
    name: "Daniel Wilson",
    company: "Vertex Studio",
    initials: "DW",
    status: "Contacted",
  },
  {
    name: "Sophia Clark",
    company: "Nova Commerce",
    initials: "SC",
    status: "New",
  },
];

export default function LandingScreen() {
  return (
    <section className="relative overflow-hidden border-b bg-background">
      {/* Background Decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Dynamic Gradients for Light and Dark Modes */}
        <div className="absolute inset-0 bg-linear-to-b from-blue-50/80 via-background to-background dark:from-slate-950 dark:via-background dark:to-background" />
        
        {/* Animated Glowing Orbs */}
        <div className="absolute left-1/2 -top-80 h-160 w-160 -translate-x-1/2 rounded-full bg-primary/20 mix-blend-multiply blur-[128px] dark:bg-primary/10 dark:mix-blend-screen" />
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-blue-400/30 mix-blend-multiply blur-[128px] animate-pulse dark:bg-blue-600/20 dark:mix-blend-screen" />
        <div className="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-violet-400/30 mix-blend-multiply blur-[128px] animate-pulse dark:bg-violet-600/20 dark:mix-blend-screen" style={{ animationDelay: "1s" }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col items-center justify-center gap-14 px-4 py-16 sm:px-6 md:py-20 lg:flex-row lg:gap-12 lg:px-8 lg:py-24">
        {/* ====================== */}
        {/* LEFT SIDE */}
        {/* ====================== */}

        <div className="flex w-full flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 shadow-sm backdrop-blur-md transition-colors hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/10 dark:hover:bg-primary/20"
          >
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-medium text-primary sm:text-sm">
              Smarter Lead Management for Modern Teams
            </span>
          </Badge>

          {/* Heading */}
          <h1 className="max-w-3xl text-balance text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-7xl">
            Turn every lead into a{" "}
            <span className="bg-linear-to-r from-blue-600 via-primary to-violet-600 bg-clip-text text-transparent drop-shadow-sm dark:from-blue-400 dark:via-primary dark:to-violet-400">
              real opportunity.
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            LeadNexa gives your sales team one organized workspace to capture,
            assign, manage, and track leads throughout their entire journey —
            from first contact to conversion.
          </p>

          {/* CTA */}
          <div className="mt-8 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row lg:items-start">
            <Button
              size="lg"
              className="group relative h-14 w-full overflow-hidden rounded-full px-8 text-base font-semibold shadow-xl shadow-primary/25 transition-all hover:shadow-primary/40 sm:w-auto"
              asChild
            >
              <Link href="#lead-form">
                <span className="relative z-10 flex items-center">
                  Get Started
                  <ArrowRight className="ml-2 size-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -z-10 bg-linear-to-r from-primary via-blue-600 to-primary bg-size-[200%_auto] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-gradient" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="group h-14 w-full rounded-full border-2 bg-background/50 px-8 text-base font-medium backdrop-blur-md transition-all hover:bg-muted/50 sm:w-auto"
              asChild
            >
              <Link href="/login">
                Sign in to Dashboard
              </Link>
            </Button>
          </div>

          {/* Trust Row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground lg:justify-start">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Easy lead capture
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-blue-500" />
              Role-based access
            </div>

            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-violet-500" />
              Full activity history
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-10 flex w-full max-w-xl flex-wrap items-center justify-center gap-4 border-t pt-6 sm:justify-between lg:justify-start lg:gap-10">
            <div>
              <p className="text-2xl font-bold sm:text-3xl">
                62+
              </p>

              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Active leads
              </p>
            </div>

            <div className="h-10 w-px bg-border" />

            <div>
              <p className="text-2xl font-bold sm:text-3xl">
                32%
              </p>

              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Conversion rate
              </p>
            </div>

            <div className="hidden h-10 w-px bg-border sm:block" />

            <div>
              <p className="text-2xl font-bold sm:text-3xl">
                12
              </p>

              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Qualified today
              </p>
            </div>
          </div>
        </div>

        {/* ====================== */}
        {/* RIGHT SIDE / DASHBOARD */}
        {/* ====================== */}

        <div className="relative flex w-full flex-1 items-center justify-center lg:pl-10">
          {/* Glow */}
          <div className="absolute h-[85%] w-[85%] rounded-full bg-primary/20 blur-[120px] dark:bg-primary/15" />

          {/* Dashboard Mockup */}
          <Card className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-background/80 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-background/50 dark:shadow-black/40">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 via-white/5 to-transparent opacity-50 dark:from-white/10 dark:via-white/5 dark:to-transparent" />
            
            {/* Top Browser Bar */}
            <div className="relative flex h-12 items-center justify-between border-b border-border/50 bg-muted/40 px-4 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-400/90 shadow-sm" />
                <span className="size-3 rounded-full bg-yellow-400/90 shadow-sm" />
                <span className="size-3 rounded-full bg-green-400/90 shadow-sm" />
              </div>

              <div className="hidden rounded-md border bg-background px-5 py-1 text-[10px] text-muted-foreground sm:block">
                app.leadnexa.com/dashboard
              </div>

              <div className="size-5" />
            </div>

            <CardContent className="relative p-4 sm:p-6 z-10">
              {/* Header */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-medium text-primary">
                    DASHBOARD
                  </p>

                  <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                    Welcome back, Admin
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Here&apos;s what&apos;s happening with your leads.
                  </p>
                </div>

                <Button
                  size="sm"
                  className="w-fit rounded-lg"
                >
                  + Add Lead
                </Button>
              </div>

              {/* Dashboard Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  icon={<Users className="size-4" />}
                  title="Total"
                  value="62"
                />

                <StatCard
                  icon={<TrendingUp className="size-4" />}
                  title="Qualified"
                  value="12"
                />

                <StatCard
                  icon={<UserRoundCheck className="size-4" />}
                  title="Won"
                  value="8"
                />

                <StatCard
                  icon={<BarChart3 className="size-4" />}
                  title="Rate"
                  value="32%"
                />
              </div>

              {/* Pipeline */}
              <div className="mt-5 rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Lead Pipeline
                    </h3>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Current lead progression
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-[10px]"
                  >
                    This month
                  </Badge>
                </div>

                <div className="mt-5 flex flex-col gap-4">
                  {pipeline.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-3"
                    >
                      <span className="w-16 text-xs text-muted-foreground sm:w-20">
                        {item.title}
                      </span>

                      <div className="flex-1">
                        <Progress
                          value={(item.value / 24) * 100}
                          className="h-2"
                        />
                      </div>

                      <span className="w-5 text-right text-xs font-semibold">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Leads */}
              <div className="mt-5 rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b p-4">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Recent Leads
                    </h3>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Latest activity from your pipeline
                    </p>
                  </div>

                  <button className="text-xs font-medium text-primary hover:underline">
                    View all
                  </button>
                </div>

                <div className="flex flex-col">
                  {recentLeads.map((lead, index) => (
                    <div
                      key={lead.name}
                      className={`flex items-center justify-between gap-3 p-3 sm:p-4 ${
                        index !== recentLeads.length - 1
                          ? "border-b"
                          : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="text-xs font-semibold">
                            {lead.initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold sm:text-sm">
                            {lead.name}
                          </p>

                          <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                            {lead.company}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[9px] sm:text-[10px]"
                      >
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Floating Conversion Card */}
          <div className="absolute -bottom-7 -left-2 hidden rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur sm:flex lg:-left-8 xl:-left-14">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="size-5 text-emerald-500" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Conversion
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    +18.2%
                  </span>

                  <span className="text-[10px] font-medium text-emerald-500">
                    ↑ 4.6%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Assignment Card */}
          <div className="absolute -right-2 top-10 hidden rounded-xl border bg-background/95 p-3 shadow-xl backdrop-blur md:flex lg:-right-6 xl:-right-10">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <UserRoundCheck className="size-4 text-primary" />
              </div>

              <div>
                <p className="text-xs font-semibold">
                  Lead assigned
                </p>

                <p className="text-[10px] text-muted-foreground">
                  Sarah → Piyush
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Trust Strip */}
      <div className="border-t bg-muted/20">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            Everything your team needs to manage leads efficiently.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" />
              Lead Tracking
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" />
              Team Assignment
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" />
              Activity Timeline
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" />
              Secure Access
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

function StatCard({
  icon,
  title,
  value,
}: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>

      <div>
        <p className="text-lg font-bold sm:text-xl">
          {value}
        </p>

        <p className="text-[10px] text-muted-foreground sm:text-xs">
          {title}
        </p>
      </div>
    </div>
  );
}