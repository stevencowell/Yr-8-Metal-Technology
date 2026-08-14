(function () {
  "use strict";

  if (document.querySelector(".course-family-nav")) return;

  const script = document.currentScript;
  const root = new URL("../", script && script.src ? script.src : location.href);
  const stylesheetUrl = new URL("course-family-navigation.css?v=20260814", root).href;

  if (!document.querySelector("link[data-course-family-nav-styles]")) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = stylesheetUrl;
    stylesheet.dataset.courseFamilyNavStyles = "";
    document.head.append(stylesheet);
  }

  const path = location.pathname.toLowerCase();
  const rootPath = root.pathname.replace(/\/$/, "").toLowerCase();
  const isHome = path === `${rootPath}/` || path === `${rootPath}/index.html`;

  const nav = document.createElement("nav");
  nav.className = "course-family-nav screen-only";
  nav.setAttribute("aria-label", "Hose Reel Holder course navigation");

  const inner = document.createElement("div");
  inner.className = "course-family-nav__inner";

  const brand = document.createElement("a");
  brand.className = "course-family-nav__brand";
  brand.href = new URL("index.html", root).href;
  brand.innerHTML = '<span class="course-family-nav__mark" aria-hidden="true">HR</span><span>Hose Reel Holder</span>';

  const links = document.createElement("div");
  links.className = "course-family-nav__links";

  const items = [
    ["Course", "index.html", isHome],
    ["Modules", "index.html#pathway", path.endsWith("/module.html")],
    ["Video learning", "youtube-library/video-library.html", path.includes("/youtube-library/")],
    ["Busy Work", "https://stevencowell.github.io/busy-worksheets/?library=metal", false, true],
    ["My folio", "folio.html", path.endsWith("/folio.html")],
    ["Project resource", "project-resource.html", path.endsWith("/project-resource.html")],
    ["Teacher resources", "teacher-resources.html", path.includes("/teacher-resources")],
    ["Main Menu", "https://stevencowell.github.io/Main-Page/", false, true]
  ];

  items.forEach(([label, href, current, external]) => {
    const link = document.createElement("a");
    link.textContent = label;
    link.href = external ? href : new URL(href, root).href;
    if (current) link.setAttribute("aria-current", "page");
    links.append(link);
  });

  inner.append(brand, links);
  nav.append(inner);
  document.body.prepend(nav);
  document.documentElement.classList.add("has-course-family-nav");
})();
