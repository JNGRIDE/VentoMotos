"use client";

import React, { useEffect, useState } from "react";
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
  LayoutGrid,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserNav } from "@/components/user-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase";
import { getUserProfile } from "@/firebase/services";
import type { UserProfile } from "@/lib/data";

import { Sheet as SheetComp, SheetContent as SheetContentComp, SheetTrigger as SheetTriggerComp } from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/sales", icon: BadgeDollarSign, label: "Ventas" },
  { href: "/dashboard/inventory", icon: Package, label: "Inventario" },
  { href: "/dashboard/prospects", icon: Users, label: "Prospectos" },
  { href: "/dashboard/utilities", icon: LayoutGrid, label: "Centro de Utilidades" },
  { href: "/dashboard/reports", icon: FileText, label: "Reportes" },
  { href: "/dashboard/editables", icon: FileSignature, label: "Editables" },
  { href: "/dashboard/settings", icon: Settings, label: "Configuración" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const db = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      getUserProfile(db, user.uid).then(setProfile);
    }
  }, [user, db]);

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
        {/* Sidebar Flotante Estilo Apple */}
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-24 flex-col items-center py-8 sm:flex print:hidden">
          <nav className="flex flex-col items-center h-full gap-8 px-4 py-6 glass rounded-[40px] shadow-premium transition-all duration-500">
            <Link
              href="/dashboard"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-110 active:scale-95"
            >
              <Bike className="h-7 w-7" />
            </Link>
            
            <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                          isActive
                            ? "bg-primary text-white shadow-lg scale-105"
                            : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
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
                );
              })}
            </div>

            <div className="mt-auto flex flex-col items-center gap-4 pt-4 border-t border-border/10">
               <ModeToggle />
               <UserNav user={user} />
            </div>
          </nav>
        </aside>

        <div className="flex flex-1 flex-col sm:pl-24">
          <header className="sticky top-0 z-30 flex h-20 items-center gap-4 px-8 bg-background/40 backdrop-blur-md print:hidden">
            <SheetComp>
              <SheetTriggerComp asChild>
                <Button size="icon" variant="ghost" className="sm:hidden rounded-2xl h-12 w-12 hover:bg-secondary">
                  <PanelLeft className="h-6 w-6 text-primary" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTriggerComp>
              <SheetContentComp side="left" className="sm:max-w-xs rounded-r-[40px] border-none glass flex flex-col p-6">
                <div className="flex items-center gap-3 py-6 border-b border-border/10 mb-4">
                   <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <Bike className="h-6 w-6 text-white" />
                   </div>
                   <span className="text-xl font-bold font-headline">MotoSales</span>
                </div>
                <nav className="flex-1 space-y-2 py-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                          pathname === item.href
                            ? "bg-primary text-white shadow-lg shadow-primary/20 translate-x-2"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-semibold">{item.label}</span>
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto pt-6 border-t border-border/10 flex items-center justify-between">
                   <ModeToggle />
                   <UserNav user={user} />
                </div>
              </SheetContentComp>
            </SheetComp>

            <div className="relative flex-1 max-w-md hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="Buscar en el ecosistema..." 
                className="pl-11 h-11 bg-secondary/30 border-none rounded-2xl focus-visible:ring-primary/10 transition-all focus:bg-secondary/60"
              />
            </div>

            <div className="ml-auto flex items-center gap-4">
               <Button variant="ghost" size="icon" className="rounded-full relative h-11 w-11 hover:bg-secondary/50 hidden sm:flex transition-all">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full border-2 border-background"></span>
               </Button>
               <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="text-sm font-bold leading-none">{user.displayName}</span>
                  <span className="text-[10px] uppercase tracking-wider text-primary font-bold mt-1">
                    {profile?.role || "Cargando..."}
                  </span>
               </div>
               <div className="sm:hidden">
                  <UserNav user={user} />
               </div>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto no-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
