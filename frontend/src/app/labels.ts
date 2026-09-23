// UI texts of the application shell (English). Each feature keeps its own labels.ts.
export const APP_LABELS = {
  brand: 'pioupiounades',
  tagline: 'Doing things together, close to home.',
  skipToContent: 'Skip to content',
  mainNav: 'Main navigation',
  mobileNav: 'Mobile navigation',
  footerNav: 'Legal pages',
  signIn: 'Sign in',
  signOut: 'Sign out',
  myProfile: 'My profile',
  nav: {
    home: 'Home',
    actions: 'Actions',
    map: 'Map',
    friends: 'Friends',
    profile: 'Profile',
  },
  pages: {
    home: {
      eyebrow: 'Your neighbourhood',
      title: 'Doing things together, close to home.',
      lead: 'Citizen actions near you: clean up, plant, share, meet your neighbours.',
      ctaActions: 'Browse actions',
      ctaJoin: 'Create an account',
    },
    login: { title: 'Sign in', soon: 'Sign-in is coming in the next ticket.' },
    terms: { title: 'Terms of Service' },
    privacy: { title: 'Privacy Policy' },
    notFound: { title: 'Page not found', lead: 'This address leads nowhere.', back: 'Back to home' },
    placeholder: 'This screen is coming in a future ticket.',
    legalPlaceholder: 'Content being written by the team.',
  },
} as const;
