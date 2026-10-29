import { useState } from 'react';
import { ActionForm } from './ActionForm';
import { NeighborhoodMap } from './NeighborhoodMap';
import type { ActionRecord, LatLng } from '../types';
import styles from './ActionEditor.module.css';

type ActionEditorProps = {
  /** Lieu de départ : `?at=` (création) ou celui de l'action (modification). */
  initialLocation: LatLng | null;
  /** Quartier de l'utilisateur : centre de la carte tant qu'aucun pin n'est posé (voir `NeighborhoodMap`). */
  home?: LatLng | null;
  action?: ActionRecord;
  onSaved: (action: ActionRecord, failedPhotos: string[]) => void;
  onCancel: () => void;
};

const NO_ACTIONS: never[] = [];
const noop = () => {};

/** Sélecteur de lieu (carte, pin déplaçable) + `ActionForm`, partagé par les pages créer et modifier. */
export function ActionEditor({ initialLocation, home, action, onSaved, onCancel }: ActionEditorProps) {
  const [location, setLocation] = useState<LatLng | null>(initialLocation);

  return (
    <div className={styles.editor}>
      <div className={styles.map}>
        <NeighborhoodMap
          actions={NO_ACTIONS}
          selectedId={null}
          onSelect={noop}
          draft={location}
          onDraftChange={setLocation}
          home={home}
        />
      </div>
      <div className={styles.form}>
        <ActionForm location={location} action={action} onSaved={onSaved} onCancel={onCancel} />
      </div>
    </div>
  );
}
