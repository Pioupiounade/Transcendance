import { Dialog } from '@/shared/ui';
import { ACTIONS_LABELS } from '../labels';
import type { ActionRecord, LatLng } from '../types';
import { ActionForm } from './ActionForm';
import styles from './CreateActionDialog.module.css';

type CreateActionDialogProps = {
  /** Lieu choisi sur la carte ; `null` = fermé. */
  location: LatLng | null;
  onClose: () => void;
  onCreated: (action: ActionRecord, failedPhotos: string[]) => void;
};

const text = ACTIONS_LABELS.create;

/** Modale « Suggest an action » autour d'`ActionForm` ; le formulaire repart de zéro à chaque ouverture. */
export function CreateActionDialog({ location, onClose, onCreated }: CreateActionDialogProps) {
  return (
    <Dialog open={location !== null} onClose={onClose} title={text.dialogTitle} closeLabel={text.close}>
      <p className={styles.lead}>{text.dialogLead}</p>
      {location && <ActionForm location={location} onSaved={onCreated} onCancel={onClose} />}
    </Dialog>
  );
}
