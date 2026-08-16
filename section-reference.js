(function () {
  "use strict";

  const script = document.currentScript;
  const siteRoot = new URL("./", script && script.src ? script.src : location.href);

  const classKeys = [
    ["course-family-intro", "INTRO"],
    ["hero", "HERO"],
    ["desk-folio-hero", "HERO"],
    ["library-header", "HERO"],
    ["exam-header", "HERO"],
    ["course-authority-note", "AUTHORITY"],
    ["lesson-overview", "PRESENTATION"],
    ["module-support-panel", "SUPPORT"],
    ["student-strip", "STUDENT-DETAILS"],
    ["completion-card", "SAVE-EVIDENCE"],
    ["folio-intro", "OVERVIEW"],
    ["folio-controls", "SAVING"],
    ["folio-submission", "SUBMISSION"],
    ["folio-cards", "EVIDENCE"],
    ["table-card", "LIBRARY"],
    ["page", "CONTEXT"],
    ["photo-panel", "PHOTO"],
    ["theory-table-wrap", "TABLE"],
    ["warning", "HANDBOOK-STATUS"]
  ];

  const toCode = (value, fallback) => {
    const code = String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/&/g, " AND ")
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42)
      .replace(/-+$/g, "");
    return code || fallback;
  };

  const siteCode = toCode(script?.dataset.siteCode, "SITE");

  const getRelativePath = () => {
    const rootPath = siteRoot.pathname.replace(/\/$/, "");
    let path = decodeURIComponent(location.pathname);
    if (rootPath && path.toLowerCase().startsWith(`${rootPath.toLowerCase()}/`)) {
      path = path.slice(rootPath.length + 1);
    } else {
      path = path.replace(/^\//, "");
    }
    return path.replace(/\/index\.html$/i, "").replace(/^index\.html$/i, "").replace(/^\/+|\/+$/g, "").toLowerCase();
  };

  const getPageCode = () => {
    const path = getRelativePath();
    if (!path) return "HOME";

    const moduleNumber = new URLSearchParams(location.search).get("module");
    if (moduleNumber && /module\.html$/i.test(path)) {
      const pathParts = path.split("/");
      const projectScope = pathParts.length > 1 ? toCode(pathParts.slice(0, -1).join("-"), "") : "";
      return `${projectScope ? `${projectScope}-` : ""}M${toCode(moduleNumber, "1")}`;
    }

    const weekMatch = path.match(/(?:weeks?|modules?)[-\/]?(\d+)(?:-(\d+))?/i);
    if (weekMatch) {
      const firstWeek = Number(weekMatch[1]);
      return path.includes("module") ? `M${firstWeek}` : `M${Math.ceil(firstWeek / 2)}`;
    }

    const fileName = path.split("/").pop().replace(/\.html$/i, "");
    if (/folio|portfolio|workbook/i.test(fileName)) return "FOLIO";
    if (/teacher/i.test(fileName)) return "TEACHER";
    if (/assessment/i.test(fileName)) return "ASSESSMENT";
    if (/exam|quiz|test/i.test(fileName)) return "EXAM";
    if (/youtube|video/i.test(path)) return "VIDEOS";
    if (/plans?|drawings?/i.test(fileName)) return "PLANS";
    return toCode(path.replace(/\.html$/i, ""), "PAGE");
  };

  const getTargets = () => {
    const selectors = [
      "body > header",
      "body > main",
      "body > article",
      "body > section",
      "body > details",
      "body > form",
      "body > .card",
      "body > [class$='-card']",
      "body > [class$='-gate']",
      "body > [class*='container']",
      "body > [id$='Page']",
      "body > h1",
      "body > h2",
      "body > p.instructions",
      "body > ol",
      "body > details > article",
      "body > details article",
      "body > details form",
      "body > details fieldset",
      "body > .hero",
      "body > .course-hero",
      "body > .page-hero",
      "body > .lesson-hero",
      "body > .project-hero",
      "main.page > .hero",
      "main > .hero",
      "main > .course-hero",
      "main > .page-hero",
      "main > .lesson-hero",
      "main > .project-hero",
      "body > .desk-folio-hero",
      "main > .library-header",
      "body > #examPage > .exam-header",
      "main section",
      "main article",
      "main aside",
      "main figure",
      "main details",
      "main .card",
      "main .check",
      "main .callout",
      "main [class$='-card']",
      "main [class*='-card ' ]",
      "main .criteria-panel",
      "main .control-list",
      "main .theory-table-wrap",
      "main .photo-panel",
      "main .table-card tbody tr",
      "main .content .card",
      "main .content > .warning",
      "body > footer"
    ];

    return Array.from(document.querySelectorAll(selectors.join(",")))
      .filter((target) => target.id !== "folioCards")
      .filter((target) => !target.closest("nav"))
      .filter((target) => !target.matches(".local-nav, .course-family-navigation, [class*='nav-wrap']"))
      .filter((target) => target.tagName !== "MAIN" || target.querySelector("h1, h2, h3, p, img, form, table, article, section"));
  };

  const indexWithin = (target, selector) => {
    const scope = target.parentElement;
    if (!scope) return 1;
    return Array.from(scope.querySelectorAll(`:scope > ${selector}`)).indexOf(target) + 1;
  };

  const indexWithinTarget = (target, parentTarget, selector) => {
    if (!parentTarget) return 1;
    return Array.from(parentTarget.querySelectorAll(selector)).indexOf(target) + 1;
  };

  const getSectionKey = (target, index, parentTarget) => {
    if (target.tagName === "MAIN") {
      return "CONTENT";
    }

    if (target.tagName === "FOOTER") {
      return "FOOTER";
    }

    if (target.tagName === "HEADER" && target.parentElement === document.body) {
      return "HERO";
    }

    if (target.classList.contains("rationale")) {
      return `WHY-${String(index + 1).padStart(2, "0")}`;
    }

    if (target.matches(".question-card, .quiz-question, .question, .check")) {
      const theoryMatch = target.closest(".check-group")?.id.match(/-(\d+)$/);
      const theoryPrefix = theoryMatch ? `T${Number(theoryMatch[1]) + 1}-` : "";
      return `${theoryPrefix}Q${String(indexWithinTarget(target, parentTarget, ".question-card, .quiz-question, .question, .check")).padStart(2, "0")}`;
    }

    if (target.classList.contains("written-card")) {
      return `RESPONSE-${String(indexWithin(target, ".written-card")).padStart(2, "0")}`;
    }

    if (target.classList.contains("question") && target.dataset.question) {
      return `Q${String(indexWithin(target, ".question")).padStart(2, "0")}`;
    }

    if (target.classList.contains("folio-card")) {
      const cardKey = target.querySelector("[data-response]")?.dataset.response;
      return `CARD-${toCode(cardKey, index + 1)}`;
    }

    if (target.classList.contains("week-card")) {
      const moduleName = target.querySelector(".status")?.textContent;
      return toCode(moduleName, `MODULE-${indexWithin(target, ".week-card")}`);
    }

    if (target.classList.contains("course-family-intro__card")) {
      return `STEP-${String(indexWithin(target, ".course-family-intro__card")).padStart(2, "0")}`;
    }

    if (target.classList.contains("section-video")) {
      return "VIDEO";
    }

    if (target.classList.contains("callout")) {
      return `CALLOUT-${String(indexWithinTarget(target, parentTarget, ".callout")).padStart(2, "0")}`;
    }

    if (target.tagName === "FIGURE") {
      return `VISUAL-${String(indexWithinTarget(target, parentTarget, "figure")).padStart(2, "0")}`;
    }

    if (target.tagName === "TR") {
      const videoTitle = target.querySelector(".clip-title")?.textContent;
      return `VIDEO-${toCode(videoTitle, indexWithin(target, "tr"))}`;
    }

    if (target.classList.contains("interleaved-check-group")) {
      const theorySection = target.previousElementSibling;
      const theoryKey = theorySection?.id || theorySection?.querySelector("h2")?.textContent;
      return `${toCode(theoryKey, `THEORY-${index + 1}`)}-CHECKS`;
    }

    for (const [className, key] of classKeys) {
      if (target.classList.contains(className)) return key;
    }

    if (target.id && !/^main-content$|^lesson-content$/i.test(target.id)) {
      return toCode(target.id, `SECTION-${index + 1}`);
    }

    const heading = target.querySelector("h1, h2, h3, h4, summary, [aria-label]");
    const headingText = heading?.textContent || target.getAttribute("aria-label");
    return toCode(headingText, `SECTION-${String(index + 1).padStart(2, "0")}`);
  };

  const createReferenceLink = (reference) => {
    const link = document.createElement("a");
    link.className = "section-reference";
    link.href = `#${reference}`;
    link.textContent = reference;
    link.setAttribute("aria-label", `Staff section reference ${reference}`);
    return link;
  };

  const createSectionScreenshot = async (target) => {
    if (typeof html2canvas !== "function") {
      throw new Error("Screenshot tool unavailable");
    }

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(target, {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      logging: false,
      onclone: (clonedDocument) => {
        clonedDocument.querySelectorAll("input, textarea, select").forEach((field) => {
          if (field.tagName === "INPUT" && ["checkbox", "radio"].includes(field.type)) {
            field.checked = false;
          } else {
            field.value = "";
          }
        });
        clonedDocument.querySelectorAll(".photo-preview").forEach((image) => {
          image.removeAttribute("src");
          image.style.display = "none";
        });
      },
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Screenshot could not be created"));
      }, "image/png");
    });
  };

  const copySectionScreenshot = async (target) => {
    if (!navigator.clipboard?.write || typeof ClipboardItem !== "function") {
      throw new Error("Image clipboard unavailable");
    }

    const image = createSectionScreenshot(target);
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": image })
    ]);
  };

  const bindReference = (link, target) => {
    if (link.dataset.sectionReferenceReady === "true") return;

    const reference = link.textContent.trim();
    link.dataset.sectionReferenceReady = "true";
    link.title = `Copy a screenshot of ${reference}`;
    target.dataset.sectionReferenceTarget = reference;

    if (!document.getElementById(reference)) {
      link.id = reference;
    }

    link.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        history.replaceState(null, "", `#${reference}`);
        link.classList.add("is-capturing");
        await copySectionScreenshot(target);
        link.classList.remove("is-capturing");
        link.textContent = "Screenshot copied — paste now";
        link.classList.add("is-copied");
        link.setAttribute("aria-label", `${reference} screenshot copied`);

        window.clearTimeout(link.copyResetTimer);
        link.copyResetTimer = window.setTimeout(() => {
          link.textContent = reference;
          link.classList.remove("is-copied");
          link.setAttribute("aria-label", `Staff section reference ${reference}`);
        }, 1800);
      } catch (error) {
        console.error("Section screenshot failed", error);
        link.classList.remove("is-capturing");
        link.textContent = "Screenshot failed";
        window.setTimeout(() => {
          link.textContent = reference;
        }, 1800);
      }
    });
  };

  const init = () => {
    const pageCode = getPageCode();
    const usedReferences = new Set();

    getTargets().forEach((target, index) => {
      if (target.dataset.sectionReferenceTarget) {
        usedReferences.add(target.dataset.sectionReferenceTarget);
        return;
      }

      let link = target.querySelector(":scope > .section-reference");

      if (!link) {
        const parentTarget = target.parentElement?.closest("[data-section-reference-target]");
        const parentReference = target.matches(".question-card, .quiz-question, .question, .check") || target.classList.contains("rationale")
          ? `${siteCode}-${pageCode}`
          : parentTarget && parentTarget.tagName !== "MAIN"
          ? parentTarget.dataset.sectionReferenceTarget
          : `${siteCode}-${pageCode}`;
        const baseReference = `${parentReference}-${getSectionKey(target, index, parentTarget)}`;
        let reference = baseReference;
        let duplicateNumber = 2;
        while (usedReferences.has(reference) || document.getElementById(reference)) {
          reference = `${baseReference}-${duplicateNumber}`;
          duplicateNumber += 1;
        }
        link = createReferenceLink(reference);
        const usesStructuredLayout = [
          "folio-intro",
          "folio-controls",
          "folio-submission",
          "section-video",
          "criteria-panel",
          "module-support-panel",
          "lesson-overview",
          "student-strip",
          "rationale"
        ]
          .some((className) => target.classList.contains(className));
        const isHero = target.matches(".hero, .course-hero, .page-hero, .lesson-hero, .project-hero, .desk-folio-hero, .library-header, .exam-header");
        const layout = getComputedStyle(target).display;
        const parentLayout = target.parentElement ? getComputedStyle(target.parentElement).display : "";
        if (["grid", "inline-grid", "flex", "inline-flex"].includes(parentLayout)) {
          target.classList.add("section-reference-layout-safe");
        }
        const contentPlacement = target.querySelector(":scope > .content, :scope > .card-body, :scope > .folio-body, :scope > header, :scope > div");
        const needsLayoutProtection = usesStructuredLayout || ["grid", "inline-grid", "flex", "inline-flex"].includes(layout);
        const isOverlayTarget = isHero || target.tagName === "FOOTER" || (!target.classList.contains("rationale") && needsLayoutProtection && !contentPlacement);
        const placement = target.classList.contains("rationale")
          ? target.querySelector("summary") || target
          : target.tagName === "TR"
          ? target.firstElementChild
          : target.classList.contains("folio-card")
          ? target.querySelector(".folio-body") || contentPlacement || target
          : needsLayoutProtection && contentPlacement
            ? contentPlacement
            : target;
        if (isOverlayTarget) {
          target.classList.add("section-reference-overlay-target");
          link.classList.add("section-reference--overlay");
          if (isHero) link.classList.add("section-reference--on-dark");
          target.append(link);
        } else {
          placement.prepend(link);
        }
      }

      usedReferences.add(link.textContent.trim());
      bindReference(link, target);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  let initTimer;
  const observer = new MutationObserver((mutations) => {
    if (!mutations.some((mutation) => mutation.addedNodes.length)) return;
    window.clearTimeout(initTimer);
    initTimer = window.setTimeout(init, 80);
  });
  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
