// The colours a ritual can be painted in. Shared by the forms that offer
// them, the context that validates them and the backup that restores them.
export const HABIT_COLORS = [
  { id: 'gold', label: 'Gold', hex: '#F2B705' },
  { id: 'teal', label: 'Teal', hex: '#2DD4BF' },
  { id: 'rose', label: 'Rose', hex: '#FB7185' },
  { id: 'violet', label: 'Violet', hex: '#A78BFA' },
  { id: 'sky', label: 'Sky', hex: '#38BDF8' },
  { id: 'lime', label: 'Lime', hex: '#A3E635' },
];

// The reason the ritual is on the board at all.
//
// A name says what to do and nothing about why it is worth doing, and on a
// bad Tuesday the why is the only part that argues for getting up. It is a
// sentence rather than an essay — short enough to be read in the half second
// somebody spends on the card before deciding, and short enough to sit on
// one line next to the name.
export const WHY_LIMIT = 80;
