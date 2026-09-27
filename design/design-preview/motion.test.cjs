const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const source = readFileSync(join(__dirname, 'motion.js'), 'utf8');

function setup({ mobile = false, reduce = false } = {}) {
  const listeners = {};
  const queue = new Map();
  let serial = 0;
  function element() {
    return { style: { values: {}, setProperty(k, v) { this.values[k] = v; } },
      setAttribute() {}, addEventListener(k, fn) { this[k] = fn; } };
  }
  const root = element();
  root.classList = { add() {}, remove() {} };
  const seat = element();
  seat.top = 880;
  seat.getBoundingClientRect = () => ({ bottom: seat.top });
  const replay = element(), toggle = element(), status = element();
  const controls = element();
  controls.querySelector = s => s === '[data-replay]' ? replay : s === '[data-static]' ? toggle : status;
  const reduced = { matches: reduce, addEventListener(_, fn) { this.change = fn; } };
  const document = { hidden: false, documentElement: root, body: { append() {}, offsetWidth: 1440 },
    createElement: () => controls, querySelectorAll: () => [],
    querySelector: s => s.includes('zARvK') ? (mobile ? {} : null) : (mobile ? null : seat),
    addEventListener(k, fn) { listeners[k] = fn; } };
  const context = { document, matchMedia: () => reduced, innerWidth: mobile ? 390 : 1440,
    innerHeight: 1000, get scrollY() { return 880 - seat.top; }, addEventListener(k, fn) { listeners[k] = fn; },
    requestAnimationFrame(fn) { queue.set(++serial, fn); return serial; },
    cancelAnimationFrame(id) { queue.delete(id); } };
  runInNewContext(source, context);
  const flush = () => { const jobs = [...queue.values()]; queue.clear(); jobs.forEach(fn => fn()); };
  flush();
  return { root, seat, toggle, replay, reduced, listeners, document, queue, flush };
}

test('downward-facing chairs pull upward 60px, including reverse scroll', () => {
  const s = setup();
  assert.equal(s.root.style.values['--seat-offset'], '0px');
  s.seat.top = 705; s.listeners.scroll(); s.flush();
  assert.equal(s.root.style.values['--seat-offset'], '-30px');
  s.seat.top = 530; s.listeners.scroll(); s.flush();
  assert.equal(s.root.style.values['--seat-offset'], '-60px');
  s.seat.top = 1000; s.listeners.scroll(); s.flush();
  assert.equal(s.root.style.values['--seat-offset'], '0px');
});
test('half the seat is initially below the tabletop; pulling reveals all of it', () => {
  const bottom = -123 + (160 - 30.9142) * 1.375;
  const height = 79.5238 * 1.375;
  assert.ok(bottom / height > .45 && bottom / height < .55);
  assert.ok(bottom - 60 < 0);
});
test('reduced motion and static controls show the pulled-out pose', () => {
  const s = setup({ reduce: true });
  assert.equal(s.root.style.values['--seat-offset'], '-60px');
  assert.equal(s.replay.disabled, true);
  s.reduced.matches = false; s.reduced.change(); s.flush();
  assert.equal(s.root.style.values['--seat-offset'], '0px');
  s.toggle.click(); s.flush();
  assert.equal(s.root.style.values['--seat-offset'], '-60px');
});
test('scroll work is coalesced, and paused while hidden', () => {
  const s = setup();
  s.listeners.scroll(); s.listeners.scroll(); s.listeners.scroll();
  assert.equal(s.queue.size, 1);
  s.document.hidden = true; s.listeners.visibilitychange();
  assert.equal(s.queue.size, 0);
  s.listeners.scroll(); assert.equal(s.queue.size, 0);
});
test('mobile uses the static composition', () => {
  const s = setup({ mobile: true });
  assert.equal(s.replay.disabled, true);
  assert.equal(s.toggle.disabled, true);
});
