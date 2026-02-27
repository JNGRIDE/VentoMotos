"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { LoaderCircle, ExternalLink, FileText, MapPin, Globe, PlusCircle, Trash2, ShieldAlert } from 'lucide-react';
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { getUtilities, getUserProfile, removeUtility } from '@/firebase/services';
import type { Utility, UserProfile } from '@/lib/data';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddUtilityDialog } from '@/components/utilities/add-utility-dialog';

export default function UtilitiesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [profile, utils] = await Promise.all([
        getUserProfile(db, user.uid),
        getUtilities(db)
      ]);
      setCurrentUserProfile(profile);
      setUtilities(utils);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error cargando utilidades",
        description: error.message || "No se pudo conectar con la base de datos.",
      });
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
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar." });
    }
  };

  const isManager = currentUserProfile?.role === 'Manager';

  const getIcon = (category: Utility['category']) => {
    switch (category) {
      case 'Link': return <Globe className="h-5 w-5" />;
      case 'Document': return <FileText className="h-5 w-5" />;
      case 'Location': return <MapPin className="h-5 w-5" />;
      default: return <ExternalLink className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.32))]">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
            Centro de Utilidades
          </h1>
          <p className="text-muted-foreground text-lg">
            Herramientas, enlaces y recursos clave para el equipo Vento.
          </p>
        </div>
        {isManager && (
          <AddUtilityDialog onUtilityAdded={fetchData} />
        )}
      </div>

      {utilities.length === 0 ? (
        <Card className="border-dashed bg-muted/20 rounded-[32px] p-12 flex flex-col items-center justify-center text-center">
          <LayoutGrid className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-xl font-bold">No hay utilidades aún</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            El Manager puede agregar enlaces a portales de crédito, documentos PDF o ubicaciones de sucursales aquí.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {utilities.map((item) => (
            <Card key={item.id} className="group overflow-hidden rounded-[32px] border-none shadow-soft hover:shadow-premium transition-all duration-500">
              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    {getIcon(item.category)}
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {item.category}
                    </Badge>
                    {isManager && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold mt-4 leading-tight">{item.title}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px] mt-1">
                  {item.description || "Sin descripción adicional."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <Button 
                  asChild 
                  className="w-full rounded-2xl h-12 shadow-primary/10 group-hover:shadow-primary/30 transition-all"
                >
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    Abrir Recurso <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { LayoutGrid } from 'lucide-react';
