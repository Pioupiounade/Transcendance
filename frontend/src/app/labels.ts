import { BRAND_NAME } from '@/shared/lib/pageTitle';

// UI texts of the application shell (English). Each feature keeps its own labels.ts.
export const APP_LABELS = {
  brand: BRAND_NAME,
  tagline: 'Doing things together, close to home.',
  skipToContent: 'Skip to content',
  mainNav: 'Main navigation',
  mobileNav: 'Mobile navigation',
  footerNav: 'Legal pages',
  signIn: 'Sign in',
  signOut: 'Sign out',
  myProfile: 'My profile',
  admin: 'Admin',
  nav: {
    home: 'Home',
    actions: 'My Actions',
    map: 'Map',
    organizations: 'Organizations',
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
    landing: {
      eyebrow: 'Your neighbourhood',
      title: 'Doing things together, close to home.',
      lead: 'Turn everyday moments into neighborhood action.',
      ctaJoin: 'Create an account',
      ctaExplore: 'Explore the map',
      trust: ['Local actions', 'Nearby neighbors', 'Verified organizers'],
      photo: {
        badge: (count: number) => `${count} open action${count === 1 ? '' : 's'}`,
        kicker: 'Right now',
        title: 'A square, a market, your neighbours.',
        cta: 'See what is on',
      },
      how: {
        eyebrow: 'How it works',
        title: 'Three quick steps',
        steps: [
          {
            title: 'Discover',
            body: 'Browse the actions happening close to you and find what matches your rhythm.',
          },
          {
            title: 'Join',
            body: 'Confirm your place in one click and bring your energy to the next local effort.',
          },
          {
            title: 'Act together',
            body: 'Meet neighbors, share a task, and make your street feel alive again.',
          },
        ],
      },
      live: {
        eyebrow: 'This week',
        title: 'Live in your neighborhood',
        lead: 'Fresh actions are popping up nearby.',
        upcoming: 'Upcoming',
        loading: 'Loading actions…',
        error: 'We could not load the live neighborhood feed.',
        retry: 'Retry',
        empty: 'No action is planned nearby right now.',
        cta: 'Open the map',
      },
      categories: {
        eyebrow: 'What you can do',
        title: 'Ideas for everyday impact',
        items: {
          ENVIRONMENT: 'Clean, green, and repair the places you live in.',
          SOCIAL: 'Meet new people and build stronger local ties.',
          CULTURAL: 'Share skills, culture, and moments of wonder together.',
        },
      },
      closing: {
        title: 'Ready to take part?',
        lead: 'Join your neighbors and help shape the next local initiative.',
        cta: 'Create your account',
        signIn: 'Already have an account? Sign in',
      },
    },
    dashboard: {
      eyebrow: 'Your neighbourhood',
      greeting: (name: string) => `Hello ${name}`,
      lead: 'Everything happening around you, in one place.',
      exploring: 'Exploring',
      openMap: 'Open map',
      homeArea: 'Your neighborhood',
      defaultArea: 'Close to you',
      privacy: 'Private area',
      motto: 'Small actions, big neighborhood impact.',
      anonymousName: 'Neighbour',
      agenda: {
        title: 'My agenda',
        loading: 'Loading your agenda…',
        error: 'Unable to load your agenda.',
        empty: 'No action planned yet.',
        emptyLead: 'Suggest a new action or join one nearby.',
        organiser: 'Organizer',
        participant: 'Participant',
        more: (count: number) => `+${count} more`,
      },
      note: {
        title: 'Why this matters',
        body: 'Local actions are easier to join when you can see what is happening around you.',
      },
      nearby: {
        title: 'Near you',
        lead: 'Open actions around you, sorted by distance.',
        loading: 'Loading nearby actions…',
        error: 'Unable to load nearby actions.',
        retry: 'Retry',
        empty: 'No nearby action right now.',
        openMap: 'Open map',
      },
      suggest: 'Suggest an action',
      gauge: {
        label: 'On your agenda',
        of: (total: number) => `of ${total} open nearby`,
      },
    },
    terms: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: September 2026',
      intro:
        'Welcome to Pioupiounades. Many local initiatives exist but remain invisible. Our mission is to connect neighbors, local associations, and independent shops so everyone can discover, join, and act together close to home. By using Pioupiounades, you agree to these Terms of Service.',
      sections: [
        {
          heading: '1. Mission & Core Values',
          content:
            'Pioupiounades facilitates local citizen initiatives based on four pillars: Proximity (walking distance actions), Simplicity (one-click participation), Kindness (embellishing, repairing, and sharing), and Local Impact (we are all neighbors). Users engage in community projects to strengthen neighborhood life.',
        },
        {
          heading: '2. User Registration & Eligibility',
          content:
            'To create citizen actions, RSVP to initiatives, or message fellow neighbors, you must maintain an active account. You agree to provide authentic profile details and protect your account credentials. Actions can be proposed by residents, non-profit associations, or local shops.',
        },
        {
          heading: '3. Community Conduct & Benevolence',
          content:
            'All interactions must remain respectful and constructive. Harassment, vandalism incitement, hate speech, commercial spam, and unsafe activities are strictly prohibited. Moderators and administrators reserve the right to suspend or ban any account that violates neighborhood community standards.',
        },
        {
          heading: '4. Voluntary Participation & Limitation of Liability',
          content:
            'Pioupiounades operates purely as a neighborhood coordination and communication platform. We do not provide physical supervision, site inspections, or insurance coverage for on-site events. Participation in any cleanup, gardening, or local meetup occurs entirely at your own risk. Always exercise common sense and follow local safety regulations.',
        },
        {
          heading: '5. Photos & User-Generated Content',
          content:
            'Users and organizers can post photos to illustrate project ideas and document before-and-after results. You retain rights to your pictures but grant Pioupiounades permission to display them across the platform to inspire other neighbors. Do not upload photos infringing on copyright or individual privacy.',
        },
        {
          heading: '6. Account Termination & Self-Service Deletion',
          content:
            'You may leave the platform at any time. Using the account deletion feature in your Profile settings permanently wipes your profile, authentication data, and account records from our servers.',
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: September 2026',
      intro:
        'At Pioupiounades, protecting your personal data and honoring your local privacy is central to our values. This Privacy Policy details how we handle your information in full compliance with the General Data Protection Regulation (GDPR).',
      sections: [
        {
          heading: '1. What We Collect',
          content:
            'We collect only what is strictly necessary to run the neighborhood network: your chosen username, email address, securely hashed password (plain-text passwords are never stored), optional biography, avatar, and photos uploaded to document citizen actions.',
        },
        {
          heading: '2. Location & Neighborhood Privacy',
          content:
            'Your neighborhood or coordinates are used strictly for internal spatial proximity queries (finding initiatives within walking distance). Your exact real-time location is never sold, shared with advertisers, or displayed publicly to other users.',
        },
        {
          heading: '3. Community Media & Uploaded Photos',
          content:
            'Images uploaded to showcase before-and-after improvements, report spots to beautify, or personalize your profile are stored securely with strict size and format validation. They are used exclusively to illustrate community projects.',
        },
        {
          heading: '4. Messaging & Neighborhood Notifications',
          content:
            'Direct messaging is restricted to accepted friends or fellow action participants. Notifications regarding upcoming events, reminders, comments, and project updates are sent solely to keep you informed of activities you opted into.',
        },
        {
          heading: '5. Your GDPR Rights & Erasure',
          content:
            'You have full control over your personal data: the right to access, rectify, or permanently erase your profile. Deleting your account through your profile settings immediately and irreversibly removes your personal information from our active database.',
        },
        {
          heading: '6. Security & Cookies',
          content:
            'We utilize only functional session authentication cookies required for technical operation. All traffic between your browser and our backend is encrypted in transit using industry-standard HTTPS and secure WebSocket connections.',
        },
      ],
    },
    notFound: { title: 'Page not found', lead: 'This address leads nowhere.', back: 'Back to home' },
    loading: 'Loading…',
    placeholder: 'This screen is coming in a future ticket.',
    legalPlaceholder: 'Content being written by the team.',
  },
} as const;