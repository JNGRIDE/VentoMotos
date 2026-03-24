"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { LoaderCircle, ExternalLink, FileText, MapPin, Globe, Trash2, LayoutGrid, ShieldAlert, AlertTriangle, Filter } from 'lucide-react';
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { getUtilities, getUserProfile, removeUtility } from '@/firebase/services';
import type { Utility, UserProfile } from '@/lib/data';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddUtilityDialog } from '@/components/utilities/add-utility-dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    transition: { duration: 0.2 } 
  }
};

export default function UtilitiesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setPermissionError(null);
    try {
      const profile = await getUserProfile(db, user.uid);
      setCurrentUserProfile(profile);

      const utils = await getUtilities(db);
      setUtilities(utils);
    } catch (error: any) {
      console.error("Error fetching utilities:", error);
      if (error.message?.includes('permissions') || error.code === 'permission-denied') {
        setPermissionError("No tienes permisos suficientes para ver esta sección. Asegúrate de tener un perfil configurado.");
      } else {
        toast({
          variant: "destructive",
          title: "Error de carga",
          description: error.message || "No se pudieron obtener las utilidades.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [db, user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await removeUtility(db, id);
      toast({ title: "Eliminado", description: "La utilidad ha sido removida." });
      setUtilities(prev => prev.filter(u => u.id !== id));
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "No tienes permisos para eliminar este recurso." 
      });
    }
  };

  const isManager = currentUserProfile?.role === 'Manager';

  const getIcon = (category: Utility['category']) => {
    switch (category) {
      case 'Link': return <Globe className="h-6 w-6" />;
      case 'Document': return <FileText className="h-6 w-6" />;
      case 'Location': return <MapPin className="h-6 w-6" />;
      default: return <LayoutGrid className="h-6 w-6" />;
    }
  };

  const categories = [
    { id: 'all', label: 'Todas', icon: Filter },
    { id: 'Link', label: 'Enlaces', icon: Globe },
    { id: 'Document', label: 'Documentos', icon: FileText },
    { id: 'Location', label: 'Ubicaciones', icon: MapPin },
    { id: 'Other', label: 'Otros', icon: LayoutGrid },
  ];

  const filteredUtilities = useMemo(() => {
    if (activeTab === 'all') return utilities;
    return utilities.filter(u => u.category === activeTab);
  }, [utilities, activeTab]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = { all: utilities.length };
    utilities.forEach(u => {
      counts[u.category] = (counts[u.category] || 0) + 1;
    });
    return counts;
  }, [utilities]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.32))]">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (permissionError) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))] gap-6 max-w-md mx-auto text-center"
      >
        <div className="h-20 w-20 rounded-[32px] bg-destructive/10 flex items-center justify-center shadow-lg">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Acceso Denegado</h2>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">{permissionError}</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="mt-4 rounded-2xl h-12 px-8 font-bold border-border/60 hover:bg-secondary">Reintentar Carga</Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Centro de Utilidades
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg md:text-xl font-medium"
          >
            Recursos clave centralizados para el equipo Vento.
          </motion.p>
        </div>
        {isManager && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AddUtilityDialog onUtilityAdded={fetchData} />
          </motion.div>
        )}
      </div>

      {!isManager && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Alert className="bg-primary/5 border-primary/20 rounded-[32px] p-6 shadow-soft">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary font-black uppercase tracking-widest text-xs mb-1">Modo Consulta</AlertTitle>
            <AlertDescription className="text-primary/80 font-medium">
              Como Vendedor, puedes usar todos los recursos pero no puedes editarlos.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="flex flex-col gap-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-secondary/40 p-2 rounded-[32px] h-auto flex flex-wrap md:inline-flex w-full md:w-auto shadow-soft border border-border/10 backdrop-blur-md">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="rounded-2xl h-11 px-6 gap-2.5 data-[state=active]:bg-background data-[state=active]:shadow-premium data-[state=active]:text-primary transition-all duration-500 font-bold"
              >
                <cat.icon className="h-4 w-4" />
                <span>{cat.label}</span>
                {stats[cat.id] > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 p-0 px-1.5 rounded-lg text-[10px] bg-primary/10 text-primary border-none font-black">
                    {stats[cat.id]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <LayoutGroup>
          <motion.div 
            layout
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredUtilities.length === 0 ? (
                <motion.div
                  key="empty-state"
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="col-span-full"
                >
                  <Card className="border-dashed border-2 border-border/60 bg-muted/5 rounded-[48px] p-20 flex flex-col items-center justify-center text-center shadow-none">
                    <div className="h-24 w-24 rounded-[40px] bg-secondary flex items-center justify-center mb-8 shadow-soft transition-transform duration-500 hover:rotate-12">
                      <LayoutGrid className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                    <h3 className="text-3xl font-black tracking-tight">Sin recursos en esta sección</h3>
                    <p className="text-muted-foreground max-w-md mt-4 text-lg font-medium leading-relaxed">
                      {isManager 
                        ? "Como Manager, puedes empezar agregando portales, archivos o guías para organizar a tu equipo." 
                        : "Aún no se han agregado recursos en esta sección. Contacta a tu Manager si falta algo."}
                    </p>
                    {isManager && activeTab !== 'all' && (
                      <Button variant="outline" onClick={() => setActiveTab('all')} className="mt-8 rounded-2xl h-12 px-8 font-black border-border/60 hover:bg-secondary">
                        Ver todo el catálogo
                      </Button>
                    )}
                  </Card>
                </motion.div>
              ) : (
                filteredUtilities.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Card className="group overflow-hidden rounded-[40px] border-none shadow-soft hover:shadow-premium transition-all duration-500 h-full flex flex-col bg-card/80 backdrop-blur-md">
                      <CardHeader className="p-8 pb-4">
                        <div className="flex justify-between items-start">
                          <div className="p-4 rounded-3xl bg-primary/10 text-primary transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shadow-inner">
                            {getIcon(item.category)}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="rounded-full text-[9px] font-black uppercase tracking-[0.15em] bg-secondary/60 backdrop-blur-sm px-3 py-1.5 border-none">
                              {item.category}
                            </Badge>
                            {isManager && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 active:scale-90"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl max-w-md">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Estás a punto de eliminar <strong>{item.title}</strong> del centro de utilidades. Esta acción no se puede deshacer y el recurso ya no estará disponible para el equipo.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl border-border/40">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
                                      onClick={() => handleDelete(item.id)}
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-2xl font-black mt-8 leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-500">{item.title}</CardTitle>
                        <CardDescription className="line-clamp-2 min-h-[48px] mt-3 text-muted-foreground font-medium leading-relaxed text-sm">
                          {item.description || "Sin descripción adicional registrada."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-8 pt-4 mt-auto">
                        <Button 
                          asChild 
                          className="w-full rounded-2xl h-14 shadow-primary/10 group-hover:shadow-primary/30 transition-all duration-500 gap-3 font-black text-base active:scale-95"
                        >
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            Abrir Recurso <ExternalLink className="h-5 w-5" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
}
