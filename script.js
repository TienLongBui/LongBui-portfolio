// ===== Reveal on scroll =====
const reveals = document.querySelectorAll('.reveal');

function revealOnScroll() {
  const triggerBottom = window.innerHeight * 0.88;
  reveals.forEach((el) => {
    if (el.getBoundingClientRect().top < triggerBottom) {
      el.classList.add('active');
    }
  });
}

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// ===== Explorations toggle =====
const toggleButton = document.getElementById('toggleExplorations');
const hiddenExplorations = document.querySelectorAll('.exploration-hidden');

if (toggleButton) {
  toggleButton.addEventListener('click', () => {
    const isExpanded = toggleButton.dataset.expanded === 'true';
    hiddenExplorations.forEach((card) => card.classList.toggle('show', !isExpanded));
    toggleButton.dataset.expanded = (!isExpanded).toString();
    toggleButton.textContent = isExpanded ? 'Show More' : 'Show Less';
  });
}

// ===== Hero modal =====
const heroImage = document.getElementById('heroImage');
const heroModal = document.getElementById('heroModal');

function openHeroModal()  { heroModal.classList.add('open');    heroModal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open'); }
function closeHeroModal() { heroModal.classList.remove('open'); heroModal.setAttribute('aria-hidden','true');  document.body.classList.remove('modal-open'); }

if (heroImage && heroModal) {
  heroImage.addEventListener('click', openHeroModal);
  heroImage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHeroModal(); }
  });

  heroModal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeHeroModal));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && heroModal.classList.contains('open')) closeHeroModal();
  });

  const tabs   = heroModal.querySelectorAll('.hero-tab');
  const panels = heroModal.querySelectorAll('.hero-tab-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t)   => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
      panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === target));
    });
  });
}

// ===== Staggered card reveal (Explorations) =====
(function () {
  const grids = document.querySelectorAll('.projects-container');
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('projects-stagger');
        staggerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  grids.forEach((grid) => staggerObserver.observe(grid));
})();

// ===== Featured Projects — Infinite Peek Carousel =====
(function () {
  const track = document.querySelector('.carousel-track');
  if (!track) return;

  const viewport        = track.parentElement; // .carousel-viewport
  const prevBtn         = document.querySelector('.carousel-prev');
  const nextBtn         = document.querySelector('.carousel-next');
  const dotsContainer   = document.querySelector('.carousel-dots');

  // Store original items before any cloning
  const originalItems   = Array.from(track.children);
  const N               = originalItems.length; // real item count

  let currentIndex  = 0;   // index in the cloned track
  let isInfinite    = false;
  let autoplayTimer = null;

  /* ---- Responsive helpers ---- */
  function getVisibleCount() {
    if (window.innerWidth <= 560) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function getRealIndex() {
    // Map currentIndex → 0…N-1 regardless of clone offset
    if (!isInfinite) return currentIndex;
    return ((currentIndex - N) % N + N) % N;
  }

  /* ---- Clone setup for infinite loop ----
     Layout after cloning: [copy of originals] [originals] [copy of originals]
     Total items = 3 × N
     Start at index N (first real item)
  */
  function setupClones() {
    // Remove previous clones
    track.querySelectorAll('[data-clone]').forEach(el => el.remove());

    const vis = getVisibleCount();

    if (N <= vis) {
      isInfinite = false;
      currentIndex = 0;
      return;
    }

    isInfinite = true;

    // Append clones (go after originals)
    originalItems.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('data-clone', 'after');
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    // Prepend clones (go before originals)
    [...originalItems].reverse().forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('data-clone', 'before');
      clone.setAttribute('aria-hidden', 'true');
      track.insertBefore(clone, track.firstChild);
    });

    // Position at first real item (offset by N prepended clones)
    currentIndex = N;
    goTo(currentIndex, false);
  }

  /* ---- Dots ---- */
  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';

    const vis       = getVisibleCount();
    const pageCount = Math.max(0, N - vis); // number of "steps" possible

    if (pageCount === 0 && !isInfinite) {
      dotsContainer.style.display = 'none';
      return;
    }

    // One dot per original item (simpler & always correct for infinite)
    dotsContainer.style.display = 'flex';
    for (let i = 0; i < N; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', 'Go to project ' + (i + 1));
      dot.addEventListener('click', () => {
        stopAutoplay();
        const targetIndex = isInfinite ? N + i : i;
        goTo(targetIndex);
      });
      dotsContainer.appendChild(dot);
    }
    updateDots();
  }

  function updateDots() {
    if (!dotsContainer) return;
    const ri   = getRealIndex();
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === ri));
  }

  /* ---- Core goTo ---- */
  function goTo(index, animate = true) {
    // Set / remove transition
    track.style.transition = animate
      ? 'transform 0.58s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'none';

    currentIndex = index;

    // Gap = 24px (1.5rem). Item width comes from the rendered element.
    const gap       = 24;
    const itemWidth = track.children[0].offsetWidth + gap;
    track.style.transform = `translateX(${-(currentIndex * itemWidth)}px)`;

    if (!animate) {
      // Force reflow so the instant jump registers before any next transition
      track.getBoundingClientRect();
    }

    updateDots();

    // Button visibility (always enabled for infinite; disabled at edges for finite)
    if (!isInfinite) {
      const max = N - getVisibleCount();
      if (prevBtn) prevBtn.disabled = currentIndex <= 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= max;
    } else {
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    }
  }

  /* ---- Infinite loop jump (called after CSS transition ends) ---- */
  track.addEventListener('transitionend', () => {
    if (!isInfinite) return;

    if (currentIndex >= N * 2) {
      // Slid into the "after" clone zone — jump back to real equivalent
      goTo(currentIndex - N, false);
    } else if (currentIndex < N) {
      // Slid into the "before" clone zone — jump forward to real equivalent
      goTo(currentIndex + N, false);
    }
  });

  /* ---- Autoplay ---- */
  function startAutoplay() {
    if (!isInfinite && N <= getVisibleCount()) return; // nothing to scroll
    stopAutoplay();
    autoplayTimer = setInterval(() => goTo(currentIndex + 1), 3000);
  }

  function stopAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  /* ---- Button listeners ---- */
  if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoplay(); goTo(currentIndex - 1); });
  if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoplay(); goTo(currentIndex + 1); });

  /* ---- Pause on hover ---- */
  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', () => { if (!autoplayTimer) startAutoplay(); });

  /* ---- Touch / swipe ---- */
  let touchStartX = 0;
  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    stopAutoplay();
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
    startAutoplay();
  }, { passive: true });

  /* ---- Init & resize ---- */
  function init() {
    // Clamp currentIndex before rebuild
    currentIndex = 0;
    setupClones();
    buildDots();
    if (!isInfinite) goTo(0, false);
    startAutoplay();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    stopAutoplay();
    resizeTimer = setTimeout(init, 160);
  });

  init();
})();
