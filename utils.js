const STORAGE_KEYS = {
  TASKS: 'studyBuddy_tasks',
  ROADMAP: 'studyBuddy_roadmap',
  SAVED_ROADMAPS: 'studyBuddy_savedRoadmaps',
};

const MAX_INPUT_LENGTH = 500;
const MAX_STEP_DESCRIPTION_LENGTH = 2000;

function loadFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function clampInput(value, max = MAX_INPUT_LENGTH) {
  if (value == null) return '';
  return String(value).trim().slice(0, max);
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function normalizeSavedRoadmap(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const steps = Array.isArray(entry.steps)
    ? entry.steps
        .filter((step) => step && step.title)
        .map((step) => ({
          title: clampInput(step.title),
          description: clampInput(step.description, MAX_STEP_DESCRIPTION_LENGTH),
        }))
        .filter((step) => step.title)
    : [];
  const title = clampInput(entry.title);
  if (!title || steps.length === 0) return null;
  return {
    id: entry.id != null ? entry.id : Date.now(),
    title,
    steps,
    goalInput: clampInput(entry.goalInput || ''),
    savedAt: typeof entry.savedAt === 'number' ? entry.savedAt : Date.now(),
  };
}

function normalizeStoredTasks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((task) => {
      if (!task || typeof task !== 'object') return null;
      const normalized = {
        id: typeof task.id === 'number' ? task.id : Date.now(),
        title: clampInput(task.title || task.text || ''),
        createdAt:
          typeof task.createdAt === 'number'
            ? task.createdAt
            : typeof task.id === 'number'
              ? task.id
              : Date.now(),
        completed: !!task.completed,
        status: task.status || (task.completed ? 'completed' : 'pending'),
      };
      return normalized.title ? normalized : null;
    })
    .filter(Boolean);
}
