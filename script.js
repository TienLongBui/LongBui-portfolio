const reveals = document.querySelectorAll('.reveal');

function revealOnScroll() {
  const triggerBottom = window.innerHeight * 0.88;

  reveals.forEach((element) => {
    const boxTop = element.getBoundingClientRect().top;

    if (boxTop < triggerBottom) {
      element.classList.add('active');
    }
  });
}

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

const toggleButton = document.getElementById('toggleExplorations');
const hiddenExplorations = document.querySelectorAll('.exploration-hidden');

if (toggleButton) {
  toggleButton.addEventListener('click', () => {
    const isExpanded = toggleButton.dataset.expanded === 'true';

    hiddenExplorations.forEach((card) => {
      card.classList.toggle('show', !isExpanded);
    });

    toggleButton.dataset.expanded = (!isExpanded).toString();
    toggleButton.textContent = isExpanded ? 'Show More' : 'Show Less';
  });
}

// Hero modal with tabs
const heroImage = document.getElementById('heroImage');
const heroModal = document.getElementById('heroModal');

function openHeroModal() {
  heroModal.classList.add('open');
  heroModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeHeroModal() {
  heroModal.classList.remove('open');
  heroModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

if (heroImage && heroModal) {
  heroImage.addEventListener('click', openHeroModal);
  heroImage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openHeroModal();
    }
  });

  // Close on backdrop or X click
  heroModal.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', closeHeroModal);
  });

  // Close on Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && heroModal.classList.contains('open')) {
      closeHeroModal();
    }
  });

  // Tab switching
  const tabs = heroModal.querySelectorAll('.hero-tab');
  const panels = heroModal.querySelectorAll('.hero-tab-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        panel.classList.toggle('active', panel.dataset.panel === target);
      });
    });
  });
}