// ── Scoring ───────────────────────────────────────────────────────────────────

// Returns { declarerPoints, defenderPoints, message }
function calculateScore(contract, tricksMade, doubled, redoubled) {
  const needed = 6 + contract.level;
  const overtricks = tricksMade - needed;
  const undertricks = needed - tricksMade;

  let points = 0;
  let message = '';

  if (tricksMade >= needed) {
    // Made the contract
    const trickScore = trickPoints(contract.suit, contract.level);
    let total = trickScore;

    if (doubled) total = trickScore * 2 + 50;   // insult bonus
    else if (redoubled) total = trickScore * 4 + 100;

    // Overtrick bonuses (non-doubled)
    const perOvertrick = overtrickPoints(contract.suit, doubled, redoubled);
    total += overtricks * perOvertrick;

    points = total;
    message = overtricks > 0
      ? `Contract made with ${overtricks} overtrick${overtricks > 1 ? 's' : ''}! +${total} points`
      : `Contract made! +${total} points`;
  } else {
    // Defeated
    const penalty = undertrickPenalty(undertricks, doubled, redoubled);
    points = -penalty;
    message = `Contract defeated — ${undertricks} trick${undertricks > 1 ? 's' : ''} short. ${penalty} points to the defenders.`;
  }

  return { points, message };
}

function trickPoints(suit, level) {
  if (suit === 'NT') return 40 + 30 * (level - 1);
  if (suit === '♥' || suit === '♠') return 30 * level;
  return 20 * level;  // minor suits
}

function overtrickPoints(suit, doubled, redoubled) {
  if (doubled) return 100;
  if (redoubled) return 200;
  if (suit === '♥' || suit === '♠' || suit === 'NT') return 30;
  return 20;
}

function undertrickPenalty(undertricks, doubled, redoubled) {
  if (doubled) return undertricks * 100;
  if (redoubled) return undertricks * 200;
  return undertricks * 50;
}

// Friendly result screen text
function resultScreenText(contract, tricksMade, declarerIsPlayer) {
  const needed = 6 + contract.level;
  const made = tricksMade >= needed;
  const who = declarerIsPlayer ? 'You' : 'The computer';
  const whoLower = declarerIsPlayer ? 'you' : 'the computer';

  if (made) {
    return `${who} made the contract! 🎉`;
  } else {
    const short = needed - tricksMade;
    return `${who.replace('You', 'Your')} contract was defeated — ${short} trick${short > 1 ? 's' : ''} short.`;
  }
}
