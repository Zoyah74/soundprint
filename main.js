// main.js

const LS_KEY = "audio_fingerprint_gallery_v2";

function loadGallery() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGallery(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function renderGallery() {
  const galleryEl = document.getElementById("gallery");
  const items = loadGallery();
  galleryEl.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "thumb";
    card.title = "Click to download";

    const img = document.createElement("img");
    img.src = item.pngDataUrl;

    const cap = document.createElement("div");
    cap.className = "cap";
    cap.textContent = `${item.title} • ${fmtDate(item.createdAt)}`;

    card.appendChild(img);
    card.appendChild(cap);

    card.addEventListener("click", () => {
      downloadDataUrl(item.pngDataUrl, item.filename || "soundprint.png");
    });

    galleryEl.appendChild(card);
  });
}

function pushToGallery({ pngDataUrl, title, styleName, isLight }) {
  const items = loadGallery();
  const safeTitle = (title || "audio").replace(/\.[^/.]+$/, "");
  const ts = Date.now();

  items.unshift({
    id: crypto.randomUUID(),
    createdAt: ts,
    title: safeTitle,
    styleName,
    isLight,
    filename: `${safeTitle}-soundprint-${ts}.png`,
    pngDataUrl
  });

  saveGallery(items.slice(0, 90));
  renderGallery();
}

window.addEventListener("DOMContentLoaded", () => {
  const audioFile = document.getElementById("audioFile");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");
  const addGalleryBtn = document.getElementById("addGalleryBtn");
  const saveBtn = document.getElementById("saveBtn");
  const clearBtn = document.getElementById("clearBtn");
  const exportBtn = document.getElementById("exportBtn");
  const bgToggle = document.getElementById("bgToggle");
  const statusEl = document.getElementById("status");
  const nowPlayingEl = document.getElementById("nowPlaying");

  // Style pills
  const styleButtons = Array.from(document.querySelectorAll("[data-style]"));
  let currentStyle = "iris"; // iris | ribbon | bloom

  function setActiveStyle(style) {
    currentStyle = style;

    styleButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.style === style);
    });

    // Tell sketch
    window.FingerprintApp?.setStyle?.(style);

    // Optional status hint
    const label =
      style === "iris" ? "Iris" : style === "ribbon" ? "Ribbon Petals" : "Bloom";
    statusEl.textContent = `Style: ${label}`;
  }
  

  styleButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveStyle(btn.dataset.style));
  });

  // Wait for FingerprintApp
  const wait = setInterval(() => {
    if (!window.FingerprintApp) return;
    clearInterval(wait);

    window.FingerprintApp.onStatus((msg) => (statusEl.textContent = msg));
    renderGallery();

    // default settings
    window.FingerprintApp.setStyle?.(currentStyle);
    window.FingerprintApp.setLightBackground?.(false);

    audioFile.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const ok = await window.FingerprintApp.loadAudioFromFile(file);
      if (ok) nowPlayingEl.textContent = `Loaded: ${file.name}`;
    });

    playBtn.addEventListener("click", () => window.FingerprintApp.play());
    pauseBtn.addEventListener("click", () => window.FingerprintApp.pause());

    restartBtn.addEventListener("click", () => {
      // just restart playback/render
      window.FingerprintApp.play();
    });

    bgToggle?.addEventListener("change", () => {
      window.FingerprintApp.setLightBackground?.(!!bgToggle.checked);
    });

    addGalleryBtn.addEventListener("click", () => {
      const dataUrl = window.FingerprintApp.savePNGDataURL();
      if (!dataUrl) return;

      pushToGallery({
        pngDataUrl: dataUrl,
        title: window.FingerprintApp.getFilename?.() || "audio",
        styleName: currentStyle,
        isLight: !!bgToggle?.checked
      });

      statusEl.textContent = "Added to gallery.";
    });

    saveBtn.addEventListener("click", () => {
      const dataUrl = window.FingerprintApp.savePNGDataURL();
      if (!dataUrl) return;

      const title = (window.FingerprintApp.getFilename?.() || "audio").replace(/\.[^/.]+$/, "");
      const ts = Date.now();
      downloadDataUrl(dataUrl, `${title}-soundprint-${ts}.png`);
      statusEl.textContent = "Saved to device.";
    });

    clearBtn.addEventListener("click", () => {
      localStorage.removeItem(LS_KEY);
      renderGallery();
      statusEl.textContent = "Cleared gallery on this device.";
    });

    exportBtn.addEventListener("click", () => {
      const items = loadGallery();
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      downloadDataUrl(url, "soundprint-gallery.json");
      URL.revokeObjectURL(url);
    });

    // Set initial UI state
    setActiveStyle(currentStyle);
  }, 50);
});