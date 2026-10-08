/* Draws the Opus Magnum book as ink-and-wash SVG spreads.

   Each spread is 1760 x 1240, the same frame as the sketchbook's PNGs, with
   the paper inside x 5.1%-94.9% and y 21.8%-78.2%: the page-turn, the shade
   masks and the magnifier in index.html all assume that geometry.

   SVG drawn as an image cannot load anything, so Instrument Serif is
   embedded in every file.  Run from anywhere:  node tools/build-spreads.mjs */
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const font = f => readFileSync(join(ROOT, 'assets', f)).toString('base64');
const FONTS = `@font-face{font-family:IS;font-style:normal;src:url(data:font/woff2;base64,${font('instrument-serif.woff2')}) format('woff2')}
@font-face{font-family:IS;font-style:italic;src:url(data:font/woff2;base64,${font('instrument-serif-italic.woff2')}) format('woff2')}`;

/* paper bounds */
const L0 = 90, MID = 880, R1 = 1670, T = 270, B = 970;
const RC = (MID + R1) / 2;              /* right page centre */
const INK = '#2b2721', SOFT = '#6b6257', EARTH = '#9a6a3e';
const WASH = {blue: '#8ea3b8', ochre: '#d9b27c', sage: '#a9b59a', rose: '#d4a89a'};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ------------------------------------------------------------ marks */
function text(x, y, s, o = {}) {
  const size = o.size || 22;
  return `<text x="${x}" y="${y}" font-size="${size}"${o.italic ? ' font-style="italic"' : ''}`
    + ` fill="${o.fill || INK}" text-anchor="${o.anchor || 'start'}"`
    + (o.ls ? ` letter-spacing="${o.ls}"` : '') + (o.op ? ` opacity="${o.op}"` : '')
    + `>${esc(s)}</text>`;
}
const caps = (x, y, s, o = {}) => text(x, y, s.toUpperCase(), {size: 15, ls: 3.2, fill: EARTH, ...o});
function wrap(s, n) {
  const out = []; let line = '';
  for (const w of s.split(' ')) {
    if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; }
    else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
}
function para(x, y, s, o = {}) {
  const lh = o.lh || 35;
  const lines = wrap(s, o.chars || 54);
  return {svg: lines.map((l, i) => text(x, y + i * lh, l, o)).join(''), end: y + lines.length * lh};
}
const wash = (cx, cy, rx, ry, c, op = .5) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${op}" filter="url(#wash)"/>`;
const rect = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 10}" fill="${o.fill || 'none'}"`
  + ` stroke="${o.stroke || INK}" stroke-width="${o.sw || 2.2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const circle = (cx, cy, r, o = {}) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fill || 'none'}" stroke="${o.stroke || INK}"`
  + ` stroke-width="${o.sw || 2.2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const path = (d, o = {}) =>
  `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 2.2}"`
  + ` stroke-linecap="round" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}`
  + `${o.arrow ? ` marker-end="url(#${o.arrow === 'earth' ? 'ae' : 'a'})"` : ''}/>`;
const arrow = (x1, y1, x2, y2, o = {}) => path(`M${x1} ${y1} L${x2} ${y2}`, {arrow: 1, ...o});
const tick = (x, y, s = 1, c = EARTH) => path(`M${x} ${y} l${7 * s} ${8 * s} l${15 * s} -${18 * s}`, {stroke: c, sw: 3});
/* a sheet of paper with a folded corner and ruled lines */
function sheet(x, y, w, h, lines = 4, o = {}) {
  const f = Math.min(26, Math.round(w * .28));
  let s = path(`M${x} ${y} H${x + w - f} L${x + w} ${y + f} V${y + h} H${x} Z`, {fill: o.fill || '#fbf7ee'})
    + path(`M${x + w - f} ${y} V${y + f} H${x + w}`, {sw: 1.6});
  for (let i = 0; i < lines; i++) {
    const ly = y + (o.top || 52) + i * 20;
    s += path(`M${x + 18} ${ly} H${x + w - 18 - (i % 2 ? 40 : 0)}`, {stroke: SOFT, sw: 1.4});
  }
  return s;
}
function padlock(x, y, s = 1) {
  return rect(x - 22 * s, y, 44 * s, 36 * s, {r: 6, fill: '#f3e6cf'})
    + path(`M${x - 13 * s} ${y} V${y - 12 * s} a${13 * s} ${13 * s} 0 0 1 ${26 * s} 0 V${y}`)
    + circle(x, y + 16 * s, 4 * s, {fill: INK, sw: 0});
}

/* ------------------------------------------------------------ the book */
function book(body, n) {
  const pages = n ? text((L0 + MID) / 2, B - 34, String(n * 2), {size: 17, anchor: 'middle', fill: SOFT})
    + text(RC, B - 34, String(n * 2 + 1), {size: 17, anchor: 'middle', fill: SOFT}) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1760 1240" width="1760" height="1240">
<defs>
<style>${FONTS} text{font-family:IS,Georgia,'Times New Roman',serif}</style>
<filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3"/>
  <feDisplacementMap in="SourceGraphic" scale="3.2"/>
</filter>
<filter id="wash" x="-30%" y="-30%" width="160%" height="160%">
  <feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="7" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="70"/>
  <feGaussianBlur stdDeviation="6"/>
</filter>
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11"/>
  <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .18  0 0 0 .09 0"/>
  <feComposite in2="SourceGraphic" operator="in"/>
</filter>
<linearGradient id="gutL" x1="0" x2="1"><stop offset=".72" stop-color="#5a4426" stop-opacity="0"/><stop offset="1" stop-color="#5a4426" stop-opacity=".2"/></linearGradient>
<linearGradient id="gutR" x1="1" x2="0"><stop offset=".78" stop-color="#5a4426" stop-opacity="0"/><stop offset="1" stop-color="#5a4426" stop-opacity=".16"/></linearGradient>
<linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8f3e8"/><stop offset="1" stop-color="#f1eadb"/></linearGradient>
<marker id="a" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M1 1 L10 6 L1 11" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/></marker>
<marker id="ae" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M1 1 L10 6 L1 11" fill="none" stroke="${EARTH}" stroke-width="1.8" stroke-linecap="round"/></marker>
<clipPath id="pages"><path d="M${MID} ${T} H${R1 - 16} q16 0 16 16 V${B - 16} q0 16 -16 16 H${L0 + 16} q-16 0 -16 -16 V${T + 16} q0 -16 16 -16 Z"/></clipPath>
</defs>
<!-- page stack peeking out at the fore-edges -->
<path d="M${L0 + 10} ${B + 5} H${R1 - 10}" stroke="#d9cfbb" stroke-width="5"/>
<rect x="${L0 - 4}" y="${T + 4}" width="${R1 - L0 + 8}" height="${B - T}" rx="18" fill="#e4dac6"/>
<g clip-path="url(#pages)">
  <rect x="${L0}" y="${T}" width="${R1 - L0}" height="${B - T}" fill="url(#paper)"/>
  <rect x="${L0}" y="${T}" width="${R1 - L0}" height="${B - T}" filter="url(#grain)" fill="#fff"/>
  <g>${body}</g>
  ${pages}
  <rect x="${L0}" y="${T}" width="${MID - L0}" height="${B - T}" fill="url(#gutL)"/>
  <rect x="${MID}" y="${T}" width="${R1 - MID}" height="${B - T}" fill="url(#gutR)"/>
  <path d="M${MID} ${T} V${B}" stroke="#7a6446" stroke-opacity=".35" stroke-width="1.4"/>
</g>
</svg>`;
}
const ink = s => `<g filter="url(#rough)">${s}</g>`;

/* the left page of every chapter: numeral, title, a paragraph, three notes */
function chapter(num, title, body, notes) {
  let s = caps(160, 352, 'Chapter ' + num);
  const t = wrap(title, 26);
  s += t.map((l, i) => text(160, 412 + i * 52, l, {size: 50, italic: true})).join('');
  let y = 412 + (t.length - 1) * 52 + 34;
  s += path(`M160 ${y} H290`, {stroke: EARTH, sw: 1.6});
  const p = para(160, y + 48, body, {size: 24, lh: 35, chars: 62, fill: '#3a342c'});
  s += p.svg;
  y = p.end + 22;
  for (const n of notes) {
    s += text(160, y, '—', {fill: EARTH, size: 21}) + text(192, y, n, {size: 21, italic: true, fill: SOFT});
    y += 34;
  }
  return s;
}
const capRight = s => text(RC, B - 74, s, {size: 21, italic: true, anchor: 'middle', fill: SOFT});

/* ------------------------------------------------------------ spreads */
const CHAPTERS = [
  ['I', 'Requests for staff'], ['II', 'Release to agencies'], ['III', 'Candidates'],
  ['IV', 'Selection and placement'], ['V', 'Shifts and compliance'], ['VI', 'Invoicing'],
  ['VII', 'Exports and payments'], ['VIII', 'Audit and IR35'],
];

const SPREADS = [];

/* 0 — title page and contents */
SPREADS.push({file: 'title.svg', svg: book(
  wash(485, 560, 250, 150, WASH.ochre, .32) + wash(560, 640, 160, 90, WASH.blue, .22)
  + caps(485, 420, 'Opus People Solutions', {anchor: 'middle', ls: 4.5})
  + text(485, 560, 'Opus Magnum', {size: 104, italic: true, anchor: 'middle'})
  + ink(path('M395 600 H575', {stroke: EARTH, sw: 1.6}) + circle(485, 600, 5, {fill: EARTH, sw: 0}))
  + text(485, 656, 'A vendor management system for', {size: 25, anchor: 'middle', fill: '#3a342c'})
  + text(485, 690, 'temporary, contract and permanent staff', {size: 25, anchor: 'middle', fill: '#3a342c'})
  + text(485, 860, 'Requests · Agencies · Shifts · Invoices · Exports', {size: 18, anchor: 'middle', fill: SOFT, ls: 1})
  /* contents */
  + caps(RC, 352, 'Contents', {anchor: 'middle', ls: 4.5})
  + CHAPTERS.map(([n, t], i) => {
      const y = 430 + i * 56;
      return text(990, y, n, {size: 20, fill: EARTH, anchor: 'end'})
        + text(1012, y, t, {size: 27, italic: true})
        + path(`M${1012 + t.length * 11.5 + 14} ${y - 6} H1530`, {stroke: SOFT, sw: 1.3, dash: '1 7'})
        + text(1560, y, String((i + 1) * 2), {size: 19, fill: SOFT, anchor: 'end'});
    }).join(''),
  0)});

/* I — requests climb the reporting line */
SPREADS.push({file: 'requests.svg', svg: book(
  chapter('I', 'Requests for staff, approved up the line',
    'A hiring manager asks for staff in the app: the role, the site, the dates and the headcount. Before anything reaches an agency, the request climbs that manager’s own reporting line, as many levels as the client’s rule asks for.',
    ['Contract, shift-based or permanent', 'No approver on file? The MSP decides, with a reason', 'Placement extensions climb the same line'])
  + wash(1290, 600, 300, 170, WASH.sage, .35) + wash(1500, 420, 90, 80, WASH.ochre, .55)
  + ink(
      sheet(926, 770, 66, 86, 3, {top: 34})
      + rect(1010, 740, 210, 62) + rect(1120, 620, 210, 62) + rect(1230, 500, 210, 62)
      + arrow(1150, 738, 1180, 690) + arrow(1260, 618, 1290, 570) + arrow(1400, 498, 1440, 460)
      + circle(1510, 410, 64, {stroke: EARTH, sw: 3}) + circle(1510, 410, 52, {stroke: EARTH, sw: 1.4})
      + path('M1080 802 C 1130 900, 1480 900, 1510 480', {stroke: EARTH, dash: '6 8', arrow: 'earth'})
    )
  + text(1115, 779, 'Hiring manager', {size: 22, anchor: 'middle'})
  + text(1225, 659, 'Line manager', {size: 22, anchor: 'middle'})
  + text(1335, 539, 'Head of service', {size: 22, anchor: 'middle'})
  + text(1510, 404, 'Approved', {size: 22, italic: true, anchor: 'middle', fill: EARTH})
  + text(1510, 430, 'FOR THE CLIENT', {size: 11, anchor: 'middle', fill: EARTH, ls: 2})
  + text(1405, 850, 'or the MSP, with a reason', {size: 19, italic: true, fill: EARTH})
  + capRight('A request climbs the reporting line before it goes anywhere.'),
  1)});

/* II — tiered release */
{
  const cx = 1190, cy = 585, rings = [[130, 'Tier 1', 'released now'], [188, 'Tier 2', 'after a set delay'], [244, 'Tier 3', 'later still']];
  let rs = circle(cx, cy, 72, {fill: '#fbf7ee', sw: 2.6});
  const dots = [[130, [-150, -60, 20, 110]], [188, [-120, 60, 150, 200]], [244, [-170, -95, 30, 95, 170, 230]]];
  rings.forEach(([r]) => rs += circle(cx, cy, r, {dash: '3 7', sw: 1.6}));
  dots.forEach(([r, as], k) => as.forEach(a => {
    const t = a * Math.PI / 180;
    rs += circle((cx + r * Math.cos(t)).toFixed(1), (cy + r * Math.sin(t)).toFixed(1), 13 - k * 1.5,
      {fill: k === 0 ? EARTH : k === 1 ? '#c9a77a' : '#e9dcc4', sw: 1.6});
  }));
  let labels = text(cx, cy - 4, 'Request', {size: 24, italic: true, anchor: 'middle'})
    + text(cx, cy + 22, 'APPROVED', {size: 11, ls: 2, anchor: 'middle', fill: EARTH});
  rings.forEach(([r, n, w], i) => {
    const a = -(22 + i * 6) * Math.PI / 180, px = cx + r * Math.cos(a), py = cy + r * Math.sin(a), ly = 400 + i * 66;
    labels += text(1468, ly, n, {size: 23, italic: true}) + text(1468, ly + 22, w, {size: 16, fill: SOFT});
    labels += ink(path(`M${px.toFixed(1)} ${py.toFixed(1)} L1456 ${ly - 7}`, {stroke: EARTH, sw: 1.2}) + circle(px.toFixed(1), py.toFixed(1), 3.5, {fill: EARTH, sw: 0}));
  });
  SPREADS.push({file: 'release.svg', svg: book(
    chapter('II', 'Released to the right agencies, tier by tier',
      'Approved requests go only to the agencies cleared for that site: by job category, by area and by tier. A tiered request stays invisible to the next tier until its moment comes, so preferred suppliers really do get first refusal.',
      ['Agency scope by job category and area', 'Approving a category covers its sub-categories', 'Unreleased work is hidden on every screen'])
    + wash(cx, cy, 230, 200, WASH.blue, .28) + ink(rs) + labels
    + capRight('Each ring sees the request only once it is released to them.'),
    2)});
}

/* III — candidates funnel */
{
  let dots = '';
  [[1030, 342], [1095, 356], [1160, 338], [1225, 358], [1290, 340], [1355, 356], [1420, 338], [1485, 354]]
    .forEach(([x, y], i) => dots += sheet(x - 19, y - 24, 38, 48, 0, {fill: i % 3 === 2 ? '#efd9bb' : '#fbf7ee'}));
  const bands = [[478, 'CVs from agencies and Opus recruiters'], [568, 'Duplicates held back'], [652, 'Shortlist sent to the client'], [730, 'Interview']];
  let bl = '', bt = '';
  bands.forEach(([y, l], i) => {
    const half = 300 - (y - 400) * 0.53;
    if (i) bl += path(`M${1255 - half} ${y - 34} H${1255 + half}`, {sw: 1.4, dash: '4 6'});
    bt += text(1255, y, l, {size: i ? 22 : 20, italic: !!i, anchor: 'middle', fill: i ? INK : SOFT});
  });
  SPREADS.push({file: 'candidates.svg', svg: book(
    chapter('III', 'Candidates, without the duplicates',
      'Agencies put CVs forward, and Opus recruiters work alongside them. The same person submitted twice is caught by name and date of birth or NI number, and the client only ever sees the shortlist.',
      ['A cap on CVs per agency, per request', 'Duplicates held against the first submission', 'Interviews arranged and emailed to everyone'])
    + wash(1255, 590, 230, 190, WASH.rose, .3)
    + ink(dots + path('M955 410 H1555 L1335 770 H1175 Z', {sw: 2.6}) + bl + arrow(1255, 776, 1255, 836))
    + bt + text(1255, 870, 'Selected', {size: 26, italic: true, anchor: 'middle', fill: EARTH}),
    3)});
}

/* IV — three approvals make a placement */
{
  const st = [[1050, 'Hiring manager', 'selects'], [1255, 'Compliance', 'approves'], [1460, 'MSP', 'agrees the rate']];
  let rings = '', labels = '';
  st.forEach(([x, a, b], i) => {
    rings += circle(x, 470, 74, {stroke: i ? EARTH : INK, sw: 2.6}) + circle(x, 470, 62, {stroke: i ? EARTH : INK, sw: 1.2, dash: '2 5'})
      + arrow(x + (1255 - x) * .25, 552, x + (1255 - x) * .75, 650, {sw: 1.8});
    labels += text(x, 466, a, {size: a.length > 11 ? 18 : 23, italic: true, anchor: 'middle'})
      + text(x, 492, b.toUpperCase(), {size: 11, ls: 1.8, anchor: 'middle', fill: EARTH});
  });
  SPREADS.push({file: 'placement.svg', svg: book(
    chapter('IV', 'Three signatures make a placement',
      'The hiring manager selects up to the headcount, after a passed interview. Compliance and the MSP then sign off, the MSP on the rate against the tier cap, and the placement is made with its agreed rates, approvers and purchase order.',
      ['Compliance cannot approve a blocked worker', 'A rate over the cap needs a reason', 'Permanent fees from the client’s own terms'])
    + wash(1255, 470, 300, 110, WASH.ochre, .3) + wash(1255, 760, 140, 100, WASH.sage, .4)
    + ink(rings + sheet(1160, 660, 190, 210, 5, {top: 78}))
    + labels + text(1245, 706, 'Placement', {size: 26, italic: true, anchor: 'middle'})
    + capRight('Selection, compliance and rate: all three, every time.'),
    4)});
}

/* V — the week, checked */
{
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const x0 = 1000, cw = 86, y0 = 390, rh = 84;
  let g = '', lab = '';
  days.forEach((d, i) => lab += text(x0 + i * cw + cw / 2, y0 - 16, d, {size: 19, anchor: 'middle', fill: SOFT}));
  ['Early', 'Late', 'Night', 'Waking'].forEach((r, j) => lab += text(x0 - 14, y0 + j * rh + rh / 2 + 7, r, {size: 19, italic: true, anchor: 'end', fill: SOFT}));
  for (let j = 0; j <= 4; j++) g += path(`M${x0} ${y0 + j * rh} H${x0 + 7 * cw}`, {sw: 1.2, stroke: SOFT});
  for (let i = 0; i <= 7; i++) g += path(`M${x0 + i * cw} ${y0} V${y0 + 4 * rh}`, {sw: 1.2, stroke: SOFT});
  const booked = [[0, 0], [1, 0], [2, 0], [4, 0], [0, 1], [3, 1], [5, 1], [6, 1], [1, 2], [2, 2], [5, 2], [3, 3], [4, 3], [6, 3]];
  let fills = '';
  booked.forEach(([i, j], k) => {
    const x = x0 + i * cw + 8, y = y0 + j * rh + 10;
    fills += `<rect x="${x}" y="${y}" width="${cw - 16}" height="${rh - 20}" rx="8" fill="${[WASH.ochre, WASH.sage, WASH.blue][k % 3]}" opacity=".45"/>`;
    g += rect(x, y, cw - 16, rh - 20, {r: 8, sw: 1.6}) + (k % 5 !== 2 ? tick(x + 22, y + 32, .9) : '');
  });
  const checks = ['DBS Update Service, nightly', 'Right to work', 'AWR weeks', 'Rate margins'];
  let cl = '';
  checks.forEach((c, i) => {
    const x = 960 + (i % 2) * 330, y = 790 + Math.floor(i / 2) * 44;
    cl += ink(tick(x, y - 10)) + text(x + 34, y, c, {size: 21, italic: true});
  });
  SPREADS.push({file: 'shifts.svg', svg: book(
    chapter('V', 'Shifts, checked every time',
      'Day to day, Opus Magnum is a shift platform: pools, sites, rotas and timesheets. Every booking runs the same checks, however it is made, and compliance is watched continuously rather than at onboarding alone.',
      ['Every booking route runs every check', 'Expiring documents chased before they lapse', 'Warnings when a rate would lose money'])
    + fills + ink(g) + lab + cl,
    5)});
}

/* VI — one set of priced lines, two documents */
SPREADS.push({file: 'invoicing.svg', svg: book(
  chapter('VI', 'Invoices that agree with each other',
    'Every approved shift, timesheet line and expense becomes a priced line. Clients receive sales invoices and agencies receive self-bills, both drawn from the same lines, so the two sides of every placement always reconcile.',
    ['Priced lines kept in step, and swept nightly', 'Credits raised against issued documents', 'Cost codes carried through to the invoice'])
  + wash(1060, 470, 140, 120, WASH.blue, .35) + wash(1450, 470, 140, 120, WASH.rose, .35) + wash(1255, 760, 220, 80, WASH.ochre, .4)
  + ink(
      sheet(980, 360, 160, 200, 5, {top: 84}) + sheet(1370, 360, 160, 200, 5, {top: 84})
      + rect(1095, 700, 320, 120, {fill: '#fbf7ee'})
      + [0, 1, 2].map(i => path(`M1115 ${738 + i * 28} H1300 M1340 ${738 + i * 28} H1395`, {stroke: SOFT, sw: 1.4})).join('')
      + path('M1190 696 C 1180 640, 1150 610, 1140 574', {arrow: 1}) + path('M1320 696 C 1330 640, 1360 610, 1370 574', {arrow: 1})
    )
  + text(1060, 404, 'Sales invoice', {size: 22, italic: true, anchor: 'middle'})
  + text(1450, 404, 'Self-bill', {size: 22, italic: true, anchor: 'middle'})
  + text(1060, 600, 'TO THE CLIENT', {size: 12, ls: 2, anchor: 'middle', fill: EARTH})
  + text(1450, 600, 'TO THE AGENCY', {size: 12, ls: 2, anchor: 'middle', fill: EARTH})
  + text(1255, 856, 'Priced lines', {size: 24, italic: true, anchor: 'middle'})
  + capRight('Both sides of the placement, from the same lines.'),
  6)});

/* VII — exports */
{
  const files = ['Sales', 'Purchase', 'Payroll', 'Umbrella', 'BACS'];
  let g = rect(1010, 360, 490, 56, {fill: '#fbf7ee'}), lab = text(1255, 396, 'Approved and issued items', {size: 22, italic: true, anchor: 'middle'});
  files.forEach((f, i) => {
    const x = 990 + i * 112;
    g += sheet(x, 500, 86, 108, 3, {top: 58, fill: i === 4 ? '#efd9bb' : '#fbf7ee'}) + arrow(1255 + (x + 43 - 1255) * .35, 420, x + 43, 492, {sw: 1.6});
    lab += text(x + 43, 538, f, {size: 19, italic: true, anchor: 'middle'});
  });
  g += padlock(1255, 700, 1.3);
  lab += text(1255, 790, 'Stored encrypted, with its SHA-256', {size: 21, italic: true, anchor: 'middle'})
    + text(1255, 820, 'a download that no longer matches is refused', {size: 17, anchor: 'middle', fill: SOFT});
  SPREADS.push({file: 'exports.svg', svg: book(
    chapter('VII', 'Exports and payments, never twice',
      'Finance gets files for its own ledgers: sales, purchase, payroll and umbrella, plus a BACS file of the self-bills due. Each item can sit on one live export only, and every file is kept encrypted with its checksum.',
      ['Nominal codes by cost code, site or client', 'Bank details sealed, and only ever shown masked', 'A mistaken export can be reverted within 7 days'])
    + wash(1255, 560, 290, 120, WASH.sage, .35) + wash(1255, 720, 80, 70, WASH.ochre, .5)
    + ink(g) + lab + capRight('Each item on one live export, never two.'),
    7)});
}

/* VIII — the audit trail and IR35 */
{
  const rows = [['08 Oct 09:14', 'Rate agreed over the cap', 'MSP'], ['08 Oct 09:02', 'Placement approved', 'Compliance'],
    ['07 Oct 16:40', 'Candidate shortlisted', 'Agency'], ['07 Oct 11:15', 'Request released, tier 1', 'System']];
  let g = '', lab = '';
  rows.forEach(([t, a, w], i) => {
    const y = 380 + i * 66;
    g += rect(960, y, 560, 52, {fill: '#fbf7ee', sw: 1.8}) + (i ? path(`M990 ${y - 14} V${y}`, {sw: 1.4}) : '');
    lab += text(980, y + 33, t, {size: 17, fill: SOFT}) + text(1100, y + 34, a, {size: 21, italic: true})
      + text(1500, y + 33, w.toUpperCase(), {size: 11, ls: 1.6, anchor: 'end', fill: EARTH});
  });
  g += padlock(1570, 410) + rect(1046, 690, 340, 140, {fill: '#efe5d3', sw: 1.4}) + rect(1032, 676, 340, 140, {fill: '#f6eee0', sw: 1.6})
    + rect(1018, 662, 340, 140, {fill: '#fbf7ee'});
  lab += caps(1040, 700, 'IR35 determination', {size: 13}) + text(1040, 742, 'Outside IR35', {size: 30, italic: true})
    + text(1040, 776, 'by the client · SDS on file · reason recorded', {size: 16, fill: SOFT})
    + text(1400, 750, 'amended,', {size: 19, italic: true, fill: EARTH}) + text(1400, 774, 'never overwritten', {size: 19, italic: true, fill: EARTH});
  SPREADS.push({file: 'audit.svg', svg: book(
    chapter('VIII', 'A record that cannot be rewritten',
      'Every change is written to an append-only audit trail that the application itself cannot edit or delete. IR35 determinations are kept the same way: each engagement’s status, who decided it and why, with the SDS on file.',
      ['Audit rows protected at the database', 'Determinations amended, never overwritten', 'Data subject requests handled in the record'])
    + wash(1240, 480, 300, 130, WASH.blue, .25) + wash(1190, 740, 200, 80, WASH.ochre, .35)
    + ink(g) + lab + capRight('Who changed what, and when, for as long as it matters.'),
    8)});
}

for (const s of SPREADS) writeFileSync(join(ROOT, 'spreads', s.file), s.svg);
console.log(SPREADS.map(s => s.file).join('\n'));
