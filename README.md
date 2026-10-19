# Cursor 开场 / Cursor Splash

**简体中文** · [English](#english)

<table>
  <tr>
    <td align="center"><img src="docs/opening.png" alt="黑幕 · 序幕" width="48%"><br><sub>黑幕 · 序幕 / Opening</sub></td>
    <td align="center"><img src="docs/hold-on.jpg" alt="先停一下" width="48%"><br><sub>先停一下 / Hold on</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/identity.jpg" alt="核对身份" width="48%"><br><sub>核对身份 / Identity</sub></td>
    <td align="center"><img src="docs/lights-up.jpg" alt="窗口亮起" width="48%"><br><sub>窗口亮起 / Lights up</sub></td>
  </tr>
</table>

## 中文

给 Cursor 加一段开机画面：黑幕拉开，档案板显现，机械感英文逐字打出，最后以 WELCOME 收束。画面只在第一次打开时播放一次，切换智能体窗口不会重播。

安装会改写 Cursor 安装目录下的 `workbench.html`，并同步更新 `product.json` 中的校验值。Cursor 更新后这些改动会被覆盖，需要重新安装。

### 安装

需要本机已安装 Node.js。

```bash
node apply.js
```

脚本按以下顺序查找 Cursor：

1. 环境变量 `CURSOR_APP`，指向安装目录下的 `resources\app`
2. `D:\cursor`
3. `%LOCALAPPDATA%\Programs\cursor`

三处都不存在时，请先设置 `CURSOR_APP` 再重试。

安装完成后，请完全退出 Cursor（包括托盘图标），再重新打开。

### 个性化

打开 `splash.js`，只修改文件最上方的 `film` 对象：

| 字段 | 含义 |
| --- | --- |
| `name` | 中文称呼 |
| `nameEn` | 身份行上的英文名 |
| `mark` | 品牌区编号 |
| `product` / `desk` | 左上角两行字 |
| `skip` / `welcome` / `closing` | 跳过按钮、欢迎语、收尾语 |
| `ready` / `readyEn` | 结束时的中英文状态 |
| `fieldName` / `fieldApp` | 身份卡片的两个字段标签 |
| `local` / `online` | 左上角状态文字 |

改完后重新运行 `node apply.js`，再完全退出 Cursor 并打开。

### 重播一次

在开发者工具控制台执行：

```js
localStorage.removeItem('cursor-splash-played')
```

然后完全退出 Cursor，再重新打开。

### 卸载

```bash
node remove.js
```

脚本会还原安装前的界面文件与校验值。若中途写入失败，会自动回滚，不会留下改了一半的状态。同样需要完全退出 Cursor 再打开。

### 跳过

点右上角 Skip，或按 Esc。需要确认的两个步骤，也可以按 Enter 或空格。

## English

[简体中文](#中文) · **English**

A boot screen for Cursor: a black curtain lifts, an archive plate fades in, mechanical English type appears letter by letter, and the sequence settles on WELCOME. It plays once on first launch and does not replay when you switch agent windows.

Installation rewrites `workbench.html` in the Cursor application directory and updates the corresponding checksum in `product.json`. A Cursor update overwrites these changes, so reinstall afterwards.

### Install

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

### Make it yours

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

### Replay once

Run this in the developer tools console:

```js
localStorage.removeItem('cursor-splash-played')
```

Then fully quit Cursor and reopen it.

### Uninstall

```bash
node remove.js
```

The script restores the original workbench file and checksum. If a write fails midway, it rolls back automatically instead of leaving a half-patched state. Fully quit and reopen Cursor afterwards.

### Skip

Click Skip in the top-right corner, or press Esc. On the two confirmation steps you can also press Enter or Space.
