import { useCallback } from 'react';
import { uploadPhotoBefore } from './actionsApi';

/**
 * Mutation « ajouter des photos avant » après création ou modification ; même rôle que `useCreateAction`.
 * Envoie un par un (le plafond de 3 est vérifié par le backend à chaque ajout) ; résout avec les noms des fichiers refusés.
 */
export function useUploadPhotosBefore() {
  return useCallback(async (id: string, files: readonly File[]) => {
    const failed: string[] = [];
    for (const file of files) {
      await uploadPhotoBefore(id, file).catch(() => failed.push(file.name));
    }
    return failed;
  }, []);
}
