"use client";

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  CreditCard, 
  Award, 
  TrendingUp, 
  UserPlus, 
  ShieldAlert, 
  Download, 
  CalendarOff, 
  CalendarPlus, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SalesProgressChart } from '@/components/dashboard/sales-progress-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { RecordSaleDialog } from '@/components/sales/record-sale-dialog';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useToast } from "@/hooks/use-toast";
import { getSalesByUser } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_UID, COMMISSION_RATES, GOALS } from '@/lib/constants';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUser } from '@/firebase/auth/use-user';
import { exportSalesToCSV } from '@/lib/export-utils';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  
  const {
    currentUserProfile,
    sales,
    userProfiles,
    isLoading,
    sprints,
    selectedSprint,
    setSelectedSprint,
    createAdminProfile,
    recordSale,
    deleteSale,
    updateSale,
    finishSprint,
    startNextSprint,
    error
  } = useDashboardData();

  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: error.title,
        description: error.description,
      });
    }
  }, [error, toast]);
  
  const isManager = currentUserProfile?.role === 'Manager';
  
  const branchSales = useMemo(() => isManager ? sales.filter(s => !s.isExternal) : sales, [sales, isManager]);

  const totalSales = useMemo(() => {
    if (!isManager) {
      return sales.reduce((sum, sale) => sum + sale.amount, 0);
    }
    return branchSales.reduce((sum, sale) => sum + sale.amount, 0);
  }, [sales, branchSales, isManager]);
  
  const totalCredits = useMemo(() => branchSales.filter(s => s.paymentMethod === 'Financing').length, [branchSales]);
  const ventoCredits = useMemo(() => branchSales.filter(s => s.creditProvider === 'Vento').length, [branchSales]);

  const salesGoal = useMemo(() => {
    if (currentUserProfile?.role === 'Manager') {
      return userProfiles.reduce((sum, sp) => sum + sp.salesGoal, 0);
    }
    return currentUserProfile?.salesGoal || 0;
  }, [userProfiles, currentUserProfile]);
  
  const salesProgress = salesGoal > 0 ? (totalSales / salesGoal) * 100 : 0;
  
  const commissionData = useMemo(() => {
    const commissionRate = isManager ? COMMISSION_RATES.MANAGER : COMMISSION_RATES.SALESPERSON;
    const earned = totalSales * commissionRate;

    let description = "";
    let iconColor = "text-muted-foreground";
    let valueClassName = "text-muted-foreground opacity-50";
    let descriptionClassName = "";

    if (salesProgress < GOALS.SALES_PROGRESS_THRESHOLD) {
       const amountToUnlock = (salesGoal * (GOALS.SALES_PROGRESS_THRESHOLD / 100)) - totalSales;
       description = `Faltan $${Math.max(0, amountToUnlock).toLocaleString()} para liberar el 80%`;
    } else if (salesProgress < 100) {
       description = `¡Comisión liberada! (80% alcanzado)`;
       iconColor = "text-primary";
       valueClassName = "text-primary";
    } else {
       description = `¡Meta cumplida! ${salesProgress.toFixed(0)}% alcanzado`;
       iconColor = "text-accent";
       valueClassName = "text-accent";
       descriptionClassName = "text-accent font-bold";
    }

    return { earned, description, iconColor, valueClassName, descriptionClassName };
  }, [isManager, salesProgress, totalSales, salesGoal]);

  const creditBonus = ventoCredits >= 5 ? (ventoCredits - 4) * 200 : 0;

  const teamChartData = useMemo(() => {
    const profilesToChart = currentUserProfile?.role === 'Manager' ? userProfiles : (currentUserProfile ? [currentUserProfile] : []);
    return profilesToChart.map(sp => {
      const spSales = getSalesByUser(sp.uid, sales);
      return {
        ...sp,
        currentSales: spSales.reduce((sum, sale) => sum + sale.amount, 0),
        currentCredits: spSales.filter(s => s.paymentMethod === 'Financing').length,
      }
    });
  }, [sales, userProfiles, currentUserProfile]);
  
  const adminProfileExists = useMemo(() => userProfiles.some(sp => sp.uid === ADMIN_UID), [userProfiles]);

  const currentSprintStatus = useMemo(() => {
     const s = sprints.find(sp => sp.id === selectedSprint);
     return s ? s.status : 'closed';
  }, [sprints, selectedSprint]);

  const handleFinishSprint = async () => {
    try {
      await finishSprint(selectedSprint);
      setIsFinishDialogOpen(false);
      toast({
        title: "Mes cerrado",
        description: "El periodo ha sido bloqueado con éxito.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar el mes.",
      });
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!currentUserProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))] animate-in fade-in">
          <ShieldAlert className="h-16 w-16 text-destructive/20" />
          <h2 className="mt-4 text-2xl font-bold">Profile Not Found</h2>
          <p className="text-muted-foreground mt-2">Please contact an administrator to get set up.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl font-bold tracking-tight"
          >
            Hola, {currentUserProfile.name.split(' ')[0]}!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-base md:text-lg"
          >
            Explora la actividad y el rendimiento de tu sucursal.
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 bg-card/50 backdrop-blur-md p-1.5 rounded-3xl shadow-soft border border-border/20 self-start md:self-auto"
        >
          <Select value={selectedSprint} onValueChange={setSelectedSprint}>
            <SelectTrigger className="w-[140px] md:w-[180px] border-none bg-transparent h-9 md:h-10 rounded-2xl focus:ring-0 shadow-none hover:bg-secondary/40">
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.label} {sprint.status === 'closed' ? '🔒' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isManager && (
            <div className="flex gap-1 border-l border-border/40 pl-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={startNextSprint} variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-2xl hover:bg-secondary/60">
                        <CalendarPlus className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Crear nuevo mes (Sprint)</p>
                  </TooltipContent>
                </Tooltip>

                {currentSprintStatus === 'active' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => setIsFinishDialogOpen(true)} variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-2xl hover:bg-destructive/10">
                          <CalendarOff className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cerrar mes actual</p>
                    </TooltipContent>
                  </Tooltip>
                )}
            </div>
          )}
          
          <div className="border-l border-border/40 pl-1">
            {currentSprintStatus === 'active' && (
               <RecordSaleDialog onAddSale={recordSale} currentUserProfile={currentUserProfile} sprint={selectedSprint} />
            )}
          </div>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KpiCard
            title="Ventas Totales"
            value={`$${totalSales.toLocaleString()}`}
            description={`${salesProgress.toFixed(1)}% de la meta ($${salesGoal.toLocaleString()})`}
            icon={DollarSign}
            iconColor="text-primary"
            delay={0.1}
          />
          <KpiCard
            title="Número de Ventas"
            value={`${branchSales.length}`}
            description={`${totalCredits} créditos colocados este mes`}
            icon={TrendingUp}
            iconColor="text-orange-500"
            delay={0.2}
          />
          <KpiCard
            title="Comisión Generada"
            value={`$${commissionData.earned.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
            description={commissionData.description}
            icon={Award}
            iconColor={commissionData.iconColor}
            valueClassName={commissionData.valueClassName}
            descriptionClassName={commissionData.descriptionClassName}
            delay={0.3}
          />
          <KpiCard
            title="Bono Vento"
            value={`$${creditBonus.toLocaleString()}`}
            description={`${ventoCredits} Créditos Vento logrados`}
            icon={CreditCard}
            iconColor="text-accent"
            delay={0.4}
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 space-y-6 md:space-y-10"
        >
          <SalesProgressChart data={teamChartData} />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight">Actividad Reciente</h3>
              <Button asChild variant="link" className="text-primary font-semibold flex items-center gap-1 group p-0 h-auto">
                <Link href="/dashboard/sales">
                  Ver Todo <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <RecentSales
              sales={sales}
              userProfiles={userProfiles}
              onDeleteSale={currentSprintStatus === 'active' ? deleteSale : undefined}
              onUpdateSale={currentSprintStatus === 'active' ? updateSale : undefined}
              currentUserProfile={currentUserProfile}
            />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6 md:space-y-8"
        >
           <Card className="border-none bg-gradient-to-br from-primary to-accent text-primary-foreground p-6 md:p-8 rounded-[32px] shadow-premium relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Award className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg md:text-xl font-bold">Desafío Mensual</h4>
                  <p className="text-white/80 text-xs md:text-sm">Alcanza el 100% de tu meta para desbloquear el nivel de bono élite.</p>
                </div>
                <div className="pt-2 md:pt-4">
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, salesProgress)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
                      className="h-full bg-white"
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-2 text-right font-medium">{salesProgress.toFixed(0)}% Completado</p>
                </div>
              </div>
              <div className="absolute top-[-20%] right-[-20%] h-64 w-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
           </Card>

           <div className="space-y-4">
              <h4 className="text-lg font-bold px-2">Acciones Rápidas</h4>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => exportSalesToCSV(sales, `sales-${selectedSprint}`)} variant="outline" className="h-auto py-4 md:py-6 flex-col gap-2 rounded-3xl border-border/40 shadow-soft hover:bg-secondary/50 transition-all active:scale-95">
                  <Download className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  <span className="font-semibold text-xs md:text-sm text-center">Exportar CSV</span>
                </Button>
                {user?.uid === ADMIN_UID && !adminProfileExists && (
                  <Button onClick={createAdminProfile} variant="outline" className="h-auto py-4 md:py-6 flex-col gap-2 rounded-3xl border-border/40 shadow-soft hover:bg-secondary/50 transition-all active:scale-95">
                    <UserPlus className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                    <span className="font-semibold text-xs md:text-sm text-center">Perfil Admin</span>
                  </Button>
                )}
              </div>
           </div>
        </motion.div>
      </div>

      <AlertDialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <AlertDialogContent className="rounded-[32px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Cerrar este mes definitivamente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará el mes como **Finalizado**. Se bloquearán todas las ediciones, borrados y nuevos registros de ventas para este periodo. Esta es una acción de seguridad para proteger tus reportes mensuales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinishSprint}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl"
            >
              Sí, cerrar mes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}