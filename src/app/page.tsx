"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bike, Chrome } from "lucide-react";
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFirebaseApp } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const app = useFirebaseApp();
  const router = useRouter();
  const { toast } = useToast();
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    // Log the origin to help debug domain authorization issues
    console.log("Current app origin:", window.location.origin);
    setAuth(getAuth(app));
  }, [app]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Login failed.",
        description: error.message || "There was a problem with Google Sign-In.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Bike className="h-8 w-8 text-primary-foreground" />
              </div>
          </div>
          <CardTitle className="font-headline text-3xl">MotoSales CRM</CardTitle>
          <CardDescription>
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={!auth}>
              <Chrome className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
