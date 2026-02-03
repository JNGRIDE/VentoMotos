"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bike, Chrome, LoaderCircle } from "lucide-react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebaseApp } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const app = useFirebaseApp();
  const router = useRouter();
  const { toast } = useToast();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("Current app origin:", window.location.origin);
    }
    const authInstance = getAuth(app);
    setAuth(authInstance);

    getRedirectResult(authInstance)
      .then((result) => {
        if (result) {
          router.push("/dashboard");
        } else {
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
    signInWithRedirect(auth, provider);
  };

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) return;

    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please enter both email and password.",
      });
      return;
    }

    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Email sign-in error:", error);
      let description = "An unexpected error occurred.";
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          description = "Invalid email or password.";
          break;
        case "auth/invalid-email":
          description = "Please enter a valid email address.";
          break;
        case "auth/too-many-requests":
          description = "Too many failed login attempts. Please try again later.";
          break;
      }
      toast({
        variant: "destructive",
        title: "Login failed",
        description,
      });
    } finally {
      setIsSigningIn(false);
    }
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
          <div className="grid gap-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={!auth || isSigningIn}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSignIn} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSigningIn}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSigningIn}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSigningIn}>
                {isSigningIn && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign in with Email
              </Button>
            </form>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
