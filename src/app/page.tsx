"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bike, Chrome, LoaderCircle } from "lucide-react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  type Auth,
} from "firebase/auth";

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
  const [isLoading, setIsLoading] = useState(true); // To handle redirect check

  useEffect(() => {
    // Log the origin to help debug domain authorization issues
    console.log("Current app origin:", window.location.origin);
    const authInstance = getAuth(app);
    setAuth(authInstance);

    getRedirectResult(authInstance)
      .then((result) => {
        if (result) {
          // This means the user has just signed in via redirect.
          router.push("/dashboard");
        } else {
          // No user signed in via redirect, so we can show the login page.
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Authentication error on redirect:", error);
        toast({
          variant: "destructive",
          title: "Uh oh! Login failed.",
          description:
            error.message || "There was a problem with Google Sign-In.",
        });
        setIsLoading(false);
      });
  }, [app, router, toast]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    // We don't need to await this. The page will redirect.
    signInWithRedirect(auth, provider);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Bike className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="font-headline text-3xl">
            MotoSales CRM
          </CardTitle>
          <CardDescription>
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={!auth}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
