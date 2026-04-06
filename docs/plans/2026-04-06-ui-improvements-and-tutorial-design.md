# UI Improvements & Tutorial Wizard — Design

**Date:** 2026-04-06
**Scope:** Visual polish + first-run tutorial for Bridge for Kids

---

## Goals

1. Polish the existing green felt UI to feel premium and kid-friendly simultaneously (Option A — "Polished Green Felt")
2. Add a 4-slide tutorial wizard that shows on first visit and is re-openable via the Help button

---

## Section 1: UI Improvements

### Typography & Color System

- Add `Nunito` (Google Fonts) as the primary typeface — rounded, friendly, highly legible for children
- Refine gold accent from `#ffd700` to `#f5c842` with subtle glow on active/interactive elements
- Felt background gains a CSS noise/grain texture (SVG filter or CSS `background-image` pattern — no external asset)
- Side panel uses a woodgrain gradient (`#0a2e10` → `#1a4a20`) with a right-side inset shadow

### Cards

- Increase size: `72px × 108px` desktop, `60px × 90px` tablet
- All cards: `box-shadow: 0 4px 12px rgba(0,0,0,0.4)` for depth
- Legal/playable cards: brighter gold border + `12px` hover lift (up from `8px`)
- Face-down cards: polished diagonal stripe pattern with a CSS-only ♠ symbol centered

### Buttons & Panels

- "New Game" button: pulsing glow animation on start screen to invite first click
- Difficulty buttons: pill-shaped with icon prefixes (🟢 Easy, 🟡 Medium, 🔴 Hard)
- Result screen: gold shimmer style for win, soft blue for loss
- "Computer is thinking…": animated three-dot bouncing spinner instead of text pulse

### Layout

- Side panel: widen to `220px` with improved section spacing
- Hand labels (`You` / `Computer`): larger, more prominent styled text
- Trick center area: subtle dashed circular ring via CSS to indicate table center
- Overall feel: card table with depth and texture, not a flat web form

---

## Section 2: Tutorial Wizard

### Trigger & Persistence

- Auto-shown on first visit with a 500ms delay (intentional feel)
- Stored in `localStorage` key: `bridge-kids-tutorial-done`
- Returning players skip automatically; Help button always re-opens from slide 1

### Slides

| # | Title | Illustration | Key Content |
|---|-------|-------------|-------------|
| 1 | Welcome to Bridge! | CSS N/S/E/W table diagram with "You" highlighted at South | What the game is, meet the table |
| 2 | The Cards | Mini 4-card hand with suit symbols | Suits, trump, following suit explained |
| 3 | Bidding | Annotated bid box with call-out arrow | What a contract is, how to bid number+suit |
| 4 | Winning Tricks | 4-card trick layout with winner highlighted | Highest card wins, or trump beats all |

### Navigation

- Previous / Next buttons + dot-indicator (`1●○○○` style)
- "Got it! Let's Play" button on slide 4 — dismisses and starts a new game
- "Skip Tutorial" text link (small, bottom-left) on every slide
- Clicking the dark backdrop does NOT close (prevents accidental dismissal)
- Keyboard: left/right arrow keys navigate; Escape does nothing

### Visual Style

- Modal: `max-width: 540px`, `border-radius: 20px`, dark green (`#0a2e10`), gold border
- Each slide: CSS/SVG illustration in the top ~180px, explanatory text below
- Slide transitions: smooth horizontal slide (`transform: translateX`)
- Progress dots: gold fill for current slide, outline for others

---

## Out of Scope

- Sound effects or music
- Animation on card deal
- Accessibility (ARIA) compliance — nice-to-have post-v1
- Mobile phone layout (tablet 768px minimum)
