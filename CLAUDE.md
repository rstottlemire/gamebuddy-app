# GameBuddy

A board game / TTRPG companion, built as an installable PWA. Hosted on GitHub (Pages). No build step and no dependencies: the whole app lives in `index.html` (inline CSS and JS).

## Files

- `index.html`: the entire app (styles, markup, script)
- `sw.js`: service worker. **Bump `CACHE` (e.g. `gamebuddy-v4` → `v5`) whenever cached files change.** The page itself is network-first, everything else cache-first.
- `manifest.json`, `icons/`: PWA metadata and icons
- `generate-assets.html`: helper page for making the icon PNGs
- `index.v1-backup.html`, `sw.v1-backup.js`: snapshot from before the three-mode restructure

## Structure

The app opens on a **landing page** with three modes. The chosen mode is saved (`gb-mode`) and reopened on the next launch. The header has a 🏠 Home button (back to the landing page) and a 📝 Notes button that opens the notes sheet in any mode.

| Mode | Tabs (bottom nav, built per mode from `MODES`) |
|---|---|
| **Board Game** | Active Players (default), Turn Order, Score Calculator, Spinner, Player Timer |
| **TTRPG** | Dice Roller, Combat Tracker |
| **General** | Cards, Coin Flip, Countdown Timer |

Each tab is a `<div id="panel-<id>" class="panel">`. `showPanel(id)` switches tabs and runs the tab's render hook.

### Board Game

- **Active Players**: 12 SVG meeples (`MEEPLES`, `meepleSvg()`), each with a black outline plus a light glow so the black one stays visible on the dark background. Tap toggles active; press and hold (550 ms) opens a name dialog. The lineup is saved as `gb-lineup` (`{active:[colorIds], names:{colorId:name}}`).
- **Per-tab rosters**: Turn Order, Score Calculator and Player Timer read players through `roster(tab)`. A roster follows the lineup until the tab adds or removes a player, which makes it a local copy (`gb-rosters[tab].custom`). "↺ Use lineup" goes back to following the lineup.
- **Turn Order**: shuffle into a full order, or pick one random player.
- **Score Calculator**: a grid with a sticky category column and one column per player. Saved in progress as `gb-score` (`{cats:[{id,name}], vals:{catId:{playerId:string}}, low}`). Enter/Next walks across a row, then down. The ± button handles iPhone keypads without a minus key. The leader is highlighted live; once every cell is filled, the top 3 get 🥇🥈🥉 (lowest 3 when "Lowest score wins" is on). Templates (category lists by game name) are saved as `gb-score-templates`.
- **Spinner**: the original wheel, plus "Fill with Active Players".
- **Player Timer**: a chess clock on one phone, with modes Count Up, Time Bank and Per Turn (optional bank unused time). Alerts at 10 s and 0 s (flash, sound, and vibration where supported). Out-of-time players can be skipped. It pauses face-down via `deviceorientation` (|beta| > 150°), and iOS needs `DeviceOrientationEvent.requestPermission()` from a tap. Uses Wake Lock while running. Settings are saved as `gb-ptimer`.

### TTRPG

- **Dice Roller**: the queue, then a roll. Exploding is automatic: each die keeps rolling while it hits max, shown as a chain like `6+6+3`. The **Wild Card** option (Savage Worlds) adds an exploding Wild d6 and forces exploding on (the checkbox shows checked and locked). It also turns off and locks Advantage/Disadvantage. All dice are always shown, the kept dice are highlighted, and no total is shown. The Wild Die replaces the lowest trait die if it rolled higher. Critical Failure: the Wild Die rolls a natural 1 and at least half the trait dice roll natural 1s. The 4dF button adds four Fate dice. Presets (`gamebuddy-dice-presets`) remember the Wild Card setting.
- **Combat Tracker**: initiative order, rounds, conditions, and GM Mode (HP) or damage-dealt mode.

### General

- **Cards**: a 52-card deck with optional jokers, a flip animation and a discard pile.
- **Coin Flip**: a 3D gold coin built in CSS 3D: SVG faces with an embossed meeple (heads) and a d20 showing 1 (tails), plus a reeded edge made of `coin-edge-strip` elements. It tosses with the Web Animations API, and flip history is kept for the session.
- **Countdown Timer**: presets and custom times, an arc display, a beep, and Wake Lock while running.

### Shared helpers

`load/store` (localStorage JSON wrapped in try/catch), `getAudio/tone/beep` (one shared AudioContext, unlocked on first tap for iOS), `wakeOn/wakeOff(reason)`, `vibrate`, `openModal/closeModal`, `esc` (escape HTML before inserting user text).

## Conventions

- Keep everything in `index.html`. Match the compact style of the existing JS (inline `onclick` handlers, template-string rendering).
- Escape any user-entered text with `esc()` before putting it in HTML.
- Test at phone width (375 px). iPhones have no web vibration, need a tap before any sound, and need the motion permission button.

## Planned

A second pass for theming (meeple/dice look, with reference images coming from the user) plus tidy-ups.
