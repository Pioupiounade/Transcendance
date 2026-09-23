import 'leaflet/dist/leaflet.css';
import { divIcon, latLngBounds, type DivIcon, type Map as LeafletMap, type Marker as LeafletMarker } from 'leaflet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AttributionControl, MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet';
import { formatDateTime } from '@/shared/lib/formatDate';
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion';
import { Icon, iconMarkup } from '@/shared/ui';
import { ACTIONS_LABELS, CATEGORY_ICONS } from '../labels';
import { DEFAULT_CENTER, DEFAULT_ZOOM, FIT_PADDING, FOCUS_ZOOM, TILE_URL } from '../mapConfig';
import type { Action, Category, LatLng } from '../types';
import styles from './NeighborhoodMap.module.css';

type NeighborhoodMapProps = {
  /** Actions à afficher ; mémoïser la liste, elle pilote le recadrage. */
  actions: Action[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

type Locating = 'idle' | 'pending' | 'failed';

const text = ACTIONS_LABELS.map;
const PIN_SIZE = 49;
const YOU_SIZE = 20;

// Pins CSS (DESIGN.md §6) : évite les images PNG de Leaflet, cassées sous Vite.
const pinIcon = (category: Category, selected: boolean): DivIcon =>
  divIcon({
    className: styles.pinWrap,
    html: `<span class="${[styles.pin, styles[category.toLowerCase()], selected && styles.selected]
      .filter(Boolean)
      .join(' ')}">${iconMarkup(CATEGORY_ICONS[category], 22)}</span>`,
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE],
    popupAnchor: [0, -PIN_SIZE],
  });

// Un DivIcon par (catégorie, sélection) : Leaflet recrée le DOM du marqueur à chaque nouvelle instance.
const iconCache = new Map<string, DivIcon>();
const iconFor = (category: Category, selected: boolean): DivIcon => {
  const key = `${category}:${selected}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = pinIcon(category, selected);
    iconCache.set(key, icon);
  }
  return icon;
};

const hereIcon = divIcon({
  className: styles.pinWrap,
  html: `<span class="${styles.you}"></span>`,
  iconSize: [YOU_SIZE, YOU_SIZE],
  iconAnchor: [YOU_SIZE / 2, YOU_SIZE / 2],
});

/** Carte Leaflet des actions : pins par catégorie, sélection synchronisée, recadrage, position à la demande. */
export function NeighborhoodMap({ actions, selectedId, onSelect }: NeighborhoodMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const markers = useRef(new Map<string, LeafletMarker>());
  const [position, setPosition] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState<Locating>('idle');

  const fitToActions = useCallback(() => {
    if (!map) return;
    const animate = !prefersReducedMotion();
    if (actions.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate });
      return;
    }
    map.fitBounds(latLngBounds(actions.map((action) => action.location)), {
      padding: FIT_PADDING,
      maxZoom: FOCUS_ZOOM,
      animate,
    });
  }, [map, actions]);

  useEffect(() => {
    fitToActions();
  }, [fitToActions]);

  useEffect(() => {
    if (!map || selectedId === null) return;
    const marker = markers.current.get(selectedId);
    if (!marker) return;
    map.panTo(marker.getLatLng(), { animate: !prefersReducedMotion() });
    marker.openPopup();
  }, [map, selectedId]);

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setLocating('failed');
      return;
    }
    setLocating('pending');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const here: LatLng = [coords.latitude, coords.longitude];
        setPosition(here);
        setLocating('idle');
        map?.setView(here, FOCUS_ZOOM, { animate: !prefersReducedMotion() });
      },
      () => setLocating('failed'),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <div className={styles.map} role="region" aria-label={text.mapLabel}>
      <MapContainer
        ref={setMap}
        className={styles.canvas}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={TILE_URL} attribution={text.attribution} maxZoom={19} />
        <ZoomControl position="topright" />
        <AttributionControl position="bottomleft" prefix={false} />
        {actions.map((action) => (
          <Marker
            key={action.action_id}
            position={action.location}
            icon={iconFor(action.category, action.action_id === selectedId)}
            title={action.title}
            riseOnHover
            ref={(marker) => {
              if (marker) markers.current.set(action.action_id, marker);
              else markers.current.delete(action.action_id);
            }}
            eventHandlers={{
              click: () => onSelect(action.action_id),
              // Fermeture par l'utilisateur (croix, clic sur la carte) : on désélectionne.
              // Quand la sélection change, Leaflet ferme l'ancien popup : `selectedId` vaut déjà
              // le nouvel id, la condition protège la nouvelle sélection.
              popupclose: () => {
                if (selectedId === action.action_id) onSelect(null);
              },
            }}
          >
            <Popup>
              <span className={styles.popupTitle}>{action.title}</span>
              <span className={styles.popupMeta}>{formatDateTime(action.scheduled_at)}</span>
            </Popup>
          </Marker>
        ))}
        {position && <Marker position={position} icon={hereIcon} title={text.youAreHere} interactive={false} />}
      </MapContainer>

      <div className={styles.tools}>
        <span className={styles.tag}>
          <span className={styles.live} aria-hidden="true" />
          {text.nearby(actions.length)}
        </span>
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.control} onClick={fitToActions} aria-label={text.recenter}>
          <Icon name="target" />
        </button>
        <button
          type="button"
          className={styles.control}
          onClick={locate}
          disabled={locating === 'pending'}
          aria-label={locating === 'pending' ? text.locating : text.locate}
        >
          <Icon name="pin" />
        </button>
      </div>

      <p className={styles.status} role="status">
        {locating === 'pending' && text.locating}
        {locating === 'failed' && text.locateUnavailable}
      </p>
    </div>
  );
}
