(() => {
  const root = document.documentElement;
  const mobile = Boolean(document.querySelector('[data-pencil-id="zARvK"]'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const seating = document.querySelector('[data-pencil-name="Seat transition / pull out"]');
  const chairs = document.querySelectorAll('[data-pencil-name="Pull-out chair / downward"]');
  let staticMode = false;
  let pendingFrame = 0;
  const stopped = () => mobile || reduced.matches || staticMode;

  const controls = document.createElement('aside');
  controls.className = 'preview-controls';
  controls.setAttribute('aria-label', 'デザインプレビュー操作');
  controls.innerHTML = `<p>動きの試作・サイト内リンク未接続</p><button type="button" data-replay>冒頭に戻る</button><button type="button" data-static aria-pressed="false">静止表示</button><a href="${mobile ? 'desktop' : 'mobile'}.html">${mobile ? 'Desktop' : 'Mobile'}</a><span role="status" aria-live="polite"></span>`;
  document.body.append(controls);
  const replay = controls.querySelector('[data-replay]');
  const toggle = controls.querySelector('[data-static]');
  const status = controls.querySelector('[role="status"]');

  function updateSeats() {
    pendingFrame = 0;
    if (!seating || document.hidden) return;
    chairs.forEach(chair => { chair.style.top = `${seating.offsetTop + seating.offsetHeight - 123}px`; });
    if (stopped()) {
      root.style.setProperty('--seat-offset', '-60px');
      return;
    }
    // Read the table edge, not the moving chair: pulling cannot feed back into progress.
    const edge = seating.getBoundingClientRect().bottom;
    const trigger = Math.min(innerHeight * .88, edge + scrollY);
    const progress = Math.max(0, Math.min(1, (trigger - edge) / (innerHeight * .35)));
    const eased = progress * progress * (3 - 2 * progress);
    root.style.setProperty('--seat-offset', `${-60 * eased}px`);
  }
  function scheduleSeats() {
    if (!pendingFrame && !document.hidden) pendingFrame = requestAnimationFrame(updateSeats);
  }
  function fit() {
    root.style.setProperty('--preview-scale', Math.min(1, innerWidth / (mobile ? 390 : 1440)));
    scheduleSeats();
  }
  function play() {
    root.classList.remove('motion');
    replay.disabled = stopped();
    toggle.disabled = mobile || reduced.matches;
    toggle.setAttribute('aria-pressed', String(stopped()));
    status.textContent = mobile ? 'モバイル：引き出した静止構図' : reduced.matches ? '動きを減らす設定を適用中' : staticMode ? '静止表示中' : '下向きの椅子を上へ60px引き出す';
    if (!stopped()) { void document.body.offsetWidth; root.classList.add('motion'); }
    scheduleSeats();
  }

  document.querySelectorAll('[data-pencil-name^="Line study /"]').forEach(el => {
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('data-line-art', '');
    el.querySelectorAll('path[stroke]').forEach(path => path.setAttribute('pathLength', '1'));
  });
  document.querySelectorAll('[data-pencil-name^="Pull-out chair /"]').forEach(el => {
    el.setAttribute('aria-hidden', 'true');
    if (!mobile) el.setAttribute('data-scroll-chair', '');
  });
  document.querySelectorAll('[data-pencil-name="Cup / decorative list marker"]').forEach(el => el.setAttribute('aria-hidden', 'true'));

  replay.addEventListener('click', () => { scrollTo({ top: 0, behavior: 'instant' }); play(); });
  toggle.addEventListener('click', () => { staticMode = !staticMode; play(); });
  reduced.addEventListener('change', play);
  addEventListener('scroll', scheduleSeats, { passive: true });
  addEventListener('resize', fit, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && pendingFrame) { cancelAnimationFrame(pendingFrame); pendingFrame = 0; }
    else scheduleSeats();
  });
  document.fonts?.ready.then(scheduleSeats);
  fit();
  play();
})();
