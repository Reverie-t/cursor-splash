(() => {
	const film = {
		seenKey: 'cursor-splash-played',
		name: 'Operator',
		nameEn: 'OPERATOR',
		mark: '01',
		product: 'CURSOR',
		desk: 'WORKBENCH',
		skip: 'Skip',
		welcome: 'WELCOME',
		closing: 'Please enter',
		ready: '工作台准备好了',
		readyEn: 'WORKBENCH READY',
		fieldName: '称呼',
		fieldApp: '编辑器',
		local: 'LOCAL',
		online: 'ONLINE',
	};
	const seenKey = film.seenKey;
	const steps = [
		{ zh: '先停一下', en: 'HOLD ON', sub: '确认你还在', subEn: 'CONFIRM PRESENCE', button: '我在', buttonEn: 'HERE' },
		{ zh: '是您吗', en: 'IS IT YOU', sub: '核对身份', subEn: 'CHECK IDENTITY', button: '是我', buttonEn: 'YES', card: true },
		{ zh: '好，我记下了', en: 'NOTED', sub: '身份已写入', subEn: 'IDENTITY STORED', id: true },
		{ zh: '窗口正在亮起', en: 'LIGHTS UP', sub: '正在打开工作台', subEn: 'OPENING WORKBENCH', reticle: true, hex: true },
		{ zh: '欢迎来到CURSOR', en: 'COME IN', sub: '门开了', subEn: 'DOOR IS OPEN', logo: true },
	];
	const total = steps.length + 1;

	let root = null;
	let done = false;
	let runId = 0;
	let waiting = null;
	let audio = null;
	const timers = new Set();
	let clockTimer = 0;
	let hexTimer = 0;

	function el(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text != null) node.textContent = text;
		return node;
	}

	function svgEl(tag, attrs) {
		const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
		for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
		return node;
	}

	function cursorIcon() {
		const svg = svgEl('svg', {
			class: 'dsu-mark',
			viewBox: '0 0 64 64',
			'aria-hidden': 'true',
		});
		svg.appendChild(svgEl('path', {
			fill: 'currentColor',
			'fill-rule': 'evenodd',
			d: 'M32 3 L59 18.5 L59 45.5 L32 61 L5 45.5 L5 18.5 Z M13 23 H51 L32 57 Z',
		}));
		return svg;
	}

	function reticleSvg() {
		const svg = svgEl('svg', { viewBox: '0 0 1000 1000', 'aria-hidden': 'true' });
		const ringA = svgEl('g', { class: 'dsu-ret-rot-a' });
		ringA.append(
			svgEl('circle', { class: 'dsu-ring-a', cx: '500', cy: '500', r: '460', 'stroke-dasharray': '2300 590', 'stroke-dashoffset': '722' }),
			svgEl('circle', { class: 'dsu-dot-a', cx: '500', cy: '40', r: '14' }),
		);
		const ringB = svgEl('g', { class: 'dsu-ret-rot-b' });
		ringB.append(
			svgEl('circle', { class: 'dsu-ring-b', cx: '500', cy: '500', r: '380', 'stroke-dasharray': '1680 710', 'stroke-dashoffset': '180' }),
			svgEl('circle', { class: 'dsu-dot-b', cx: '880', cy: '500', r: '11' }),
		);
		svg.append(
			ringA,
			ringB,
			svgEl('circle', { class: 'dsu-dot-o', cx: '500', cy: '500', r: '12' }),
			svgEl('path', { class: 'dsu-bracket', d: 'M400 400 H350 V350 H400 M600 400 H650 V350 H600 M400 600 H350 V650 H400 M600 600 H650 V650 H600' }),
		);
		return svg;
	}

	function later(ms) {
		const delay = reduced ? Math.min(ms, 140) : ms;
		return new Promise((resolve) => {
			const id = window.setTimeout(() => {
				timers.delete(id);
				resolve();
			}, delay);
			timers.add(id);
		});
	}

	function tearDown() {
		timers.forEach((id) => window.clearTimeout(id));
		timers.clear();
		window.clearInterval(clockTimer);
		window.clearInterval(hexTimer);
		window.removeEventListener('keydown', onKey, true);
		if (window.speechSynthesis) {
			speechSynthesis.getVoices();
			speechSynthesis.cancel();
		}
		if (root) {
			root.remove();
			root = null;
		}
	}

	function fail(error) {
		console.error('[cursor-splash]', error);
		done = true;
		tearDown();
		try {
			const note = document.createElement('div');
			note.id = 'cursor-splash-error';
			note.setAttribute('role', 'alert');
			const text = document.createElement('span');
			text.textContent = '开场没有播成。' + (error && error.message ? error.message : error);
			const close = document.createElement('button');
			close.type = 'button';
			close.textContent = '关闭';
			close.addEventListener('click', () => note.remove());
			note.append(text, close);
			document.documentElement.appendChild(note);
		} catch {
			/* 提示也挂不上时，只能看控制台 */
		}
	}

	function remember() {
		try {
			localStorage.setItem(seenKey, '1');
		} catch {
			/* 记不住就下次再播一次 */
		}
	}

	function finish() {
		if (done || !root) return;
		done = true;
		runId += 1;
		if (waiting) {
			const resume = waiting;
			waiting = null;
			resume();
		}
		window.removeEventListener('keydown', onKey, true);
		remember();
		root.classList.add('dsu-handoff');
		const id = window.setTimeout(tearDown, reduced ? 0 : 780);
		timers.add(id);
	}

	function context() {
		audio = audio || new AudioContext();
		if (audio.state === 'suspended') audio.resume();
		return audio;
	}

	function tick() {
		try {
			const live = context();
			const oscillator = live.createOscillator();
			const gain = live.createGain();
			oscillator.frequency.value = 620;
			gain.gain.value = 0.03;
			oscillator.connect(gain);
			gain.connect(live.destination);
			oscillator.start();
			oscillator.stop(live.currentTime + 0.04);
		} catch {
			audio = null;
		}
	}

	function mechanical(kind) {
		if (reduced) return;
		try {
			const live = context();
			const now = live.currentTime;
			const lock = kind === 'lock';
			const dur = lock ? 0.26 : 0.11;
			const buffer = live.createBuffer(1, Math.floor(live.sampleRate * dur), live.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < data.length; i += 1) {
				data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
			}
			const noise = live.createBufferSource();
			noise.buffer = buffer;
			const filter = live.createBiquadFilter();
			filter.type = 'bandpass';
			filter.frequency.value = lock ? 220 : 1100;
			const noiseGain = live.createGain();
			noiseGain.gain.setValueAtTime(lock ? 0.2 : 0.07, now);
			noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
			noise.connect(filter);
			filter.connect(noiseGain);
			noiseGain.connect(live.destination);
			noise.start(now);
			noise.stop(now + dur);

			const tone = live.createOscillator();
			const toneGain = live.createGain();
			tone.type = 'sawtooth';
			tone.frequency.setValueAtTime(lock ? 96 : 170, now);
			tone.frequency.exponentialRampToValueAtTime(42, now + dur);
			toneGain.gain.setValueAtTime(lock ? 0.16 : 0.045, now);
			toneGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
			tone.connect(toneGain);
			toneGain.connect(live.destination);
			tone.start(now);
			tone.stop(now + dur);
		} catch {
			audio = null;
		}
	}

	function machineVoice() {
		if (!window.speechSynthesis) return null;
		const voices = speechSynthesis.getVoices();
		return voices.find((voice) => /^en/i.test(voice.lang) && /david|guy|mark|zira|jenny/i.test(voice.name))
			|| voices.find((voice) => /^en/i.test(voice.lang))
			|| null;
	}

	function speakMachine(text) {
		if (reduced || !window.speechSynthesis) return;
		try {
			const line = new SpeechSynthesisUtterance(text);
			line.lang = 'en-US';
			line.rate = 0.82;
			line.pitch = 0.55;
			line.volume = 0.95;
			const voice = machineVoice();
			if (voice) line.voice = voice;
			speechSynthesis.cancel();
			speechSynthesis.speak(line);
		} catch {
			/* 这台机器没有英文语音就算了 */
		}
	}

	function onKey(event) {
		if (done) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			finish();
			return;
		}
		if (waiting && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			event.stopPropagation();
			advance();
		}
	}

	function advance() {
		if (!waiting || done) return;
		tick();
		const resume = waiting;
		waiting = null;
		resume();
	}

	function waitForUser() {
		return new Promise((resolve) => {
			waiting = resolve;
		});
	}

	function typeInto(node, text) {
		node.classList.remove('dsu-in');
		node.replaceChildren();
		Array.from(text).forEach((char, index) => {
			const span = el('span', 'dsu-ch', char === ' ' ? '\u00a0' : char);
			span.style.transitionDelay = (reduced ? 0 : index * 34) + 'ms';
			node.appendChild(span);
		});
		void node.offsetWidth;
		node.classList.add('dsu-in');
		return text.length * (reduced ? 0 : 34) + (reduced ? 80 : 380);
	}

	function hexBlock() {
		const lines = [];
		for (let row = 0; row < 8; row += 1) {
			const cells = [];
			for (let col = 0; col < 6; col += 1) {
				cells.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());
			}
			lines.push(cells.join(' '));
		}
		return lines.join('\n');
	}

	function replay(node, className) {
		node.classList.remove(className);
		void node.offsetWidth;
		node.classList.add(className);
	}

	let reduced = false;

	try {
		if (localStorage.getItem(seenKey) === '1') return;
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		root = el('div');
		root.id = 'cursor-splash-root';
		root.className = 'dsu-boot';
		root.setAttribute('role', 'dialog');
		root.setAttribute('aria-label', '开场');

		const plate = el('div', 'dsu-plate');
		const watermark = el('div', 'dsu-watermark');
		[[18, 16, 132, 78], [28, 34, 96, 108], [46, 58, 150, 64], [24, 72, 110, 80]].forEach(([right, top, width, height]) => {
			const box = el('div', 'dsu-wm');
			box.style.right = right + 'px';
			box.style.top = top + '%';
			box.style.width = width + 'px';
			box.style.height = height + 'px';
			watermark.appendChild(box);
		});
		const grain = el('div', 'dsu-grain');
		const vignette = el('div', 'dsu-vignette');

		const black = el('div', 'dsu-black');
		const sweep = el('div', 'dsu-sweep');
		const blackInner = el('div', 'dsu-black-inner');
		blackInner.append(
			cursorIcon(),
			el('div', 'dsu-black-zh', film.product),
			el('div', 'dsu-black-en', film.product),
			el('div', 'dsu-black-sub', film.desk),
		);
		black.append(sweep, blackInner);

		const wash = el('div', 'dsu-wash');
		const flash = el('div', 'dsu-flash');

		const brand = el('div', 'dsu-brand');
		const brand3 = el('div', 'dsu-brand-3');
		brand3.append(el('b', '', film.mark), document.createTextNode(film.nameEn));
		brand.append(el('div', 'dsu-brand-1', film.product), el('div', 'dsu-brand-2', film.desk), brand3);

		const meta = el('div', 'dsu-meta');
		const clock = el('span', 'dsu-meta-2', '00:00:00');
		meta.append(el('span', '', film.local), clock);

		const slats = el('div', 'dsu-slats');
		const slatNodes = Array.from({ length: total }, () => {
			const slat = el('i', 'dsu-slat');
			slats.appendChild(slat);
			return slat;
		});

		const frame = el('div', 'dsu-frame');
		['tl', 'tr', 'bl', 'br'].forEach((corner) => frame.appendChild(el('i', 'dsu-corner dsu-c-' + corner)));
		const scanline = el('div', 'dsu-scanline');
		frame.appendChild(scanline);

		const voice = el('div', 'dsu-voice');
		for (let i = 0; i < 5; i += 1) voice.appendChild(el('i'));

		const center = el('div', 'dsu-center');
		const status = el('div', 'dsu-status dsu-zhline');
		const statusText = el('span');
		const caret = el('i', 'dsu-caret');
		status.append(statusText, caret);
		const subEn = el('div', 'dsu-sub-en');
		const rule = el('div', 'dsu-rule');
		const logo = el('div', 'dsu-logo');
		logo.append(cursorIcon(), el('div', 'dsu-logolabel', film.product));
		center.append(status, subEn, rule, logo);

		const reticle = el('div', 'dsu-reticle');
		reticle.appendChild(reticleSvg());

		const hex = el('div', 'dsu-hex');
		const idline = el('div', 'dsu-idline', '· ID CONFIRMED : ' + film.nameEn);

		const action = el('div', 'dsu-action');
		const card = el('div', 'dsu-card');
		card.hidden = true;
		const rowName = el('div', 'dsu-card-row');
		rowName.append(el('span', '', film.fieldName), el('b', 'dsu-zhname', film.name));
		const rowApp = el('div', 'dsu-card-row');
		rowApp.append(el('span', '', film.fieldApp), el('b', '', film.product));
		card.append(rowName, rowApp);
		const button = el('button', 'dsu-btn dsu-pulse');
		button.type = 'button';
		const buttonZh = el('span', 'dsu-btn-zh');
		const buttonEn = el('span', 'dsu-btn-en');
		button.append(buttonZh, buttonEn);
		const hint = el('div', 'dsu-hint');
		hint.append(document.createTextNode('按'), el('kbd', '', 'Enter'), document.createTextNode('或'), el('kbd', '', '空格'));
		action.append(card, button, hint);

		const welcome = el('div', 'dsu-welcome');
		const w1 = el('div', 'dsu-w1 dsu-glitch', film.welcome);
		w1.dataset.text = film.welcome;
		const w2 = el('div', 'dsu-w2 dsu-glitch dsu-glitch-box', film.product);
		w2.dataset.text = film.product;
		const w3 = el('div', 'dsu-w3');
		w3.append(cursorIcon(), el('span', '', film.product));
		const w4 = el('div', 'dsu-w4', film.closing);
		welcome.append(w1, w2, w3, w4);

		const bloom = el('div', 'dsu-bloom');
		const streak = el('div', 'dsu-streak');
		const foot = el('div', 'dsu-foot');
		foot.append(el('span', '', film.online), el('i'));
		const subtitle = el('div', 'dsu-subtitle');
		const subZh = el('div', 'dsu-sub-zh');
		const subEn2 = el('div', 'dsu-sub-en2');
		subtitle.append(subZh, subEn2);
		const progress = el('div', 'dsu-progress');
		const progressBar = el('i');
		progress.appendChild(progressBar);
		const stepcount = el('div', 'dsu-stepcount');
		const skip = el('button', 'dsu-skip', film.skip);
		skip.type = 'button';

		root.append(
			plate, watermark, grain, vignette, black, wash, flash,
			brand, meta, slats, frame, voice, center, reticle, hex, idline,
			action, welcome, bloom, streak, foot, subtitle, progress, stepcount, skip,
		);
		document.documentElement.appendChild(root);

		button.addEventListener('click', advance);
		skip.addEventListener('click', finish);
		window.addEventListener('keydown', onKey, true);

		function setSlats(index) {
			slatNodes.forEach((slat, slatIndex) => {
				slat.className = 'dsu-slat' + (slatIndex < index ? ' dsu-past' : slatIndex === index ? ' dsu-on' : '');
			});
		}

		function setProgress(index) {
			progressBar.style.width = Math.round(((index + 1) / total) * 100) + '%';
			progress.classList.toggle('dsu-accent', index >= steps.length);
		}

		function showCaption(step, index) {
			subZh.classList.remove('dsu-in');
			subEn2.classList.remove('dsu-in');
			subZh.textContent = step.sub;
			subEn2.textContent = step.subEn;
			stepcount.textContent = String(index + 1).padStart(2, '0') + '  /  0' + total;
			void subZh.offsetWidth;
			subZh.classList.add('dsu-in');
			subEn2.classList.add('dsu-in');
		}

		async function showStep(index) {
			const step = steps[index];
			const mine = runId;
			status.classList.remove('dsu-in');
			subEn.classList.remove('dsu-in');
			caret.classList.remove('dsu-on');
			rule.classList.remove('dsu-in');
			action.classList.remove('dsu-in');
			logo.classList.toggle('dsu-in', Boolean(step.logo));
			reticle.classList.toggle('dsu-in', Boolean(step.reticle));
			hex.classList.toggle('dsu-in', Boolean(step.hex));
			if (step.hex || index < 3) replay(scanline, 'dsu-go');
			if (step.id) {
				idline.classList.add('dsu-in', 'dsu-lock');
				progress.classList.add('dsu-accent');
			}
			card.hidden = !step.card;
			card.classList.toggle('dsu-stamp', Boolean(step.card));
			rowName.querySelector('b').classList.toggle('dsu-hot', Boolean(step.card));
			action.classList.toggle('dsu-raise', Boolean(step.card));
			status.classList.remove('dsu-glitch', 'dsu-on');
			setSlats(index);
			setProgress(index);
			showCaption(step, index);
			await later(40);
			if (done || mine !== runId) return;
			const waitZh = typeInto(statusText, step.zh);
			status.classList.add('dsu-in');
			caret.classList.add('dsu-on');
			voice.classList.add('dsu-on');
			rule.classList.add('dsu-in');
			await later(160);
			if (done || mine !== runId) return;
			const waitEn = typeInto(subEn, step.en);
			await later(Math.max(waitZh, waitEn));
			if (done || mine !== runId) return;
			voice.classList.remove('dsu-on');
			if (index < 3) {
				mechanical(index === 2 ? 'lock' : 'tick');
				speakMachine(step.en);
				if (index === 2) {
					status.dataset.text = step.zh;
					status.classList.add('dsu-glitch');
					replay(status, 'dsu-on');
				}
			}
			if (step.button) {
				buttonZh.textContent = step.button;
				buttonEn.textContent = step.buttonEn;
				action.classList.add('dsu-in');
				button.focus();
				await waitForUser();
			} else {
				await later(1100);
			}
		}

		async function play() {
			const mine = runId;
			const alive = () => !done && mine === runId;
			skip.classList.add('dsu-in');

			if (!reduced) {
				await later(280);
				if (!alive()) return;
				blackInner.classList.add('dsu-in');
				await later(640);
				if (!alive()) return;
				sweep.classList.add('dsu-go');
				await later(420);
				if (!alive()) return;
				blackInner.querySelector('.dsu-black-en').classList.add('dsu-tighten');
				await later(1500);
				if (!alive()) return;
				blackInner.classList.add('dsu-out');
				wash.classList.add('dsu-go');
				await later(420);
				if (!alive()) return;
				flash.classList.add('dsu-go');
				black.classList.add('dsu-off');
				await later(280);
				if (!alive()) return;
			} else {
				black.classList.add('dsu-off');
			}

			plate.classList.add('dsu-in');
			watermark.classList.add('dsu-in');
			vignette.classList.add('dsu-in');
			brand.classList.add('dsu-in');
			meta.classList.add('dsu-in');
			slats.classList.add('dsu-in');
			frame.classList.add('dsu-in');
			voice.classList.add('dsu-in');
			foot.classList.add('dsu-in');
			stepcount.classList.add('dsu-in');
			replay(scanline, 'dsu-go');

			for (let index = 0; index < steps.length; index += 1) {
				if (!alive()) return;
				await showStep(index);
			}
			if (!alive()) return;

			center.classList.add('dsu-off');
			action.classList.remove('dsu-in');
			reticle.classList.remove('dsu-in');
			hex.classList.remove('dsu-in');
			voice.classList.remove('dsu-on');
			setSlats(steps.length);
			setProgress(steps.length);
			subZh.classList.remove('dsu-in');
			subEn2.classList.remove('dsu-in');
			subZh.textContent = film.ready;
			subEn2.textContent = film.readyEn;
			stepcount.textContent = String(total).padStart(2, '0') + '  /  0' + total;
			void subZh.offsetWidth;
			subZh.classList.add('dsu-in');
			subEn2.classList.add('dsu-in');
			welcome.classList.add('dsu-in');
			w1.classList.add('dsu-on');
			w2.classList.add('dsu-on');
			await later(420);
			if (!alive()) return;
			root.classList.add('dsu-peak');
			bloom.classList.add('dsu-go');
			streak.classList.add('dsu-go');
			await later(980);
			if (!alive()) return;
			finish();
		}

		function stamp() {
			const now = new Date();
			clock.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
				.map((part) => String(part).padStart(2, '0'))
				.join(':');
		}
		stamp();
		clockTimer = window.setInterval(stamp, 1000);
		hex.textContent = hexBlock();
		hexTimer = window.setInterval(() => {
			if (hex.classList.contains('dsu-in')) hex.textContent = hexBlock();
		}, 90);

		window.requestAnimationFrame(() => {
			if (done || !root) return;
			root.classList.remove('dsu-boot');
			play().catch(fail);
		});
	} catch (error) {
		fail(error);
	}
})();
