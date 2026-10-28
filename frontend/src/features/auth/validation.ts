import { AUTH_LABELS } from './labels';

/** Miroir de `CreateUserDto` / `LoginDto` côté backend (`@MinLength(8)`). */
export const PASSWORD_MIN_LENGTH = 8;
/** Plafond choisi côté client (le DTO n'en a pas) : une saisie sans fin n'a pas de sens pour un mot de passe. */
export const PASSWORD_MAX_LENGTH = 64;
/** `@IsEmail()` (validator.js) : 254 caractères au plus, 64 avant le `@` ; au-delà le backend répond 400. */
export const EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_MAX_LENGTH = 64;

// Même exigence que `@IsEmail()` pour l'usage courant : quelque chose, @, domaine avec un point.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHITESPACE = /\s/;
// Strict (décision du 28/10/2026) : lettres, chiffres et symboles ASCII imprimables ; ni espace, ni accent, ni emoji,
// qui changent selon le clavier ou la normalisation Unicode et finissent en « mauvais mot de passe ».
const PASSWORD_CHARSET = /^[\x21-\x7E]+$/;

const t = AUTH_LABELS.validation;

export const validateEmail = (value: string): string | null => {
  const email = value.trim();
  if (email === '') return t.emailRequired;
  if (WHITESPACE.test(email)) return t.emailNoSpaces;
  if (email.length > EMAIL_MAX_LENGTH) return t.emailTooLong(EMAIL_MAX_LENGTH);
  if (email.indexOf('@') > EMAIL_LOCAL_MAX_LENGTH) return t.emailLocalTooLong(EMAIL_LOCAL_MAX_LENGTH);
  if (!EMAIL_PATTERN.test(email)) return t.emailInvalid;
  return null;
};

/** Connexion et inscription suivent la même règle : un mot de passe refusé ici n'a jamais pu être enregistré. */
export const validatePassword = (value: string): string | null => {
  if (value === '') return t.passwordRequired;
  if (WHITESPACE.test(value)) return t.passwordNoSpaces;
  if (value.length < PASSWORD_MIN_LENGTH) return t.passwordTooShort(PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH - value.length);
  if (value.length > PASSWORD_MAX_LENGTH) return t.passwordTooLong(PASSWORD_MAX_LENGTH);
  if (!PASSWORD_CHARSET.test(value)) return t.passwordCharset;
  return null;
};

/** Inscription : la règle du DTO, expliquée (même forme que la connexion). */
export const validateNewPassword = validatePassword;

export const validateConsent = (checked: boolean): string | null => (checked ? null : t.consentRequired);
