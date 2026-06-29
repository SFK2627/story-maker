(() => {
  "use strict";

  const SIZES = {
    story: { width: 1080, height: 1920, label: "FB / IG Story", suffix: "story" },
    post: { width: 1080, height: 1350, label: "Original Post", suffix: "post" }
  };

  const PRESETS = {
    quick: {
      title: "SFK Quick Pic",
      caption: "A quick memory with Grade 8 - St. Faustina Kowalska. So far, so kind!",
      by: "Sir JR"
    },
    monday: {
      title: "Normal Monday with SFK",
      caption: "A simple Monday moment with St. Faustina Kowalska. #BeKind",
      by: "Sir JR"
    },
    online: {
      title: "Online Class with SFK",
      caption: "Very good attendance and participation from Grade 8 - St. Faustina Kowalska.",
      by: "Sir JR"
    },
    ict: {
      title: "ICT Class with SFK",
      caption: "Learning, creating, and growing together in ICT. #BeKind",
      by: "Sir JR"
    }
  };

  const state = {
    size: "story",
    photos: []
  };

  const els = {
    canvas: document.getElementById("shareCanvas"),
    title: document.getElementById("titleInput"),
    caption: document.getElementById("captionInput"),
    date: document.getElementById("dateInput"),
    postedBy: document.getElementById("postedByInput"),
    photoInput: document.getElementById("photoInput"),
    photoStrip: document.getElementById("photoStrip"),
    status: document.getElementById("statusPill"),
    toast: document.getElementById("toast"),
    previewSizeLabel: document.getElementById("previewSizeLabel"),
    downloadBtn: document.getElementById("downloadBtn"),
    shareBtn: document.getElementById("shareBtn"),
    resetBtn: document.getElementById("resetBtn")
  };

  const ctx = els.canvas.getContext("2d");
  let renderTimer = null;
  let toastTimer = null;

  function init() {
    els.date.value = formatDate(new Date());
    bindEvents();
    resizeCanvas();
    scheduleRender();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  function bindEvents() {
    [els.title, els.caption, els.date, els.postedBy].forEach((input) => {
      input.addEventListener("input", scheduleRender);
    });

    document.querySelectorAll(".presetBtn").forEach((button) => {
      button.addEventListener("click", () => applyPreset(button.dataset.preset));
    });

    document.querySelectorAll(".segment").forEach((button) => {
      button.addEventListener("click", () => setSize(button.dataset.size));
    });

    els.photoInput.addEventListener("change", handlePhotoInput);
    els.downloadBtn.addEventListener("click", downloadImage);
    els.shareBtn.addEventListener("click", shareImage);
    els.resetBtn.addEventListener("click", resetForm);
  }

  function applyPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;
    els.title.value = preset.title;
    els.caption.value = preset.caption;
    els.postedBy.value = preset.by;
    scheduleRender();
    showToast("Preset applied.");
  }

  function setSize(size) {
    if (!SIZES[size] || state.size === size) return;
    state.size = size;
    document.querySelectorAll(".segment").forEach((button) => {
      button.classList.toggle("active", button.dataset.size === size);
    });
    resizeCanvas();
    scheduleRender();
  }

  function resizeCanvas() {
    const { width, height, label } = SIZES[state.size];
    els.canvas.width = width;
    els.canvas.height = height;
    els.previewSizeLabel.textContent = label;
    els.canvas.style.aspectRatio = `${width} / ${height}`;
  }

  async function handlePhotoInput(event) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;

    setStatus("Loading photos...");
    try {
      const loaded = [];
      for (const file of files.slice(0, 12)) {
        loaded.push(await loadLocalPhoto(file));
      }
      state.photos.push(...loaded);
      renderPhotoStrip();
      scheduleRender();
      showToast(`${loaded.length} photo${loaded.length > 1 ? "s" : ""} added.`);
    } catch (error) {
      console.error(error);
      showToast("Unable to load one of the photos.");
    } finally {
      event.target.value = "";
      setStatus("Ready");
    }
  }

  function loadLocalPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("File read failed"));
      reader.onload = () => {
        const image = new Image();
        image.onload = () => resolve({
          name: file.name,
          dataUrl: reader.result,
          image,
          width: image.naturalWidth,
          height: image.naturalHeight
        });
        image.onerror = () => reject(new Error("Image decode failed"));
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderPhotoStrip() {
    if (!state.photos.length) {
      els.photoStrip.innerHTML = "";
      return;
    }
    els.photoStrip.innerHTML = state.photos.map((photo, index) => `
      <div class="photoTile">
        <img src="${photo.dataUrl}" alt="Selected photo ${index + 1}">
        <button class="removePhotoBtn" type="button" data-remove-photo="${index}" aria-label="Remove photo">×</button>
      </div>
    `).join("");
    els.photoStrip.querySelectorAll("[data-remove-photo]").forEach((button) => {
      button.addEventListener("click", () => {
        state.photos.splice(Number(button.dataset.removePhoto), 1);
        renderPhotoStrip();
        scheduleRender();
      });
    });
  }

  function resetForm() {
    els.title.value = "SFK Quick Pic";
    els.caption.value = "";
    els.date.value = formatDate(new Date());
    els.postedBy.value = "Sir JR";
    state.photos = [];
    renderPhotoStrip();
    scheduleRender();
    showToast("Reset done.");
  }

  function scheduleRender() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(render, 70);
  }

  function render() {
    if (!ctx) return;
    setStatus("Rendering...");
    const post = getPostData();
    drawShareCard(ctx, post, SIZES[state.size]);
    setStatus("Ready");
  }

  function getPostData() {
    return {
      title: cleanText(els.title.value) || "SFK Memory",
      caption: cleanText(els.caption.value),
      date: cleanText(els.date.value) || "Class Memory",
      postedBy: cleanText(els.postedBy.value) || "SFK",
      media: state.photos
    };
  }

  function drawShareCard(ctx, post, size) {
    const { width, height } = size;
    const isStory = height > 1500;
    drawShareBackground(ctx, width, height);

    // ClassBoard-style card layout. These fixed regions keep the header,
    // date pill, collage, details, author row, and footer from colliding.
    const cardX = isStory ? 42 : 34;
    const cardY = isStory ? 58 : 28;
    const cardW = width - cardX * 2;
    const cardH = height - cardY * 2;
    const margin = cardX + (isStory ? 44 : 38);
    const contentW = width - margin * 2;
    const headerY = cardY + (isStory ? 72 : 58);
    const mediaY = cardY + (isStory ? 258 : 192);
    const mediaH = isStory
      ? (post.media.length ? 980 : 900)
      : (post.media.length ? 690 : 620);
    const detailsY = mediaY + mediaH + (isStory ? 58 : 44);
    const footerOffset = isStory ? 166 : 108;

    ctx.save();
    ctx.shadowColor = "rgba(17,17,17,.16)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    roundRect(ctx, cardX, cardY, cardW, cardH, 42);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    roundRect(ctx, cardX, cardY, cardW, cardH, 42);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#181818";
    ctx.stroke();

    ctx.save();
    roundRect(ctx, cardX + 28, cardY + 26, cardW - 56, 6, 4);
    ctx.fillStyle = "#f7c600";
    ctx.globalAlpha = .96;
    ctx.fill();
    ctx.restore();

    drawHeader(ctx, post, margin, headerY, contentW);
    drawMedia(ctx, post, margin, mediaY, contentW, mediaH);
    drawDetails(ctx, post, margin, detailsY, contentW, post.media.length > 0, height, footerOffset);
    drawFooter(ctx, width, height, footerOffset);
  }

  function drawShareBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#fffdf3");
    gradient.addColorStop(0.52, "#fff8e2");
    gradient.addColorStop(1, "#f5d64e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#6f6642";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 54) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 54) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    let glow = ctx.createRadialGradient(width - 120, 100, 0, width - 120, 100, 320);
    glow.addColorStop(0, "rgba(255,255,255,.72)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(width - 120, 100, 320, 0, Math.PI * 2);
    ctx.fill();

    glow = ctx.createRadialGradient(70, height - 95, 0, 70, height - 95, 250);
    glow.addColorStop(0, "rgba(247,198,0,.22)");
    glow.addColorStop(1, "rgba(247,198,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(70, height - 95, 250, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHeader(ctx, post, x, y, width) {
    ctx.save();
    ctx.shadowColor = "rgba(17,17,17,.10)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, x, y, 138, 58, 22);
    ctx.fillStyle = "#111111";
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#f7c600";
    ctx.font = "900 31px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SFK", x + 69, y + 30);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const dateText = post.date || "Class Memory";
    ctx.font = "800 21px Arial, Helvetica, sans-serif";
    const dateW = Math.min(300, Math.max(176, ctx.measureText(dateText).width + 44));
    const dateX = x + width - dateW;
    const titleX = x + 162;
    const titleMaxW = Math.max(300, dateX - titleX - 24);

    ctx.fillStyle = "#111111";
    drawFittedText(ctx, "SFK Updates 🫶", titleX, y + 27, titleMaxW, 42, 32, "900");
    ctx.fillStyle = "#7a7568";
    ctx.font = "800 17px Arial, Helvetica, sans-serif";
    ctx.fillText("Grade 8 - St. Faustina Kowalska (SY '26-'27) • #BeKind", titleX + 1, y + 61);

    const dateY = y + 6;
    ctx.save();
    ctx.shadowColor = "rgba(17,17,17,.10)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, dateX, dateY, dateW, 48, 999);
    ctx.fillStyle = "#fff4b7";
    ctx.fill();
    ctx.restore();
    roundRect(ctx, dateX, dateY, dateW, 48, 999);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111111";
    ctx.stroke();
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 21px Arial, Helvetica, sans-serif";
    ctx.fillText(dateText, dateX + dateW / 2, dateY + 24);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function drawMedia(ctx, post, x, y, width, height) {
    ctx.save();
    ctx.shadowColor = "rgba(17,17,17,.13)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    roundRect(ctx, x, y, width, height, 38);
    ctx.fillStyle = "#fff6c7";
    ctx.fill();
    ctx.restore();

    roundRect(ctx, x, y, width, height, 38);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#111111";
    ctx.stroke();

    const innerPad = 18;
    const innerX = x + innerPad;
    const innerY = y + innerPad;
    const innerW = width - innerPad * 2;
    const innerH = height - innerPad * 2;

    ctx.save();
    roundRect(ctx, innerX, innerY, innerW, innerH, 30);
    ctx.clip();
    if (!post.media.length) {
      drawTextOnlyMedia(ctx, post, innerX, innerY, innerW, innerH);
      ctx.restore();
      return;
    }

    const preview = post.media.slice(0, 4);
    const gap = 14;
    const layout = getMediaLayout(preview.length, innerX, innerY, innerW, innerH, gap);
    const hasHeartGap = post.media.length >= 4;
    const heartCx = innerX + innerW / 2;
    const heartCy = innerY + innerH / 2;
    const heartSize = Math.min(innerW, innerH) * .105;

    if (hasHeartGap) drawHeartGapBase(ctx, heartCx, heartCy, heartSize);

    layout.forEach((box, index) => {
      ctx.save();
      roundRect(ctx, box.x, box.y, box.w, box.h, box.r);
      ctx.clip();
      if (preview.length === 1) {
        drawContainImage(ctx, preview[index].image, box.x, box.y, box.w, box.h);
      } else {
        drawCoverImage(ctx, preview[index].image, box.x, box.y, box.w, box.h);
      }
      if (index === layout.length - 1 && post.media.length > 4) {
        ctx.fillStyle = "rgba(17,17,17,.58)";
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 82px Arial, Helvetica, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`+${post.media.length - 4}`, box.x + box.w / 2, box.y + box.h / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      }
      ctx.restore();
    });

    if (hasHeartGap) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      drawHeartPath(ctx, heartCx, heartCy, heartSize + 5);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function getMediaLayout(count, x, y, width, height, gap) {
    if (count <= 1) return [{ x, y, w: width, h: height, r: 32 }];
    if (count === 2) {
      const half = (width - gap) / 2;
      return [
        { x, y, w: half, h: height, r: 28 },
        { x: x + half + gap, y, w: half, h: height, r: 28 }
      ];
    }
    if (count === 3) {
      const leftW = Math.round((width - gap) * .58);
      const rightW = width - gap - leftW;
      const rightH = (height - gap) / 2;
      return [
        { x, y, w: leftW, h: height, r: 28 },
        { x: x + leftW + gap, y, w: rightW, h: rightH, r: 24 },
        { x: x + leftW + gap, y: y + rightH + gap, w: rightW, h: rightH, r: 24 }
      ];
    }
    const colW = (width - gap) / 2;
    const rowH = (height - gap) / 2;
    return [
      { x, y, w: colW, h: rowH, r: 24 },
      { x: x + colW + gap, y, w: colW, h: rowH, r: 24 },
      { x, y: y + rowH + gap, w: colW, h: rowH, r: 24 },
      { x: x + colW + gap, y: y + rowH + gap, w: colW, h: rowH, r: 24 }
    ];
  }

  function drawTextOnlyMedia(ctx, post, x, y, width, height) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "#151515");
    gradient.addColorStop(.68, "#302700");
    gradient.addColorStop(1, "#4a3a00");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = "rgba(247, 198, 0, .12)";
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.arc(x + 100 + i * 130, y + 90 + (i % 2) * 260, 54, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#f7c600";
    ctx.font = "900 28px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SFK MEMORY", x + width / 2, y + 140);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 56px Arial, Helvetica, sans-serif";
    wrapText(ctx, post.title || "Class Memory", x + 95, y + 238, width - 190, 68, 3);
    if (post.caption) {
      ctx.fillStyle = "#fff5c8";
      ctx.font = "700 31px Arial, Helvetica, sans-serif";
      wrapText(ctx, post.caption, x + 105, y + 456, width - 210, 42, 4);
    }
    ctx.textAlign = "left";
  }

  function drawHeartGapBase(ctx, cx, cy, size) {
    ctx.save();
    ctx.shadowColor = "rgba(17,17,17,.16)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    drawHeartPath(ctx, cx, cy, size + 6);
    ctx.fillStyle = "rgba(255,255,255,.96)";
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawHeartPath(ctx, cx, cy, size);
    const gradient = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size * 1.1);
    gradient.addColorStop(0, "#fff8bf");
    gradient.addColorStop(0.45, "#f7c600");
    gradient.addColorStop(1, "#d7a600");
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111111";
    ctx.stroke();
    ctx.restore();
  }

  function drawHeartPath(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.9);
    ctx.bezierCurveTo(cx - size * 1.35, cy + size * 0.18, cx - size * 1.2, cy - size * 0.72, cx, cy - size * 0.18);
    ctx.bezierCurveTo(cx + size * 1.2, cy - size * 0.72, cx + size * 1.35, cy + size * 0.18, cx, cy + size * 0.9);
    ctx.closePath();
  }

  function drawDetails(ctx, post, x, y, width, hasPhoto, canvasHeight, footerOffset) {
    const footerTop = canvasHeight - footerOffset - 36;
    const metaReserve = hasPhoto ? 92 : 100;
    const textBottom = footerTop - metaReserve;

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#111111";
    ctx.font = hasPhoto ? "900 43px Arial, Helvetica, sans-serif" : "900 54px Arial, Helvetica, sans-serif";
    const titleLineHeight = hasPhoto ? 51 : 64;
    const maxTitleLines = hasPhoto ? 2 : 3;
    const titleLines = wrapText(ctx, post.title || "Untitled Memory", x, y, width, titleLineHeight, maxTitleLines);
    let cursorY = y + Math.max(1, titleLines) * titleLineHeight + (hasPhoto ? 24 : 28);

    if (post.caption && cursorY < textBottom) {
      ctx.fillStyle = "#36332d";
      ctx.font = hasPhoto ? "700 28px Arial, Helvetica, sans-serif" : "700 32px Arial, Helvetica, sans-serif";
      const captionLineHeight = hasPhoto ? 36 : 43;
      const maxCaptionLines = Math.max(1, Math.min(hasPhoto ? 2 : 4, Math.floor((textBottom - cursorY) / captionLineHeight)));
      const captionLines = wrapText(ctx, post.caption, x, cursorY, width, captionLineHeight, maxCaptionLines);
      cursorY += captionLines * captionLineHeight + (hasPhoto ? 32 : 36);
    } else {
      cursorY += hasPhoto ? 16 : 22;
    }

    const metaY = Math.min(cursorY, footerTop - 72);
    const avatarSize = hasPhoto ? 60 : 66;
    ctx.save();
    ctx.shadowColor = "rgba(17,17,17,.10)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#f7c600";
    ctx.beginPath();
    ctx.arc(x + avatarSize / 2, metaY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#111111";
    ctx.beginPath();
    ctx.arc(x + avatarSize / 2, metaY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#111111";
    ctx.font = `900 ${hasPhoto ? 24 : 26}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(getInitials(post.postedBy), x + avatarSize / 2, metaY + avatarSize / 2 + 1);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#111111";
    ctx.font = `900 ${hasPhoto ? 29 : 32}px Arial, Helvetica, sans-serif`;
    drawFittedText(ctx, post.postedBy || "SFK", x + avatarSize + 20, metaY + avatarSize / 2 + 11, width * 0.48, hasPhoto ? 29 : 32, 20, "900");

    if (post.media.length) {
      ctx.fillStyle = "#6a5a16";
      ctx.font = "800 22px Arial, Helvetica, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${post.media.length} attachment${post.media.length > 1 ? "s" : ""}`, x + width, metaY + avatarSize / 2 + 1);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
  }

  function drawFooter(ctx, width, height, footerOffset) {
    const footerY = height - footerOffset;
    ctx.strokeStyle = "#eadfa9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(88, footerY - 28);
    ctx.lineTo(width - 88, footerY - 28);
    ctx.stroke();

    const parts = [
      { text: "S", color: "#f7c600", weight: "900" },
      { text: "o ", color: "#111111", weight: "900" },
      { text: "F", color: "#f7c600", weight: "900" },
      { text: "ar, so ", color: "#111111", weight: "900" },
      { text: "K", color: "#f7c600", weight: "900" },
      { text: "ind - SFK Memories", color: "#111111", weight: "900" }
    ];
    const fontSize = 24;
    const family = "Arial, Helvetica, sans-serif";
    let total = 0;
    parts.forEach((part) => {
      ctx.font = `${part.weight} ${fontSize}px ${family}`;
      total += ctx.measureText(part.text).width;
    });
    let drawX = (width - total) / 2;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    parts.forEach((part) => {
      ctx.font = `${part.weight} ${fontSize}px ${family}`;
      ctx.fillStyle = part.color;
      ctx.fillText(part.text, drawX, footerY);
      drawX += ctx.measureText(part.text).width;
    });

    ctx.fillStyle = "#7b6700";
    ctx.font = "800 20px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Our moments, milestones, and kind beginnings.", width / 2, footerY + 34);
    ctx.textAlign = "left";
  }

  function drawCoverImage(ctx, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    const drawX = x + (width - drawW) / 2;
    const drawY = y + (height - drawH) / 2;
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
  }

  function drawContainImage(ctx, image, x, y, width, height) {
    ctx.fillStyle = "#fff6c7";
    ctx.fillRect(x, y, width, height);
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    const drawX = x + (width - drawW) / 2;
    const drawY = y + (height - drawH) / 2;
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
  }

  function drawFittedText(ctx, text, x, y, maxWidth, startSize, minSize, weight = "900") {
    const family = "Arial, Helvetica, sans-serif";
    let size = startSize;
    do {
      ctx.font = `${weight} ${size}px ${family}`;
      if (ctx.measureText(String(text)).width <= maxWidth || size <= minSize) break;
      size -= 1;
    } while (size >= minSize);
    ctx.fillText(String(text), x, y);
    return size;
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 0;
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test;
      } else {
        lines.push(line);
        line = word;
        if (lines.length >= maxLines) break;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (lines.length === maxLines && words.length) {
      const fullText = words.join(" ");
      const shown = lines.join(" ");
      if (fullText.length > shown.length) {
        let last = lines[lines.length - 1];
        while (last.length > 0 && ctx.measureText(last + "…").width > maxWidth) last = last.slice(0, -1).trim();
        lines[lines.length - 1] = last + "…";
      }
    }
    lines.forEach((lineText, index) => ctx.fillText(lineText, x, y + index * lineHeight));
    return lines.length;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function canvasToBlob() {
    return new Promise((resolve, reject) => {
      els.canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Unable to export image."));
      }, "image/png", 1);
    });
  }

  async function downloadImage() {
    try {
      setStatus("Exporting...");
      render();
      const blob = await canvasToBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("PNG downloaded.");
    } catch (error) {
      console.error(error);
      showToast("Unable to download image.");
    } finally {
      setStatus("Ready");
    }
  }

  async function shareImage() {
    try {
      setStatus("Preparing share...");
      render();
      const blob = await canvasToBlob();
      const fileName = getFileName();
      if (navigator.canShare && navigator.share && typeof File !== "undefined") {
        const file = new File([blob], fileName, { type: "image/png", lastModified: Date.now() });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "SFK Memories", text: "SFK Memories story image", files: [file] });
          showToast("Share image ready.");
          return;
        }
      }
      await downloadImage();
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error(error);
      showToast("Share not available. PNG downloaded instead.");
      await downloadImage();
    } finally {
      setStatus("Ready");
    }
  }

  function getFileName() {
    const safeTitle = (els.title.value || "sfk-memory")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 45) || "sfk-memory";
    return `${safeTitle}-${SIZES[state.size].suffix}.png`;
  }

  function cleanText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function getInitials(name) {
    const parts = String(name || "SFK").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "SFK";
    if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  }

  function setStatus(text) {
    els.status.textContent = text;
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2300);
  }

  init();
})();
