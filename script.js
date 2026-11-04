if (/^#(?:invite_token|recovery_token|confirmation_token|email_change_token)=/.test(location.hash)) {
  location.replace('ambassadrice.html' + location.hash);
}

const toggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileNav.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Ouvrir le menu');
}));

const presentationVideo = document.querySelector('.presentation-media video');
const presentationCaptions = document.querySelector('.presentation-media track[kind="subtitles"]');
if (presentationCaptions) {
  const restoreCaptions = async () => {
    try {
      const response = await fetch(presentationCaptions.getAttribute('src'));
      if (!response.ok) return;
      const captions = await response.text();
      presentationCaptions.src = URL.createObjectURL(new Blob([captions], { type: 'text/vtt' }));
    } catch { /* La vidéo reste disponible si les sous-titres ne chargent pas. */ }
  };
  presentationCaptions.addEventListener('error', restoreCaptions, { once: true });
  if (presentationCaptions.readyState === 3) restoreCaptions();
}
if (presentationVideo && 'IntersectionObserver' in window) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let videoVisible = false;
  const syncVideo = () => {
    if (videoVisible && !document.hidden && !reducedMotion.matches && !presentationVideo.ended) {
      presentationVideo.play().catch(() => {});
    } else {
      presentationVideo.pause();
    }
  };
  new IntersectionObserver(entries => {
    videoVisible = entries[0].isIntersecting;
    syncVideo();
  }, { threshold: 0.45 }).observe(presentationVideo);
  document.addEventListener('visibilitychange', syncVideo);
  reducedMotion.addEventListener('change', syncVideo);
}

const destinationTrack = document.querySelector('[data-destination-carousel]');
if (destinationTrack) {
  const cards = [...destinationTrack.querySelectorAll('.travel-card')];
  const previous = document.querySelector('[data-carousel-prev]');
  const next = document.querySelector('[data-carousel-next]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer;
  let visible = false;
  let paused = false;

  const stop = () => {
    window.clearInterval(timer);
    timer = undefined;
  };
  const start = () => {
    stop();
    if (visible && !paused && !reducedMotion.matches && !document.hidden) {
      timer = window.setInterval(() => move(1), 5500);
    }
  };
  const move = direction => {
    const max = destinationTrack.scrollWidth - destinationTrack.clientWidth;
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : destinationTrack.clientWidth;
    const position = destinationTrack.scrollLeft;
    const target = direction > 0
      ? (position >= max - 4 ? 0 : Math.min(position + step, max))
      : (position <= 4 ? max : Math.max(position - step, 0));
    destinationTrack.scrollTo({ left: target, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  };

  previous.addEventListener('click', () => { move(-1); start(); });
  next.addEventListener('click', () => { move(1); start(); });
  destinationTrack.addEventListener('pointerenter', () => { paused = true; stop(); });
  destinationTrack.addEventListener('pointerleave', () => { paused = false; start(); });
  destinationTrack.addEventListener('focusin', () => { paused = true; stop(); });
  destinationTrack.addEventListener('focusout', () => {
    window.requestAnimationFrame(() => {
      if (!destinationTrack.contains(document.activeElement)) { paused = false; start(); }
    });
  });
  document.addEventListener('visibilitychange', start);
  reducedMotion.addEventListener('change', start);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    start();
  }, { threshold: 0.2 }).observe(destinationTrack);

  cards.forEach(card => {
    card.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
      card.classList.add('is-tilting');
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--ry');
      card.style.removeProperty('--rx');
      card.classList.remove('is-tilting');
    });
  });
}
