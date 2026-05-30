function normalizeTask(task) {
  const title = (task.title || task.text || '').trim();
  const createdAt =
    typeof task.createdAt === 'number'
      ? task.createdAt
      : typeof task.id === 'number'
        ? task.id
        : Date.now();
  return {
    id: task.id,
    title,
    createdAt,
    completed: !!task.completed,
  };
}

function getTaskTitle(task) {
  return task.title || task.text || '';
}

function formatTaskDateTime(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const rawTasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
let tasks = rawTasks.map(normalizeTask);
if (rawTasks.some((t) => t.text && !t.title)) {
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
}
let savedRoadmaps = loadFromStorage(STORAGE_KEYS.SAVED_ROADMAPS, []);
let pendingRoadmap = null;

const heroInput = document.getElementById('hero-input');
const generateBtn = document.getElementById('generate-btn');
const heroValidationAlert = document.getElementById('hero-validation-alert');
const heroValidationOk = document.getElementById('hero-validation-ok');
const heroValidationClose = document.getElementById('hero-validation-close');
const roadmapSection = document.getElementById('roadmap');
const roadmapTitle = document.getElementById('roadmap-title');
const roadmapCards = document.getElementById('roadmap-cards');
const roadmapActions = document.getElementById('roadmap-actions');
const saveRoadmapBtn = document.getElementById('save-roadmap-btn');
const roadmapSavedMsg = document.getElementById('roadmap-saved-msg');
const savedRoadmapsList = document.getElementById('saved-roadmaps-list');
const emptySaved = document.getElementById('empty-saved');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const emptyTasks = document.getElementById('empty-tasks');
const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

function generateRoadmap(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  return findRoadmap(trimmed);
}

function isRoadmapSaved(id) {
  return savedRoadmaps.some((r) => r.id === id);
}

function updateRoadmapSaveUI(roadmapId) {
  const saved = isRoadmapSaved(roadmapId);
  roadmapActions.classList.remove('hidden');
  saveRoadmapBtn.classList.toggle('hidden', saved);
  roadmapSavedMsg.classList.toggle('hidden', !saved);
}

function renderRoadmap(data, { fromSaved = false } = {}) {
  if (!data) return;

  roadmapTitle.textContent = data.title;
  roadmapCards.innerHTML = '';

  data.steps.forEach((step, index) => {
    const card = document.createElement('div');
    card.className = 'card-brutal animate-fade-slide';
    card.style.animationDelay = `${index * 0.08}s`;
    card.innerHTML = `
      <div class="flex items-start gap-4">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-black bg-accent-blue text-lg font-black text-white"
              style="box-shadow: 2px 2px 0 #000">${index + 1}</span>
        <div>
          <h3 class="text-lg font-black uppercase">${escapeHtml(step.title)}</h3>
          <p class="mt-2 font-medium text-gray-700">${escapeHtml(step.description)}</p>
        </div>
      </div>
    `;
    roadmapCards.appendChild(card);
  });

  if (fromSaved) {
    roadmapActions.classList.add('hidden');
  } else {
    updateRoadmapSaveUI(data.id);
  }

  roadmapSection.classList.remove('hidden');
}

function formatSavedDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function renderSavedRoadmaps() {
  savedRoadmapsList.innerHTML = '';
  emptySaved.classList.toggle('hidden', savedRoadmaps.length > 0);

  savedRoadmaps.forEach((roadmap) => {
    const card = document.createElement('article');
    card.className = 'card-brutal flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between';
    card.dataset.id = roadmap.id;

    const goalLine = roadmap.goalInput
      ? `<p class="mt-1 text-sm font-medium text-gray-600">Goal: ${escapeHtml(roadmap.goalInput)}</p>`
      : '';

    card.innerHTML = `
      <div class="min-w-0 flex-1">
        <h3 class="text-lg font-black uppercase">${escapeHtml(roadmap.title)}</h3>
        ${goalLine}
        <p class="mt-2 text-sm font-bold text-gray-500">
          ${roadmap.steps.length} steps · Saved ${formatSavedDate(roadmap.savedAt)}
        </p>
      </div>
      <div class="flex shrink-0 flex-wrap gap-3">
        <button type="button" class="btn-brutal-primary view-saved-btn text-sm py-2 px-4">View</button>
        <button type="button" class="btn-brutal-outline delete-saved-btn border-[3px] border-black bg-white text-sm font-bold py-2 px-4"
                style="box-shadow: 4px 4px 0 #000">Delete</button>
      </div>
    `;

    card.querySelector('.view-saved-btn').addEventListener('click', () => {
      pendingRoadmap = roadmap;
      renderRoadmap(roadmap, { fromSaved: true });
      roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    card.querySelector('.delete-saved-btn').addEventListener('click', () => {
      showDeleteConfirmModal(roadmap.id);
    });

    savedRoadmapsList.appendChild(card);
  });
}

function savePendingRoadmap() {
  if (!pendingRoadmap || isRoadmapSaved(pendingRoadmap.id)) return;

  const entry = {
    id: pendingRoadmap.id,
    title: pendingRoadmap.title,
    steps: pendingRoadmap.steps,
    goalInput: pendingRoadmap.goalInput || '',
    savedAt: Date.now(),
  };

  savedRoadmaps.unshift(entry);
  saveToStorage(STORAGE_KEYS.SAVED_ROADMAPS, savedRoadmaps);
  updateRoadmapSaveUI(pendingRoadmap.id);
  renderSavedRoadmaps();
}

function deleteSavedRoadmap(id) {
  savedRoadmaps = savedRoadmaps.filter((r) => r.id !== id);
  saveToStorage(STORAGE_KEYS.SAVED_ROADMAPS, savedRoadmaps);

  const card = savedRoadmapsList.querySelector(`[data-id="${id}"]`);
  if (card) card.remove();

  emptySaved.classList.toggle('hidden', savedRoadmaps.length > 0);

  if (pendingRoadmap && pendingRoadmap.id === id) {
    updateRoadmapSaveUI(id);
  }
}

function closeDeleteConfirmModal(overlay) {
  overlay.remove();
  document.body.classList.remove('overflow-hidden');
}

function showDeleteConfirmModal(roadmapId) {
  const overlay = document.createElement('div');
  overlay.className =
    'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'delete-confirm-message');

  overlay.innerHTML = `
    <div
      class="relative flex w-full max-w-md flex-col items-center gap-4 border-4 border-black bg-white p-8 text-center"
      style="box-shadow: 6px 6px 0 #000"
    >
      <p id="delete-confirm-message" class="pt-2 text-base font-bold text-black md:text-lg">
        ⚠️ Are you sure you want to delete this roadmap?
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button type="button" class="delete-confirm-yes btn-brutal-outline border-[3px] border-black bg-white text-sm font-bold py-2 px-4 text-red-600"
                style="box-shadow: 4px 4px 0 #000">Delete</button>
        <button type="button" class="delete-confirm-cancel btn-brutal-primary text-sm py-2 px-4">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add('overflow-hidden');

  overlay.querySelector('.delete-confirm-yes').addEventListener('click', () => {
    deleteSavedRoadmap(roadmapId);
    closeDeleteConfirmModal(overlay);
  });

  overlay.querySelector('.delete-confirm-cancel').addEventListener('click', () => {
    closeDeleteConfirmModal(overlay);
  });
}

function migrateLegacyRoadmap() {
  const legacy = loadFromStorage(STORAGE_KEYS.ROADMAP, null);
  if (!legacy) return;

  const alreadyMigrated = savedRoadmaps.some(
    (r) => r.title === legacy.title && r.steps.length === legacy.steps.length
  );
  if (!alreadyMigrated) {
    savedRoadmaps.unshift({
      id: Date.now(),
      title: legacy.title,
      steps: legacy.steps,
      goalInput: '',
      savedAt: Date.now(),
    });
    saveToStorage(STORAGE_KEYS.SAVED_ROADMAPS, savedRoadmaps);
  }
  localStorage.removeItem(STORAGE_KEYS.ROADMAP);
}

function showHeroValidationAlert() {
  heroValidationAlert.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  heroValidationOk.focus();
}

function hideHeroValidationAlert() {
  heroValidationAlert.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function handleGenerateRoadmap() {
  const input = heroInput.value.trim();
  if (!input) {
    showHeroValidationAlert();
    return;
  }

  hideHeroValidationAlert();

  const originalText = generateBtn.textContent;
  generateBtn.textContent = 'Generating…';
  generateBtn.disabled = true;
  generateBtn.classList.add('opacity-75', 'cursor-not-allowed');

  setTimeout(() => {
    const roadmap = generateRoadmap(input);
    if (roadmap) {
      pendingRoadmap = {
        id: Date.now(),
        title: roadmap.title,
        steps: roadmap.steps,
        goalInput: input,
      };
      renderRoadmap(pendingRoadmap);
      roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    generateBtn.textContent = originalText;
    generateBtn.disabled = false;
    generateBtn.classList.remove('opacity-75', 'cursor-not-allowed');
  }, 800);
}

function renderTasks() {
  taskList.innerHTML = '';
  emptyTasks.classList.toggle('hidden', tasks.length > 0);

  tasks.forEach((task) => {
    const card = document.createElement('article');
    card.className =
      'flex items-center justify-between gap-3 border-4 border-black bg-white p-4 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:gap-4 sm:p-5 shadow-brutal-lg';
    card.dataset.id = task.id;

    const titleClass = task.completed
      ? 'font-bold line-through text-gray-400'
      : 'font-bold text-black';

    card.innerHTML = `
      <div class="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <input
          type="checkbox"
          class="task-checkbox h-5 w-5 shrink-0 cursor-pointer border-4 border-black bg-white appearance-none checked:bg-accent-green"
          style="box-shadow: 2px 2px 0 #000"
          ${task.completed ? 'checked' : ''}
          aria-label="Mark task complete"
        />
        <div class="min-w-0 flex-1">
          <p class="task-title ${titleClass} break-words">${escapeHtml(getTaskTitle(task))}</p>
          <p class="mt-1 text-xs font-medium text-gray-500">${escapeHtml(formatTaskDateTime(task.createdAt))}</p>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="task-edit-btn flex h-9 w-9 items-center justify-center border-[3px] border-black bg-white text-base transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          style="box-shadow: 3px 3px 0 #000"
          aria-label="Edit task"
        >✏️</button>
        <button
          type="button"
          class="task-delete-btn flex h-9 w-9 items-center justify-center border-[3px] border-black bg-white text-base transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          style="box-shadow: 3px 3px 0 #000"
          aria-label="Delete task"
        >🗑️</button>
      </div>
    `;

    card.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
    card.querySelector('.task-edit-btn').addEventListener('click', () => editTask(task.id));
    card.querySelector('.task-delete-btn').addEventListener('click', () => showTaskDeleteConfirmModal(task.id));

    taskList.appendChild(card);
  });

  updateProgress();
}

function addTask() {
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }

  const now = Date.now();
  tasks.push({ id: now, title, createdAt: now, completed: false });
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
  taskInput.value = '';
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
}

function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const updated = window.prompt('Edit your task:', getTaskTitle(task));
  if (updated === null) return;

  const title = updated.trim();
  if (!title) {
    taskInput.focus();
    return;
  }

  tasks = tasks.map((t) => (t.id === id ? { ...t, title } : t));
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
}

function showTaskDeleteConfirmModal(taskId) {
  const overlay = document.createElement('div');
  overlay.className =
    'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'task-delete-confirm-message');

  overlay.innerHTML = `
    <div
      class="relative flex w-full max-w-md flex-col items-center gap-4 border-4 border-black bg-white p-8 text-center"
      style="box-shadow: 6px 6px 0 #000"
    >
      <p id="task-delete-confirm-message" class="pt-2 text-base font-bold text-black md:text-lg">
        ⚠️ Are you sure you want to delete this task?
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button type="button" class="task-delete-confirm-yes btn-brutal-outline border-[3px] border-black bg-white text-sm font-bold py-2 px-4 text-red-600"
                style="box-shadow: 4px 4px 0 #000">Delete</button>
        <button type="button" class="task-delete-confirm-cancel btn-brutal-primary text-sm py-2 px-4">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add('overflow-hidden');

  overlay.querySelector('.task-delete-confirm-yes').addEventListener('click', () => {
    deleteTask(taskId);
    closeDeleteConfirmModal(overlay);
  });

  overlay.querySelector('.task-delete-confirm-cancel').addEventListener('click', () => {
    closeDeleteConfirmModal(overlay);
  });
}

function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  statTotal.textContent = total;
  statCompleted.textContent = completed;
  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
}

function chatbotReply(input) {
  return findChatReply(input);
}

function appendChatMessage(text, isUser) {
  const bubble = document.createElement('div');
  bubble.className = isUser
    ? 'border-[3px] border-black bg-accent-blue p-4 text-white ml-8'
    : 'border-[3px] border-black bg-offwhite p-4 mr-8';

  const label = isUser ? 'You' : 'Study Buddy';
  bubble.innerHTML = `
    <p class="text-xs font-bold uppercase mb-1 ${isUser ? 'text-blue-200' : 'text-gray-500'}">${label}</p>
    <p>${escapeHtml(text)}</p>
  `;

  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatSend() {
  const text = chatInput.value.trim();
  if (!text) {
    chatInput.focus();
    return;
  }

  appendChatMessage(text, true);
  chatInput.value = '';

  setTimeout(() => {
    const reply = chatbotReply(text);
    appendChatMessage(reply, false);
  }, 400);
}

function initNavScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#hero-input') {
        e.preventDefault();
        heroInput.focus();
        heroInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function init() {
  migrateLegacyRoadmap();
  renderTasks();
  renderSavedRoadmaps();

  generateBtn.addEventListener('click', handleGenerateRoadmap);
  saveRoadmapBtn.addEventListener('click', savePendingRoadmap);
  heroValidationOk.addEventListener('click', hideHeroValidationAlert);
  heroValidationClose.addEventListener('click', hideHeroValidationAlert);
  heroInput.addEventListener('input', hideHeroValidationAlert);
  heroInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGenerateRoadmap();
  });

  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });

  chatSendBtn.addEventListener('click', handleChatSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleChatSend();
  });

  initNavScroll();
}

document.addEventListener('DOMContentLoaded', init);
