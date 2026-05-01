// ===== Task class =====
class Task {
  constructor(title, description, priority, category) {
    this.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    this.title = title.trim();
    this.description = description.trim();
    this.priority = priority;
    this.category = category;
    this.completed = false;
    this.createdAt = Date.now();
  }

  update(fields) {
    Object.assign(this, fields);
  }

  toggle() {
    this.completed = !this.completed;
  }
}

// ===== TaskManager class =====
class TaskManager {
  constructor() {
    this.tasks = [];
    this.load();
  }

  add(title, description, priority, category) {
    const task = new Task(title, description, priority, category);
    this.tasks.unshift(task);
    this.save();
    return task;
  }

  update(id, fields) {
    const task = this.find(id);
    if (task) {
      task.update(fields);
      this.save();
    }
    return task;
  }

  delete(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save();
  }

  toggle(id) {
    const task = this.find(id);
    if (task) {
      task.toggle();
      this.save();
    }
    return task;
  }

  find(id) {
    return this.tasks.find(t => t.id === id);
  }

  filter(category, search, sort) {
    let result = this.tasks.slice();

    if (category !== 'All') {
      result = result.filter(t => t.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    if (sort === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      result.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (sort === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt);
    }

    result.sort((a, b) => Number(a.completed) - Number(b.completed));

    return result;
  }

  save() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  load() {
    const data = localStorage.getItem('tasks');
    if (data) {
      this.tasks = JSON.parse(data).map(obj =>
        Object.assign(new Task('x', '', 'low', 'Personal'), obj)
      );
    }
  }
}

// ===== App =====
const manager = new TaskManager();
let editingId = null;
let activeCategory = 'All';

const $ = id => document.getElementById(id);

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  $('toasts').appendChild(el);
  setTimeout(() => {
    el.classList.add('exit');
    setTimeout(() => el.remove(), 200);
  }, 3000);
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function validate(title) {
  if (!title.trim()) {
    $('titleError').textContent = 'Title is required';
    return false;
  }
  $('titleError').textContent = '';
  return true;
}

$('taskForm').addEventListener('submit', e => {
  e.preventDefault();
  const title = $('title').value;
  const description = $('description').value;
  const priority = $('priority').value;
  const category = $('category').value;

  if (!validate(title)) return;

  if (editingId) {
    const task = manager.update(editingId, {
      title: title.trim(),
      description: description.trim(),
      priority,
      category
    });
    toast(`Updated: ${task.title}`);
    if (priority === 'high') toast('High priority task updated!');
    cancelEdit();
  } else {
    const task = manager.add(title, description, priority, category);
    toast(`Added: ${task.title}`);
    if (priority === 'high') toast('High priority task added!');
    $('taskForm').reset();
    $('priority').value = 'medium';
  }

  render();
});

$('cancelBtn').addEventListener('click', cancelEdit);

function cancelEdit() {
  editingId = null;
  $('taskForm').reset();
  $('priority').value = 'medium';
  $('titleError').textContent = '';
  $('submitBtn').textContent = 'Add Task';
  $('cancelBtn').style.display = 'none';
}

function editTask(id) {
  const task = manager.find(id);
  if (!task) return;
  editingId = id;
  $('title').value = task.title;
  $('description').value = task.description;
  $('priority').value = task.priority;
  $('category').value = task.category;
  $('submitBtn').textContent = 'Save Changes';
  $('cancelBtn').style.display = 'inline-block';
  $('title').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteTask(id) {
  const task = manager.find(id);
  if (!task) return;
  if (!confirm(`Delete "${task.title}"?`)) return;
  manager.delete(id);
  if (editingId === id) cancelEdit();
  toast('Task deleted');
  render();
}

function toggleTask(id) {
  const task = manager.toggle(id);
  if (task && task.completed && task.priority === 'high') {
    toast(`High priority task completed: ${task.title}`);
  }
  render();
}

$('search').addEventListener('input', render);
$('sort').addEventListener('change', render);

$('themeBtn').addEventListener('click', () => {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  $('themeBtn').textContent = next === 'dark' ? 'Light' : 'Dark';
  localStorage.setItem('theme', next);
});

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.dataset.theme = savedTheme;
$('themeBtn').textContent = savedTheme === 'dark' ? 'Light' : 'Dark';

function setCategory(cat) {
  activeCategory = cat;
  render();
}

function render() {
  const cats = ['All', 'Personal', 'Work', 'Urgent'];
  $('filters').innerHTML = cats.map(c =>
    `<button class="filter-btn ${c === activeCategory ? 'active' : ''}" onclick="setCategory('${c}')">${c}</button>`
  ).join('');

  const tasks = manager.filter(activeCategory, $('search').value, $('sort').value);
  const all = manager.tasks;
  const open = all.filter(t => !t.completed).length;

  $('stats').textContent = `${tasks.length} shown · ${open} open · ${all.length - open} done`;

  if (tasks.length === 0) {
    $('tasks').innerHTML = `<div class="empty">${all.length === 0 ? 'No tasks yet. Add one above!' : 'No tasks match your filters.'}</div>`;
    return;
  }

  $('tasks').innerHTML = tasks.map(t => `
    <div class="task ${t.completed ? 'done' : ''}">
      <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask('${t.id}')">
      <div class="task-content">
        <div class="task-meta">
          <span class="badge ${t.priority}">${t.priority}</span>
          <span class="badge cat">${esc(t.category)}</span>
        </div>
        <div class="title">${esc(t.title)}</div>
        ${t.description ? `<div class="desc">${esc(t.description)}</div>` : ''}
      </div>
      <div class="task-actions">
        <button class="icon-btn" onclick="editTask('${t.id}')">Edit</button>
        <button class="icon-btn danger" onclick="deleteTask('${t.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

render();
