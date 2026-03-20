// // sketch.js
// // 3 styles: Iris (classic), Ribbon Petals (wispy lanes), Bloom (dot bloom)
// // Light background toggle supported via setLightBackground(true/false)

// (() => {
//   const CFG = {
//     fftBins: 1024,
//     smoothing: 0.8,
//     binsToDraw: 600,
//     angleSpeed: 1.0,
//     gamma: 1.25,

//     // classic style base
//     satBase: 75,
//     satAmp: 20,
//     briBase: 35,
//     briAmp: 35,
//     briCap: 70,
//     alphaBase: 2,
//     alphaAmp: 10,
//     weightBase: 0.6,
//     weightAmp: 1.2,

//     jitterMin: -4,
//     jitterMax: 4,
//     jitterNoiseFreq: 0.01,
//     jitterTimeScale: 2.0,

//     lenBase: 6,
//     lenAmp: 40,

//     hueTimeScale: 0.25,
//     hueBinShift: 40
//   };

//   const state = {
//     soundFile: null,
//     fft: null,
//     started: false,
//     finished: false,
//     filename: "",
//     onStatus: () => {},
//     onEnded: () => {},

//     style: "iris",     // iris | ribbon | bloom
//     lightBg: false,    // boolean
//     seed: 12345
//   };

//   function mountSketch() {
//     const sketch = (p) => {
//       /* ---------- utils ---------- */

      

//       function avgEnergy(spectrum, start, end) {
//         let sum = 0;
//         let count = 0;
//         const e = Math.min(end, spectrum.length);
//         for (let i = Math.max(0, start); i < e; i++) {
//           sum += spectrum[i] || 0;
//           count++;
//         }
//         return count ? (sum / count) / 255 : 0;
//       }

//       function safeRadii() {
//         const half = Math.min(p.width, p.height) * 0.5;
//         const maxLen = CFG.lenBase + CFG.lenAmp;
//         const maxJitter = Math.max(Math.abs(CFG.jitterMin), Math.abs(CFG.jitterMax));
//         const maxStroke = CFG.weightBase + CFG.weightAmp;
//         const safetyPad = 10;

//         const safeOuter = half - (maxLen + maxJitter + maxStroke + safetyPad);
//         const safeInner = Math.max(18, safeOuter * 0.18);
//         return { safeInner, safeOuter };
//       }

//       function bgClear() {
//         if (state.lightBg) {
//           // soft warm-white canvas
//           p.background(45, 10, 98); // HSB: warm-ish near-white
//         } else {
//           p.background(0, 0, 4); // near-black
//         }
//       }

//       /* ---------- responsive ---------- */

//       function getContainerSize() {
//         const mount = document.getElementById("p5-mount");
//         const rect = mount.getBoundingClientRect();
//         const size = Math.floor(Math.min(rect.width, rect.height));
//         return Math.max(260, size);
//       }

//       function resizeToContainer() {
//         const s = getContainerSize();
//         p.resizeCanvas(s, s, true);
//         bgClear();
//       }

//       p.windowResized = () => resizeToContainer();

//       /* ---------- setup ---------- */

//       p.setup = () => {
//         const parent = document.getElementById("p5-mount");
//         const cnv = p.createCanvas(10, 10);
//         cnv.parent(parent);

//         p.pixelDensity(2);
//         p.angleMode(p.RADIANS);
//         p.colorMode(p.HSB, 360, 100, 100, 100);

//         resizeToContainer();
//         state.fft = new p5.FFT(CFG.smoothing, CFG.fftBins);
//       };

//       /* ---------- draw ---------- */

//       p.draw = () => {
//         if (!state.soundFile || !state.started || state.finished) return;

//         const spectrum = state.fft.analyze();
//         const dur = Math.max(0.001, state.soundFile.duration());
//         const tNorm = p.constrain(state.soundFile.currentTime() / dur, 0, 1);

//         const binCount = Math.min(CFG.binsToDraw, spectrum.length);
//         const bass = avgEnergy(spectrum, 2, 60);
//         const mids = avgEnergy(spectrum, 60, 220);
//         const highs = avgEnergy(spectrum, 220, binCount);

//         const { safeInner, safeOuter } = safeRadii();

//         p.push();
//         p.translate(p.width / 2, p.height / 2);

//         // gentle global motion
//         const baseRot = tNorm * p.TWO_PI * CFG.angleSpeed;
//         const wobbleRot = (p.noise(tNorm * 1.2, state.seed) - 0.5) * 0.6;
//         p.rotate(baseRot + wobbleRot);

//         // blend choice depends on background
//         // SCREEN on dark; MULTIPLY on light for richer color without blowing out
//         p.blendMode(state.lightBg ? p.MULTIPLY : p.SCREEN);

//         if (state.style === "iris") {
//           drawIris(p, spectrum, tNorm, safeInner, safeOuter);
//         } else if (state.style === "ribbon") {
//           // ✅ use your “last time” ribbon output
//           drawRibbonPetals(p, spectrum, tNorm, safeInner, safeOuter, bass, mids, highs, state.seed);
//         } else if (state.style === "bloom") {
//           drawBloom(p, spectrum, tNorm, safeInner, safeOuter, bass, mids, highs, state.seed);
//         }

//         p.pop();
//       };

//       /* ---------- helpers ---------- */

//       function clearCanvas() {
//         bgClear();
//       }

//       function finalize() {
//         state.finished = true;
//         state.started = false;

//         const { safeInner } = safeRadii();

//         p.push();
//         p.translate(p.width / 2, p.height / 2);

//         // // subtle inner glow (works on both backgrounds)
//         // p.blendMode(state.lightBg ? p.MULTIPLY : p.SCREEN);
//         // p.noStroke();
//         // for (let i = 0; i < 40; i++) {
//         //   p.fill(200, 40, state.lightBg ? 60 : 40, 1.1);
//         //   p.circle(0, 0, safeInner * 2 + i * 4);
//         // }

//         // // center hole: dark dot even on light bg
//         // p.blendMode(p.BLEND);
//         // p.noStroke();
//         // p.fill(0, 0, 0, 100);
//         // p.circle(0, 0, safeInner * 2);

//         p.pop();

//         state.onStatus("Finished. Add to gallery or save image.");
//         state.onEnded();
//       }

//       /* ---------- API ---------- */

//       window.FingerprintApp = {
//         async loadAudioFromFile(file) {
//           if (!file || !file.type.startsWith("audio/")) {
//             state.onStatus("Please upload an audio file (mp3, wav, ogg).");
//             return false;
//           }

//           if (state.soundFile) state.soundFile.stop();

//           clearCanvas();
//           state.started = false;
//           state.finished = false;

//           state.filename = file.name || "audio";
//           state.seed = (Date.now() % 100000) + Math.floor(Math.random() * 100000);

//           const url = URL.createObjectURL(file);

//           return new Promise((resolve) => {
//             state.soundFile = p.loadSound(
//               url,
//               () => {
//                 state.fft.setInput(state.soundFile);
//                 state.onStatus("Loaded. Press Play.");
//                 resolve(true);
//               },
//               () => {
//                 state.onStatus("Could not load audio.");
//                 resolve(false);
//               }
//             );
//           });
//         },

//         play() {
//           if (!state.soundFile) return;

//           p.userStartAudio();

//           clearCanvas();
//           state.started = true;
//           state.finished = false;

//           state.soundFile.stop();
//           state.soundFile.play();
//           state.soundFile.setLoop(false);

//           state.soundFile.onended(() => finalize());

//           state.onStatus("Generating…");
//         },

//         pause() {
//           if (state.soundFile?.isPlaying()) {
//             state.soundFile.pause();
//             state.onStatus("Paused.");
//           }
//         },

//         setStyle(style) {
//           state.style = (style === "ribbon" || style === "bloom") ? style : "iris";
//         },

//         setLightBackground(isLight) {
//           state.lightBg = !!isLight;
//           // if not actively drawing, reflect the background immediately
//           if (!state.started || state.finished) clearCanvas();
//         },

//         getFilename() {
//           return state.filename;
//         },

//         isFinished() {
//           return state.finished;
//         },

//         savePNGDataURL() {
//           const cnv = document.querySelector("#p5-mount canvas");
//           return cnv ? cnv.toDataURL("image/png") : null;
//         },

//         onStatus(fn) { state.onStatus = fn; },
//         onEnded(fn) { state.onEnded = fn; }
//       };

//       /* ---------- renderers ---------- */

//       function drawIris(p, spectrum, tNorm, safeInner, safeOuter) {
//         const binCount = Math.min(CFG.binsToDraw, spectrum.length);

//         for (let i = 0; i < binCount; i++) {
//           const r = p.map(i, 0, binCount - 1, safeInner, safeOuter);

//           let v = (spectrum[i] || 0) / 255.0;
//           v = Math.pow(v, CFG.gamma);

//           const noiseOffset = p.noise(i * CFG.jitterNoiseFreq, tNorm * CFG.jitterTimeScale);
//           const jitter = p.map(noiseOffset, 0, 1, CFG.jitterMin, CFG.jitterMax);

//           const len = CFG.lenBase + v * CFG.lenAmp;

//           const hueBase = (tNorm * 360 * CFG.hueTimeScale);
//           const hueShift = p.map(i, 0, binCount, -CFG.hueBinShift, CFG.hueBinShift);
//           const hue = (hueBase + hueShift + 360) % 360;

//           const saturation = CFG.satBase + v * CFG.satAmp;
//           let brightness = CFG.briBase + v * CFG.briAmp;
//           brightness = Math.min(brightness, CFG.briCap);

//           if (state.lightBg) brightness = Math.min(brightness + 10, 80);

//           const alpha = CFG.alphaBase + v * CFG.alphaAmp;

//           p.stroke(hue, saturation, brightness, alpha);
//           p.strokeWeight(CFG.weightBase + v * CFG.weightAmp);

//           p.line(r + jitter, 0, r + len + jitter, 0);
//         }
//       }

//       function drawBloom(p, spectrum, tNorm, safeInner, safeOuter, bass, mids, highs, seed) {
//         p.noStroke();

//         const binCount = Math.min(CFG.binsToDraw, spectrum.length);
//         const dots = 1100;

//         const dotBase = 0.9 + bass * 2.8;

//         for (let k = 0; k < dots; k++) {
//           const i = Math.floor((p.noise(k * 0.02, seed) * 0.999) * (binCount - 1));

//           let v = (spectrum[i] || 0) / 255.0;
//           v = Math.pow(v, 1.4);

//           const bias = Math.pow(p.noise(k * 0.03, tNorm * 0.8), 1.8);
//           const r0 = p.lerp(safeInner, safeOuter, bias);

//           const warp = (p.noise(i * 0.02, tNorm * 2.2, seed) - 0.5);
//           const r = r0 + warp * (18 + mids * 28) + v * 26;

//           const a =
//             (k / dots) * p.TWO_PI +
//             (p.noise(k * 0.01, tNorm * 1.6) - 0.5) * (0.9 + highs * 1.2);

//           const x = Math.cos(a) * r;
//           const y = Math.sin(a) * r;

//           const hue = (tNorm * 90 + i * 0.12 + 320) % 360;
//           const sat = 55 + v * 35;
//           const bri = Math.min(65 + v * 25, 90);
//           const alpha = 2.0 + v * 10.0;

//           p.fill(hue, sat, bri, alpha);

//           const s = dotBase + v * 2.4 + (p.noise(k * 0.04, tNorm * 2.0) * 0.8);
//           p.circle(x, y, s);
//         }
//       }

//       // // ✅ Your “last time” Ribbon Petals renderer (lane ribbons)
//       // function drawRibbonPetals(p, spectrum, tNorm, safeInner, safeOuter, bass, mids, highs, seed) {
//       //   p.blendMode(p.SCREEN);
//       //   p.noFill();

//       //   const ribbons = 7;
//       //   const windowFrac = 0.16;
//       //   const gapFrac = 0.07;
//       //   const steps = 240;

//       //   // spacing lanes
//       //   const lanesSpan = (safeOuter - safeInner) * 0.55;
//       //   const laneStart = safeInner + (safeOuter - safeInner) * 0.22;
//       //   const laneGap = lanesSpan / Math.max(1, (ribbons - 1));

//       //   const laneWobble = 8 + bass * 18 + mids * 10;

//       //   const w = 0.5 + bass * 0.7;
//       //   const strands = 2;
//       //   const alphaBase = 0.9;
//       //   const alphaAmp = 1.6;

//       //   const timeThrottle = 1.0 - 0.50 * Math.pow(tNorm, 1.1);

//       //   const overall = p.constrain((bass * 0.45 + mids * 0.40 + highs * 0.35), 0, 1);

//       //   const warmHue = 20;
//       //   const coolHue = 300;
//       //   const hueMix = p.constrain(highs * 0.75 + (1 - bass) * 0.25, 0, 1);
//       //   const hueTarget = p.lerp(warmHue, coolHue, hueMix);

//       //   const sat = 45 + mids * 45;
//       //   const bri = Math.min(48 + overall * 28, 78);

//       //   for (let j = 0; j < ribbons; j++) {
//       //     const start = j * (windowFrac + gapFrac);
//       //     const end = start + windowFrac;
//       //     if (tNorm < start) continue;
//       //     if (start > 1) break;

//       //     const prog = p.constrain((tNorm - start) / Math.max(0.0001, (end - start)), 0, 1);
//       //     const arc = prog * p.TWO_PI;

//       //     const laneR = laneStart + j * laneGap;

//       //     const hueDrift = (p.noise(seed + j * 9, tNorm * 1.4) - 0.5) * 60;
//       //     const hue = (hueTarget + hueDrift + j * 10 + 360) % 360;

//       //     const headSoft = p.constrain(prog / 0.12, 0, 1);
//       //     const a = (alphaBase + overall * alphaAmp) * timeThrottle * (0.55 + 0.45 * headSoft);

//       //     p.stroke(hue, sat, bri, a);
//       //     p.strokeWeight(w);

//       //     const drift = j * 0.75 + (p.noise(seed + j * 20, 10.0) - 0.5) * 0.35;

//       //     for (let k = 0; k < strands; k++) {
//       //       const fiber = (k - (strands - 1) / 2) * (2.2 + mids * 2.0);

//       //       p.beginShape();

//       //       const N = Math.max(3, Math.floor(steps * prog));
//       //       for (let s = 0; s <= N; s++) {
//       //         const ang = (s / steps) * p.TWO_PI;
//       //         if (ang > arc) break;

//       //         const n1 = p.noise(
//       //           Math.cos(ang) * 0.9 + j * 0.45,
//       //           Math.sin(ang) * 0.9 + tNorm * 1.15,
//       //           seed + 99 + k * 7
//       //         );
//       //         const n2 = p.noise(
//       //           Math.cos(ang) * 1.7 + j * 0.22,
//       //           Math.sin(ang) * 1.7 + tNorm * 1.75,
//       //           seed + 199 + k * 7
//       //         );

//       //         const angWob = (n1 - 0.5) * (0.06 + bass * 0.18);
//       //         const rWob = (n2 - 0.5) * laneWobble;

//       //         const r =
//       //           laneR +
//       //           rWob +
//       //           Math.sin(ang * 2.6 + drift) * (4 + mids * 10) +
//       //           fiber;

//       //         const x = Math.cos(ang + drift + angWob) * r;
//       //         const y = Math.sin(ang + drift + angWob) * r;

//       //         p.curveVertex(x, y);
//       //       }

//       //       p.endShape();
//       //     }
//       //   }
//       // }

//       function drawRibbonPetals(p, spectrum, tNorm, safeInner, safeOuter, bass, mids, highs, seed) {
//         // Sequential clockwise ribbons with dramatic spacing + audio-driven color
//         // Light-bg support: use MULTIPLY (instead of SCREEN) + stronger alpha/brightness.
      
//         // ✅ blend mode that works on both backgrounds
//         if (state.lightBg) {
//           p.blendMode(p.MULTIPLY);
//         } else {
//           p.blendMode(p.SCREEN);
//         }
      
//         p.noFill();
      
//         const ribbons = 7;
//         const windowFrac = 0.16;
//         const gapFrac = 0.07;
//         const steps = 240;
      
//         // lanes
//         const lanesSpan = (safeOuter - safeInner) * 0.55;
//         const laneStart = safeInner + (safeOuter - safeInner) * 0.22;
//         const laneGap = lanesSpan / Math.max(1, (ribbons - 1));
      
//         const laneWobble = 8 + bass * 18 + mids * 10;
      
//         // stroke feel
//         const w = 0.55 + bass * 0.85; // slightly thicker so it reads on light bg
//         const strands = 2;
      
//         // ✅ alpha tuned for both backgrounds
//         const alphaBase = state.lightBg ? 2.0 : 0.9;
//         const alphaAmp  = state.lightBg ? 3.2 : 1.6;
      
//         // throttle over time
//         const timeThrottle = 1.0 - 0.50 * Math.pow(tNorm, 1.1);
      
//         // audio → color
//         const overall = p.constrain((bass * 0.45 + mids * 0.40 + highs * 0.35), 0, 1);
      
//         const warmHue = 20;
//         const coolHue = 300;
//         const hueMix = p.constrain(highs * 0.75 + (1 - bass) * 0.25, 0, 1);
//         const hueTarget = p.lerp(warmHue, coolHue, hueMix);
      
//         const sat = state.lightBg ? (55 + mids * 40) : (45 + mids * 45);
      
//         // ✅ raise brightness on light bg + clamp to avoid washout
//         let bri = state.lightBg
//           ? Math.min(72 + overall * 18, 92)
//           : Math.min(48 + overall * 28, 78);
      
//         for (let j = 0; j < ribbons; j++) {
//           const start = j * (windowFrac + gapFrac);
//           const end = start + windowFrac;
//           if (tNorm < start) continue;
//           if (start > 1) break;
      
//           const prog = p.constrain((tNorm - start) / Math.max(0.0001, (end - start)), 0, 1);
//           const arc = prog * p.TWO_PI;
      
//           const laneR = laneStart + j * laneGap;
      
//           const hueDrift = (p.noise(seed + j * 9, tNorm * 1.4) - 0.5) * 60;
//           const hue = (hueTarget + hueDrift + j * 10 + 360) % 360;
      
//           // taper head
//           const headSoft = p.constrain(prog / 0.12, 0, 1);
//           const a = (alphaBase + overall * alphaAmp) * timeThrottle * (0.55 + 0.45 * headSoft);
      
//           p.stroke(hue, sat, bri, a);
//           p.strokeWeight(w);
      
//           const drift = j * 0.75 + (p.noise(seed + j * 20, 10.0) - 0.5) * 0.35;
      
//           for (let k = 0; k < strands; k++) {
//             const fiber = (k - (strands - 1) / 2) * (2.2 + mids * 2.0);
      
//             p.beginShape();
      
//             const N = Math.max(3, Math.floor(steps * prog));
//             for (let s = 0; s <= N; s++) {
//               const ang = (s / steps) * p.TWO_PI;
//               if (ang > arc) break;
      
//               const n1 = p.noise(
//                 Math.cos(ang) * 0.9 + j * 0.45,
//                 Math.sin(ang) * 0.9 + tNorm * 1.15,
//                 seed + 99 + k * 7
//               );
//               const n2 = p.noise(
//                 Math.cos(ang) * 1.7 + j * 0.22,
//                 Math.sin(ang) * 1.7 + tNorm * 1.75,
//                 seed + 199 + k * 7
//               );
      
//               const angWob = (n1 - 0.5) * (0.06 + bass * 0.18);
//               const rWob = (n2 - 0.5) * laneWobble;
      
//               const r =
//                 laneR +
//                 rWob +
//                 Math.sin(ang * 2.6 + drift) * (4 + mids * 10) +
//                 fiber;
      
//               const x = Math.cos(ang + drift + angWob) * r;
//               const y = Math.sin(ang + drift + angWob) * r;
      
//               p.curveVertex(x, y);
//             }
      
//             p.endShape();
//           }
//         }
//       }
//     };

//     new p5(sketch);
//   }

//   window.addEventListener("DOMContentLoaded", mountSketch);
// })();




// sketch.js
// 3 styles: Iris (classic), Ribbon Petals (wispy lanes), Bloom (dot bloom)
// Light background toggle supported via setLightBackground(true/false)
// Adds a subtle grain texture to the canvas background (paper/print feel)

(() => {
  const CFG = {
    fftBins: 1024,
    smoothing: 0.8,
    binsToDraw: 600,
    angleSpeed: 1.0,
    gamma: 1.25,

    // classic style base
    satBase: 75,
    satAmp: 20,
    briBase: 35,
    briAmp: 35,
    briCap: 70,
    alphaBase: 2,
    alphaAmp: 10,
    weightBase: 0.6,
    weightAmp: 1.2,

    jitterMin: -4,
    jitterMax: 4,
    jitterNoiseFreq: 0.01,
    jitterTimeScale: 2.0,

    lenBase: 6,
    lenAmp: 40,

    hueTimeScale: 0.25,
    hueBinShift: 40
  };

  const state = {
    soundFile: null,
    fft: null,
    started: false,
    finished: false,
    paused: false,
    pauseTime: 0,
    filename: "",
    onStatus: () => {},
    onEnded: () => {},

    style: "iris",     // iris | ribbon | bloom
    lightBg: true,    // boolean
    seed: 12345
  };

  function mountSketch() {
    const sketch = (p) => {
      // ----- grain texture -----
      let grainLayer = null;
      let lastGrainSize = 0;

      // function buildGrainLayer(size) {
      //   grainLayer = p.createGraphics(size, size);
      //   grainLayer.pixelDensity(1);
      //   grainLayer.loadPixels();

      //   for (let y = 0; y < size; y++) {
      //     for (let x = 0; x < size; x++) {
      //       const idx = 4 * (y * size + x);
      //       const n = Math.floor(p.random(0, 255));
      //       grainLayer.pixels[idx + 0] = n;
      //       grainLayer.pixels[idx + 1] = n;
      //       grainLayer.pixels[idx + 2] = n;
      //       grainLayer.pixels[idx + 3] = 255;
      //     }
      //   }

      //   grainLayer.updatePixels();
      //   lastGrainSize = size;
      // }

      function buildGrainLayer(size) {
        grainLayer = p.createGraphics(size, size);
        grainLayer.pixelDensity(1);
        grainLayer.loadPixels();
      
        // Speck tuning
        const speckChance = 0.012; // ~1.2% pixels eligible
        const speckGate = 0.58;    // noise gate for clustered specks
      
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const i = 4 * (y * size + x);
      
            const u = x / size;
            const v = y / size;
      
            // --- fibers: multi-scale noise ---
            const n1 = p.noise(u * 3.0, v * 3.0);
            const n2 = p.noise(u * 14.0, v * 6.0);
            const fiber = 0.65 * n1 + 0.35 * n2; // 0..1
      
            // map to subtle gray (centered around ~128)
            let g = 128 + (fiber - 0.5) * 34; // fiber strength (try 26–44)
      
            // --- specks: sparse dark/light freckles ---
            if (p.random() < speckChance) {
              const gate = p.noise(u * 24, v * 24);
              if (gate > speckGate) {
                const dir = p.random() < 0.75 ? -1 : 1; // mostly dark specks
                g += dir * (12 + p.random() * 26);
              }
            }
      
            g = Math.max(0, Math.min(255, Math.round(g)));
      
            grainLayer.pixels[i + 0] = g;
            grainLayer.pixels[i + 1] = g;
            grainLayer.pixels[i + 2] = g;
            grainLayer.pixels[i + 3] = 255;
          }
        }
      
        grainLayer.updatePixels();
        lastGrainSize = size;
      }

      /* ---------- utils ---------- */

      function avgEnergy(spectrum, start, end) {
        let sum = 0;
        let count = 0;
        const e = Math.min(end, spectrum.length);
        for (let i = Math.max(0, start); i < e; i++) {
          sum += spectrum[i] || 0;
          count++;
        }
        return count ? (sum / count) / 255 : 0;
      }

      function safeRadii() {
        const half = Math.min(p.width, p.height) * 0.5;
        const maxLen = CFG.lenBase + CFG.lenAmp;
        const maxJitter = Math.max(Math.abs(CFG.jitterMin), Math.abs(CFG.jitterMax));
        const maxStroke = CFG.weightBase + CFG.weightAmp;
        const safetyPad = 10;

        const safeOuter = half - (maxLen + maxJitter + maxStroke + safetyPad);
        const safeInner = Math.max(18, safeOuter * 0.18);
        return { safeInner, safeOuter };
      }

      // function bgClear() {
      //   // base "paper"
      //   if (state.lightBg) {
      //     // warm paper
      //     p.background(45, 10, 98); // HSB
      //   } else {
      //     // near-black paper
      //     p.background(0, 0, 4);    // HSB
      //   }

      //   // grain overlay (printed texture)
      //   if (grainLayer) {
      //     p.push();
      //     p.blendMode(p.OVERLAY);
      //     p.tint(255, state.lightBg ? 28 : 32); // grain strength
      //     // draw centered since we clear in world coords
      //     p.image(grainLayer, 0, 0, p.width, p.height);
      //     p.pop();
      //   }
      // }

      function bgClear() {
        if (state.lightBg) {
          p.background(45, 10, 98);
        } else {
          p.background(0, 0, 4);
        }
      
        if (grainLayer) {
          p.push();
          p.blendMode(p.OVERLAY);                 // ✅ paper-like
          p.tint(255, state.lightBg ? 22 : 16);   // ✅ stronger on light, lighter on dark
          p.image(grainLayer, 0, 0, p.width, p.height);
          p.pop();
        }
      }

      /* ---------- responsive ---------- */

      function getContainerSize() {
        const mount = document.getElementById("p5-mount");
        const rect = mount.getBoundingClientRect();
        const size = Math.floor(Math.min(rect.width, rect.height));
        return Math.max(260, size);
      }

      function resizeToContainer() {
        const s = getContainerSize();
        p.resizeCanvas(s, s, true);

        if (!grainLayer || lastGrainSize !== s) {
          buildGrainLayer(s);
        }

        bgClear();
      }

      p.windowResized = () => resizeToContainer();

      /* ---------- setup ---------- */

      p.setup = () => {
        const parent = document.getElementById("p5-mount");
        const cnv = p.createCanvas(10, 10);
        cnv.parent(parent);

        p.pixelDensity(2);
        p.angleMode(p.RADIANS);
        p.colorMode(p.HSB, 360, 100, 100, 100);

        resizeToContainer();
        state.fft = new p5.FFT(CFG.smoothing, CFG.fftBins);
      };

      /* ---------- draw ---------- */

      p.draw = () => {
        if (!state.soundFile || !state.started || state.finished) return;

        const spectrum = state.fft.analyze();
        const dur = Math.max(0.001, state.soundFile.duration());
        const tNorm = p.constrain(state.soundFile.currentTime() / dur, 0, 1);

        const binCount = Math.min(CFG.binsToDraw, spectrum.length);
        const bass = avgEnergy(spectrum, 2, 60);
        const mids = avgEnergy(spectrum, 60, 220);
        const highs = avgEnergy(spectrum, 220, binCount);

        const { safeInner, safeOuter } = safeRadii();

        p.push();
        p.translate(p.width / 2, p.height / 2);

        // gentle global motion
        const baseRot = tNorm * p.TWO_PI * CFG.angleSpeed;
        const wobbleRot = (p.noise(tNorm * 1.2, state.seed) - 0.5) * 0.6;
        p.rotate(baseRot + wobbleRot);

        // default blend for drawing depends on background
        p.blendMode(state.lightBg ? p.MULTIPLY : p.SCREEN);

        if (state.style === "iris") {
          drawIris(p, spectrum, tNorm, safeInner, safeOuter);
        } else if (state.style === "ribbon") {
          drawRibbonPetals(p, spectrum, tNorm, safeInner, safeOuter, bass, mids, highs, state.seed);
        } else if (state.style === "bloom") {
          drawBloom(p, spectrum, tNorm, safeInner, safeOuter, bass, mids, highs, state.seed);
        }

        p.pop();
      };

      /* ---------- helpers ---------- */

      function clearCanvas() {
        bgClear();
      }

      let playGen = 0;

      function finalize(gen) {
        // Ignore stale onended from a previous play/stop cycle
        if (gen !== playGen) return;
        if (state.paused) return;

        state.finished = true;
        state.started = false;

        const { safeInner } = safeRadii();

        p.push();
        p.translate(p.width / 2, p.height / 2);

        // // subtle inner glow
        // p.blendMode(state.lightBg ? p.MULTIPLY : p.SCREEN);
        // p.noStroke();
        // for (let i = 0; i < 40; i++) {
        //   p.fill(200, 40, state.lightBg ? 60 : 40, 1.1);
        //   p.circle(0, 0, safeInner * 2 + i * 4);
        // }

        // // center hole
        // p.blendMode(p.BLEND);
        // p.noStroke();
        // p.fill(0, 0, 0, 100);
        // p.circle(0, 0, safeInner * 2);

        p.pop();

        state.onStatus("Finished. Add to gallery or save image.");
        state.onEnded();
      }

      /* ---------- API ---------- */

      window.FingerprintApp = {
        async loadAudioFromFile(file) {
          if (!file || !file.type.startsWith("audio/")) {
            state.onStatus("Please upload an audio file (mp3, wav, ogg).");
            return false;
          }

          if (state.soundFile) state.soundFile.stop();

          clearCanvas();
          state.started = false;
          state.finished = false;

          state.filename = file.name || "audio";
          state.seed = (Date.now() % 100000) + Math.floor(Math.random() * 100000);

          const url = URL.createObjectURL(file);

          return new Promise((resolve) => {
            state.soundFile = p.loadSound(
              url,
              () => {
                state.fft.setInput(state.soundFile);
                state.onStatus("Loaded. Press Play.");
                resolve(true);
              },
              () => {
                state.onStatus("Could not load audio.");
                resolve(false);
              }
            );
          });
        },

        play() {
          if (!state.soundFile) return;

          p.userStartAudio();

          clearCanvas();
          state.started = true;
          state.finished = false;
          state.paused = false;
          state.pauseTime = 0;

          const gen = ++playGen;

          state.soundFile.stop();
          state.soundFile.play();
          state.soundFile.setLoop(false);

          state.soundFile.onended(() => finalize(gen));

          state.onStatus("Generating…");
        },

        pause() {
          if (state.soundFile?.isPlaying()) {
            state.paused = true;
            state.pauseTime = state.soundFile.currentTime();
            state.soundFile.pause();
            state.onStatus("Paused.");
          }
        },

        resume() {
          if (!state.soundFile) return;
          state.paused = false;
          state.finished = false;
          state.started = true;
          p.userStartAudio();
          const gen = ++playGen;
          state.soundFile.play(0, 1, 1, state.pauseTime);
          state.soundFile.onended(() => finalize(gen));
          state.onStatus("Generating…");
        },

        setStyle(style) {
          state.style = (style === "ribbon" || style === "bloom") ? style : "iris";
        },

        setLightBackground(isLight) {
          state.lightBg = !!isLight;
          if (!state.started || state.finished) clearCanvas();
        },

        getFilename() {
          return state.filename;
        },

        isFinished() {
          return state.finished;
        },

        savePNGDataURL() {
          const cnv = document.querySelector("#p5-mount canvas");
          return cnv ? cnv.toDataURL("image/png") : null;
        },

        onStatus(fn) { state.onStatus = fn; },
        onEnded(fn) { state.onEnded = fn; }
      };

      /* ---------- renderers ---------- */

      function drawIris(p, spectrum, tNorm, safeInner, safeOuter) {
        const binCount = Math.min(CFG.binsToDraw, spectrum.length);

        for (let i = 0; i < binCount; i++) {
          const r = p.map(i, 0, binCount - 1, safeInner, safeOuter);

          let v = (spectrum[i] || 0) / 255.0;
          v = Math.pow(v, CFG.gamma);

          const noiseOffset = p.noise(i * CFG.jitterNoiseFreq, tNorm * CFG.jitterTimeScale);
          const jitter = p.map(noiseOffset, 0, 1, CFG.jitterMin, CFG.jitterMax);

          const len = CFG.lenBase + v * CFG.lenAmp;

          const hueBase = (tNorm * 360 * CFG.hueTimeScale);
          const hueShift = p.map(i, 0, binCount, -CFG.hueBinShift, CFG.hueBinShift);
          const hue = (hueBase + hueShift + 360) % 360;

          const saturation = CFG.satBase + v * CFG.satAmp;
          let brightness = CFG.briBase + v * CFG.briAmp;
          brightness = Math.min(brightness, CFG.briCap);

          if (state.lightBg) brightness = Math.min(brightness + 10, 80);

          const alpha = CFG.alphaBase + v * CFG.alphaAmp;

          p.stroke(hue, saturation, brightness, alpha);
          p.strokeWeight(CFG.weightBase + v * CFG.weightAmp);

          p.line(r + jitter, 0, r + len + jitter, 0);
        }
      }

      // function drawBloom(p, spectrum, tNorm, safeInner, safeOuter, bass, mids, highs, seed) {
      //   p.noStroke();

      //   const binCount = Math.min(CFG.binsToDraw, spectrum.length);
      //   const dots = 1100;

      //   const dotBase = 0.9 + bass * 2.8;

      //   for (let k = 0; k < dots; k++) {
      //     const i = Math.floor((p.noise(k * 0.02, seed) * 0.999) * (binCount - 1));

      //     let v = (spectrum[i] || 0) / 255.0;
      //     v = Math.pow(v, 1.4);

      //     const bias = Math.pow(p.noise(k * 0.03, tNorm * 0.8), 1.8);
      //     const r0 = p.lerp(safeInner, safeOuter, bias);

      //     const warp = (p.noise(i * 0.02, tNorm * 2.2, seed) - 0.5);
      //     const r = r0 + warp * (18 + mids * 28) + v * 26;

      //     const a =
      //       (k / dots) * p.TWO_PI +
      //       (p.noise(k * 0.01, tNorm * 1.6) - 0.5) * (0.9 + highs * 1.2);

      //     const x = Math.cos(a) * r;
      //     const y = Math.sin(a) * r;

      //     const hue = (tNorm * 90 + i * 0.12 + 320) % 360;
      //     const sat = 55 + v * 35;
      //     const bri = Math.min(65 + v * 25, 90);
      //     const alpha = 2.0 + v * 10.0;

      //     p.fill(hue, sat, bri, alpha);

      //     const s = dotBase + v * 2.4 + (p.noise(k * 0.04, tNorm * 2.0) * 0.8);
      //     p.circle(x, y, s);
      //   }
      // }

      function drawBloom(p, spectrum, tNorm, safeInner, safeOuter, bass, mids, highs, seed) {
        // Bloom (original feel) — fixed density/overexposure
        // Keeps: organic cloud distribution (no lanes)
        // Fixes: fewer dots + alpha/brightness caps + time throttling + energy gating
      
        // Use your existing background toggle variable
        const lightBg = state.lightBg;
      
        // Bloom looks best as additive on dark, multiply/screen-ish on light
        p.blendMode(lightBg ? p.MULTIPLY : p.SCREEN);
        p.noStroke();
      
        const binCount = Math.min(CFG.binsToDraw, spectrum.length);
      
        // --- time throttling (most important) ---
        // Starts strong, then quickly reduces new ink so it doesn't "fill in"
        const timeThrottle = 1.0 - 0.78 * Math.pow(tNorm, 1.18); // 1.0 -> ~0.22
        const energy = p.constrain(bass * 0.45 + mids * 0.40 + highs * 0.35, 0, 1);
      
        // Dots per frame: much lower, and reduces over time
        const dots = Math.floor((170 + energy * 230) * timeThrottle); // ~170–400 early, ~40–90 late
        if (dots <= 0) return;
      
        // --- magnitude shaping ---
        const magGamma = 1.55;
      
        // --- controls that prevent overexposure ---
        const alphaBase = lightBg ? 1.1 : 0.85;
        const alphaAmp  = lightBg ? 2.2 : 1.7;
        const alphaCap  = lightBg ? 3.0 : 2.2;
      
        const satBase = lightBg ? 50 : 55;
        const satAmp  = 28;
      
        const briBase = lightBg ? 66 : 52;
        const briAmp  = lightBg ? 18 : 24;
        const briCap  = lightBg ? 86 : 78;
      
        // Skip very low magnitudes so we don't paint "noise haze" everywhere
        const vMin = 0.06; // raise for even cleaner
      
        // Dot size: slightly larger and softer so it reads as a bloom, not glitter
        const dotBase = 0.95 + bass * 1.9;
        const dotAmp  = 2.8;
      
        // Hue: keep your bloom's original colorful feel but less likely to hit white
        const hueBase = (tNorm * 360 * 0.22); // slow drift
        const hueSpan = 140;                  // narrower palette reduces harsh mixtures
      
        for (let k = 0; k < dots; k++) {
          // pick bins with noise so distribution stays organic
          const i = Math.floor(p.noise(seed + k * 0.03, tNorm * 1.25) * (binCount - 1));
          let v = (spectrum[i] || 0) / 255.0;
          v = Math.pow(v, magGamma);
          if (v < vMin) continue;
      
          // --- original bloom distribution (no rings) ---
          // Bias radius outward but still allow interior points:
          // Using pow(noise, exponent) creates a "cloudy" distribution without lane banding.
          const radialNoise = p.noise(seed + 100 + k * 0.02, tNorm * 0.9);
          const radialBias = Math.pow(radialNoise, 1.65); // 1.0 = uniform, >1 pushes outward
          const r = p.lerp(safeInner, safeOuter, radialBias) + (p.noise(seed + 200 + i * 0.02, tNorm * 2.0) - 0.5) * (12 + mids * 18);
      
          // angle: mainly random-ish, with a subtle swirl so it feels alive
          const aBase = p.noise(seed + 300 + k * 0.02, tNorm * 1.4) * p.TWO_PI;
          const swirl = (p.noise(seed + 400 + i * 0.03, tNorm * 1.0) - 0.5) * (0.8 + highs * 1.1);
          const a = aBase + swirl;
      
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
      
          // color
          const hueShift = p.map(i, 0, binCount - 1, -hueSpan * 0.5, hueSpan * 0.5);
          const hue = (hueBase + hueShift + 360) % 360;
      
          const sat = satBase + v * satAmp;
      
          let bri = briBase + energy * briAmp + v * 14;
          bri = Math.min(bri, briCap);
      
          // alpha: capped + throttled
          let alpha = (alphaBase + v * alphaAmp) * timeThrottle;
          alpha = Math.min(alpha, alphaCap);
      
          p.fill(hue, sat, bri, alpha);
      
          // size + slight jitter per dot for softness
          const sizeJ = (p.noise(seed + 500 + k * 0.05, tNorm * 1.6) - 0.5) * 0.6;
          const s = dotBase + v * dotAmp + sizeJ;
      
          p.circle(x, y, s);
        }
      }

      // Ribbon Petals (lane ribbons) — tuned to show on both dark + light backgrounds
      function drawRibbonPetals(p, spectrum, tNorm, safeInner, safeOuter, bass, mids, highs, seed) {
        // blend mode that works on both backgrounds
        if (state.lightBg) {
          p.blendMode(p.MULTIPLY);
        } else {
          p.blendMode(p.SCREEN);
        }

        p.noFill();

        const ribbons = 7;
        const windowFrac = 0.16;
        const gapFrac = 0.07;
        const steps = 240;

        const lanesSpan = (safeOuter - safeInner) * 0.55;
        const laneStart = safeInner + (safeOuter - safeInner) * 0.22;
        const laneGap = lanesSpan / Math.max(1, (ribbons - 1));

        const laneWobble = 8 + bass * 18 + mids * 10;

        const w = 0.55 + bass * 0.85;
        const strands = 2;

        const alphaBase = state.lightBg ? 2.0 : 0.9;
        const alphaAmp  = state.lightBg ? 3.2 : 1.6;

        const timeThrottle = 1.0 - 0.50 * Math.pow(tNorm, 1.1);

        const overall = p.constrain((bass * 0.45 + mids * 0.40 + highs * 0.35), 0, 1);

        const warmHue = 20;
        const coolHue = 300;
        const hueMix = p.constrain(highs * 0.75 + (1 - bass) * 0.25, 0, 1);
        const hueTarget = p.lerp(warmHue, coolHue, hueMix);

        const sat = state.lightBg ? (55 + mids * 40) : (45 + mids * 45);

        const bri = state.lightBg
          ? Math.min(72 + overall * 18, 92)
          : Math.min(48 + overall * 28, 78);

        for (let j = 0; j < ribbons; j++) {
          const start = j * (windowFrac + gapFrac);
          const end = start + windowFrac;
          if (tNorm < start) continue;
          if (start > 1) break;

          const prog = p.constrain((tNorm - start) / Math.max(0.0001, (end - start)), 0, 1);
          const arc = prog * p.TWO_PI;

          const laneR = laneStart + j * laneGap;

          const hueDrift = (p.noise(seed + j * 9, tNorm * 1.4) - 0.5) * 60;
          const hue = (hueTarget + hueDrift + j * 10 + 360) % 360;

          const headSoft = p.constrain(prog / 0.12, 0, 1);
          const a = (alphaBase + overall * alphaAmp) * timeThrottle * (0.55 + 0.45 * headSoft);

          p.stroke(hue, sat, bri, a);
          p.strokeWeight(w);

          const drift = j * 0.75 + (p.noise(seed + j * 20, 10.0) - 0.5) * 0.35;

          for (let k = 0; k < strands; k++) {
            const fiber = (k - (strands - 1) / 2) * (2.2 + mids * 2.0);

            p.beginShape();

            const N = Math.max(3, Math.floor(steps * prog));
            for (let s = 0; s <= N; s++) {
              const ang = (s / steps) * p.TWO_PI;
              if (ang > arc) break;

              const n1 = p.noise(
                Math.cos(ang) * 0.9 + j * 0.45,
                Math.sin(ang) * 0.9 + tNorm * 1.15,
                seed + 99 + k * 7
              );
              const n2 = p.noise(
                Math.cos(ang) * 1.7 + j * 0.22,
                Math.sin(ang) * 1.7 + tNorm * 1.75,
                seed + 199 + k * 7
              );

              const angWob = (n1 - 0.5) * (0.06 + bass * 0.18);
              const rWob = (n2 - 0.5) * laneWobble;

              const r =
                laneR +
                rWob +
                Math.sin(ang * 2.6 + drift) * (4 + mids * 10) +
                fiber;

              const x = Math.cos(ang + drift + angWob) * r;
              const y = Math.sin(ang + drift + angWob) * r;

              p.curveVertex(x, y);
            }

            p.endShape();
          }
        }
      }
    };

    new p5(sketch);
  }

  window.addEventListener("DOMContentLoaded", mountSketch);
})();
