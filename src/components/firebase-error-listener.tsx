'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      if (process.env.NODE_ENV === 'development') {
        // Muestra el error enriquecido en la consola y overlay de Next.js
        setTimeout(() => {
          const detailedMsg = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
{
  "operation": "${error.context.operation}",
  "path": "${error.context.path}",
  "data": ${JSON.stringify(error.context.requestResourceData || {}, null, 2)}
}`;
          console.error(detailedMsg);
          // Opcionalmente podrías lanzar una excepción para ver el overlay
          // throw new Error(detailedMsg);
        }, 0);
      }
      
      toast({
        variant: "destructive",
        title: "Error de Seguridad",
        description: `No tienes permisos para esta acción en: ${error.context.path.split('/').pop()}`,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
  }, [toast]);

  return null;
}
