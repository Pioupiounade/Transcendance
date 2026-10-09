import 'leaflet/dist/leaflet.css';
import {
  divIcon,
  latLngBounds,
  type DivIcon,
  type LeafletMouseEvent,
  type Map as LeafletMap,
  type Marker as LeafletMarker,
} from 'leaflet';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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
  /** Brouillon d'action : pin déplaçable au lieu donné ; `null` = aucun. */
  draft?: LatLng | null;
  /**
   * Présent = un clic sur la carte (hors pin, hors popup ouvert) place ou déplace le brouillon ;
   * reçoit aussi la position après un glisser. Jamais appelé avec `null` par la carte : le parent décide.
   */
  onDraftChange?: (location: LatLng) => void;
  /** Boutons du popup du brouillon (le titre et l'aide sont fournis par la carte) ; absent = pin sans popup. */
  draftContent?: ReactNode;
};

type Locating = 'idle' | 'pending' | 'failed';

const text = ACTIONS_LABELS.map;
const create = ACTIONS_LABELS.create;
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

const draftIcon = divIcon({
  className: styles.pinWrap,
  html: `<span class="${styles.pin} ${styles.draft}">${iconMarkup('plus', 22)}</span>`,
  iconSize: [PIN_SIZE, PIN_SIZE],
  iconAnchor: [PIN_SIZE / 2, PIN_SIZE],
  popupAnchor: [0, -PIN_SIZE],
});

const hereIcon = divIcon({
  className: styles.pinWrap,
  html: `<span class="${styles.you}"></span>`,
  iconSize: [YOU_SIZE, YOU_SIZE],
  iconAnchor: [YOU_SIZE / 2, YOU_SIZE / 2],
});

/** Carte Leaflet des actions : pins par catégorie, sélection synchronisée, recadrage, position à la demande. */
export function NeighborhoodMap({
  actions,
  selectedId,
  onSelect,
  draft = null,
  onDraftChange,
  draftContent,
}: NeighborhoodMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const markers = useRef(new Map<string, LeafletMarker>());
  const draftMarker = useRef<LeafletMarker | null>(null);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState<Locating>('idle');

  // Lu dans `fitToActions` sans en être une dépendance : déplacer le pin ne recadre pas la carte.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const fitToActions = useCallback(() => {
    if (!map) return;
    const animate = !prefersReducedMotion();
    if (actions.length === 0) {
      // Sans action à cadrer, le brouillon (sélecteur de lieu, modification) donne le centre.
      const spot = draftRef.current;
      if (spot) map.setView(spot, FOCUS_ZOOM, { animate });
      else map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate });
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

  // Leaflet ne surveille que la fenêtre : quand l'hôte change la taille du conteneur (rangée qui grandit avec les
  // cartes voisines, panneau replié), la carte recalcule la sienne, sinon des tuiles manquent sur la zone gagnée.
  useEffect(() => {
    if (!map) return;
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  // `actions` en dépendance : une sélection posée avant un rechargement de la liste (action tout juste
  // créée) s'ouvre quand son marqueur apparaît.
  useEffect(() => {
    if (!map || selectedId === null) return;
    const marker = markers.current.get(selectedId);
    if (!marker) return;
    map.panTo(marker.getLatLng(), { animate: !prefersReducedMotion() });
    marker.openPopup();
  }, [map, selectedId, actions]);

  // Clic sur le fond de carte. Leaflet ferme d'abord le popup ouvert (`preclick`) : à cet instant
  // `selectedId` vaut encore l'ancienne sélection, le clic ne sert alors qu'à fermer.
  useEffect(() => {
    if (!map || !onDraftChange) return;
    const place = ({ latlng }: LeafletMouseEvent) => {
      if (selectedId !== null) return;
      onDraftChange([latlng.lat, latlng.lng]);
    };
    map.on('click', place);
    return () => {
      map.off('click', place);
    };
  }, [map, onDraftChange, selectedId]);

  // Le popup du brouillon s'ouvre à chaque placement ou déplacement, et au premier rendu de la carte
  // (les marqueurs n'existent qu'une fois `map` prête).
  useEffect(() => {
    if (map && draft) draftMarker.current?.openPopup();
  }, [map, draft]);

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
        {draft && (
          <Marker
            ref={draftMarker}
            position={draft}
            icon={draftIcon}
            title={text.draftPin}
            draggable
            zIndexOffset={1000}
            eventHandlers={{
              dragend: (event) => {
                const { lat, lng } = (event.target as LeafletMarker).getLatLng();
                onDraftChange?.([lat, lng]);
              },
            }}
          >
            {draftContent && (
              <Popup closeButton={false}>
                <div className={styles.draftPopup}>
                  <span className={styles.popupTitle}>{create.popupTitle}</span>
                  <span className={styles.popupMeta}>{create.popupHint}</span>
                  {draftContent}
                </div>
              </Popup>
            )}
          </Marker>
        )}
      </MapContainer>

      <div className={styles.tools}>
        {actions.length > 0 && (
          <span className={styles.tag}>
            <span className={styles.live} aria-hidden="true" />
            {text.nearby(actions.length)}
          </span>
        )}
        {onDraftChange && !draft && (
          <span className={styles.tag}>
            <Icon name="plus" size={14} strokeWidth={2.4} />
            {text.hint}
          </span>
        )}
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
