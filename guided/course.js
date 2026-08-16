(function () {
  "use strict";

  const course = window.COURSE_DATA;
  if (!course) return;

  const sectionVideos = {
    "1:Workshop entry and machine permission": { videoId: "XOkPcLD5Soo", title: "The Hierarchy of Controls", channel: "Healthier Workforce Center", watchFor: "Notice why stronger controls, permission and secure work come before relying on PPE alone." },
    "2:From drawing to marked metal: planning the work": { videoId: "bByYRFZYAIA", title: "N5 D&M - Marking Out (Metal)", channel: "LHS Technologies", watchFor: "Identify the reference edge used for each mark and the checks made before cutting." },
    "3:Control the workpiece before the tool": { videoId: "Nu9tYcld7ck", title: "Drill Press Safety", channel: "WoodWorkers Guild Of America", watchFor: "Look for secure workholding, chuck-key control and safe stopping before adjustment." },
    "3:Cutting and edge preparation": { videoId: "uHjEuSeo0fc", title: "Hand Deburring Sheetmetal in 2 Min", channel: "Ramsey Laser Press Brake", watchFor: "Notice why burr removal matters before handling, fitting or coating metal." },
    "3:Forming with a planned sequence": { videoId: "NAaHh_V3rX0", title: "Sheet Metal Bending: Basics, Allowances, and Tips for Best Results", channel: "RAPID DIRECT", watchFor: "Track how material behaviour, bend order and spring-back affect a controlled forming sequence." },
    "4:Choose and complete the approved joint": { videoId: "1G8lGECOe1U", title: "A Step-By-Step Guide on How to Use POP Rivets", channel: "Albany County Fasteners", watchFor: "Identify the rivet parts, grip range and controlled setting sequence; use this method only when the approved plan specifies it." },
    "4:Prepare for corrosion protection": { videoId: "q0CAfXV-YdY", title: "What is Corrosion and How to Stop it", channel: "Cognito", watchFor: "Listen for the conditions needed for rusting and why a continuous protective barrier matters." }
  };

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function storageKey(scope) {
    return `${course.storagePrefix}:${scope}:v1`;
  }

  function load(scope) {
    try { return JSON.parse(localStorage.getItem(storageKey(scope)) || "{}"); }
    catch (_) { return {}; }
  }

  function save(scope, data) {
    localStorage.setItem(storageKey(scope), JSON.stringify(data));
    document.querySelectorAll("[data-save-state]").forEach((node) => {
      node.textContent = `Saved on this device at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    });
  }

  function bindAutosave(scope, root = document) {
    const state = load(scope);
    const fields = root.querySelectorAll("[data-save]");
    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(state, field.name)) {
        if (field.type === "checkbox" || field.type === "radio") field.checked = state[field.name] === field.value || state[field.name] === true;
        else field.value = state[field.name];
      }
      field.addEventListener("input", collect);
      field.addEventListener("change", collect);
    });
    function collect() {
      const next = {};
      fields.forEach((field) => {
        if (field.type === "radio") { if (field.checked) next[field.name] = field.value; }
        else if (field.type === "checkbox") next[field.name] = field.checked;
        else next[field.name] = field.value;
      });
      save(scope, next);
      updateProgress(root);
    }
    updateProgress(root);
  }

  function updateProgress(root = document) {
    const required = [...root.querySelectorAll("[data-required]")];
    if (!required.length) return;
    const complete = required.filter((field) => field.type === "radio" ? root.querySelector(`input[name="${field.name}"]:checked`) : String(field.value || "").trim()).length;
    const uniqueNames = new Set(required.map((field) => field.name));
    const completedNames = new Set(required.filter((field) => field.type === "radio" ? root.querySelector(`input[name="${field.name}"]:checked`) : String(field.value || "").trim()).map((field) => field.name));
    const percent = Math.round((completedNames.size / uniqueNames.size) * 100);
    const bar = root.querySelector("[data-progress-fill]");
    const text = root.querySelector("[data-progress-text]");
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}% evidence entered`;
  }

  function theoryHtml(section, index, moduleNumber) {
    const readingHeadings = ["Understand the idea", "Apply it to this project", "Check before moving on"];
    return `<section class="card theory-section" id="theory-${moduleNumber}-${index + 1}" tabindex="-1">
      <p class="eyebrow">Theory ${index + 1}</p>
      <h2>${escapeHtml(section.title)}</h2>
      <h3 class="theory-chunk-heading">${readingHeadings[0]}</h3>
      <figure class="theory-visual${index % 2 ? " theory-visual--left" : ""}">
        <div class="theory-visual__image" role="img" aria-label="${escapeHtml(section.visual.alt)}" style="background-position:${escapeHtml(section.visual.position)}"></div>
        <figcaption>${escapeHtml(section.visual.caption)}</figcaption>
      </figure>
      ${section.paragraphs.map((p, paragraphIndex) => `${paragraphIndex > 0 && paragraphIndex < readingHeadings.length ? `<h3 class="theory-chunk-heading">${readingHeadings[paragraphIndex]}</h3>` : ""}<p>${escapeHtml(p)}</p>`).join("")}
      ${section.callout ? `<div class="callout">${escapeHtml(section.callout)}</div>` : ""}
      ${videoHtml(sectionVideos[`${moduleNumber}:${section.title}`])}
    </section>${checksHtml(course.modules[moduleNumber - 1], moduleNumber, index)}`;
  }

  function videoHtml(video) {
    if (!video) return "";
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`;
    return `<aside class="section-video" aria-label="Video learning">
      <div><p class="eyebrow">Video learning</p><h3>${escapeHtml(video.title)}</h3><p><strong>Watch for:</strong> ${escapeHtml(video.watchFor)}</p><p class="video-source">YouTube · ${escapeHtml(video.channel)}</p></div>
      <button class="video-shell" type="button" data-video-id="${escapeHtml(video.videoId)}" data-video-title="${escapeHtml(video.title)}" aria-label="Play ${escapeHtml(video.title)}"><img src="https://i.ytimg.com/vi/${encodeURIComponent(video.videoId)}/hqdefault.jpg" alt="" loading="lazy"><span>Play video</span></button>
      <a class="video-fallback" href="${url}" target="_blank" rel="noopener">Open in YouTube</a>
    </aside>`;
  }

  function helpHtml(id, section, moduleNumber) {
    const targetId = `theory-${moduleNumber}-${section.index + 1}`;
    return `<div class="question-help">
      <button class="hint-toggle" type="button" aria-expanded="false" aria-controls="${id}-direction" data-hint-toggle="${id}-direction">Need a hint?</button>
      <div class="theory-direction" id="${id}-direction" hidden>
        <a href="#${targetId}" data-theory-link="${targetId}">Revisit ${escapeHtml(section.title)}</a>
        <button class="secondary-hint-toggle" type="button" aria-expanded="false" aria-controls="${id}-reminder" data-hint-toggle="${id}-reminder">Still need help?</button>
        <div class="theory-reminder" id="${id}-reminder" hidden><strong>Theory reminder:</strong> ${escapeHtml(section.callout)}</div>
      </div>
    </div>`;
  }

  function checksHtml(module, moduleNumber, theoryIndex) {
    if (!Number.isInteger(theoryIndex)) return "";
    const checks = module.checks.map((check, index) => ({ check, index })).filter(({ check }) => (Number(check.theoryIndex) || 0) === theoryIndex);
    if (!checks.length) return "";
    return `<section class="card theory-section"><p class="eyebrow">Knowledge check</p><h2>Check your understanding</h2>
      ${checks.map(({ check, index }) => {
        const section = { ...module.sections[theoryIndex], index: theoryIndex };
        return `<div class="check" data-check="${index}">
        <h3>${escapeHtml(check.question)}</h3>
        ${check.options.map((option, optionIndex) => `<label class="option"><input data-save data-required type="radio" name="check-${index}" value="${optionIndex}"> ${escapeHtml(option)}</label>`).join("")}
        ${helpHtml(`check-${moduleNumber}-${index}`, section, moduleNumber)}
        <button class="btn ghost" type="button" data-check-button="${index}">Check answer</button>
        <div class="feedback" aria-live="polite" data-check-feedback="${index}"></div>
      </div>`; }).join("")}
    </section>`;
  }

  function renderModule() {
    const host = document.querySelector("[data-module-host]");
    if (!host) return;
    const number = Math.max(1, Math.min(course.modules.length, Number(new URLSearchParams(location.search).get("module")) || 1));
    const module = course.modules[number - 1];
    document.title = `${module.title} | ${course.shortTitle}`;
    document.querySelector("[data-module-kicker]").textContent = `Module ${number} · Weeks ${module.weeks}`;
    document.querySelector("[data-module-title]").textContent = module.title;
    document.querySelector("[data-module-summary]").textContent = module.summary;
    host.innerHTML = `
      <section class="card module-overview">
        <div><p class="eyebrow">Module presentation</p><h2>Preview, learn and save evidence</h2><p>${escapeHtml(module.summary)}</p><p class="fine">Work through the presentation, theory, guided checks and written response in order.</p></div>
        <a class="btn presentation-link" href="presentations/hose-reel-holder-module-${number}.pptx" download>Download presentation</a>
      </section>
      <section class="card progress-panel student-evidence" aria-labelledby="student-evidence-title">
        <div><p class="eyebrow">Student evidence</p><h2 id="student-evidence-title">Your details and progress</h2></div>
        <strong data-progress-text>0% evidence entered</strong>
        <div class="progress-track" aria-hidden="true"><div class="progress-fill" data-progress-fill></div></div>
        <div class="student-grid" style="margin-top:18px">
          <label>Student name<input data-save data-required name="student-name" type="text" autocomplete="name"></label>
          <label>Class<input data-save data-required name="student-class" type="text"></label>
        </div>
        <p class="save-state" data-save-state>Autosaves on this browser and device.</p>
      </section>
      ${module.sections.map((section, index) => theoryHtml(section, index, number)).join("")}
      ${checksHtml(module, number)}
      <section class="card theory-section written-evidence">
        <p class="eyebrow">Written evidence</p><h2>Explain your thinking</h2>
        <p>${escapeHtml(module.writtenPrompt)}</p>
        <button class="clarification-button" type="button" data-clarification-toggle aria-expanded="false" aria-controls="clarification-${number}">What is this asking?</button>
        <div class="clarification-panel" id="clarification-${number}" data-clarification-panel hidden><strong>In simpler words:</strong> ${escapeHtml(module.clarification)}</div>
        ${helpHtml(`written-${number}`, { ...module.sections[module.writtenTheoryIndex || 0], index: module.writtenTheoryIndex || 0 }, number)}
        <textarea data-save data-required name="written-response" aria-label="Written response"></textarea>
        <div class="button-row">
          <button class="btn ghost" type="button" data-model-toggle aria-expanded="false" aria-controls="response-example-${number}">Appropriate response example</button>
          <button class="btn" type="button" onclick="window.print()">Print / Save PDF</button>
        </div>
        <div class="model-feedback" id="response-example-${number}" data-model-feedback><strong>Appropriate response example:</strong> ${escapeHtml(module.modelFeedback)}</div>
      </section>
      <section class="card theory-section completion-box">
        <h2>Module completion</h2>
        <label class="option"><input data-save type="checkbox" name="module-complete"> I have completed the theory, checks and written evidence, and saved or printed my work as directed.</label>
      </section>
      <nav class="module-nav" aria-label="Module navigation">
        ${number > 1 ? `<a class="btn ghost" href="module.html?module=${number - 1}">← Previous module</a>` : `<a class="btn ghost" href="index.html">← Course home</a>`}
        ${number < course.modules.length ? `<a class="btn" href="module.html?module=${number + 1}">Next module →</a>` : `<a class="btn" href="folio.html">Open folio →</a>`}
      </nav>`;

    module.checks.forEach((check, index) => {
      host.querySelector(`[data-check-button="${index}"]`).addEventListener("click", () => {
        const selected = host.querySelector(`input[name="check-${index}"]:checked`);
        const feedback = host.querySelector(`[data-check-feedback="${index}"]`);
        if (!selected) { feedback.className = "feedback bad"; feedback.textContent = "Choose an answer first."; return; }
        const correct = Number(selected.value) === check.answerIndex;
        feedback.className = `feedback ${correct ? "good" : "bad"}`;
        feedback.textContent = `${correct ? "Correct. " : "Not yet. "}${check.explanation}`;
      });
    });
    host.querySelectorAll("[data-video-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(button.dataset.videoId)}?autoplay=1&rel=0`;
        iframe.title = button.dataset.videoTitle;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        button.replaceWith(iframe);
      }, { once: true });
    });
    host.querySelectorAll("[data-hint-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const panel = host.querySelector(`#${button.dataset.hintToggle}`);
        const isOpening = panel.hidden;
        panel.hidden = !isOpening;
        button.setAttribute("aria-expanded", String(isOpening));
        if (button.classList.contains("hint-toggle")) button.textContent = isOpening ? "Hide theory direction" : "Need a hint?";
        else button.textContent = isOpening ? "Hide extra help" : "Still need help?";
      });
    });
    host.querySelectorAll("[data-theory-link]").forEach((link) => {
      link.addEventListener("click", () => {
        const target = host.querySelector(`#${link.dataset.theoryLink}`);
        if (target) window.setTimeout(() => target.focus({ preventScroll: true }), 0);
      });
    });
    host.querySelector("[data-clarification-toggle]").addEventListener("click", (event) => {
      const panel = host.querySelector("[data-clarification-panel]");
      const isOpening = panel.hidden;
      panel.hidden = !isOpening;
      event.currentTarget.setAttribute("aria-expanded", String(isOpening));
      event.currentTarget.textContent = isOpening ? "Hide simpler wording" : "What is this asking?";
    });
    host.querySelector("[data-model-toggle]").addEventListener("click", (event) => {
      const panel = host.querySelector("[data-model-feedback]");
      panel.classList.toggle("open");
      const isOpen = panel.classList.contains("open");
      event.currentTarget.setAttribute("aria-expanded", String(isOpen));
      event.currentTarget.textContent = isOpen ? "Hide appropriate response example" : "Appropriate response example";
    });
    bindAutosave(`module-${number}`, host);
  }

  function bindFolio() {
    if (!document.querySelector("[data-folio]")) return;
    bindAutosave("folio");
  }

  renderModule();
  bindFolio();
})();

(() => { const script = document.createElement('script'); script.src = '/Yr-8-Metal-Technology/shared/hub-navigation.js'; document.head.append(script); })();
