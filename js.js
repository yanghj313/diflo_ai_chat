const chatBody = document.getElementById('chatBody');
const inp = document.getElementById('inp');
const sendBtn = document.getElementById('sendBtn');
const cursor = document.getElementById('cursor');
const btnReplay = document.getElementById('btnReplay');

let running = false;

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}
function scrollBottom() {
	chatBody.scrollTop = chatBody.scrollHeight;
}
function escapeHtml(s = '') {
	return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function addMsg(role, text, meta, opts = {}) {
	const msg = document.createElement('div');
	msg.className = `msg ${role}`;

	const bubble = document.createElement('div');
	bubble.className = 'bubble';
	if (opts.bubbleClass) bubble.classList.add(opts.bubbleClass);

	bubble.textContent = text;

	if (meta) {
		const m = document.createElement('div');
		m.className = 'meta';
		m.textContent = meta;
		bubble.appendChild(m);
	}

	msg.appendChild(bubble);
	chatBody.appendChild(msg);
	scrollBottom();
}

function addRichBot(html, meta) {
	const msg = document.createElement('div');
	msg.className = 'msg bot';

	const bubble = document.createElement('div');
	bubble.className = 'bubble rich';
	bubble.innerHTML = html;

	if (meta) {
		const m = document.createElement('div');
		m.className = 'meta';
		m.textContent = meta;
		bubble.appendChild(m);
	}

	msg.appendChild(bubble);
	chatBody.appendChild(msg);
	scrollBottom();
}

function addTyping() {
	const msg = document.createElement('div');
	msg.className = 'msg bot';
	msg.id = 'typingRow';

	const bubble = document.createElement('div');
	bubble.className = 'typing';
	bubble.innerHTML = '<i></i><i></i><i></i>&nbsp;답변 생성 중';

	msg.appendChild(bubble);
	chatBody.appendChild(msg);
	scrollBottom();
}

function removeTyping() {
	const t = document.getElementById('typingRow');
	if (t) t.remove();
}

function setCursorPos(x, y) {
	const pad = 8;
	const w = cursor.offsetWidth || 26;
	const h = cursor.offsetHeight || 26;

	const hotX = 20;
	const hotY = 10;

	let cx = x - hotX;
	let cy = y - hotY;

	const maxX = window.innerWidth - w - pad;
	const maxY = window.innerHeight - h - pad;

	cx = Math.max(pad, Math.min(cx, maxX));
	cy = Math.max(pad, Math.min(cy, maxY));

	cursor.style.setProperty('--x', `${cx}px`);
	cursor.style.setProperty('--y', `${cy}px`);
	cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
}

function rectCenter(el) {
	const r = el.getBoundingClientRect();

	let ax = 0.5,
		ay = 0.5;

	if (el === inp) {
		ax = 0.18;
		ay = 0.55;
	}
	if (el === sendBtn) {
		ax = 0.5;
		ay = 0.5;
	}

	return { x: r.left + r.width * ax, y: r.top + r.height * ay };
}

async function moveCursorTo(el, opts = {}) {
	const { offsetX = -8, offsetY = -8, duration = 620 } = opts;
	cursor.style.transitionDuration = `${duration}ms`;

	await new Promise(requestAnimationFrame);

	const { x, y } = rectCenter(el);
	setCursorPos(x + offsetX, y + offsetY);

	await sleep(duration + 40);
}

async function clickEl(el) {
	el.classList.add('highlight');
	await sleep(120);

	cursor.classList.remove('clicking');
	void cursor.offsetWidth;
	cursor.classList.add('clicking');

	el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
	el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
	el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

	await sleep(260);
	el.classList.remove('highlight');
}

async function typeIntoInput(el, text, speed = 60) {
	el.focus();
	el.value = '';
	for (const ch of text) {
		el.value += ch;
		el.dispatchEvent(new Event('input', { bubbles: true }));
		await sleep(speed);
	}
}

const FILE_ICON_SVG = `
<svg class="fileIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true">
  <path fill="currentColor" d="M192 112L304 112L304 200C304 239.8 336.2 272 376 272L464 272L464 512C464 520.8 456.8 528 448 528L192 528C183.2 528 176 520.8 176 512L176 128C176 119.2 183.2 112 192 112zM352 131.9L444.1 224L376 224C362.7 224 352 213.3 352 200L352 131.9zM192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 250.5C512 233.5 505.3 217.2 493.3 205.2L370.7 82.7C358.7 70.7 342.5 64 325.5 64L192 64zM248 320C234.7 320 224 330.7 224 344C224 357.3 234.7 368 248 368L392 368C405.3 368 416 357.3 416 344C416 330.7 405.3 320 392 320L248 320zM248 416C234.7 416 224 426.7 224 440C224 453.3 234.7 464 248 464L392 464C405.3 464 416 453.3 416 440C416 426.7 405.3 416 392 416L248 416z"/>
</svg>`;

const EXCEL_ICON_SVG = `
<svg class="fileIcon excelIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2.5L18.5 9H14zM8.2 17l1.6-2.6L8.2 11h1.7l.8 1.6.9-1.6h1.6l-1.6 3 1.7 3h-1.7l-1-1.7-1 1.7z"/>
</svg>`;

function renderFileAttachCard(fileName = 'User Manual.pdf') {
	return `
    <div class="fileCard">
      <div class="fileTop">
        <div class="fileLeft">
          ${FILE_ICON_SVG}
          <div class="fileName">${escapeHtml(fileName)}</div>
        </div>
        <button class="fileBtn" data-action="summarize">이 문서 요약해줘</button>
      </div>
      <div class="summaryBox">
이 문서는 시스템 사용자 매뉴얼로,
주요 기능 사용 방법과 운영 시 유의사항을 설명하고 있습니다.

주요 내용은 다음과 같습니다.
1. 시스템 접속 및 로그인 방법
2. 주요 기능별 사용 절차
3. 오류 발생 시 조치 방법
4. 사용자 권한 및 설정 관리
5. 자주 묻는 질문(FAQ)

👉 특정 기능이나 필요한 부분만 더 자세히 볼까요?
      </div>
    </div>
  `;
}

function renderMailSendCard({ toName = '김ㅇㅇ', subject = 'User Manual.pdf 요약 내용 전달건', timeText = '오전 10시 51분', status = 'sending' } = {}) {
	const isSending = status === 'sending';
	return `
    <div class="mailCard ${isSending ? 'is-sending' : ''}" data-mailcard="1">
      <div class="mailLine">${escapeHtml(toName)}님에게 요약한 내용을 이메일로 전달했습니다
제목 : ${escapeHtml(subject)}
전송시각 : ${escapeHtml(timeText)}</div>
      <div class="mailStatus">${isSending ? '메일 전송하는중…' : '메일 전송완료'}</div>
    </div>
  `;
}

function finalizeMailSend() {
	const card = chatBody.querySelector('.mailCard[data-mailcard="1"]');
	if (!card) return;
	card.classList.remove('is-sending');
	const status = card.querySelector('.mailStatus');
	if (status) status.textContent = '메일 전송완료';
}

function renderGroupedBarChartCard(data) {
	const { categories, series, unit = '억원' } = data;

	const maxValRaw = Math.max(1, ...series.flatMap(s => s.values));
	const step = 0.5;
	const maxVal = Math.ceil(maxValRaw / step) * step;

	const ticks = [];
	for (let v = 0; v <= maxVal + 1e-9; v += step) {
		const label = Number.isInteger(v) ? String(v) : String(v);
		ticks.push({ v, label });
	}

	let barIndex = 0;

	const groupsHtml = categories
		.map((cat, i) => {
			const bars = series
				.map((s, si) => {
					const v = Number(s.values[i] ?? 0);
					const pct = Math.round((v / maxVal) * 100);
					const vText = Number.isInteger(v) ? String(v) : String(v);

					const html = `
            <div class="gBar dept-${si}" title="${escapeHtml(`${s.name}: ${vText} ${unit}`)}">
              <div class="gFill" style="--h:${pct}%; animation-delay:${barIndex * 90}ms;"></div>
            </div>
          `;
					barIndex += 1;
					return html;
				})
				.join('');

			return `
        <div class="gGroup">
          <div class="gBars">${bars}</div>
          <div class="gLabel">${escapeHtml(cat)}</div>
        </div>
      `;
		})
		.join('');

	const legend = series
		.map(s => s.name)
		.map(
			(name, si) => `
        <span class="legItem"><i class="legDot dept-${si}"></i>${escapeHtml(name)}</span>
      `
		)
		.join('');

	const gridHtml = `
    <div class="gYAxis" aria-hidden="true">
      <div class="gUnit">${escapeHtml(unit)}</div>
      <div class="gTicks">
        ${ticks
					.slice()
					.reverse()
					.map(t => {
						const topPct = Math.round((t.v / maxVal) * 100);
						return `
              <div class="gTick" style="--p:${topPct}%;"><span class="gTickLabel">${escapeHtml(t.label)}</span><span class="gTickLine"></span></div>
            `;
					})
					.join('')}
      </div>
    </div>
  `;

	return `
    <div class="card">
      <div class="cardTitle">작년 4분기 부서별 매출</div>
      <div class="gLegend">${legend}</div>
      <div class="gChartWrap">
        ${gridHtml}
        <div class="gChart">
          ${groupsHtml}
        </div>
      </div>
    </div>
  `;
}

function getDemoDeptSalesData() {
	return {
		unit: '억원',
		categories: ['9월', '10월', '11월', '12월'],
		series: [
			{ name: '영업', values: [1.5, 1.0, 1.2, 1.5] },
			{ name: '마케팅', values: [0.8, 1.0, 1.3, 1.2] },
			{ name: '개발', values: [1.2, 0.7, 0.9, 1.0] },
		],
	};
}

function renderTableCard({ title = '표', columns = [], rows = [], fileName = 'table.csv' } = {}) {
	const thead = `
    <thead>
      <tr>
        ${columns
					.map((c, i) => {
						const isSticky = i === 0;
						return `<th class="${isSticky ? 'stickyCol' : ''}">${escapeHtml(c)}</th>`;
					})
					.join('')}
      </tr>
    </thead>
  `;

	const tbody = `
    <tbody>
      ${rows
				.map(
					r => `
        <tr>
          ${r
						.map((cell, i) => {
							const isSticky = i === 0;
							const isNum = typeof cell === 'number' || /%$/.test(String(cell));
							return `<td class="${isSticky ? 'stickyCol' : ''} ${isNum ? 'num' : ''}">${escapeHtml(cell)}</td>`;
						})
						.join('')}
        </tr>
      `
				)
				.join('')}
    </tbody>
  `;

	return `
    <div class="tableCard" data-tablecard="1" data-filename="${escapeHtml(fileName)}">
      <div class="tableActions">
        <button class="tBtn" data-action="download-csv">
          ${EXCEL_ICON_SVG}
          엑셀(CSV) 다운로드
        </button>
      </div>

      <div class="tblWrap" role="region" aria-label="${escapeHtml(title)}" tabindex="0">
        <table class="tbl">
          ${thead}
          ${tbody}
        </table>
      </div>
    </div>
  `;
}

function tableCardToCSV(tableCardEl) {
	const table = tableCardEl.querySelector('table');
	if (!table) return '';
	const rows = [...table.querySelectorAll('tr')].map(tr =>
		[...tr.querySelectorAll('th,td')]
			.map(td => {
				const text = td.textContent.trim().replaceAll('"', '""');
				return `"${text}"`;
			})
			.join(',')
	);
	return rows.join('\n');
}

function downloadTextFile(text, fileName = 'table.csv', mime = 'text/csv;charset=utf-8') {
	const blob = new Blob([text], { type: mime });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	a.remove();

	URL.revokeObjectURL(url);
}

function getXxxWasherWarningAlarmTable() {
	return {
		title: '경알람',
		columns: ['날짜', '시간', '알람내용', '알람 해제시간'],
		rows: [
			['2025-01-01', '11:25:21', '장비의 신호감지가 비정상적입니다', '11:27:49'],
			['2025-01-24', '13:24:01', '장비의 경광등 신호가 비정상적입니다', '13:24:55'],
		],
	};
}

function getXxxWasherCriticalAlarmTable() {
	return {
		title: '중알람',
		columns: ['날짜', '시간', '알람내용', '알람 해제시간'],
		rows: [
			['2025-01-02', '11:25:31', '도어 열림 신호가 감지되었습니다', '11:27:50'],
			['2025-01-31', '13:24:01', '로봇의 Arm 신호 감지되었습니다', '13:24:55'],
		],
	};
}

function renderAlarmTableOnly({ title = '', columns = [], rows = [] } = {}) {
	const thead = `
    <thead>
      <tr>
        ${columns
					.map((c, i) => {
						const isSticky = i === 0;
						return `<th class="${isSticky ? 'stickyCol' : ''}">${escapeHtml(c)}</th>`;
					})
					.join('')}
      </tr>
    </thead>
  `;

	const tbody = `
    <tbody>
      ${rows
				.map(
					r => `
        <tr>
          ${r
						.map((cell, i) => {
							const isSticky = i === 0;
							const isNum = typeof cell === 'number' || /%$/.test(String(cell));
							return `<td class="${isSticky ? 'stickyCol' : ''} ${isNum ? 'num' : ''}">${escapeHtml(cell)}</td>`;
						})
						.join('')}
        </tr>
      `
				)
				.join('')}
    </tbody>
  `;

	return `
    <div class="alarmTableOnly">
      <div class="tblWrap" role="region" aria-label="${escapeHtml(title)}" tabindex="0">
        <table class="tbl">
          ${thead}
          ${tbody}
        </table>
      </div>
    </div>
  `;
}

function renderAlarmBundleCard({ answerText = '답변 : 다음은 xxx 세정기의 알람내역입니다.', warning, critical, fileName = 'xxx_washer_alarm_bundle.csv' } = {}) {
	return `
    <div class="alarmBundleCard" data-bundle="alarm" data-filename="${escapeHtml(fileName)}">
      <div class="alarmBundleAnswer">${escapeHtml(answerText)}</div>

      <div class="alarmBundleTop">
        <div class="alarmBundleTitle">알람내역</div>
        <div class="tableActions">
          <button class="tBtn" data-action="download-alarm-bundle">
            ${EXCEL_ICON_SVG}
            엑셀(CSV) 다운로드
          </button>
        </div>
      </div>

      <div class="alarmSectionTitle">&lt;${escapeHtml(warning?.title || '경알람')}&gt;</div>
      ${renderAlarmTableOnly(warning)}

      <div class="alarmDots" aria-hidden="true">
        <span>.</span><span>.</span><span>.</span>
      </div>

      <div class="alarmSectionTitle">&lt;${escapeHtml(critical?.title || '중알람')}&gt;</div>
      ${renderAlarmTableOnly(critical)}
    </div>
  `;
}

function alarmBundleToCSV(bundleCardEl) {
	const wrap = bundleCardEl;
	if (!wrap) return '';

	const titles = [...wrap.querySelectorAll('.alarmSectionTitle')].map(el => el.textContent.trim());
	const tables = [...wrap.querySelectorAll('table.tbl')];

	const lines = [];
	tables.forEach((table, idx) => {
		const title = titles[idx] || `Section ${idx + 1}`;
		lines.push(`"${title.replaceAll('"', '""')}"`);

		const rows = [...table.querySelectorAll('tr')].map(tr => [...tr.querySelectorAll('th,td')].map(td => `"${td.textContent.trim().replaceAll('"', '""')}"`).join(','));

		lines.push(...rows);
		lines.push('');
	});

	return lines.join('\n');
}

function respondByQuery(q) {
	const qq = q.toLowerCase();

	if (qq.includes('pdf') && qq.includes('요약')) {
		addRichBot(renderFileAttachCard('User Manual.pdf'), '첨부: User Manual.pdf');
		return;
	}

	if ((qq.includes('메일') || qq.includes('이메일')) && (qq.includes('전달') || qq.includes('보내'))) {
		addRichBot(renderMailSendCard({ status: 'sending' }), '첨부자료: email_send');
		setTimeout(finalizeMailSend, 1200);
		return;
	}

	if (qq.includes('부서별') && qq.includes('매출') && qq.includes('그래프')) {
		addMsg('bot', '작년 4분기 매출은 다음과 같습니다', '');
		addRichBot(renderGroupedBarChartCard(getDemoDeptSalesData()), '시각화: Grouped Bar Chart');
		return;
	}

	const isWasher = qq.includes('xxx') && qq.includes('세정기');
	const isAlarmIntent = qq.includes('알람') || qq.includes('알람내역') || qq.includes('경알람') || qq.includes('중알람');

	if (isWasher && !isAlarmIntent) {
		addMsg(
			'bot',
			`
xxx 세정기는 작업을 시작하기 전에 제품을 세정하는 장비입니다.
입고 날짜는 2015년 7월 8일 이며
특정 제품 기준으로 총 55,334번 세정 작업이 진행되었습니다.
생산 사이클은 10ms 입니다.

현재까지 총 27회 수리가 진행되었습니다
자세한 수리 내용은 [xxx 세정기 고장내역 및 수리내역] 문서에서 확인 가능합니다

공장 내 위치는 A구역 28번에 위치해있습니다
지도로 위치를 확인하고 싶으시다면 “지도로 알려줘” 라고 말씀해주세요`,
			'',
			{ bubbleClass: 'bubble--padLg' }
		);
		return;
	}

	if (isWasher && isAlarmIntent) {
		const warning = getXxxWasherWarningAlarmTable();
		const critical = getXxxWasherCriticalAlarmTable();

		addRichBot(
			renderAlarmBundleCard({
				answerText: `다음은 xxx 세정기의 알람내역입니다.`,
				warning,
				critical,
				fileName: 'xxx_washer_alarm_bundle.csv',
			}),
			''
		);
		return;
	}

	addMsg('bot', '네. 요청하신 내용을 확인했어요. 더 구체적으로(기간/부서/형태) 알려주시면 시뮬레이션을 맞춰드릴게요.', '참조: 에이전트 실행 로그');
}

function handleSend() {
	const q = inp.value.trim();
	if (!q) return;

	addMsg('user', q);
	inp.value = '';

	addTyping();
	setTimeout(() => {
		removeTyping();
		respondByQuery(q);
	}, 700);
}

sendBtn.addEventListener('click', handleSend);
inp.addEventListener('keydown', e => {
	if (e.key === 'Enter') handleSend();
});

function resetChat() {
	chatBody.innerHTML = `
    <div class="msg bot"><div class="bubble">안녕하세요! 무엇을 도와드릴까요?</div></div>
  `;
	inp.value = '';
	scrollBottom();
}

async function playTimeline() {
	if (running) return;
	running = true;
	resetChat();

	setCursorPos(40, 40);
	await sleep(500);

	await moveCursorTo(inp, { duration: 780 });
	await clickEl(inp);
	await typeIntoInput(inp, '이 PDF 파일 요약해줘', 60);
	await sleep(220);
	await moveCursorTo(sendBtn, { duration: 620 });
	await clickEl(sendBtn);
	await sleep(1400);

	await moveCursorTo(inp, { duration: 720 });
	await clickEl(inp);
	await typeIntoInput(inp, '방금 요약한 내용 김ㅇㅇ에게 이메일로 전달해줘', 48);
	await sleep(220);
	await moveCursorTo(sendBtn, { duration: 620 });
	await clickEl(sendBtn);
	await sleep(1700);

	await moveCursorTo(inp, { duration: 720 });
	await clickEl(inp);
	await typeIntoInput(inp, '이번달 부서별 매출 그래프로 그려줘', 52);
	await sleep(220);
	await moveCursorTo(sendBtn, { duration: 620 });
	await clickEl(sendBtn);
	await sleep(1000);

	await moveCursorTo(inp, { duration: 720 });
	await clickEl(inp);
	await typeIntoInput(inp, 'xxx 세정기에 대해서 알려줘', 50);
	await sleep(220);
	await moveCursorTo(sendBtn, { duration: 620 });
	await clickEl(sendBtn);
	await sleep(1100);

	await moveCursorTo(inp, { duration: 720 });
	await clickEl(inp);
	await typeIntoInput(inp, 'xxx 세정기 알람 내역 알려줘', 46);
	await sleep(220);
	await moveCursorTo(sendBtn, { duration: 620 });
	await clickEl(sendBtn);
	await sleep(1200);

	running = false;
}

btnReplay.addEventListener('click', playTimeline);

chatBody.addEventListener('click', e => {
	const summarizeBtn = e.target.closest('[data-action="summarize"]');
	if (summarizeBtn) {
		addMsg('user', '이 문서 요약해줘');
		addTyping();
		setTimeout(() => {
			removeTyping();
			addRichBot(renderFileAttachCard('User Manual.pdf'), '첨부파일 요약 (demo)');
		}, 650);
		return;
	}

	const bundleBtn = e.target.closest('[data-action="download-alarm-bundle"]');
	if (bundleBtn) {
		const bundle = e.target.closest('.alarmBundleCard');
		if (!bundle) return;
		const csv = alarmBundleToCSV(bundle);
		const fileName = bundle.getAttribute('data-filename') || 'alarm_bundle.csv';
		downloadTextFile(csv, fileName);
		return;
	}

	const csvBtn = e.target.closest('[data-action="download-csv"]');
	if (csvBtn) {
		const card = e.target.closest('.tableCard');
		if (!card) return;
		const csv = tableCardToCSV(card);
		const fileName = card.getAttribute('data-filename') || 'table.csv';
		downloadTextFile(csv, fileName);
		return;
	}
});

playTimeline();
