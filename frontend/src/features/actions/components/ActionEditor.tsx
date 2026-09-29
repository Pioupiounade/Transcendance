import { useState } from 'react';
import { ActionForm } from './ActionForm';
import { NeighborhoodMap } from './NeighborhoodMap';
import type { ActionRecord, LatLng } from '../types';
import styles from './ActionEditor.module.css';

type ActionEditorProps = {
  /** Lieu de départ : `?at=` (création) ou celui de l'action (modification). */
  initialLocation: LatLng | null;
  action?: ActionRecord;
  onSaved: (action: ActionRecord) => void;
  onCancel: () => void;
};

const NO_ACTIONS: never[] = [];
const noop = () => {};

/** Sélecteur de lieu (carte, pin déplaçable) + `ActionForm`, partagé par les pages créer et modifier. */
export function ActionEditor({ initialLocation, action, onSaved, onCancel }: ActionEditorProps) {
  const [location, setLocation] = useState<LatLng | null>(initialLocation);

  return (
    <div className={styles.editor}>
      <div className={styles.map}>
        <NeighborhoodMap actions={NO_ACTIONS} selectedId={null} onSelect={noop} draft={location} onDraftChange={setLocation} />
      </div>
      <div className={styles.form}>
        <ActionForm location={location} action={action} onSaved={onSaved} onCancel={onCancel} />
      </div>
    </div>
  );
}
