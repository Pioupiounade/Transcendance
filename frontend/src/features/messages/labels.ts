// UI texts of the messaging feature (English).
export const MESSAGES_LABELS = {
  title: 'Messages',
  entry: 'Messages',
  entryUnread: (count: number) => `Messages, ${count} new`,
  conversations: 'Conversations',
  dock: {
    open: 'Open messages',
    close: 'Close messages',
    fullPage: 'Open the messages page',
  },
  backToList: 'All conversations',
  viewProfile: 'View profile',
  pickFriend: {
    title: 'Pick a neighbour',
    text: 'Your conversations with friends live here. Choose someone on the left to start chatting.',
  },
  noFriends: {
    title: 'No friends yet',
    text: 'Messages are between friends. Add neighbours from the Friends page, then come back here.',
    cta: 'Go to Friends',
  },
  unknownFriend: 'This neighbour is not in your friends, so there is no conversation to show.',
  loading: 'Loading…',
  loadFailed: 'Messages could not be loaded. Check your connection and try again.',
  retry: 'Try again',
  emptyThread: (name: string) => `Say hello to ${name}. Messages are kept for 60 days.`,
  composer: {
    placeholder: 'Write a message…',
    label: 'Your message',
    send: 'Send',
    counter: (length: number, max: number) => `${length}/${max}`,
    hint: 'Enter to send, Shift+Enter for a new line.',
  },
  errors: {
    empty: 'Write something first.',
    tooLong: (max: number) => `Keep it under ${max} characters.`,
    notFriends: 'You can only message active friends.',
    sendFailed: 'The message was not sent. Try again.',
  },
  day: {
    today: 'Today',
    yesterday: 'Yesterday',
  },
  unknownUser: 'Neighbour',
} as const;
