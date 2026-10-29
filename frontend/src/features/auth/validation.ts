import { AUTH_LABELS } from './labels';

/** Miroir de `CreateUserDto` / `LoginDto` côté backend (`@MinLength(8)`). */
export const PASSWORD_MIN_LENGTH = 8;
/** Plafond choisi côté client (le DTO n'en a pas) : une saisie sans fin n'a pas de sens pour un mot de passe. */
export const PASSWORD_MAX_LENGTH = 64;
/** `@IsEmail()` (validator.js) : 254 caractères au plus, 64 avant le `@` ; au-delà le backend répond 400. */
export const EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_MAX_LENGTH = 64;

// Miroir de `@IsEmail()` (validator.js 13, options par défaut), sans la forme entre guillemets ("a b"@x.fr) que
// personne ne saisit. Un e-mail accepté ici l'est par le backend ; un refus ici évite un 400 (= erreur console).
// Partie locale, morceau entre deux points : lettres, chiffres, symboles usuels, lettres non latines.
const LOCAL_PIECE = /^[a-z\d!#$%&'*+\-/=?^_`{|}~\u00A1-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+$/i;
// Étiquette de domaine : lettres, chiffres, tirets ; ni pleine chasse (ｂ), ni `_`.
const DOMAIN_LABEL = /^[a-z\d\u00A1-\uFF00\uFF5F-\uFFFF-]+$/i;
const DOMAIN_LABEL_MAX_LENGTH = 63;
// Extension : lettres seules, deux au moins (.fr, .com, .test), ou punycode (xn--…). Un chiffre (.v1) est refusé.
const TLD = /^([a-z\u00A1-\u00A8\u00AA-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}|xn[a-z\d-]{2,})$/i;
const WHITESPACE = /\s/;

const isDomainLabel = (label: string): boolean =>
  label.length > 0 &&
  label.length <= DOMAIN_LABEL_MAX_LENGTH &&
  DOMAIN_LABEL.test(label) &&
  !label.startsWith('-') &&
  !label.endsWith('-');

/** Forme générale : une partie locale, un seul `@`, un domaine d'au moins deux étiquettes. L'extension est jugée à part. */
const splitEmail = (email: string): { local: string; labels: string[] } | null => {
  const at = email.indexOf('@');
  if (at < 1 || at !== email.lastIndexOf('@')) return null;
  const local = email.slice(0, at);
  const labels = email.slice(at + 1).split('.');
  if (!local.split('.').every((piece) => LOCAL_PIECE.test(piece))) return null;
  if (labels.length < 2 || !labels.every(isDomainLabel)) return null;
  return { local, labels };
};
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
  const parts = splitEmail(email);
  if (parts === null) return t.emailInvalid;
  if (!TLD.test(parts.labels[parts.labels.length - 1])) return t.emailEnding;
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
