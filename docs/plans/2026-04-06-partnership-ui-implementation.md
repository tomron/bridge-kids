# Partnership UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the Bridge for Kids UI to clearly show NS vs EW partnerships with a full 4-direction table layout, all four hands visible (South face-up, others face-down), NS/EW labels throughout, and Taki-inspired kid-friendly card design.

**Architecture:** Four coordinated changes — (1) HTML adds West and East hand sections to the table, (2) CSS restructures `#table` into a 3×3 grid with vertical side hands, (3) JS updates all render functions to use NS/EW labels and render West/East face-down hands, (4) CSS redesigns cards with bold suit-colored backgrounds, large center suit symbols, and a fun face-down back.

**Tech Stack:** Vanilla HTML/CSS/JS — no build tools, no frameworks. Edit files directly.

---

## Task 1: Restructure `#table` HTML to 4-direction layout

**Files:**
- Modify: `index.html` (the `<main id="table">` section, currently lines 54–115)

**Step 1: Replace the `<main id="table">` block**

Find this in `index.html`:
```html
    <!-- Main table -->
    <main id="table">
      <!-- Computer hand (top) -->
      <div id="computer-hand" class="hand-area">
        <div class="hand-label">Computer</div>
        <div id="computer-cards" class="cards-row"></div>
      </div>

      <!-- Center: bidding or trick area -->
      <div id="center-area">
        ...
      </div>

      <!-- Player hand (bottom) -->
      <div id="player-hand" class="hand-area">
        <div class="hand-label">You</div>
        <div id="player-cards" class="cards-row"></div>
      </div>
    </main>
```

Replace with:
```html
    <!-- Main table -->
    <main id="table">
      <!-- North hand (top center) -->
      <div id="north-hand" class="hand-area hand-north">
        <div class="hand-label"><span class="team-badge ns-badge">NS</span> North</div>
        <div id="north-cards" class="cards-row"></div>
      </div>

      <!-- West hand (middle left) -->
      <div id="west-hand" class="hand-area hand-west">
        <div class="hand-label"><span class="team-badge ew-badge">EW</span> West</div>
        <div id="west-cards" class="cards-col"></div>
      </div>

      <!-- Center: bidding or trick area -->
      <div id="center-area">
        <!-- (keep all existing children exactly as-is) -->
      </div>

      <!-- East hand (middle right) -->
      <div id="east-hand" class="hand-area hand-east">
        <div class="hand-label"><span class="team-badge ew-badge">EW</span> East</div>
        <div id="east-cards" class="cards-col"></div>
      </div>

      <!-- South / Player hand (bottom center) -->
      <div id="player-hand" class="hand-area hand-south">
        <div class="hand-label"><span class="team-badge ns-badge">NS</span> You (South)</div>
        <div id="player-cards" class="cards-row"></div>
      </div>
    </main>
```

Note: keep `id="player-hand"` and `id="player-cards"` unchanged so existing JS keeps working. Rename `id="computer-hand"` → `id="north-hand"` and `id="computer-cards"` → `id="north-cards"`.

**Step 2: Verify the HTML is valid**

Open `index.html` in a browser and confirm the page loads without errors (check console). The layout will look broken until CSS is updated — that's expected.

**Step 3: Commit**
```bash
git add index.html
git commit -m "feat: add west/east hand sections to table HTML"
```

---

## Task 2: Update `#table` CSS to 3×3 grid

**Files:**
- Modify: `style.css` (the `#table` block at line 165 and `.hand-area` at line 173)

**Step 1: Replace the `#table` rule**

Find:
```css
#table {
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 16px;
  gap: 12px;
  min-height: 100vh;
}
```

Replace with:
```css
#table {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    ".      north  ."
    "west   center east"
    ".      south  .";
  padding: 16px;
  gap: 12px;
  min-height: 100vh;
}
```

**Step 2: Add grid-area assignments and hand-specific styles**

After the `#table` rule, add:
```css
#north-hand  { grid-area: north; }
#west-hand   { grid-area: west; }
#center-area { grid-area: center; }
#east-hand   { grid-area: east; }
#player-hand { grid-area: south; }

/* West/East hands: vertical layout */
.hand-west,
.hand-east {
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cards-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

/* Side cards are smaller face-down backs */
.hand-west .card,
.hand-east .card {
  width: 46px;
  height: 68px;
}

/* Team badges */
.team-badge {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 8px;
  letter-spacing: 0.05em;
  vertical-align: middle;
  margin-right: 4px;
}

.ns-badge {
  background: rgba(245, 200, 66, 0.2);
  color: var(--gold);
  border: 1px solid rgba(245, 200, 66, 0.5);
}

.ew-badge {
  background: rgba(58, 143, 199, 0.2);
  color: #7ec8f0;
  border: 1px solid rgba(58, 143, 199, 0.5);
}
```

**Step 3: Update mobile responsive rules**

In the `@media (max-width: 600px)` block, find:
```css
  #table { padding: 8px; gap: 8px; min-height: unset; }
```

Replace with:
```css
  #table {
    grid-template-columns: 60px 1fr 60px;
    padding: 8px;
    gap: 6px;
    min-height: unset;
  }

  .hand-west .card,
  .hand-east .card {
    width: 32px;
    height: 48px;
  }

  .cards-col { gap: 2px; }
```

Also in the `@media (max-width: 900px)` block after the existing rules, add:
```css
  #table {
    grid-template-columns: 90px 1fr 90px;
  }

  .hand-west .card,
  .hand-east .card {
    width: 38px;
    height: 56px;
  }
```

**Step 4: Visually verify**

Open in browser. Confirm:
- North hand appears at top center
- West hand appears at left
- East hand appears at right
- South (your) hand appears at bottom center
- Center trick/bidding area fills the middle cell

**Step 5: Commit**
```bash
git add style.css
git commit -m "feat: 3x3 grid table layout with west/east hand columns"
```

---

## Task 3: Render West and East face-down hands in JS

**Files:**
- Modify: `js/game.js` — `renderHands()` function (lines 308–342)

**Step 1: Update `renderHands()` to render all 4 positions**

Find the `renderHands()` function and replace it entirely with:

```javascript
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
```

**Step 2: Verify in browser**

Start a new game. Confirm all four hand areas show cards — South face-up, others as face-down backs. As tricks are played, the card counts in West/East/North should decrease by 1 each trick.

**Step 3: Commit**
```bash
git add js/game.js
git commit -m "feat: render all four hands (west/east face-down vertical)"
```

---

## Task 4: Update score panel labels to NS/EW

**Files:**
- Modify: `index.html` — score panel section (lines 33–44)
- Modify: `js/game.js` — `renderScores()` function (lines 447–452)

**Step 1: Update score panel HTML**

Find in `index.html`:
```html
      <div id="score-panel">
        <label class="section-label">Tricks</label>
        <div id="trick-counts">
          <div>You: <span id="player-tricks">0</span></div>
          <div>Computer: <span id="computer-tricks">0</span></div>
        </div>
        <label class="section-label">Session Score</label>
        <div id="session-scores">
          <div>You: <span id="player-score">0</span></div>
          <div>Computer: <span id="computer-score">0</span></div>
        </div>
      </div>
```

Replace with:
```html
      <div id="score-panel">
        <label class="section-label">Tricks</label>
        <div id="trick-counts">
          <div><span class="team-badge ns-badge">NS</span> <span id="player-tricks">0</span></div>
          <div><span class="team-badge ew-badge">EW</span> <span id="computer-tricks">0</span></div>
        </div>
        <label class="section-label">Session Score</label>
        <div id="session-scores">
          <div><span class="team-badge ns-badge">NS</span> <span id="player-score">0</span></div>
          <div><span class="team-badge ew-badge">EW</span> <span id="computer-score">0</span></div>
        </div>
      </div>
```

Note: keep the same `id` attributes on the `<span>` elements — `renderScores()` in JS writes to them by ID.

**Step 2: No JS changes needed for `renderScores()`**

The `renderScores()` function writes to `#player-tricks`, `#computer-tricks`, `#player-score`, `#computer-score` by ID — these IDs are unchanged, so no JS edits are needed here.

**Step 3: Verify in browser**

Start a game and play some tricks. Confirm the side panel shows "NS: X / EW: Y" for both trick counts and session scores.

**Step 4: Commit**
```bash
git add index.html
git commit -m "feat: relabel score panel as NS/EW partnerships"
```

---

## Task 5: Update contract info and result screen to NS/EW

**Files:**
- Modify: `js/game.js` — `renderContractInfo()` (lines 431–445), `renderResult()` (lines 454–463), `resultScreenText()` in `scoring.js` (lines 58–70)

**Step 1: Update `renderContractInfo()` in `js/game.js`**

Find:
```javascript
  const declarer = c.declarer === 0 ? 'You' : 'Computer';
  let label = c.level + c.suit;
  if (c.doubled) label += ' X';
  if (c.redoubled) label += ' XX';
  document.getElementById('contract-display').textContent = label;
  document.getElementById('trump-display').textContent =
    c.suit === 'NT'
      ? 'No Trump | Declarer: ' + declarer
      : 'Trump: ' + c.suit + ' | Declarer: ' + declarer;
```

Replace with:
```javascript
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
```

**Step 2: Update `resultScreenText()` in `js/scoring.js`**

Find:
```javascript
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
```

Replace with:
```javascript
function resultScreenText(contract, tricksMade, declarerIsPlayer) {
  const needed = 6 + contract.level;
  const made = tricksMade >= needed;
  const declarerTeam = contract.declarer % 2 === 0 ? 'NS' : 'EW';

  if (made) {
    return `${declarerTeam} made the contract! 🎉`;
  } else {
    const short = needed - tricksMade;
    return `${declarerTeam} contract was defeated — ${short} trick${short > 1 ? 's' : ''} short.`;
  }
}
```

**Step 3: Verify in browser**

Play through to the result screen. Confirm contract info shows e.g. "Declarer: NS (South)" and result shows "NS made the contract!" or "EW contract was defeated".

**Step 4: Commit**
```bash
git add js/game.js js/scoring.js
git commit -m "feat: use NS/EW labels in contract info and result screen"
```

---

## Task 6: Update auction history to use position names

**Files:**
- Modify: `js/game.js` — `renderBidBox()` auction history section (lines 401–409)

**Step 1: Update auction history rendering**

Find:
```javascript
  const hist = document.getElementById('auction-history');
  hist.textContent = gameState.auction.map(e => {
    const b = e.bid;
    const name = e.position === 0 ? 'You' : 'Computer';
    if (b === 'pass') return name + ': Pass';
    if (b === 'double') return name + ': X';
    if (b === 'redouble') return name + ': XX';
    return name + ': ' + b.level + b.suit;
  }).join('  |  ');
```

Replace with:
```javascript
  const hist = document.getElementById('auction-history');
  hist.textContent = gameState.auction.map(e => {
    const b = e.bid;
    const name = POSITION_NAMES[e.position];
    if (b === 'pass') return name + ': Pass';
    if (b === 'double') return name + ': X';
    if (b === 'redouble') return name + ': XX';
    return name + ': ' + b.level + b.suit;
  }).join('  |  ');
```

**Step 2: Verify in browser (medium/hard difficulty)**

Start a new game on Medium or Hard difficulty (which shows the bidding phase). Confirm the auction history shows e.g. "South: 1NT  |  West: Pass  |  North: 2♥  |  East: Pass".

**Step 3: Commit**
```bash
git add js/game.js
git commit -m "feat: show position names in auction history"
```

---

## Task 7: Taki-style card redesign

**Files:**
- Modify: `style.css` — `.card`, `.card.red`, `.card.face-down`, `.card.face-down::after` blocks (lines 200–251)

**Step 1: Replace card face styles**

Find the `.card` block and everything through `.card.face-down::after`, and replace with:

```css
.card {
  width: 72px;
  height: 108px;
  border-radius: 12px;
  border: 2px solid rgba(0,0,0,0.15);
  background: #fff;
  color: #111;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 5px 7px;
  font-size: 1rem;
  font-weight: 800;
  font-family: inherit;
  cursor: default;
  user-select: none;
  position: relative;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

/* Large center suit symbol */
.card::before {
  content: attr(data-suit);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.4rem;
  line-height: 1;
  opacity: 0.18;
  pointer-events: none;
}

.card .rank { font-size: 1rem; line-height: 1; font-weight: 900; position: relative; z-index: 1; }
.card .suit { display: none; }  /* hidden — shown via ::before pseudo-element */
.card .rank-bottom { font-size: 1rem; line-height: 1; text-align: right; transform: rotate(180deg); font-weight: 900; position: relative; z-index: 1; }

/* Suit-colored tint backgrounds */
.card.suit-hearts   { background: linear-gradient(145deg, #fff8f8 0%, #ffe0e0 100%); color: #c0001e; border-color: #f5a0a0; }
.card.suit-diamonds { background: linear-gradient(145deg, #fff8f4 0%, #ffe8d0 100%); color: #c05000; border-color: #f5b880; }
.card.suit-spades   { background: linear-gradient(145deg, #f4f8ff 0%, #d0e0f8 100%); color: #003080; border-color: #80a8e8; }
.card.suit-clubs    { background: linear-gradient(145deg, #f4fff6 0%, #d0f0d8 100%); color: #006020; border-color: #80d090; }

/* Remove old .card.red rule — color is now per-suit class above */
.card.red { /* intentionally empty — kept for compatibility */ }

.card.face-down {
  background: linear-gradient(135deg, #ff6b35 0%, #f7c59f 25%, #efefd0 50%, #6bbfed 75%, #a855f7 100%);
  border-color: rgba(255,255,255,0.4);
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card.face-down::before { content: ''; }  /* suppress suit pseudo for face-down */

.card.face-down::after {
  content: '★';
  font-size: 2rem;
  color: rgba(255,255,255,0.85);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
```

**Step 2: Update `createCardElement()` in `js/game.js` to set `data-suit` and suit class**

Find `createCardElement()` (around line 478) and replace it with:

```javascript
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
```

**Step 3: Update responsive card sizes to preserve border-radius**

In `@media (max-width: 900px)`, find `.card { width: 60px; height: 90px; ... }` and add `border-radius: 10px;`.

In `@media (max-width: 600px)`, find `.card { width: 46px; height: 68px; ... }` and update `border-radius: 8px;`. Also update `.card::before` font-size for mobile:

```css
  .card::before { font-size: 1.8rem; }
```

**Step 4: Verify in browser**

Start a new game. Confirm:
- [ ] Hearts/diamonds cards have a warm red tint
- [ ] Spades cards have a cool blue tint
- [ ] Clubs cards have a green tint
- [ ] Large center suit symbol visible on each card
- [ ] Face-down cards have rainbow gradient + white star
- [ ] Legal cards still highlight with gold border on your turn

**Step 5: Commit**
```bash
git add style.css js/game.js
git commit -m "feat: Taki-style card design with suit colors and large center symbol"
```

---

## Task 8: Final visual QA pass

**Step 1: Full game walkthrough**

Play a complete hand (Easy difficulty — skips bidding) and verify:
- [ ] All 4 hands visible: South face-up, North/West/East face-down
- [ ] West and East card counts decrease as cards are played to tricks
- [ ] Score panel shows NS/EW labels
- [ ] Contract info shows "Declarer: NS (South)" or similar
- [ ] Result screen shows "NS made the contract!" or "EW contract was defeated"

**Step 2: Medium/Hard game walkthrough**

Play with Hard difficulty and verify:
- [ ] Auction history shows "South / West / North / East" not "You / Computer"
- [ ] Contract info updates correctly after bidding

**Step 3: Mobile check**

Resize browser to 375px width. Verify:
- [ ] West/East columns are visible and not overflowing
- [ ] Cards are legibly sized
- [ ] Layout isn't broken

**Step 4: Card design check**

- [ ] Cards look Taki-style: bold colored tints, large center suit symbol, rainbow face-down back
- [ ] Ranks are legible at all sizes
- [ ] Legal card gold highlight still clearly visible

**Step 5: Commit if any fixes needed, then final commit**
```bash
git add -p   # stage only intentional fixes
git commit -m "fix: partnership UI + card design visual QA fixes"
```
