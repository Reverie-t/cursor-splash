# Cursor Splash

[中文](README.md) · **English**

<table>
  <tr>
    <td align="center"><img src="docs/opening.png" alt="Opening" width="48%"><br><sub>Opening</sub></td>
    <td align="center"><img src="docs/hold-on.jpg" alt="Hold on" width="48%"><br><sub>Hold on</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/identity.jpg" alt="Identity" width="48%"><br><sub>Identity</sub></td>
    <td align="center"><img src="docs/lights-up.jpg" alt="Lights up" width="48%"><br><sub>Lights up</sub></td>
  </tr>
</table>

A boot screen for Cursor: a black curtain lifts, an archive plate fades in, mechanical English type appears letter by letter, and the sequence settles on WELCOME. It plays once on first launch and does not replay when you switch agent windows.

Installation rewrites `workbench.html` in the Cursor application directory and updates the corresponding checksum in `product.json`. A Cursor update overwrites these changes, so reinstall afterwards.

## Install

Node.js is required.

```bash
node apply.js
```

The script looks for Cursor in this order:

1. The `CURSOR_APP` environment variable, pointing to `resources\app` in the install directory
2. `D:\cursor`
3. `%LOCALAPPDATA%\Programs\cursor`

If none of them exists, set `CURSOR_APP` and retry.

After installing, fully quit Cursor (including the tray icon) and reopen it.

## Make it yours

Open `splash.js` and edit only the `film` object at the top of the file:

| Field | Meaning |
| --- | --- |
| `name` | Display name |
| `nameEn` | Name on the identity line |
| `mark` | Brand mark number |
| `product` / `desk` | The two lines in the top-left corner |
| `skip` / `welcome` / `closing` | Skip label, welcome line, closing line |
| `ready` / `readyEn` | Final status text |
| `fieldName` / `fieldApp` | Labels on the identity card |
| `local` / `online` | Status text in the top-left corner |

When you are done, run `node apply.js` again, then fully quit and reopen Cursor.

## Replay once

Run this in the developer tools console:

```js
localStorage.removeItem('cursor-splash-played')
```

Then fully quit Cursor and reopen it.

## Uninstall

```bash
node remove.js
```

The script restores the original workbench file and checksum. If a write fails midway, it rolls back automatically instead of leaving a half-patched state. Fully quit and reopen Cursor afterwards.

## Skip

Click Skip in the top-right corner, or press Esc. On the two confirmation steps you can also press Enter or Space.
