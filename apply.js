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
const backupDir = path.join(root, 'backup');
const backupHtml = path.join(backupDir, 'workbench.html');
const backupSum = path.join(backupDir, 'checksum.txt');
const checksumKey = 'vs/code/electron-sandbox/workbench/workbench.html';

function hashFile(file) {
	const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('base64');
	return digest.replace(/=+$/, '');
}

function readChecksum(productText) {
	const matched = productText.match(/"vs\/code\/electron-sandbox\/workbench\/workbench\.html":\s*"([^"]+)"/);
	if (!matched) throw new Error('product.json 里找不到 workbench.html 的校验值');
	return matched[1];
}

function writeChecksum(productText, next) {
	const replaced = productText.replace(
		/("vs\/code\/electron-sandbox\/workbench\/workbench\.html":\s*")[^"]+(")/,
		`$1${next}$2`,
	);
	if (replaced === productText) throw new Error('校验值未写入');
	return replaced;
}

function injection(eol) {
	return [
		`${eol}\t<!-- cursor-splash:start -->`,
		'\t<link rel="stylesheet" href="./cursor-splash.css" />',
		'\t<script src="./cursor-splash.js"></script>',
		'\t<!-- cursor-splash:end -->',
	].join(eol);
}

function strip(html) {
	return html.replace(/\r?\n\t<!-- cursor-splash:start -->[\s\S]*?\t<!-- cursor-splash:end -->/, '');
}

function insert(html) {
	const eol = html.includes('\r\n') ? '\r\n' : '\n';
	const anchor = `${eol}\t<script src="./workbench.js" type="module"></script>`;
	if (!html.includes(anchor)) throw new Error('workbench.html 里找不到 workbench.js，Cursor 可能改了页面结构');
	const block = injection(eol);
	if (html.includes('cursor-splash:start')) {
		const stripped = strip(html);
		if (!stripped.includes(anchor)) throw new Error('去掉旧开场之后，找不到插入位置');
		return stripped.replace(anchor, `${block}${anchor}`);
	}
	return html.replace(anchor, `${block}${anchor}`);
}

function main() {
	if (!fs.existsSync(htmlPath)) throw new Error('找不到 ' + htmlPath);
	const productText = fs.readFileSync(productPath, 'utf8');
	const listed = readChecksum(productText);
	const actual = hashFile(htmlPath);
	const html = fs.readFileSync(htmlPath, 'utf8');
	const patched = html.includes('cursor-splash:start');

	if (!patched) {
		if (listed !== actual) {
			throw new Error('这个 workbench.html 的校验值和文件对不上，还原');
		}
		fs.mkdirSync(backupDir, { recursive: true });
		fs.copyFileSync(htmlPath, backupHtml);
		fs.writeFileSync(backupSum, listed + '\n');
	} else if (!fs.existsSync(backupHtml) || !fs.existsSync(backupSum)) {
		throw new Error('已经装过，但备份不在 ' + backupDir + '，未继续更改');
	}

	const nextHtml = insert(html);
	fs.copyFileSync(path.join(root, 'splash.css'), path.join(deployDir, 'cursor-splash.css'));
	fs.copyFileSync(path.join(root, 'splash.js'), path.join(deployDir, 'cursor-splash.js'));

	const previous = fs.readFileSync(htmlPath);
	try {
		fs.writeFileSync(htmlPath, nextHtml);
		const nextSum = hashFile(htmlPath);
		if (nextSum !== listed) fs.writeFileSync(productPath, writeChecksum(productText, nextSum));
	} catch (error) {
		fs.writeFileSync(htmlPath, previous);
		throw error;
	}

	console.log('开场已写进 ' + appDir);
	console.log('完全退出 Cursor 再打开即可运行。');
	console.log('更新 Cursor 之后，再运行一次：node ' + path.join(root, 'apply.js'));
	console.log('想拆掉：node ' + path.join(root, 'remove.js'));
	console.log('校验键：' + checksumKey);
}

try {
	main();
} catch (error) {
	console.error(error.message || error);
	process.exit(1);
}
