const MEMORIES_API_URL = "https://script.google.com/macros/s/AKfycbzCjWVnO-ZNvKTNqKN1zVscNsfPox0uDnO1QTSbBCrMFaS79tfL3mopHa2pH7gHczYeOA/exec";
const MEMORY_CACHE_KEY = "sfkMemoriesCacheV1";
const HEARTED_MEMORY_KEY = "sfkHeartedMemoriesV1";
const MEMORIES_SEEN_IDS_KEY = "sfkMemoriesSeenPostIdsV1";
const MEMORY_POSTED_BY_KEY = "sfkMemoryPostedByV1";
const MEMORY_MUSIC_AUTOPLAY_KEY = "sfkMemoryMusicAutoplayV1";
const MAX_MEDIA_FILES = 6;
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = 22 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 420 * 1024;
const MUSIC_LINK_TEST_TIMEOUT_MS = 8000;
const MEMORY_SHARE_IMAGE_WIDTH = 1080;
const MEMORY_SHARE_IMAGE_HEIGHT = 1350;
const MEMORY_SHARE_STORY_WIDTH = 1080;
const MEMORY_SHARE_STORY_HEIGHT = 1920;
const MEMORY_SHARE_PREVIEW_LIMIT = 4;
const MEMORY_MUSIC_LIBRARY_DOC_ID = "memoryMusicLibrary";
const DEFAULT_MEMORY_MUSIC_LIBRARY = [
  {
    id: "019f0409-13d2-7275-b51f-0e58da8105fe",
    title: "Halcali - Otsukare Summer (Lyrics)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019f0409-13d2-7275-b51f-0e58da8105fe"
  },
  {
    id: "019efe86-fd8f-72dd-9b85-e599fae9da2c",
    title: "Impostor Syndrome",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019efe86-fd8f-72dd-9b85-e599fae9da2c"
  },
  {
    id: "019ef9f2-8a06-71ba-85f0-5ef3b12c2270",
    title: "Michael Buble - It's Beginning to Look a Lot Like Christmas (ARAN Cover)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019ef9f2-8a06-71ba-85f0-5ef3b12c2270"
  },
  {
    id: "019ef9f2-12d0-70dc-90e8-600513eef96b",
    title: "Michael Jackson - Man in the Mirror (Lyrics)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019ef9f2-12d0-70dc-90e8-600513eef96b"
  },
  {
    id: "019ef9f2-89dd-72d0-81d3-ac7f8691ce7c",
    title: "My Mood Playlist - 10 Songs, One Guitar (ARAN Acoustic Mashup)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019ef9f2-89dd-72d0-81d3-ac7f8691ce7c"
  },
  {
    id: "019f0348-6fe4-7385-8e80-1bdce1382d95",
    title: "Patience and Prudence - A Smile and a Ribbon (Sped Up)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019f0348-6fe4-7385-8e80-1bdce1382d95"
  },
  {
    id: "019ef9f2-89dd-70c3-8032-bdbf97f57001",
    title: "Ryan Gosling and Emma Stone - City of Stars (ARAN Cover)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019ef9f2-89dd-70c3-8032-bdbf97f57001"
  },
  {
    id: "019f06bb-f55a-7322-b938-1c91ba58f0fe",
    title: "Sasane - Mosi Mosi (Lyrics)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019f06bb-f55a-7322-b938-1c91ba58f0fe"
  },
  {
    id: "019f06bc-735a-715c-a8b1-a5cadcf8d42a",
    title: "Sasane - Mosi Mosi (Lyrics)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019f06bc-735a-715c-a8b1-a5cadcf8d42a"
  },
  {
    id: "019ef9f2-89dd-70e8-a633-a2066b5540d3",
    title: "Bill Withers - Just the Two of Us (ARAN Cover)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019ef9f2-89dd-70e8-a633-a2066b5540d3"
  }
];

const memoryState = {
  posts: [],
  filter: "all",
  carousel: new Map(),
  auth: null,
  selectedFiles: [],
  coverIndex: 0,
  viewerMedia: [],
  viewerIndex: 0,
  viewerAnimating: false,
  requestedPostHandled: false,
  suppressClickUntil: 0,
  musicLibrary: [],
  musicLibraryLoaded: false,
  musicLibraryLoading: false,
  musicPreviewAudio: null,
  musicPreviewId: "",
  youtubeApiKey: "",
  youtubeSearchResults: [],
  youtubePreviewId: "",
  musicAutoplayEnabled: localStorage.getItem(MEMORY_MUSIC_AUTOPLAY_KEY) === "true",
  musicAutoplayUnlocked: false,
  musicAutoplayTimer: null,
  musicAutoplaySyncing: false,
  selectedMusicLibraryIds: new Set()
};

let touchGesture = null;
let feedVideoObserver = null;
let postMusicObserver = null;
let pageMediaResumeState = null;
let pageMediaResumeTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  setDefaultMemoryDate();
  restoreMemoryAuth();
  bindMemoryEvents();
  updateMusicAutoplayButton();
  renderCachedMemories();
  loadMemories();
});

function bindMemoryEvents() {
  ["topPostButton", "sidePostButton"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", openComposeModal);
  });

  document.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", () => closeModal(element.dataset.closeModal));
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => setMemoryFilter(button.dataset.filter));
  });

  document.getElementById("unlockPostingButton")?.addEventListener("click", unlockMemoryPosting);
  document.getElementById("changeRoleButton")?.addEventListener("click", resetMemoryAuth);
  document.getElementById("memoryFiles")?.addEventListener("change", handleMemoryFiles);
  document.getElementById("mediaPreview")?.addEventListener("click", handleMediaPreviewAction);
  document.getElementById("togglePostPreviewButton")?.addEventListener("click", togglePostPreview);
  document.getElementById("toggleMusicFieldsButton")?.addEventListener("click", () => toggleMusicFields());
  document.getElementById("musicAutoplayToggle")?.addEventListener("click", toggleMusicAutoplay);
  document.getElementById("toggleAdditionalMusicSources")?.addEventListener("click", toggleAdditionalMusicSources);
  document.getElementById("testMusicLinkButton")?.addEventListener("click", testMusicLink);
  document.getElementById("musicLibrarySearch")?.addEventListener("input", renderMemoryMusicLibrary);
  document.getElementById("musicLibraryList")?.addEventListener("click", handleMusicLibraryListClick);
  document.getElementById("manageMusicLibraryButton")?.addEventListener("click", openMusicLibraryManager);
  document.getElementById("musicLibraryForm")?.addEventListener("submit", saveMusicLibrarySong);
  document.getElementById("importMusicLibrarySongs")?.addEventListener("click", importMusicLibrarySongs);
  document.getElementById("searchYoutubeSongsButton")?.addEventListener("click", searchYoutubeSongs);
  document.getElementById("youtubeSongSearch")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchYoutubeSongs();
    }
  });
  document.getElementById("youtubeSongResults")?.addEventListener("click", handleYoutubeSongResultClick);
  document.getElementById("saveYoutubeApiKey")?.addEventListener("click", saveYoutubeApiKey);
  document.getElementById("cancelMusicLibraryEdit")?.addEventListener("click", resetMusicLibraryEditor);
  document.getElementById("musicLibraryManageList")?.addEventListener("click", handleMusicLibraryManageClick);
  document.getElementById("musicLibraryManageList")?.addEventListener("change", handleMusicLibrarySelectionChange);
  document.getElementById("selectAllMusicLibrarySongs")?.addEventListener("change", toggleAllMusicLibrarySongs);
  document.getElementById("deleteSelectedMusicLibrarySongs")?.addEventListener("click", deleteSelectedMusicLibrarySongs);
  document.querySelectorAll("[data-close-music-library]").forEach((element) => {
    element.addEventListener("click", closeMusicLibraryManager);
  });
  document.getElementById("memoryForm")?.addEventListener("submit", submitMemoryPost);
  ["memoryTitle", "memoryDate", "memoryPostedBy", "memoryCaption", "memoryVideoUrl", "memoryMusicUrl", "memoryMusicTitle"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderComposePreview);
  });
  document.getElementById("memoryMusicUrl")?.addEventListener("input", renderMemoryMusicLibrary);
  const feed = document.getElementById("memoryFeed");
  feed?.addEventListener("click", handleFeedClick);
  feed?.addEventListener("touchstart", startFeedSwipe, { passive: true });
  feed?.addEventListener("touchmove", moveFeedSwipe, { passive: false });
  feed?.addEventListener("touchend", endFeedSwipe, { passive: true });
  feed?.addEventListener("error", handleFeedVideoError, true);
  feed?.addEventListener("load", handleEmbeddedMediaLoad, true);
  document.getElementById("closeViewerButton")?.addEventListener("click", closeViewer);
  document.getElementById("viewerPrevious")?.addEventListener("click", () => moveViewer(-1, { smooth: true }));
  document.getElementById("viewerNext")?.addEventListener("click", () => moveViewer(1, { smooth: true }));
  document.getElementById("viewerModal")?.addEventListener("touchstart", startViewerSwipe, { passive: true });
  document.getElementById("viewerModal")?.addEventListener("touchmove", moveViewerSwipe, { passive: false });
  document.getElementById("viewerModal")?.addEventListener("touchend", endViewerSwipe, { passive: true });
  document.getElementById("viewerModal")?.addEventListener("click", handleViewerClick);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeViewer();
      closeModal("composeModal");
    }

    if (!document.getElementById("viewerModal")?.hidden) {
      if (event.key === "ArrowLeft") moveViewer(-1, { smooth: true });
      if (event.key === "ArrowRight") moveViewer(1, { smooth: true });
    }
  });

  document.addEventListener("visibilitychange", handlePageVisibilityChange);
  window.addEventListener("pagehide", () => pauseAllPageMedia({ remember: true }));
  window.addEventListener("blur", () => pauseAllPageMedia({ remember: true }));
  window.addEventListener("focus", resumePageMedia);
  window.addEventListener("pageshow", resumePageMedia);
  document.addEventListener("freeze", () => pauseAllPageMedia({ remember: true }));
  document.addEventListener("resume", resumePageMedia);
  document.addEventListener("pointerdown", () => {
    memoryState.musicAutoplayUnlocked = true;
    scheduleMusicAutoplaySync();
  }, { once: true, capture: true, passive: true });
  window.addEventListener("scroll", scheduleMusicAutoplaySync, { passive: true });
}

async function loadMemories() {
  setFeedStatus("Loading memories...");

  try {
    const rows = await loadMemoriesFromFirebaseFirst();
    memoryState.posts = rows.map(normalizeMemoryPost);
    localStorage.setItem(MEMORY_CACHE_KEY, JSON.stringify(memoryState.posts));
    markLoadedMemoriesSeen(memoryState.posts);
    renderMemories();
  } catch (error) {
    console.error("Memories load failed:", error);
    if (memoryState.posts.length === 0) {
      setFeedStatus("Memories will appear after the database loads correctly.");
    }
  }
}

async function loadMemoriesFromFirebaseFirst() {
  try {
    const rows = await loadMemoriesDirectFromFirebase();
    if (Array.isArray(rows)) return rows;
  } catch (error) {
    console.warn("Direct Firebase memories load failed. Falling back to API.", error);
  }

  const response = await fetch(`${MEMORIES_API_URL}?type=memories`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const result = await response.json();
  if (result.status !== "success" || !Array.isArray(result.memories)) {
    throw new Error(result.message || "Invalid memories response.");
  }

  return result.memories;
}

async function loadMemoriesDirectFromFirebase() {
  const db = getClassBoardFirestore();
  if (!db) throw new Error("Firebase is not ready.");

  const snap = await db.collection("memories").get();
  const rows = [];
  snap.forEach((doc) => {
    const data = convertFirestoreData(doc.data() || {});
    const id = String(doc.id || data.docId || data.ID || data.MemoryID || data.memoryId || data.id || "").trim();
    rows.push({
      ...data,
      docId: doc.id,
      id,
      ID: id,
      HeartCount: readMemoryHeartCount(data),
      heartCount: readMemoryHeartCount(data)
    });
  });

  return rows
    .filter((row) => String(row.Publish || "YES").trim().toUpperCase() === "YES")
    .sort((a, b) => compareMemoryRowsForDisplay(a, b));
}

function getClassBoardFirestore() {
  try {
    if (window.SFK_CLASSBOARD_FIREBASE_DB) return window.SFK_CLASSBOARD_FIREBASE_DB;
    if (!window.firebase || !window.SFK_FIREBASE_READY) return null;
    if (!firebase.apps.length) firebase.initializeApp(window.SFK_FIREBASE_CONFIG);
    const db = firebase.firestore();
    window.SFK_CLASSBOARD_FIREBASE_DB = db;
    return db;
  } catch (error) {
    console.warn("Firebase database is unavailable:", error);
    return null;
  }
}

function convertFirestoreData(data) {
  const next = { ...data };
  Object.keys(next).forEach((key) => {
    const value = next[key];
    if (value && typeof value.toDate === "function") {
      next[key] = value.toDate().toISOString();
    }
  });
  return next;
}

function compareMemoryRowsForDisplay(a, b) {
  const bValue = memorySortValue(b);
  const aValue = memorySortValue(a);
  if (bValue !== aValue) return bValue - aValue;
  return String(b.ID || b.id || "").localeCompare(String(a.ID || a.id || ""));
}

function memorySortValue(row) {
  const candidates = [row.CreatedAt, row.createdAt, row.Date, row.date];
  for (const value of candidates) {
    const millis = valueToMillis(value);
    if (Number.isFinite(millis)) return millis;
  }
  return 0;
}

function valueToMillis(value) {
  if (!value) return NaN;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function markLoadedMemoriesSeen(posts) {
  const ids = (posts || [])
    .map(post => String(post.id || "").trim())
    .filter(Boolean);

  localStorage.setItem(MEMORIES_SEEN_IDS_KEY, JSON.stringify(Array.from(new Set(ids)).slice(0, 500)));
}

function renderCachedMemories() {
  try {
    const cached = JSON.parse(localStorage.getItem(MEMORY_CACHE_KEY) || "[]");
    if (!Array.isArray(cached) || cached.length === 0) return;
    memoryState.posts = cached.map(normalizeMemoryPost);
    renderMemories();
  } catch (error) {
    localStorage.removeItem(MEMORY_CACHE_KEY);
  }
}

function readMemoryHeartCount(raw) {
  const heartUsers = getHeartUsersV2(raw);
  const mapCount = Object.keys(heartUsers).length;
  if (mapCount > 0) return mapCount;

  const values = [
    raw?.HeartCountV2,
    raw?.heartCountV2,
    raw?.NotedCountV2,
    raw?.notedCountV2
  ]
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0);

  return values.length ? Math.max(...values) : 0;
}

function getHeartUsersV2(raw) {
  return normalizeHeartedDevices(raw?.HeartUsersV2 || raw?.heartUsersV2 || raw?.NotedDevicesV2 || raw?.notedDevicesV2);
}

function isMemoryHeartedByThisDevice(post) {
  const deviceId = getClassBoardHeartDeviceId();
  return Boolean(getHeartUsersV2(post)[deviceId]);
}

function normalizeMemoryPost(raw) {
  let uploadedMedia = Array.isArray(raw.media) ? raw.media : [];

  if (uploadedMedia.length === 0) {
    try {
      const parsed = JSON.parse(raw.MediaJSON || raw.mediaJSON || "[]");
      uploadedMedia = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      uploadedMedia = [];
    }
  }

  const media = uploadedMedia
    .map(normalizeStoredMedia)
    .filter(Boolean);
  const linkedVideo = normalizeExternalMedia(
    raw.VideoURL || raw.videoUrl || "",
    raw.VideoDownloadURL || raw.videoDownloadUrl || ""
  );
  if (linkedVideo) media.push(linkedVideo);
  const music = normalizePostMusic(raw);

  return {
    id: String(raw.docId || raw.DocID || raw.__docId || raw.ID || raw.Id || raw.id || raw.MemoryID || raw.memoryId || "").trim(),
    date: String(raw.Date || "").trim(),
    title: String(raw.Title || "Untitled Memory").trim(),
    caption: String(raw.Caption || "").trim(),
    postedBy: String(raw.PostedBy || "SFK").trim(),
    role: String(raw.Role || "Officer").trim(),
    heartCount: readMemoryHeartCount(raw),
    heartUsersV2: getHeartUsersV2(raw),
    createdAt: String(raw.CreatedAt || "").trim(),
    videoUrl: String(raw.VideoURL || raw.videoUrl || "").trim(),
    media,
    music
  };
}

function normalizePostMusic(raw) {
  const customMusicTitle = String(
    raw.MusicTitle || raw.musicTitle || raw.MusicDisplayTitle || raw.musicDisplayTitle || raw.MusicName || raw.musicName || ""
  ).trim();

  if (raw.music && typeof raw.music === "object") {
    if (raw.music.kind === "youtube-audio") {
      const videoId = String(raw.music.videoId || getYouTubeId(raw.music.url) || "").trim();
      if (!videoId) return null;
      return {
        ...raw.music,
        kind: "youtube-audio",
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        name: customMusicTitle || raw.music.name || "YouTube music",
        customTitle: customMusicTitle,
        muted: true,
        started: false
      };
    }
    const fileId = String(raw.music.fileId || getDriveFileId(raw.music.url) || getDriveFileId(raw.music.previewUrl) || "").trim();
    const isDriveAudio = raw.music.kind === "drive-audio" || Boolean(fileId);
    return {
      ...raw.music,
      kind: isDriveAudio ? "drive-audio" : raw.music.kind,
      fileId,
      url: isDriveAudio
        ? (getDriveStreamUrl(fileId) || safeHttpUrl(raw.music.url) || safeHttpUrl(raw.music.downloadUrl) || getDriveAudioStreamUrl(fileId))
        : safeHttpUrl(raw.music.url),
      fallbackUrl: isDriveAudio
        ? (getDriveAudioStreamUrl(fileId) || safeHttpUrl(raw.music.fallbackUrl))
        : safeHttpUrl(raw.music.fallbackUrl),
      previewUrl: safeHttpUrl(raw.music.previewUrl),
      name: customMusicTitle || getMusicDisplayName(raw.music),
      customTitle: customMusicTitle,
      muted: true,
      started: false
    };
  }

  let uploaded = null;
  try {
    uploaded = JSON.parse(raw.MusicJSON || raw.musicJSON || "null");
  } catch (error) {
    uploaded = null;
  }

  if (uploaded && uploaded.fileId) {
    return {
      kind: "drive-audio",
      name: customMusicTitle || String(uploaded.name || "Background music"),
      customTitle: customMusicTitle,
      fileId: String(uploaded.fileId),
      url: getDriveStreamUrl(uploaded.fileId) || safeHttpUrl(uploaded.downloadUrl) || getDriveAudioStreamUrl(uploaded.fileId),
      fallbackUrl: getDriveAudioStreamUrl(uploaded.fileId),
      previewUrl: safeHttpUrl(uploaded.previewUrl),
      muted: true,
      started: false
    };
  }

  const url = safeHttpUrl(raw.MusicURL || raw.musicUrl || "");
  if (!url) return null;
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return {
      kind: "youtube-audio",
      videoId: youtubeId,
      url,
      name: customMusicTitle || "YouTube music",
      customTitle: customMusicTitle,
      muted: true,
      started: false
    };
  }

  const driveId = getDriveFileId(url);
  if (driveId) {
    return {
      kind: "drive-audio",
      name: customMusicTitle || deriveMusicNameFromUrl(url) || "Google Drive music",
      customTitle: customMusicTitle,
      fileId: driveId,
      url: getDriveStreamUrl(driveId) || safeHttpUrl(raw.MusicDownloadURL || raw.musicDownloadUrl) || getDriveAudioStreamUrl(driveId),
      fallbackUrl: getDriveAudioStreamUrl(driveId),
      previewUrl: url,
      muted: true,
      started: false
    };
  }

  return { kind: "direct-audio", name: customMusicTitle || deriveMusicNameFromUrl(url) || "Background music", customTitle: customMusicTitle, url, muted: true, started: false };
}

function getMusicDisplayName(music) {
  const explicitName = String(music?.customTitle || music?.displayTitle || music?.MusicTitle || music?.name || music?.title || "").trim();
  if (explicitName && !/^background music$/i.test(explicitName)) return explicitName;

  return deriveMusicNameFromUrl(
    music?.previewUrl ||
    music?.fullUrl ||
    music?.url ||
    music?.downloadUrl ||
    music?.fallbackUrl
  ) || explicitName || "Background music";
}

function deriveMusicNameFromUrl(value) {
  try {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const url = new URL(raw, window.location.href);
    const id = getDriveFileId(url.href);
    if (id) return "Google Drive music";

    const pathPart = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
    const clean = pathPart
      .replace(/\.(mp3|m4a|aac|ogg|wav|webm)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return clean ? clean.replace(/\b\w/g, letter => letter.toUpperCase()) : "";
  } catch (error) {
    return "";
  }
}

function normalizeStoredMedia(item) {
  if (!item || !safeHttpUrl(item.url)) return null;

  const allowedKinds = ["image", "drive-video", "direct-video", "embed-video"];
  const kind = allowedKinds.includes(item.kind) ? item.kind : "image";

  const fileId = String(item.fileId || getDriveFileId(item.url) || getDriveFileId(item.fullUrl) || "").trim();
  const derivedViewerUrl = kind === "image" && fileId
    ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w4000`
    : "";

  return {
    kind,
    url: safeHttpUrl(item.url),
    viewerUrl: safeHttpUrl(item.viewerUrl) || derivedViewerUrl || safeHttpUrl(item.url),
    fullUrl: safeHttpUrl(item.fullUrl) || safeHttpUrl(item.url),
    downloadUrl: safeHttpUrl(item.downloadUrl),
    name: String(item.name || "SFK memory"),
    mimeType: String(item.mimeType || ""),
    fileId,
    ratio: Number(item.ratio) > 0 ? Number(item.ratio) : 0,
    streamUrl: kind === "drive-video"
      ? (safeHttpUrl(item.downloadUrl) || safeHttpUrl(item.streamUrl) || getDriveStreamUrl(fileId))
      : safeHttpUrl(item.streamUrl),
    muted: true
  };
}

function normalizeExternalMedia(value, downloadUrl) {
  const url = safeHttpUrl(value);
  if (!url) return null;

  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return {
      kind: "embed-video",
      url: `https://www.youtube.com/embed/${youtubeId}`,
      fullUrl: url,
      name: "YouTube video",
      muted: true
    };
  }

  const driveId = getDriveFileId(url);
  if (driveId) {
    return {
      kind: "drive-video",
      url: `https://drive.google.com/file/d/${driveId}/preview`,
      streamUrl: safeHttpUrl(downloadUrl) || getDriveStreamUrl(driveId),
      fullUrl: url,
      fileId: driveId,
      name: "Google Drive video",
      muted: true
    };
  }

  if (/\.(mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(url)) {
    return { kind: "direct-video", url, fullUrl: url, name: "Video", muted: true };
  }

  return { kind: "embed-video", url, fullUrl: url, name: "Linked video", muted: true };
}

function getDriveStreamUrl(fileId) {
  return fileId
    ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`
    : "";
}

function getDriveAudioStreamUrl(fileId) {
  return fileId
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
    : "";
}

function getMemoryAudioProxyUrl(fileId) {
  return fileId
    ? `${MEMORIES_API_URL}?type=memoryAudio&fileId=${encodeURIComponent(fileId)}`
    : "";
}

function getMemoryImageProxyUrl(fileId) {
  return fileId
    ? `${MEMORIES_API_URL}?type=memoryMedia&fileId=${encodeURIComponent(fileId)}`
    : "";
}

function getMusicDirectSources(music) {
  const sources = [];
  const add = (url) => {
    const safe = safeHttpUrl(url);
    if (safe && !sources.includes(safe)) sources.push(safe);
  };

  if (music?.fileId) {
    add(getDriveStreamUrl(music.fileId));
    add(getDriveAudioStreamUrl(music.fileId));
  }

  add(music?.url);
  add(music?.downloadUrl);
  add(music?.fallbackUrl);

  return sources;
}

function getManualMusicSources(url) {
  const sources = [];
  const add = (value) => {
    const safe = safeHttpUrl(value);
    if (safe && !sources.includes(safe)) sources.push(safe);
  };
  const driveId = getDriveFileId(url);

  if (driveId) {
    add(getDriveStreamUrl(driveId));
    add(getDriveAudioStreamUrl(driveId));
  } else {
    add(url);
  }

  return sources;
}

async function fetchDriveAudioObjectUrl(fileId) {
  const url = getMemoryAudioProxyUrl(fileId);
  if (!url) throw new Error("Music file is not available.");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Music file request failed (${response.status}).`);

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.message || "Music file is not available.");
  }

  const blob = base64ToBlob(result.data, result.mimeType || "audio/mpeg");
  return {
    objectUrl: URL.createObjectURL(blob),
    name: String(result.name || "").trim()
  };
}

function base64ToBlob(base64, mimeType) {
  const binary = atob(String(base64 || ""));
  const chunks = [];
  const chunkSize = 8192;

  for (let index = 0; index < binary.length; index += chunkSize) {
    const slice = binary.slice(index, index + chunkSize);
    const bytes = new Uint8Array(slice.length);
    for (let byteIndex = 0; byteIndex < slice.length; byteIndex++) {
      bytes[byteIndex] = slice.charCodeAt(byteIndex);
    }
    chunks.push(bytes);
  }

  return new Blob(chunks, { type: mimeType || "audio/mpeg" });
}

function testAudioSource(url, timeoutMs = MUSIC_LINK_TEST_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    let settled = false;
    const timer = window.setTimeout(() => {
      finish(false, new Error("Music link took too long to respond."));
    }, timeoutMs);

    function finish(ok, error) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      if (ok) resolve(true);
      else reject(error || new Error("This link is not playable audio."));
    }

    audio.preload = "metadata";
    audio.muted = true;
    audio.addEventListener("loadedmetadata", () => finish(true), { once: true });
    audio.addEventListener("canplay", () => finish(true), { once: true });
    audio.addEventListener("error", () => finish(false, new Error("This link is not a direct playable audio file.")), { once: true });
    audio.src = url;
    audio.load();
  });
}

function getYouTubeId(url) {
  const match = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{6,})/i);
  return match ? match[1] : "";
}

function getDriveFileId(url) {
  const pathMatch = String(url).match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (pathMatch) return pathMatch[1];
  const queryMatch = String(url).match(/[?&]id=([^&]+)/i);
  return queryMatch ? queryMatch[1] : "";
}

function safeHttpUrl(value) {
  try {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const url = new URL(raw, window.location.href);
    if (["http:", "https:"].includes(url.protocol)) return url.href;
    if (url.protocol === "data:" && /^data:(image|video|audio)\//i.test(url.href)) return url.href;
    return "";
  } catch (error) {
    return "";
  }
}

function renderMemories() {
  const feed = document.getElementById("memoryFeed");
  const empty = document.getElementById("emptyMemories");
  if (!feed || !empty) return;

  const playbackState = captureFeedPlaybackState();
  updateMemoryStats();
  const filtered = getFilteredPosts();
  setFeedStatus("");
  empty.hidden = filtered.length !== 0;
  feed.innerHTML = filtered.map(renderMemoryPost).join("");
  window.requestAnimationFrame(() => {
    restoreFeedPlaybackState(playbackState);
    updateMusicTitleMarquees();
    observeFeedVideos();
    observePostMusic();
    scheduleMusicAutoplaySync();
    scrollToRequestedMemory();
  });
}

function captureFeedPlaybackState() {
  const states = new Map();

  document.querySelectorAll(".memoryPost").forEach((article) => {
    const postId = article.dataset.postId;
    if (!postId) return;

    article.querySelectorAll(".feedVideo").forEach((video, index) => {
      states.set(`video:${postId}:${video.dataset.mediaIndex || index}`, captureMediaElementState(video));
    });

    const music = article.querySelector(".postMusicPlayer");
    if (music) {
      states.set(`music:${postId}`, captureMediaElementState(music));
    }
  });

  return states;
}

function captureMediaElementState(element) {
  return {
    currentTime: Number.isFinite(element.currentTime) ? element.currentTime : 0,
    muted: Boolean(element.muted),
    paused: Boolean(element.paused),
    ended: Boolean(element.ended),
    src: element.currentSrc || element.src || "",
    volume: Number.isFinite(element.volume) ? element.volume : 1
  };
}

function restoreFeedPlaybackState(states) {
  if (!states || states.size === 0) return;

  document.querySelectorAll(".memoryPost").forEach((article) => {
    const postId = article.dataset.postId;
    if (!postId) return;

    article.querySelectorAll(".feedVideo").forEach((video, index) => {
      restoreMediaElementState(video, states.get(`video:${postId}:${video.dataset.mediaIndex || index}`));
    });

    const music = article.querySelector(".postMusicPlayer");
    restoreMediaElementState(music, states.get(`music:${postId}`), true);
  });
}

function restoreMediaElementState(element, state, restoreSource = false) {
  if (!element || !state) return;

  if (restoreSource && state.src && element.src !== state.src) {
    element.src = state.src;
    element.load();
  }

  element.muted = state.muted;
  element.volume = state.volume;

  const restore = () => {
    if (state.currentTime > 0) {
      try {
        element.currentTime = state.currentTime;
      } catch (error) {
        // Some browsers block seeking until more metadata is ready.
      }
    }

    if (!document.hidden && !state.paused && !state.ended) {
      element.play().catch(() => {});
    }
  };

  if (element.readyState >= 1) {
    restore();
  } else {
    element.addEventListener("loadedmetadata", restore, { once: true });
  }
}

function getFilteredPosts() {
  if (memoryState.filter === "photos") {
    return memoryState.posts.filter((post) => post.media.some((item) => item.kind === "image"));
  }

  if (memoryState.filter === "videos") {
    return memoryState.posts.filter((post) => post.media.some((item) => item.kind !== "image"));
  }

  return memoryState.posts;
}

function renderMemoryPost(post) {
  const currentIndex = Math.min(memoryState.carousel.get(post.id) || 0, Math.max(0, post.media.length - 1));
  const hearted = isMemoryHeartedByThisDevice(post);
  const avatar = escapeHtml(getInitials(post.postedBy));
  const menu = memoryState.auth
    ? `<button class="postMenuButton" type="button" data-action="manage" data-id="${escapeAttr(post.id)}" aria-label="Manage memory">&#8943;</button>`
    : "";

  return `
    <article class="memoryPost" data-post-id="${escapeAttr(post.id)}" ${post.music ? 'data-has-music="true"' : ""}>
      <header class="postHeader">
        <div class="postAvatar">${avatar}</div>
        <div class="postIdentity">
          <strong>${escapeHtml(post.postedBy)}</strong>
          <small><span class="postRole">${escapeHtml(post.role)}</span></small>
        </div>
        ${menu}
      </header>

      ${renderPostMedia(post, currentIndex)}

      <div class="postActions">
        <button class="heartButton ${hearted ? "hearted" : ""}" type="button" data-action="heart" data-id="${escapeAttr(post.id)}" aria-label="Heart this memory">${hearted ? "&#9829;" : "&#9825;"}</button>
        <button class="shareButton" type="button" data-action="share" data-id="${escapeAttr(post.id)}" aria-label="Create share image for this memory" title="Create share image"><span class="shareButtonIcon" aria-hidden="true">&#8599;</span></button>
      </div>

      <div class="postDetails">
        <span class="heartCount">${formatHeartCount(post.heartCount)}</span>
        <p class="postCaption"><strong>${escapeHtml(post.title)}</strong>${post.caption ? ` ${escapeHtml(post.caption)}` : ""}</p>
        <time class="postDate">${escapeHtml(post.date || post.createdAt || "SFK Memory")}</time>
      </div>
    </article>
  `;
}

function renderPostMedia(post, currentIndex) {
  if (post.media.length === 0) {
    return `
      <div class="postMedia textOnlyPostMedia">
        <div class="mediaSlide textOnlySlide">
          <span class="textOnlyBadge">SFK Memory</span>
          <strong>${escapeHtml(post.title || "Text Memory")}</strong>
          ${post.caption ? `<p>${escapeHtml(post.caption)}</p>` : ""}
        </div>
        ${renderPostMusic(post)}
      </div>
    `;
  }

  const slides = post.media.map((media, index) => renderMediaSlide(media, post.id, index)).join("");
  const controls = post.media.length > 1
    ? `
      <button class="mediaArrow mediaPrevious" type="button" data-action="previous" data-id="${escapeAttr(post.id)}" aria-label="Previous" ${currentIndex === 0 ? "hidden" : ""}>&#8249;</button>
      <button class="mediaArrow mediaNext" type="button" data-action="next" data-id="${escapeAttr(post.id)}" aria-label="Next" ${currentIndex === post.media.length - 1 ? "hidden" : ""}>&#8250;</button>
      <span class="mediaCounter">${currentIndex + 1}/${post.media.length}</span>
      <div class="mediaDots">${post.media.map((_, index) => `<span class="mediaDot ${index === currentIndex ? "active" : ""}"></span>`).join("")}</div>
    `
    : "";

  return `
    <div class="postMedia">
      <div class="mediaTrack" style="transform:translateX(-${currentIndex * 100}%)">${slides}</div>
      ${controls}
      ${renderPostMusic(post)}
    </div>
  `;
}

function renderPostMusic(post) {
  const music = post.music;
  if (!music) return "";

  const audible = music.muted === false;
  const musicName = getMusicDisplayName(music);
  let player = "";

  player = music.kind === "youtube-audio"
    ? `<div class="youtubeMusicPopover">
        <iframe class="postMusicFrame" src="${escapeAttr(getYouTubeMusicEmbedUrl(music.videoId))}" title="${escapeAttr(musicName)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen data-music-youtube="true" data-post-id="${escapeAttr(post.id)}"></iframe>
        <button class="youtubeMusicClose" type="button" data-action="youtube-music-hide" data-id="${escapeAttr(post.id)}" aria-label="Pause and hide YouTube player">&times;</button>
      </div>`
    : music.kind === "drive-audio"
    ? `<audio class="postMusicPlayer" ${audible ? "" : "muted"} loop preload="metadata" data-drive-audio="true"></audio>`
    : `
      <audio class="postMusicPlayer" ${audible ? "" : "muted"} loop preload="metadata">
        <source src="${escapeAttr(music.url)}" />
        ${music.fallbackUrl ? `<source src="${escapeAttr(music.fallbackUrl)}" />` : ""}
      </audio>
    `;

  return `
    <div class="postMusic ${music.kind === "youtube-audio" ? "youtubeMusic" : ""} ${audible ? "isPlaying" : ""}" data-music-post="${escapeAttr(post.id)}">
      ${player}
      <button class="musicToggleButton ${audible ? "audible" : ""}" type="button" data-action="music" data-id="${escapeAttr(post.id)}" title="${escapeAttr(musicName)}" aria-label="${audible ? `Mute ${musicName}` : `Play ${musicName}`}">
        <span class="musicPillEqualizer" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </span>
        <span class="musicNote">&#9835;</span><span class="musicLabelViewport"><span class="musicLabel">${escapeHtml(musicName)}</span></span><span class="musicSound">${audible ? "&#128266;" : "&#128263;"}</span>
      </button>
    </div>
  `;
}

function getYouTubeMusicEmbedUrl(videoId) {
  const params = new URLSearchParams({
    autoplay: "0",
    mute: "1",
    loop: "1",
    playlist: videoId,
    playsinline: "1",
    controls: "1",
    rel: "0",
    enablejsapi: "1",
    origin: window.location.origin
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function renderMediaSlide(media, postId, index) {
  const common = `data-action="view" data-id="${escapeAttr(postId)}" data-index="${index}"`;

  if (media.kind === "image") {
    return `
      <div class="mediaSlide">
        <img class="mediaBackdrop" src="${escapeAttr(media.url)}" alt="" aria-hidden="true" loading="lazy" />
        <img class="mediaMain" src="${escapeAttr(media.url)}" alt="${escapeAttr(media.name)}" loading="lazy" ${common} />
      </div>
    `;
  }

  if (media.kind === "direct-video" || media.kind === "drive-video") {
    const source = media.kind === "drive-video" ? (media.streamUrl || media.url) : media.url;
    return `
      <div class="mediaSlide videoSlide">
        <video class="feedVideo" src="${escapeAttr(source)}" autoplay ${media.muted === false ? "" : "muted"} loop playsinline preload="metadata" data-post-id="${escapeAttr(postId)}" data-media-index="${index}" ${media.kind === "drive-video" ? `data-drive-preview="${escapeAttr(media.url)}"` : ""}></video>
        ${renderVolumeButton(media, postId, index)}
      </div>
    `;
  }

  const youtubeId = getYouTubeId(media.fullUrl || media.url);
  const iframeUrl = youtubeId
    ? getYouTubeEmbedUrl(youtubeId, media.muted !== false)
    : media.url;

  return `
    <div class="mediaSlide videoSlide ${youtubeId ? "youtubeSlide" : ""}">
      <iframe class="feedVideoFrame" src="${escapeAttr(iframeUrl)}" title="${escapeAttr(media.name)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen data-post-id="${escapeAttr(postId)}" data-media-index="${index}" data-youtube="${youtubeId ? "true" : "false"}"></iframe>
      ${youtubeId ? `
        <div class="youtubeInteractionBar">
          <button type="button" data-action="youtube-controls" data-id="${escapeAttr(postId)}" data-index="${index}">
            <span aria-hidden="true">&#9654;</span><span class="youtubeModeText">Enable YouTube Controls</span>
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function renderVolumeButton(media, postId, index) {
  const audible = media.muted === false;
  return `<button class="mediaVolumeButton ${audible ? "audible" : ""}" type="button" data-action="volume" data-id="${escapeAttr(postId)}" data-index="${index}" aria-label="${audible ? "Mute video" : "Turn on video sound"}">${audible ? "&#128266;" : "&#128263;"}</button>`;
}

function getYouTubeEmbedUrl(videoId, muted) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    loop: "1",
    playlist: videoId,
    playsinline: "1",
    controls: "1",
    rel: "0",
    enablejsapi: "1"
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function handleFeedClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  const id = target.dataset.id;

  if (action === "view" && Date.now() < memoryState.suppressClickUntil) return;

  if (action === "previous") return moveCarousel(id, -1);
  if (action === "next") return moveCarousel(id, 1);
  if (action === "heart") {
    event.preventDefault();
    event.stopPropagation();
    return heartMemory(id);
  }
  if (action === "share") return shareMemory(id);
  if (action === "youtube-music-hide") {
    const article = target.closest(".memoryPost");
    const musicButton = article?.querySelector(".musicToggleButton");
    if (musicButton) return togglePostMusic(id, musicButton);
    return;
  }
  if (action === "manage") return openManageActions(id);
  if (action === "view") return openPostViewer(id, Number(target.dataset.index) || 0);
  if (action === "volume") return toggleMediaVolume(id, Number(target.dataset.index) || 0, target);
  if (action === "music") return togglePostMusic(id, target);
  if (action === "youtube-controls") return toggleYouTubeControls(target);
}

function toggleYouTubeControls(button) {
  const slide = button.closest(".youtubeSlide");
  if (!slide) return;

  const enabled = slide.classList.toggle("youtubeControlsEnabled");
  const text = button.querySelector(".youtubeModeText");
  if (text) text.textContent = enabled ? "Return to Scroll Mode" : "Enable YouTube Controls";
  button.classList.toggle("active", enabled);

  window.clearTimeout(slide.youtubeControlTimer);
  if (enabled) {
    slide.youtubeControlTimer = window.setTimeout(() => {
      slide.classList.remove("youtubeControlsEnabled");
      button.classList.remove("active");
      if (text) text.textContent = "Enable YouTube Controls";
    }, 20000);
  }
}

async function togglePostMusic(postId, button) {
  const post = memoryState.posts.find((item) => item.id === postId);
  const music = post?.music;
  const article = button.closest(".memoryPost");
  if (!music || !article) return;

  const audio = article.querySelector(".postMusicPlayer");
  const youtubeFrame = article.querySelector('[data-music-youtube="true"]');
  if (!audio && !youtubeFrame) return;

  const willPlay = music.muted !== false;
  if (!willPlay) {
    music.muted = true;
    if (audio) {
      audio.muted = true;
      audio.pause();
    }
    if (youtubeFrame) {
      sendYouTubeCommand(youtubeFrame, "mute");
      sendYouTubeCommand(youtubeFrame, "pauseVideo");
    }
    updateMusicButton(button, false);
    return;
  }

  muteAllOtherMedia("", -1);
  button.disabled = true;
  button.classList.add("loading");
  const label = button.querySelector(".musicLabel");
  if (label) label.textContent = "Loading...";

  try {
    if (youtubeFrame) {
      music.muted = false;
      music.started = true;
      sendYouTubeCommand(youtubeFrame, "unMute");
      sendYouTubeCommand(youtubeFrame, "playVideo");
      updateMusicButton(button, true);
      return;
    }

    await preparePostMusic(post, article);
    music.muted = false;
    music.started = true;
    audio.muted = false;
    audio.volume = 1;
    try {
      await audio.play();
    } catch (playError) {
      const triedNextSource = music.kind === "drive-audio"
        ? prepareNextPostMusicSource(post, article)
        : false;

      if (!triedNextSource) {
        throw playError;
      }

      if (label) label.textContent = "Retrying...";
      audio.muted = false;
      audio.volume = 1;
      await audio.play();
    }
    updateMusicButton(button, true);
  } catch (error) {
    music.muted = true;
    music.started = false;
    updateMusicButton(button, false);
    showMemoryToast(error.message || "Unable to play this music file.");
  } finally {
    button.disabled = false;
    button.classList.remove("loading");
    if (label) label.textContent = getMusicDisplayName(music);
  }
}

function updateMusicButton(button, audible) {
  if (!button) return;
  button.classList.toggle("audible", audible);
  button.closest(".postMusic")?.classList.toggle("isPlaying", audible);
  const sound = button.querySelector(".musicSound");
  if (sound) sound.innerHTML = audible ? "&#128266;" : "&#128263;";
  const post = memoryState.posts.find((item) => item.id === button.dataset.id);
  const musicName = getMusicDisplayName(post?.music);
  const label = button.querySelector(".musicLabel");
  if (label) label.textContent = musicName;
  button.title = musicName;
  button.setAttribute("aria-label", audible ? `Mute ${musicName}` : `Play ${musicName}`);
  updateMusicTitleMarquees();
}

function updateMusicAutoplayButton() {
  const button = document.getElementById("musicAutoplayToggle");
  if (!button) return;
  const enabled = memoryState.musicAutoplayEnabled;
  button.classList.toggle("isEnabled", enabled);
  button.setAttribute("aria-pressed", enabled ? "true" : "false");
  button.setAttribute(
    "aria-label",
    enabled ? "Turn off automatic music playback" : "Turn on automatic music playback"
  );
  button.title = enabled
    ? "Turn off automatic music playback"
    : "Automatically play music on visible posts";
}

function toggleMusicAutoplay() {
  memoryState.musicAutoplayEnabled = !memoryState.musicAutoplayEnabled;
  memoryState.musicAutoplayUnlocked = true;
  localStorage.setItem(MEMORY_MUSIC_AUTOPLAY_KEY, String(memoryState.musicAutoplayEnabled));
  updateMusicAutoplayButton();

  if (memoryState.musicAutoplayEnabled) {
    showMemoryToast("Music autoplay is on.");
    scheduleMusicAutoplaySync();
  } else {
    stopAllPostMusic();
    showMemoryToast("Music autoplay is off.");
  }
}

function stopAllPostMusic() {
  memoryState.posts.forEach((post) => {
    if (!post.music) return;
    post.music.muted = true;
    post.music.started = false;
  });

  document.querySelectorAll(".postMusicPlayer").forEach((audio) => {
    audio.muted = true;
    audio.pause();
  });
  document.querySelectorAll('[data-music-youtube="true"]').forEach((iframe) => {
    sendYouTubeCommand(iframe, "mute");
    sendYouTubeCommand(iframe, "pauseVideo");
  });
  document.querySelectorAll(".musicToggleButton").forEach((button) => {
    updateMusicButton(button, false);
  });
}

function scheduleMusicAutoplaySync() {
  window.clearTimeout(memoryState.musicAutoplayTimer);
  memoryState.musicAutoplayTimer = window.setTimeout(syncMusicAutoplayToVisiblePost, 120);
}

async function syncMusicAutoplayToVisiblePost() {
  if (
    !memoryState.musicAutoplayEnabled ||
    !memoryState.musicAutoplayUnlocked ||
    memoryState.musicAutoplaySyncing ||
    document.hidden
  ) return;

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  let bestArticle = null;
  let bestRatio = 0;

  document.querySelectorAll('.memoryPost[data-has-music="true"]').forEach((article) => {
    const rect = article.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    const ratio = visibleHeight / Math.max(1, Math.min(rect.height, viewportHeight));
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestArticle = article;
    }
  });

  if (!bestArticle || bestRatio < .4) {
    stopAllPostMusic();
    return;
  }
  const post = memoryState.posts.find((item) => item.id === bestArticle.dataset.postId);
  const button = bestArticle.querySelector(".musicToggleButton");
  if (!post?.music || !button || post.music.muted === false) return;

  memoryState.musicAutoplaySyncing = true;
  try {
    await togglePostMusic(post.id, button);
  } finally {
    memoryState.musicAutoplaySyncing = false;
  }
}

function updateMusicTitleMarquees() {
  document.querySelectorAll(".musicToggleButton").forEach((button) => {
    const viewport = button.querySelector(".musicLabelViewport");
    const label = button.querySelector(".musicLabel");
    if (!viewport || !label) return;
    const distance = Math.max(0, label.scrollWidth - viewport.clientWidth + 14);
    button.style.setProperty("--music-marquee-distance", `${distance}px`);
    button.classList.toggle("isMarquee", distance > 14);
  });
}

async function preparePostMusic(post, article) {
  const music = post?.music;
  const audio = article?.querySelector(".postMusicPlayer");
  if (!music || !audio) throw new Error("Music player is unavailable.");

  if (music.kind !== "drive-audio") return;

  const directSources = getMusicDirectSources(music);

  if (music.objectUrl) {
    if (audio.src !== music.objectUrl) {
      audio.src = music.objectUrl;
      audio.load();
    }
    return;
  }

  if (music.fileId && !music.proxyFailed) {
    try {
      const proxyAudio = await fetchDriveAudioObjectUrl(music.fileId);
      music.objectUrl = proxyAudio.objectUrl;
      if (proxyAudio.name && !music.customTitle) music.name = proxyAudio.name;
      audio.preload = "auto";
      audio.src = music.objectUrl;
      audio.load();
      music.directPrepared = true;
      return;
    } catch (error) {
      music.proxyFailed = true;
    }
  }

  if (!directSources.length) {
    throw new Error("Music file is not available.");
  }

  if (music.directPrepared && audio.src) {
    return;
  }

  music.directSources = directSources;
  music.sourceIndex = 0;
  audio.preload = "auto";
  audio.src = directSources[0];
  audio.load();
  music.directPrepared = true;
}

function prepareNextPostMusicSource(post, article) {
  const music = post?.music;
  const audio = article?.querySelector(".postMusicPlayer");
  if (!music || !audio || music.kind !== "drive-audio") return false;

  const directSources = getMusicDirectSources(music);
  const currentIndex = Number.isFinite(music.sourceIndex) ? music.sourceIndex : 0;
  const nextIndex = currentIndex + 1;

  if (!directSources[nextIndex]) return false;

  music.directSources = directSources;
  music.sourceIndex = nextIndex;
  music.directPrepared = true;
  audio.preload = "auto";
  audio.src = directSources[nextIndex];
  audio.load();
  return true;
}

function toggleMediaVolume(postId, mediaIndex, button) {
  const post = memoryState.posts.find((item) => item.id === postId);
  const media = post?.media?.[mediaIndex];
  const article = button.closest(".memoryPost");
  if (!media || !article) return;

  const willUnmute = media.muted !== false;
  if (willUnmute) muteAllOtherMedia(postId, mediaIndex);
  media.muted = !willUnmute;

  const video = article.querySelector(`video[data-media-index="${mediaIndex}"]`);
  const iframe = article.querySelector(`iframe[data-media-index="${mediaIndex}"]`);

  if (video) {
    video.muted = media.muted;
    video.volume = 1;
    video.play().catch(() => {});
  }

  if (iframe?.dataset.youtube === "true") {
    sendYouTubeCommand(iframe, media.muted ? "mute" : "unMute");
    sendYouTubeCommand(iframe, "playVideo");
  }

  updateVolumeButton(button, media.muted);
}

function muteAllOtherMedia(activePostId, activeIndex) {
  memoryState.posts.forEach((post) => {
    post.media.forEach((media, index) => {
      if (post.id === activePostId && index === activeIndex) return;
      media.muted = true;
    });
    if (post.music) post.music.muted = true;
  });

  document.querySelectorAll(".feedVideo").forEach((video) => {
    video.muted = true;
  });

  document.querySelectorAll('.feedVideoFrame[data-youtube="true"]').forEach((iframe) => {
    sendYouTubeCommand(iframe, "mute");
  });

  document.querySelectorAll(".mediaVolumeButton").forEach((button) => {
    updateVolumeButton(button, true);
  });

  document.querySelectorAll(".postMusicPlayer").forEach((audio) => {
    audio.muted = true;
    audio.pause();
  });

  document.querySelectorAll('[data-music-youtube="true"]').forEach((iframe) => {
    sendYouTubeCommand(iframe, "mute");
    sendYouTubeCommand(iframe, "pauseVideo");
  });

  document.querySelectorAll(".musicToggleButton").forEach((button) => {
    updateMusicButton(button, false);
  });
}

function handlePageVisibilityChange() {
  if (document.hidden) {
    pauseAllPageMedia({ remember: true });
  } else {
    resumePageMedia();
  }
}

function pauseAllPageMedia(options = {}) {
  const shouldRemember = options.remember !== false;
  if (shouldRemember && !pageMediaResumeState) {
    pageMediaResumeState = capturePageMediaResumeState();
  }

  document.querySelectorAll(".feedVideo, .viewerVideo").forEach((video) => {
    video.dataset.wasPageHiddenMuted = String(video.muted);
    video.muted = true;
    video.pause();
  });

  document.querySelectorAll(".postMusicPlayer").forEach((audio) => {
    audio.dataset.wasPageHiddenMuted = String(audio.muted);
    audio.muted = true;
    audio.pause();
  });

  document.querySelectorAll('.feedVideoFrame[data-youtube="true"], .viewerVideoFrame[data-youtube="true"]').forEach((iframe) => {
    sendYouTubeCommand(iframe, "mute");
    sendYouTubeCommand(iframe, "pauseVideo");
  });

  document.querySelectorAll('[data-music-youtube="true"]').forEach((iframe) => {
    sendYouTubeCommand(iframe, "mute");
    sendYouTubeCommand(iframe, "pauseVideo");
  });
}

function capturePageMediaResumeState() {
  const state = {
    createdAt: Date.now(),
    feedVideos: [],
    feedIframes: [],
    music: [],
    viewerVideo: null,
    viewerIframe: null,
    hasActiveMedia: false
  };

  document.querySelectorAll(".feedVideo").forEach((video) => {
    const article = video.closest(".memoryPost");
    const postId = article?.dataset.postId || "";
    const mediaIndex = Number(video.dataset.mediaIndex || 0);
    const post = memoryState.posts.find((item) => item.id === postId);
    const media = post?.media?.[mediaIndex];
    const activeIndex = memoryState.carousel.get(postId) || 0;
    const isActiveSlide = activeIndex === mediaIndex;
    const wasPlaying = !video.paused && !video.ended;
    const shouldResume = wasPlaying || (isActiveSlide && isElementInViewport(video));

    if (!shouldResume) return;
    state.hasActiveMedia = true;
    state.feedVideos.push({
      postId,
      mediaIndex,
      currentTime: safeCurrentTime(video),
      muted: media?.muted === false ? false : Boolean(video.muted),
      volume: safeVolume(video),
      wasPlaying,
      shouldResume
    });
  });

  document.querySelectorAll('.feedVideoFrame[data-youtube="true"]').forEach((iframe) => {
    const article = iframe.closest(".memoryPost");
    const postId = article?.dataset.postId || iframe.dataset.postId || "";
    const mediaIndex = Number(iframe.dataset.mediaIndex || 0);
    const post = memoryState.posts.find((item) => item.id === postId);
    const media = post?.media?.[mediaIndex];
    const activeIndex = memoryState.carousel.get(postId) || 0;
    const isActiveSlide = activeIndex === mediaIndex;
    if (!isActiveSlide || !isElementInViewport(iframe)) return;

    state.hasActiveMedia = true;
    state.feedIframes.push({
      postId,
      mediaIndex,
      muted: media?.muted !== false,
      shouldResume: true
    });
  });

  document.querySelectorAll(".postMusicPlayer").forEach((audio) => {
    const article = audio.closest(".memoryPost");
    const postId = article?.dataset.postId || "";
    const post = memoryState.posts.find((item) => item.id === postId);
    const music = post?.music;
    const wasPlaying = !audio.paused && !audio.ended;
    const shouldResume = wasPlaying || Boolean(music?.started && music.muted === false);
    if (!shouldResume) return;

    state.hasActiveMedia = true;
    state.music.push({
      postId,
      currentTime: safeCurrentTime(audio),
      muted: music?.muted === false ? false : Boolean(audio.muted),
      volume: safeVolume(audio),
      wasPlaying,
      started: Boolean(music?.started),
      src: audio.currentSrc || audio.src || ""
    });
  });

  const viewerModal = document.getElementById("viewerModal");
  if (viewerModal && !viewerModal.hidden) {
    const media = memoryState.viewerMedia[memoryState.viewerIndex];
    const activeViewerSlide = getActiveViewerSlide();
    const video = activeViewerSlide?.querySelector(".viewerVideo");
    if (video && media) {
      const wasPlaying = !video.paused && !video.ended;
      const shouldResume = wasPlaying || media.muted === false;
      if (shouldResume) {
        state.hasActiveMedia = true;
        state.viewerVideo = {
          index: memoryState.viewerIndex,
          currentTime: safeCurrentTime(video),
          muted: media.muted === false ? false : Boolean(video.muted),
          volume: safeVolume(video),
          wasPlaying,
          shouldResume
        };
      }
    }

    const iframe = activeViewerSlide?.querySelector('.viewerVideoFrame[data-youtube="true"]');
    if (iframe && media) {
      state.hasActiveMedia = true;
      state.viewerIframe = {
        index: memoryState.viewerIndex,
        muted: media.muted !== false,
        shouldResume: true
      };
    }
  }

  return state.hasActiveMedia ? state : null;
}

function resumePageMedia() {
  if (document.hidden) return;

  const state = pageMediaResumeState;
  if (!state) return;
  pageMediaResumeState = null;

  window.clearTimeout(pageMediaResumeTimer);
  pageMediaResumeTimer = window.setTimeout(() => restorePageMediaState(state), 120);
}

function restorePageMediaState(state) {
  if (!state || document.hidden) return;

  state.feedVideos.forEach((item) => {
    const article = findMemoryArticle(item.postId);
    const post = memoryState.posts.find((entry) => entry.id === item.postId);
    const media = post?.media?.[item.mediaIndex];
    const video = article?.querySelector(`video[data-media-index="${item.mediaIndex}"]`);
    if (!article || !video) return;

    if (media) media.muted = item.muted;
    video.muted = item.muted;
    video.volume = item.volume;
    restoreCurrentTime(video, item.currentTime);
    updateVolumeButton(article.querySelector(`.mediaVolumeButton[data-index="${item.mediaIndex}"]`), item.muted);

    if (item.shouldResume) {
      const activeIndex = memoryState.carousel.get(item.postId) || 0;
      if (activeIndex === item.mediaIndex && isElementInViewport(video)) {
        video.play().catch(() => {});
      }
    }
  });

  state.feedIframes.forEach((item) => {
    const article = findMemoryArticle(item.postId);
    const post = memoryState.posts.find((entry) => entry.id === item.postId);
    const media = post?.media?.[item.mediaIndex];
    const iframe = article?.querySelector(`iframe[data-media-index="${item.mediaIndex}"]`);
    if (!article || !iframe) return;

    if (media) media.muted = item.muted;
    sendYouTubeCommand(iframe, item.muted ? "mute" : "unMute");
    if (item.shouldResume && isElementInViewport(iframe)) sendYouTubeCommand(iframe, "playVideo");
  });

  state.music.forEach((item) => {
    const article = findMemoryArticle(item.postId);
    const post = memoryState.posts.find((entry) => entry.id === item.postId);
    const music = post?.music;
    const audio = article?.querySelector(".postMusicPlayer");
    const button = article?.querySelector(".musicToggleButton");
    if (!article || !music || !audio) return;

    music.muted = item.muted;
    music.started = item.started || item.wasPlaying;
    audio.muted = item.muted;
    audio.volume = item.volume;
    if (item.src && !audio.currentSrc && !audio.src) audio.src = item.src;
    restoreCurrentTime(audio, item.currentTime);
    updateMusicButton(button, !item.muted && music.started);

    if (music.started && !item.muted && isElementInViewport(article)) {
      preparePostMusic(post, article)
        .then(() => {
          audio.muted = false;
          restoreCurrentTime(audio, item.currentTime);
          return audio.play();
        })
        .catch(() => {
          updateMusicButton(button, false);
        });
    }
  });

  if (state.viewerVideo && !document.getElementById("viewerModal")?.hidden) {
    const media = memoryState.viewerMedia[state.viewerVideo.index];
    const activeViewerSlide = getActiveViewerSlide();
    const video = activeViewerSlide?.querySelector(".viewerVideo");
    const button = activeViewerSlide?.querySelector(".viewerVolumeButton");
    if (media && video) {
      media.muted = state.viewerVideo.muted;
      video.muted = state.viewerVideo.muted;
      video.volume = state.viewerVideo.volume;
      restoreCurrentTime(video, state.viewerVideo.currentTime);
      updateVolumeButton(button, state.viewerVideo.muted);
      if (state.viewerVideo.shouldResume) video.play().catch(() => {});
    }
  }

  if (state.viewerIframe && !document.getElementById("viewerModal")?.hidden) {
    const media = memoryState.viewerMedia[state.viewerIframe.index];
    const activeViewerSlide = getActiveViewerSlide();
    const iframe = activeViewerSlide?.querySelector('.viewerVideoFrame[data-youtube="true"]');
    if (media && iframe) {
      media.muted = state.viewerIframe.muted;
      sendYouTubeCommand(iframe, state.viewerIframe.muted ? "mute" : "unMute");
      if (state.viewerIframe.shouldResume) sendYouTubeCommand(iframe, "playVideo");
    }
  }
}

function findMemoryArticle(postId) {
  return Array.from(document.querySelectorAll(".memoryPost"))
    .find((article) => article.dataset.postId === postId);
}

function isElementInViewport(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const width = window.innerWidth || document.documentElement.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom > 0 && rect.right > 0 && rect.top < height && rect.left < width;
}

function safeCurrentTime(element) {
  return Number.isFinite(element?.currentTime) ? element.currentTime : 0;
}

function safeVolume(element) {
  return Number.isFinite(element?.volume) ? element.volume : 1;
}

function restoreCurrentTime(element, seconds) {
  if (!element || !Number.isFinite(seconds) || seconds <= 0) return;

  const restore = () => {
    try {
      element.currentTime = seconds;
    } catch (error) {
      // Some media sources cannot be seeked until enough metadata is loaded.
    }
  };

  if (element.readyState >= 1) restore();
  else element.addEventListener("loadedmetadata", restore, { once: true });
}

function updateVolumeButton(button, muted) {
  if (!button) return;
  button.classList.toggle("audible", !muted);
  button.innerHTML = muted ? "&#128263;" : "&#128266;";
  button.setAttribute("aria-label", muted ? "Turn on video sound" : "Mute video");
}

function sendYouTubeCommand(iframe, command) {
  iframe?.contentWindow?.postMessage(JSON.stringify({
    event: "command",
    func: command,
    args: []
  }), "*");
}

function observeFeedVideos() {
  feedVideoObserver?.disconnect();
  feedVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const element = entry.target;
      const visible = entry.isIntersecting && entry.intersectionRatio >= .55;

      if (document.hidden) {
        if (element instanceof HTMLVideoElement) element.pause();
        else if (element.dataset.youtube === "true") sendYouTubeCommand(element, "pauseVideo");
        return;
      }

      if (element instanceof HTMLVideoElement) {
        if (visible) element.play().catch(() => {});
        else element.pause();
      } else if (element.dataset.youtube === "true") {
        sendYouTubeCommand(element, visible ? "playVideo" : "pauseVideo");
      }
    });
  }, { threshold: [0, .55, 1] });

  document.querySelectorAll(".feedVideo, .feedVideoFrame").forEach((element) => {
    feedVideoObserver.observe(element);
  });
}

function observePostMusic() {
  postMusicObserver?.disconnect();
  postMusicObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const article = entry.target;
      const post = memoryState.posts.find((item) => item.id === article.dataset.postId);
      const music = post?.music;
      const visible = entry.isIntersecting && entry.intersectionRatio >= .45;
      if (!music) return;

      if (document.hidden) {
        article.querySelector(".postMusicPlayer")?.pause();
        const iframe = article.querySelector('[data-music-youtube="true"]');
        if (iframe) sendYouTubeCommand(iframe, "pauseVideo");
        return;
      }

      if (visible && music.kind === "drive-audio" && !music.objectUrl) {
        preparePostMusic(post, article).catch(() => {});
      }

      if (!music.started || music.muted) return;

      const audio = article.querySelector(".postMusicPlayer");
      const iframe = article.querySelector('[data-music-youtube="true"]');

      if (audio) {
        if (visible) audio.play().catch(() => {});
        else audio.pause();
      }

      if (iframe) sendYouTubeCommand(iframe, visible ? "playVideo" : "pauseVideo");
    });
    scheduleMusicAutoplaySync();
  }, { threshold: [0, .45, 1] });

  document.querySelectorAll('.memoryPost[data-has-music="true"]').forEach((article) => {
    postMusicObserver.observe(article);
  });
}

function handleFeedVideoError(event) {
  const video = event.target;
  if (!(video instanceof HTMLVideoElement) || !video.dataset.drivePreview) return;

  const slide = video.closest(".videoSlide");
  if (!slide || slide.dataset.driveFallback === "true") return;
  slide.dataset.driveFallback = "true";

  const iframe = document.createElement("iframe");
  iframe.className = "feedVideoFrame";
  iframe.src = video.dataset.drivePreview;
  iframe.title = "Google Drive video";
  iframe.allow = "autoplay; fullscreen";
  iframe.allowFullscreen = true;
  video.replaceWith(iframe);

  const volumeButton = slide.querySelector(".mediaVolumeButton");
  if (volumeButton) volumeButton.hidden = true;
}

function handleEmbeddedMediaLoad(event) {
  const iframe = event.target;
  if (!(iframe instanceof HTMLIFrameElement) || iframe.dataset.musicYoutube !== "true") return;

  const post = memoryState.posts.find((item) => item.id === iframe.dataset.postId);
  if (document.hidden || !post?.music?.started || post.music.muted) return;
  sendYouTubeCommand(iframe, "unMute");
  sendYouTubeCommand(iframe, "playVideo");
}

function moveCarousel(id, direction) {
  const post = memoryState.posts.find((item) => item.id === id);
  if (!post || post.media.length < 2) return;

  const current = memoryState.carousel.get(id) || 0;
  const next = Math.max(0, Math.min(post.media.length - 1, current + direction));
  memoryState.carousel.set(id, next);
  updateCarouselElement(id, next, true);
}

function updateCarouselElement(id, index, animate) {
  const article = Array.from(document.querySelectorAll(".memoryPost"))
    .find((item) => item.dataset.postId === id);
  const post = memoryState.posts.find((item) => item.id === id);
  if (!article || !post) return;

  const track = article.querySelector(".mediaTrack");
  if (!track) return;

  track.style.transition = animate ? "transform .34s cubic-bezier(.22,.72,.2,1)" : "none";
  track.style.transform = `translateX(-${index * 100}%)`;

  const counter = article.querySelector(".mediaCounter");
  if (counter) counter.textContent = `${index + 1}/${post.media.length}`;

  article.querySelectorAll(".mediaDot").forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === index);
  });

  const previous = article.querySelector('[data-action="previous"]');
  const next = article.querySelector('[data-action="next"]');
  if (previous) previous.hidden = index === 0;
  if (next) next.hidden = index === post.media.length - 1;
  window.setTimeout(() => syncActiveCarouselPlayback(article, index), animate ? 180 : 0);
}

function syncActiveCarouselPlayback(article, activeIndex) {
  article.querySelectorAll(".mediaSlide").forEach((slide, index) => {
    const active = index === activeIndex;
    const video = slide.querySelector("video");
    const iframe = slide.querySelector('.feedVideoFrame[data-youtube="true"]');

    if (video) {
      if (active && !document.hidden) video.play().catch(() => {});
      else video.pause();
    }

    if (iframe) sendYouTubeCommand(iframe, active && !document.hidden ? "playVideo" : "pauseVideo");
  });
}

function startFeedSwipe(event) {
  const media = event.target.closest(".postMedia");
  const article = event.target.closest(".memoryPost");
  const touch = event.changedTouches?.[0];

  if (!media || !article || !touch || event.target.closest("iframe, button")) return;

  touchGesture = {
    scope: "feed",
    id: article.dataset.postId,
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now(),
    width: media.clientWidth,
    currentIndex: memoryState.carousel.get(article.dataset.postId) || 0,
    mediaCount: article.querySelectorAll(".mediaSlide").length,
    track: media.querySelector(".mediaTrack"),
    horizontal: false
  };
}

function moveFeedSwipe(event) {
  if (!touchGesture || touchGesture.scope !== "feed") return;
  const touch = event.changedTouches?.[0];
  if (!touch || !touchGesture.track) return;

  const deltaX = touch.clientX - touchGesture.x;
  const deltaY = touch.clientY - touchGesture.y;

  if (!touchGesture.horizontal) {
    if (Math.abs(deltaX) < 8) return;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    touchGesture.horizontal = true;
  }

  event.preventDefault();

  const atFirst = touchGesture.currentIndex === 0 && deltaX > 0;
  const atLast = touchGesture.currentIndex === touchGesture.mediaCount - 1 && deltaX < 0;
  const resistedX = atFirst || atLast ? deltaX * .22 : deltaX;

  touchGesture.track.style.transition = "none";
  touchGesture.track.style.transform = `translateX(calc(-${touchGesture.currentIndex * 100}% + ${resistedX}px))`;
}

function endFeedSwipe(event) {
  if (!touchGesture || touchGesture.scope !== "feed") return;
  const gesture = touchGesture;
  touchGesture = null;
  const touch = event.changedTouches?.[0];
  if (!touch) return;

  const deltaX = touch.clientX - gesture.x;
  const deltaY = touch.clientY - gesture.y;
  const elapsed = Math.max(1, Date.now() - gesture.time);
  const velocity = Math.abs(deltaX) / elapsed;
  const enoughDistance = Math.abs(deltaX) >= Math.min(85, gesture.width * .16);
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
  const direction = horizontal && (enoughDistance || (Math.abs(deltaX) > 28 && velocity > .38))
    ? (deltaX < 0 ? 1 : -1)
    : 0;
  const canMove = direction === 1
    ? gesture.currentIndex < gesture.mediaCount - 1
    : gesture.currentIndex > 0;

  if (gesture.horizontal) memoryState.suppressClickUntil = Date.now() + 450;

  if (direction && canMove) {
    moveCarousel(gesture.id, direction);
  } else {
    updateCarouselElement(gesture.id, gesture.currentIndex, true);
  }
}

function startViewerSwipe(event) {
  if (memoryState.viewerMedia.length < 2 || memoryState.viewerAnimating) return;
  if (event.touches && event.touches.length > 1) return;

  const touch = event.changedTouches?.[0];
  if (!touch || event.target.closest("video, iframe, button")) return;

  const content = document.getElementById("viewerContent");
  const track = content?.querySelector(".viewerTrack");
  if (!content || !track) return;

  touchGesture = {
    scope: "viewer",
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now(),
    width: content.clientWidth || window.innerWidth || 360,
    content,
    track,
    currentIndex: memoryState.viewerIndex,
    mediaCount: memoryState.viewerMedia.length,
    horizontal: false,
    deltaX: 0
  };
}

function moveViewerSwipe(event) {
  if (!touchGesture || touchGesture.scope !== "viewer") return;
  if (event.touches && event.touches.length > 1) {
    resetViewerSwipePosition(touchGesture.content);
    touchGesture = null;
    return;
  }

  const touch = event.changedTouches?.[0];
  if (!touch) return;

  const deltaX = touch.clientX - touchGesture.x;
  const deltaY = touch.clientY - touchGesture.y;

  if (!touchGesture.horizontal) {
    if (Math.abs(deltaX) < 8) return;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    touchGesture.horizontal = true;
  }

  event.preventDefault();

  const atFirst = touchGesture.currentIndex === 0 && deltaX > 0;
  const atLast = touchGesture.currentIndex === touchGesture.mediaCount - 1 && deltaX < 0;
  const resistedX = atFirst || atLast ? deltaX * .28 : deltaX;

  setViewerTrackPosition(touchGesture.currentIndex, resistedX, false);
  touchGesture.deltaX = resistedX;
}

function endViewerSwipe(event) {
  if (!touchGesture || touchGesture.scope !== "viewer") return;
  const gesture = touchGesture;
  touchGesture = null;
  const touch = event.changedTouches?.[0];
  if (!touch) return;

  const direction = getViewerSwipeDirection(gesture, touch);
  const canMove = direction === 1
    ? gesture.currentIndex < gesture.mediaCount - 1
    : gesture.currentIndex > 0;

  if (gesture.horizontal || direction) memoryState.suppressClickUntil = Date.now() + 450;

  if (direction && canMove) {
    moveViewer(direction, { smooth: true, gesture });
  } else {
    setViewerTrackPosition(gesture.currentIndex, 0, true);
  }
}

function getSwipeDirection(start, endTouch) {
  const deltaX = endTouch.clientX - start.x;
  const deltaY = endTouch.clientY - start.y;
  const elapsed = Date.now() - start.time;

  if (elapsed > 900 || Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
    return 0;
  }

  return deltaX < 0 ? 1 : -1;
}

function getViewerSwipeDirection(start, endTouch) {
  const deltaX = endTouch.clientX - start.x;
  const deltaY = endTouch.clientY - start.y;
  const elapsed = Math.max(1, Date.now() - start.time);
  const width = Math.max(1, start.width || window.innerWidth || 360);
  const velocity = Math.abs(deltaX) / elapsed;
  const enoughDistance = Math.abs(deltaX) >= Math.min(100, width * .18);
  const quickFlick = Math.abs(deltaX) > 34 && velocity > .34;
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.15;

  if (!horizontal || elapsed > 1000 || (!enoughDistance && !quickFlick)) return 0;
  return deltaX < 0 ? 1 : -1;
}

const MEMORY_HEART_PENDING = new Set();

async function heartMemory(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId || MEMORY_HEART_PENDING.has(cleanId)) return false;

  const post = memoryState.posts.find((item) => item.id === cleanId);
  if (!post) return false;

  const nextHearted = !isMemoryHeartedByThisDevice(post);
  MEMORY_HEART_PENDING.add(cleanId);
  setMemoryHeartButtonSaving(cleanId, true);

  try {
    const result = await saveMemoryHeartToDatabase(cleanId, 0, nextHearted);
    applyMemoryHeartResult(cleanId, result.count, result.hearted, result.heartUsers);
    updateMemoryHeartDisplay(cleanId);
    saveMemoryCacheSnapshot();
  } catch (error) {
    console.error("Memory heart failed:", error);
    showToast("Unable to save heart. Please refresh and try again.");
  } finally {
    MEMORY_HEART_PENDING.delete(cleanId);
    setMemoryHeartButtonSaving(cleanId, false);
  }

  return false;
}

function setMemoryHeartButtonSaving(id, saving) {
  const article = Array.from(document.querySelectorAll(".memoryPost"))
    .find((item) => item.dataset.postId === String(id || ""));
  const button = article?.querySelector('.heartButton[data-action="heart"]');
  if (!button) return;
  button.disabled = Boolean(saving);
  button.classList.toggle("is-saving", Boolean(saving));
}

async function saveMemoryHeartToDatabase(id, delta, hearted) {
  const db = getClassBoardFirestore();
  if (db) {
    return saveMemoryHeartDirectToFirebase(id, delta, hearted);
  }

  return postMemoryApi("memoryHeartV2", { MemoryID: id, memoryId: id, id, hearted, deviceId: getClassBoardHeartDeviceId() });
}

async function saveMemoryHeartDirectToFirebase(id, delta, hearted) {
  const db = getClassBoardFirestore();
  if (!db) throw new Error("Firebase is not ready.");

  const ref = await resolveMemoryDocumentRef(db, id);
  if (!ref) throw new Error("Memory record was not found in Firebase.");

  const deviceId = getClassBoardHeartDeviceId();
  const requestedHearted = typeof hearted === "boolean" ? hearted : null;

  let nextCount = 0;
  let serverHearted = false;
  let heartUsers = {};

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);
    if (!doc.exists) throw new Error("Memory record was not found in Firebase.");

    const data = doc.data() || {};
    heartUsers = getHeartUsersV2(data);
    const currentlyHearted = Boolean(heartUsers[deviceId]);
    const nextHearted = requestedHearted === null ? !currentlyHearted : requestedHearted;

    if (nextHearted) heartUsers[deviceId] = true;
    else delete heartUsers[deviceId];

    nextCount = Object.keys(heartUsers).length;
    serverHearted = Boolean(heartUsers[deviceId]);

    const update = {
      HeartUsersV2: heartUsers,
      heartUsersV2: heartUsers,
      HeartCountV2: nextCount,
      heartCountV2: nextCount,
      NotedCountV2: nextCount,
      notedCountV2: nextCount
    };
    if (window.firebase?.firestore?.FieldValue) {
      update.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    transaction.set(ref, update, { merge: true });
  });

  return { success: true, count: nextCount, hearted: serverHearted, heartUsers };
}

async function resolveMemoryDocumentRef(db, id) {
  const cleanId = String(id || "").trim();
  if (!cleanId) return null;

  const collection = db.collection("memories");

  try {
    const direct = await collection.doc(cleanId).get();
    if (direct.exists) return direct.ref;
  } catch (error) {
    console.warn("Direct memory document lookup failed:", error);
  }

  const fields = ["docId", "DocID", "ID", "id", "MemoryID", "memoryId"];
  for (const field of fields) {
    try {
      const snap = await collection.where(field, "==", cleanId).limit(1).get();
      if (!snap.empty) return snap.docs[0].ref;
    } catch (error) {
      console.warn(`Memory lookup by ${field} failed:`, error);
    }
  }

  return null;
}

function applyMemoryHeartResult(id, count, hearted, heartUsers) {
  const cleanId = String(id || "").trim();
  const deviceId = getClassBoardHeartDeviceId();
  const map = normalizeHeartedDevices(heartUsers);
  if (Object.keys(map).length === 0 && hearted) map[deviceId] = true;
  if (!hearted) delete map[deviceId];
  const safeCount = Math.max(0, Number.isFinite(Number(count)) ? Number(count) : Object.keys(map).length);

  memoryState.posts = memoryState.posts.map((post) => {
    if (post.id !== cleanId) return post;
    return {
      ...post,
      heartUsersV2: map,
      HeartUsersV2: map,
      HeartCountV2: safeCount,
      heartCountV2: safeCount,
      heartCount: safeCount
    };
  });
}

function updateMemoryHeartDisplay(id) {
  const post = memoryState.posts.find((item) => item.id === id);
  const article = Array.from(document.querySelectorAll(".memoryPost"))
    .find((item) => item.dataset.postId === id);
  if (!post || !article) return;

  const hearted = isMemoryHeartedByThisDevice(post);
  const button = article.querySelector('.heartButton[data-action="heart"]');
  const count = article.querySelector(".heartCount");

  if (button) {
    button.classList.toggle("hearted", hearted);
    button.innerHTML = hearted ? "&#9829;" : "&#9825;";
  }

  if (count) {
    count.textContent = formatHeartCount(post.heartCount);
  }

  updateMemoryStats();
}

function syncMemoryHeartStatesFromServer(posts) {
  const deviceId = getClassBoardHeartDeviceId();
  (posts || []).forEach(post => {
    const id = String(post?.id || "").trim();
    if (!id) return;

    const users = getHeartUsersV2(post);
    if (users[deviceId]) setHeartedMemory(id);
    else unsetHeartedMemory(id);
  });
}

function saveMemoryCacheSnapshot() {
  try {
    localStorage.setItem(MEMORY_CACHE_KEY, JSON.stringify(memoryState.posts));
  } catch (error) {
    console.warn("Unable to update memories cache:", error);
  }
}


const HEART_DEVICE_ID_KEY = "sfkClassBoardHeartDeviceId.v1";

function getClassBoardHeartDeviceId() {
  try {
    const existing = localStorage.getItem(HEART_DEVICE_ID_KEY);
    if (existing) return existing;
    const random = window.crypto && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(12))).map(value => value.toString(16).padStart(2, "0")).join("")
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const id = `device-${random}`;
    localStorage.setItem(HEART_DEVICE_ID_KEY, id);
    return id;
  } catch (error) {
    return "device-fallback";
  }
}

function normalizeHeartedDevices(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, isHearted]) => key && Boolean(isHearted))
      .map(([key]) => [String(key), true])
  );
}

function makeHeartDocId(targetId, deviceId) {
  return `${safeHeartDocPart(targetId)}__${safeHeartDocPart(deviceId)}`.slice(0, 1400);
}

function safeHeartDocPart(value) {
  return encodeURIComponent(String(value || ""))
    .replace(/\./g, "%2E")
    .replace(/%/g, "_");
}

function getHeartedMemoryIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(HEARTED_MEMORY_KEY) || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch (error) {
    return [];
  }
}

function setHeartedMemory(id) {
  const ids = getHeartedMemoryIds();
  if (!ids.includes(id)) ids.push(id);
  localStorage.setItem(HEARTED_MEMORY_KEY, JSON.stringify(ids.slice(-500)));
}

function unsetHeartedMemory(id) {
  const ids = getHeartedMemoryIds().filter((item) => item !== id);
  localStorage.setItem(HEARTED_MEMORY_KEY, JSON.stringify(ids.slice(-500)));
}

async function shareMemory(id) {
  const post = memoryState.posts.find((item) => item.id === id);
  if (!post) return;

  const format = await chooseMemoryShareFormat();
  if (!format) return;

  const shareUrl = new URL("memories.html", window.location.href);
  shareUrl.searchParams.set("memory", id);
  const shareData = {
    title: `${post.title} | SFK Memories`,
    text: `${post.title}${post.caption ? ` - ${post.caption}` : ""}`.trim(),
    url: shareUrl.href
  };
  const button = getShareButtonById(id);

  try {
    setShareButtonBusy(button, true);
    showMemoryToast(format === "story" ? "Creating Story share image..." : "Creating original share image...");

    const image = await createMemoryShareImage(post, format);
    if (image?.file && navigator.share && navigator.canShare && navigator.canShare({ files: [image.file] })) {
      await navigator.share({
        title: shareData.title,
        text: shareData.text,
        files: [image.file]
      });
      showMemoryToast("Share image ready.");
      return;
    }

    if (image?.blob) {
      downloadBlob(image.blob, image.fileName);
      try {
        await copyMemoryLink(shareData.url);
        showMemoryToast("Share image downloaded. Link copied too.");
      } catch (copyError) {
        showMemoryToast("Share image downloaded.");
      }
      return;
    }

    await shareMemoryLinkFallback(shareData);
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.warn("Memory image share failed:", error);
    try {
      await shareMemoryLinkFallback(shareData);
    } catch (fallbackError) {
      console.warn("Memory link fallback failed:", fallbackError);
      showMemoryToast("Unable to share this memory.");
    }
  } finally {
    setShareButtonBusy(button, false);
  }
}

function chooseMemoryShareFormat() {
  return new Promise((resolve) => {
    document.querySelector(".shareFormatLayer")?.remove();

    const layer = document.createElement("div");
    layer.className = "shareFormatLayer";
    layer.innerHTML = `
      <button class="shareFormatBackdrop" type="button" data-share-format="" aria-label="Cancel"></button>
      <section class="shareFormatSheet" role="dialog" aria-modal="true" aria-labelledby="shareFormatTitle">
        <div class="shareFormatHandle" aria-hidden="true"></div>
        <div class="shareFormatHeading">
          <div>
            <span class="shareFormatEyebrow">SHARE IMAGE</span>
            <h2 id="shareFormatTitle">Choose a size</h2>
          </div>
          <button class="shareFormatClose" type="button" data-share-format="" aria-label="Close">&times;</button>
        </div>
        <div class="shareFormatChoices">
          <button class="shareFormatChoice" type="button" data-share-format="original">
            <span class="shareFormatPreview shareFormatPreviewOriginal" aria-hidden="true"></span>
            <span><strong>Original Post</strong><small>1080 &times; 1350</small></span>
            <span class="shareFormatArrow" aria-hidden="true">&rsaquo;</span>
          </button>
          <button class="shareFormatChoice shareFormatChoiceStory" type="button" data-share-format="story">
            <span class="shareFormatPreview shareFormatPreviewStory" aria-hidden="true"></span>
            <span><strong>FB / IG Story</strong><small>1080 &times; 1920</small></span>
            <span class="shareFormatArrow" aria-hidden="true">&rsaquo;</span>
          </button>
        </div>
      </section>
    `;

    const finish = (format) => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.classList.remove("shareFormatOpen");
      layer.classList.remove("isOpen");
      window.setTimeout(() => layer.remove(), 160);
      resolve(format || "");
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") finish("");
    };

    layer.addEventListener("click", (event) => {
      const target = event.target.closest("[data-share-format]");
      if (!target) return;
      finish(target.dataset.shareFormat);
    });
    document.addEventListener("keydown", handleKeydown);
    document.body.appendChild(layer);
    document.body.classList.add("shareFormatOpen");
    requestAnimationFrame(() => layer.classList.add("isOpen"));
    layer.querySelector('[data-share-format="original"]')?.focus();
  });
}

async function shareMemoryLinkFallback(shareData) {
  const mobileLike = window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (navigator.share && mobileLike) {
    await navigator.share(shareData);
    return;
  }
  await copyMemoryLink(shareData.url);
  showMemoryToast("Memory link copied.");
}

function getShareButtonById(id) {
  return Array.from(document.querySelectorAll('.shareButton[data-action="share"]'))
    .find((button) => button.dataset.id === id);
}

function setShareButtonBusy(button, busy) {
  if (!button) return;
  button.disabled = busy;
  button.classList.toggle("loading", busy);
  button.setAttribute("aria-busy", busy ? "true" : "false");
  button.innerHTML = `<span class="shareButtonIcon" aria-hidden="true">${busy ? "&#8635;" : "&#8599;"}</span>`;
}

async function createMemoryShareImage(post, format = "original") {
  const isStory = format === "story";
  const canvas = document.createElement("canvas");
  canvas.width = isStory ? MEMORY_SHARE_STORY_WIDTH : MEMORY_SHARE_IMAGE_WIDTH;
  canvas.height = isStory ? MEMORY_SHARE_STORY_HEIGHT : MEMORY_SHARE_IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  drawShareBackground(ctx, canvas.width, canvas.height);

  const imageCount = (post.media || []).filter((item) => item.kind === "image").length;
  const layout = getMemoryShareLayout(canvas.width, canvas.height, isStory, imageCount);

  ctx.save();
  ctx.shadowColor = "rgba(17,17,17,.16)";
  ctx.shadowBlur = layout.cardShadowBlur;
  ctx.shadowOffsetY = layout.cardShadowOffsetY;
  drawRoundRect(ctx, layout.cardX, layout.cardY, layout.cardW, layout.cardH, layout.cardRadius);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  drawRoundRect(ctx, layout.cardX, layout.cardY, layout.cardW, layout.cardH, layout.cardRadius);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#181818";
  ctx.stroke();

  ctx.save();
  drawRoundRect(ctx, layout.cardX + 24, layout.cardY + 20, layout.cardW - 48, 6, 4);
  ctx.fillStyle = "#f7c600";
  ctx.globalAlpha = .95;
  ctx.fill();
  ctx.restore();

  drawShareHeader(ctx, post, layout.headerX, layout.headerY, layout.headerW);
  await drawShareMedia(ctx, post, layout.mediaX, layout.mediaY, layout.mediaW, layout.mediaH);
  drawShareDetails(ctx, post, layout.detailsX, layout.detailsY, layout.detailsW, imageCount > 0, canvas.height, layout.footerOffset);
  drawShareFooter(ctx, canvas.width, canvas.height, layout.footerOffset);

  const blob = await canvasToBlob(canvas);
  const fileSuffix = isStory ? "-story" : "";
  const fileName = `${safeShareFileName(post.title || "sfk-memory")}${fileSuffix}.png`;
  const file = typeof File !== "undefined"
    ? new File([blob], fileName, { type: "image/png", lastModified: Date.now() })
    : null;
  return { blob, file, fileName };
}

function getMemoryShareLayout(width, height, isStory, imageCount) {
  if (!isStory) {
    const margin = 64;
    const cardX = 42;
    const cardY = 42;
    const cardW = width - 84;
    const cardH = height - (cardY * 2);
    const mediaY = 190;
    const mediaH = imageCount ? 640 : 575;
    const footerOffset = 118;
    return {
      cardX,
      cardY,
      cardW,
      cardH,
      cardRadius: 42,
      cardShadowBlur: 30,
      cardShadowOffsetY: 12,
      headerX: margin,
      headerY: 78,
      headerW: width - (margin * 2),
      mediaX: margin,
      mediaY,
      mediaW: width - (margin * 2),
      mediaH,
      detailsX: margin,
      detailsY: mediaY + mediaH + 54,
      detailsW: width - (margin * 2),
      footerOffset
    };
  }

  const sideSafe = 38;
  const topSafe = 168;
  const bottomSafe = 268;
  const cardX = sideSafe;
  const cardY = topSafe;
  const cardW = width - (sideSafe * 2);
  const cardH = height - topSafe - bottomSafe;
  const innerPad = 28;
  const headerInset = 34;
  const headerX = cardX + headerInset;
  const headerY = cardY + 60;
  const headerW = cardW - (headerInset * 2);
  const mediaX = cardX + innerPad;
  const mediaY = headerY + 118;
  const mediaW = cardW - (innerPad * 2);
  const mediaH = imageCount ? 820 : 700;
  const detailsY = mediaY + mediaH + 76;
  const footerY = cardY + cardH - 92;
  const footerOffset = height - footerY;

  return {
    cardX,
    cardY,
    cardW,
    cardH,
    cardRadius: 42,
    cardShadowBlur: 32,
    cardShadowOffsetY: 14,
    headerX,
    headerY,
    headerW,
    mediaX,
    mediaY,
    mediaW,
    mediaH,
    detailsX: mediaX,
    detailsY,
    detailsW: mediaW,
    footerOffset
  };
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
  const glowA = ctx.createRadialGradient(width - 120, 100, 0, width - 120, 100, 320);
  glowA.addColorStop(0, "rgba(255,255,255,.72)");
  glowA.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glowA;
  ctx.beginPath();
  ctx.arc(width - 120, 100, 320, 0, Math.PI * 2);
  ctx.fill();

  const glowB = ctx.createRadialGradient(70, height - 95, 0, 70, height - 95, 250);
  glowB.addColorStop(0, "rgba(247,198,0,.22)");
  glowB.addColorStop(1, "rgba(247,198,0,0)");
  ctx.fillStyle = glowB;
  ctx.beginPath();
  ctx.arc(70, height - 95, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShareHeader(ctx, post, x, y, width) {
  ctx.save();
  ctx.shadowColor = "rgba(17,17,17,.10)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  drawRoundRect(ctx, x, y, 138, 58, 22);
  ctx.fillStyle = "#111111";
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#f7c600";
  ctx.font = "900 31px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SFK", x + 69, y + 30);

  ctx.textAlign = "left";
  ctx.fillStyle = "#111111";
  ctx.font = "900 38px Arial, Helvetica, sans-serif";
  ctx.fillText("SFK Updates 🫶", x + 162, y + 24);
  ctx.fillStyle = "#7a7568";
  ctx.font = "800 17px Arial, Helvetica, sans-serif";
  ctx.fillText("Grade 8 - St. Faustina Kowalska (SY \'26-\'27) • #BeKind", x + 163, y + 58);

  const dateText = post.date || post.createdAt || "Class Memory";
  ctx.font = "800 21px Arial, Helvetica, sans-serif";
  const dateW = Math.min(330, Math.max(178, ctx.measureText(dateText).width + 48));
  const dateX = x + width - dateW;
  ctx.save();
  ctx.shadowColor = "rgba(17,17,17,.08)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  drawRoundRect(ctx, dateX, y + 6, dateW, 48, 20);
  ctx.fillStyle = "#fff3b7";
  ctx.fill();
  ctx.restore();
  drawRoundRect(ctx, dateX, y + 6, dateW, 48, 20);
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.fillText(dateText, dateX + (dateW / 2), y + 31);
  ctx.textAlign = "left";
}

async function drawShareMedia(ctx, post, x, y, width, height) {
  ctx.save();
  ctx.shadowColor = "rgba(17,17,17,.13)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 7;
  drawRoundRect(ctx, x, y, width, height, 34);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  drawRoundRect(ctx, x, y, width, height, 34);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#181818";
  ctx.stroke();

  const imageMedia = post.media.filter((item) => item.kind === "image");
  if (imageMedia.length === 0) {
    drawShareTextOnlyMedia(ctx, post, x, y, width, height);
    return;
  }

  const framePad = 10;
  const innerX = x + framePad;
  const innerY = y + framePad;
  const innerW = width - (framePad * 2);
  const innerH = height - (framePad * 2);

  ctx.save();
  drawRoundRect(ctx, innerX, innerY, innerW, innerH, 26);
  ctx.fillStyle = "#faf7ef";
  ctx.fill();
  ctx.restore();

  const items = imageMedia.slice(0, MEMORY_SHARE_PREVIEW_LIMIT);
  const images = await Promise.all(items.map((item) => loadShareImage(item)));
  const gap = 10;
  const layouts = getShareMediaLayout(items.length, innerX, innerY, innerW, innerH, gap);
  const hasHeartGap = imageMedia.length >= 4;
  const heartSize = 21;
  const heartCx = innerX + (innerW / 2);
  const heartCy = innerY + (innerH / 2);

  if (hasHeartGap) {
    drawShareHeartGapBase(ctx, heartCx, heartCy, heartSize);
  }

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = Math.max(1, Math.round(innerW));
  tempCanvas.height = Math.max(1, Math.round(innerH));
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) {
    return;
  }

  layouts.forEach((box, index) => {
    const localX = box.x - innerX;
    const localY = box.y - innerY;
    tempCtx.save();
    drawRoundRect(tempCtx, localX, localY, box.w, box.h, box.r || 22);
    tempCtx.clip();
    tempCtx.fillStyle = "#f5f3ed";
    tempCtx.fillRect(localX, localY, box.w, box.h);
    if (images[index]) {
      if (imageMedia.length === 1) {
        drawContainImageWithSoftBackdrop(tempCtx, images[index], localX, localY, box.w, box.h);
      } else {
        drawCoverImage(tempCtx, images[index], localX, localY, box.w, box.h);
      }
    } else {
      drawShareMediaPlaceholder(tempCtx, localX, localY, box.w, box.h, "Photo");
    }
    if (index === layouts.length - 1 && imageMedia.length > MEMORY_SHARE_PREVIEW_LIMIT) {
      tempCtx.fillStyle = "rgba(17,17,17,.58)";
      tempCtx.fillRect(localX, localY, box.w, box.h);
      tempCtx.fillStyle = "#ffffff";
      tempCtx.font = "900 82px Arial, Helvetica, sans-serif";
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";
      tempCtx.fillText(`+${imageMedia.length - MEMORY_SHARE_PREVIEW_LIMIT}`, localX + box.w / 2, localY + box.h / 2);
      tempCtx.textAlign = "left";
      tempCtx.textBaseline = "alphabetic";
    }
    tempCtx.restore();
  });

  if (hasHeartGap) {
    tempCtx.save();
    tempCtx.globalCompositeOperation = "destination-out";
    drawHeartPath(tempCtx, heartCx - innerX, heartCy - innerY, heartSize + 5);
    tempCtx.fill();
    tempCtx.restore();
  }

  ctx.drawImage(tempCanvas, innerX, innerY);

  images.forEach((image) => {
    if (image?._shareObjectUrl) {
      window.setTimeout(() => URL.revokeObjectURL(image._shareObjectUrl), 1200);
    }
  });
}

function getShareMediaLayout(count, x, y, width, height, gap) {
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

function drawShareTextOnlyMedia(ctx, post, x, y, width, height) {
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
  wrapCanvasText(ctx, post.title || "Class Memory", x + 95, y + 238, width - 190, 68, 3);
  if (post.caption) {
    ctx.fillStyle = "#fff5c8";
    ctx.font = "700 31px Arial, Helvetica, sans-serif";
    wrapCanvasText(ctx, post.caption, x + 105, y + 456, width - 210, 42, 4);
  }
  ctx.textAlign = "left";
}

function drawShareMediaPlaceholder(ctx, x, y, width, height, label) {
  ctx.fillStyle = "#fff6c7";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#111111";
  ctx.font = "900 34px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label || "Memory", x + width / 2, y + height / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawShareHeartGapBase(ctx, cx, cy, size) {
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
  const heartGradient = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size * 1.1);
  heartGradient.addColorStop(0, "#fff8bf");
  heartGradient.addColorStop(0.45, "#f7c600");
  heartGradient.addColorStop(1, "#d7a600");
  ctx.fillStyle = heartGradient;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#111111";
  ctx.stroke();
  ctx.restore();
}

function drawHeartPath(ctx, cx, cy, size) {
  const topCurveHeight = size * 0.55;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.9);
  ctx.bezierCurveTo(
    cx - size * 1.35, cy + size * 0.18,
    cx - size * 1.2, cy - size * 0.72,
    cx, cy - size * 0.18
  );
  ctx.bezierCurveTo(
    cx + size * 1.2, cy - size * 0.72,
    cx + size * 1.35, cy + size * 0.18,
    cx, cy + size * 0.9
  );
  ctx.closePath();
}

function drawShareDetails(ctx, post, x, y, width, hasPhoto = false, canvasHeight = MEMORY_SHARE_IMAGE_HEIGHT, footerOffset = 118) {
  const titleMaxY = canvasHeight - footerOffset - 157;
  const captionMaxY = canvasHeight - footerOffset - 92;

  ctx.fillStyle = "#111111";
  ctx.font = hasPhoto ? "900 39px Arial, Helvetica, sans-serif" : "900 48px Arial, Helvetica, sans-serif";
  const titleLineHeight = hasPhoto ? 47 : 58;
  const titleLines = wrapCanvasText(ctx, post.title || "Untitled Memory", x, y, width, titleLineHeight, hasPhoto ? 2 : 3);
  let cursorY = y + (titleLines * titleLineHeight) + 18;

  if (post.caption && cursorY < titleMaxY) {
    ctx.fillStyle = "#36332d";
    ctx.font = hasPhoto ? "700 26px Arial, Helvetica, sans-serif" : "700 31px Arial, Helvetica, sans-serif";
    const captionLineHeight = hasPhoto ? 34 : 42;
    const maxCaptionLines = Math.max(1, Math.min(hasPhoto ? 2 : 4, Math.floor((captionMaxY - cursorY) / captionLineHeight)));
    const captionLines = wrapCanvasText(ctx, post.caption, x, cursorY, width, captionLineHeight, maxCaptionLines);
    cursorY += (captionLines * captionLineHeight) + 26;
  } else {
    cursorY += 20;
  }

  const metaY = Math.min(cursorY, canvasHeight - footerOffset - 96);
  const avatarSize = 60;

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
  ctx.font = "900 24px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getInitials(post.postedBy), x + avatarSize / 2, metaY + avatarSize / 2 + 1);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#111111";
  ctx.font = "900 27px Arial, Helvetica, sans-serif";
  ctx.fillText(post.postedBy || "SFK", x + avatarSize + 18, metaY + 40);

  if (post.media.length) {
    const attachmentText = `${post.media.length} attachment${post.media.length > 1 ? "s" : ""}`;
    ctx.fillStyle = "#6a5a16";
    ctx.font = "800 21px Arial, Helvetica, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(attachmentText, x + width, metaY + 43);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}

function drawShareFooter(ctx, width, height, footerOffset = 118) {
  const footerY = height - footerOffset;
  ctx.strokeStyle = "#eadfa9";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(88, footerY - 28);
  ctx.lineTo(width - 88, footerY - 28);
  ctx.stroke();

  const footerTextY = footerY;
  const parts = [
    { text: "S", color: "#f7c600", weight: "900" },
    { text: "o ", color: "#111111", weight: "900" },
    { text: "F", color: "#f7c600", weight: "900" },
    { text: "ar, so ", color: "#111111", weight: "900" },
    { text: "K", color: "#f7c600", weight: "900" },
    { text: "ind - SFK Memories", color: "#111111", weight: "900" }
  ];
  const fontSize = 24;
  const fontFamily = 'Arial, Helvetica, sans-serif';
  let totalWidth = 0;
  parts.forEach((part) => {
    ctx.font = `${part.weight} ${fontSize}px ${fontFamily}`;
    totalWidth += ctx.measureText(part.text).width;
  });
  let drawX = (width - totalWidth) / 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  parts.forEach((part) => {
    ctx.font = `${part.weight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = part.color;
    ctx.fillText(part.text, drawX, footerTextY);
    drawX += ctx.measureText(part.text).width;
  });

  ctx.fillStyle = "#7b6700";
  ctx.font = "800 20px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Our moments, milestones, and kind beginnings.", width / 2, footerY + 34);
  ctx.textAlign = "left";
}

async function loadShareImage(mediaItem) {
  const item = typeof mediaItem === "string" ? { url: mediaItem } : (mediaItem || {});
  const fileId = String(item.fileId || getDriveFileId(item.url) || getDriveFileId(item.viewerUrl) || getDriveFileId(item.fullUrl) || getDriveFileId(item.downloadUrl) || "").trim();

  // 1) If the media already has a data URL/base64 source, use it directly.
  const inlineImage = await loadInlineShareImage(item);
  if (inlineImage) return inlineImage;

  // 2) Safest path for Google Drive photos: Apps Script reads the Drive file and
  // returns base64. This avoids the browser canvas/CORS issue that causes the
  // yellow "Photo" placeholder.
  if (fileId) {
    const proxied = await fetchShareImageThroughApi(fileId);
    if (proxied) return proxied;
  }

  // 3) Fallback to public Google image URLs and stored URLs. Every image is
  // verified on a tiny canvas first, so the final share card can export cleanly.
  const candidates = getShareImageCandidates(item, fileId);
  for (const url of candidates) {
    const image = await loadVerifiedShareImage(url);
    if (image) return image;
  }

  return null;
}

async function loadInlineShareImage(item) {
  const inlineValues = [
    item.dataUrl,
    item.dataURL,
    item.base64,
    item.data && item.mimeType ? `data:${item.mimeType};base64,${item.data}` : ""
  ];

  for (const value of inlineValues) {
    const text = String(value || "").trim();
    if (!text || !text.startsWith("data:image/")) continue;
    const image = await loadShareImageElement(text, false);
    if (image && canUseImageInCanvas(image)) return image;
  }

  return null;
}

function getShareImageCandidates(item, fileId) {
  const urls = [];
  const add = (value) => {
    const safe = safeHttpUrl(value);
    if (safe && !urls.includes(safe)) urls.push(safe);
  };

  if (fileId) {
    add(`https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w2400`);
    add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w4000`);
    add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2000`);
    add(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`);
    add(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`);
  }

  add(item.viewerUrl);
  add(item.url);
  add(item.downloadUrl);
  add(item.fullUrl);
  return urls;
}

async function fetchShareImageThroughApi(fileId) {
  const url = getMemoryImageProxyUrl(fileId);
  if (!url) return null;

  try {
    const response = await fetch(`${url}&_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Image request failed (${response.status}).`);

    const result = await response.json();
    if (!result.success || !result.data) throw new Error(result.message || "Image data is missing.");

    const blob = base64ToBlob(result.data, result.mimeType || "image/jpeg");
    const objectUrl = URL.createObjectURL(blob);
    const image = await loadShareImageElement(objectUrl, false);
    if (image && canUseImageInCanvas(image)) {
      image._shareObjectUrl = objectUrl;
      return image;
    }
    URL.revokeObjectURL(objectUrl);
    return null;
  } catch (error) {
    console.warn("Memory image proxy failed. Trying direct image source.", error);
    return null;
  }
}

async function loadVerifiedShareImage(url) {
  // Try normal CORS image loading first.
  const direct = await loadShareImageElement(url, true);
  if (direct && canUseImageInCanvas(direct)) return direct;

  // Some public image URLs are easier to use as a fetched blob/object URL.
  const fetched = await fetchShareImageAsObjectUrl(url);
  if (fetched) return fetched;

  return null;
}

async function fetchShareImageAsObjectUrl(url) {
  const cleanUrl = safeHttpUrl(url);
  if (!cleanUrl) return null;

  try {
    const response = await fetch(cleanUrl, { mode: "cors", cache: "no-store" });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!String(blob.type || "").startsWith("image/")) return null;
    const objectUrl = URL.createObjectURL(blob);
    const image = await loadShareImageElement(objectUrl, false);
    if (image && canUseImageInCanvas(image)) {
      image._shareObjectUrl = objectUrl;
      return image;
    }
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    // Keep quiet; the next candidate may work.
  }

  return null;
}

function loadShareImageElement(url, useCors) {
  const cleanUrl = String(url || "").trim().startsWith("data:image/") ? String(url).trim() : safeHttpUrl(url);
  if (!cleanUrl) return Promise.resolve(null);

  return new Promise((resolve) => {
    const image = new Image();
    const done = (value) => {
      window.clearTimeout(timer);
      resolve(value);
    };
    const timer = window.setTimeout(() => done(null), 12000);
    if (useCors) image.crossOrigin = "anonymous";
    image.onload = () => done(image);
    image.onerror = () => done(null);
    image.src = cleanUrl;
  });
}

function canUseImageInCanvas(image) {
  if (!image || !image.naturalWidth || !image.naturalHeight) return false;

  try {
    const testCanvas = document.createElement("canvas");
    testCanvas.width = 2;
    testCanvas.height = 2;
    const testCtx = testCanvas.getContext("2d");
    testCtx.drawImage(image, 0, 0, 2, 2);
    testCanvas.toDataURL("image/png");
    return true;
  } catch (error) {
    return false;
  }
}


function drawCoverImage(ctx, image, x, y, width, height) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  let sourceW = image.naturalWidth;
  let sourceH = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > boxRatio) {
    sourceW = image.naturalHeight * boxRatio;
    sourceX = (image.naturalWidth - sourceW) / 2;
  } else {
    sourceH = image.naturalWidth / boxRatio;
    sourceY = (image.naturalHeight - sourceH) / 2;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, width, height);
}

function drawContainImageWithSoftBackdrop(ctx, image, x, y, width, height) {
  // Main share card should show the whole photo, not crop important edges.
  ctx.save();
  ctx.globalAlpha = 0.38;
  drawCoverImage(ctx, image, x, y, width, height);
  ctx.restore();

  ctx.fillStyle = "rgba(17,17,17,.18)";
  ctx.fillRect(x, y, width, height);

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  let drawW = width;
  let drawH = height;
  let drawX = x;
  let drawY = y;

  if (imageRatio > boxRatio) {
    drawW = width;
    drawH = width / imageRatio;
    drawY = y + (height - drawH) / 2;
  } else {
    drawH = height;
    drawW = height * imageRatio;
    drawX = x + (width - drawW) / 2;
  }

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.28)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
  ctx.restore();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) return 0;

  const lines = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      line = testLine;
      continue;
    }

    if (line) lines.push(line);
    else lines.push(trimCanvasText(ctx, word, maxWidth));
    line = line ? word : "";

    if (lines.length >= maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);

  const visibleLines = lines.slice(0, maxLines);
  const hasMore = lines.length > maxLines || words.join(" ").length > visibleLines.join(" ").length;
  visibleLines.forEach((value, index) => {
    const output = hasMore && index === maxLines - 1
      ? trimCanvasText(ctx, `${value}...`, maxWidth)
      : value;
    ctx.fillText(output, x, y + (index * lineHeight));
  });

  return visibleLines.length;
}

function trimCanvasText(ctx, text, maxWidth) {
  let output = String(text || "");
  while (output.length > 1 && ctx.measureText(output).width > maxWidth) {
    output = `${output.slice(0, -4)}...`;
  }
  return output;
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image export failed."));
      }, "image/png", 0.95);
    } catch (error) {
      reject(error);
    }
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3500);
}

function safeShareFileName(value) {
  const clean = String(value || "sfk-memory")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 55);
  return clean || "sfk-memory";
}

async function copyMemoryLink(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Copy failed");
}

function scrollToRequestedMemory() {
  if (memoryState.requestedPostHandled) return;
  const requestedId = new URLSearchParams(window.location.search).get("memory");
  if (!requestedId) {
    memoryState.requestedPostHandled = true;
    return;
  }

  const article = Array.from(document.querySelectorAll(".memoryPost"))
    .find((item) => item.dataset.postId === requestedId);
  if (!article) return;

  memoryState.requestedPostHandled = true;
  article.classList.add("sharedMemoryFocus");
  article.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => article.classList.remove("sharedMemoryFocus"), 2200);
}

function openComposeModal() {
  document.getElementById("composeModal").hidden = false;
  document.body.style.overflow = "hidden";

  if (memoryState.auth) showMemoryForm();
  else showMemoryAuthStep();
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal || modal.hidden) return;
  if (id === "composeModal") {
    stopMusicLibraryPreview();
    closeMusicLibraryManager();
    setPostPreviewOpen(false);
  }
  modal.hidden = true;
  document.body.style.overflow = "";
}

function showMemoryAuthStep() {
  document.getElementById("memoryAuthStep").hidden = false;
  document.getElementById("memoryForm").hidden = true;
  const postingIdentity = document.getElementById("postingIdentity");
  if (postingIdentity) postingIdentity.hidden = true;
  document.getElementById("authMessage").textContent = "";
  window.setTimeout(() => document.getElementById("memoryPin")?.focus(), 80);
}

function showMemoryForm() {
  document.getElementById("memoryAuthStep").hidden = true;
  document.getElementById("memoryForm").hidden = false;
  const postingIdentity = document.getElementById("postingIdentity");
  if (postingIdentity) postingIdentity.hidden = false;
  document.getElementById("postingRole").textContent = memoryState.auth?.role || "Officer";
  restoreRememberedPostedBy();
  loadMemoryMusicLibrary();
  renderComposePreview();
  if (isMemoryPhoneViewport()) {
    setPostPreviewOpen(true);
    window.setTimeout(() => document.getElementById("memoryTitle")?.focus(), 120);
  } else {
    window.setTimeout(() => document.getElementById("memoryTitle")?.focus(), 80);
  }
}

function isMemoryPhoneViewport() {
  return window.matchMedia && window.matchMedia("(max-width: 600px)").matches;
}

async function testMusicLink() {
  const input = document.getElementById("memoryMusicUrl");
  const button = document.getElementById("testMusicLinkButton");
  const message = document.getElementById("musicTestMessage");
  const rawUrl = input?.value.trim() || "";

  if (!message || !button) return;

  message.className = "musicTestMessage";

  if (!rawUrl) {
    message.classList.add("bad");
    message.textContent = "Paste or choose a music link first.";
    return;
  }

  if (getYouTubeId(rawUrl)) {
    message.classList.add("ok");
    message.textContent = "YouTube song selected. It will use the embedded player.";
    return;
  }

  const sources = getManualMusicSources(rawUrl);
  if (!sources.length) {
    message.classList.add("bad");
    message.textContent = "This is not a valid music URL.";
    return;
  }

  button.disabled = true;
  button.textContent = "Testing...";
  message.textContent = "Checking if this link can load as audio...";

  const driveId = getDriveFileId(rawUrl);
  if (driveId) {
    let objectUrl = "";
    try {
      message.textContent = "Checking Google Drive audio through the app...";
      const proxyAudio = await fetchDriveAudioObjectUrl(driveId);
      objectUrl = proxyAudio.objectUrl;
      await testAudioSource(objectUrl);
      message.className = "musicTestMessage ok";
      message.textContent = "Playable through app audio proxy. This Drive music should work.";
      renderComposePreview();
      button.disabled = false;
      button.textContent = "Test Music Link";
      return;
    } catch (error) {
      // Continue to the direct Drive URLs below.
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  for (let index = 0; index < sources.length; index++) {
    try {
      await testAudioSource(sources[index]);
      input.value = sources[index];
      message.className = "musicTestMessage ok";
      message.textContent = "Playable. This music link should work.";
      renderComposePreview();
      button.disabled = false;
      button.textContent = "Test Music Link";
      return;
    } catch (error) {
      if (index === sources.length - 1) {
        message.className = "musicTestMessage bad";
        message.textContent = error.message || "This music link is not playable.";
      }
    }
  }

  button.disabled = false;
  button.textContent = "Test Music Link";
}

function normalizeMusicLibrarySong(raw, index = 0) {
  const url = safeHttpUrl(raw?.url || raw?.URL || raw?.MusicURL || "");
  const title = String(raw?.title || raw?.Title || "").trim();
  if (!url || !title) return null;

  return {
    id: String(raw?.id || raw?.ID || `song-${index + 1}`).trim(),
    title,
    category: String(raw?.category || raw?.Category || "Pang song").trim() || "Pang song",
    url
  };
}

function sortMemoryMusicLibrary(songs) {
  return songs.slice().sort((a, b) => a.title.localeCompare(b.title, undefined, {
    sensitivity: "base",
    numeric: true
  }));
}

async function loadMemoryMusicLibrary(force = false) {
  if (memoryState.musicLibraryLoading) return;
  if (memoryState.musicLibraryLoaded && !force) {
    renderMemoryMusicLibrary();
    renderMusicLibraryManager();
    return;
  }

  memoryState.musicLibraryLoading = true;
  const list = document.getElementById("musicLibraryList");
  if (list) list.innerHTML = `<div class="musicLibraryStatus">Loading music library...</div>`;

  try {
    const db = getClassBoardFirestore();
    if (!db) throw new Error("Firebase is not ready.");

    const ref = db.collection("settings").doc(MEMORY_MUSIC_LIBRARY_DOC_ID);
    const snapshot = await ref.get();
    const data = snapshot.exists ? (snapshot.data() || {}) : {};
    memoryState.youtubeApiKey = String(data.YouTubeApiKey || "").trim();

    if (snapshot.exists && data.Initialized === true && Array.isArray(data.Songs)) {
      memoryState.musicLibrary = sortMemoryMusicLibrary(
        data.Songs.map(normalizeMusicLibrarySong).filter(Boolean)
      );
    } else {
      memoryState.musicLibrary = sortMemoryMusicLibrary(
        DEFAULT_MEMORY_MUSIC_LIBRARY.map(normalizeMusicLibrarySong).filter(Boolean)
      );
      const payload = {
        Initialized: true,
        Songs: memoryState.musicLibrary,
        UpdatedBy: memoryState.auth?.role || "Admin"
      };
      if (window.firebase?.firestore?.FieldValue) {
        payload.UpdatedAt = firebase.firestore.FieldValue.serverTimestamp();
      }
      await ref.set(payload, { merge: true });
    }

    memoryState.musicLibraryLoaded = true;
    syncYoutubeApiKeyField();
  } catch (error) {
    console.warn("Music library load failed:", error);
    if (!memoryState.musicLibrary.length) {
      memoryState.musicLibrary = sortMemoryMusicLibrary(
        DEFAULT_MEMORY_MUSIC_LIBRARY.map(normalizeMusicLibrarySong).filter(Boolean)
      );
    }
    const status = document.getElementById("musicLibraryStatus");
    if (status) status.textContent = "Using the built-in song list. Firebase sync is unavailable.";
  } finally {
    memoryState.musicLibraryLoading = false;
    renderMemoryMusicLibrary();
    renderMusicLibraryManager();
  }
}

function renderMemoryMusicLibrary() {
  const list = document.getElementById("musicLibraryList");
  if (!list) return;

  const query = String(document.getElementById("musicLibrarySearch")?.value || "").trim().toLowerCase();
  const currentUrl = String(document.getElementById("memoryMusicUrl")?.value || "").trim();
  const songs = memoryState.musicLibrary.filter((song) => {
    if (!query) return true;
    return `${song.title} ${song.category}`.toLowerCase().includes(query);
  });

  if (!songs.length) {
    list.innerHTML = `<div class="musicLibraryStatus">No matching songs.</div>`;
    return;
  }

  list.innerHTML = songs.map((song) => {
    const isSelected = currentUrl === song.url;
    const isPlaying = memoryState.musicPreviewId === song.id && memoryState.musicPreviewAudio && !memoryState.musicPreviewAudio.paused;
    return `
      <div class="musicLibraryItem ${isSelected ? "isSelected" : ""}">
        <button
          class="musicLibraryPlay"
          type="button"
          data-music-action="preview"
          data-music-id="${escapeAttr(song.id)}"
          aria-label="${isPlaying ? "Stop" : "Preview"} ${escapeAttr(song.title)}">
          ${isPlaying ? "&#9632;" : "&#9654;"}
        </button>
        <button
          class="musicLibrarySelect"
          type="button"
          data-music-action="select"
          data-music-id="${escapeAttr(song.id)}">
          <strong>${escapeHtml(song.title)}</strong>
          <small>${escapeHtml(song.category)}</small>
        </button>
        <span class="musicLibrarySelectedMark" aria-hidden="true">${isSelected ? "&#10003;" : ""}</span>
      </div>
    `;
  }).join("");
}

function handleMusicLibraryListClick(event) {
  const button = event.target.closest("[data-music-action]");
  if (!button) return;

  const song = memoryState.musicLibrary.find((item) => item.id === button.dataset.musicId);
  if (!song) return;

  if (button.dataset.musicAction === "preview") {
    previewMusicLibrarySong(song);
    return;
  }

  if (button.dataset.musicAction === "select") {
    selectMusicLibrarySong(song);
  }
}

function stopMusicLibraryPreview() {
  const audio = memoryState.musicPreviewAudio;
  memoryState.musicPreviewAudio = null;
  memoryState.musicPreviewId = "";
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
  }
  renderMemoryMusicLibrary();
}

async function previewMusicLibrarySong(song) {
  if (memoryState.musicPreviewId === song.id && memoryState.musicPreviewAudio && !memoryState.musicPreviewAudio.paused) {
    stopMusicLibraryPreview();
    return;
  }

  stopMusicLibraryPreview();
  const audio = new Audio(song.url);
  audio.preload = "none";
  memoryState.musicPreviewAudio = audio;
  memoryState.musicPreviewId = song.id;
  audio.addEventListener("ended", () => {
    if (memoryState.musicPreviewAudio === audio) stopMusicLibraryPreview();
  }, { once: true });
  audio.addEventListener("error", () => {
    if (memoryState.musicPreviewAudio !== audio) return;
    stopMusicLibraryPreview();
    showMemoryToast("This song could not be previewed.");
  }, { once: true });

  try {
    await audio.play();
    renderMemoryMusicLibrary();
  } catch (error) {
    stopMusicLibraryPreview();
    showMemoryToast("Tap preview again or check the music link.");
  }
}

function selectMusicLibrarySong(song) {
  const urlInput = document.getElementById("memoryMusicUrl");
  const titleInput = document.getElementById("memoryMusicTitle");
  if (!urlInput || !titleInput) return;

  urlInput.value = song.url;
  titleInput.value = song.title;
  closeYoutubeSongPreview();
  const message = document.getElementById("musicLibraryStatus");
  if (message) message.textContent = `Selected: ${song.title}`;
  renderMemoryMusicLibrary();
  renderComposePreview();
}

function syncYoutubeApiKeyField() {
  const input = document.getElementById("youtubeApiKey");
  if (input && document.activeElement !== input) input.value = memoryState.youtubeApiKey;
}

async function saveYoutubeApiKey() {
  if (!memoryState.auth) return;
  const input = document.getElementById("youtubeApiKey");
  const message = document.getElementById("youtubeApiKeyMessage");
  const button = document.getElementById("saveYoutubeApiKey");
  const apiKey = String(input?.value || "").trim();

  if (!apiKey) {
    if (message) message.textContent = "Paste a restricted YouTube Data API v3 key.";
    return;
  }

  if (button) button.disabled = true;
  if (message) message.textContent = "Saving API key...";

  try {
    const db = getClassBoardFirestore();
    if (!db) throw new Error("Firebase is not ready.");
    const payload = {
      YouTubeApiKey: apiKey,
      UpdatedBy: memoryState.auth.role
    };
    if (window.firebase?.firestore?.FieldValue) {
      payload.UpdatedAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    await db.collection("settings").doc(MEMORY_MUSIC_LIBRARY_DOC_ID).set(payload, { merge: true });
    memoryState.youtubeApiKey = apiKey;
    if (message) message.textContent = "YouTube search is ready.";
    showMemoryToast("YouTube search API key saved.");
  } catch (error) {
    if (message) message.textContent = error.message || "Could not save the API key.";
  } finally {
    if (button) button.disabled = false;
  }
}

async function searchYoutubeSongs() {
  const input = document.getElementById("youtubeSongSearch");
  const button = document.getElementById("searchYoutubeSongsButton");
  const message = document.getElementById("youtubeSongSearchMessage");
  const results = document.getElementById("youtubeSongResults");
  const query = String(input?.value || "").trim();

  if (!query) {
    if (message) message.textContent = "Enter a song title or artist.";
    return;
  }
  if (!memoryState.youtubeApiKey) {
    if (message) message.textContent = "Open Manage and save a YouTube Data API key first.";
    return;
  }

  if (button) button.disabled = true;
  if (message) message.textContent = "Searching YouTube...";
  if (results) results.innerHTML = "";
  closeYoutubeSongPreview();

  try {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      videoEmbeddable: "true",
      safeSearch: "strict",
      maxResults: "8",
      q: `${query} music`,
      key: memoryState.youtubeApiKey
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
      referrer: window.location.href,
      referrerPolicy: "origin"
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "YouTube search failed.");
    }

    memoryState.youtubeSearchResults = (data.items || []).map((item) => ({
      id: String(item?.id?.videoId || ""),
      title: decodeHtmlText(item?.snippet?.title || ""),
      channel: decodeHtmlText(item?.snippet?.channelTitle || ""),
      thumbnail: item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url || ""
    })).filter((song) => song.id && song.title);
    renderYoutubeSongResults();
    if (message) {
      message.textContent = memoryState.youtubeSearchResults.length
        ? `${memoryState.youtubeSearchResults.length} results found.`
        : "No embeddable songs found.";
    }
  } catch (error) {
    memoryState.youtubeSearchResults = [];
    if (results) results.innerHTML = "";
    if (message) message.textContent = error.message || "Could not search YouTube.";
  } finally {
    if (button) button.disabled = false;
  }
}

function decodeHtmlText(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value || "");
  return textarea.value;
}

function renderYoutubeSongResults() {
  const container = document.getElementById("youtubeSongResults");
  if (!container) return;
  const currentId = getYouTubeId(document.getElementById("memoryMusicUrl")?.value || "");

  container.innerHTML = memoryState.youtubeSearchResults.map((song) => `
    <article class="youtubeSongResult ${currentId === song.id ? "isSelected" : ""}">
      <img src="${escapeAttr(song.thumbnail)}" alt="" loading="lazy" />
      <div>
        <strong>${escapeHtml(song.title)}</strong>
        <small>${escapeHtml(song.channel)}</small>
      </div>
      <div class="youtubeSongActions">
        <button type="button" data-youtube-action="preview" data-youtube-id="${escapeAttr(song.id)}">Preview</button>
        <button type="button" data-youtube-action="select" data-youtube-id="${escapeAttr(song.id)}">${currentId === song.id ? "Selected" : "Use Song"}</button>
      </div>
    </article>
  `).join("");
}

function handleYoutubeSongResultClick(event) {
  const button = event.target.closest("[data-youtube-action]");
  if (!button) return;
  const song = memoryState.youtubeSearchResults.find((item) => item.id === button.dataset.youtubeId);
  if (!song) return;

  if (button.dataset.youtubeAction === "preview") {
    previewYoutubeSong(song);
  } else if (button.dataset.youtubeAction === "select") {
    selectYoutubeSong(song);
  }
}

function previewYoutubeSong(song) {
  const container = document.getElementById("youtubeSongPreview");
  if (!container) return;
  memoryState.youtubePreviewId = song.id;
  container.hidden = false;
  container.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${escapeAttr(song.id)}?autoplay=1&playsinline=1&controls=1&rel=0"
      title="${escapeAttr(`Preview ${song.title}`)}"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen></iframe>
    <button type="button" data-youtube-action="close-preview" aria-label="Close preview">&times;</button>
  `;
  container.querySelector("[data-youtube-action='close-preview']")?.addEventListener("click", closeYoutubeSongPreview);
}

function closeYoutubeSongPreview() {
  const container = document.getElementById("youtubeSongPreview");
  memoryState.youtubePreviewId = "";
  if (!container) return;
  container.innerHTML = "";
  container.hidden = true;
}

function selectYoutubeSong(song) {
  stopMusicLibraryPreview();
  const urlInput = document.getElementById("memoryMusicUrl");
  const titleInput = document.getElementById("memoryMusicTitle");
  if (!urlInput || !titleInput) return;

  urlInput.value = `https://www.youtube.com/watch?v=${song.id}`;
  titleInput.value = `${song.title} - ${song.channel}`;
  const message = document.getElementById("youtubeSongSearchMessage");
  if (message) message.textContent = `Selected: ${song.title}`;
  renderYoutubeSongResults();
  renderMemoryMusicLibrary();
  renderComposePreview();
}

async function openMusicLibraryManager() {
  if (!memoryState.auth) return;
  await loadMemoryMusicLibrary();

  const modal = document.getElementById("musicLibraryModal");
  if (!modal) return;
  modal.hidden = false;
  syncYoutubeApiKeyField();
  resetMusicLibraryEditor();
  renderMusicLibraryManager();

  const currentUrl = document.getElementById("memoryMusicUrl")?.value.trim() || "";
  const currentTitle = document.getElementById("memoryMusicTitle")?.value.trim() || "";
  if (currentUrl && !memoryState.musicLibrary.some((song) => song.url === currentUrl)) {
    document.getElementById("musicLibrarySongTitle").value = currentTitle;
    document.getElementById("musicLibrarySongUrl").value = currentUrl;
  }
  window.setTimeout(() => document.getElementById("musicLibrarySongTitle")?.focus(), 80);
}

function closeMusicLibraryManager() {
  const modal = document.getElementById("musicLibraryModal");
  if (modal) modal.hidden = true;
  memoryState.selectedMusicLibraryIds.clear();
  resetMusicLibraryEditor();
  updateMusicLibrarySelectionBar();
}

function resetMusicLibraryEditor() {
  const form = document.getElementById("musicLibraryForm");
  form?.reset();
  const idInput = document.getElementById("musicLibrarySongId");
  if (idInput) idInput.value = "";
  const category = document.getElementById("musicLibrarySongCategory");
  if (category) category.value = "Pang song";
  const cancel = document.getElementById("cancelMusicLibraryEdit");
  if (cancel) cancel.hidden = true;
  const submit = document.getElementById("saveMusicLibrarySong");
  if (submit) submit.textContent = "Add Song";
  const message = document.getElementById("musicLibraryManagerMessage");
  if (message) message.textContent = "";
}

function renderMusicLibraryManager() {
  const list = document.getElementById("musicLibraryManageList");
  if (!list) return;

  const validIds = new Set(memoryState.musicLibrary.map((song) => song.id));
  Array.from(memoryState.selectedMusicLibraryIds).forEach((id) => {
    if (!validIds.has(id)) memoryState.selectedMusicLibraryIds.delete(id);
  });

  if (!memoryState.musicLibrary.length) {
    list.innerHTML = `<div class="musicLibraryStatus">No songs in the library yet.</div>`;
    memoryState.selectedMusicLibraryIds.clear();
    updateMusicLibrarySelectionBar();
    return;
  }

  list.innerHTML = memoryState.musicLibrary.map((song) => `
    <div class="musicLibraryManageItem">
      <label class="musicLibrarySelectCheck" aria-label="Select ${escapeAttr(song.title)}">
        <input
          type="checkbox"
          data-library-select
          data-music-id="${escapeAttr(song.id)}"
          ${memoryState.selectedMusicLibraryIds.has(song.id) ? "checked" : ""} />
      </label>
      <div>
        <strong>${escapeHtml(song.title)}</strong>
        <small>${escapeHtml(song.category)}</small>
      </div>
      <button type="button" data-library-action="edit" data-music-id="${escapeAttr(song.id)}">Edit</button>
      <button class="danger" type="button" data-library-action="delete" data-music-id="${escapeAttr(song.id)}">Delete</button>
    </div>
  `).join("");
  updateMusicLibrarySelectionBar();
}

function handleMusicLibrarySelectionChange(event) {
  const checkbox = event.target.closest("[data-library-select]");
  if (!checkbox) return;

  if (checkbox.checked) memoryState.selectedMusicLibraryIds.add(checkbox.dataset.musicId);
  else memoryState.selectedMusicLibraryIds.delete(checkbox.dataset.musicId);
  updateMusicLibrarySelectionBar();
}

function toggleAllMusicLibrarySongs(event) {
  if (event.target.checked) {
    memoryState.musicLibrary.forEach((song) => memoryState.selectedMusicLibraryIds.add(song.id));
  } else {
    memoryState.selectedMusicLibraryIds.clear();
  }
  renderMusicLibraryManager();
}

function updateMusicLibrarySelectionBar() {
  const selectAll = document.getElementById("selectAllMusicLibrarySongs");
  const deleteButton = document.getElementById("deleteSelectedMusicLibrarySongs");
  const countLabel = document.getElementById("selectedMusicLibraryCount");
  const selectedCount = memoryState.selectedMusicLibraryIds.size;
  const totalCount = memoryState.musicLibrary.length;

  if (selectAll) {
    selectAll.checked = totalCount > 0 && selectedCount === totalCount;
    selectAll.indeterminate = selectedCount > 0 && selectedCount < totalCount;
    selectAll.disabled = totalCount === 0;
  }
  if (deleteButton) deleteButton.disabled = selectedCount === 0;
  if (countLabel) countLabel.textContent = selectedCount ? `${selectedCount} selected` : `${totalCount} songs`;
}

async function saveMusicLibrarySong(event) {
  event.preventDefault();
  if (!memoryState.auth) return;

  const idInput = document.getElementById("musicLibrarySongId");
  const titleInput = document.getElementById("musicLibrarySongTitle");
  const urlInput = document.getElementById("musicLibrarySongUrl");
  const categoryInput = document.getElementById("musicLibrarySongCategory");
  const message = document.getElementById("musicLibraryManagerMessage");
  const submit = document.getElementById("saveMusicLibrarySong");
  const title = titleInput?.value.trim() || "";
  const url = safeHttpUrl(urlInput?.value.trim() || "");
  const category = categoryInput?.value.trim() || "Pang song";

  if (!title || !url) {
    if (message) message.textContent = "Song title and direct audio link are required.";
    return;
  }

  const existingId = idInput?.value.trim() || "";
  const duplicate = memoryState.musicLibrary.find((song) => song.url === url && song.id !== existingId);
  if (duplicate) {
    if (message) message.textContent = "This music link is already in the library.";
    return;
  }

  const id = existingId || (
    window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `music-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const nextSong = { id, title, category, url };
  const nextSongs = memoryState.musicLibrary.filter((song) => song.id !== id);
  nextSongs.push(nextSong);

  if (submit) submit.disabled = true;
  if (message) message.textContent = existingId ? "Saving changes..." : "Adding song...";

  try {
    await writeMemoryMusicLibrary(nextSongs);
    memoryState.musicLibrary = sortMemoryMusicLibrary(nextSongs);
    memoryState.musicLibraryLoaded = true;
    resetMusicLibraryEditor();
    renderMusicLibraryManager();
    renderMemoryMusicLibrary();
    showMemoryToast(existingId ? "Song updated." : "Song added to the library.");
  } catch (error) {
    if (message) message.textContent = error.message || "Could not save this song.";
  } finally {
    if (submit) submit.disabled = false;
  }
}

function parseBulkMusicEntries(rawValue, category) {
  const lines = String(rawValue || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const songs = [];
  let pendingTitle = "";
  let invalidLines = 0;

  lines.forEach((line) => {
    const urlMatch = line.match(/https?:\/\/[^\s|]+/i);
    if (!urlMatch) {
      if (pendingTitle) invalidLines += 1;
      pendingTitle = line.replace(/^[\s|,;:\-]+|[\s|,;:\-]+$/g, "").trim();
      return;
    }

    const rawUrl = urlMatch[0].replace(/[),.;]+$/g, "");
    const url = safeHttpUrl(rawUrl);
    let title = line
      .replace(urlMatch[0], "")
      .replace(/^[\s|,;:\-]+|[\s|,;:\-]+$/g, "")
      .trim();

    if (!title) title = pendingTitle;
    pendingTitle = "";

    if (!url) {
      invalidLines += 1;
      return;
    }

    songs.push({
      id: createMusicLibraryIdFromUrl(url),
      title,
      category,
      url
    });
  });

  if (pendingTitle) invalidLines += 1;
  return { songs, invalidLines };
}

function extractJukeHostTitlesFromPaste(rawValue, category = "") {
  const lines = String(rawValue || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const titles = [];
  const normalizedCategory = String(category || "").trim().toLowerCase();

  lines.forEach((line) => {
    const cells = line.split(/\t+/).map((cell) => cell.trim()).filter(Boolean);
    if (cells.length >= 2 && cells.some((cell) => /^\d{1,2}:\d{2}$/.test(cell))) {
      const title = cleanPastedJukeHostTitle(cells[0], normalizedCategory);
      if (title) titles.push(title);
      return;
    }

    const inlineRow = line.match(/^(.*?)\s+(\d{1,2}:\d{2})\s+(.+)$/);
    if (inlineRow) {
      const title = cleanPastedJukeHostTitle(inlineRow[1], normalizedCategory);
      if (title) titles.push(title);
    }
  });

  if (titles.length) return titles;

  lines.forEach((line, index) => {
    if (!/^\d{1,2}:\d{2}$/.test(line)) return;
    for (let previous = index - 1; previous >= 0; previous -= 1) {
      const title = cleanPastedJukeHostTitle(lines[previous], normalizedCategory);
      if (!title) continue;
      titles.push(title);
      break;
    }
  });

  if (titles.length) return titles;

  return lines
    .map((line) => cleanPastedJukeHostTitle(line, normalizedCategory))
    .filter(Boolean);
}

function cleanPastedJukeHostTitle(value, normalizedCategory = "") {
  const title = String(value || "")
    .replace(/^\s*\d+[.)-]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = title.toLowerCase();

  if (!title || /^\d{1,2}:\d{2}$/.test(title)) return "";
  if (normalizedCategory && normalized === normalizedCategory) return "";
  if (/^(title|category|duration|library|upload|uploads|sort by|search)$/i.test(title.replace(/[↑↓↕]/g, "").trim())) return "";
  if (/^(profile|security|appearance|logout|login|home|settings)$/i.test(title)) return "";
  return title;
}

async function autoFillSingleMusicTitle() {
  const titleInput = document.getElementById("musicLibrarySongTitle");
  const urlInput = document.getElementById("musicLibrarySongUrl");
  const message = document.getElementById("musicLibraryManagerMessage");
  const url = safeHttpUrl(urlInput?.value.trim() || "");
  if (!titleInput || titleInput.value.trim() || !url) return;

  if (message) message.textContent = "Detecting song title...";
  try {
    const titles = await requestMusicMetadataBatch([url]);
    const detected = titles.get(url) || "";
    if (detected) {
      titleInput.value = detected;
      if (message) message.textContent = "Song title detected.";
    } else if (message) {
      message.textContent = "Title could not be detected. Please enter it manually.";
    }
  } catch (error) {
    if (message) message.textContent = error.message || "Title detection is unavailable.";
  }
}

async function requestMusicMetadataBatch(urls) {
  const uniqueUrls = Array.from(new Set((urls || []).map(safeHttpUrl).filter(Boolean))).slice(0, 100);
  if (!uniqueUrls.length) return new Map();

  const result = await postMemoryApi("musicMetadataBatch", {
    Role: memoryState.auth?.role || "",
    Urls: uniqueUrls
  });
  if (!result?.success || !Array.isArray(result.items)) {
    throw new Error(result?.message || "Music title service is not available.");
  }

  return new Map(result.items.map((item) => [
    safeHttpUrl(item.url),
    cleanDetectedMusicTitle(item.title)
  ]));
}

async function requestMusicMetadataInChunks(urls) {
  const uniqueUrls = Array.from(new Set((urls || []).map(safeHttpUrl).filter(Boolean)));
  const titles = new Map();

  for (let start = 0; start < uniqueUrls.length; start += 100) {
    const batch = await requestMusicMetadataBatch(uniqueUrls.slice(start, start + 100));
    batch.forEach((title, url) => titles.set(url, title));
  }
  return titles;
}

async function detectMusicTitleFromAudio(url) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeout = window.setTimeout(() => controller?.abort(), 12000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Range: "bytes=0-262143" },
      signal: controller?.signal
    });
    if (!response.ok) return "";

    const dispositionTitle = getTitleFromContentDisposition(response.headers.get("content-disposition"));
    const buffer = await readResponsePrefix(response, 262144);
    const tags = readId3MusicTags(buffer);
    const taggedTitle = String(tags.title || "").trim();
    const taggedArtist = String(tags.artist || "").trim();

    if (taggedTitle) {
      if (taggedArtist && !taggedTitle.toLowerCase().includes(taggedArtist.toLowerCase())) {
        return cleanDetectedMusicTitle(`${taggedArtist} - ${taggedTitle}`);
      }
      return cleanDetectedMusicTitle(taggedTitle);
    }
    return cleanDetectedMusicTitle(dispositionTitle);
  } catch (error) {
    return "";
  } finally {
    window.clearTimeout(timeout);
  }
}

async function readResponsePrefix(response, maxBytes) {
  if (!response.body?.getReader) {
    const buffer = await response.arrayBuffer();
    return buffer.slice(0, maxBytes);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = maxBytes - total;
      const chunk = value.length > remaining ? value.slice(0, remaining) : value;
      chunks.push(chunk);
      total += chunk.length;
      if (total >= maxBytes) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const joined = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    joined.set(chunk, offset);
    offset += chunk.length;
  });
  return joined.buffer;
}

function getTitleFromContentDisposition(value) {
  const header = String(value || "");
  if (!header) return "";

  const encoded = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  const plain = header.match(/filename\s*=\s*"?([^";]+)"?/i);
  const raw = encoded?.[1] || plain?.[1] || "";
  try {
    return decodeURIComponent(raw.trim());
  } catch (error) {
    return raw.trim();
  }
}

function readId3MusicTags(buffer) {
  const bytes = new Uint8Array(buffer || 0);
  if (bytes.length < 10 || String.fromCharCode(...bytes.slice(0, 3)) !== "ID3") {
    return {};
  }

  const version = bytes[3];
  const tagSize = readSynchsafeInt(bytes, 6);
  const end = Math.min(bytes.length, 10 + tagSize);
  const tags = {};
  let offset = 10;

  while (offset < end) {
    const isV22 = version === 2;
    const headerSize = isV22 ? 6 : 10;
    if (offset + headerSize > end) break;

    const frameId = String.fromCharCode(...bytes.slice(offset, offset + (isV22 ? 3 : 4)));
    if (!frameId.replace(/\0/g, "").trim()) break;
    const frameSize = isV22
      ? ((bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5])
      : (version === 4 ? readSynchsafeInt(bytes, offset + 4) : readUint32(bytes, offset + 4));
    if (!frameSize || offset + headerSize + frameSize > end) break;

    const frameData = bytes.slice(offset + headerSize, offset + headerSize + frameSize);
    if (frameId === "TIT2" || frameId === "TT2") tags.title = decodeId3TextFrame(frameData);
    if (frameId === "TPE1" || frameId === "TP1") tags.artist = decodeId3TextFrame(frameData);
    if (tags.title && tags.artist) break;
    offset += headerSize + frameSize;
  }

  return tags;
}

function readSynchsafeInt(bytes, offset) {
  return ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f);
}

function readUint32(bytes, offset) {
  return ((bytes[offset] << 24) >>> 0) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3];
}

function decodeId3TextFrame(frameData) {
  if (!frameData?.length) return "";
  const encoding = frameData[0];
  const content = frameData.slice(1);

  try {
    if (encoding === 3) return new TextDecoder("utf-8").decode(content).replace(/\0/g, "").trim();
    if (encoding === 1) {
      const littleEndian = content[0] === 0xff && content[1] === 0xfe;
      const data = (content[0] === 0xff || content[0] === 0xfe) ? content.slice(2) : content;
      return new TextDecoder(littleEndian ? "utf-16le" : "utf-16be").decode(data).replace(/\0/g, "").trim();
    }
    if (encoding === 2) return new TextDecoder("utf-16be").decode(content).replace(/\0/g, "").trim();
    return Array.from(content, (byte) => String.fromCharCode(byte)).join("").replace(/\0/g, "").trim();
  } catch (error) {
    return "";
  }
}

function cleanDetectedMusicTitle(value) {
  return String(value || "")
    .replace(/\.(mp3|m4a|aac|ogg|wav|webm)$/i, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run())
  );
  return results;
}

function createMusicLibraryIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    const lastPart = parsed.pathname.split("/").filter(Boolean).pop() || "";
    if (/^[a-z0-9-]{12,}$/i.test(lastPart)) return lastPart;
  } catch (error) {
    // Use a generated ID below.
  }

  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `music-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createJukeHostFallbackTitle(url) {
  try {
    const trackId = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
    const shortId = trackId.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
    if (shortId) return `JukeHost Audio ${shortId}`;
  } catch (error) {
    // Use the generic fallback below.
  }

  return "JukeHost Audio";
}

async function importMusicLibrarySongs() {
  if (!memoryState.auth) return;

  const entriesInput = document.getElementById("bulkMusicLibraryEntries");
  const categoryInput = document.getElementById("bulkMusicLibraryCategory");
  const message = document.getElementById("bulkMusicLibraryMessage");
  const button = document.getElementById("importMusicLibrarySongs");
  const category = categoryInput?.value.trim() || "Pang song";
  const parsed = parseBulkMusicEntries(entriesInput?.value || "", category);

  if (!parsed.songs.length) {
    if (message) {
      message.textContent = "Paste at least one direct JukeHost audio link.";
    }
    return;
  }

  const existingUrls = new Set(memoryState.musicLibrary.map((song) => song.url));
  const existingIds = new Set(memoryState.musicLibrary.map((song) => song.id));
  const batchUrls = new Set();
  const imported = [];
  let duplicates = 0;

  parsed.songs.forEach((song) => {
    if (existingUrls.has(song.url) || batchUrls.has(song.url)) {
      duplicates += 1;
      return;
    }

    if (existingIds.has(song.id)) {
      song.id = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${song.id}-${Math.random().toString(36).slice(2, 7)}`;
    }
    existingIds.add(song.id);
    batchUrls.add(song.url);
    imported.push(song);
  });

  if (!imported.length) {
    if (message) message.textContent = `No new songs imported. ${duplicates} duplicate link${duplicates === 1 ? " was" : "s were"} skipped.`;
    return;
  }

  if (button) button.disabled = true;
  if (message) message.textContent = `Saving ${imported.length} song${imported.length === 1 ? "" : "s"}...`;

  try {
    const readySongs = imported.map((song) => ({
      ...song,
      title: song.title || createJukeHostFallbackTitle(song.url)
    }));
    const nextSongs = sortMemoryMusicLibrary([...memoryState.musicLibrary, ...readySongs]);
    await writeMemoryMusicLibrary(nextSongs);
    memoryState.musicLibrary = nextSongs;
    memoryState.musicLibraryLoaded = true;
    if (entriesInput) entriesInput.value = "";
    renderMusicLibraryManager();
    renderMemoryMusicLibrary();

    const notes = [`Imported ${readySongs.length} song${readySongs.length === 1 ? "" : "s"}.`];
    if (duplicates) notes.push(`Skipped ${duplicates} duplicate${duplicates === 1 ? "" : "s"}.`);
    if (parsed.invalidLines) notes.push(`${parsed.invalidLines} incomplete line${parsed.invalidLines === 1 ? "" : "s"} ignored.`);
    if (message) message.textContent = notes.join(" ");
    showMemoryToast(`${readySongs.length} song${readySongs.length === 1 ? "" : "s"} added to ${category}.`);
  } catch (error) {
    if (message) message.textContent = error.message || "Could not import these songs.";
  } finally {
    if (button) button.disabled = false;
  }
}

async function repairMissingMusicTitles() {
  if (!memoryState.auth) return;

  const button = document.getElementById("detectMissingMusicTitles");
  const message = document.getElementById("bulkMusicLibraryMessage");
  const missingSongs = memoryState.musicLibrary.filter((song) =>
    /^JukeHost Song \d+$/i.test(song.title) ||
    /^[a-f0-9-]{24,}$/i.test(song.title)
  );

  if (!missingSongs.length) {
    if (message) message.textContent = "No missing song titles found.";
    return;
  }

  if (button) button.disabled = true;
  if (message) message.textContent = `Checking ${missingSongs.length} missing title${missingSongs.length === 1 ? "" : "s"} in one batch...`;

  try {
    const detectedTitles = await requestMusicMetadataInChunks(missingSongs.map((song) => song.url));
    let fixed = 0;
    const nextSongs = memoryState.musicLibrary.map((song) => {
      const detected = detectedTitles.get(song.url);
      if (!detected) return song;
      fixed += 1;
      return { ...song, title: detected };
    });

    if (fixed) {
      await writeMemoryMusicLibrary(nextSongs);
      memoryState.musicLibrary = sortMemoryMusicLibrary(nextSongs);
      renderMusicLibraryManager();
      renderMemoryMusicLibrary();
    }

    const unresolved = missingSongs.length - fixed;
    if (message) {
      message.textContent = fixed
        ? `Fixed ${fixed} title${fixed === 1 ? "" : "s"}.${unresolved ? ` ${unresolved} still need manual editing.` : ""}`
        : "No titles could be detected. Check that the Apps Script update is deployed.";
    }
    if (fixed) showMemoryToast(`${fixed} music title${fixed === 1 ? "" : "s"} fixed.`);
  } catch (error) {
    if (message) message.textContent = error.message || "Could not detect the missing titles.";
  } finally {
    if (button) button.disabled = false;
  }
}

async function removeGenericMusicTitles() {
  if (!memoryState.auth) return;

  const genericSongs = memoryState.musicLibrary.filter((song) =>
    /^JukeHost Song \d+$/i.test(song.title) ||
    /^[a-f0-9-]{24,}$/i.test(song.title)
  );
  const message = document.getElementById("bulkMusicLibraryMessage");
  const button = document.getElementById("removeGenericMusicTitles");

  if (!genericSongs.length) {
    if (message) message.textContent = "No generic JukeHost song names found.";
    return;
  }

  if (!window.confirm(`Remove all ${genericSongs.length} generic JukeHost songs from the library?`)) return;

  const genericIds = new Set(genericSongs.map((song) => song.id));
  const nextSongs = memoryState.musicLibrary.filter((song) => !genericIds.has(song.id));
  if (button) button.disabled = true;
  if (message) message.textContent = `Removing ${genericSongs.length} generic song${genericSongs.length === 1 ? "" : "s"}...`;

  try {
    await writeMemoryMusicLibrary(nextSongs);
    if (genericIds.has(memoryState.musicPreviewId)) stopMusicLibraryPreview();
    genericIds.forEach((id) => memoryState.selectedMusicLibraryIds.delete(id));
    memoryState.musicLibrary = nextSongs;
    renderMusicLibraryManager();
    renderMemoryMusicLibrary();
    if (message) message.textContent = `Removed ${genericSongs.length} generic song${genericSongs.length === 1 ? "" : "s"}.`;
    showMemoryToast("Generic JukeHost songs removed.");
  } catch (error) {
    if (message) message.textContent = error.message || "Could not remove the generic songs.";
  } finally {
    if (button) button.disabled = false;
  }
}

async function writeMemoryMusicLibrary(songs) {
  const db = getClassBoardFirestore();
  if (!db) throw new Error("Firebase is not ready.");

  const payload = {
    Initialized: true,
    Songs: sortMemoryMusicLibrary(songs).map(({ id, title, category, url }) => ({ id, title, category, url })),
    UpdatedBy: memoryState.auth?.role || "Officer"
  };
  if (window.firebase?.firestore?.FieldValue) {
    payload.UpdatedAt = firebase.firestore.FieldValue.serverTimestamp();
  }
  await db.collection("settings").doc(MEMORY_MUSIC_LIBRARY_DOC_ID).set(payload, { merge: true });
}

function handleMusicLibraryManageClick(event) {
  const button = event.target.closest("[data-library-action]");
  if (!button) return;
  const song = memoryState.musicLibrary.find((item) => item.id === button.dataset.musicId);
  if (!song) return;

  if (button.dataset.libraryAction === "edit") {
    document.getElementById("musicLibrarySongId").value = song.id;
    document.getElementById("musicLibrarySongTitle").value = song.title;
    document.getElementById("musicLibrarySongUrl").value = song.url;
    document.getElementById("musicLibrarySongCategory").value = song.category;
    document.getElementById("cancelMusicLibraryEdit").hidden = false;
    document.getElementById("saveMusicLibrarySong").textContent = "Save Changes";
    document.getElementById("musicLibraryManagerMessage").textContent = "";
    document.getElementById("musicLibrarySongTitle").focus();
    return;
  }

  if (button.dataset.libraryAction === "delete") {
    deleteMusicLibrarySong(song);
  }
}

async function deleteMusicLibrarySong(song) {
  if (!memoryState.auth) return;
  if (!window.confirm(`Delete "${song.title}" from the music library?`)) return;

  const nextSongs = memoryState.musicLibrary.filter((item) => item.id !== song.id);
  try {
    await writeMemoryMusicLibrary(nextSongs);
    if (memoryState.musicPreviewId === song.id) stopMusicLibraryPreview();
    memoryState.selectedMusicLibraryIds.delete(song.id);
    memoryState.musicLibrary = nextSongs;
    renderMusicLibraryManager();
    renderMemoryMusicLibrary();
    showMemoryToast("Song deleted from the library.");
  } catch (error) {
    const message = document.getElementById("musicLibraryManagerMessage");
    if (message) message.textContent = error.message || "Could not delete this song.";
  }
}

async function deleteSelectedMusicLibrarySongs() {
  if (!memoryState.auth || !memoryState.selectedMusicLibraryIds.size) return;

  const selectedIds = new Set(memoryState.selectedMusicLibraryIds);
  const selectedCount = selectedIds.size;
  const deletingAll = selectedCount === memoryState.musicLibrary.length;
  const prompt = deletingAll
    ? `Delete all ${selectedCount} songs from the Music Library?`
    : `Delete ${selectedCount} selected song${selectedCount === 1 ? "" : "s"} from the Music Library?`;
  if (!window.confirm(prompt)) return;

  const button = document.getElementById("deleteSelectedMusicLibrarySongs");
  const message = document.getElementById("musicLibraryManagerMessage");
  const nextSongs = memoryState.musicLibrary.filter((song) => !selectedIds.has(song.id));
  if (button) button.disabled = true;
  if (message) message.textContent = `Deleting ${selectedCount} song${selectedCount === 1 ? "" : "s"}...`;

  try {
    await writeMemoryMusicLibrary(nextSongs);
    if (selectedIds.has(memoryState.musicPreviewId)) stopMusicLibraryPreview();
    memoryState.musicLibrary = nextSongs;
    memoryState.selectedMusicLibraryIds.clear();
    renderMusicLibraryManager();
    renderMemoryMusicLibrary();
    if (message) message.textContent = "";
    showMemoryToast(`${selectedCount} song${selectedCount === 1 ? "" : "s"} deleted.`);
  } catch (error) {
    if (message) message.textContent = error.message || "Could not delete the selected songs.";
    updateMusicLibrarySelectionBar();
  }
}

async function unlockMemoryPosting() {
  const role = document.getElementById("memoryRole").value;
  const pin = document.getElementById("memoryPin").value.trim();
  const message = document.getElementById("authMessage");
  const button = document.getElementById("unlockPostingButton");

  if (!pin) {
    message.textContent = "Enter your PIN.";
    return;
  }

  button.disabled = true;
  message.textContent = "Checking access...";

  try {
    const user = await window.SFKAuth.signInWithPin(role, pin);
    const authenticatedRole = window.SFKAuth.roleForUser(user);
    memoryState.auth = { role: authenticatedRole === "admin" ? "Admin" : "Officer" };
    document.getElementById("memoryPin").value = "";
    message.textContent = "";
    showMemoryForm();
    renderMemories();
  } catch (error) {
    message.textContent = "Incorrect PIN or access is not configured.";
  } finally {
    button.disabled = false;
  }
}

async function resetMemoryAuth() {
  stopMusicLibraryPreview();
  closeMusicLibraryManager();
  memoryState.auth = null;
  await window.SFKAuth?.signOut();
  showMemoryAuthStep();
  renderMemories();
}

function setMusicFieldsOpen(open) {
  const panel = document.getElementById("musicFieldsPanel");
  const button = document.getElementById("toggleMusicFieldsButton");
  if (!panel || !button) return;

  panel.hidden = !open;
  button.setAttribute("aria-expanded", open ? "true" : "false");
  button.classList.toggle("isOpen", Boolean(open));
  button.innerHTML = open
    ? `<span>&#9835;</span> Hide background music`
    : `<span>&#9835;</span> Add background music`;

  if (open) {
    window.setTimeout(() => document.getElementById("youtubeSongSearch")?.focus(), 80);
  }
}

function toggleMusicFields(forceOpen) {
  const panel = document.getElementById("musicFieldsPanel");
  const next = typeof forceOpen === "boolean" ? forceOpen : Boolean(panel?.hidden);
  setMusicFieldsOpen(next);
}

function setAdditionalMusicSourcesOpen(open) {
  const panel = document.getElementById("additionalMusicSources");
  const button = document.getElementById("toggleAdditionalMusicSources");
  if (!panel || !button) return;

  panel.hidden = !open;
  button.setAttribute("aria-expanded", open ? "true" : "false");
  button.textContent = open
    ? "Hide Music Library & Direct Link"
    : "Show Music Library & Direct Link";
}

function toggleAdditionalMusicSources() {
  const panel = document.getElementById("additionalMusicSources");
  setAdditionalMusicSourcesOpen(Boolean(panel?.hidden));
}

function hasMusicDraft() {
  return Boolean(
    document.getElementById("memoryMusicUrl")?.value.trim() ||
    document.getElementById("memoryMusicTitle")?.value.trim()
  );
}

function restoreMemoryAuth() {
  window.SFKAuth?.onAuthStateChanged((user, role) => {
    memoryState.auth = user && role
      ? { role: role === "admin" ? "Admin" : "Officer" }
      : null;
    renderMemories();

    const composeModal = document.getElementById("composeModal");
    if (composeModal && !composeModal.hidden) {
      if (memoryState.auth) showMemoryForm();
      else showMemoryAuthStep();
    }
  });
}

function handleMemoryFiles(event) {
  const files = Array.from(event.target.files || []).slice(0, MAX_MEDIA_FILES);
  memoryState.selectedFiles = files;
  memoryState.coverIndex = 0;
  renderSelectedMediaPreview();
  renderComposePreview();

  if ((event.target.files || []).length > MAX_MEDIA_FILES) {
    showMemoryToast(`Only the first ${MAX_MEDIA_FILES} files will be uploaded.`);
  }
}

function renderSelectedMediaPreview() {
  const container = document.getElementById("mediaPreview");
  if (!container) return;

  if (memoryState.selectedFiles.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = memoryState.selectedFiles.map((file, index) => {
    const url = URL.createObjectURL(file);
    const preview = file.type.startsWith("video/")
      ? `<video src="${escapeAttr(url)}" muted></video>`
      : `<img src="${escapeAttr(url)}" alt="" />`;

    return `
      <div class="previewItem ${index === memoryState.coverIndex ? "isCover" : ""}" data-preview-index="${index}">
        ${preview}
        <span>${escapeHtml(file.name)}</span>
        <div class="previewControls">
          <button type="button" data-preview-action="cover" ${index === memoryState.coverIndex ? "disabled" : ""}>Cover</button>
          <button type="button" data-preview-action="left" ${index === 0 ? "disabled" : ""}>&#8592;</button>
          <button type="button" data-preview-action="right" ${index === memoryState.selectedFiles.length - 1 ? "disabled" : ""}>&#8594;</button>
          <button type="button" data-preview-action="remove">Remove</button>
        </div>
      </div>
    `;
  }).join("");
}

function handleMediaPreviewAction(event) {
  const button = event.target.closest("[data-preview-action]");
  const item = event.target.closest("[data-preview-index]");
  if (!button || !item) return;

  const index = Number(item.dataset.previewIndex);
  if (!Number.isInteger(index) || !memoryState.selectedFiles[index]) return;

  const action = button.dataset.previewAction;
  if (action === "cover") {
    moveSelectedFile(index, 0);
    memoryState.coverIndex = 0;
  } else if (action === "left") {
    moveSelectedFile(index, index - 1);
  } else if (action === "right") {
    moveSelectedFile(index, index + 1);
  } else if (action === "remove") {
    memoryState.selectedFiles.splice(index, 1);
    memoryState.coverIndex = Math.min(memoryState.coverIndex, Math.max(0, memoryState.selectedFiles.length - 1));
  }

  syncMemoryFileInput();
  renderSelectedMediaPreview();
  renderComposePreview();
}

function moveSelectedFile(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= memoryState.selectedFiles.length || fromIndex === toIndex) return;

  const [file] = memoryState.selectedFiles.splice(fromIndex, 1);
  memoryState.selectedFiles.splice(toIndex, 0, file);

  if (memoryState.coverIndex === fromIndex) {
    memoryState.coverIndex = toIndex;
  } else if (fromIndex < memoryState.coverIndex && toIndex >= memoryState.coverIndex) {
    memoryState.coverIndex -= 1;
  } else if (fromIndex > memoryState.coverIndex && toIndex <= memoryState.coverIndex) {
    memoryState.coverIndex += 1;
  }
}

function syncMemoryFileInput() {
  const input = document.getElementById("memoryFiles");
  if (!input || typeof DataTransfer === "undefined") return;

  const transfer = new DataTransfer();
  memoryState.selectedFiles.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
}

function renderComposePreview() {
  const container = document.getElementById("composePreview");
  if (!container) return;

  const title = document.getElementById("memoryTitle")?.value.trim() || "Untitled Memory";
  const caption = document.getElementById("memoryCaption")?.value.trim() || "";
  const postedBy = document.getElementById("memoryPostedBy")?.value.trim() || "SFK";
  const date = document.getElementById("memoryDate")?.value || "";
  const videoUrl = document.getElementById("memoryVideoUrl")?.value.trim() || "";
  const musicUrl = document.getElementById("memoryMusicUrl")?.value.trim() || "";
  const musicTitle = document.getElementById("memoryMusicTitle")?.value.trim() || "";
  const firstFile = memoryState.selectedFiles[0] || null;

  let mediaPreview = `<div class="composePreviewMedia textOnly"><span>Text-only memory</span></div>`;
  if (firstFile) {
    const url = URL.createObjectURL(firstFile);
    mediaPreview = firstFile.type.startsWith("video/")
      ? `<video class="composePreviewMedia" src="${escapeAttr(url)}" muted></video>`
      : `<img class="composePreviewMedia" src="${escapeAttr(url)}" alt="" />`;
  } else if (videoUrl) {
    mediaPreview = `<div class="composePreviewMedia linked"><span>Linked video</span></div>`;
  }

  const musicLabel = musicUrl ? (musicTitle || deriveMusicNameFromUrl(musicUrl) || "Background music link") : "";
  const previewChips = [
    memoryState.selectedFiles.length ? `${memoryState.selectedFiles.length} media file${memoryState.selectedFiles.length > 1 ? "s" : ""}` : "",
    videoUrl ? "Linked video" : "",
    musicLabel ? `Music: ${musicLabel}` : ""
  ].filter(Boolean);

  container.innerHTML = `
    <div class="composePreviewTitle">
      <strong>Post preview</strong>
      <small>${memoryState.selectedFiles.length > 1 ? "Cover is the first item below." : "Preview before posting."}</small>
    </div>
    <article class="composePreviewCard">
      <header><span class="postAvatar">${escapeHtml(getInitials(postedBy))}</span><div><strong>${escapeHtml(postedBy)}</strong><small>${escapeHtml(memoryState.auth?.role || "Officer")}</small></div></header>
      ${mediaPreview}
      <div class="composePreviewDetails">
        <strong>${escapeHtml(title)}</strong>
        ${caption ? `<p>${escapeHtml(caption)}</p>` : ""}
        <time>${escapeHtml(formatPreviewDate(date))}</time>
        ${previewChips.length ? `<div class="composePreviewChips">${previewChips.map(chip => `<span>${escapeHtml(chip)}</span>`).join("")}</div>` : ""}
      </div>
    </article>
  `;
}

function setPostPreviewOpen(open) {
  const preview = document.getElementById("composePreview");
  const button = document.getElementById("togglePostPreviewButton");
  if (!preview || !button) return;

  preview.hidden = !open;
  button.setAttribute("aria-expanded", open ? "true" : "false");
  button.textContent = open ? "Hide Post Preview" : "Show Post Preview";
}

function togglePostPreview() {
  const preview = document.getElementById("composePreview");
  setPostPreviewOpen(Boolean(preview?.hidden));
}

function formatPreviewDate(value) {
  if (!value) return "SFK Memory";
  const date = new Date(`${value}T00:00:00`);
  if (isNaN(date)) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function restoreRememberedPostedBy() {
  const input = document.getElementById("memoryPostedBy");
  if (!input || input.value.trim()) return;

  const saved = localStorage.getItem(MEMORY_POSTED_BY_KEY);
  if (saved) input.value = saved;
}

function rememberPostedBy(value) {
  const cleanValue = String(value || "").trim();
  if (cleanValue) localStorage.setItem(MEMORY_POSTED_BY_KEY, cleanValue);
}

async function submitMemoryPost(event) {
  event.preventDefault();
  if (!memoryState.auth) {
    showMemoryAuthStep();
    return;
  }

  const videoUrl = document.getElementById("memoryVideoUrl").value.trim();
  const musicUrl = document.getElementById("memoryMusicUrl").value.trim();
  const musicTitle = document.getElementById("memoryMusicTitle").value.trim();
  const title = document.getElementById("memoryTitle").value.trim();
  const caption = document.getElementById("memoryCaption").value.trim();
  const message = document.getElementById("postMessage");
  const button = document.getElementById("publishMemoryButton");
  const hasAttachment = memoryState.selectedFiles.length > 0 || Boolean(videoUrl) || Boolean(musicUrl);
  const hasText = Boolean(title || caption);

  if (!hasAttachment && !hasText) {
    message.textContent = "Write a title or caption, or add an attachment.";
    return;
  }

  button.disabled = true;
  button.textContent = "Preparing...";
  message.textContent = "Optimizing and preparing your media...";

  try {
    const mediaFiles = [];
    let uploadBytes = 0;

    for (const file of memoryState.selectedFiles) {
      if (file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES) {
        throw new Error(`${file.name} is too large for Firebase direct upload. Use a Drive or YouTube link for videos.`);
      }

      const prepared = await prepareMediaFile(file);
      uploadBytes += Math.ceil(prepared.data.length * .75);
      if (uploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
        throw new Error("The selected media is too large for one post. Use fewer files or use a Drive/YouTube link for videos.");
      }
      mediaFiles.push(prepared);
    }

    button.textContent = "Sharing...";
    message.textContent = "Sharing this memory with SFK...";

    const payload = {
      Role: memoryState.auth.role,
      Title: title,
      Date: document.getElementById("memoryDate").value,
      PostedBy: document.getElementById("memoryPostedBy").value.trim(),
      Caption: caption,
      VideoURL: videoUrl,
      MediaFiles: mediaFiles,
      MusicURL: musicUrl,
      MusicTitle: musicTitle
    };

    const result = await postMemoryApi("memoryCreate", payload);
    if (!result.success) throw new Error(result.message || "Memory could not be posted.");

    rememberPostedBy(payload.PostedBy);
    resetMemoryForm();
    closeModal("composeModal");
    showMemoryToast("Memory shared successfully.");
    await loadMemories();
  } catch (error) {
    message.textContent = error.message || "Unable to post this memory.";
  } finally {
    button.disabled = false;
    button.textContent = "Share Memory";
  }
}

async function prepareMediaFile(file) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return fileToPayload(file);
  }

  const imageUrl = await readFileAsDataUrl(file);
  const image = await loadImage(imageUrl);
  const blob = await compressImageForFirestore(image);
  if (!blob) return fileToPayload(file);

  const dataUrl = await readFileAsDataUrl(blob);
  return {
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    mimeType: "image/jpeg",
    data: dataUrl.split(",")[1]
  };
}

async function compressImageForFirestore(image) {
  const dimensions = [1100, 900, 760, 640];
  const qualities = [.7, .62, .54, .46, .38];
  let bestBlob = null;

  for (const maxDimension of dimensions) {
    const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);

    for (const quality of qualities) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) continue;

      bestBlob = blob;
      if (blob.size <= TARGET_IMAGE_BYTES) return blob;
    }
  }

  return bestBlob;
}

async function fileToPayload(file) {
  const dataUrl = await readFileAsDataUrl(file);
  return {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    data: dataUrl.split(",")[1]
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected media."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to prepare one of the photos."));
    image.src = src;
  });
}

function resetMemoryForm() {
  document.getElementById("memoryForm")?.reset();
  stopMusicLibraryPreview();
  closeYoutubeSongPreview();
  memoryState.youtubeSearchResults = [];
  const youtubeResults = document.getElementById("youtubeSongResults");
  if (youtubeResults) youtubeResults.innerHTML = "";
  const youtubeMessage = document.getElementById("youtubeSongSearchMessage");
  if (youtubeMessage) youtubeMessage.textContent = "";
  memoryState.selectedFiles = [];
  memoryState.coverIndex = 0;
  document.getElementById("mediaPreview").innerHTML = "";
  document.getElementById("postMessage").textContent = "";
  const musicTestMessage = document.getElementById("musicTestMessage");
  if (musicTestMessage) {
    musicTestMessage.textContent = "Paste a direct audio link, then test before posting.";
    musicTestMessage.className = "musicTestMessage";
  }
  const musicLibrarySearch = document.getElementById("musicLibrarySearch");
  if (musicLibrarySearch) musicLibrarySearch.value = "";
  const musicLibraryStatus = document.getElementById("musicLibraryStatus");
  if (musicLibraryStatus) musicLibraryStatus.textContent = "";
  renderMemoryMusicLibrary();
  setPostPreviewOpen(false);
  setAdditionalMusicSourcesOpen(false);
  setMusicFieldsOpen(false);
  setDefaultMemoryDate();
  restoreRememberedPostedBy();
  renderComposePreview();
}

function openManageActions(id) {
  if (!memoryState.auth) return;

  const post = memoryState.posts.find((item) => item.id === id);
  if (!post) return;

  const layer = document.createElement("div");
  layer.className = "modalLayer manageLayer";
  layer.innerHTML = `
    <div class="modalBackdrop" data-manage-close></div>
    <section class="manageSheet" role="dialog" aria-modal="true" aria-label="Manage memory">
      <div class="managePreview"><span class="miniBrandMark">SFK</span><div><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.date)}</small></div></div>
      <button type="button" data-manage-action="edit">Edit details</button>
      <button type="button" data-manage-action="hide">Hide from Memories</button>
      ${memoryState.auth.role === "Admin" ? `<button class="dangerAction" type="button" data-manage-action="delete">Delete permanently</button>` : ""}
      <button type="button" data-manage-close>Cancel</button>
    </section>
  `;

  layer.addEventListener("click", async (event) => {
    if (event.target.closest("[data-manage-close]")) {
      layer.remove();
      return;
    }

    const actionButton = event.target.closest("[data-manage-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.manageAction;
    if (action === "edit") {
      renderEditMemoryForm(layer, post);
      return;
    }

    if (action !== "hide" && action !== "delete") return;

    const label = action === "delete" ? "permanently delete" : "hide";
    if (!window.confirm(`Do you want to ${label} this memory?`)) return;

    actionButton.disabled = true;
    try {
      const result = await postMemoryApi(action === "delete" ? "memoryDelete" : "memoryHide", {
        MemoryID: id,
        Role: memoryState.auth.role,
      });
      if (!result.success) throw new Error(result.message || "Action failed.");
      layer.remove();
      showMemoryToast(result.message || "Memory updated.");
      await loadMemories();
    } catch (error) {
      showMemoryToast(error.message || "Unable to update memory.");
      actionButton.disabled = false;
    }
  });

  document.body.appendChild(layer);
}

function renderEditMemoryForm(layer, post) {
  const videoUrl = post.videoUrl || "";
  const musicTitle = getMusicDisplayName(post.music);

  layer.innerHTML = `
    <div class="modalBackdrop" data-manage-close></div>
    <section class="manageSheet editMemorySheet" role="dialog" aria-modal="true" aria-label="Edit memory">
      <div class="managePreview"><span class="miniBrandMark">SFK</span><div><strong>Edit memory</strong><small>${escapeHtml(post.id)}</small></div></div>
      <label>Memory title
        <input id="editMemoryTitle" type="text" maxlength="80" value="${escapeAttr(post.title || "")}" />
      </label>
      <label>Event date
        <input id="editMemoryDate" type="date" value="${escapeAttr(toDateInputValue(post.date))}" />
      </label>
      <label>Posted by
        <input id="editMemoryPostedBy" type="text" maxlength="60" value="${escapeAttr(post.postedBy || "")}" />
      </label>
      <label>Caption and details
        <textarea id="editMemoryCaption" rows="4" maxlength="1200">${escapeHtml(post.caption || "")}</textarea>
      </label>
      <label>Video link
        <input id="editMemoryVideoUrl" type="url" value="${escapeAttr(videoUrl)}" />
        <small class="fieldHint">This edits the linked video only. Uploaded photos/videos stay as-is.</small>
      </label>
      <label>Displayed music title
        <input id="editMemoryMusicTitle" type="text" maxlength="80" value="${escapeAttr(musicTitle || "")}" />
        <small class="fieldHint">This changes the title shown on the music marquee. It does not replace the music link.</small>
      </label>
      <p id="editMemoryMessage" class="formMessage" aria-live="polite"></p>
      <div class="manageActionsRow">
        <button class="secondaryButton" type="button" data-manage-action="back">Back</button>
        <button class="primaryButton" type="button" data-manage-action="save-edit">Save changes</button>
      </div>
    </section>
  `;

  layer.onclick = async (event) => {
    if (event.target.closest("[data-manage-close]")) {
      layer.remove();
      return;
    }

    const actionButton = event.target.closest("[data-manage-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.manageAction;
    if (action === "back") {
      layer.remove();
      openManageActions(post.id);
      return;
    }

    if (action !== "save-edit") return;

    const title = document.getElementById("editMemoryTitle").value.trim();
    const caption = document.getElementById("editMemoryCaption").value.trim();
    const postedBy = document.getElementById("editMemoryPostedBy").value.trim();
    const date = document.getElementById("editMemoryDate").value;
    const videoUrlValue = document.getElementById("editMemoryVideoUrl").value.trim();
    const musicTitleValue = document.getElementById("editMemoryMusicTitle")?.value.trim() || "";
    const message = document.getElementById("editMemoryMessage");

    if (!postedBy) {
      message.textContent = "Posted by is required.";
      return;
    }

    if (!title && !caption && !videoUrlValue && post.media.length === 0 && !post.music) {
      message.textContent = "Write a title or caption, or keep an attachment.";
      return;
    }

    actionButton.disabled = true;
    message.textContent = "Saving changes...";

    try {
      const result = await postMemoryApi("memoryUpdate", {
        MemoryID: post.id,
        Role: memoryState.auth.role,
        Title: title,
        Date: date,
        PostedBy: postedBy,
        Caption: caption,
        VideoURL: videoUrlValue,
        MusicTitle: musicTitleValue
      });

      if (!result.success) throw new Error(result.message || "Memory could not be updated.");
      layer.remove();
      showMemoryToast(result.message || "Memory updated.");
      await loadMemories();
    } catch (error) {
      message.textContent = error.message || "Unable to update memory.";
      actionButton.disabled = false;
    }
  };
}

function openPostViewer(id, index) {
  const post = memoryState.posts.find((item) => item.id === id);
  if (!post || post.media.length === 0) return;
  memoryState.viewerMedia = post.media;
  memoryState.viewerIndex = Math.min(Math.max(0, index), post.media.length - 1);
  document.getElementById("viewerModal").hidden = false;
  document.body.style.overflow = "hidden";
  renderViewer();
}

function renderViewer() {
  const content = document.getElementById("viewerContent");
  if (!content || memoryState.viewerMedia.length === 0) return;

  clearViewerInlineMotion(content);
  content.classList.remove("viewerSwitching", "viewerEnterNext", "viewerEnterPrevious");
  const slides = memoryState.viewerMedia.map((media, index) => `
    <div class="viewerSlide ${index === memoryState.viewerIndex ? "active" : ""}" data-viewer-slide-index="${index}">
      ${renderViewerMedia(media, { active: index === memoryState.viewerIndex })}
    </div>
  `).join("");

  content.innerHTML = `<div class="viewerTrack" id="viewerTrack">${slides}</div>`;
  setViewerTrackPosition(memoryState.viewerIndex, 0, false);
  attachViewerMediaFallbacks(content);
  updateViewerControls();
  syncActiveViewerPlayback();
}

function renderViewerMedia(media, options = {}) {
  if (!media) return "";
  const active = options.active !== false;

  if (media.kind === "image") {
    return `<img src="${escapeAttr(media.viewerUrl || media.url)}" alt="${escapeAttr(media.name)}" draggable="false" />`;
  }

  if (media.kind === "direct-video" || media.kind === "drive-video") {
    const source = media.kind === "drive-video" ? (media.streamUrl || media.url) : media.url;
    return `
      <video class="viewerVideo" src="${escapeAttr(source)}" ${active ? "autoplay" : 'preload="metadata"'} ${media.muted === false && active ? "" : "muted"} loop playsinline ${media.kind === "drive-video" ? `data-viewer-drive-preview="${escapeAttr(media.url)}"` : ""}></video>
      ${active ? renderViewerVolumeButton(media) : ""}
    `;
  }

  const youtubeId = getYouTubeId(media.fullUrl || media.url);
  const source = youtubeId ? getYouTubeEmbedUrl(youtubeId, active && media.muted !== false) : media.url;
  return `
    <iframe class="viewerVideoFrame" src="${escapeAttr(source)}" title="${escapeAttr(media.name)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen data-youtube="${youtubeId ? "true" : "false"}"></iframe>
  `;
}

function attachViewerMediaFallbacks(content = document.getElementById("viewerContent")) {
  if (!content) return;
  content.querySelectorAll("video[data-viewer-drive-preview]").forEach((driveVideo) => {
    driveVideo.addEventListener("error", () => {
      const preview = driveVideo.dataset.viewerDrivePreview;
      const shell = driveVideo.closest(".viewerSlide") || content;
      shell.innerHTML = `<iframe class="viewerVideoFrame" src="${escapeAttr(preview)}" title="Google Drive video" allow="fullscreen" allowfullscreen></iframe>`;
    }, { once: true });
  });
}

function updateViewerControls() {
  const multiple = memoryState.viewerMedia.length > 1;
  document.getElementById("viewerPrevious").hidden = !multiple || memoryState.viewerIndex === 0;
  document.getElementById("viewerNext").hidden = !multiple || memoryState.viewerIndex === memoryState.viewerMedia.length - 1;
  const counter = document.getElementById("viewerCounter");
  if (counter) counter.textContent = `${memoryState.viewerIndex + 1} / ${memoryState.viewerMedia.length}`;
}

function renderViewerVolumeButton(media) {
  const audible = media.muted === false;
  return `<button class="mediaVolumeButton viewerVolumeButton ${audible ? "audible" : ""}" type="button" data-viewer-volume aria-label="${audible ? "Mute video" : "Turn on video sound"}">${audible ? "&#128266;" : "&#128263;"}</button>`;
}

function handleViewerClick(event) {
  const button = event.target.closest("[data-viewer-volume]");
  if (!button) return;

  const media = memoryState.viewerMedia[memoryState.viewerIndex];
  if (!media) return;

  const willUnmute = media.muted !== false;
  if (willUnmute) muteAllOtherMedia("", -1);
  media.muted = !willUnmute;

  const activeSlide = getActiveViewerSlide();
  const video = activeSlide?.querySelector("video");
  const iframe = activeSlide?.querySelector('iframe[data-youtube="true"]');

  if (video) {
    video.muted = media.muted;
    video.volume = 1;
    video.play().catch(() => {});
  }

  if (iframe) {
    sendYouTubeCommand(iframe, media.muted ? "mute" : "unMute");
    sendYouTubeCommand(iframe, "playVideo");
  }

  updateVolumeButton(button, media.muted);
}

function moveViewer(direction, options = {}) {
  if (memoryState.viewerMedia.length < 2 || memoryState.viewerAnimating) return;

  const currentIndex = memoryState.viewerIndex;
  const nextIndex = Math.max(0, Math.min(memoryState.viewerMedia.length - 1, currentIndex + direction));
  if (nextIndex === currentIndex) {
    setViewerTrackPosition(currentIndex, 0, true);
    return;
  }

  if (options.smooth === false) {
    memoryState.viewerIndex = nextIndex;
    updateViewerActiveSlide();
    setViewerTrackPosition(nextIndex, 0, false);
    updateViewerControls();
    syncActiveViewerPlayback();
    return;
  }

  animateViewerSwitch(direction, nextIndex, options);
}

function animateViewerSwitch(direction, nextIndex, options = {}) {
  const content = document.getElementById("viewerContent");
  const track = content?.querySelector(".viewerTrack");

  if (!content || !track) {
    memoryState.viewerIndex = nextIndex;
    renderViewer();
    return;
  }

  memoryState.viewerAnimating = true;
  const startOffset = Number(options.gesture?.deltaX || 0);
  memoryState.viewerIndex = nextIndex;
  updateViewerActiveSlide();
  updateViewerControls();
  setViewerTrackPosition(nextIndex - direction, startOffset, false);

  window.requestAnimationFrame(() => {
    setViewerTrackPosition(nextIndex, 0, true);
  });

  window.setTimeout(() => {
    memoryState.viewerAnimating = false;
    setViewerTrackPosition(memoryState.viewerIndex, 0, false);
    syncActiveViewerPlayback();
  }, 360);
}

function setViewerTrackPosition(index = memoryState.viewerIndex, offsetPx = 0, animate = false) {
  const track = document.getElementById("viewerTrack") || document.querySelector("#viewerContent .viewerTrack");
  if (!track) return;

  const easing = "cubic-bezier(.22, .72, .2, 1)";
  track.style.transition = animate ? `transform 335ms ${easing}` : "none";
  track.style.transform = `translate3d(calc(-${index * 100}% + ${offsetPx}px), 0, 0)`;
}

function updateViewerActiveSlide() {
  const content = document.getElementById("viewerContent");
  if (!content) return;

  content.querySelectorAll(".viewerSlide").forEach((slide) => {
    const active = Number(slide.dataset.viewerSlideIndex) === memoryState.viewerIndex;
    slide.classList.toggle("active", active);
  });
}

function getActiveViewerSlide() {
  return document.querySelector(`#viewerContent .viewerSlide[data-viewer-slide-index="${memoryState.viewerIndex}"]`);
}

function syncActiveViewerPlayback() {
  const content = document.getElementById("viewerContent");
  if (!content || document.getElementById("viewerModal")?.hidden) return;

  content.querySelectorAll(".viewerSlide").forEach((slide) => {
    const index = Number(slide.dataset.viewerSlideIndex);
    const active = index === memoryState.viewerIndex;
    const media = memoryState.viewerMedia[index];
    const video = slide.querySelector("video");
    const iframe = slide.querySelector('iframe[data-youtube="true"]');

    if (video) {
      video.muted = active ? media?.muted !== false : true;
      if (active && !document.hidden) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }

    if (iframe) {
      sendYouTubeCommand(iframe, active && media?.muted === false ? "unMute" : "mute");
      sendYouTubeCommand(iframe, active && !document.hidden ? "playVideo" : "pauseVideo");
    }
  });
}

function resetViewerSwipePosition(content = document.getElementById("viewerContent")) {
  if (!content) return;
  setViewerTrackPosition(memoryState.viewerIndex, 0, true);
}

function clearViewerInlineMotion(content = document.getElementById("viewerContent")) {
  if (!content) return;
  content.style.transition = "";
  content.style.transform = "";
  content.style.opacity = "";
  const track = content.querySelector(".viewerTrack");
  if (track) {
    track.style.transition = "";
    track.style.transform = "";
  }
}

function closeViewer() {
  const viewer = document.getElementById("viewerModal");
  if (!viewer || viewer.hidden) return;
  touchGesture = touchGesture?.scope === "viewer" ? null : touchGesture;
  memoryState.viewerAnimating = false;
  viewer.hidden = true;
  const content = document.getElementById("viewerContent");
  clearViewerInlineMotion(content);
  if (content) content.innerHTML = "";
  document.body.style.overflow = "";
}

function setMemoryFilter(filter) {
  memoryState.filter = ["photos", "videos"].includes(filter) ? filter : "all";
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === memoryState.filter);
  });
  renderMemories();
}

function updateMemoryStats() {
  const posts = memoryState.posts.length;
  const photos = memoryState.posts.reduce((total, post) => total + post.media.filter((item) => item.kind === "image").length, 0);
  const videos = memoryState.posts.reduce((total, post) => total + post.media.filter((item) => item.kind !== "image").length, 0);

  setText("postCount", posts);
  setText("mobilePostCount", posts);
  setText("photoCount", photos);
  setText("videoCount", videos);
}

function setDefaultMemoryDate() {
  const input = document.getElementById("memoryDate");
  if (!input || input.value) return;
  input.value = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function toDateInputValue(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = new Date(text);
  if (!isNaN(parsed)) {
    return parsed.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  }

  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function setFeedStatus(message) {
  const status = document.getElementById("feedStatus");
  if (!status) return;
  status.textContent = message;
  status.hidden = !message;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
}

function formatHeartCount(value) {
  const count = Math.max(0, Number(value) || 0);
  return count === 1 ? "1 heart" : `${count.toLocaleString()} hearts`;
}

function getInitials(value) {
  const parts = String(value || "SFK").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SFK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function postMemoryApi(type, payload) {
  let authToken = "";
  try {
    // Always request a fresh Firebase ID token for Apps Script writes.
    // This prevents a stale/expired token from making Admin/Officer posts look unauthorized.
    authToken = await window.SFKAuth?.getIdToken(true);
  } catch (error) {
    authToken = "";
  }

  const roleHint = memoryState.auth?.role || payload?.Role || "";
  const response = await fetch(MEMORIES_API_URL, {
    method: "POST",
    body: JSON.stringify({
      type,
      payload: {
        ...(payload || {}),
        ...(roleHint ? { AuthRoleHint: roleHint } : {}),
        ...(authToken ? { AuthToken: authToken } : {})
      }
    })
  });
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(text.slice(0, 160) || "Invalid server response.");
  }
}

let toastTimer = null;
function showMemoryToast(message) {
  const toast = document.getElementById("memoryToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

/* ========================================================================
   STABLE MEMORY HEART LEDGER V3
   Source of truth: settings collection documents with Kind=ClassBoardHeartLedgerV3.
   This does not touch old HeartCount fields and is shared in spirit with the
   Subject Announcement heart system.
======================================================================== */
const MEMORY_HEART_LEDGER_KIND_V3 = "ClassBoardHeartLedgerV3";
const MEMORY_HEART_LEDGER_COLLECTION_V3 = "settings";
const MEMORY_HEART_LEDGER_PENDING = new Set();

function getMemoryHeartLedgerDbV3() {
  try {
    if (window.SFK_CLASSBOARD_FIREBASE_DB) return window.SFK_CLASSBOARD_FIREBASE_DB;
    if (!window.firebase || !window.SFK_FIREBASE_READY) return null;
    if (!firebase.apps.length) firebase.initializeApp(window.SFK_FIREBASE_CONFIG);
    const db = firebase.firestore();
    window.SFK_CLASSBOARD_FIREBASE_DB = db;
    return db;
  } catch (error) {
    console.warn("Memory heart ledger database unavailable:", error);
    return null;
  }
}

function makeMemoryHeartTargetKeyV3(postOrId) {
  const id = typeof postOrId === "object"
    ? String(postOrId?.docId || postOrId?.DocID || postOrId?.id || postOrId?.ID || postOrId?.MemoryID || postOrId?.memoryId || "").trim()
    : String(postOrId || "").trim();
  return `memory:${id}`;
}

function hashMemoryHeartLedgerTextV3(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function makeMemoryHeartLedgerDocIdV3(targetKey, deviceId) {
  return `heartV3_${hashMemoryHeartLedgerTextV3(targetKey)}_${hashMemoryHeartLedgerTextV3(deviceId)}`;
}

async function readMemoryHeartLedgerSummaryV3(targetKeys) {
  const db = getMemoryHeartLedgerDbV3();
  const uniqueKeys = Array.from(new Set((targetKeys || []).map(String).filter(Boolean)));
  const summary = {};
  uniqueKeys.forEach(key => {
    summary[key] = { count: 0, mine: false };
  });
  if (!db || uniqueKeys.length === 0) return summary;

  const targetSet = new Set(uniqueKeys);
  const deviceId = getClassBoardHeartDeviceId();

  try {
    const snap = await db.collection(MEMORY_HEART_LEDGER_COLLECTION_V3)
      .where("Kind", "==", MEMORY_HEART_LEDGER_KIND_V3)
      .get();

    snap.forEach(doc => {
      const data = doc.data() || {};
      const key = String(data.TargetKey || "").trim();
      if (!targetSet.has(key)) return;
      if (String(data.TargetType || "").trim() !== "memory") return;
      if (data.Active === false) return;
      summary[key].count += 1;
      if (String(data.DeviceID || "") === deviceId) summary[key].mine = true;
    });
  } catch (error) {
    console.warn("Unable to read memory heart ledger:", error);
  }

  return summary;
}

async function saveMemoryHeartLedgerStateV3(targetKey, shouldHeart) {
  const db = getMemoryHeartLedgerDbV3();
  if (!db) throw new Error("Firebase is not ready for memory hearts.");

  const deviceId = getClassBoardHeartDeviceId();
  const cleanTargetKey = String(targetKey || "").trim();
  if (!cleanTargetKey) throw new Error("Missing memory heart target.");

  const docId = makeMemoryHeartLedgerDocIdV3(cleanTargetKey, deviceId);
  const ref = db.collection(MEMORY_HEART_LEDGER_COLLECTION_V3).doc(docId);

  if (shouldHeart) {
    const payload = {
      Kind: MEMORY_HEART_LEDGER_KIND_V3,
      TargetType: "memory",
      TargetKey: cleanTargetKey,
      DeviceID: deviceId,
      Active: true,
      UpdatedAtText: new Date().toISOString()
    };
    if (window.firebase?.firestore?.FieldValue) {
      payload.UpdatedAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    await ref.set(payload, { merge: true });
  } else {
    await ref.delete().catch(async () => {
      await ref.set({
        Kind: MEMORY_HEART_LEDGER_KIND_V3,
        TargetType: "memory",
        TargetKey: cleanTargetKey,
        DeviceID: deviceId,
        Active: false,
        UpdatedAtText: new Date().toISOString()
      }, { merge: true });
    });
  }

  const summary = await readMemoryHeartLedgerSummaryV3([cleanTargetKey]);
  return {
    success: true,
    hearted: Boolean(summary[cleanTargetKey]?.mine),
    count: Number(summary[cleanTargetKey]?.count || 0),
    targetKey: cleanTargetKey
  };
}

async function hydrateMemoryHeartsV3(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return posts;
  const keys = posts.map(post => makeMemoryHeartTargetKeyV3(post));
  const summary = await readMemoryHeartLedgerSummaryV3(keys);
  posts.forEach(post => {
    const key = makeMemoryHeartTargetKeyV3(post);
    const info = summary[key] || { count: 0, mine: false };
    post._heartV3TargetKey = key;
    post._heartV3Count = Number(info.count || 0);
    post._heartV3Mine = Boolean(info.mine);
    post.heartCount = post._heartV3Count;
    post.HeartCount = post._heartV3Count;
  });
  return posts;
}

loadMemories = async function loadMemoriesWithHeartLedgerV3() {
  setFeedStatus("Loading memories...");
  try {
    const rows = await loadMemoriesFromFirebaseFirst();
    const posts = rows.map(normalizeMemoryPost);
    await hydrateMemoryHeartsV3(posts);
    memoryState.posts = posts;
    localStorage.setItem(MEMORY_CACHE_KEY, JSON.stringify(memoryState.posts));
    markLoadedMemoriesSeen(memoryState.posts);
    renderMemories();
  } catch (error) {
    console.error("Memories load failed:", error);
    if (memoryState.posts.length === 0) {
      setFeedStatus("Memories will appear after the database loads correctly.");
    }
  }
};

readMemoryHeartCount = function readMemoryHeartCountV3(raw) {
  const ledgerCount = Number(raw?._heartV3Count);
  return Number.isFinite(ledgerCount) && ledgerCount >= 0 ? ledgerCount : 0;
};

isMemoryHeartedByThisDevice = function isMemoryHeartedByThisDeviceV3(post) {
  return Boolean(post?._heartV3Mine);
};

heartMemory = async function heartMemoryV3(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId || MEMORY_HEART_LEDGER_PENDING.has(cleanId)) return false;

  const post = memoryState.posts.find((item) => item.id === cleanId);
  if (!post) return false;

  const targetKey = makeMemoryHeartTargetKeyV3(post);
  const nextHearted = !Boolean(post._heartV3Mine);
  MEMORY_HEART_LEDGER_PENDING.add(cleanId);
  setMemoryHeartButtonSaving(cleanId, true);

  try {
    const result = await saveMemoryHeartLedgerStateV3(targetKey, nextHearted);
    memoryState.posts = memoryState.posts.map((item) => {
      if (item.id !== cleanId) return item;
      return {
        ...item,
        _heartV3TargetKey: targetKey,
        _heartV3Count: result.count,
        _heartV3Mine: result.hearted,
        heartCount: result.count,
        HeartCount: result.count
      };
    });
    updateMemoryHeartDisplay(cleanId);
    saveMemoryCacheSnapshot();
  } catch (error) {
    console.error("Memory heart failed:", error);
    showToast("Unable to save heart. Please refresh and try again.");
  } finally {
    MEMORY_HEART_LEDGER_PENDING.delete(cleanId);
    setMemoryHeartButtonSaving(cleanId, false);
  }

  return false;
};

syncMemoryHeartStatesFromServer = function syncMemoryHeartStatesFromServerV3() {
  // No-op. Heart state now comes from the Firestore ledger during loadMemories().
};

/* ========================================================================
   FAST MEMORY HEART LEDGER V4 UI
   Optimistic UI: heart/count updates immediately; Firebase save is background.
======================================================================== */
async function writeMemoryHeartLedgerFastV4(targetKey, shouldHeart) {
  const db = getMemoryHeartLedgerDbV3();
  if (!db) throw new Error("Firebase is not ready for memory hearts.");
  const deviceId = getClassBoardHeartDeviceId();
  const cleanTargetKey = String(targetKey || "").trim();
  if (!cleanTargetKey) throw new Error("Missing memory heart target.");
  const docId = makeMemoryHeartLedgerDocIdV3(cleanTargetKey, deviceId);
  const ref = db.collection(MEMORY_HEART_LEDGER_COLLECTION_V3).doc(docId);
  if (shouldHeart) {
    const payload = {
      Kind: MEMORY_HEART_LEDGER_KIND_V3,
      TargetType: "memory",
      TargetKey: cleanTargetKey,
      DeviceID: deviceId,
      Active: true,
      UpdatedAtText: new Date().toISOString()
    };
    if (window.firebase?.firestore?.FieldValue) payload.UpdatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await ref.set(payload, { merge: true });
  } else {
    await ref.delete().catch(async () => {
      await ref.set({
        Kind: MEMORY_HEART_LEDGER_KIND_V3,
        TargetType: "memory",
        TargetKey: cleanTargetKey,
        DeviceID: deviceId,
        Active: false,
        UpdatedAtText: new Date().toISOString()
      }, { merge: true });
    });
  }
  return { success: true, targetKey: cleanTargetKey, hearted: Boolean(shouldHeart) };
}

function updateMemoryHeartRecordInstantV4(id, targetKey, hearted, count) {
  const safeCount = Math.max(0, Number(count) || 0);
  memoryState.posts = memoryState.posts.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      _heartV3TargetKey: targetKey,
      _heartV3Count: safeCount,
      _heartV3Mine: Boolean(hearted),
      heartCount: safeCount,
      HeartCount: safeCount
    };
  });
  updateMemoryHeartDisplay(id);
  saveMemoryCacheSnapshot();
}

setMemoryHeartButtonSaving = function setMemoryHeartButtonSavingFastV4(id, saving) {
  const article = Array.from(document.querySelectorAll(".memoryPost"))
    .find((item) => item.dataset.postId === String(id || ""));
  const button = article?.querySelector('.heartButton[data-action="heart"]');
  if (!button) return;
  // Do not disable the button or show wait cursor. The pending set still blocks double saves.
  button.classList.toggle("is-saving", Boolean(saving));
  button.disabled = false;
};

heartMemory = function heartMemoryFastV4(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId || MEMORY_HEART_LEDGER_PENDING.has(cleanId)) return false;

  const post = memoryState.posts.find((item) => item.id === cleanId);
  if (!post) return false;

  const targetKey = makeMemoryHeartTargetKeyV3(post);
  const previousHearted = Boolean(post._heartV3Mine);
  const previousCount = Math.max(0, Number(post._heartV3Count ?? post.heartCount) || 0);
  const nextHearted = !previousHearted;
  const optimisticCount = Math.max(0, previousCount + (nextHearted ? 1 : -1));

  MEMORY_HEART_LEDGER_PENDING.add(cleanId);
  updateMemoryHeartRecordInstantV4(cleanId, targetKey, nextHearted, optimisticCount);

  writeMemoryHeartLedgerFastV4(targetKey, nextHearted)
    .catch(error => {
      console.error("Memory heart save failed:", error);
      updateMemoryHeartRecordInstantV4(cleanId, targetKey, previousHearted, previousCount);
      showToast("Heart was not saved. Please try again.");
    })
    .finally(() => {
      MEMORY_HEART_LEDGER_PENDING.delete(cleanId);
      setMemoryHeartButtonSaving(cleanId, false);
    });

  return false;
};
