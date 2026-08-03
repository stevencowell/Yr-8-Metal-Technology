(function () {
  "use strict";

  const config = window.PROJECT_VIDEO_LIBRARY || {};
  const rows = document.getElementById("video-rows");
  const emptyState = document.getElementById("empty-state");
  const topicNav = document.getElementById("topic-nav");
  const modal = document.getElementById("video-modal");
  const playerFrame = document.getElementById("player-frame");
  const modalTitle = document.getElementById("modal-title");
  const closeButton = document.getElementById("close-button");
  let returnFocus = null;

  function text(value) {
    return String(value ?? "");
  }

  function slug(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function validateVideos(videos) {
    const seen = new Set();
    return videos.filter((video, index) => {
      const required = ["topic", "videoId", "title", "overview", "channel"];
      const missing = required.filter((field) => !text(video[field]).trim());
      const validId = /^[A-Za-z0-9_-]{11}$/.test(text(video.videoId));
      const duplicate = seen.has(video.videoId);
      if (missing.length || !validId || duplicate) {
        console.warn("Video library entry rejected", { index, missing, validId, duplicate });
        return false;
      }
      seen.add(video.videoId);
      return true;
    });
  }

  function make(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  }

  function openModal(videoId, title, trigger) {
    returnFocus = trigger || document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modalTitle.textContent = title;
    playerFrame.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    playerFrame.src = "";
    document.body.style.overflow = "";
    if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
  }

  function renderVideo(video) {
    const row = document.createElement("tr");
    row.id = `clip-${slug(video.topic)}-${video.videoId}`;

    const topicCell = document.createElement("td");
    topicCell.append(make("span", "topic-pill", video.topic));

    const thumbCell = document.createElement("td");
    const thumb = make("button", "thumb");
    thumb.type = "button";
    thumb.setAttribute("aria-label", `Play ${video.title}`);
    const image = document.createElement("img");
    image.src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
    image.alt = `Thumbnail: ${video.title}`;
    image.loading = "lazy";
    const badge = make("span", "play-badge");
    const badgeInner = make("span", "", "▶");
    badgeInner.setAttribute("aria-hidden", "true");
    badge.append(badgeInner);
    thumb.append(image, badge);
    thumb.addEventListener("click", () => openModal(video.videoId, video.title, thumb));
    thumbCell.append(thumb);

    const overviewCell = document.createElement("td");
    overviewCell.append(
      make("h2", "clip-title", video.title),
      make("p", "clip-overview", video.overview),
      make("p", "clip-source", `Source: ${video.channel}`)
    );
    const actions = make("div", "actions");
    const play = make("button", "button primary", "Play");
    play.type = "button";
    play.addEventListener("click", () => openModal(video.videoId, video.title, play));
    const external = make("a", "button", "Open in YouTube");
    external.href = `https://www.youtube.com/watch?v=${video.videoId}`;
    external.target = "_blank";
    external.rel = "noopener";
    actions.append(play, external);
    overviewCell.append(actions);

    row.append(topicCell, thumbCell, overviewCell);
    rows.append(row);
  }

  function render() {
    document.title = text(config.title || "Project video library");
    document.getElementById("course-name").textContent = text(config.courseName || "Guided course");
    document.getElementById("library-title").textContent = text(config.title || "Project video library");
    document.getElementById("library-introduction").textContent = text(config.introduction || "Approved clips aligned to the skill currently being taught.");
    document.getElementById("back-link").href = text(config.backHref || "../index.html");
    if (/^#[0-9a-f]{6}$/i.test(text(config.accent))) document.documentElement.style.setProperty("--brand", config.accent);

    const videos = validateVideos(Array.isArray(config.videos) ? config.videos : []);
    emptyState.hidden = videos.length > 0;
    topicNav.hidden = videos.length === 0;
    const topics = [...new Set(videos.map((video) => video.topic))];
    topics.forEach((topic) => {
      const link = make("a", "", topic);
      const first = videos.find((video) => video.topic === topic);
      link.href = `#clip-${slug(topic)}-${first.videoId}`;
      topicNav.append(link);
    });
    videos.forEach(renderVideo);
  }

  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && modal.classList.contains("open")) closeModal(); });
  render();
})();
