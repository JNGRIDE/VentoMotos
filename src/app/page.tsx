
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bike, Chrome, LoaderCircle, AlertTriangle, KeyRound, Copy } from "lucide-react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  getAdditionalUserInfo,
  type Auth,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebaseApp, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { createUserProfile } from "@/firebase/services";

export default function LoginPage() {
  const firebaseConfigIncomplete = !process.env.NEXT_PUBLIC_API_KEY || !process.env.NEXT_PUBLIC_PROJECT_ID;
  
  const app = useFirebaseApp();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (firebaseConfigIncomplete) {
      setIsLoading(false);
      return;
    }
    const authInstance = getAuth(app);
    setAuth(authInstance);

    getRedirectResult(authInstance)
      .then(async (result) => {
        if (result) {
          const info = getAdditionalUserInfo(result);
          if (info?.isNewUser) {
            await createUserProfile(
              db,
              result.user,
              result.user.displayName || "New User"
            );
            toast({
              title: "Welcome!",
              description: "Your profile has been created.",
            });
          }
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
  }, [app, db, router, toast, firebaseConfigIncomplete]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) return;

    if (!email || !password) {
      return toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please enter both email and password.",
      });
    }

    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error: any) {
      handleAuthError(error, "Login failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) return;

    if (!name || !email || !password) {
      return toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all fields to create an account.",
      });
    }

    setIsSigningIn(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      await createUserProfile(db, user, name);
      router.push("/dashboard");
    } catch (error: any) {
      handleAuthError(error, "Sign-up failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAuthError = (error: any, title: string) => {
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
      case "auth/email-already-in-use":
        description = "An account with this email already exists.";
        break;
      case "auth/weak-password":
        description = "Password should be at least 6 characters long.";
        break;
      case "auth/too-many-requests":
        description =
          "Too many failed login attempts. Please try again later.";
        break;
      default:
        console.error("Authentication error:", error);
        break;
    }
    toast({ variant: "destructive", title, description });
  };
  
  if (firebaseConfigIncomplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="mx-auto w-full max-w-2xl border-2 border-destructive shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-7 w-7" />
              <span className="font-headline text-3xl">Acción Requerida: Configura tus Claves</span>
            </CardTitle>
            <CardDescription className="text-base">
              Tu aplicación no puede conectar con Firebase. Sigue esta guía visual para solucionarlo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 text-sm">
            
            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
              <h3 className="font-semibold text-lg">Paso 1: Encuentra tus claves en Firebase</h3>
              <ul className="space-y-3 pl-4">
                <li><span className="font-bold">1.</span> Abre la <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Consola de Firebase</a> y selecciona tu proyecto.</li>
                <li><span className="font-bold">2.</span> Haz clic en el icono de engranaje (⚙️) y ve a <span className="font-semibold">Project settings</span>.</li>
                <li><span className="font-bold">3.</span> En la pestaña "General", baja hasta "Your apps" y haz clic en tu aplicación web (icono: <span className="inline-block font-mono text-primary">&lt;/&gt;</span>).</li>
                <li><span className="font-bold">4.</span> Selecciona la opción <span className="font-semibold">Config</span> para ver tus claves. Verás un objeto <code className="text-xs">firebaseConfig</code>.</li>
              </ul>
            </div>
            
            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
              <h3 className="font-semibold text-lg">Paso 2: Añade las claves a Vercel</h3>
               <p>Copia cada valor del objeto <code className="text-xs">firebaseConfig</code> y pégalo en una Variable de Entorno en Vercel. Ve a <span className="font-semibold">Settings &gt; Environment Variables</span> en tu proyecto de Vercel.</p>
              <div className="space-y-2 rounded-md bg-background p-4 font-mono text-xs shadow-inner">
                <p><span className="text-muted-foreground"># En Vercel (Name)</span>  = <span className="text-muted-foreground"># En Firebase (Value)</span></p>
                <p><span className="text-primary">NEXT_PUBLIC_API_KEY</span> = "AIzaSy..." <span className="text-muted-foreground">(de apiKey)</span></p>
                <p><span className="text-primary">NEXT_PUBLIC_AUTH_DOMAIN</span> = "..." <span className="text-muted-foreground">(de authDomain)</span></p>
                <p><span className="text-primary">NEXT_PUBLIC_PROJECT_ID</span> = "..." <span className="text-muted-foreground">(de projectId)</span></p>
                <p><span className="text-primary">NEXT_PUBLIC_STORAGE_BUCKET</span> = "..." <span className="text-muted-foreground">(de storageBucket)</span></p>
                <p><span className="text-primary">NEXT_PUBLIC_MESSAGING_SENDER_ID</span> = "..." <span className="text-muted-foreground">(de messagingSenderId)</span></p>
                <p><span className="text-primary">NEXT_PUBLIC_APP_ID</span> = "..." <span className="text-muted-foreground">(de appId)</span></p>
                <p><span className="text-primary">NEXT_PUBLIC_MEASUREMENT_ID</span> = "..." <span className="text-muted-foreground">(de measurementId)</span></p>
              </div>
               <p>No te olvides de añadir también tu clave de Gemini:</p>
               <div className="rounded-md bg-background p-4 font-mono text-xs shadow-inner">
                 <p><span className="text-primary">GEMINI_API_KEY</span> = "AIza..." <span className="text-muted-foreground">(la obtienes de Google AI Studio)</span></p>
               </div>
            </div>

          </CardContent>
           <CardFooter>
            <p className="text-sm text-muted-foreground">Después de guardar las variables en Vercel, la plataforma iniciará un nuevo despliegue (re-deploy) automáticamente. ¡Con eso, la aplicación funcionará!</p>
          </CardFooter>
        </Card>
      </div>
    )
  }

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
            {isSignUp ? "Create an Account" : "MotoSales CRM"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Enter your details to get started"
              : "Sign in to access your dashboard"}
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
              Sign {isSignUp ? "up" : "in"} with Google
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

            <form
              onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn}
              className="grid gap-4"
            >
              {isSignUp && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSigningIn}
                  />
                </div>
              )}
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
                  placeholder={isSignUp ? "6+ characters" : ""}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSigningIn}>
                {isSigningIn && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p
            onClick={() => setIsSignUp(!isSignUp)}
            className="cursor-pointer text-muted-foreground hover:text-primary"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
