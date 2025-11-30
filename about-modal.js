// about-modal.js — simple, robust modal logic (keyboard accessible)
document.addEventListener('DOMContentLoaded', () => {
  const aboutLink = document.getElementById('about-link');
  const aboutModal = document.getElementById('about-modal');
  const closeAbout = document.getElementById('close-about');

  if (!aboutLink || !aboutModal) {
    console.warn('About modal elements missing.');
    return;
  }

  function openModal() {
    aboutModal.style.display = 'block';
    aboutModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // focus the close button for easier keyboard dismissal
    if (closeAbout) closeAbout.focus();
  }

  function closeModal() {
    aboutModal.style.display = 'none';
    aboutModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    aboutLink.focus();
  }

  aboutLink.addEventListener('click', openModal);
  aboutLink.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });

  if (closeAbout) {
    closeAbout.addEventListener('click', closeModal);
  }

  // click outside to close
  window.addEventListener('click', (e) => {
    if (e.target === aboutModal) closeModal();
  });

  // escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutModal.style.display === 'block') {
      closeModal();
    }
  });
});
