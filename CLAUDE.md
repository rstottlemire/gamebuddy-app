# GameBuddy

A board game / TTRPG companion, built as an installable, fully offline PWA. No build step and no runtime dependencies: the app is `index.html` (inline CSS and JS) plus local fonts, images and icons.

- **Live:** https://rstottlemire.github.io/gamebuddy-app/ (GitHub Pages, repo `rstottlemire/gamebuddy-app`)
- **Deploying:** the user uploads files through GitHub's web UI. `HOW-TO-UPDATE.md` is the plain-English guide; keep it in sync if the file list changes.

## Files

- `index.html`: the entire app (styles, icon sprite, markup, script)
- `sw.js`: service worker. **Bump `CACHE` (e.g. `gamebuddy-v7` → `v8`) whenever any shipped file changes.** It precaches every file in `ASSETS` (add new files there). The page is network-first with a 3 s fallback to the single cached copy at `./index.html`; everything else is cache-first.
- `manifest.json`: name, colors (`#120d0a`), and icons (any + maskable)
- `fonts/`: `fredoka-one.woff2`, `nunito.woff2` (variable, 200–1000), both OFL, from Google Fonts
- `img/`: compressed backgrounds (`bg-*.jpg`, pre-blurred and darkened), landing hero (`hero-game-night.jpg`), landing mode panels (`panel-*.jpg`)
- `icons/`: `icon.svg` (master artwork: wood-grain meeple and red d6 on a walnut tile), rendered to `icon-192/512.png` (rounded), `icon-maskable-512.png`, `apple-touch-icon.png` (180, full-bleed), `favicon-32.png`
- `design-refs/`: the user's original reference photos (not shipped)
- `index.v1-backup.html`, `sw.v1-backup.js`: snapshot from before the three-mode restructure (not shipped)
- `generate-assets.html`, `icons/screenshot.png`: leftovers from the original version, no longer used

## Look and feel

The theme is warm and dark, built from real materials: walnut trays (`.card`, with a faint SVG-noise wood grain), felt (`.felt`, used in General mode), a velvet dice tray (`.tray`, TTRPG), brass accents, and parchment/score-pad paper (score grid, notes). Text color is `--ink` (parchment). Mode accents are set by `body[data-mode]`: landing = brass, board = meeple yellow, ttrpg = ember orange (with lavender as `--accent-2`), general = felt green. Each mode also swaps the fixed `.app-bg` photo.

- **Icons:** one line-style SVG sprite (`<symbol id="i-…">` at the top of `<body>`). Use `ic('name')` in JS or `<svg class="ic"><use href="#i-name"/></svg>` in markup. **No emoji in the UI.** (Card suit glyphs ♠♥♦♣ are fine; the copied-results text uses medal emoji on purpose.)
- **Meeples:** `meepleSvg(color, cls, lite)` draws the color with an SVG wood-grain filter (`#mpGrain`; `lite` uses the subtler `#mpGrainLite` for small sizes), a shading gradient, and a black outline. The CSS drop-shadow glow keeps the black meeple visible.
- **Buttons:** chunky and tactile: a colored bottom-edge shadow that presses down 2px on `:active`. Tap targets are at least 40–46px.
- **Motion:** quick (≤ ~350 ms): panel rise, dice tumble, chip pop, sheet slide. `prefers-reduced-motion` turns animations off.
- **Native feel:** no text selection or long-press callouts on UI (inputs re-enable them), safe-area padding on the header, nav, sheets and timer overlay.

## Structure

The app opens on a **landing page** (hero photo plus three mode panels). The chosen mode is saved (`gb-mode`) and reopened on the next launch. The header has a Home button in modes (on the landing page it's a ? button that opens **How to Install**) and a Notes button available everywhere.

| Mode | Tabs (bottom nav, built per mode from `MODES`) |
|---|---|
| **Board Game** | Active Players (default), Turn Order, Score Pad, Spinner, Player Clock |
| **TTRPG** | Dice Roller, Combat Tracker |
| **General** | Cards, Coin Flip, Countdown |

Each tab is a `<div id="panel-<id>" class="panel">`. `showPanel(id)` switches tabs and runs the tab's render hook.

### Board Game

- **Active Players**: 12 meeples (`MEEPLES`). Tap toggles active; press and hold (550 ms) opens a name dialog. The lineup is saved as `gb-lineup` (`{active:[colorIds], names:{colorId:name}}`).
- **Per-tab rosters**: Turn Order, Score Pad and Player Clock read players through `roster(tab)`. A roster follows the lineup until the tab adds or removes a player, which makes it a local copy (`gb-rosters[tab].custom`). "Use lineup" goes back to following the lineup.
- **Turn Order**: shuffle into a full order, or pick one random player. The last order is saved as `gb-turn-last`; `clearTurnOrder()` (the Clear button, and Deactivate all on the Players tab) removes it.
- **Score Pad**: a paper-styled grid with a sticky category column and one column per player. Saved in progress as `gb-score` (`{cats, vals:{catId:{playerId:string}}, low, game}`). Enter/Next walks across a row, then down. The ± button handles iPhone keypads without a minus key. The leader gets a highlighter mark; once the sheet is full, the top 3 get medal coins (the lowest 3 with "Lowest score wins" on). Templates are saved as `gb-score-templates`.
  - **Share Results**: "Copy Results" puts a text summary on the clipboard. "Scorecard Image" draws a 1080-wide JPEG on a canvas (`buildScorecard`): an optional board photo, the standings, and the category table on paper. Its preview has Share (Web Share API with files) and Save to Phone (an `<a download>`, or the share sheet on iPhone). The photo is picked through `<label for="photoCam|photoLib">` because iPhone won't open a file picker from a JS click after an await.
- **Spinner**: a canvas wheel with a walnut rim, brass hub and pointer, and a tick sound per wedge. "Fill with Active Players" loads the lineup.
- **Player Clock**: a chess clock with modes Count Up, Time Bank and Per Turn (optional bank unused time). Alerts at 10 s and 0 s. Out-of-time players can be skipped. "Use Turn Order" imports `gb-turn-last`. Face-down (`deviceorientation`, |beta| > 150°) pauses; face-up passes to the next player. iOS needs `DeviceOrientationEvent.requestPermission()` from a tap. Each pass pushes a snapshot to `pt.history`, so "Prev" restores it exactly. Uses Wake Lock. Settings are saved as `gb-ptimer`.

### TTRPG

- **Dice Roller**: dice buttons are "resin" SVG dice drawn by `dieIconSvg()` with `rz-*` gradients (a rainbow matching the TTRPG photo). Options: Damage across the top (red outline), then Advantage/Disadvantage and Wild Card/Exploding columns.
  - Exploding is automatic; each roll of a chain is its own tile in a `.die-group`, with "= sum" underneath.
  - **Modifier** (`diceSet.mod`, saved in `gb-dice-set` along with `tn` and `tough`) adds to totals. With Wild Card it applies to each die before comparing. With only Fate dice it acts as the skill.
  - **Damage** is one-shot (`enterDamage`/`exitDamage`). `swDamage()` is true when Damage was turned on while Wild Card was on; then the stepper becomes **Toughness** and the banner shows Shaken/Wounds (each raise = 1 Wound).
  - **Wild Card** (Savage Worlds) adds an exploding Wild d6, locks Exploding on, and turns Advantage/Disadvantage off. Kept dice are highlighted and no total is shown. The **Target** stepper drives the success/raise banner (`swOutcome`). Critical Failure follows SWADE.
  - **Natural 20 / Natural 1** banner on a single d20 without Wild Card.
  - **Roll history**: last 30 rolls in `gb-roll-hist` (`{t, d, r, c}`).
  - **Characters**: `gb-dice-chars` = `{chars:[{id,name,presets:[]}], cur}`. Presets store `dice`, `mod`, and `wild` or `damage/explode/sw`. Old `gamebuddy-dice-presets` were migrated once into "My Presets".
- **Combat Tracker**: saved in `gb-combat` (`{list, round, turn, gm, sys, scene}`) on every render. A **system picker** (`combatSys`: `std` / `sw` / `fate`) chooses what each card shows (`combatCardHtml`):
  - **Standard:** HP or damage dealt (GM mode), +/− with step, tap the HP number to type damage or healing (`hpEdit`), D&D-style conditions.
  - **Savage Worlds:** no HP. Bennies, Wounds (3 + INC) and Fatigue (2 + INC) pips with the total penalty, SWADE statuses (`SW_CONDITIONS`). INC wounds = Incapacitated.
  - **Fate:** Physical/Mental stress boxes (tap the label to resize, default 3), Mild/Moderate/Severe consequences, Fate points, Taken Out, and aspects with free invokes (`aspectMenu`). A Scene card (`fateScene`) holds situation aspects and **zones**; combatants get a zone chip and the list groups by zone. **Popcorn initiative**: "Pick next" (`pickNext`) lets the current actor choose from those who haven't acted; when everyone has, the round advances. Combatants keep the order they were added in.
  - **Sides:** each combatant has `side` = `party` / `enemy` / `neutral` (`SIDES`: green / red / yellow), which drives the card's `--cc` color. Pick it in the Add form's side picker (default Enemy); tap the side tag on a card to cycle it.
  - **Parties:** `gb-parties` = `{parties:[{id,name,members:[{name,maxHp,physN,mentN,fp}]}], cur}`. "Start fight with …" (`startFight`) clears the tracker and adds the members as fresh Party combatants; "Save current party" stores the current Party-side combatants. Tabs work like the dice Characters tabs.
  - **Initiative:** in Standard and Savage Worlds, tap the initiative token to type it (`editInit`); the list re-sorts and the active combatant stays active.
  - Dialogs support `numeric`, `row`, and `'INPUT:action'` buttons.
- **Fate dice:** a tray of only dF (no Wild Card) shows Fate ladder names (`ladder()`), and the stepper becomes **Opposition** (`diceSet.opp`). The banner shows Fail / Tie / Succeed / Succeed with Style (3+ shifts).

### General

- **Cards**: a 52-card deck (optional jokers) on a felt table. The card backs are red lattice with a meeple emblem.
- **Coin Flip**: a 3D gold coin (CSS 3D, SVG faces: an embossed meeple on heads, a d20 showing 1 on tails, a reeded edge). History is kept for the session.
- **Countdown**: a kitchen-timer style dial (brass ticks, colored arc), presets and custom times, Wake Lock.

### Shared helpers

`ic(name)`, `uiAlert/uiConfirm/uiPrompt/uiDialog` (in-app, Promise-based; **never use the browser's `alert/confirm/prompt`**), `toast(msg)`, `load/store` (localStorage JSON wrapped in try/catch), `getAudio/tone/beep` (one shared AudioContext, unlocked on first tap), `wakeOn/wakeOff(reason)`, `vibrate`, `openModal/closeModal`, `openInstall`, `esc` (escape user text before inserting it into HTML).

## Conventions

- Keep the app in `index.html` and match the compact JS style (inline `onclick`, template-string rendering).
- Everything must work offline: no CDN or remote URLs. Add any new asset to `ASSETS` in `sw.js` and bump `CACHE`.
- Escape user-entered text with `esc()`.
- Test at phone width (375 px), including with the network cut off. iPhones have no web vibration, need a tap before any sound, and need the motion permission button.
