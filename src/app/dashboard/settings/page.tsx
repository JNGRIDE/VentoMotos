"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { LoaderCircle, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useFirestore } from '@/firebase';
import { useUser } from "@/firebase/auth/use-user";
import { getUserProfiles, setUserProfile, getUserProfile } from '@/firebase/db';
import type { UserProfile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const goalSchema = z.object({
  salesGoal: z.coerce.number().min(0, "Sales goal must be positive"),
  creditsGoal: z.coerce.number().min(0, "Credits goal must be positive"),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface UserProfileCardProps {
  userProfile: UserProfile;
  onUpdate: (uid: string, data: GoalFormValues) => Promise<void>;
}

function UserProfileGoalCard({ userProfile, onUpdate }: UserProfileCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      salesGoal: userProfile.salesGoal || 0,
      creditsGoal: userProfile.creditsGoal || 0,
    },
  });

  const onSubmit = async (data: GoalFormValues) => {
    setIsSaving(true);
    try {
      await onUpdate(userProfile.uid, data);
      toast({
        title: "Goals Updated",
        description: `Successfully updated goals for ${userProfile.name}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save the new goals.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
              <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{userProfile.name}</CardTitle>
              <CardDescription>{userProfile.email} ({userProfile.role})</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="salesGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales Goal ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="150000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditsGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credits Goal</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Save Goals
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export default function SprintSettingsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleUpdateGoals = async (uid: string, data: GoalFormValues) => {
    await setUserProfile(db, { uid, ...data });
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
          Update monthly sales and credit goals for each salesperson.
        </p>
      </div>
      <div className="space-y-6">
        {userProfiles.map((sp) => (
          <UserProfileGoalCard key={sp.uid} userProfile={sp} onUpdate={handleUpdateGoals} />
        ))}
      </div>
    </div>
  );
}