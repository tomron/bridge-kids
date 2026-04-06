// ── Computer AI ──────────────────────────────────────────────────────────────

// Main dispatcher — picks a card for the computer
function aiPlayCard(hand, trick, gs) {
  const legal = legalPlays(hand, trick.length > 0 ? trick[0].card.suit : null);
  if (gs.difficulty === 'easy') return playRandom(legal);
  if (gs.difficulty === 'medium') return playMedium(hand, legal, trick, gs);
  return playHard(hand, legal, trick, gs);
}

// ── Easy: random ─────────────────────────────────────────────────────────────
function playRandom(legal) {
  return legal[Math.floor(Math.random() * legal.length)];
}

// ── Medium heuristics ────────────────────────────────────────────────────────
function playMedium(hand, legal, trick, gs) {
  const ledSuit = trick.length > 0 ? trick[0].card.suit : null;
  const trump = gs.contract ? gs.contract.suit : null;

  // Leading a trick
  if (!ledSuit) {
    return leadMedium(hand, trump);
  }

  // Must follow suit or void
  const following = legal.filter(c => c.suit === ledSuit);
  if (following.length > 0) {
    // Find current winning card in trick
    const currentWinnerIdx = trickWinner(trick, ledSuit, trump);
    const winnerCard = trick[currentWinnerIdx].card;
    // Cover honor: play lowest card that beats current winner
    const beaters = following.filter(c => RANK_ORDER[c.rank] > RANK_ORDER[winnerCard.rank]);
    if (beaters.length > 0) {
      return beaters.reduce((a, b) => RANK_ORDER[a.rank] < RANK_ORDER[b.rank] ? a : b);
    }
    // Can't beat — play lowest
    return following.reduce((a, b) => RANK_ORDER[a.rank] < RANK_ORDER[b.rank] ? a : b);
  }

  // Void in led suit — consider trumping
  if (trump) {
    const trumpCards = legal.filter(c => c.suit === trump);
    if (trumpCards.length > 0) {
      // Check if playing trump wins the trick
      const currentWinnerIdx = trickWinner(trick, ledSuit, trump);
      const winnerCard = trick[currentWinnerIdx].card;
      const winnerIsTrump = winnerCard.suit === trump;
      if (!winnerIsTrump) {
        // Trump to win
        return trumpCards.reduce((a, b) => RANK_ORDER[a.rank] < RANK_ORDER[b.rank] ? a : b);
      }
    }
  }
  // Discard lowest from shortest suit
  return legal.reduce((a, b) => RANK_ORDER[a.rank] < RANK_ORDER[b.rank] ? a : b);
}

function leadMedium(hand, trump) {
  // Lead lowest from longest non-trump suit
  const nonTrump = hand.filter(c => c.suit !== trump);
  const src = nonTrump.length > 0 ? nonTrump : hand;
  const suits = {};
  for (const c of src) suits[c.suit] = (suits[c.suit] || []).concat(c);
  const longest = Object.values(suits).reduce((a, b) => a.length >= b.length ? a : b);
  return longest.reduce((a, b) => RANK_ORDER[a.rank] < RANK_ORDER[b.rank] ? a : b);
}

// ── Hard heuristics ──────────────────────────────────────────────────────────
function playHard(hand, legal, trick, gs) {
  const ledSuit = trick.length > 0 ? trick[0].card.suit : null;
  const trump = gs.contract ? gs.contract.suit : null;

  if (!ledSuit) {
    return leadHard(hand, trump, gs);
  }

  const following = legal.filter(c => c.suit === ledSuit);
  if (following.length > 0) {
    const currentWinnerIdx = trickWinner(trick, ledSuit, trump);
    const winnerCard = trick[currentWinnerIdx].card;
    const beaters = following.filter(c => RANK_ORDER[c.rank] > RANK_ORDER[winnerCard.rank]);
    if (beaters.length > 0) {
      return beaters.reduce((a, b) => RANK_ORDER[a.rank] < RANK_ORDER[b.rank] ? a : b);
    }
    return following.reduce((a, b) => RANK_ORDER[a.rank] < RANK_ORDER[b.rank] ? a : b);
  }

  // Void — trump or discard
  if (trump) {
    const trumpCards = legal.filter(c => c.suit === trump);
    if (trumpCards.length > 0) {
      const currentWinnerIdx = trickWinner(trick, ledSuit, trump);
      const winnerCard = trick[currentWinnerIdx].card;
      if (winnerCard.suit !== trump) {
        return trumpCards.reduce((a, b) => RANK_ORDER[a.rank] < RANK_ORDER[b.rank] ? a : b);
      }
    }
  }
  // Discard from weakest suit
  return legal.reduce((a, b) => RANK_ORDER[a.rank] < RANK_ORDER[b.rank] ? a : b);
}

function leadHard(hand, trump, gs) {
  // Count sure tricks in each suit, lead to establish
  const nonTrump = hand.filter(c => c.suit !== trump);
  if (nonTrump.length === 0) return hand[0];

  // Lead from longest suit (establishing)
  const suits = {};
  for (const c of nonTrump) suits[c.suit] = (suits[c.suit] || []).concat(c);
  const sorted = Object.values(suits).sort((a, b) => b.length - a.length);
  const longSuit = sorted[0];

  // If we have A or K, lead it; otherwise lead low (finesse position)
  const honors = longSuit.filter(c => c.rank === 'A' || c.rank === 'K');
  if (honors.length > 0) {
    return honors.reduce((a, b) => RANK_ORDER[a.rank] > RANK_ORDER[b.rank] ? a : b);
  }
  // Lead low to finesse
  return longSuit.reduce((a, b) => RANK_ORDER[a.rank] < RANK_ORDER[b.rank] ? a : b);
}

// ── Bidding AI ───────────────────────────────────────────────────────────────

// Returns a bid object { level, suit } or 'pass' or 'double' or 'redouble'
function aiBid(hand, auction, position, gs) {
  if (gs.difficulty === 'easy') return 'pass';
  if (gs.difficulty === 'medium') return aiBidMedium(hand, auction);
  return aiBidHard(hand, auction, position);
}

function aiBidMedium(hand, auction) {
  const hcp = countHCP(hand);
  const hasExistingBid = auction.some(a => a !== 'pass');

  if (hasExistingBid) return 'pass'; // Simplified: only open, no responses

  if (hcp >= 15 && hcp <= 17) return { level: 1, suit: 'NT' };
  if (hcp >= 12) {
    const ls = longestSuit(hand);
    return { level: 1, suit: ls };
  }
  return 'pass';
}

function aiBidHard(hand, auction, position) {
  const hcp = countHCP(hand);
  const partnerBid = getPartnerBid(auction, position);
  const currentHighBid = getHighestBid(auction);

  // Opening bid
  if (!currentHighBid) {
    if (hcp >= 20) return { level: 2, suit: '♣' };
    if (hcp >= 15 && hcp <= 17) return { level: 1, suit: 'NT' };
    if (hcp >= 12) {
      const ls = longestSuit(hand);
      return { level: 1, suit: ls };
    }
    return 'pass';
  }

  // Response to partner's bid
  if (partnerBid && !currentHighBid) {
    if (hcp >= 10) {
      const ls = longestSuit(hand);
      // Avoid re-bidding partner's suit unless 3+ cards
      const partnerSuit = partnerBid.suit;
      const support = hand.filter(c => c.suit === partnerSuit).length;
      if (support >= 3 && hcp >= 6) {
        const newLevel = partnerBid.level + (partnerBid.level < 4 ? 0 : 0);
        if (isLegalBid({ level: partnerBid.level + 1, suit: partnerSuit }, currentHighBid)) {
          return { level: partnerBid.level + 1, suit: partnerSuit };
        }
      }
      return { level: 1, suit: ls };
    }
    if (hcp >= 6) {
      const partnerSuit = partnerBid.suit;
      const support = hand.filter(c => c.suit === partnerSuit).length;
      if (support >= 3) return { level: partnerBid.level + 1, suit: partnerSuit };
    }
    return 'pass';
  }

  return 'pass';
}

function getPartnerBid(auction, position) {
  // Partner is 2 positions away (0↔2, 1↔3)
  const partnerPos = (position + 2) % 4;
  for (let i = auction.length - 1; i >= 0; i--) {
    if (auction[i].position === partnerPos && auction[i].bid !== 'pass') {
      return auction[i].bid;
    }
  }
  return null;
}

function getHighestBid(auction) {
  for (let i = auction.length - 1; i >= 0; i--) {
    const entry = auction[i];
    if (entry.bid && entry.bid !== 'pass' && entry.bid !== 'double' && entry.bid !== 'redouble') {
      return entry.bid;
    }
  }
  return null;
}
