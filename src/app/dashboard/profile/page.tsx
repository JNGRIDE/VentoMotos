"use client";

import { useState, useEffect } from "react";
import { LoaderCircle, User, Lock, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile, updatePassword, type User as FirebaseUser } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseApp, useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { setUserProfile, getUserProfile } from "@/firebase/services";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ProfilePage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
        getUserProfile(db, user.uid).then(profile => {
            if (profile) {
                profileForm.reset({ name: profile.name });
            } else {
                profileForm.reset({ name: user.displayName || "" });
            }
        });
    }
  }, [user, db, profileForm]);

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      // 1. Update Firebase Auth
      await updateProfile(user, { displayName: data.name });

      // 2. Update Firestore Profile
      await setUserProfile(db, { uid: user.uid, name: data.name });

      toast({ title: "Profile Updated", description: "Your name has been updated successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update profile." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    setIsSavingPassword(true);
    try {
      await updatePassword(user, data.newPassword);
      toast({ title: "Password Updated", description: "Your password has been changed successfully." });
      passwordForm.reset();
    } catch (error: any) {
       // Re-authentication might be required
       if (error.code === 'auth/requires-recent-login') {
           toast({ variant: "destructive", title: "Login Required", description: "For security, please log out and log back in to change your password." });
       } else {
           toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update password." });
       }
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!user) {
      return <div className="flex h-96 items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          My Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and security settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Information</CardTitle>
          <CardDescription>
            Update your display name across the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSavingProfile}>
                            {isSavingProfile && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
             </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Security</CardTitle>
          <CardDescription>
            Change your account password.
          </CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <div className="flex justify-end">
                        <Button type="submit" disabled={isSavingPassword}>
                            {isSavingPassword && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </div>
                </form>
             </Form>
        </CardContent>
      </Card>
    </div>
  );
}
