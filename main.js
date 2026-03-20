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
  const playPauseIcon = document.getElementById("playPauseIcon");
  const playPauseLabel = document.getElementById("playPauseLabel");
  const restartBtn = document.getElementById("restartBtn");
  const addGalleryBtn = document.getElementById("addGalleryBtn");
  const saveBtn = document.getElementById("saveBtn");
  const clearBtn = document.getElementById("clearBtn");
  const exportBtn = document.getElementById("exportBtn");
  const bgToggle = document.getElementById("bgToggle");
  const statusEl = document.getElementById("status");
  const statusChip = statusEl.closest(".status-chip");
  const nowPlayingEl = document.getElementById("nowPlaying");

  function setDotGenerating() {
    statusChip.classList.add("is-generating");
    statusChip.classList.remove("is-finished");
  }
  function setDotFinished() {
    statusChip.classList.remove("is-generating");
    statusChip.classList.add("is-finished");
  }
  function setDotIdle() {
    statusChip.classList.remove("is-generating", "is-finished");
  }
  const tabUpload = document.getElementById("tabUpload");
  const tabRecord = document.getElementById("tabRecord");
  const uploadPanel = document.getElementById("uploadPanel");
  const recordPanel = document.getElementById("recordPanel");
  const recordBtn = document.getElementById("recordBtn");
  const recordBtnLabel = document.getElementById("recordBtnLabel");
  const recordTimer = document.getElementById("recordTimer");
  const recordedCard = document.getElementById("recordedCard");
  const recordedDuration = document.getElementById("recordedDuration");

  const fileZoneLabel = document.getElementById("fileZoneLabel");
  const fzArtImg = document.getElementById("fzArtImg");
  const fzArtPlaceholder = document.getElementById("fzArtPlaceholder");
  const fzName = document.getElementById("fzName");
  const fzDuration = document.getElementById("fzDuration");

  function fmtDuration(secs) {
    if (!isFinite(secs)) return "";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function getAudioDuration(file) {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(audio.duration); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
      audio.src = url;
    });
  }

  function getAlbumArt(file) {
    return new Promise((resolve) => {
      if (typeof jsmediatags === "undefined") { resolve(null); return; }
      jsmediatags.read(file, {
        onSuccess(tag) {
          const pic = tag.tags.picture;
          if (!pic) { resolve(null); return; }
          const bytes = new Uint8Array(pic.data);
          let binary = "";
          bytes.forEach((b) => (binary += String.fromCharCode(b)));
          resolve(`data:${pic.format};base64,${btoa(binary)}`);
        },
        onError() { resolve(null); }
      });
    });
  }

  async function showFileInfo(file) {
    const [duration, art] = await Promise.all([getAudioDuration(file), getAlbumArt(file)]);
    fzName.textContent = file.name;
    fzDuration.textContent = fmtDuration(duration);
    if (art) {
      fzArtImg.src = art;
      fzArtImg.classList.add("visible");
      fzArtPlaceholder.style.display = "none";
    } else {
      fzArtImg.classList.remove("visible");
      fzArtPlaceholder.style.display = "";
    }
    fileZoneLabel.classList.add("has-file");
  }

  // Play/Pause toggle helpers (hoisted so recording onstop can access them)
  const PLAY_ICON = `<path d="M2.5 2l8 4-8 4V2z"/>`;
  const PAUSE_ICON = `<rect x="1.5" y="1" width="3.5" height="10" rx="1"/><rect x="7" y="1" width="3.5" height="10" rx="1"/>`;

  let isPaused = false;

  function setPlayState() {
    playBtn.dataset.state = "play";
    playPauseIcon.innerHTML = PLAY_ICON;
    playPauseLabel.textContent = "Play";
  }

  function setPauseState() {
    playBtn.dataset.state = "pause";
    playPauseIcon.innerHTML = PAUSE_ICON;
    playPauseLabel.textContent = "Pause";
  }

  // Source tab switching
  tabUpload.addEventListener("click", () => {
    tabUpload.classList.add("is-active");
    tabRecord.classList.remove("is-active");
    uploadPanel.classList.remove("source-panel-hidden");
    recordPanel.classList.add("source-panel-hidden");
  });

  tabRecord.addEventListener("click", () => {
    tabRecord.classList.add("is-active");
    tabUpload.classList.remove("is-active");
    recordPanel.classList.remove("source-panel-hidden");
    uploadPanel.classList.add("source-panel-hidden");
  });

  // Recording state
  let mediaRecorder = null;
  let recordedChunks = [];
  let timerInterval = null;
  let elapsedSeconds = 0;
  let isRecording = false;
  let micStream = null;

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function startTimer() {
    elapsedSeconds = 0;
    recordTimer.textContent = "0:00";
    timerInterval = setInterval(() => {
      elapsedSeconds++;
      recordTimer.textContent = formatTime(elapsedSeconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  recordBtn.addEventListener("click", async () => {
    if (!isRecording) {
      // Start recording
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch {
        statusEl.textContent = "Microphone access denied.";
        return;
      }

      recordedChunks = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      mediaRecorder = mimeType ? new MediaRecorder(micStream, { mimeType }) : new MediaRecorder(micStream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        micStream.getTracks().forEach((t) => t.stop());
        micStream = null;

        const clipDuration = elapsedSeconds;
        const ext = mediaRecorder.mimeType.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
        const file = new File([blob], `recording.${ext}`, { type: blob.type });

        statusEl.textContent = "Loading recording…";
        isPaused = false;
        setPlayState();
        const ok = await window.FingerprintApp.loadAudioFromFile(file);
        if (ok) {
          // Show the recorded clip card
          recordedDuration.textContent = formatTime(clipDuration);
          recordBtn.style.display = "none";
          recordedCard.classList.remove("recorded-card-hidden");

          nowPlayingEl.textContent = "Loaded: microphone recording";
          window.FingerprintApp.play();
          setPauseState();
          setDotGenerating();
        }
      };

      mediaRecorder.start(250); // collect in 250ms chunks
      isRecording = true;
      startTimer();

      recordBtn.classList.add("is-recording");
      recordBtnLabel.textContent = "Stop Recording";
      statusEl.textContent = "Recording…";
    } else {
      // Stop recording
      isRecording = false;
      stopTimer();
      recordBtn.classList.remove("is-recording");
      recordBtnLabel.textContent = "Start Recording";
      recordTimer.textContent = "0:00";
      mediaRecorder.stop();
    }
  });

  recordedCard.addEventListener("click", () => {
    recordedCard.classList.add("recorded-card-hidden");
    recordBtn.style.display = "";
  });

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

    window.FingerprintApp.onStatus((msg) => {
      statusEl.textContent = msg;
      if (msg.startsWith("Finished")) {
        setDotFinished();
      } else if (msg === "Generating…") {
        setDotGenerating();
      } else if (msg === "Paused.") {
        setDotIdle();
      }
    });
    renderGallery();

    // default settings
    window.FingerprintApp.setStyle?.(currentStyle);
    bgToggle.checked = true;
    window.FingerprintApp.setLightBackground?.(true);

    audioFile.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      isPaused = false;
      setPlayState();
      setDotIdle();
      showFileInfo(file);
      const ok = await window.FingerprintApp.loadAudioFromFile(file);
      if (ok) nowPlayingEl.textContent = `Loaded: ${file.name}`;
    });

    playBtn.addEventListener("click", () => {
      if (playBtn.dataset.state === "pause") {
        window.FingerprintApp.pause();
        isPaused = true;
        setPlayState();
        setDotIdle();
      } else {
        if (isPaused) {
          window.FingerprintApp.resume();
        } else {
          window.FingerprintApp.play();
        }
        isPaused = false;
        setPauseState();
        setDotGenerating();
      }
    });

    window.FingerprintApp.onEnded(() => {
      setPlayState();
      isPaused = false;
      setDotFinished();
    });

    restartBtn.addEventListener("click", () => {
      window.FingerprintApp.play();
      setPauseState();
      setDotGenerating();
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
