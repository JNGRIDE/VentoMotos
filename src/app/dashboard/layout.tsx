"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Bike,
  PanelLeft,
  Users,
  Settings,
  Package,
  LoaderCircle,
  BadgeDollarSign,
  FileSignature,
  Search,
  Bell,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserNav } from "@/components/user-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { useUser } from "@/firebase/auth/use-user";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/sales", icon: BadgeDollarSign, label: "Sales" },
  { href: "/dashboard/inventory", icon: Package, label: "Inventory" },
  { href: "/dashboard/prospects", icon: Users, label: "Prospects" },
  { href: "/dashboard/reports", icon: FileText, label: "Reports" },
  { href: "/dashboard/editables", icon: FileSignature, label: "Editables" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-medium">Cargando su espacio...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        {/* Modern Sidebar estilo Apple */}
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-20 flex-col items-center border-r border-border/40 bg-white/80 backdrop-blur-xl sm:flex print:hidden">
          <nav className="flex flex-col items-center gap-6 px-2 py-8">
            <Link
              href="/dashboard"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105"
            >
              <Bike className="h-6 w-6" />
            </Link>
            
            <div className="flex flex-col gap-4 pt-4">
              {navItems.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                        pathname === item.href
                          ? "bg-secondary text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="rounded-xl border-none shadow-premium bg-foreground text-background">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </nav>
          
          <div className="mt-auto pb-8 flex flex-col items-center gap-4">
             <ModeToggle />
             <UserNav user={user} />
          </div>
        </aside>

        <div className="flex flex-1 flex-col sm:pl-20">
          <header className="sticky top-0 z-30 flex h-20 items-center gap-4 px-6 bg-background/80 backdrop-blur-md border-b border-border/10 print:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="sm:hidden rounded-2xl">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs rounded-r-3xl">
                <nav className="grid gap-6 text-lg font-medium pt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-4 px-4 py-2 rounded-2xl transition-colors ${
                          pathname === item.href
                            ? "bg-secondary text-primary"
                            : "text-muted-foreground hover:bg-secondary/50"
                        }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <div className="relative flex-1 max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search anything..." 
                className="pl-10 h-11 bg-secondary/50 border-none rounded-2xl focus-visible:ring-primary/20"
              />
            </div>

            <div className="ml-auto flex items-center gap-4">
               <Button variant="ghost" size="icon" className="rounded-full relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background"></span>
               </Button>
               <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-sm font-semibold leading-none">{user.displayName}</span>
                  <span className="text-xs text-muted-foreground">Admin Access</span>
               </div>
            </div>
          </header>

          <main className="flex-1 p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
