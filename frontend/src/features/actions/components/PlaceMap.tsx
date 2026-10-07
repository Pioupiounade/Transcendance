import 'leaflet/dist/leaflet.css';
import { divIcon } from 'leaflet';
import { useMemo } from 'react';
import { AttributionControl, MapContainer, Marker, TileLayer, ZoomControl } from 'react-leaflet';
import { iconMarkup, type IconName } from '@/shared/ui';
import { ACTIONS_LABELS } from '../labels';
import { FOCUS_ZOOM, TILE_URL } from '../mapConfig';
import type { LatLng } from '../types';
// Même habillage que la grande carte (cadre, tuiles adoucies, pin) : une seule feuille pour les deux.
import styles from './NeighborhoodMap.module.css';

type PlaceMapProps = {
  location: LatLng;
  /** Nom du lieu : sert au libellé accessible de la carte et au survol du pin. */
  name: string;
  icon?: IconName;
};

const PIN_SIZE = 49;

const placeIcon = (icon: IconName) =>
  divIcon({
    className: styles.pinWrap,
    html: `<span class="${styles.pin}">${iconMarkup(icon, 22)}</span>`,
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE],
  });

/**
 * Mini-carte d'un lieu : un seul pin, centré, sans sélection ni géolocalisation. La hauteur vient de l'hôte
 * (`--map-min-height*`, comme `NeighborhoodMap`). La molette ne zoome pas : la carte vit dans une page qui défile.
 */
export function PlaceMap({ location, name, icon = 'pin' }: PlaceMapProps) {
  // Une instance par icône : Leaflet recrée le DOM du marqueur à chaque nouveau DivIcon.
  const pin = useMemo(() => placeIcon(icon), [icon]);

  return (
    <div className={styles.map} role="region" aria-label={ACTIONS_LABELS.map.placeLabel(name)}>
      <MapContainer
        // `center` n'est lu qu'au montage : un autre lieu = une autre carte.
        key={location.join(',')}
        className={styles.canvas}
        center={location}
        zoom={FOCUS_ZOOM}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer url={TILE_URL} attribution={ACTIONS_LABELS.map.attribution} maxZoom={19} />
        <ZoomControl position="topright" />
        <AttributionControl position="bottomleft" prefix={false} />
        <Marker position={location} icon={pin} title={name} interactive={false} keyboard={false} />
      </MapContainer>
    </div>
  );
}
