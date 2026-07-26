"use client";

import Navbar from "../_shared/Navbar";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Navbar */}
      <Navbar />

      {/* Centered Auth Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="flex w-full max-w-md items-center justify-center">
          {children}
        </div>
      </main>

      {/* Minimal Auth Footer */}
      <footer className="flex items-center justify-center px-4 py-5">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LeadNexa. All rights reserved.
        </p>
      </footer>
    </div>
  );

  return content;
}