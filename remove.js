const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { findAppDir } = require('./locate');

const root = __dirname;
let appDir;
try {
	appDir = findAppDir();
} catch (error) {
	console.error(error.message || error);
	process.exit(1);
}
const htmlPath = path.join(appDir, 'out', 'vs', 'code', 'electron-sandbox', 'workbench', 'workbench.html');
const productPath = path.join(appDir, 'product.json');
const deployDir = path.dirname(htmlPath);
const backupHtml = path.join(root, 'backup', 'workbench.html');
const backupSum = path.join(root, 'backup', 'checksum.txt');

function main() {
	const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
	if (!html.includes('cursor-splash:start')) {
		console.log('当前界面文件里没有开场，没有改 Cursor。');
		return;
	}
	if (!fs.existsSync(backupHtml) || !fs.existsSync(backupSum)) {
		throw new Error('备份不在 ' + path.dirname(backupHtml) + '，不敢覆盖现在的界面文件');
	}
	const sum = fs.readFileSync(backupSum, 'utf8').trim();
	const backupHash = crypto.createHash('sha256').update(fs.readFileSync(backupHtml)).digest('base64').replace(/=+$/, '');
	if (backupHash !== sum) {
		throw new Error('备份文件和当初记下的校验值对不上，没有改 Cursor');
	}
	const product = fs.readFileSync(productPath, 'utf8');
	const replaced = product.replace(
		/("vs\/code\/electron-sandbox\/workbench\/workbench\.html":\s*")[^"]+(")/,
		`$1${sum}$2`,
	);
	if (replaced === product) throw new Error('校验值没有写回去');
	const previous = fs.readFileSync(htmlPath);
	fs.copyFileSync(backupHtml, htmlPath);
	try {
		fs.writeFileSync(productPath, replaced);
	} catch (error) {
		fs.writeFileSync(htmlPath, previous);
		throw error;
	}
	for (const name of ['cursor-splash.css', 'cursor-splash.js']) {
		const file = path.join(deployDir, name);
		if (fs.existsSync(file)) fs.unlinkSync(file);
	}
	console.log('开场已拆掉。完全退出 Cursor 再打开即可。');
}

try {
	main();
} catch (error) {
	console.error(error.message || error);
	process.exit(1);
}
