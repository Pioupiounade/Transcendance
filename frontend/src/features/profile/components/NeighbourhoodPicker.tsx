import 'leaflet/dist/leaflet.css';
import { divIcon, type Marker as LeafletMarker } from 'leaflet';
import { useEffect, useMemo } from 'react';
import { AttributionControl, MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { iconMarkup } from '@/shared/ui';
import styles from './NeighbourhoodPicker.module.css';

export type PickedLocation = [number, number];

type NeighbourhoodPickerProps = {
  location: PickedLocation | null;
  onChange: (location: PickedLocation) => void;
  /** Libellé accessible de la carte. */
  label: string;
};

/* Mêmes réglages que la carte des actions (`features/actions/mapConfig.ts`), répétés ici : `actions` importe déjà
   `profile`, l'inverse ferait un cycle. Saint-Cyprien, Toulouse, quand rien n'est encore placé. */
const DEFAULT_CENTER: PickedLocation = [43.5985, 1.4265];
const DEFAULT_ZOOM = 14;
const FOCUS_ZOOM = 16;
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const PIN_SIZE = 49;

const pinIcon = divIcon({
  className: styles.pinWrap,
  html: `<span class="${styles.pin}">${iconMarkup('pin', 22)}</span>`,
  iconSize: [PIN_SIZE, PIN_SIZE],
  iconAnchor: [PIN_SIZE / 2, PIN_SIZE],
});

/** Un clic pose le pin. */
function ClickToPlace({ onChange }: { onChange: (location: PickedLocation) => void }) {
  useMapEvents({ click: (event) => onChange([event.latlng.lat, event.latlng.lng]) });
  return null;
}

/** La carte suit le pin quand il est posé ailleurs (géolocalisation, clic, glisser). */
function FollowPin({ location }: { location: PickedLocation | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo(location, Math.max(map.getZoom(), FOCUS_ZOOM), { duration: 0.6 });
  }, [map, location]);
  return null;
}

/**
 * Sélecteur de quartier : une carte OSM, un pin que l'on pose d'un clic ou que l'on glisse. La hauteur vient de
 * l'hôte (`--map-min-height`). La molette ne zoome pas : la carte vit dans un formulaire qui défile.
 */
export function NeighbourhoodPicker({ location, onChange, label }: NeighbourhoodPickerProps) {
  const handlers = useMemo(
    () => ({
      dragend: (event: { target: unknown }) => {
        const point = (event.target as LeafletMarker).getLatLng();
        onChange([point.lat, point.lng]);
      },
    }),
    [onChange],
  );

  return (
    <div className={styles.map} role="region" aria-label={label}>
      <MapContainer
        className={styles.canvas}
        center={location ?? DEFAULT_CENTER}
        zoom={location ? FOCUS_ZOOM : DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
        <ZoomControl position="topright" />
        <AttributionControl position="bottomleft" prefix={false} />
        <ClickToPlace onChange={onChange} />
        <FollowPin location={location} />
        {location && <Marker position={location} icon={pinIcon} draggable eventHandlers={handlers} />}
      </MapContainer>
    </div>
  );
}
