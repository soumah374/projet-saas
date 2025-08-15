import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface ProjectActionModalsProps {
  status: string;
  isStarting: boolean;
  isUpdating: boolean;
  onStart: () => void;
  onMoveToLivraison: () => void;
  onComplete: () => void;
}

export function ProjectActionModals({
  status,
  isStarting,
  isUpdating,
  onStart,
  onMoveToLivraison,
  onComplete,
}: ProjectActionModalsProps) {
  return (
    <>
      {status === 'Prospection' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isStarting}>
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lancement...
                </>
              ) : (
                'Lancer le projet'
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer le lancement du projet</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action va démarrer le projet et fixer la date de début à aujourd'hui. Voulez-vous continuer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={onStart}>Confirmer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {status === 'Production' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Passer en Livraison'
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Passer le projet en phase Livraison</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action indiquera que le projet est en phase de livraison. Voulez-vous continuer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={onMoveToLivraison}>Confirmer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {status === 'Livraison' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finalisation...
                </>
              ) : (
                'Terminer le projet'
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Terminer le projet</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action marquera le projet comme terminé. Voulez-vous continuer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={onComplete}>Confirmer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
} 