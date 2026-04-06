// ── Card engine ──────────────────────────────────────────────────────────────
// Positions: 0=South (player), 1=West (computer), 2=North (computer), 3=East (computer)
// In 2-player mode the computer controls positions 1, 2, 3.

const SUITS = ['♣', '♦', '♥', '♠'];
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

// Higher index = higher rank
const RANK_ORDER = {};
RANKS.forEach((r, i) => { RANK_ORDER[r] = i; });

// Suit display color
function suitColor(suit) {
  return (suit === '♥' || suit === '♦') ? 'red' : 'black';
}

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Returns { hands: [south, west, north, east] } each array of 13 cards
function deal(deck) {
  return [
    deck.slice(0, 13),
    deck.slice(13, 26),
    deck.slice(26, 39),
    deck.slice(39, 52),
  ];
}

// Returns the index (0-3) of the card in `trick` that wins
// trick: array of { card, player } objects in play order
// ledSuit: suit of first card played
// trumpSuit: trump suit string, or null for NT
function trickWinner(trick, ledSuit, trumpSuit) {
  let winIdx = 0;
  let winCard = trick[0].card;

  for (let i = 1; i < trick.length; i++) {
    const c = trick[i].card;
    const w = winCard;
    const cIsTrump = trumpSuit && c.suit === trumpSuit;
    const wIsTrump = trumpSuit && w.suit === trumpSuit;

    if (cIsTrump && !wIsTrump) {
      // c trumps w
      winIdx = i; winCard = c;
    } else if (cIsTrump && wIsTrump) {
      // both trump — higher trump wins
      if (RANK_ORDER[c.rank] > RANK_ORDER[w.rank]) { winIdx = i; winCard = c; }
    } else if (!cIsTrump && !wIsTrump && c.suit === ledSuit && w.suit !== ledSuit) {
      // c followed suit, w didn't (and no trump) — c wins
      winIdx = i; winCard = c;
    } else if (c.suit === w.suit && RANK_ORDER[c.rank] > RANK_ORDER[w.rank]) {
      // same suit, higher rank wins
      winIdx = i; winCard = c;
    }
  }

  return winIdx;
}

// Returns legal cards from hand given what's been led (null if leading)
function legalPlays(hand, ledSuit) {
  if (!ledSuit) return hand.slice(); // leading — any card
  const followed = hand.filter(c => c.suit === ledSuit);
  return followed.length > 0 ? followed : hand.slice();
}

// Calculate HCP for a hand
function countHCP(hand) {
  let hcp = 0;
  for (const c of hand) {
    if (c.rank === 'A') hcp += 4;
    else if (c.rank === 'K') hcp += 3;
    else if (c.rank === 'Q') hcp += 2;
    else if (c.rank === 'J') hcp += 1;
  }
  return hcp;
}

// Return the suit with the most cards (for bidding)
function longestSuit(hand) {
  const counts = {};
  for (const s of SUITS) counts[s] = 0;
  for (const c of hand) counts[c.suit]++;
  return SUITS.reduce((a, b) => counts[a] >= counts[b] ? a : b);
}

// Sort hand by suit then rank (for display)
function sortHand(hand) {
  const suitOrder = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 };
  return hand.slice().sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
    return RANK_ORDER[b.rank] - RANK_ORDER[a.rank];
  });
}

function cardLabel(card) {
  return card.rank + card.suit;
}
