let tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
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
      deleteSavedRoadmap(roadmap.id);
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
    const li = document.createElement('li');
    li.className = 'card-brutal flex items-center gap-4';
    li.dataset.id = task.id;

    const labelClass = task.completed
      ? 'flex-1 font-bold line-through text-gray-400'
      : 'flex-1 font-bold';

    li.innerHTML = `
      <input
        type="checkbox"
        class="h-6 w-6 shrink-0 cursor-pointer accent-black border-[3px] border-black"
        ${task.completed ? 'checked' : ''}
        aria-label="Mark task complete"
      />
      <span class="${labelClass}">${escapeHtml(task.text)}</span>
      <button class="btn-brutal-outline shrink-0 px-3 py-1 text-sm" aria-label="Delete task">✕</button>
    `;

    const checkbox = li.querySelector('input[type="checkbox"]');
    const deleteBtn = li.querySelector('button');

    checkbox.addEventListener('change', () => toggleTask(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    taskList.appendChild(li);
  });

  updateProgress();
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  tasks.push({ id: generateId(), text, completed: false });
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

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
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
