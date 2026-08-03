(() => {
  "use strict";
  const config = window.EXAM_CONFIG;
  if (!config) throw new Error("EXAM_CONFIG is required.");

  const PASSWORD = "8142";
  const storageKey = "industrial-arts-exam:" + config.id + ":v1";
  const unlockKey = "industrial-arts-unlocked:" + config.id;
  const gate = document.getElementById("passwordGate");
  const page = document.getElementById("examPage");
  const gateForm = document.getElementById("gateForm");
  const gateInput = document.getElementById("gatePassword");
  const gateError = document.getElementById("gateError");
  const form = document.getElementById("examForm");
  const sectionsHost = document.getElementById("examSections");

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);

  const totalQuestions = config.sections.reduce((sum, section) => sum + section.questions.length, 0);
  const totalMarks = config.sections.reduce((sum, section) =>
    sum + section.questions.reduce((subtotal, question) => subtotal + Number(question.marks || 0), 0), 0);

  document.title = config.course + " | " + config.title;
  document.getElementById("courseName").textContent = config.course;
  document.getElementById("examTitle").textContent = config.title;
  document.getElementById("examSubtitle").textContent = config.subtitle;
  document.getElementById("backLink").href = config.backHref || "../index.html";
  document.getElementById("backLink").textContent = "Back to " + (config.backLabel || "course home");
  document.getElementById("metaStage").textContent = config.stage;
  document.getElementById("metaTime").textContent = config.time;
  document.getElementById("metaMarks").textContent = totalMarks + " marks";
  document.getElementById("metaStatus").textContent = config.status;
  document.getElementById("metaTask").textContent = config.taskLabel;
  document.getElementById("metaDate").textContent = config.scheduledDate;
  document.getElementById("metaOutcomes").textContent = config.outcomes;
  document.getElementById("examDirections").textContent = config.directions;
  document.getElementById("pdfFilename").textContent = config.pdfFilename;

  let number = 0;
  sectionsHost.innerHTML = config.sections.map(section => {
    const sectionMarks = section.questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);
    const questions = section.questions.map(question => {
      number += 1;
      const fieldName = "q" + number;
      const title = `<div class="question-title"><span class="question-number">${number}</span><span class="question-prompt">${escapeHtml(question.prompt)}</span><span class="question-marks">[${question.marks} mark${question.marks === 1 ? "" : "s"}]</span></div>`;
      if (question.kind === "choice") {
        const options = question.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          return `<label class="option"><input data-answer type="radio" name="${fieldName}" value="${escapeHtml(letter + " — " + option)}"><span><strong>${letter}.</strong> ${escapeHtml(option)}</span></label>`;
        }).join("");
        return `<article class="question" data-question="${fieldName}">${title}<div class="options">${options}</div><div class="print-answer" data-print-answer="${fieldName}">Selected answer: Not answered</div></article>`;
      }
      const rows = question.kind === "long" ? 9 : 5;
      return `<article class="question" data-question="${fieldName}">${title}<div class="response-wrap"><textarea data-answer name="${fieldName}" rows="${rows}" aria-label="Response to question ${number}" placeholder="Type your response here"></textarea>${question.hint ? `<p class="response-hint">${escapeHtml(question.hint)}</p>` : ""}</div></article>`;
    }).join("");
    return `<section class="exam-card"><div class="section-heading"><div><p class="exam-kicker" style="color:var(--brand)">${escapeHtml(section.label)}</p><h2>${escapeHtml(section.title)}</h2></div><p>${sectionMarks} marks</p></div>${section.instructions ? `<p>${escapeHtml(section.instructions)}</p>` : ""}${questions}</section>`;
  }).join("");

  const fields = Array.from(form.querySelectorAll("[data-answer], [data-student]"));

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
    catch { return {}; }
  };

  const collectState = () => {
    const state = {};
    fields.forEach(field => {
      if (field.type === "radio") {
        if (field.checked) state[field.name] = field.value;
      } else {
        state[field.name] = field.value;
      }
    });
    return state;
  };

  const restoreState = () => {
    const state = readState();
    fields.forEach(field => {
      if (!(field.name in state)) return;
      if (field.type === "radio") field.checked = field.value === state[field.name];
      else field.value = state[field.name];
    });
  };

  let saveTimer;
  const saveState = () => {
    localStorage.setItem(storageKey, JSON.stringify(collectState()));
    const now = new Date();
    document.getElementById("saveStatus").textContent = "Saved on this device at " + now.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
    updateProgress();
  };

  const scheduleSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 180);
  };

  const answered = name => {
    const group = form.querySelectorAll(`[name="${name}"]`);
    if (!group.length) return false;
    if (group[0].type === "radio") return Array.from(group).some(field => field.checked);
    return group[0].value.trim().length > 0;
  };

  const updateProgress = () => {
    let count = 0;
    for (let i = 1; i <= totalQuestions; i += 1) if (answered("q" + i)) count += 1;
    const percent = totalQuestions ? Math.round((count / totalQuestions) * 100) : 0;
    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("progressLabel").textContent = count + " of " + totalQuestions + " questions answered";
  };

  const preparePrint = () => {
    saveState();
    form.querySelectorAll("textarea").forEach(area => {
      area.style.height = "auto";
      area.style.height = Math.max(area.scrollHeight + 4, 90) + "px";
    });
    for (let i = 1; i <= totalQuestions; i += 1) {
      const output = form.querySelector(`[data-print-answer="q${i}"]`);
      if (!output) continue;
      const selected = form.querySelector(`input[name="q${i}"]:checked`);
      output.textContent = "Selected answer: " + (selected ? selected.value : "Not answered");
    }
  };

  gateForm.addEventListener("submit", event => {
    event.preventDefault();
    if (gateInput.value.trim() !== PASSWORD) {
      gateError.textContent = "That password is not correct. Check it with your teacher.";
      gateInput.select();
      return;
    }
    sessionStorage.setItem(unlockKey, "yes");
    gate.hidden = true;
    page.hidden = false;
    document.getElementById("studentName").focus();
  });

  document.getElementById("saveBtn").addEventListener("click", saveState);
  document.getElementById("printBtn").addEventListener("click", () => {
    preparePrint();
    window.print();
  });
  document.getElementById("lockBtn").addEventListener("click", () => {
    saveState();
    sessionStorage.removeItem(unlockKey);
    location.reload();
  });
  document.getElementById("clearBtn").addEventListener("click", () => {
    if (!confirm("Clear all student details and exam responses saved for this exam on this device?")) return;
    localStorage.removeItem(storageKey);
    form.reset();
    document.getElementById("saveStatus").textContent = "Saved responses cleared.";
    updateProgress();
  });
  fields.forEach(field => {
    field.addEventListener("input", scheduleSave);
    field.addEventListener("change", scheduleSave);
  });
  window.addEventListener("beforeprint", preparePrint);

  restoreState();
  updateProgress();
  if (sessionStorage.getItem(unlockKey) === "yes") {
    gate.hidden = true;
    page.hidden = false;
  } else {
    gate.hidden = false;
    page.hidden = true;
    setTimeout(() => gateInput.focus(), 50);
  }
})();
