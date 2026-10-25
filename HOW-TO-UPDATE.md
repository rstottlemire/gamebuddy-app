# How to update GameBuddy

GameBuddy is hosted for free on **GitHub Pages**.

- **The link to share with friends:** https://rstottlemire.github.io/gamebuddy-app/
- **Where the files live (the "repo"):** https://github.com/rstottlemire/gamebuddy-app

Friends open the share link on their phone, then install it from the app's **How to Install** screen (the ⓘ button on the home screen).

---

## Pushing an update (about 5 minutes)

### 1. Know which files to upload

Upload these from the `GameBuddy App` folder. They're everything the app needs:

| Upload | What it is |
|---|---|
| `index.html` | The whole app |
| `sw.js` | Makes it work offline and delivers updates |
| `manifest.json` | Name, colors and icon for the home-screen install |
| `fonts/` folder | The two fonts (so text looks right offline) |
| `img/` folder | The background photos |
| `icons/` folder | The app icon in every size |

**Don't upload:** `design-refs/` (your original reference photos), `index.v1-backup.html`, `sw.v1-backup.js`, or the `.claude` folder. They're only for working on the app. `CLAUDE.md` and this guide are fine either way.

### 2. Upload them to GitHub

1. Go to https://github.com/rstottlemire/gamebuddy-app and sign in.
2. Click **Add file** → **Upload files**.
3. Drag the files **and the three folders** (`fonts`, `img`, `icons`) from File Explorer onto the page. Dragging a folder keeps its name, which matters.
4. Scroll down, type a short note like "Visual redesign", and click **Commit changes**.

Uploading a file with the same name replaces the old one. That's what you want.

### 3. Check that it's live

1. On the repo page, click the **Actions** tab. The newest run shows a yellow dot while it publishes, then a green ✓ (usually 1–2 minutes).
2. Open the share link on a computer and press **Ctrl + Shift + R** (a hard refresh). You should see the new version.

### 4. How phones get the update

- The next time someone opens GameBuddy **with an internet connection**, the new version downloads in the background.
- If they still see the old look, they close the app completely (swipe it away) and open it again.
- Their saved stuff (lineup, names, score templates, dice presets, notes) is kept.

---

## The one rule when Claude changes the app

Every time the app changes, the version line at the top of `sw.js` must go up by one:

```
const CACHE = 'gamebuddy-v7';   →   const CACHE = 'gamebuddy-v8';
```

That's what tells phones "there's a new version, download it." Claude does this automatically, but if an update ever doesn't show up on phones, check this line first.

---

## If something goes wrong

- **The Actions run shows a red ✗:** wait a minute and re-run it (click the run → **Re-run all jobs**). GitHub hiccups occasionally.
- **The site shows a 404:** make sure `index.html` is at the top level of the repo, not inside a folder.
- **A phone is stuck on an old version:** close the app fully and reopen it while online. Last resort: delete the home-screen icon and install again from the share link. This erases that phone's saved lineup and notes.
