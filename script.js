
// Obtain the current user identifier from localStorage.  If there
// isn't a logged in user this function returns null.  This helper
// centralises the key name in case it changes in future.
function getCurrentUser() {
  return localStorage.getItem('currentUser');
}

// Immediately redirect unauthenticated visitors to the login page.
// This guard runs on page load for every page except login.html.
function ensureLoggedIn() {
  const page = window.location.pathname.split('/').pop();
  if (page !== 'login.html' && !getCurrentUser()) {
    window.location.href = 'login.html';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Prevent access without authentication.
  ensureLoggedIn();

  // Show progress when the page loads.
  updateProgressBar();

  // Attach event listener to any quiz form found on the page.  When
  // the form is submitted the answers are graded, the unit is
  // marked complete for this user, and the result is optionally
  // submitted to a Google Apps Script.
  const quizForm = document.querySelector('.quiz-form');
  if (quizForm) {
    quizForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const unit = quizForm.dataset.unit;
      const answers = quizAnswers[unit] || {};
      let total = 0;
      let correct = 0;
      for (const q in answers) {
        total++;
        const selected = quizForm.querySelector(`input[name="${q}"]:checked`);
        if (selected && selected.value === answers[q]) {
          correct++;
        }
      }
      alert(`You scored ${correct} out of ${total}.`);
      const user = getCurrentUser();
      if (user) {
        // Record completion status keyed by user and unit.  Storing
        // strings "true"/"false" allows consistent retrieval with
        // localStorage API.
        localStorage.setItem(`${user}_unit${unit}_complete`, 'true');
      }
      updateProgressBar();
      // Submit the quiz result to a Google Apps Script for central
      // storage.  Replace the placeholder URL below with your
      // actual deployment.  Without a configured URL the
      // submission is skipped.
      const QUIZ_RESULTS_SCRIPT_URL = '';
      if (QUIZ_RESULTS_SCRIPT_URL && QUIZ_RESULTS_SCRIPT_URL.startsWith('https://') && user) {
        const payload = {
          user: user,
          unit: unit,
          type: 'main',
          score: correct,
          total: total,
          timestamp: new Date().toISOString()
        };
        fetch(QUIZ_RESULTS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => {
          // Optionally handle success/failure here
        }).catch(err => {
          console.error('Error submitting quiz result', err);
        });
      }
    });
  }

  // Set up submission handling for advanced theory forms.  These
  // forms allow students to type answers to open‑ended questions.  The
  // responses are sent to a Google Apps Script for storage in a
  // Google Sheet.  Replace the placeholder URL below with your
  // actual script URL when deploying.
  const ADVANCED_RESPONSES_SCRIPT_URL = '';
  const advancedForms = document.querySelectorAll('.advanced-form');
  advancedForms.forEach(form => {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const user = getCurrentUser();
      const payload = { unit: form.dataset.unit, user: user || 'anonymous' };
      // Gather all textarea responses
      form.querySelectorAll('textarea').forEach(textarea => {
        payload[textarea.name] = textarea.value;
      });
      // Send to Google Apps Script if configured
      if (ADVANCED_RESPONSES_SCRIPT_URL && ADVANCED_RESPONSES_SCRIPT_URL.startsWith('https://')) {
        fetch(ADVANCED_RESPONSES_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(response => {
            if (response.ok) {
              alert('Responses submitted successfully!');
              form.reset();
            } else {
              alert('There was an error submitting your responses.');
            }
          })
          .catch(error => {
            console.error(error);
            alert('There was an error submitting your responses.');
          });
      } else {
        console.log('Advanced form submission (test mode):', payload);
        alert('Responses recorded (test mode).');
        form.reset();
      }
    });
  });

  // Handle interactive scenario forms.  These forms collect a
  // mixture of input types (radio, checkbox, text, number, range
  // etc.) into a single object, then store it in localStorage
  // keyed by the current user and unit.  If a Google Apps Script
  // endpoint is provided the data is also sent for central
  // collection.
  const SCENARIO_SCRIPT_URL = '';
  const scenarioForms = document.querySelectorAll('.scenario-form');
  scenarioForms.forEach(form => {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const user = getCurrentUser();
      const unit = form.dataset.unit;
      const responses = {};
      Array.from(form.elements).forEach(el => {
        if (!el.name || el.disabled || el.type === 'submit') return;
        if (el.type === 'radio') {
          if (el.checked) responses[el.name] = el.value;
        } else if (el.type === 'checkbox') {
          if (!responses[el.name]) responses[el.name] = [];
          if (el.checked) responses[el.name].push(el.value);
        } else {
          responses[el.name] = el.value;
        }
      });
      // Persist responses locally for the current user.
      if (user) {
        localStorage.setItem(`${user}_scenario_unit${unit}`, JSON.stringify(responses));
      }
      // Send responses to Google Apps Script if configured.
      if (SCENARIO_SCRIPT_URL && SCENARIO_SCRIPT_URL.startsWith('https://') && user) {
        const payload = {
          user: user,
          unit: unit,
          type: 'scenario',
          responses: responses,
          timestamp: new Date().toISOString()
        };
        fetch(SCENARIO_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => {
          console.error('Error submitting scenario responses', err);
        });
      }
      alert('Scenario responses recorded.');
      // Optionally redirect back to the scenario list after submission
      // window.location.href = 'interactive_scenarios.html';
    });
  });

  // Insert a logout link into the navigation if the user is logged in.
  // This is done dynamically so we don't have to modify every HTML file.
  const nav = document.querySelector('nav');
  if (nav && getCurrentUser()) {
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.textContent = 'Logout';
    logoutLink.id = 'logout-link';
    nav.appendChild(logoutLink);
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      // Optionally also remove per‑user progress keys.  Keeping
      // progress in localStorage across logins allows multiple
      // students on the same device, but removing them would clear
      // previous students' data.
      window.location.href = 'login.html';
    });
  }

  // Initialise interactive scenario helpers after page load. These functions
  // enhance the new scenario questions (drag‑matching, sortable lists and
  // anagram puzzles). They will safely exit if no matching elements exist.
  initDragMatching();
  initSortableLists();
  initAnagramBuilders();

  // New interactive helpers for star ratings and selectable pill groups.
  // These are called on every page after the DOM loads.  They attach
  // click handlers to stars and pills to capture ratings and multiple
  // selections.  See the implementation below for details.
  initStarRatings();
  initSelectablePills();

  /*
   * Support quiz grading
   *
   * Some of the support theory pages include simple multiple-choice
   * quizzes that are embedded directly in the HTML.  Each radio
   * button has a data-correct attribute set to either "true" or
   * "false" indicating whether it is the right answer.  When the
   * user clicks the "Check Answers" button the submitSupportQuiz
   * function is called.  This helper walks through the parent
   * form, counts the number of questions and correct selections,
   * then displays the result in a message span.  It does not
   * submit any data externally; these support quizzes are purely
   * formative.
   */
  window.submitSupportQuiz = function (button) {
    // Find the parent form and message span
    const form = button.closest('form');
    const message = form.querySelector('.quiz-msg');
    // Guard against missing elements
    if (!form || !message) return;
    let total = 0;
    let correct = 0;
    // Each list item (<li>) represents a question
    form.querySelectorAll('ol > li').forEach(li => {
      total++;
      const trueInput = li.querySelector('input[data-correct="true"]');
      const selected = li.querySelector('input[type="radio"]:checked');
      if (trueInput && selected && trueInput === selected) {
        correct++;
      }
    });
    // Update the message span with the score
    message.textContent = `You scored ${correct} out of ${total}.`;
  };

  // Initialise the week carousel on the home page if present
  initWeeksCarousel();

  // Enable tap-to-flip on cards for touch devices
  initFlipCards();

  // Ensure support pages use the same page chrome as main theory pages
  applySupportPageChrome();
  // Insert contextual hint toggles for every week/topic page
  insertTopicHints();
  // Insert previous/next week navigation on unit pages
  insertWeekNav();
});

function updateProgressBar() {
  const totalUnits = 10;
  let completed = 0;
  const user = getCurrentUser();
  for (let i = 1; i <= totalUnits; i++) {
    const key = user ? `${user}_unit${i}_complete` : `unit${i}_complete`;
    if (localStorage.getItem(key) === 'true') {
      completed++;
    }
  }
  const bar = document.querySelector('.progress-bar');
  if (bar) {
    bar.style.width = (completed / totalUnits * 100) + '%';
  }
}

// Answers for each quiz. Keys correspond to unit numbers. Each entry is
// an object mapping question identifiers to the correct option letter.
const quizAnswers = {
  '1': {
    q1: 'C', q2: 'A', q3: 'B', q4: 'D', q5: 'A', q6: 'A', q7: 'A', q8: 'B', q9: 'B', q10: 'B'
  },
  '2': {
    q1: 'B', q2: 'B', q3: 'A', q4: 'B', q5: 'B', q6: 'B', q7: 'B', q8: 'A', q9: 'C', q10: 'B'
  },
  '3': {
    q1: 'A', q2: 'B', q3: 'A', q4: 'A', q5: 'A', q6: 'A', q7: 'A', q8: 'A', q9: 'A', q10: 'A'
  },
  '4': {
    q1: 'A', q2: 'A', q3: 'A', q4: 'A', q5: 'A', q6: 'A', q7: 'A', q8: 'D', q9: 'A', q10: 'D'
  },
  '5': {
    q1: 'B', q2: 'A', q3: 'A', q4: 'A', q5: 'A', q6: 'D', q7: 'A', q8: 'D', q9: 'A', q10: 'A'
  },
  '6': {
    q1: 'A', q2: 'A', q3: 'A', q4: 'A', q5: 'A', q6: 'A', q7: 'A', q8: 'A', q9: 'B', q10: 'A'
  },
  '7': {
    q1: 'A', q2: 'A', q3: 'A', q4: 'A', q5: 'A', q6: 'B', q7: 'A', q8: 'D', q9: 'A', q10: 'A'
  },
  '8': {
    q1: 'A', q2: 'A', q3: 'A', q4: 'B', q5: 'A', q6: 'A', q7: 'A', q8: 'A', q9: 'D', q10: 'A'
  },
  '9': {
    q1: 'A', q2: 'A', q3: 'A', q4: 'A', q5: 'A', q6: 'B', q7: 'A', q8: 'A', q9: 'A', q10: 'A'
  },
  '10': {
    q1: 'A', q2: 'A', q3: 'D', q4: 'A', q5: 'A', q6: 'A', q7: 'A', q8: 'A', q9: 'B', q10: 'A'
  }
};

// ====================
// Interactive helpers
//
// The functions below provide basic drag‑and‑drop matching, sortable
// list ordering and anagram puzzles.  These are used by the updated
// scenario pages to create more playful, game‑like questions.  They
// attach listeners at runtime and update hidden inputs so that
// responses are captured alongside other form values.

// Initialise drag‑and‑drop matching questions.  Any element with
// class="drag-item" should have a data-value attribute; drop
// targets use class="drop-target" and contain a hidden input to
// record the dropped value.  Each drop zone should also include
// an element with class="drop-label" whose text content will be
// updated when a value is dropped.  When an item is dropped on a
// target the hidden input’s value is set to the dragged item’s value.
function initDragMatching() {
  const drags = document.querySelectorAll('.drag-item');
  const drops = document.querySelectorAll('.drop-target');
  if (!drags.length || !drops.length) return;
  drags.forEach(item => {
    item.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.dataset.value || item.textContent.trim());
    });
  });
  drops.forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
    });
    zone.addEventListener('drop', e => {
      e.preventDefault();
      const val = e.dataTransfer.getData('text/plain');
      if (!val) return;
      const label = zone.querySelector('.drop-label');
      if (label) label.textContent = val;
      const input = zone.querySelector('input[type="hidden"]');
      if (input) input.value = val;
    });
  });
}

// Initialise sortable lists.  Lists must have class="sortable-list"
// and contain li elements with either a data-value attribute or
// meaningful text content.  A hidden input should immediately follow
// each list to capture the order (pipe‑separated).  Dragging and
// dropping items within a list updates the hidden input value.
function initSortableLists() {
  const lists = document.querySelectorAll('.sortable-list');
  lists.forEach(list => {
    let draggingItem = null;
    const updateOrder = () => {
      const hidden = list.nextElementSibling;
      if (!hidden || hidden.type !== 'hidden') return;
      const order = Array.from(list.children).map(li => li.dataset.value || li.textContent.trim());
      hidden.value = order.join('|');
    };
    list.querySelectorAll('li').forEach(li => {
      li.setAttribute('draggable', 'true');
      li.addEventListener('dragstart', e => {
        draggingItem = li;
        e.dataTransfer.effectAllowed = 'move';
      });
      li.addEventListener('dragover', e => {
        e.preventDefault();
        const bounding = li.getBoundingClientRect();
        const offset = e.clientY - bounding.top - bounding.height / 2;
        if (draggingItem && draggingItem !== li) {
          if (offset > 0) {
            li.parentNode.insertBefore(draggingItem, li.nextSibling);
          } else {
            li.parentNode.insertBefore(draggingItem, li);
          }
          updateOrder();
        }
      });
      li.addEventListener('drop', e => {
        e.preventDefault();
        draggingItem = null;
        updateOrder();
      });
    });
    // Set initial order on load
    updateOrder();
  });
}

// Initialise anagram builders.  Each puzzle should be wrapped in a
// container with class="anagram-wrapper".  Buttons used for
// building the word have class="anagram-letter" and a data-letter
// attribute.  The input displaying the assembled word has
// class="anagram-output".  A hidden input stores the result and a
// button with class="anagram-clear" resets the puzzle.  Clicking
// letter buttons appends their letter to the output and updates
// the hidden input accordingly.
function initAnagramBuilders() {
  const wrappers = document.querySelectorAll('.anagram-wrapper');
  wrappers.forEach(wrapper => {
    const output = wrapper.querySelector('.anagram-output');
    const hidden = wrapper.querySelector('input[type="hidden"]');
    const clearBtn = wrapper.querySelector('.anagram-clear');
    wrapper.querySelectorAll('.anagram-letter').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!output) return;
        output.value += btn.dataset.letter;
        if (hidden) hidden.value = output.value;
      });
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (output) output.value = '';
        if (hidden) hidden.value = '';
      });
    }
  });
}

// Initialise star rating inputs.  Each container with class="star-rating" should
// include several span elements with class="star" and a data-value
// attribute representing the rating value.  A hidden input within the
// same container captures the selected rating.  Clicking a star
// highlights that star and all previous stars, storing the numeric
// value in the hidden input.  Students can change their rating by
// clicking a different star.
function initStarRatings() {
  const containers = document.querySelectorAll('.star-rating');
  containers.forEach(container => {
    const hidden = container.querySelector('input[type="hidden"]');
    const stars = container.querySelectorAll('.star');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.value, 10);
        stars.forEach(s => {
          const sVal = parseInt(s.dataset.value, 10);
          if (sVal <= val) {
            s.classList.add('on');
          } else {
            s.classList.remove('on');
          }
        });
        if (hidden) hidden.value = val;
      });
    });
  });
}

// Initialise selectable pill groups.  Containers with class="pill-group"
// contain multiple span elements with class="pill-toggle".  Each pill
// has a data-value attribute.  When clicked the pill toggles its
// "selected" class and updates a hidden input with the list of
// selected values separated by pipes (|).  This allows scenario
// questions to record multiple selections in a single field.
function initSelectablePills() {
  const groups = document.querySelectorAll('.pill-group');
  groups.forEach(group => {
    const hidden = group.querySelector('input[type="hidden"]');
    const pills = group.querySelectorAll('.pill-toggle');
    const selected = new Set();
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.dataset.value;
        if (pill.classList.contains('selected')) {
          pill.classList.remove('selected');
          selected.delete(val);
        } else {
          pill.classList.add('selected');
          selected.add(val);
        }
        if (hidden) hidden.value = Array.from(selected).join('|');
      });
    });
  });
}

/**
 * Home page week carousel: left/right buttons and progress indicator.
 */
function initWeeksCarousel() {
  const carousel = document.getElementById('weeks-carousel');
  const progress = document.getElementById('weeks-progress');
  const leftBtn = document.querySelector('.journey .left');
  const rightBtn = document.querySelector('.journey .right');
  if (!carousel || !progress || !leftBtn || !rightBtn) return;
  const update = () => {
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    const percent = maxScroll > 0 ? (carousel.scrollLeft / maxScroll) * 100 : 0;
    progress.style.width = percent + '%';
  };
  leftBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -200, behavior: 'smooth' });
  });
  rightBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: 200, behavior: 'smooth' });
  });
  carousel.addEventListener('scroll', update);
  // Initial fill
  update();
}

function initFlipCards() {
  const cards = document.querySelectorAll('.flip-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });
}

/**
 * Insert a hint toggle on main, support and advanced pages for each week.
 * Hints content is driven by the map below. If a week lacks custom hints,
 * we fall back to generic guidance for that topic type.
 */
function insertTopicHints() {
  const file = window.location.pathname.split('/').pop();
  const match = file.match(/^unit(\d+)(?:_(support|advanced))?\.html$/);
  if (!match) return; // not on a unit page
  const week = match[1];
  const topic = match[2] || 'main';

  // Try likely containers in order of preference
  let container = document.querySelector('.card');
  if (!container) container = document.querySelector('main');
  if (!container) container = document.querySelector('article');
  if (!container) container = document.body;

  const hints = getHintsFor(week, topic);
  if (!hints || hints.length === 0) return;

  const hintWrapper = document.createElement('div');
  hintWrapper.className = 'hint-container';

  const toggle = document.createElement('button');
  toggle.className = 'hint-toggle';
  toggle.type = 'button';
  toggle.textContent = topic === 'advanced' ? 'Reveal Hints' : 'Show Hints';

  const box = document.createElement('div');
  box.className = 'hint-box' + (topic === 'advanced' ? ' purple' : '');
  box.style.display = 'none';
  const ul = document.createElement('ul');
  hints.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });
  box.appendChild(ul);

  toggle.addEventListener('click', () => {
    const isHidden = box.style.display === 'none';
    box.style.display = isHidden ? 'block' : 'none';
    toggle.textContent = (isHidden ? (topic === 'advanced' ? 'Hide Hints' : 'Hide Hints') : (topic === 'advanced' ? 'Reveal Hints' : 'Show Hints'));
  });

  hintWrapper.appendChild(toggle);
  hintWrapper.appendChild(box);

  // Placement rules
  const quizForm = container.querySelector('.quiz-form') || container.querySelector('form.quiz');
  const quizHeading = Array.from(container.querySelectorAll('h3, h2')).find(h => /quiz/i.test(h.textContent));
  const advancedSection = container.querySelector('.advanced-section');

  if (quizHeading && quizHeading.parentNode) {
    quizHeading.parentNode.insertBefore(hintWrapper, quizHeading.nextSibling);
  } else if (quizForm && quizForm.parentNode) {
    quizForm.parentNode.insertBefore(hintWrapper, quizForm);
  } else if (advancedSection) {
    advancedSection.insertBefore(hintWrapper, advancedSection.firstChild);
  } else {
    container.insertBefore(hintWrapper, container.firstChild);
  }
}

function getHintsFor(week, topic) {
  const generic = {
    main: [
      'Read the question carefully and eliminate obviously incorrect options.',
      'Apply the week’s key safety and process rules before choosing an answer.',
      'If unsure, think about what would keep people safe and the project accurate.'
    ],
    support: [
      'Skim the support notes above each quiz question.',
      'Look for keywords that match the question, then choose the best fit.',
      'Ask: what is the simplest, safest step to take first?' 
    ],
    advanced: [
      'Back claims with a reason: safety, efficiency, cost or quality.',
      'Compare options by strength, accuracy, risk and time required.',
      'Suggest improvements and explain the trade‑offs.'
    ]
  };

  const byWeek = {
    '1': {
      main: [
        'Clear and tidy your workspace before starting any task.',
        'Always wear appropriate PPE such as safety glasses and ear protection.',
        'Clamp your workpiece securely before cutting or drilling.',
        'Wait for teacher instructions and permission before using any machine.'
      ],
      support: [
        'Safety first: PPE, clear space, ask for help before using machines.',
        'Mild steel is chosen for strength and weather resistance.'
      ],
      advanced: [
        'Research industry safety controls: machine guards, lockout/tagout.',
        'Compare materials by strength, weight and corrosion resistance.',
        'Think about usability add‑ons like clips or organisers.'
      ]
    },
    '2': {
      main: [
        'Start with clear dimensions and a materials list.',
        'Follow the design process: investigate → generate → produce → evaluate.'
      ]
    },
    '3': { main: ['Measure twice, mark once. Use the correct marking tool for accuracy.'] },
    '4': { main: ['Use vices and formers. Remove small amounts and check fit often.'] },
    '5': { main: ['Prepare clean joints, clamp well, and check alignment before joining.'] },
    '6': { main: ['Assemble in stages; test sub‑assemblies before final fixings.'] },
    '7': { main: ['Surface prep matters. Deburr edges and sand before painting.'] },
    '8': { main: ['Test against criteria: strength, safety, finish, and usability.'] },
    '9': { main: ['Document steps with photos and captions for your portfolio.'] },
    '10': { main: ['Reflect honestly: what worked, what didn’t, and how to improve.'] }
  };

  const weekHints = (byWeek[week] && byWeek[week][topic]) || generic[topic] || [];
  return weekHints;
}

function applySupportPageChrome() {
  const file = window.location.pathname.split('/').pop();
  const match = file.match(/^unit(\d+)_support\.html$/);
  if (!match) return; // not a support page
  const week = parseInt(match[1], 10);

  // If there is already a header we assume the page is already styled
  if (document.querySelector('header')) return;

  // Derive a nice title from the existing <summary> if present
  let headerTitle = `Week ${week} (Support)`;
  const summary = document.querySelector('summary');
  if (summary) {
    const txt = summary.textContent.trim();
    const m = txt.match(/Week\s*\d+\s*[:\-–]\s*(.+)/i);
    if (m) headerTitle = `Week ${week} – ${m[1]} (Support)`;
    else headerTitle = `${txt} (Support)`;
  }

  // Build header and global nav
  const header = document.createElement('header');
  header.innerHTML = `<h1>${headerTitle}</h1>`;

  const nav = document.createElement('nav');
  nav.innerHTML = [
    '<a href="index.html">Home</a>',
    '<a href="program.html">Course\u00A0Program</a>',
    '<a href="syllabus.html">Syllabus</a>',
    '<a href="assessments.html">Assessments</a>'
  ].join('');

  // Local nav between Main/Support/Advanced for this week
  const local = document.createElement('div');
  local.className = 'local-nav';
  local.innerHTML = [
    `<a href="unit${week}.html">Main</a>`,
    `<a href="unit${week}_support.html">Support</a>`,
    `<a href="unit${week}_advanced.html">Advanced</a>`
  ].join('');

  // Create main content container and card
  const main = document.createElement('main');
  const card = document.createElement('div');
  card.className = 'card';

  // Move existing primary content into the card
  // Prefer moving the <details> block; fall back to body children
  const details = document.querySelector('details');
  if (details) {
    card.appendChild(details);
  } else {
    const moveables = Array.from(document.body.children).filter(el => !['SCRIPT'].includes(el.tagName));
    moveables.forEach(el => {
      if (!el.matches('header, nav, footer')) card.appendChild(el);
    });
  }

  main.appendChild(card);

  // Progress bar like main pages
  const progress = document.createElement('div');
  progress.className = 'progress-container';
  progress.innerHTML = '<div class="progress-bar"></div>';
  main.appendChild(progress);

  // Assemble into the DOM
  document.body.prepend(header);
  document.body.insertBefore(nav, header.nextSibling);
  document.body.insertBefore(local, nav.nextSibling);
  document.body.insertBefore(main, (local.nextSibling));

  // Standard footer if missing
  if (!document.querySelector('footer')) {
    const footer = document.createElement('footer');
    footer.innerHTML = '&copy; 2025 Hose\u00A0Reel Holder Project';
    document.body.appendChild(footer);
  }
}

function insertWeekNav() {
  const file = window.location.pathname.split('/').pop();
  const m = file.match(/^unit(\d+)(?:_(support|advanced))?\.html$/);
  if (!m) return;
  const week = parseInt(m[1], 10);
  const variant = m[2] ? `_${m[2]}` : '';

  const prevWeek = week > 1 ? week - 1 : null;
  const nextWeek = week < 10 ? week + 1 : null;

  const container = document.querySelector('main') || document.querySelector('.card') || document.body;
  const navWrap = document.createElement('div');
  navWrap.className = 'week-nav';

  const prevLink = document.createElement('a');
  if (prevWeek) {
    prevLink.href = `unit${prevWeek}${variant}.html`;
    prevLink.textContent = '← Previous Week';
  } else {
    prevLink.href = '#';
    prevLink.textContent = '← Previous Week';
    prevLink.className = 'disabled';
  }

  const nextLink = document.createElement('a');
  if (nextWeek) {
    nextLink.href = `unit${nextWeek}${variant}.html`;
    nextLink.textContent = 'Next Week →';
  } else {
    nextLink.href = '#';
    nextLink.textContent = 'Next Week →';
    nextLink.className = 'disabled';
  }

  navWrap.appendChild(prevLink);
  navWrap.appendChild(nextLink);

  // Place after the primary card if available; else at end of main
  const card = container.querySelector('.card');
  if (card && card.parentNode === container) {
    card.insertAdjacentElement('afterend', navWrap);
  } else {
    container.appendChild(navWrap);
  }
}
