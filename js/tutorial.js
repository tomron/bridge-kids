// ── Tutorial wizard ───────────────────────────────────────────────────────────
const TUTORIAL_KEY = 'bridge-kids-tutorial-done';
const TOTAL_SLIDES = 4;

let currentSlide = 0;
let goingBack = false;

function showTutorial() {
  currentSlide = 0;
  goingBack = false;
  updateTutorialSlide();
  document.getElementById('tutorial-overlay').classList.remove('hidden');
}

function hideTutorial() {
  document.getElementById('tutorial-overlay').classList.add('hidden');
}

function completeTutorial() {
  localStorage.setItem(TUTORIAL_KEY, '1');
  hideTutorial();
}

function goToSlide(index, back = false) {
  const slides = document.querySelectorAll('.tutorial-slide');
  slides[currentSlide].classList.add('hidden');
  currentSlide = index;
  goingBack = back;
  updateTutorialSlide();
}

function updateTutorialSlide() {
  const slides = document.querySelectorAll('.tutorial-slide');

  slides.forEach((s, i) => {
    s.classList.toggle('hidden', i !== currentSlide);
    s.classList.remove('going-back');
  });

  const activeSlide = slides[currentSlide];
  if (goingBack) activeSlide.classList.add('going-back');

  // Update dots
  document.querySelectorAll('.tut-dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentSlide);
  });

  // Update nav buttons
  const prevBtn = document.getElementById('tut-prev');
  const nextBtn = document.getElementById('tut-next');
  const doneBtn = document.getElementById('tut-done');

  prevBtn.disabled = currentSlide === 0;

  const isLast = currentSlide === TOTAL_SLIDES - 1;
  nextBtn.classList.toggle('hidden', isLast);
  doneBtn.classList.toggle('hidden', !isLast);
}

function initTutorial() {
  // Auto-show on first visit
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    setTimeout(showTutorial, 500);
  }

  // Skip button
  document.getElementById('tutorial-skip').addEventListener('click', completeTutorial);

  // Done button
  document.getElementById('tut-done').addEventListener('click', () => {
    completeTutorial();
    dispatch({ type: 'NEW_GAME' });
  });

  // Next / Prev
  document.getElementById('tut-next').addEventListener('click', () => {
    if (currentSlide < TOTAL_SLIDES - 1) goToSlide(currentSlide + 1, false);
  });

  document.getElementById('tut-prev').addEventListener('click', () => {
    if (currentSlide > 0) goToSlide(currentSlide - 1, true);
  });

  // Dot navigation
  document.querySelectorAll('.tut-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.dot, 10);
      if (target !== currentSlide) goToSlide(target, target < currentSlide);
    });
  });

  // Keyboard navigation (arrow keys only, no Escape)
  document.addEventListener('keydown', e => {
    if (document.getElementById('tutorial-overlay').classList.contains('hidden')) return;
    if (e.key === 'ArrowRight' && currentSlide < TOTAL_SLIDES - 1) goToSlide(currentSlide + 1, false);
    if (e.key === 'ArrowLeft' && currentSlide > 0) goToSlide(currentSlide - 1, true);
  });

  // Clicking the backdrop does NOT close (intentional for kids)
}
