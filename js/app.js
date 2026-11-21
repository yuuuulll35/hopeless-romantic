import { HANDS, ITEMS, SAMPLE } from './data.js';
import { buildPrompt1, buildPrompt2, parseResult } from './ooc.js';

const $ = (id) => document.getElementById(id);
const KEY = 'hopeless-romantic:answer';
const store = {
  get() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return Array.isArray(v) && v[0] ? v : null;
    } catch { return null; }
  },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} },
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CIRCLE = '<svg class="mark ok" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M52 9C24 6 7 28 9 53c2 26 24 41 47 38 24-3 38-24 35-47C88 22 70 8 44 12" /></svg>';
const SLASH = '<svg class="mark no" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M88 8C66 32 38 62 10 94" /></svg>';

function verdict(diff) {
  if (diff >= 5) return '거짓 응답';
  if (diff >= 2) return '축소 신고';
  if (diff <= -2) return '과대 신고';
  return '정직';
}

function tags(r) {
  const out = [];
  if (r.hasFacts) {
    const gap = r.realTotal - r.total;
    if (gap >= 25) out.push('자기객관화_실패', '본인만_모름');
    else if (gap >= 10) out.push('점수는_짜게', '행동은_후하게');
    else if (gap <= -10) out.push('말이_앞서는_타입');
    else out.push('자기객관화_완료');
    if (r.realTotal >= 85) out.push('사랑입니다');
  } else {
    out.push(r.total >= 80 ? '당당한_사랑꾼' : r.total >= 50 ? '적당히_사랑꾼' : '아직_부정_중');
  }
  out.push('채점은_냉정하게');
  return out;
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, 1800);
}

async function copy(text, label) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast(label);
}

function render(r) {
  const npc = r.npc || 'NPC';
  const pc = r.pc || 'PC';
  const named = (s) => s.replace(/PC/g, pc);

  $('npcName').textContent = npc;
  $('pcName').textContent = pc;
  $('headScore').textContent = r.total;
  $('headReal').textContent = r.hasFacts ? r.realTotal : '';
  $('tags').innerHTML = tags(r).map((t) => `<span>#${esc(t)}</span>`).join(' ');

  $('qs').innerHTML = r.items.map((it, i) => {
    const q = ITEMS[i];
    const diff = it.real == null ? 0 : it.real - it.self;
    const honest = Math.abs(diff) <= 1;
    const red = it.real == null ? '' : `
      ${honest ? CIRCLE : SLASH}
      <div class="fact">
        <span class="fact-tag">팩트체크</span>
        ${it.fact ? `<p class="fact-text">${esc(it.fact)}</p>` : ''}
        <p class="fact-score">내 점수 <s>${it.self}</s> → 실제 <b>${it.real}</b> <i>${verdict(diff)}</i></p>
      </div>`;
    return `
    <li class="q${honest ? '' : ' off'}">
      <div class="q-head"><span class="q-no">${i + 1}</span><span class="q-cat">${esc(q.cat)}</span></div>
      <p class="q-text">${esc(named(q.q))}</p>
      <div class="answer">
        <div class="box"><span>내 점수</span><b class="pen">${it.self}</b><em>/10</em></div>
        <p class="pen comment">${esc(it.comment) || '(무응답)'}</p>
      </div>${red}
    </li>`;
  }).join('');

  $('total').textContent = r.total;
  $('realTotal').textContent = r.hasFacts ? r.realTotal : '';
  $('insight').textContent = r.hasFacts ? r.insight : '';
  $('typeWrap').hidden = !r.type;
  $('typeName').textContent = r.type;
  $('stamp').classList.toggle('long', r.type.length > 14);
  $('typeWhy').textContent = r.why;

  $('noteWrap').hidden = !r.mind;
  $('mind').innerHTML = r.mind.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('');
  $('sign').textContent = `— ${npc}`;
  const d = new Date();
  $('noteDate').textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 어느 날`;

  const sheet = $('sheet');
  const hand = HANDS.find((h) => h.key === r.hand) || HANDS[0];
  sheet.style.setProperty('--hand', `'${hand.font}', 'Gaegu', cursive`);
  sheet.style.setProperty('--hs', hand.scale);
  sheet.classList.toggle('no-facts', !r.hasFacts);
  $('redToggle').hidden = !r.hasFacts;
  $('redPen').checked = true;
  sheet.classList.add('red-on');

  $('home').hidden = true;
  $('result').hidden = false;
  window.scrollTo(0, 0);
  observe();
}

let io;
function observe() {
  io?.disconnect();
  const targets = document.querySelectorAll('.q, .verdict, .note');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('seen'));
    return;
  }
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('seen');
      io.unobserve(e.target);
    }
  }, { threshold: 0.3 });
  targets.forEach((el) => io.observe(el));
}

function grade(parts, remember = true) {
  const [a, b] = parts.map((t) => String(t || '').trim());
  const { result, error } = parseResult(`${a}\n${b}`);
  if (error) return toast(error);
  if (remember) store.set([a, b]);
  render(result);
}

const TASKS = [1, 2].map((n) => {
  const el = $(`task${n}`);
  const q = (sel) => el.querySelector(sel);
  return { n, el, ta: q('textarea'), err: q('.error'), got: q('.got'), gotText: q('.got-text'), pre: q('.ooc-preview'), text: '' };
});
const [T1, T2] = TASKS;
const filled = (t) => t.el.dataset.state === 'filled';

function prompt(t) {
  if (t.n === 1) return buildPrompt1();
  const { result } = parseResult(T1.text);
  return buildPrompt2(result || null);
}

function refresh() {
  T2.el.classList.toggle('locked', !filled(T1));
  $('grade').disabled = !(filled(T1) && filled(T2));
}

function setState(t, state) {
  t.el.dataset.state = state;
  t.got.hidden = state !== 'filled';
  refresh();
}

function check(t, text) {
  if (!text) return { msg: '내용이 비어 있어요. AI가 보낸 답을 복사한 뒤 다시 눌러 주세요.' };
  if (/^\s*\[OOC\s*\d\/2/.test(text) && text.includes('[출력]')) return { msg: '아직 OOC가 복사된 상태예요. 채팅에서 AI가 보낸 답을 복사한 뒤 다시 눌러 주세요.' };
  if (t.n === 1) {
    const { result, error } = parseResult(text);
    return error ? { msg: error } : { summary: `${result.npc || 'NPC'}의 답안 10개 항목` };
  }
  const { result } = parseResult(`${T1.text}\n${text}`);
  if (!result?.hasFacts) return { msg: '실제 점수 10개를 다 찾지 못했어요. OOC ②의 답을 통째로 복사해 주세요.' };
  return { summary: ['팩트체크 10개 항목', result.type && '유형', result.mind && '심정'].filter(Boolean).join(' · ') };
}

function accept(t, raw) {
  const text = String(raw || '').trim();
  const c = check(t, text);
  if (c.msg) {
    t.err.textContent = c.msg;
    t.err.hidden = false;
    return false;
  }
  t.text = text;
  t.ta.value = text;
  t.ta.hidden = true;
  t.err.hidden = true;
  t.pre.hidden = true;
  t.gotText.textContent = `✓ ${c.summary}`;
  setState(t, 'filled');
  if (t.n === 1 && !filled(T2)) T2.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return true;
}

function manual(t, note) {
  t.ta.hidden = false;
  t.ta.focus();
  if (note) toast(note);
}

async function pasteInto(t) {
  let text;
  try {
    text = await navigator.clipboard.readText();
  } catch {
    return manual(t, '아래 칸에 직접 붙여넣어 주세요');
  }
  if (!accept(t, text)) t.ta.hidden = true;
}

for (const t of TASKS) {
  t.el.querySelector('.copy').addEventListener('click', async () => {
    await copy(prompt(t), `OOC ${'①②'[t.n - 1]} 복사 완료. 채팅에 보내 주세요`);
    t.err.hidden = true;
    setState(t, 'copied');
  });
  t.el.querySelector('.paste').addEventListener('click', () => pasteInto(t));
  t.ta.addEventListener('paste', () => setTimeout(() => accept(t, t.ta.value)));
  t.ta.addEventListener('change', () => { if (t.ta.value.trim()) accept(t, t.ta.value); });
  t.el.addEventListener('click', (e) => {
    const act = e.target.dataset.act;
    if (act === 'manual') manual(t);
    if (act === 'redo') {
      setState(t, 'copied');
      if (t.n === 1) refresh();
    }
    if (act === 'clear') reset(t);
    if (act === 'peek') {
      t.pre.textContent = prompt(t);
      t.pre.hidden = !t.pre.hidden;
      e.target.setAttribute('aria-expanded', String(!t.pre.hidden));
      e.target.textContent = t.pre.hidden ? 'OOC 내용 보기' : 'OOC 접기';
    }
  });
}

function reset(t) {
  t.text = '';
  t.ta.value = '';
  t.ta.hidden = true;
  t.err.hidden = true;
  t.pre.hidden = true;
  const peek = t.el.querySelector('[data-act=peek]');
  peek.setAttribute('aria-expanded', 'false');
  peek.textContent = 'OOC 내용 보기';
  setState(t, 'empty');
}

function home() {
  $('result').hidden = true;
  $('home').hidden = false;
  $('resume').hidden = !store.get();
  refresh();
  window.scrollTo(0, 0);
}

$('grade').addEventListener('click', () => grade([T1.text, T2.text]));
$('sample').addEventListener('click', () => grade(SAMPLE, false));
$('resume').addEventListener('click', () => grade(store.get(), false));
$('back').addEventListener('click', home);
$('again').addEventListener('click', () => {
  TASKS.forEach(reset);
  home();
});
$('redPen').addEventListener('change', (e) => $('sheet').classList.toggle('red-on', e.target.checked));

home();
