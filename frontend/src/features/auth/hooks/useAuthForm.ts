import { useState, type FormEvent } from 'react';
import { toAuthErrorMessage } from '../errors';

type Values = Record<string, string | boolean>;

type Validators<T extends Values> = { [K in keyof T]?: (value: T[K]) => string | null };

/**
 * État d'un formulaire d'auth : valeurs, erreurs de validation (affichées après blur ou soumission),
 * erreur serveur, envoi en cours. À la soumission : validation complète, focus sur le premier champ
 * invalide (les `id` des champs = leurs noms), sinon `submit(values)`.
 */
export function useAuthForm<T extends Values>(
  initial: T,
  validators: Validators<T>,
  submit: (values: T) => Promise<void>,
) {
  const [values, setValues] = useState<T>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors: Partial<Record<keyof T, string>> = {};
  for (const name of Object.keys(validators) as (keyof T)[]) {
    const message = validators[name]?.(values[name]);
    if (message) errors[name] = message;
  }

  const setValue = <K extends keyof T>(name: K, value: T[K]) => setValues((current) => ({ ...current, [name]: value }));

  const touch = (name: keyof T) => setTouched((current) => ({ ...current, [name]: true }));

  /** Erreur à afficher pour un champ : seulement une fois le champ quitté ou le formulaire soumis. */
  const errorOf = (name: keyof T): string | null => (touched[name] || submitted ? (errors[name] ?? null) : null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      await submit(values);
    } catch (error) {
      setServerError(toAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return { values, setValue, touch, errorOf, serverError, submitting, handleSubmit };
}
