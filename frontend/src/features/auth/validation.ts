import { AUTH_LABELS } from './labels';

/** Miroir de `CreateUserDto` / `LoginDto` côté backend (`@MinLength(8)`). */
export const PASSWORD_MIN_LENGTH = 8;

// Même exigence que `@IsEmail()` pour l'usage courant : quelque chose, @, domaine avec un point.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const t = AUTH_LABELS.validation;

export const validateEmail = (value: string): string | null => {
  const email = value.trim();
  if (email === '') return t.emailRequired;
  if (!EMAIL_PATTERN.test(email)) return t.emailInvalid;
  return null;
};

/** Connexion : même contrainte de longueur que le DTO backend. */
export const validatePassword = (value: string): string | null => {
  if (value === '') return t.passwordRequired;

  if (value.length < PASSWORD_MIN_LENGTH) {
    return t.passwordTooShort(
      PASSWORD_MIN_LENGTH,
      PASSWORD_MIN_LENGTH - value.length,
    );
  }

  return null;
};

/** Inscription : la règle du DTO, expliquée. */
export const validateNewPassword = (value: string): string | null => {
  if (value === '') return t.passwordRequired;
  if (value.length < PASSWORD_MIN_LENGTH) return t.passwordTooShort(PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH - value.length);
  return null;
};

export const validateConsent = (checked: boolean): string | null => (checked ? null : t.consentRequired);
