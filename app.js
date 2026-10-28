// Undo/Redo editor. Uses the Stack class from stack.js.
const undoStack = new Stack();
const redoStack = new Stack();
let doc = '', nextId = 1, totalEdits = 0, locked = false;

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cut = (s, n) => s.length > n ? s.slice(0, n) + '...' : s;

/* ---------- UI helpers ---------- */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 2900);
}

function log(kind, msg) {
  const ul = $('log');
  if (ul.querySelector('.none')) ul.innerHTML = '';
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  ul.insertAdjacentHTML('afterbegin',
    `<li><span class="tag t-${kind.toLowerCase()}">${kind}</span>${esc(msg)}<span class="time">${time}</span></li>`);
  while (ul.children.length > 50) ul.lastChild.remove();
}

function setNum(id, value) {
  const el = $(id), card = el.parentElement;
  const from = parseInt(el.textContent, 10) || 0;
  if (from === value) { el.textContent = value; return; }
  card.classList.remove('bump'); void card.offsetWidth; card.classList.add('bump');
  const start = performance.now();
  (function step(now) {
    const p = Math.min(1, (now - start) / 350);
    el.textContent = Math.round(from + (value - from) * p);
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

/* ---------- rendering ---------- */
function drawStack(el, stack, newId, emptyMsg) {
  const items = stack.toArray();                       // top first
  el.innerHTML = items.length
    ? items.map((e, i) =>
        `<div class="card${i === 0 ? ' top' : ''}${e.id === newId ? ' enter' : ''}">
           <b>#${e.id}</b>${esc(e.label)}<small>${e.after ? '"' + esc(cut(e.after, 28)) + '"' : '(empty text)'}</small></div>`).join('')
    : `<div class="empty">${emptyMsg}</div>`;
}

function updateButtons() {
  $('undoBtn').disabled = locked || undoStack.isEmpty();
  $('redoBtn').disabled = locked || redoStack.isEmpty();
  $('peek').disabled = undoStack.isEmpty();
  ['add', 'delword', 'upper', 'clearall', 'sample'].forEach(id => $(id).disabled = locked);
  $('reset').disabled = locked;
}

function render(newUndoId, newRedoId) {
  $('doc').innerHTML = doc ? esc(doc) : '<span class="ph">The document is empty. Add some text.</span>';
  drawStack($('undoList'), undoStack, newUndoId, 'Undo stack is empty');
  drawStack($('redoList'), redoStack, newRedoId, 'Redo stack is empty');
  setNum('sUndo', undoStack.size);
  setNum('sRedo', redoStack.size);
  setNum('sTotal', totalEdits);
  setNum('sChars', doc.length);
  updateButtons();
}

function flashDoc() {
  const p = $('page'); p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash');
}

/* ---------- stack operations ---------- */
// A new edit: push onto the undo stack and empty the redo stack
function perform(label, after) {
  if (locked) return false;
  if (after === doc) { toast('That edit would not change the text.'); return false; }
  const edit = { id: nextId++, label, before: doc, after };
  undoStack.push(edit);
  if (!redoStack.isEmpty()) {
    log('CLEAR', `New edit made, so the redo stack was emptied (${redoStack.size} removed)`);
    redoStack.clear();
  }
  doc = after; totalEdits++;
  log('PUSH', `#${edit.id} "${label}" pushed onto the undo stack`);
  flashDoc(); render(edit.id);
  return true;
}

async function undo() {
  if (locked || undoStack.isEmpty()) return;
  locked = true; updateButtons();
  const top = $('undoList').querySelector('.card.top');
  if (top) top.classList.add('leave');
  await sleep(300);
  const edit = undoStack.pop();
  doc = edit.before;
  redoStack.push(edit);
  log('POP', `#${edit.id} "${edit.label}" popped from the undo stack`);
  log('PUSH', `#${edit.id} pushed onto the redo stack`);
  locked = false; flashDoc(); render(null, edit.id);
}

async function redo() {
  if (locked || redoStack.isEmpty()) return;
  locked = true; updateButtons();
  const top = $('redoList').querySelector('.card.top');
  if (top) top.classList.add('leave');
  await sleep(300);
  const edit = redoStack.pop();
  doc = edit.after;
  undoStack.push(edit);
  log('POP', `#${edit.id} "${edit.label}" popped from the redo stack`);
  log('PUSH', `#${edit.id} pushed back onto the undo stack`);
  locked = false; flashDoc(); render(edit.id);
}

function peek() {
  const edit = undoStack.peek();
  if (!edit) return;
  const el = $('undoList').querySelector('.card.top');
  if (el) { el.classList.remove('peek', 'enter'); void el.offsetWidth; el.classList.add('peek'); }
  log('PEEK', `Top of undo stack is #${edit.id} "${edit.label}" (not removed)`);
  toast(`Peek: #${edit.id} "${edit.label}" is on top`);
}

function resetAll() {
  undoStack.clear(); redoStack.clear(); doc = ''; totalEdits = 0;
  log('INFO', 'Everything reset'); render();
}

async function loadSamples() {
  for (const w of ['Stacks', 'are', 'last-in,', 'first-out']) {
    perform(`Add "${w}"`, doc + (doc ? ' ' : '') + w);
    await sleep(450);
  }
  toast('Samples added. Try Undo to pop them one by one.');
}

/* ---------- events ---------- */
function addText() {
  const t = $('txt'), v = t.value.trim();
  t.classList.remove('bad');
  if (!v) { t.classList.add('bad'); $('err').textContent = 'Type some text to add.'; return; }
  $('err').textContent = '';
  if (perform(`Add "${cut(v, 14)}"`, doc + (doc && !/\s$/.test(doc) ? ' ' : '') + v)) { t.value = ''; t.focus(); }
}

$('add').onclick = addText;
$('txt').addEventListener('keydown', e => { if (e.key === 'Enter') addText(); });
$('delword').onclick = () => doc ? perform('Delete last word', doc.replace(/\s*\S+\s*$/, '')) : toast('Nothing to delete.');
$('upper').onclick = () => perform('UPPERCASE', doc.toUpperCase());
$('clearall').onclick = () => perform('Clear text', '');
$('sample').onclick = loadSamples;
$('undoBtn').onclick = undo;
$('redoBtn').onclick = redo;
$('peek').onclick = peek;
$('reset').onclick = resetAll;
document.addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
});

render();
