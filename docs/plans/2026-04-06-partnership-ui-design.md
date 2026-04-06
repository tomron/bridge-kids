# Partnership UI Design

**Date:** 2026-04-06  
**Goal:** Make the Bridge for Kids UI clearly reflect that Bridge is a partnership game (NS vs EW), show all four hands on a proper table layout, and correct scoring labels.

---

## Summary of Changes

1. **Full cardinal-direction table layout** — West/East hands added to left/right of trick area
2. **Partnership labels (NS/EW)** — replace "You/Computer" throughout the UI
3. **Card visibility** — only South (player) is face-up; North/West/East are face-down backs

---

## Layout

`#table` becomes a 3×3 CSS grid:

```
[empty]     [North hand]   [empty]
[West hand] [center area]  [East hand]
[empty]     [South hand]   [empty]
```

- **North:** horizontal row of face-down card backs (top)
- **South:** horizontal row of face-up cards (bottom, clickable)
- **West:** vertical column of face-down card backs, cards rotated 90°, left side
- **East:** vertical column of face-down card backs, cards rotated 90°, right side

---

## Partnership Labels & Scoring

Each hand label shows a team badge:
- North + South → gold **NS** badge
- West + East → teal **EW** badge

Score panel:
- Tricks: "NS: X" / "EW: Y"
- Session Score: "NS: X pts" / "EW: Y pts"

Contract info:
- Declarer shown as e.g. "Declarer: NS (West)"

Result screen:
- "NS made the contract! 🎉" or "EW made the contract!"

Auction history:
- Positions shown by name (South, West, North, East) instead of "You / Computer"

---

## Card Visibility

| Position | Visibility | Interaction |
|----------|-----------|-------------|
| South    | Face-up   | Clickable on your turn |
| North    | Face-down backs | None |
| West     | Face-down backs (vertical) | None |
| East     | Face-down backs (vertical) | None |

Cards played to the trick are always shown face-up in the trick area (existing behavior).

---

## Files Affected

- `index.html` — add `#west-hand` and `#east-hand` sections, update labels
- `style.css` — rework `#table` to 3×3 grid, add vertical hand styles
- `js/game.js` — update `renderHands()`, `renderScores()`, `renderContractInfo()`, `renderResult()`, `renderBidBox()` to use NS/EW labels
