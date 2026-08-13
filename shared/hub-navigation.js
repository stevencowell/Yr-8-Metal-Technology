(function () {
  "use strict";

  const HUB_URL = "https://stevencowell.github.io/Main-Page/";
  const BUSY_WORK_URL = "https://stevencowell.github.io/busy-worksheets/?library=metal";
  const script = document.currentScript;
  const stylesheetUrl = script ? new URL("sister-site.css", script.src).href : "";

  if (stylesheetUrl && !document.querySelector('link[data-sister-site-styles]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = stylesheetUrl;
    stylesheet.dataset.sisterSiteStyles = "";
    document.head.append(stylesheet);
  }

  if (document.querySelector(".hub-return-bar")) return;

  const heading = document.querySelector("h1");
  const courseLabel = heading && heading.textContent.trim() ? heading.textContent.trim() : document.title;
  const bar = document.createElement("nav");
  bar.className = "hub-return-bar screen-only";
  bar.setAttribute("aria-label", "Industrial Arts Learning Hub navigation");

  const inner = document.createElement("div");
  inner.className = "hub-return-inner";

  const link = document.createElement("a");
  link.className = "hub-return-link";
  link.href = HUB_URL;
  link.innerHTML = '<span aria-hidden="true">←</span><span>Main menu · Industrial Arts Learning Hub</span>';

  const label = document.createElement("span");
  label.className = "hub-course-label";
  label.textContent = courseLabel;

  const busyWork = document.createElement("a");
  busyWork.className = "hub-return-link";
  busyWork.href = BUSY_WORK_URL;
  busyWork.textContent = "Busy Work";

  inner.append(link, busyWork, label);
  bar.append(inner);
  document.body.prepend(bar);
})();
