const STORAGE_KEYS = {
  TASKS: 'studyBuddy_tasks',
  ROADMAP: 'studyBuddy_roadmap',
};

function loadFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function matchKeywords(input, keywords) {
  const normalized = input.toLowerCase();
  return keywords.some((kw) => normalized.includes(kw));
}

function findRoadmap(input) {
  for (const key of Object.keys(ROADMAPS)) {
    if (key === 'default') continue;
    const roadmap = ROADMAPS[key];
    if (matchKeywords(input, roadmap.keywords)) {
      return { ...roadmap, id: key };
    }
  }
  return { ...ROADMAPS.default, id: 'default' };
}

function findChatReply(input) {
  const normalized = input.toLowerCase();
  for (const entry of CHAT_RESPONSES) {
    if (entry.keywords.some((kw) => normalized.includes(kw))) {
      return entry.reply;
    }
  }
  return DEFAULT_CHAT_REPLY;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
