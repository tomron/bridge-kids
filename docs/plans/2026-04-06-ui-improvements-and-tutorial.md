# UI Improvements & Tutorial Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish the Bridge for Kids UI (typography, cards, buttons, textures) and add a 4-slide first-run tutorial wizard with CSS/SVG illustrations.

**Architecture:** All changes are pure HTML/CSS/JS — no build step, no dependencies except adding the Nunito Google Font. UI improvements go into `style.css`. The tutorial wizard is a new modal added to `index.html` and driven by a new `js/tutorial.js` file. `localStorage` key `bridge-kids-tutorial-done` gates auto-show. The Help button in `game.js` is re-wired to open the tutorial instead of (or in addition to) the hint overlay.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Google Fonts (Nunito), CSS animations, SVG inline illustrations, localStorage API.

---

### Task 1: Add Nunito font and establish refined color/typography tokens

**Files:**
- Modify: `index.html` (add font link in `<head>`)
- Modify: `style.css` (update base styles, add CSS custom properties)

**Step 1: Add Google Fonts link to `index.html`**

In `index.html`, inside `<head>`, add after the `<title>` tag:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
```

**Step 2: Add CSS custom properties and update base styles in `style.css`**

Replace the opening `/* ── Reset & base ── */` block (lines 1–9) with:

```css
/* ── Design tokens ── */
:root {
  --felt: #1a6b2a;
  --felt-dark: #0f3d16;
  --felt-darker: #0a2e10;
  --gold: #f5c842;
  --gold-glow: rgba(245, 200, 66, 0.6);
  --text-light: #e8f8ea;
  --text-muted: #9dc9a2;
  --panel-bg: linear-gradient(180deg, #0a2e10 0%, #1a4a20 100%);
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
  --radius-card: 10px;
  --radius-btn: 10px;
}

/* ── Reset & base ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Nunito', 'Segoe UI', Arial, sans-serif;
  background: var(--felt);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='4' height='4' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
  color: #fff;
  min-height: 100vh;
}

.hidden { display: none !important; }
```

**Step 3: Verify visually**

Open `index.html` in a browser. The text should now render in Nunito (rounded letters). The felt should have a very subtle grain texture.

**Step 4: Commit**

```bash
git add index.html style.css
git commit -m "feat: add Nunito font and CSS design tokens with felt texture"
```

---

### Task 2: Polish the side panel and action buttons

**Files:**
- Modify: `style.css` (side panel, buttons sections)

**Step 1: Replace `/* ── Side panel ── */` block in `style.css`**

Replace lines from `#side-panel {` through `#new-session-btn { ... }` with:

```css
/* ── Side panel ── */
#side-panel {
  background: var(--panel-bg);
  padding: 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border-right: 1px solid rgba(245, 200, 66, 0.15);
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.4);
}

#side-panel h1 {
  font-size: 1.15rem;
  font-weight: 800;
  text-align: center;
  color: var(--gold);
  line-height: 1.3;
  letter-spacing: 0.02em;
  text-shadow: 0 0 12px var(--gold-glow);
}

.section-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 8px;
}

/* Difficulty buttons */
#difficulty-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diff-btn {
  padding: 8px 10px;
  border: 2px solid #3a7a45;
  background: rgba(255,255,255,0.05);
  color: #fff;
  border-radius: 20px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  text-align: left;
}

.diff-btn:hover { background: rgba(255,255,255,0.12); transform: translateX(2px); }
.diff-btn.active {
  background: rgba(245, 200, 66, 0.15);
  border-color: var(--gold);
  color: var(--gold);
  font-weight: 700;
}

/* Contract info */
#contract-display {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--gold);
  text-shadow: 0 0 8px var(--gold-glow);
}

#trump-display {
  font-size: 0.82rem;
  color: #bdd8bf;
  margin-top: 3px;
}

/* Trick & score counts */
#trick-counts, #session-scores {
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 2;
  margin-bottom: 8px;
}

#trick-counts span, #session-scores span {
  font-weight: 800;
  color: var(--gold);
}

/* Action buttons */
#action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

#action-buttons button {
  padding: 11px 10px;
  border: none;
  border-radius: var(--radius-btn);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  transition: filter 0.15s, transform 0.1s;
}

#action-buttons button:hover { filter: brightness(1.12); transform: translateY(-1px); }
#action-buttons button:active { transform: translateY(0); }

#new-game-btn {
  background: var(--gold);
  color: #1a3a00;
  animation: none;
}

/* Pulse animation shown only on start screen */
body.at-start #new-game-btn {
  animation: btn-pulse 1.8s ease-in-out infinite;
}

@keyframes btn-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--gold-glow); }
  50% { box-shadow: 0 0 0 8px rgba(245,200,66,0); }
}

#help-btn { background: #3a8fc7; color: #fff; }
#new-session-btn { background: #3a4a3a; color: #9dc9a2; font-size: 0.78rem; padding: 7px 10px; }
```

**Step 2: Add `at-start` class toggle to `game.js`**

In `js/game.js`, find the `renderPhase()` function. After the line `document.getElementById('start-screen').classList.remove('hidden');` add:

```js
document.body.classList.add('at-start');
```

And at the top of `renderPhase()`, before the forEach, add:

```js
document.body.classList.remove('at-start');
```

**Step 3: Verify visually**

Open in browser. Side panel should show woodgrain gradient, gold title glow, pill-shaped difficulty buttons. New Game button should pulse on start screen only.

**Step 4: Commit**

```bash
git add style.css js/game.js
git commit -m "feat: polish side panel, action buttons, add pulse animation on start"
```

---

### Task 3: Upgrade cards and trick area

**Files:**
- Modify: `style.css` (card and trick area sections)

**Step 1: Replace `/* ── Cards ── */` section in `style.css`**

Replace from `.card {` through `.card.disabled { ... }` with:

```css
/* ── Cards ── */
.card {
  width: 72px;
  height: 108px;
  border-radius: var(--radius-card);
  border: 2px solid #ccc;
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
}

.card .rank { font-size: 0.95rem; line-height: 1; }
.card .suit { font-size: 1.15rem; line-height: 1; text-align: center; }
.card .rank-bottom { font-size: 0.95rem; line-height: 1; text-align: right; transform: rotate(180deg); }

.card.red { color: #cc0000; border-color: #cc9999; }

.card.face-down {
  background:
    repeating-linear-gradient(
      135deg,
      #1a4a7a,
      #1a4a7a 5px,
      #2268a8 5px,
      #2268a8 10px
    );
  border-color: #1a3a6a;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card.face-down::after {
  content: '♠';
  font-size: 1.6rem;
  color: rgba(255,255,255,0.25);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Legal / playable cards */
.card.legal {
  cursor: pointer;
  border-color: var(--gold);
  box-shadow: 0 0 10px var(--gold-glow), var(--card-shadow);
}

.card.legal:hover {
  transform: translateY(-12px);
  box-shadow: 0 10px 20px var(--gold-glow), var(--card-shadow);
}

/* Disabled (not legal to play) */
.card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(20%);
}
```

**Step 2: Replace `/* ── Trick area ── */` section**

Replace from `#trick-area {` through `@keyframes pulse { ... }` with:

```css
/* ── Trick area ── */
#trick-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

#trick-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
}

/* Dashed circle behind the trick */
#trick-cards::before {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 2px dashed rgba(255,255,255,0.12);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.trick-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.trick-slot {
  width: 80px;
  height: 112px;
  border-radius: var(--radius-card);
  border: 2px dashed rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.trick-slot .card {
  width: 72px;
  height: 104px;
}

#trick-center-label {
  width: 64px;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
}

/* Three-dot thinking indicator */
#thinking-indicator {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--gold);
  display: flex;
  align-items: center;
  gap: 6px;
}

#thinking-indicator::after {
  content: '';
  display: inline-flex;
  gap: 4px;
}

.thinking-dots {
  display: flex;
  gap: 5px;
}

.thinking-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--gold);
  animation: dot-bounce 1s ease-in-out infinite;
}

.thinking-dots span:nth-child(2) { animation-delay: 0.15s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40% { transform: translateY(-6px); opacity: 1; }
}
```

**Step 3: Update the thinking indicator HTML in `index.html`**

Replace:
```html
<div id="thinking-indicator" class="hidden">Computer is thinking…</div>
```
With:
```html
<div id="thinking-indicator" class="hidden">
  Computer is thinking
  <span class="thinking-dots">
    <span></span><span></span><span></span>
  </span>
</div>
```

**Step 4: Update tablet card size in responsive section of `style.css`**

Find `@media (max-width: 900px)` and update the `.card` rule:
```css
.card { width: 60px; height: 90px; font-size: 0.85rem; }
```

**Step 5: Verify visually**

Open in browser, start a game. Cards should be larger with shadows. Playable cards glow gold and lift 12px on hover. Face-down cards show faint ♠. Trick area has a dashed circle. "Computer is thinking" shows bouncing dots.

**Step 6: Commit**

```bash
git add index.html style.css
git commit -m "feat: upgrade card sizes, trick area dashed ring, three-dot thinking indicator"
```

---

### Task 4: Polish hand labels, result screen, and miscellaneous styles

**Files:**
- Modify: `style.css`

**Step 1: Update hand label and start screen styles**

Replace `/* ── Hand areas ── */` section:

```css
/* ── Hand areas ── */
.hand-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.hand-label {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  background: rgba(0,0,0,0.2);
  padding: 3px 14px;
  border-radius: 12px;
}

.cards-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
}
```

**Step 2: Update start screen styles**

Replace `/* ── Start screen ── */` section:

```css
/* ── Start screen ── */
#start-screen {
  text-align: center;
  color: var(--text-light);
  line-height: 2.2;
  padding: 24px;
}

#start-screen h2 {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--gold);
  margin-bottom: 12px;
  text-shadow: 0 0 16px var(--gold-glow);
}

#start-screen p {
  font-size: 1.05rem;
  font-weight: 600;
}
```

**Step 3: Update result area styles**

Replace `/* ── Result area ── */` section:

```css
/* ── Result area ── */
#result-area {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
}

#result-message {
  font-size: 1.7rem;
  font-weight: 800;
}

#result-message.win { color: var(--gold); text-shadow: 0 0 20px var(--gold-glow); }
#result-message.loss { color: #8ab4f8; }

#result-score {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-light);
  line-height: 1.9;
  background: rgba(0,0,0,0.25);
  border-radius: 12px;
  padding: 12px 20px;
}

#next-hand-btn {
  padding: 14px 32px;
  background: var(--gold);
  color: #1a3a00;
  border: none;
  border-radius: var(--radius-btn);
  font-family: inherit;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  transition: filter 0.15s, transform 0.1s;
  box-shadow: 0 4px 16px var(--gold-glow);
}

#next-hand-btn:hover { filter: brightness(1.1); transform: translateY(-2px); }
```

**Step 4: Add win/loss class to result message in `game.js`**

In `renderResult()`, after setting `result-message` textContent, add:

```js
const msgEl = document.getElementById('result-message');
msgEl.textContent = d.friendly;
const isWin = d.friendly.toLowerCase().includes('made') || d.friendly.toLowerCase().includes('you won');
msgEl.className = isWin ? 'win' : 'loss';
```

Remove the existing `document.getElementById('result-message').textContent = d.friendly;` line.

**Step 5: Verify visually**

Start a game, play through. Result screen should show gold shimmer for wins, blue for losses. Hand labels should be pill-shaped. Start screen heading should have a glow.

**Step 6: Commit**

```bash
git add style.css js/game.js
git commit -m "feat: polish hand labels, result screen win/loss styles, start screen"
```

---

### Task 5: Create the tutorial wizard HTML structure

**Files:**
- Modify: `index.html` (add tutorial modal after hint-overlay)

**Step 1: Add tutorial modal HTML**

In `index.html`, after the closing `</div>` of `#hint-overlay` and before `<script src="js/cards.js">`, add:

```html
<!-- Tutorial wizard -->
<div id="tutorial-overlay" class="hidden">
  <div id="tutorial-modal">
    <button id="tutorial-skip">Skip Tutorial</button>

    <div id="tutorial-slides">

      <!-- Slide 1: Welcome -->
      <div class="tutorial-slide" data-slide="0">
        <div class="tutorial-illustration" id="tut-illus-0">
          <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
            <!-- Table oval -->
            <ellipse cx="140" cy="80" rx="120" ry="65" fill="none" stroke="rgba(245,200,66,0.3)" stroke-width="2" stroke-dasharray="6 4"/>
            <!-- N label -->
            <rect x="112" y="8" width="56" height="28" rx="8" fill="#1a4a20" stroke="#f5c842" stroke-width="1.5"/>
            <text x="140" y="27" text-anchor="middle" fill="#9dc9a2" font-size="12" font-family="Nunito,sans-serif" font-weight="700">Computer</text>
            <!-- S label (You) -->
            <rect x="112" y="124" width="56" height="28" rx="8" fill="#f5c842"/>
            <text x="140" y="143" text-anchor="middle" fill="#1a3a00" font-size="12" font-family="Nunito,sans-serif" font-weight="800">You ⭐</text>
            <!-- W label -->
            <rect x="8" y="66" width="48" height="28" rx="8" fill="#1a4a20" stroke="#3a7a45" stroke-width="1.5"/>
            <text x="32" y="85" text-anchor="middle" fill="#9dc9a2" font-size="12" font-family="Nunito,sans-serif" font-weight="700">CPU</text>
            <!-- E label -->
            <rect x="224" y="66" width="48" height="28" rx="8" fill="#1a4a20" stroke="#3a7a45" stroke-width="1.5"/>
            <text x="248" y="85" text-anchor="middle" fill="#9dc9a2" font-size="12" font-family="Nunito,sans-serif" font-weight="700">CPU</text>
            <!-- Center dot -->
            <circle cx="140" cy="80" r="5" fill="rgba(245,200,66,0.5)"/>
          </svg>
        </div>
        <h2>Welcome to Bridge!</h2>
        <p>Bridge is a card game for 4 players. <strong>You</strong> sit at the bottom and play against the computer who controls the other 3 seats.</p>
        <p>Your goal: win <strong>tricks</strong> (rounds of cards) and make your contract!</p>
      </div>

      <!-- Slide 2: The Cards -->
      <div class="tutorial-slide hidden" data-slide="1">
        <div class="tutorial-illustration" id="tut-illus-1">
          <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
            <!-- 4 example cards -->
            <!-- Spades card -->
            <rect x="20" y="20" width="50" height="70" rx="8" fill="white" stroke="#ccc" stroke-width="1.5"/>
            <text x="28" y="38" fill="#111" font-size="13" font-family="Nunito,sans-serif" font-weight="800">A</text>
            <text x="33" y="58" fill="#111" font-size="20" font-family="Nunito,sans-serif">♠</text>
            <!-- Hearts card -->
            <rect x="80" y="20" width="50" height="70" rx="8" fill="white" stroke="#cc9999" stroke-width="1.5"/>
            <text x="88" y="38" fill="#cc0000" font-size="13" font-family="Nunito,sans-serif" font-weight="800">K</text>
            <text x="93" y="58" fill="#cc0000" font-size="20" font-family="Nunito,sans-serif">♥</text>
            <!-- Diamonds card - trump highlighted -->
            <rect x="140" y="14" width="52" height="73" rx="8" fill="white" stroke="#f5c842" stroke-width="2.5"/>
            <text x="148" y="33" fill="#cc0000" font-size="13" font-family="Nunito,sans-serif" font-weight="800">Q</text>
            <text x="154" y="54" fill="#cc0000" font-size="20" font-family="Nunito,sans-serif">♦</text>
            <text x="166" y="100" text-anchor="middle" fill="#f5c842" font-size="9" font-family="Nunito,sans-serif" font-weight="700">TRUMP</text>
            <!-- Clubs card -->
            <rect x="200" y="20" width="50" height="70" rx="8" fill="white" stroke="#ccc" stroke-width="1.5"/>
            <text x="208" y="38" fill="#111" font-size="13" font-family="Nunito,sans-serif" font-weight="800">7</text>
            <text x="213" y="58" fill="#111" font-size="20" font-family="Nunito,sans-serif">♣</text>
            <!-- Label row -->
            <text x="45" y="112" text-anchor="middle" fill="#9dc9a2" font-size="10" font-family="Nunito,sans-serif">Spades</text>
            <text x="105" y="112" text-anchor="middle" fill="#9dc9a2" font-size="10" font-family="Nunito,sans-serif">Hearts</text>
            <text x="166" y="112" text-anchor="middle" fill="#f5c842" font-size="10" font-family="Nunito,sans-serif" font-weight="700">Diamonds</text>
            <text x="225" y="112" text-anchor="middle" fill="#9dc9a2" font-size="10" font-family="Nunito,sans-serif">Clubs</text>
            <text x="140" y="148" text-anchor="middle" fill="#e8f8ea" font-size="10" font-family="Nunito,sans-serif">A is highest, then K Q J 10 … 2 is lowest</text>
          </svg>
        </div>
        <h2>The Cards</h2>
        <p>There are 4 suits: ♠ ♥ ♦ ♣. The <strong>trump suit</strong> (shown in gold) beats all other suits!</p>
        <p>When a suit is led, you <strong>must follow suit</strong> if you can. If you can't, you may play a trump to win!</p>
      </div>

      <!-- Slide 3: Bidding -->
      <div class="tutorial-slide hidden" data-slide="2">
        <div class="tutorial-illustration" id="tut-illus-2">
          <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
            <!-- Bid box representation -->
            <rect x="30" y="15" width="220" height="105" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(245,200,66,0.3)" stroke-width="1.5"/>
            <!-- Sample bid buttons row 1 -->
            <rect x="42" y="28" width="36" height="26" rx="5" fill="rgba(255,255,255,0.08)" stroke="#4a9955" stroke-width="1.5"/>
            <text x="60" y="46" text-anchor="middle" fill="white" font-size="11" font-family="Nunito,sans-serif" font-weight="700">1♣</text>
            <rect x="84" y="28" width="36" height="26" rx="5" fill="rgba(255,255,255,0.08)" stroke="#4a9955" stroke-width="1.5"/>
            <text x="102" y="46" text-anchor="middle" fill="#ff8888" font-size="11" font-family="Nunito,sans-serif" font-weight="700">1♦</text>
            <rect x="126" y="28" width="36" height="26" rx="5" fill="rgba(255,255,255,0.08)" stroke="#4a9955" stroke-width="1.5"/>
            <text x="144" y="46" text-anchor="middle" fill="#ff8888" font-size="11" font-family="Nunito,sans-serif" font-weight="700">1♥</text>
            <rect x="168" y="28" width="36" height="26" rx="5" fill="rgba(255,255,255,0.08)" stroke="#4a9955" stroke-width="1.5"/>
            <text x="186" y="46" text-anchor="middle" fill="white" font-size="11" font-family="Nunito,sans-serif" font-weight="700">1♠</text>
            <rect x="210" y="28" width="36" height="26" rx="5" fill="rgba(255,255,255,0.08)" stroke="#4a9955" stroke-width="1.5"/>
            <text x="228" y="46" text-anchor="middle" fill="white" font-size="10" font-family="Nunito,sans-serif" font-weight="700">1NT</text>
            <!-- Highlighted bid -->
            <rect x="126" y="62" width="36" height="26" rx="5" fill="rgba(245,200,66,0.2)" stroke="#f5c842" stroke-width="2"/>
            <text x="144" y="80" text-anchor="middle" fill="#f5c842" font-size="11" font-family="Nunito,sans-serif" font-weight="800">2♥</text>
            <!-- Arrow pointing to it -->
            <path d="M 100 75 L 122 75" stroke="#f5c842" stroke-width="2" marker-end="url(#arr)"/>
            <defs>
              <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#f5c842"/>
              </marker>
            </defs>
            <text x="75" y="70" text-anchor="middle" fill="#f5c842" font-size="9" font-family="Nunito,sans-serif">Your</text>
            <text x="75" y="82" text-anchor="middle" fill="#f5c842" font-size="9" font-family="Nunito,sans-serif">bid!</text>
            <!-- Pass button -->
            <rect x="80" y="102" width="50" height="10" rx="4" fill="rgba(255,255,255,0.08)" stroke="#4a9955" stroke-width="1"/>
            <text x="105" y="112" text-anchor="middle" fill="white" font-size="8" font-family="Nunito,sans-serif">Pass</text>
            <text x="140" y="142" text-anchor="middle" fill="#9dc9a2" font-size="9" font-family="Nunito,sans-serif">"2♥" means: I'll win 8 tricks with ♥ as trump</text>
          </svg>
        </div>
        <h2>Bidding</h2>
        <p>Before playing, you <strong>bid</strong> how many tricks you think you'll win, plus which suit is trump.</p>
        <p>A bid of <strong>2♥</strong> means "I'll win at least <strong>8 tricks</strong> (6 + 2) with hearts as trump." The highest bid becomes the <strong>contract</strong>!</p>
      </div>

      <!-- Slide 4: Winning Tricks -->
      <div class="tutorial-slide hidden" data-slide="3">
        <div class="tutorial-illustration" id="tut-illus-3">
          <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
            <!-- 4 cards in trick positions -->
            <!-- North -->
            <rect x="112" y="8" width="52" height="36" rx="6" fill="white" stroke="#ccc" stroke-width="1.5"/>
            <text x="122" y="28" fill="#111" font-size="14" font-family="Nunito,sans-serif" font-weight="800">5♠</text>
            <!-- West -->
            <rect x="28" y="62" width="52" height="36" rx="6" fill="white" stroke="#ccc" stroke-width="1.5"/>
            <text x="38" y="82" fill="#111" font-size="14" font-family="Nunito,sans-serif" font-weight="800">J♠</text>
            <!-- East -->
            <rect x="196" y="62" width="52" height="36" rx="6" fill="white" stroke="#ccc" stroke-width="1.5"/>
            <text x="206" y="82" fill="#111" font-size="14" font-family="Nunito,sans-serif" font-weight="800">3♠</text>
            <!-- South (winner - gold border) -->
            <rect x="112" y="116" width="52" height="36" rx="6" fill="white" stroke="#f5c842" stroke-width="2.5"/>
            <text x="122" y="138" fill="#111" font-size="14" font-family="Nunito,sans-serif" font-weight="800">A♠</text>
            <!-- Winner star -->
            <text x="168" y="136" fill="#f5c842" font-size="16" font-family="Nunito,sans-serif">⭐</text>
            <!-- Center label -->
            <text x="140" y="86" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="9" font-family="Nunito,sans-serif">trick</text>
            <!-- Arrow pointing to south -->
            <text x="140" y="108" text-anchor="middle" fill="#f5c842" font-size="9" font-family="Nunito,sans-serif" font-weight="700">▼ You win!</text>
          </svg>
        </div>
        <h2>Winning Tricks</h2>
        <p>Each player plays one card. The <strong>highest card of the led suit wins</strong> — unless someone plays a <strong>trump card</strong>, which beats everything!</p>
        <p>Win enough tricks to make your contract and you score points. Fall short and the computer scores instead!</p>
      </div>

    </div><!-- /#tutorial-slides -->

    <div id="tutorial-footer">
      <div id="tutorial-dots">
        <span class="tut-dot active" data-dot="0"></span>
        <span class="tut-dot" data-dot="1"></span>
        <span class="tut-dot" data-dot="2"></span>
        <span class="tut-dot" data-dot="3"></span>
      </div>
      <div id="tutorial-nav">
        <button id="tut-prev" class="tut-nav-btn" disabled>← Back</button>
        <button id="tut-next" class="tut-nav-btn primary">Next →</button>
        <button id="tut-done" class="tut-nav-btn primary hidden">Got it! Let's Play 🎉</button>
      </div>
    </div>
  </div><!-- /#tutorial-modal -->
</div><!-- /#tutorial-overlay -->
```

**Step 2: Verify HTML is valid**

Open `index.html` in browser. No JS errors in console. The modal is hidden (not yet styled or wired up).

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add tutorial wizard HTML structure (4 slides with SVG illustrations)"
```

---

### Task 6: Style the tutorial wizard

**Files:**
- Modify: `style.css` (add tutorial section at bottom)

**Step 1: Add tutorial styles to end of `style.css`** (before the responsive section)

```css
/* ── Tutorial wizard ── */
#tutorial-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(2px);
}

#tutorial-modal {
  background: var(--felt-darker);
  border: 2px solid var(--gold);
  border-radius: 20px;
  width: 90%;
  max-width: 540px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(245,200,66,0.1);
}

#tutorial-skip {
  position: absolute;
  top: 14px;
  left: 16px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  z-index: 10;
  transition: color 0.15s;
}

#tutorial-skip:hover { color: rgba(255,255,255,0.8); }

/* Slides container */
#tutorial-slides {
  position: relative;
  min-height: 380px;
  overflow: hidden;
}

.tutorial-slide {
  padding: 40px 32px 16px;
  animation: slide-in 0.3s ease forwards;
}

.tutorial-slide.hidden {
  display: none !important;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-back {
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: translateX(0); }
}

.tutorial-slide.going-back {
  animation: slide-in-back 0.3s ease forwards;
}

/* Illustration area */
.tutorial-illustration {
  width: 100%;
  height: 170px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
}

.tutorial-illustration svg {
  width: 100%;
  height: 100%;
}

.tutorial-slide h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--gold);
  margin-bottom: 10px;
  text-align: center;
}

.tutorial-slide p {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-light);
  line-height: 1.7;
  text-align: center;
  margin-bottom: 8px;
}

.tutorial-slide p strong {
  color: var(--gold);
}

/* Footer */
#tutorial-footer {
  padding: 14px 24px 20px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

/* Progress dots */
#tutorial-dots {
  display: flex;
  gap: 10px;
}

.tut-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(245,200,66,0.5);
  background: transparent;
  transition: background 0.2s, border-color 0.2s;
  cursor: pointer;
}

.tut-dot.active {
  background: var(--gold);
  border-color: var(--gold);
}

/* Navigation buttons */
#tutorial-nav {
  display: flex;
  gap: 10px;
}

.tut-nav-btn {
  padding: 10px 22px;
  border-radius: var(--radius-btn);
  border: 2px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.07);
  color: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s, transform 0.1s;
}

.tut-nav-btn:hover:not(:disabled) { filter: brightness(1.2); transform: translateY(-1px); }
.tut-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.tut-nav-btn.primary {
  background: var(--gold);
  color: #1a3a00;
  border-color: var(--gold);
  box-shadow: 0 4px 14px var(--gold-glow);
}
```

**Step 2: Verify styles**

Temporarily remove the `hidden` class from `#tutorial-overlay` in `index.html` and open in browser. Modal should appear centered with dark green background, gold border, illustrations in rounded boxes, progress dots, and nav buttons. Re-add `hidden` after verification.

**Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add tutorial wizard styles with slide animations and progress dots"
```

---

### Task 7: Wire up tutorial JavaScript logic

**Files:**
- Create: `js/tutorial.js`
- Modify: `index.html` (add script tag)
- Modify: `js/game.js` (re-wire Help button)

**Step 1: Create `js/tutorial.js`**

```js
// ── Tutorial wizard ───────────────────────────────────────────────────────────
const TUTORIAL_KEY = 'bridge-kids-tutorial-done';
const TOTAL_SLIDES = 4;

let currentSlide = 0;
let goingBack = false;

function showTutorial() {
  currentSlide = 0;
  goingBack = false;
  updateTutorialSlide();
  document.getElementById('tutorial-overlay').classList.remove('hidden');
}

function hideTutorial() {
  document.getElementById('tutorial-overlay').classList.add('hidden');
}

function completeTutorial() {
  localStorage.setItem(TUTORIAL_KEY, '1');
  hideTutorial();
}

function goToSlide(index, back = false) {
  const slides = document.querySelectorAll('.tutorial-slide');
  slides[currentSlide].classList.add('hidden');
  currentSlide = index;
  goingBack = back;
  updateTutorialSlide();
}

function updateTutorialSlide() {
  const slides = document.querySelectorAll('.tutorial-slide');

  slides.forEach((s, i) => {
    s.classList.toggle('hidden', i !== currentSlide);
    s.classList.remove('going-back');
  });

  const activeSlide = slides[currentSlide];
  if (goingBack) activeSlide.classList.add('going-back');

  // Update dots
  document.querySelectorAll('.tut-dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentSlide);
  });

  // Update nav buttons
  const prevBtn = document.getElementById('tut-prev');
  const nextBtn = document.getElementById('tut-next');
  const doneBtn = document.getElementById('tut-done');

  prevBtn.disabled = currentSlide === 0;

  const isLast = currentSlide === TOTAL_SLIDES - 1;
  nextBtn.classList.toggle('hidden', isLast);
  doneBtn.classList.toggle('hidden', !isLast);
}

function initTutorial() {
  // Auto-show on first visit
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    setTimeout(showTutorial, 500);
  }

  // Skip button
  document.getElementById('tutorial-skip').addEventListener('click', completeTutorial);

  // Done button
  document.getElementById('tut-done').addEventListener('click', () => {
    completeTutorial();
    dispatch({ type: 'NEW_GAME' });
  });

  // Next / Prev
  document.getElementById('tut-next').addEventListener('click', () => {
    if (currentSlide < TOTAL_SLIDES - 1) goToSlide(currentSlide + 1, false);
  });

  document.getElementById('tut-prev').addEventListener('click', () => {
    if (currentSlide > 0) goToSlide(currentSlide - 1, true);
  });

  // Dot navigation
  document.querySelectorAll('.tut-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.dot, 10);
      if (target !== currentSlide) goToSlide(target, target < currentSlide);
    });
  });

  // Keyboard navigation (arrow keys only, no Escape)
  document.addEventListener('keydown', e => {
    if (document.getElementById('tutorial-overlay').classList.contains('hidden')) return;
    if (e.key === 'ArrowRight' && currentSlide < TOTAL_SLIDES - 1) goToSlide(currentSlide + 1, false);
    if (e.key === 'ArrowLeft' && currentSlide > 0) goToSlide(currentSlide - 1, true);
  });

  // Clicking the backdrop does NOT close (intentional for kids)
}
```

**Step 2: Add script tag to `index.html`**

In `index.html`, add `<script src="js/tutorial.js"></script>` before `<script src="js/game.js"></script>`.

**Step 3: Wire Help button to show tutorial in `js/game.js`**

In the `DOMContentLoaded` handler, replace:
```js
document.getElementById('help-btn').addEventListener('click', () => dispatch({ type: 'SHOW_HINT' }));
```
With:
```js
document.getElementById('help-btn').addEventListener('click', () => {
  if (gameState.phase === 'start') {
    showTutorial();
  } else {
    dispatch({ type: 'SHOW_HINT' });
  }
});
```

**Step 4: Call `initTutorial()` at the end of the `DOMContentLoaded` handler in `js/game.js`**

After `render();` at the end of the `DOMContentLoaded` handler, add:
```js
initTutorial();
```

**Step 5: Verify behavior**

1. Clear `localStorage` (`localStorage.removeItem('bridge-kids-tutorial-done')` in console), reload — tutorial should auto-appear after 500ms
2. Navigate with Next/Back buttons, dots, and arrow keys
3. Click "Got it! Let's Play" — tutorial hides and a new game starts
4. Reload — tutorial does NOT appear again (localStorage key is set)
5. Click Help button from start screen — tutorial re-opens

**Step 6: Commit**

```bash
git add js/tutorial.js index.html js/game.js
git commit -m "feat: wire up tutorial wizard JS with localStorage persistence and keyboard nav"
```

---

### Task 8: Final visual verification and polish pass

**Files:**
- Modify: `style.css` (responsive updates)

**Step 1: Update responsive CSS for new card sizes**

In `@media (max-width: 900px)`, ensure:
```css
.card { width: 60px; height: 90px; font-size: 0.85rem; }
.trick-slot { width: 68px; height: 96px; }
.trick-slot .card { width: 60px; height: 88px; }
```

In `@media (max-width: 768px)`, add:
```css
#tutorial-modal { max-width: 100%; border-radius: 14px 14px 0 0; align-self: flex-end; margin-top: auto; }
#tutorial-overlay { align-items: flex-end; }
.tutorial-slide { padding: 28px 20px 12px; }
.tutorial-illustration { height: 130px; }
```

**Step 2: Save memory**

Save a user memory noting the project uses Nunito font, CSS tokens with `--felt`, `--gold` variables, and `localStorage` key `bridge-kids-tutorial-done`.

**Step 3: Full play-through test**

1. Open fresh browser (clear localStorage)
2. Tutorial auto-appears → navigate all 4 slides → click "Got it! Let's Play"
3. New game starts — cards are larger with shadows, felt has texture
4. Play a full hand — computer thinking shows bouncing dots
5. Result screen shows gold shimmer for win / blue for loss
6. Click Help mid-game — hint overlay appears (not tutorial)
7. Reload — tutorial does NOT reappear

**Step 4: Commit**

```bash
git add style.css
git commit -m "feat: responsive polish for tutorial and card sizes on tablet"
```

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `index.html` | Nunito font, tutorial HTML (4 slides + SVG illustrations), tutorial script tag |
| `style.css` | Design tokens, felt texture, woodgrain panel, card upgrades, trick area ring, thinking dots, result win/loss styles, tutorial modal styles |
| `js/game.js` | `at-start` class toggle, win/loss class on result, Help button re-wired, `initTutorial()` call |
| `js/tutorial.js` | **New** — all tutorial logic, localStorage gate, slide navigation |
