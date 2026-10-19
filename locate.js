const fs = require('node:fs');
const path = require('node:path');

function candidates() {
	const found = [];
	if (process.env.CURSOR_APP) found.push(process.env.CURSOR_APP);
	found.push('D:\\cursor\\resources\\app');
	if (process.env.LOCALAPPDATA) {
		found.push(path.join(process.env.LOCALAPPDATA, 'Programs', 'cursor', 'resources', 'app'));
	}
	return found;
}

function findAppDir() {
	const seen = new Set();
	const tried = [];
	for (const dir of candidates()) {
		const abs = path.resolve(dir);
		if (seen.has(abs)) continue;
		seen.add(abs);
		tried.push(abs);
		const htmlPath = path.join(abs, 'out', 'vs', 'code', 'electron-sandbox', 'workbench', 'workbench.html');
		const productPath = path.join(abs, 'product.json');
		if (fs.existsSync(htmlPath) && fs.existsSync(productPath)) return abs;
	}
	throw new Error('找不到 Cursor。试过：\n' + tried.join('\n') + '\n可以设置环境变量 CURSOR_APP 指向 resources\\app');
}

module.exports = { findAppDir };
