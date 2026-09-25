import type { FieldShellProps } from './FieldShell';

/** Attributs à poser sur le contrôle pour qu'il soit relié au libellé et au message. */
export const fieldA11y = ({ id, error, help }: FieldShellProps) => ({
  id,
  placeholder: ' ',
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error || help ? `${id}-help` : undefined,
});
