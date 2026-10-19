# Cursor 开场

给 Cursor 加一段开机画面。黑幕、档案板、机械英文，只在这台电脑第一次打开时播一次。切换智能体窗口不会再播。

它会改 Cursor 安装目录里的 `workbench.html` 和 `product.json` 校验值。Cursor 更新之后改动会被盖掉，需要再装一次。

## 装上

需要本机已安装 Node.js。

```bash
node apply.js
```

脚本会自己找 Cursor：先看 `D:\cursor`，再看 `%LOCALAPPDATA%\Programs\cursor`。两边都没有时，把环境变量 `CURSOR_APP` 指到安装目录里的 `resources\app`。

装完要完全退出 Cursor，再打开。

## 改成你的

打开 `splash.js`，只改最上面的 `film`：

- `name`：中文称呼
- `nameEn`：身份行上的英文名
- `product`、`desk`：左上角两行字

改完再运行一次 `node apply.js`，然后完全退出 Cursor 再打开。

想再看一遍，在开发者工具控制台执行：

```js
localStorage.removeItem('cursor-splash-played')
```

然后完全退出，再打开。

## 拆掉

```bash
node remove.js
```

同样要完全退出 Cursor 再打开。卸载时如果校验值没写回去，会把界面文件退回改之前的那份。

## 跳过

右上角 Skip，或按 Esc。需要确认的两步也可以按 Enter 或空格。
