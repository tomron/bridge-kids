// ── Game state ────────────────────────────────────────────────────────────────
// Positions: 0=South (player), 1=West, 2=North, 3=East
// Computer controls 1, 2, 3.

const POSITION_NAMES = ['South', 'West', 'North', 'East'];
const TRICK_SLOTS = ['trick-south', 'trick-west', 'trick-north', 'trick-east'];

let trickAnimating = false; // blocks computer plays during trick animation

// Denomination order for bid legality
const DENOMS = ['♣', '♦', '♥', '♠', 'NT'];
function bidIndex(level, suit) { return (level - 1) * 5 + DENOMS.indexOf(suit); }

const gameState = {
  phase: 'start',       // 'start' | 'bidding' | 'play' | 'result'
  difficulty: 'easy',   // selected but not yet applied
  activeDifficulty: 'easy', // difficulty in use for current hand

  hands: [[], [], [], []],   // cards in each position's hand
  auction: [],               // { position, bid } entries
  contract: null,            // { level, suit, doubled, redoubled, declarer }
  leader: 0,                 // position leading current trick
  currentTrick: [],          // { card, player } in play order
  trickCounts: [0, 0],       // [player side, computer side]
  sessionScores: [0, 0],     // [player, computer]
  currentPlayer: 0,          // whose turn it is
  resultData: null,
};

// ── Central dispatch ──────────────────────────────────────────────────────────
function dispatch(action) {
  switch (action.type) {
    case 'SET_DIFFICULTY':
      gameState.difficulty = action.difficulty;
      break;

    case 'NEW_GAME':
      startNewGame();
      break;

    case 'NEW_SESSION':
      gameState.sessionScores = [0, 0];
      startNewGame();
      break;

    case 'NEXT_HAND':
      startNewGame();
      break;

    case 'BID':
      handleBid(action.bid);
      break;

    case 'PLAY_CARD':
      handlePlayCard(action.card, action.player);
      break;

    case 'SHOW_HINT':
      showHint();
      break;

    case 'HIDE_HINT':
      document.getElementById('hint-overlay').classList.add('hidden');
      break;
  }
  render();
}

// ── Game setup ────────────────────────────────────────────────────────────────
function startNewGame() {
  const deck = shuffle(createDeck());
  const hands = deal(deck);

  gameState.activeDifficulty = gameState.difficulty;
  gameState.hands = hands;
  gameState.auction = [];
  gameState.contract = null;
  gameState.currentTrick = [];
  gameState.trickCounts = [0, 0];
  gameState.resultData = null;

  if (gameState.activeDifficulty === 'easy') {
    // Auto-set contract, skip bidding
    gameState.contract = { level: 1, suit: 'NT', doubled: false, redoubled: false, declarer: 1 };
    gameState.phase = 'play';
    gameState.leader = 0; // Player leads first (left of declarer=1 is 0)
    gameState.currentPlayer = 0;
  } else {
    gameState.phase = 'bidding';
    gameState.currentPlayer = 0; // Player bids first
  }
}

// ── Bidding ───────────────────────────────────────────────────────────────────

function isLegalBid(bid, currentHighBid) {
  if (bid === 'pass' || bid === 'double' || bid === 'redouble') return true;
  if (!currentHighBid) return true;
  return bidIndex(bid.level, bid.suit) > bidIndex(currentHighBid.level, currentHighBid.suit);
}

function getHighestBidFromAuction() {
  for (let i = gameState.auction.length - 1; i >= 0; i--) {
    const b = gameState.auction[i].bid;
    if (b !== 'pass' && b !== 'double' && b !== 'redouble') return b;
  }
  return null;
}

function handleBid(bid) {
  gameState.auction.push({ position: gameState.currentPlayer, bid });

  if (isAuctionOver()) {
    finalizeContract();
    return;
  }

  gameState.currentPlayer = (gameState.currentPlayer + 1) % 4;

  // Computer bids (positions 1, 2, 3)
  while (gameState.currentPlayer !== 0 && gameState.phase === 'bidding') {
    const computerHand = gameState.hands[gameState.currentPlayer];
    const computerBid = aiBid(computerHand, gameState.auction, gameState.currentPlayer, gameState);
    gameState.auction.push({ position: gameState.currentPlayer, bid: computerBid });

    if (isAuctionOver()) {
      finalizeContract();
      return;
    }
    gameState.currentPlayer = (gameState.currentPlayer + 1) % 4;
  }
}

function isAuctionOver() {
  const a = gameState.auction;
  if (a.length < 4) return false;

  // Four passes with no bids
  if (a.length === 4 && a.every(e => e.bid === 'pass')) return true;

  // Three consecutive passes after a bid
  if (a.length >= 4) {
    const last3 = a.slice(-3);
    if (last3.every(e => e.bid === 'pass')) {
      const hasBid = a.some(e => e.bid !== 'pass' && e.bid !== 'double' && e.bid !== 'redouble');
      return hasBid;
    }
  }
  return false;
}

function finalizeContract() {
  const highBid = getHighestBidFromAuction();

  if (!highBid) {
    // Passed out — deal new hand
    startNewGame();
    return;
  }

  let doubled = false, redoubled = false;
  for (let i = gameState.auction.length - 1; i >= 0; i--) {
    const b = gameState.auction[i].bid;
    if (b === 'redouble') { redoubled = true; break; }
    if (b === 'double') { doubled = true; break; }
    if (b !== 'pass') break;
  }

  const declarer = determineDeclarer(gameState.auction, highBid);

  gameState.contract = { level: highBid.level, suit: highBid.suit, doubled, redoubled, declarer };
  gameState.leader = (declarer + 1) % 4;
  gameState.currentPlayer = gameState.leader;
  gameState.phase = 'play';
  gameState.currentTrick = [];
}

function determineDeclarer(auction, contract) {
  let winningSide = -1;
  for (let i = auction.length - 1; i >= 0; i--) {
    const b = auction[i].bid;
    if (b !== 'pass' && b !== 'double' && b !== 'redouble') {
      winningSide = auction[i].position % 2;
      break;
    }
  }

  for (const entry of auction) {
    if (entry.position % 2 === winningSide) {
      const b = entry.bid;
      if (b && b.suit === contract.suit) return entry.position;
    }
  }
  return winningSide === 0 ? 0 : 1;
}

// ── Card play ─────────────────────────────────────────────────────────────────
function handlePlayCard(card, player) {
  const hand = gameState.hands[player];
  const idx = hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
  if (idx === -1) return;
  hand.splice(idx, 1);

  gameState.currentTrick.push({ card, player });

  if (gameState.currentTrick.length === 4) {
    setTimeout(() => completeTrick(), 600);
  } else {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % 4;
    scheduleComputerPlay();
  }
}

function completeTrick() {
  const trick = gameState.currentTrick;
  const ledSuit = trick[0].card.suit;
  const trump = gameState.contract.suit === 'NT' ? null : gameState.contract.suit;
  const winnerIdx = trickWinner(trick, ledSuit, trump);
  const winnerPosition = trick[winnerIdx].player;

  const side = winnerPosition === 0 ? 0 : 1;
  gameState.trickCounts[side]++;

  gameState.leader = winnerPosition;
  gameState.currentPlayer = winnerPosition;

  // Block computer plays until animation completes
  trickAnimating = true;

  // Pause so players can see all 4 cards, then animate toward winner
  const flyClass = ['fly-south', 'fly-west', 'fly-north', 'fly-east'][winnerPosition];
  setTimeout(() => {
    TRICK_SLOTS.forEach(id => {
      const slot = document.getElementById(id);
      if (slot) slot.classList.add(flyClass);
    });

    setTimeout(() => {
      trickAnimating = false;
      gameState.currentTrick = [];
      if (gameState.hands[0].length === 0) {
        finishHand();
      } else {
        render();
        scheduleComputerPlay();
      }
    }, 420);
  }, 800);
}

function scheduleComputerPlay() {
  if (gameState.currentPlayer !== 0 && gameState.phase === 'play') {
    const delay = 300 + Math.random() * 500;
    setTimeout(() => {
      if (gameState.phase !== 'play' || trickAnimating) return;
      const card = aiPlayCard(gameState.hands[gameState.currentPlayer], gameState.currentTrick, gameState);
      dispatch({ type: 'PLAY_CARD', card, player: gameState.currentPlayer });
    }, delay);
  }
}

function finishHand() {
  const declarerSide = gameState.contract.declarer === 0 ? 0 : 1;
  const tricksMade = gameState.trickCounts[declarerSide];
  const { points, message } = calculateScore(
    gameState.contract, tricksMade,
    gameState.contract.doubled, gameState.contract.redoubled
  );

  const declarerIsPlayer = gameState.contract.declarer === 0;
  if (points > 0) {
    gameState.sessionScores[declarerIsPlayer ? 0 : 1] += points;
  } else {
    // Defenders score the penalty
    gameState.sessionScores[declarerIsPlayer ? 1 : 0] += Math.abs(points);
  }

  gameState.phase = 'result';
  gameState.resultData = {
    friendly: resultScreenText(gameState.contract, tricksMade, declarerIsPlayer),
    scoreMsg: message,
    tricksMade,
  };
  render();
}

// ── Hints ─────────────────────────────────────────────────────────────────────
function showHint() {
  const hint = getHint(gameState);
  document.getElementById('hint-text').textContent = hint;
  document.getElementById('hint-overlay').classList.remove('hidden');
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  renderPhase();
  renderHands();
  renderTrickArea();
  renderScores();
  renderContractInfo();
  renderDifficultyButtons();
  renderThinkingIndicator();
}

function renderPhase() {
  document.body.classList.remove('at-start');
  ['start-screen', 'bidding-area', 'trick-area', 'result-area'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });

  if (gameState.phase === 'start') {
    document.getElementById('start-screen').classList.remove('hidden');
    document.body.classList.add('at-start');
  } else if (gameState.phase === 'bidding') {
    document.getElementById('bidding-area').classList.remove('hidden');
    renderBidBox();
  } else if (gameState.phase === 'play') {
    document.getElementById('trick-area').classList.remove('hidden');
  } else if (gameState.phase === 'result') {
    document.getElementById('result-area').classList.remove('hidden');
    renderResult();
  }
}

function renderHands() {
  // South (player) — face-up
  const playerCards = document.getElementById('player-cards');
  clearElement(playerCards);
  const playerHand = sortHand(gameState.hands[0]);

  const isPlayerTurn = gameState.phase === 'play' && gameState.currentPlayer === 0;
  document.getElementById('player-hand').classList.toggle('my-turn', isPlayerTurn);

  const ledSuit = gameState.currentTrick.length > 0 ? gameState.currentTrick[0].card.suit : null;
  const legal = isPlayerTurn ? legalPlays(gameState.hands[0], ledSuit) : [];
  const legalSet = new Set(legal.map(c => c.rank + c.suit));

  for (const card of playerHand) {
    const el = createCardElement(card);
    if (isPlayerTurn) {
      if (legalSet.has(card.rank + card.suit)) {
        el.classList.add('legal');
        el.addEventListener('click', () => dispatch({ type: 'PLAY_CARD', card, player: 0 }));
      } else {
        el.classList.add('disabled');
      }
    }
    playerCards.appendChild(el);
  }

  // North (position 2) — face-down, horizontal
  const northCards = document.getElementById('north-cards');
  clearElement(northCards);
  for (let i = 0; i < gameState.hands[2].length; i++) {
    const el = document.createElement('div');
    el.className = 'card face-down';
    northCards.appendChild(el);
  }

  // West (position 1) — face-down, vertical column
  const westCards = document.getElementById('west-cards');
  clearElement(westCards);
  for (let i = 0; i < gameState.hands[1].length; i++) {
    const el = document.createElement('div');
    el.className = 'card face-down';
    westCards.appendChild(el);
  }

  // East (position 3) — face-down, vertical column
  const eastCards = document.getElementById('east-cards');
  clearElement(eastCards);
  for (let i = 0; i < gameState.hands[3].length; i++) {
    const el = document.createElement('div');
    el.className = 'card face-down';
    eastCards.appendChild(el);
  }
}

function renderTrickArea() {
  for (const pos of [0, 1, 2, 3]) {
    const slot = document.getElementById(TRICK_SLOTS[pos]);
    // Clear any leftover fly classes from previous trick animation
    slot.classList.remove('fly-south', 'fly-west', 'fly-north', 'fly-east');
    clearElement(slot);
    const played = gameState.currentTrick.find(t => t.player === pos);
    if (played) slot.appendChild(createCardElement(played.card));
  }
}

function renderBidBox() {
  const grid = document.getElementById('bid-grid');
  clearElement(grid);
  const highBid = getHighestBidFromAuction();

  for (let level = 1; level <= 7; level++) {
    for (const suit of DENOMS) {
      const btn = document.createElement('button');
      btn.className = 'bid-btn';
      if (suit === '♥' || suit === '♦') btn.classList.add('bid-red');

      const levelSpan = document.createElement('span');
      levelSpan.textContent = String(level);
      const suitSpan = document.createElement('span');
      suitSpan.className = 'bid-suit';
      suitSpan.textContent = suit;
      btn.appendChild(levelSpan);
      btn.appendChild(suitSpan);

      const illegal = highBid && !isLegalBid({ level, suit }, highBid);
      if (illegal) {
        btn.classList.add('bid-illegal');
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => dispatch({ type: 'BID', bid: { level, suit } }));
      }
      grid.appendChild(btn);
    }
  }

  document.getElementById('pass-btn').onclick = () => dispatch({ type: 'BID', bid: 'pass' });

  const doubleBtn = document.getElementById('double-btn');
  const redoubleBtn = document.getElementById('redouble-btn');
  doubleBtn.classList.add('hidden');
  redoubleBtn.classList.add('hidden');

  if (gameState.activeDifficulty === 'hard') {
    if (canPlayerDouble()) {
      doubleBtn.classList.remove('hidden');
      doubleBtn.onclick = () => dispatch({ type: 'BID', bid: 'double' });
    }
    if (canPlayerRedouble()) {
      redoubleBtn.classList.remove('hidden');
      redoubleBtn.onclick = () => dispatch({ type: 'BID', bid: 'redouble' });
    }
  }

  const hist = document.getElementById('auction-history');
  hist.textContent = gameState.auction.map(e => {
    const b = e.bid;
    const name = POSITION_NAMES[e.position];
    if (b === 'pass') return name + ': Pass';
    if (b === 'double') return name + ': X';
    if (b === 'redouble') return name + ': XX';
    return name + ': ' + b.level + b.suit;
  }).join('  |  ');
}

function canPlayerDouble() {
  for (let i = gameState.auction.length - 1; i >= 0; i--) {
    const b = gameState.auction[i].bid;
    if (b === 'double' || b === 'redouble') return false;
    if (b !== 'pass') return gameState.auction[i].position !== 0;
  }
  return false;
}

function canPlayerRedouble() {
  for (let i = gameState.auction.length - 1; i >= 0; i--) {
    const b = gameState.auction[i].bid;
    if (b === 'redouble') return false;
    if (b === 'double') return gameState.auction[i].position !== 0;
    if (b !== 'pass') return false;
  }
  return false;
}

function renderContractInfo() {
  const info = document.getElementById('contract-info');
  if (!gameState.contract) { info.classList.add('hidden'); return; }
  info.classList.remove('hidden');
  const c = gameState.contract;
  const declarerTeam = c.declarer % 2 === 0 ? 'NS' : 'EW';
  const declarerName = POSITION_NAMES[c.declarer];
  let label = c.level + c.suit;
  if (c.doubled) label += ' X';
  if (c.redoubled) label += ' XX';
  document.getElementById('contract-display').textContent = label;
  document.getElementById('trump-display').textContent =
    c.suit === 'NT'
      ? 'No Trump | Declarer: ' + declarerTeam + ' (' + declarerName + ')'
      : 'Trump: ' + c.suit + ' | Declarer: ' + declarerTeam + ' (' + declarerName + ')';
}

function renderScores() {
  document.getElementById('player-tricks').textContent = gameState.trickCounts[0];
  document.getElementById('computer-tricks').textContent = gameState.trickCounts[1];
  document.getElementById('player-score').textContent = gameState.sessionScores[0];
  document.getElementById('computer-score').textContent = gameState.sessionScores[1];
}

function renderResult() {
  const d = gameState.resultData;
  if (!d) return;
  const msgEl = document.getElementById('result-message');
  msgEl.textContent = d.friendly;
  const isWin = d.friendly.toLowerCase().includes('made') || d.friendly.toLowerCase().includes('you won');
  msgEl.className = isWin ? 'win' : 'loss';
  document.getElementById('result-score').textContent =
    d.scoreMsg + '  Tricks made: ' + d.tricksMade + ' / needed: ' + (6 + gameState.contract.level);
}

function renderDifficultyButtons() {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.difficulty === gameState.difficulty);
  });
}

function renderThinkingIndicator() {
  const ind = document.getElementById('thinking-indicator');
  const thinking = gameState.phase === 'play' && gameState.currentPlayer !== 0;
  ind.classList.toggle('hidden', !thinking);
}

// ── Card element factory ──────────────────────────────────────────────────────
function createCardElement(card) {
  const el = document.createElement('div');
  el.className = 'card';

  const suitClassMap = { '♥': 'suit-hearts', '♦': 'suit-diamonds', '♠': 'suit-spades', '♣': 'suit-clubs' };
  el.classList.add(suitClassMap[card.suit] || '');
  el.dataset.suit = card.suit;

  const rankTop = document.createElement('span');
  rankTop.className = 'rank';
  rankTop.textContent = card.rank;

  const suit = document.createElement('span');
  suit.className = 'suit';
  suit.textContent = card.suit;

  const rankBot = document.createElement('span');
  rankBot.className = 'rank-bottom';
  rankBot.textContent = card.rank;

  el.appendChild(rankTop);
  el.appendChild(suit);
  el.appendChild(rankBot);
  return el;
}

function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// ── Event wiring ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('new-game-btn').addEventListener('click', () => dispatch({ type: 'NEW_GAME' }));
  document.getElementById('new-session-btn').addEventListener('click', () => dispatch({ type: 'NEW_SESSION' }));
  document.getElementById('next-hand-btn').addEventListener('click', () => dispatch({ type: 'NEXT_HAND' }));
  document.getElementById('help-btn').addEventListener('click', () => {
    if (gameState.phase === 'start') {
      showTutorial();
    } else {
      dispatch({ type: 'SHOW_HINT' });
    }
  });
  document.getElementById('hint-close').addEventListener('click', () => dispatch({ type: 'HIDE_HINT' }));
  document.getElementById('hint-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('hint-overlay')) dispatch({ type: 'HIDE_HINT' });
  });

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => dispatch({ type: 'SET_DIFFICULTY', difficulty: btn.dataset.difficulty }));
  });

  render();
  initTutorial();
});
