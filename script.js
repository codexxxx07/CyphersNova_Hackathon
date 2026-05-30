let tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
let currentRoadmap = loadFromStorage(STORAGE_KEYS.ROADMAP, null);

const heroInput = document.getElementById('hero-input');
const generateBtn = document.getElementById('generate-btn');
const roadmapSection = document.getElementById('roadmap');
const roadmapTitle = document.getElementById('roadmap-title');
const roadmapCards = document.getElementById('roadmap-cards');
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

function renderRoadmap(data) {
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

  roadmapSection.classList.remove('hidden');
}

function handleGenerateRoadmap() {
  const input = heroInput.value;
  if (!input.trim()) {
    heroInput.focus();
    return;
  }

  const originalText = generateBtn.textContent;
  generateBtn.textContent = 'Generating…';
  generateBtn.disabled = true;
  generateBtn.classList.add('opacity-75', 'cursor-not-allowed');

  setTimeout(() => {
    const roadmap = generateRoadmap(input);
    if (roadmap) {
      currentRoadmap = roadmap;
      saveToStorage(STORAGE_KEYS.ROADMAP, roadmap);
      renderRoadmap(roadmap);
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
  renderTasks();

  if (currentRoadmap) {
    renderRoadmap(currentRoadmap);
  }

  generateBtn.addEventListener('click', handleGenerateRoadmap);
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
