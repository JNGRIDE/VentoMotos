'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, LoaderCircle, ShieldAlert, Calendar, FileText, TrendingUp, Download } from 'lucide-react';
import { format } from "date-fns";
import { es } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { getSales, getUserProfiles, getUserProfile } from "@/firebase/services";
import type { Sale, UserProfile } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateSprints, getCurrentSprintValue, type Sprint } from '@/lib/sprints';

import { ReportSummary } from '@/components/reports/report-summary';
import { SalesBySalespersonChart } from '@/components/reports/sales-by-salesperson-chart';
import { SalesDetailTable } from '@/components/reports/sales-detail-table';

export default function ReportsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  const reportDate = useMemo(() => {
    if (!selectedSprint) return "";
    const date = new Date(`${selectedSprint}-02`);
    return format(date, "MMMM yyyy", { locale: es });
  }, [selectedSprint]);


  useEffect(() => {
    setSprints(generateSprints());
    setSelectedSprint(getCurrentSprintValue());
  }, []);

  const fetchData = useCallback(async () => {
    if (!user || !selectedSprint) return;
    setIsLoading(true);
    try {
      const profile = await getUserProfile(db, user.uid);
      if (!profile) {
        setIsLoading(false);
        return;
      }
      setCurrentUserProfile(profile);

      const [salesData, profilesData] = await Promise.all([
        getSales(db, profile, selectedSprint), 
        getUserProfiles(db),
      ]);

      setSales(salesData);
      setUserProfiles(profilesData);
    } catch (error: unknown) {
      console.error("Failed to fetch report data:", error);
      toast({
        variant: "destructive",
        title: "Error loading report",
        description: "No se pudieron obtener los datos de la base de datos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [db, toast, user, selectedSprint]);

  useEffect(() => {
    if(selectedSprint){
      fetchData();
    }
  }, [fetchData, selectedSprint]);

  const handlePrint = () => {
    window.print();
  };

  const isManager = currentUserProfile?.role === 'Manager';

  const salesForReport = useMemo(() => {
    if (isManager || !user) {
      return sales;
    }
    return sales.filter(sale => sale.salespersonId === user.uid);
  }, [sales, user, isManager]);


  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.32))]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium animate-pulse">Analizando rendimiento...</p>
            </motion.div>
        </div>
    )
  }

  if (!currentUserProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))] px-4 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive/20 mb-4" />
          <h2 className="text-2xl font-bold">Perfil No Encontrado</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">No pudimos localizar tu perfil para generar el reporte. Contacta a soporte.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* Header Estilo Apple */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Intelligence Report</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-headline">
            {isManager ? "Reporte de Sucursal" : "Mi Rendimiento"}
          </h1>
          <p className="text-muted-foreground text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Resumen ejecutivo de {reportDate}.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md p-2 rounded-[24px] shadow-soft border border-border/20 self-start md:self-auto">
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                <SelectTrigger className="w-[180px] h-11 border-none bg-transparent rounded-2xl focus:ring-0 shadow-none hover:bg-secondary/40">
                    <SelectValue placeholder="Seleccionar Mes" />
                </SelectTrigger>
                <SelectContent className="rounded-[24px]">
                    {sprints.map((sprint) => (
                        <SelectItem key={sprint.value} value={sprint.value}>
                            {sprint.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="h-8 w-px bg-border/40 mx-1" />
            <Button onClick={handlePrint} variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-secondary/60">
              <Printer className="h-5 w-5 text-muted-foreground" />
            </Button>
        </div>
      </motion.div>
      
      {/* Vista de Impresión */}
      <div className="hidden print:block text-center mb-8 border-b pb-8">
          <h1 className="text-4xl font-bold font-headline mb-2">
            {isManager ? "MotoSales Reporte de Sucursal" : "Reporte Individual de Ventas"}
          </h1>
          <p className="text-muted-foreground text-lg uppercase tracking-widest">
            {reportDate}
          </p>
      </div>
      
      {/* Contenido Principal con Animaciones Escaladas */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15
            }
          }
        }}
        className="space-y-10"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <ReportSummary sales={salesForReport} userProfiles={userProfiles} isManager={isManager} />
        </motion.div>

        <motion.div 
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="grid grid-cols-1 lg:grid-cols-1 gap-10"
        >
          {isManager && <SalesBySalespersonChart sales={salesForReport} userProfiles={userProfiles} />}
        </motion.div>
        
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Detalle de Operaciones</h3>
            </div>
            <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-tighter">
              {salesForReport.length} Transacciones registradas
            </span>
          </div>
          <SalesDetailTable sales={salesForReport} userProfiles={userProfiles} />
        </motion.div>
      </motion.div>
    </div>
  );
}
