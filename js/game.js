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
  seq: 0,                    // monotonic counter for multiplayer state sync
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

  // Broadcast state if host in multiplayer
  if (window.MP && window.MP.isHost && window.MP.gameMode !== 'solo') {
    gameState.seq = (gameState.seq || 0) + 1;
    window.MP.broadcastState(gameState);
  }
}

// ── Perspective rotation ──────────────────────────────────────────────────────
// localSeat: the canonical seat index this client controls (0=South default)
// rotateIndex(pos): maps canonical position to display slot given localSeat
// Display slots: 0=South, 1=West, 2=North, 3=East
function rotateIndex(pos) {
  const localSeat = (window.MP && window.MP.localSeat != null) ? window.MP.localSeat : 0;
  return (pos - localSeat + 4) % 4;
}

// Map display slot (0=South,1=West,2=North,3=East) back to canonical position
function displayToCanonical(displaySlot) {
  const localSeat = (window.MP && window.MP.localSeat != null) ? window.MP.localSeat : 0;
  return (displaySlot + localSeat) % 4;
}

// ── Toast notifications ───────────────────────────────────────────────────────
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  // Trigger animation
  requestAnimationFrame(() => { toast.classList.add('toast-show'); });
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
  }, 3500);
}
window.showToast = showToast;

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

  // Computer bids (only if host/solo, only for non-human seats)
  const _isHost = !window.MP || window.MP.isHost;
  const _humanSeats = window.MP ? Object.keys(window.MP.seatMap).filter(k => window.MP.seatMap[k].isHuman).map(Number) : [0];
  const _isSolo = !window.MP || window.MP.gameMode === 'solo';

  if (_isHost) {
    while (gameState.phase === 'bidding') {
      const cp = gameState.currentPlayer;
      // Stop if it's a human seat
      if (_humanSeats.includes(cp) && !_isSolo) break;
      // In solo mode, stop at player seat (0)
      if (_isSolo && cp === 0) break;

      const computerHand = gameState.hands[cp];
      const computerBid = aiBid(computerHand, gameState.auction, cp, gameState);
      gameState.auction.push({ position: cp, bid: computerBid });

      if (isAuctionOver()) {
        finalizeContract();
        return;
      }
      gameState.currentPlayer = (gameState.currentPlayer + 1) % 4;
    }
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

  const side = winnerPosition % 2 === 0 ? 0 : 1; // 0,2=NS; 1,3=EW
  gameState.trickCounts[side]++;

  gameState.leader = winnerPosition;
  gameState.currentPlayer = winnerPosition;

  // Block computer plays until animation completes
  trickAnimating = true;

  // Pause so players can see all 4 cards, then animate toward winner
  // Winner display slot is based on rotated position
  const winnerDisplaySlot = rotateIndex(winnerPosition);
  const flyClass = ['fly-south', 'fly-west', 'fly-north', 'fly-east'][winnerDisplaySlot];
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
  const isHost = !window.MP || window.MP.isHost;
  const isSolo = !window.MP || window.MP.gameMode === 'solo';
  const localSeat = (window.MP && window.MP.localSeat != null) ? window.MP.localSeat : 0;
  const humanSeats = window.MP ? Object.keys(window.MP.seatMap).filter(k => window.MP.seatMap[k].isHuman).map(Number) : [0];

  const cp = gameState.currentPlayer;

  // Only play if it's not the local human's turn
  if (cp === localSeat && !isSolo) return;
  // In solo mode, only play for non-player-0 seats
  if (isSolo && cp === 0) return;

  if (gameState.phase !== 'play') return;

  // Only host runs AI
  if (!isHost) return;

  // Only play for computer seats (seats not occupied by humans, unless solo)
  if (!isSolo && humanSeats.includes(cp)) return;

  const delay = 300 + Math.random() * 500;
  setTimeout(() => {
    if (gameState.phase !== 'play' || trickAnimating) return;
    const card = aiPlayCard(gameState.hands[gameState.currentPlayer], gameState.currentTrick, gameState);
    dispatch({ type: 'PLAY_CARD', card, player: gameState.currentPlayer });
  }, delay);
}

function finishHand() {
  const declarerSide = gameState.contract.declarer % 2 === 0 ? 0 : 1; // 0,2=NS; 1,3=EW
  const tricksMade = gameState.trickCounts[declarerSide];
  const { points, message } = calculateScore(
    gameState.contract, tricksMade,
    gameState.contract.doubled, gameState.contract.redoubled
  );

  const localSeat = (window.MP && window.MP.localSeat != null) ? window.MP.localSeat : 0;
  // "player" means the local player's side (NS if localSeat is 0/2, EW if 1/3)
  const declarerIsPlayer = gameState.contract.declarer % 2 === localSeat % 2;
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
  renderConnectionStatus();
}

function renderConnectionStatus() {
  const statusEl = document.getElementById('connection-status');
  if (!statusEl) return;
  const mp = window.MP;
  const isMultiplayer = mp && mp.gameMode !== 'solo';
  statusEl.classList.toggle('hidden', !isMultiplayer || gameState.phase === 'start');

  if (!isMultiplayer) return;

  document.querySelectorAll('.conn-dot').forEach(dot => {
    const seat = parseInt(dot.dataset.seat, 10);
    const info = mp.seatMap[seat];
    if (info && info.isHuman && !info.disconnected) {
      dot.classList.add('connected');
      dot.classList.remove('disconnected');
    } else if (info && info.isHuman && info.disconnected) {
      dot.classList.remove('connected');
      dot.classList.add('disconnected');
    } else {
      dot.classList.remove('connected', 'disconnected');
    }
  });
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
  const localSeat = (window.MP && window.MP.localSeat != null) ? window.MP.localSeat : 0;

  // Canonical positions for each display slot (South=0, West=1, North=2, East=3 display slots)
  const southCanon = displayToCanonical(0); // local player's canonical seat
  const northCanon = displayToCanonical(2);
  const westCanon  = displayToCanonical(1);
  const eastCanon  = displayToCanonical(3);

  // Determine dummy: partner of declarer, shown face-up after first lead
  const dummyCanon = gameState.contract
    ? (gameState.contract.declarer + 2) % 4
    : -1;
  // Dummy is visible after first card of first trick is played (leader has led)
  const dummyVisible = gameState.phase === 'play' && gameState.contract !== null;

  // ── South (local player) — face-up ──────────────────────────────────────
  const playerCards = document.getElementById('player-cards');
  clearElement(playerCards);
  const southHand = sortHand(gameState.hands[southCanon]);

  const isPlayerTurn = gameState.phase === 'play' && gameState.currentPlayer === southCanon;
  document.getElementById('player-hand').classList.toggle('my-turn', isPlayerTurn);

  // Update South label
  const southLabel = document.querySelector('#player-hand .hand-label');
  if (southLabel) {
    const isSolo = !window.MP || window.MP.gameMode === 'solo';
    const southName = isSolo ? 'You (South)' : _getSeatDisplayName(southCanon);
    southLabel.textContent = '';
    const badge = document.createElement('span');
    badge.className = 'team-badge ' + (southCanon % 2 === 0 ? 'ns-badge' : 'ew-badge');
    badge.textContent = southCanon % 2 === 0 ? 'NS' : 'EW';
    southLabel.appendChild(badge);
    southLabel.appendChild(document.createTextNode(' ' + southName));
  }

  const ledSuit = gameState.currentTrick.length > 0 ? gameState.currentTrick[0].card.suit : null;
  const legal = isPlayerTurn ? legalPlays(gameState.hands[southCanon], ledSuit) : [];
  const legalSet = new Set(legal.map(c => c.rank + c.suit));

  for (const card of southHand) {
    const cardEl = createCardElement(card);
    if (isPlayerTurn) {
      if (legalSet.has(card.rank + card.suit)) {
        cardEl.classList.add('legal');
        cardEl.addEventListener('click', () => {
          if (window.MP && window.MP.gameMode !== 'solo' && !window.MP.isHost) {
            // Guest: broadcast action to host
            window.MP.broadcastAction({ type: 'PLAY_CARD', card, player: southCanon });
          } else {
            dispatch({ type: 'PLAY_CARD', card, player: southCanon });
          }
        });
      } else {
        cardEl.classList.add('disabled');
      }
    }
    playerCards.appendChild(cardEl);
  }

  // ── North (display slot 2 = opposite) ──────────────────────────────────
  const northCards = document.getElementById('north-cards');
  clearElement(northCards);
  _updateHandLabel('north-hand', northCanon, 'ns-badge');

  const showNorthFaceUp = dummyVisible && northCanon === dummyCanon;
  if (showNorthFaceUp) {
    const northHand = sortHand(gameState.hands[northCanon]);
    for (const card of northHand) {
      const cardEl = createCardElement(card);
      // Declarer can click dummy if it's declarer's turn
      if (gameState.currentPlayer === northCanon && northCanon === dummyCanon) {
        const declarerCanon = gameState.contract.declarer;
        if (declarerCanon === southCanon) {
          cardEl.classList.add('legal');
          cardEl.addEventListener('click', () => {
            if (window.MP && window.MP.gameMode !== 'solo' && !window.MP.isHost) {
              window.MP.broadcastAction({ type: 'PLAY_CARD', card, player: northCanon });
            } else {
              dispatch({ type: 'PLAY_CARD', card, player: northCanon });
            }
          });
        }
      }
      northCards.appendChild(cardEl);
    }
  } else {
    for (let i = 0; i < gameState.hands[northCanon].length; i++) {
      const cardEl = document.createElement('div');
      cardEl.className = 'card face-down';
      northCards.appendChild(cardEl);
    }
  }

  // ── West (display slot 1 = left) ────────────────────────────────────────
  const westCards = document.getElementById('west-cards');
  clearElement(westCards);
  _updateHandLabel('west-hand', westCanon, westCanon % 2 === 0 ? 'ns-badge' : 'ew-badge');

  const showWestFaceUp = dummyVisible && westCanon === dummyCanon;
  if (showWestFaceUp) {
    const westHand = sortHand(gameState.hands[westCanon]);
    for (const card of westHand) {
      const cardEl = createCardElement(card);
      if (gameState.currentPlayer === westCanon && gameState.contract.declarer === southCanon) {
        cardEl.classList.add('legal');
        cardEl.addEventListener('click', () => {
          if (window.MP && window.MP.gameMode !== 'solo' && !window.MP.isHost) {
            window.MP.broadcastAction({ type: 'PLAY_CARD', card, player: westCanon });
          } else {
            dispatch({ type: 'PLAY_CARD', card, player: westCanon });
          }
        });
      }
      westCards.appendChild(cardEl);
    }
  } else {
    for (let i = 0; i < gameState.hands[westCanon].length; i++) {
      const cardEl = document.createElement('div');
      cardEl.className = 'card face-down';
      westCards.appendChild(cardEl);
    }
  }

  // ── East (display slot 3 = right) ───────────────────────────────────────
  const eastCards = document.getElementById('east-cards');
  clearElement(eastCards);
  _updateHandLabel('east-hand', eastCanon, eastCanon % 2 === 0 ? 'ns-badge' : 'ew-badge');

  const showEastFaceUp = dummyVisible && eastCanon === dummyCanon;
  if (showEastFaceUp) {
    const eastHand = sortHand(gameState.hands[eastCanon]);
    for (const card of eastHand) {
      const cardEl = createCardElement(card);
      if (gameState.currentPlayer === eastCanon && gameState.contract.declarer === southCanon) {
        cardEl.classList.add('legal');
        cardEl.addEventListener('click', () => {
          if (window.MP && window.MP.gameMode !== 'solo' && !window.MP.isHost) {
            window.MP.broadcastAction({ type: 'PLAY_CARD', card, player: eastCanon });
          } else {
            dispatch({ type: 'PLAY_CARD', card, player: eastCanon });
          }
        });
      }
      eastCards.appendChild(cardEl);
    }
  } else {
    for (let i = 0; i < gameState.hands[eastCanon].length; i++) {
      const cardEl = document.createElement('div');
      cardEl.className = 'card face-down';
      eastCards.appendChild(cardEl);
    }
  }
}

function _getSeatDisplayName(canonPos) {
  const mp = window.MP;
  if (!mp || mp.gameMode === 'solo') {
    return canonPos === 0 ? 'You (South)' : POSITION_NAMES[canonPos];
  }
  const info = mp.seatMap[canonPos];
  if (info && info.isHuman) {
    return info.name || POSITION_NAMES[canonPos];
  }
  return POSITION_NAMES[canonPos] + ' (CPU)';
}

function _updateHandLabel(handId, canonPos, badgeClass) {
  const handEl = document.getElementById(handId);
  if (!handEl) return;
  const labelEl = handEl.querySelector('.hand-label');
  if (!labelEl) return;
  const isSolo = !window.MP || window.MP.gameMode === 'solo';
  const name = isSolo ? POSITION_NAMES[canonPos] : _getSeatDisplayName(canonPos);
  const team = canonPos % 2 === 0 ? 'NS' : 'EW';
  const actualBadge = canonPos % 2 === 0 ? 'ns-badge' : 'ew-badge';
  labelEl.textContent = '';
  const badge = document.createElement('span');
  badge.className = 'team-badge ' + actualBadge;
  badge.textContent = team;
  labelEl.appendChild(badge);
  labelEl.appendChild(document.createTextNode(' ' + name));
}

function renderTrickArea() {
  // TRICK_SLOTS[0..3] = south, west, north, east display slots
  for (const displaySlot of [0, 1, 2, 3]) {
    const slot = document.getElementById(TRICK_SLOTS[displaySlot]);
    // Clear any leftover fly classes from previous trick animation
    slot.classList.remove('fly-south', 'fly-west', 'fly-north', 'fly-east');
    clearElement(slot);
    // Find which canonical position maps to this display slot
    const canonPos = displayToCanonical(displaySlot);
    const played = gameState.currentTrick.find(t => t.player === canonPos);
    if (played) slot.appendChild(createCardElement(played.card));
  }
}

function _dispatchBid(bid) {
  const isSolo = !window.MP || window.MP.gameMode === 'solo';
  if (!isSolo && window.MP && !window.MP.isHost) {
    // Guest: broadcast action to host
    window.MP.broadcastAction({ type: 'BID', bid, player: window.MP.localSeat });
  } else {
    dispatch({ type: 'BID', bid });
  }
}

function renderBidBox() {
  const grid = document.getElementById('bid-grid');
  clearElement(grid);
  const highBid = getHighestBidFromAuction();

  // Disable bidding UI if it's not the local player's turn
  const localSeat = (window.MP && window.MP.localSeat != null) ? window.MP.localSeat : 0;
  const isLocalTurn = gameState.currentPlayer === localSeat;
  const isSolo = !window.MP || window.MP.gameMode === 'solo';
  const biddingEnabled = isSolo ? (gameState.currentPlayer === 0) : isLocalTurn;

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

      const illegal = (highBid && !isLegalBid({ level, suit }, highBid)) || !biddingEnabled;
      if (illegal) {
        btn.classList.add('bid-illegal');
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => _dispatchBid({ level, suit }));
      }
      grid.appendChild(btn);
    }
  }

  const passBtn = document.getElementById('pass-btn');
  passBtn.disabled = !biddingEnabled;
  passBtn.onclick = biddingEnabled ? () => _dispatchBid('pass') : null;

  const doubleBtn = document.getElementById('double-btn');
  const redoubleBtn = document.getElementById('redouble-btn');
  doubleBtn.classList.add('hidden');
  redoubleBtn.classList.add('hidden');

  if (gameState.activeDifficulty === 'hard' && biddingEnabled) {
    if (canPlayerDouble()) {
      doubleBtn.classList.remove('hidden');
      doubleBtn.onclick = () => _dispatchBid('double');
    }
    if (canPlayerRedouble()) {
      redoubleBtn.classList.remove('hidden');
      redoubleBtn.onclick = () => _dispatchBid('redouble');
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
  const localSeat = (window.MP && window.MP.localSeat != null) ? window.MP.localSeat : 0;
  for (let i = gameState.auction.length - 1; i >= 0; i--) {
    const b = gameState.auction[i].bid;
    if (b === 'double' || b === 'redouble') return false;
    if (b !== 'pass') return gameState.auction[i].position !== localSeat;
  }
  return false;
}

function canPlayerRedouble() {
  const localSeat = (window.MP && window.MP.localSeat != null) ? window.MP.localSeat : 0;
  for (let i = gameState.auction.length - 1; i >= 0; i--) {
    const b = gameState.auction[i].bid;
    if (b === 'redouble') return false;
    if (b === 'double') return gameState.auction[i].position !== localSeat;
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
  const localSeat = (window.MP && window.MP.localSeat != null) ? window.MP.localSeat : 0;
  const humanSeats = window.MP ? Object.keys(window.MP.seatMap).filter(k => window.MP.seatMap[k].isHuman).map(Number) : [localSeat];
  const isSolo = !window.MP || window.MP.gameMode === 'solo';

  let thinking = false;
  if (gameState.phase === 'play') {
    if (isSolo) {
      thinking = gameState.currentPlayer !== 0;
    } else {
      // Show thinking if it's a computer seat's turn (not a human seat)
      thinking = !humanSeats.includes(gameState.currentPlayer);
    }
  }
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

  // Solo lobby button
  const lobbySoloBtn = document.getElementById('lobby-solo-btn');
  if (lobbySoloBtn) {
    lobbySoloBtn.addEventListener('click', () => {
      if (window.MP) window.MP.gameMode = 'solo';
      document.getElementById('lobby-overlay').classList.add('hidden');
      dispatch({ type: 'NEW_GAME' });
    });
  }

  // Register MP callbacks once MP is ready
  function registerMPCallbacks() {
    if (!window.MP) return;

    window.MP.onStateReceived((msg) => {
      if (!window.MP.isHost && msg.seq > (gameState.seq || 0)) {
        Object.assign(gameState, msg.state);
        render();
      }
    });

    window.MP.onActionReceived((msg) => {
      if (window.MP.isHost) {
        const senderSeat = msg.senderSeat;
        const action = msg.action;
        if (action.type === 'BID') {
          if (gameState.currentPlayer === senderSeat) {
            dispatch(action);
          }
        } else if (action.type === 'PLAY_CARD') {
          if (action.player === senderSeat) {
            dispatch(action);
          }
        }
      }
    });

    window.MP.onSyncRequest(() => {
      if (window.MP.isHost) {
        window.MP.broadcastState(gameState);
      }
    });
  }

  // MP may be ready already (synchronous) or after async init
  if (window.MP) {
    registerMPCallbacks();
  } else {
    window.addEventListener('mp-ready', registerMPCallbacks, { once: true });
  }

  render();
  initTutorial();
});
