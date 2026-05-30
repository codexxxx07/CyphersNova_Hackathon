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
let editingTaskId = null;
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

const ROADMAP_LOADING_MESSAGES = [
  'Analyzing your goal...',
  'Identifying required skills...',
  'Building your learning path...',
  'Preparing roadmap...',
];

let roadmapLoadingTimers = [];
let roadmapLoadingActive = false;

function clearRoadmapLoadingTimers() {
  roadmapLoadingTimers.forEach((id) => {
    clearTimeout(id);
    clearInterval(id);
  });
  roadmapLoadingTimers = [];
}

function stopRoadmapLoading() {
  roadmapLoadingActive = false;
  clearRoadmapLoadingTimers();
}

function roadmapLoadingDelay() {
  return 700 + Math.floor(Math.random() * 501);
}

function showRoadmapLoadingState(message) {
  roadmapSection.classList.remove('hidden');
  roadmapActions.classList.add('hidden');
  roadmapCards.innerHTML = '';

  const loader = document.createElement('div');
  loader.className = 'card-brutal';
  loader.innerHTML = `
    <p id="roadmap-loading-text" class="font-medium text-gray-700" style="opacity: 1; transition: opacity 0.25s ease">${escapeHtml(message)}</p>
  `;
  roadmapCards.appendChild(loader);
}

function setRoadmapLoadingMessage(message) {
  const el = document.getElementById('roadmap-loading-text');
  if (!el || !roadmapLoadingActive) return;

  el.style.opacity = '0';
  const fadeInId = setTimeout(() => {
    if (!roadmapLoadingActive) return;
    const current = document.getElementById('roadmap-loading-text');
    if (!current) return;
    current.textContent = message;
    current.style.opacity = '1';
  }, 250);
  roadmapLoadingTimers.push(fadeInId);
}

function scheduleRoadmapLoadingTimer(callback, delay) {
  const id = setTimeout(callback, delay);
  roadmapLoadingTimers.push(id);
  return id;
}

function renderRoadmap(data, { fromSaved = false } = {}) {
  if (!data) return;

  stopRoadmapLoading();

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
  heroValidationAlert.classList.add('flex');
  document.body.classList.add('overflow-hidden');
  heroValidationOk.focus();
}

function hideHeroValidationAlert() {
  heroValidationAlert.classList.add('hidden');
  heroValidationAlert.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
}

function resetGenerateButton(originalText) {
  generateBtn.textContent = originalText;
  generateBtn.disabled = false;
  generateBtn.classList.remove('opacity-75', 'cursor-not-allowed');
}

function handleGenerateRoadmap() {
  const input = heroInput.value.trim();
  if (!input) {
    showHeroValidationAlert();
    return;
  }

  hideHeroValidationAlert();

  stopRoadmapLoading();

  const originalText = generateBtn.textContent;
  generateBtn.textContent = 'Generating…';
  generateBtn.disabled = true;
  generateBtn.classList.add('opacity-75', 'cursor-not-allowed');

  roadmapLoadingActive = true;
  let messageIndex = 0;
  let messagesShown = 1;
  let roadmapData = null;
  let finished = false;

  showRoadmapLoadingState(ROADMAP_LOADING_MESSAGES[0]);
  roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const tryCompleteLoading = () => {
    if (finished || !roadmapLoadingActive) return;
    if (!roadmapData || messagesShown < 2) return;

    finished = true;
    stopRoadmapLoading();

    pendingRoadmap = roadmapData;
    renderRoadmap(pendingRoadmap);
    roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    resetGenerateButton(originalText);
  };

  const advanceLoadingMessage = () => {
    if (!roadmapLoadingActive || finished) return;

    messageIndex += 1;
    if (messageIndex >= ROADMAP_LOADING_MESSAGES.length) {
      tryCompleteLoading();
      return;
    }

    setRoadmapLoadingMessage(ROADMAP_LOADING_MESSAGES[messageIndex]);
    messagesShown += 1;
    tryCompleteLoading();

    scheduleRoadmapLoadingTimer(advanceLoadingMessage, roadmapLoadingDelay());
  };

  scheduleRoadmapLoadingTimer(advanceLoadingMessage, roadmapLoadingDelay());

  scheduleRoadmapLoadingTimer(() => {
    if (!roadmapLoadingActive || finished) return;

    const roadmap = generateRoadmap(input);
    if (roadmap) {
      roadmapData = {
        id: Date.now(),
        title: roadmap.title,
        steps: roadmap.steps,
        goalInput: input,
      };
      tryCompleteLoading();
      return;
    }

    finished = true;
    stopRoadmapLoading();
    roadmapCards.innerHTML = '';
    resetGenerateButton(originalText);
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

    const isEditing = editingTaskId === task.id;

    if (isEditing) {
      card.innerHTML = `
        <div class="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3">
          <input
            type="text"
            class="task-edit-input w-full border-4 border-black bg-white px-3 py-2 font-bold text-black outline-none"
            style="box-shadow: 4px 4px 0 #000"
            value="${escapeHtml(getTaskTitle(task))}"
            aria-label="Edit task title"
            autocomplete="off"
          />
          <p class="text-xs font-medium text-gray-500">${escapeHtml(formatTaskDateTime(task.createdAt))}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="task-save-btn flex h-9 w-9 items-center justify-center border-[3px] border-black bg-accent-green text-base transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
            style="box-shadow: 3px 3px 0 #000"
            aria-label="Save task"
          >✅</button>
          <button
            type="button"
            class="task-cancel-btn flex h-9 w-9 items-center justify-center border-[3px] border-black bg-white text-base transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
            style="box-shadow: 3px 3px 0 #000"
            aria-label="Cancel edit"
          >❌</button>
        </div>
      `;

      const editInput = card.querySelector('.task-edit-input');
      card.querySelector('.task-save-btn').addEventListener('click', () => saveTaskEdit(task.id, editInput.value));
      card.querySelector('.task-cancel-btn').addEventListener('click', () => cancelTaskEdit());
      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveTaskEdit(task.id, editInput.value);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelTaskEdit();
        }
      });
    } else {
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
      card.querySelector('.task-edit-btn').addEventListener('click', () => startTaskEdit(task.id));
      card.querySelector('.task-delete-btn').addEventListener('click', () => showTaskDeleteConfirmModal(task.id));
    }

    taskList.appendChild(card);
  });

  if (editingTaskId !== null) {
    const editInput = taskList.querySelector(`[data-id="${editingTaskId}"] .task-edit-input`);
    if (editInput) {
      editInput.focus();
      editInput.select();
    }
  }

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

function startTaskEdit(id) {
  if (!tasks.some((t) => t.id === id)) return;
  editingTaskId = id;
  renderTasks();
}

function saveTaskEdit(id, rawTitle) {
  const title = rawTitle.trim();
  if (!title) {
    const editInput = taskList.querySelector(`[data-id="${id}"] .task-edit-input`);
    editInput?.focus();
    return;
  }

  tasks = tasks.map((t) => (t.id === id ? { ...t, title } : t));
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
  editingTaskId = null;
  renderTasks();
}

function cancelTaskEdit() {
  editingTaskId = null;
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
