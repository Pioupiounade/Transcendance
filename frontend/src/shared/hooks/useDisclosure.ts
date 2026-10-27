import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

/**
 * Bouton qui déplie un petit panneau (motif « disclosure ») : `open`, bascule, fermeture par Échap (le focus revient
 * sur le bouton) ou par un tap en dehors de `root`. L'appelant pose `root` et `onKeyDown` sur le conteneur, `trigger`
 * sur le bouton (avec `aria-expanded` / `aria-controls`), et ne rend le panneau que quand `open` est vrai.
 */
export function useDisclosure() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    setOpen(false);
    trigger.current?.focus();
  };

  return {
    open,
    toggle: () => setOpen((value) => !value),
    close: () => setOpen(false),
    root,
    trigger,
    onKeyDown,
  };
}
