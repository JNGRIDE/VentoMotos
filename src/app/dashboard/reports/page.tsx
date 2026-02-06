'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Printer, LoaderCircle, ShieldAlert } from 'lucide-react';
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
        description: "Could not fetch data from the database.",
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
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }

  if (!currentUserProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))]">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Profile Not Found</h2>
          <p className="text-muted-foreground mt-2">We couldn't find a user profile for you.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 print:gap-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {isManager ? "Branch Sales Report" : "My Sales Report"}
          </h1>
          <p className="text-muted-foreground">
            Sales performance summary for {reportDate}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Select a sprint" />
                </SelectTrigger>
                <SelectContent>
                    {sprints.map((sprint) => (
                        <SelectItem key={sprint.value} value={sprint.value}>
                            {sprint.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={handlePrint} size="sm" className="h-8 gap-1">
              <Printer className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Print Report
              </span>
            </Button>
        </div>
      </div>
      
      <div className="hidden print:block text-center mb-4">
          <h1 className="text-2xl font-bold font-headline">
            {isManager ? "Branch Sales Report" : "My Sales Report"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {reportDate}
          </p>
      </div>
      
      <ReportSummary sales={salesForReport} userProfiles={userProfiles} isManager={isManager} />

      <div>
        {isManager && <SalesBySalespersonChart sales={salesForReport} userProfiles={userProfiles} />}
      </div>
      
      <SalesDetailTable sales={salesForReport} userProfiles={userProfiles} />
    </div>
  );
}
