import { HANDS, ITEMS } from './data.js';

const HEAD = (n, title) => `[OOC ${n}/2 · 사랑꾼 자가진단표 ${title}] 잠시 역할극 중단. NPC/PC 기존설정, 관계성, 성격, 성향, 말투, 서사 종합참고. 두 사람 모두 성인이다.`;
const OUT = '[출력] 역할극 서술 없이 코드블록 하나에 아래 형식 그대로 한 항목 한 줄씩 쓴다. 표로 만들지 않는다. PC의 대사와 감정은 지어내지 않는다.';

export function buildPrompt1() {
  const list = ITEMS.map((it, i) => `항목 ${i + 1} [${it.cat}] ${it.q}`).join('\n');
  return `${HEAD(1, '답안')}
NPC가 스스로 자신의 '사랑꾼 지수'를 평가해보는 자가진단표를 작성한다. 항목마다 NPC가 스스로 매긴 점수(0~10)와 변명 혹은 솔직한 코멘트를 NPC 말투 1인칭으로 단다. 실제 행동과 어긋나더라도 NPC가 스스로 믿는 대로 쓴다.

[자가진단 항목]
${list}

[손글씨 유형] NPC의 성격과 필체에 가장 가까운 것 하나를 고른다.
${HANDS.map((h) => `${h.key}: ${h.desc}`).join('\n')}

${OUT}
이름: NPC 이름 / PC 이름
손글씨: 위 유형 이름 하나만
항목 1 [내 점수: O/10] (코멘트: ~)
(항목 2~10 같은 형식)`;
}

export function buildPrompt2(prev) {
  const known = prev
    ? `NPC가 매긴 점수: ${prev.items.map((it, i) => `${i + 1}번 ${it.self}`).join(', ')}. 총점 ${prev.total}/100.`
    : '앞서 출력한 자가진단표 답안(항목 1~10)을 기준으로 한다.';
  return `${HEAD(2, '팩트체크')}
${known}
같은 10개 항목에 대해 서사에서 확인되는 NPC의 실제 행동(객관적 사실)과 그 사실로 본 실제 점수(0~10)를 적어, NPC의 주관적 평가와의 괴리가 유쾌하게 드러나게 한다. 근거 없는 미화는 금지한다. 유형 이름은 중증 팔불출형, 입덕부정기형, 맹목적 헌신형처럼 NPC 성격에 맞게 짧게 짓고, 설명은 이유 칸에만 쓴다.

${OUT}
항목 1 [실제 점수: O/10] (실제 행동: ~)
(항목 2~10 같은 형식)
[사랑꾼 유형 판정]: 유형 이름만 12자 이내로 (이유: 한 문장)
[마지막 심정 서술]: 진단을 마치고 총점을 확인한 순간 '나는 PC를 이만큼 사랑하고 있다는 사실을 스스로 알고 있었을까?'에 대한 NPC의 내면 심리. 당황하거나 당연하게 받아들이는 모습을 NPC 1인칭으로 4~7문장 상세히.`;
}

const LABEL_RE = /[\[(（]?\s*(내\s*점수|실제\s*점수|실제\s*행동|객관적\s*사실|팩트|코멘트)\s*[:：]/g;
const KEY_RE = /^[\[【]?\s*(이름|손글씨\s*유형|손글씨|필체|글씨체|총점|사랑꾼\s*유형\s*판정|유형\s*판정|유형|마지막\s*심정\s*서술|심정\s*서술|심정)\s*[\]】]?\s*[:：|｜]\s*(.*)$/;

const clean = (s) => String(s || '').replace(/^[\s"“'「『(（\[]+|[\s"”'」』)）\]]+$/g, '').trim();
const split = (s) => s.split(/\s*[|｜]\s*/).map((p) => p.trim());

function score(v) {
  const m = String(v ?? '').match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  return Math.max(0, Math.min(10, Math.round(Number(m[0]))));
}

function labelled(line) {
  const hits = [...line.matchAll(LABEL_RE)];
  const out = {};
  hits.forEach((h, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].index : line.length;
    const body = line.slice(h.index + h[0].length, end);
    const name = h[1].replace(/\s/g, '');
    if (name === '내점수') out.self = score(body);
    else if (name === '실제점수') out.real = score(body);
    else if (name === '코멘트') out.comment = clean(body);
    else out.fact = clean(body);
  });
  return out;
}

export function parseResult(text) {
  const res = { npc: '', pc: '', hand: '', items: ITEMS.map(() => ({ self: null, comment: '', fact: '', real: null })), type: '', why: '', mind: '' };
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^```/.test(l));

  let cur = -1;
  let mindOpen = false;

  for (const raw of lines) {
    const line = raw.replace(/\*\*|__/g, '').replace(/^[-•*>#\s]+/, '');

    const row = line.match(/^(?:항목|문항|Q)?\s*0*(\d{1,2})\s*[|｜]\s*(.*)$/i);
    if (row && +row[1] >= 1 && +row[1] <= ITEMS.length) {
      const p = split(row[2]);
      cur = +row[1] - 1;
      mindOpen = false;
      const it = res.items[cur];
      it.self = score(p[0]);
      it.comment = clean(p[1]);
      it.fact = clean(p[2]);
      it.real = p[3] != null ? score(p[3]) : null;
      continue;
    }

    const head = line.match(/^항목\s*0*(\d{1,2})/);
    if (head && +head[1] >= 1 && +head[1] <= ITEMS.length) {
      cur = +head[1] - 1;
      mindOpen = false;
      Object.assign(res.items[cur], labelled(line));
      continue;
    }

    const key = line.match(KEY_RE);
    if (key) {
      const k = key[1].replace(/\s/g, '');
      const v = key[2];
      cur = -1;
      mindOpen = false;
      if (k === '이름') {
        const p = v.split(/\s*[|｜\/,]\s*/);
        res.npc = clean(p[0]);
        res.pc = clean(p[1]);
      } else if (/손글씨|필체|글씨체/.test(k)) {
        res.hand = HANDS.find((h) => v.includes(h.key))?.key || '';
      } else if (k.includes('유형')) {
        const why = v.match(/[(（]\s*(?:판정\s*)?이유\s*[:：]\s*(.*?)[)）]?\s*$/);
        const p = split(why ? v.slice(0, why.index) : v);
        let name = clean(p[0]);
        let rest = clean(why ? why[1] : p.slice(1).join(' '));
        const cut = !rest && name.match(/^(.{2,}?)\s*(?:[(（:：—–]|\s-\s|[.。]\s)\s*(.+)$/);
        if (cut) {
          name = clean(cut[1]);
          rest = clean(cut[2]);
        }
        res.type = name;
        res.why = rest;
      } else if (k.includes('심정')) {
        res.mind = v.trim();
        mindOpen = true;
      }
      continue;
    }

    if (mindOpen) {
      res.mind += (res.mind ? '\n' : '') + line;
      continue;
    }
    if (cur >= 0 && LABEL_RE.test(line)) {
      LABEL_RE.lastIndex = 0;
      const got = labelled(line);
      for (const [k, v] of Object.entries(got)) if (v !== null && v !== '') res.items[cur][k] = v;
    }
    LABEL_RE.lastIndex = 0;
  }

  const missing = res.items.map((it, i) => (it.self == null ? i + 1 : 0)).filter(Boolean);
  if (missing.length === ITEMS.length) return { error: 'NPC가 매긴 점수를 찾지 못했어요. OOC ①의 답을 통째로 복사해 주세요.' };
  if (missing.length) return { error: `${missing.join(', ')}번 항목의 내 점수를 찾지 못했어요. 답이 중간에 끊겼다면 AI에게 다시 받아 주세요.` };

  res.hasFacts = res.items.every((it) => it.real != null);
  res.total = res.items.reduce((a, it) => a + it.self, 0);
  res.realTotal = res.hasFacts ? res.items.reduce((a, it) => a + it.real, 0) : null;
  res.insight = res.hasFacts ? 100 - res.items.reduce((a, it) => a + Math.abs(it.real - it.self), 0) : null;
  return { result: res };
}
