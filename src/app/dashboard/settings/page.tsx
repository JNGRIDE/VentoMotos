"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LoaderCircle, ShieldAlert, Users, Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

import { useFirestore } from '@/firebase';
import { useUser } from "@/firebase/auth/use-user";
import { getUserProfiles, setUserProfile, getUserProfile } from '@/firebase/services';
import type { UserProfile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ResetSprintDialog } from '@/components/settings/reset-sprint-dialog';

const totalGoalSchema = z.object({
  totalSalesGoal: z.coerce.number().min(0, "Total sales goal must be positive"),
  totalCreditsGoal: z.coerce.number().min(0, "Total credits goal must be positive"),
});

type TotalGoalFormValues = z.infer<typeof totalGoalSchema>;

export default function SprintSettingsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentSprint, setCurrentSprint] = useState('');
  useEffect(() => {
    setCurrentSprint(format(new Date(), 'yyyy-MM'));
  }, []);

  const salespeople = useMemo(() => userProfiles.filter(p => p.role === 'Salesperson'), [userProfiles]);
  const numSalespeople = salespeople.length;

  const currentTotalSalesGoal = useMemo(() => {
    return userProfiles.filter(p => p.role === 'Salesperson').reduce((sum, sp) => sum + sp.salesGoal, 0);
  }, [userProfiles]);

  const currentTotalCreditsGoal = useMemo(() => {
    return userProfiles.filter(p => p.role === 'Salesperson').reduce((sum, sp) => sum + sp.creditsGoal, 0);
  }, [userProfiles]);

  const form = useForm<TotalGoalFormValues>({
    resolver: zodResolver(totalGoalSchema),
    values: {
        totalSalesGoal: currentTotalSalesGoal,
        totalCreditsGoal: currentTotalCreditsGoal,
    }
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const profile = await getUserProfile(db, user.uid);
      setCurrentUserProfile(profile);

      if (profile?.role === 'Manager') {
        const profilesData = await getUserProfiles(db);
        setUserProfiles(profilesData);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "Could not fetch data from the database.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [db, toast, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: TotalGoalFormValues) => {
    if (numSalespeople === 0) {
      toast({
        variant: "destructive",
        title: "No Salespeople Found",
        description: "Cannot set goals as there are no users with the 'Salesperson' role.",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const divisor = numSalespeople === 1 ? 2 : numSalespeople;
      const individualSalesGoal = data.totalSalesGoal / divisor;
      const individualCreditsGoal = Math.floor(data.totalCreditsGoal / divisor);

      const updatePromises = salespeople.map(sp => 
        setUserProfile(db, {
          uid: sp.uid,
          salesGoal: individualSalesGoal,
          creditsGoal: individualCreditsGoal,
        })
      );

      await Promise.all(updatePromises);
      
      toast({
        title: "Team Goals Updated!",
        description: `New goals have been assigned to ${numSalespeople} salespeople for the current sprint.`,
      });
      fetchData();
    } catch (error: unknown) {
        const errorObj = error as { message?: string };
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: errorObj.message || "Could not save the new team goals.",
        });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.32))]">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUserProfile?.role !== 'Manager') {
    return (
       <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))]">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Only managers can access this page.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Sprint Settings
        </h1>
        <p className="text-muted-foreground">
          Set the total monthly goals for the branch. They will be divided equally among all salespeople for the current sprint.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Branch Monthly Goals</CardTitle>
              <CardDescription>
                Set the total sales and credit goals for the entire team. These will be distributed automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="totalSalesGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Branch Sales Goal ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalCreditsGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Branch Credits Goal</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4 justify-between items-center">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save & Distribute Goals
              </Button>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                <span>
                  Goals will be split among {numSalespeople} salesperson{numSalespeople !== 1 && 's'}.
                </span>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <Card className="border-destructive">
        <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
                Estas acciones son irreversibles y deben usarse con extrema precaución.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm">
                Reiniciar el sprint actual ({currentSprint}) borrará todas las ventas y prospectos asociados a este mes. 
                Las metas de los vendedores también se restablecerán a cero. Esto es útil para empezar un mes desde cero o corregir errores masivos.
            </p>
        </CardContent>
        <CardFooter>
            <ResetSprintDialog sprint={currentSprint} onSprintReset={fetchData} />
        </CardFooter>
      </Card>
    </div>
  );
}
