(() => {
  const audio = document.querySelector('audio');
  const bar = document.querySelector('.bar');
  const pp = bar.querySelector('.pp');
  const title = bar.querySelector('.now b');
  const sub = bar.querySelector('.now span');
  const seek = bar.querySelector('.seek');
  const fill = seek.firstElementChild;
  let cur = null;

  const clean = (t) => t.replace(/^SVV\d+\s+[^-]+-\s*/, '');
  const mark = () => {
    document.querySelectorAll('[data-src]').forEach((b) => b.classList.toggle('on', !audio.paused && b.dataset.src === cur));
    pp.textContent = audio.paused ? '▶' : '❚❚';
    pp.setAttribute('aria-label', audio.paused ? 'Play' : 'Pause');
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-src]');
    if (b && b.dataset.src) {
      if (cur === b.dataset.src) { audio.paused ? audio.play() : audio.pause(); return; }
      cur = b.dataset.src;
      audio.src = cur;
      audio.play();
      title.textContent = clean(b.dataset.t || '');
      sub.textContent = b.dataset.p || '';
      bar.hidden = false;
      return;
    }
    const t = e.target.closest('.list-t');
    if (t) {
      const l = document.getElementById(t.getAttribute('aria-controls'));
      const open = l.hidden;
      l.hidden = !open;
      t.setAttribute('aria-expanded', String(open));
    }
  });

  pp.addEventListener('click', () => (audio.paused ? audio.play() : audio.pause()));
  seek.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const r = seek.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });
  audio.addEventListener('timeupdate', () => { fill.style.width = (audio.duration ? (audio.currentTime / audio.duration) * 100 : 0) + '%'; });
  ['play', 'pause', 'ended'].forEach((ev) => audio.addEventListener(ev, mark));
  audio.addEventListener('ended', () => {
    const rows = [...document.querySelectorAll('.row')];
    const i = rows.findIndex((r) => r.dataset.src === cur);
    if (i >= 0 && rows[i + 1] && rows[i + 1].closest('.pack') === rows[i].closest('.pack')) rows[i + 1].click();
  });
})();
