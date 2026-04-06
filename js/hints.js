// ── Hint system ───────────────────────────────────────────────────────────────

function getHint(gs) {
  if (gs.phase === 'bidding') return getBiddingHint(gs);
  if (gs.phase === 'play') return getPlayHint(gs);
  return 'Press "New Game" to start playing!';
}

function getPlayHint(gs) {
  const hand = gs.hands[0]; // player is position 0 (South)
  const trick = gs.currentTrick;
  const trump = gs.contract ? gs.contract.suit : null;
  const trumpName = trump === 'NT' ? null : trump;

  if (trick.length === 0) {
    // Player is leading
    if (trumpName) {
      return `It's your turn to lead! You can play any card. The trump suit is ${trumpName}.`;
    }
    return `It's your turn to lead! You can play any card. There is no trump suit (No Trump contract).`;
  }

  const ledSuit = trick[0].card.suit;
  const playerHasSuit = hand.some(c => c.suit === ledSuit);

  if (playerHasSuit) {
    // Must follow suit
    return `You must play a ${ledSuit} card because ${ledSuit} was led.`;
  }

  // Void in led suit
  let msg = `You have no ${ledSuit} cards, so you can play any card.`;
  if (trumpName) {
    const hasTrump = hand.some(c => c.suit === trumpName);
    if (hasTrump) {
      msg += ` You could play a trump (${trumpName}) to win the trick!`;
    }
  }

  // Check if player holds a winning card
  if (trick.length > 0) {
    const winningCard = findWinningCard(hand, trick, ledSuit, trumpName);
    if (winningCard) {
      return `${msg} Your ${cardLabel(winningCard)} will win this trick!`;
    }
  }

  return msg;
}

function findWinningCard(hand, trick, ledSuit, trumpSuit) {
  // Test each card in hand to see if it would win the trick
  for (const card of hand) {
    const testTrick = trick.concat({ card, player: 0 });
    const winIdx = trickWinner(testTrick, ledSuit, trumpSuit);
    if (winIdx === testTrick.length - 1) return card;
  }
  return null;
}

function getBiddingHint(gs) {
  const hand = gs.hands[0];
  const hcp = countHCP(hand);
  const ls = longestSuit(hand);

  if (gs.difficulty === 'medium') {
    if (hcp >= 15 && hcp <= 17) {
      return `You have about ${hcp} points. With 15-17 points you can open 1 No Trump (1NT)!`;
    }
    if (hcp >= 12) {
      return `You have about ${hcp} points. With 12 or more points you can open the bidding. Your longest suit is ${ls}.`;
    }
    return `You have about ${hcp} points. You need at least 12 points to open the bidding. It's usually best to pass.`;
  }

  if (gs.difficulty === 'hard') {
    const dist = getSuitDistribution(hand);
    const distText = SUITS.map(s => `${dist[s]}${s}`).join(' ');
    let suggestion = 'Pass (fewer than 12 points).';
    if (hcp >= 20) suggestion = 'Open 2♣ (20+ points, very strong hand!).';
    else if (hcp >= 15 && hcp <= 17) suggestion = 'Open 1NT (15-17 balanced points).';
    else if (hcp >= 12) suggestion = `Open 1${ls} (12+ points, your longest suit).`;

    return `You have ${hcp} HCP. Distribution: ${distText}.\nSuggested bid: ${suggestion}`;
  }

  return 'Think about your cards and make a bid!';
}

function getSuitDistribution(hand) {
  const dist = {};
  for (const s of SUITS) dist[s] = 0;
  for (const c of hand) dist[c.suit]++;
  return dist;
}
