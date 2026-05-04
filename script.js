// I learned about classes in JavaScript
// A class is like a blueprint to make objects

//--------------------------------
// Task class
//--------------------------------
class Task {

  // constructor runs when we do: new Task(...)
  constructor(title, description, priority, category) {

    // give this task a unique id using the time + random number
    this.id = Date.now() + Math.random().toString().slice(2, 8);

    // save the values that were passed in
    this.title = title;
    this.description = description;
    this.priority = priority;   // "low", "medium", or "high"
    this.category = category;   // "Personal", "Work", or "Urgent"

    // every new task starts as not completed
    this.completed = false;

    // save the time this task was created
    this.createdAt = Date.now();
  }

  // this method updates the task with new values
  update(newTitle, newDescription, newPriority, newCategory) {
    this.title = newTitle;
    this.description = newDescription;
    this.priority = newPriority;
    this.category = newCategory;
  }

  // this method marks the task as done or not done
  toggle() {
    if (this.completed == true) {
      this.completed = false;
    } else {
      this.completed = true;
    }
  }

  // this method checks if the task is high priority
  isHighPriority() {
    if (this.priority == 'high') {
      return true;
    }
    return false;
  }

}


// TaskManager class
// This class stores all tasks and manages them
class TaskManager {

  constructor() {
    // this array will hold all our Task objects
    this.tasks = [];

    // load any tasks that were saved before
    this.loadFromStorage();
  }

  // add a new task to the list
  addTask(title, description, priority, category) {

    // create a new Task object using the Task class
    var newTask = new Task(title, description, priority, category);

    // add it to the beginning of the array
    this.tasks.unshift(newTask);

    // save the updated list
    this.saveToStorage();

    // return the new task so we can use it
    return newTask;
  }

  // find one task by its id
  findTask(id) {
    var foundTask = null;

    for (var i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].id == id) {
        foundTask = this.tasks[i];
      }
    }

    return foundTask;
  }

  // update a task by its id
  updateTask(id, newTitle, newDescription, newPriority, newCategory) {
    var task = this.findTask(id);

    if (task != null) {
      task.update(newTitle, newDescription, newPriority, newCategory);
      this.saveToStorage();
    }

    return task;
  }

  // delete a task by its id
  deleteTask(id) {
    var newList = [];

    for (var i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].id != id) {
        newList.push(this.tasks[i]);
      }
    }

    this.tasks = newList;
    this.saveToStorage();
  }

  // toggle a task complete or not complete
  toggleTask(id) {
    var task = this.findTask(id);

    if (task != null) {
      task.toggle();
      this.saveToStorage();
    }

    return task;
  }

  // count how many tasks are not completed yet
  countOpen() {
    var count = 0;

    for (var i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].completed == false) {
        count = count + 1;
      }
    }

    return count;
  }

  // filter, search, and sort the tasks
  getFilteredTasks(category, search, sort) {

    // step 1: filter by category and search
    var result = [];

    for (var i = 0; i < this.tasks.length; i++) {
      var task = this.tasks[i];
      var shouldAdd = true;

      // check category
      if (category != 'All' && task.category != category) {
        shouldAdd = false;
      }

      // check search
      if (search != '') {
        var searchLower = search.toLowerCase();
        var titleHasWord = task.title.toLowerCase().includes(searchLower);
        var descHasWord = task.description.toLowerCase().includes(searchLower);

        if (titleHasWord == false && descHasWord == false) {
          shouldAdd = false;
        }
      }

      if (shouldAdd == true) {
        result.push(task);
      }
    }

    // step 2: sort the result
    if (sort == 'priority') {
      // high comes first, then medium, then low
      result.sort(function(a, b) {
        var priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    } else if (sort == 'title') {
      result.sort(function(a, b) {
        return a.title.localeCompare(b.title);
      });

    } else {
      // default: newest first
      result.sort(function(a, b) {
        return b.createdAt - a.createdAt;
      });
    }

    // step 3: push completed tasks to the bottom
    result.sort(function(a, b) {
      return a.completed - b.completed;
    });

    return result;
  }

  // save all tasks to localStorage
  saveToStorage() {
    var tasksAsText = JSON.stringify(this.tasks);
    localStorage.setItem('myTasks', tasksAsText);
  }

  // load tasks from localStorage when page opens
  loadFromStorage() {
    var saved = localStorage.getItem('myTasks');

    if (saved != null) {
      var plainObjects = JSON.parse(saved);

      // we need to turn each plain object back into a real Task object
      for (var i = 0; i < plainObjects.length; i++) {
        var obj = plainObjects[i];

        // create a new Task and copy all the saved values into it
        var task = new Task(obj.title, obj.description, obj.priority, obj.category);
        task.id = obj.id;
        task.completed = obj.completed;
        task.createdAt = obj.createdAt;

        this.tasks.push(task);
      }
    }
  }

}

//------------------------------------------------
// Create one TaskManager to use in the whole app
//------------------------------------------------
var manager = new TaskManager();

// these two variables track what the user is doing
var editingId = null;       // null means we are not editing
var activeCategory = 'All'; // which category filter is selected


// Helper functions

// shorter way to get an element by id
function getEl(id) {
  return document.getElementById(id);
}

// show a small popup message at the top right
function showToast(message) {
  var box = document.createElement('div');
  box.className = 'toast';
  box.textContent = message;
  getEl('toasts').appendChild(box);

  // after 3 seconds, fade it out and remove it
  setTimeout(function() {
    box.classList.add('exit');
    setTimeout(function() {
      box.remove();
    }, 200);
  }, 3000);
}

// make text safe to put in HTML (stops code injection)
function safeText(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// check if the title box is empty
function validateForm(title) {
  if (title == '') {
    getEl('titleError').textContent = 'Title is required';
    return false;
  }
  getEl('titleError').textContent = '';
  return true;
}


// When the user submits the form
getEl('taskForm').addEventListener('submit', function(e) {

  // stop the page from refreshing
  e.preventDefault();

  // get what the user typed
  var title = getEl('title').value.trim();
  var description = getEl('description').value.trim();
  var priority = getEl('priority').value;
  var category = getEl('category').value;

  // check if title is empty
  if (validateForm(title) == false) {
    return;
  }

  // check if we are editing or adding
  if (editingId != null) {

    // we are editing an existing task
    var task = manager.updateTask(editingId, title, description, priority, category);
    showToast('Updated: ' + task.title);

    if (task.isHighPriority() == true) {
      showToast('High priority task updated!');
    }

    cancelEdit();

  } else {

    // we are adding a new task
    var task = manager.addTask(title, description, priority, category);
    showToast('Added: ' + task.title);

    if (task.isHighPriority() == true) {
      showToast('High priority task added!');
    }

    // clear the form
    getEl('taskForm').reset();
    getEl('priority').value = 'medium';
  }

  // update the screen
  renderPage();
});


// when user clicks cancel button
getEl('cancelBtn').addEventListener('click', cancelEdit);

function cancelEdit() {
  editingId = null;
  getEl('taskForm').reset();
  getEl('priority').value = 'medium';
  getEl('titleError').textContent = '';
  getEl('submitBtn').textContent = 'Add Task';
  getEl('cancelBtn').style.display = 'none';
}


// Edit, delete, toggle (called from HTML buttons)

function editTask(id) {
  var task = manager.findTask(id);
  if (task == null) return;

  // fill the form with the task's current values
  editingId = id;
  getEl('title').value = task.title;
  getEl('description').value = task.description;
  getEl('priority').value = task.priority;
  getEl('category').value = task.category;

  // change the button text
  getEl('submitBtn').textContent = 'Save Changes';
  getEl('cancelBtn').style.display = 'inline-block';

  // scroll to the top so user can see the form
  getEl('title').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteTask(id) {
  var task = manager.findTask(id);
  if (task == null) return;

  // ask the user if they are sure
  var sure = confirm('Delete "' + task.title + '"?');
  if (sure == false) return;

  manager.deleteTask(id);

  // if we were editing this task, cancel the edit
  if (editingId == id) {
    cancelEdit();
  }

  showToast('Task deleted');
  renderPage();
}

function toggleTask(id) {
  var task = manager.toggleTask(id);

  if (task != null && task.completed == true && task.isHighPriority() == true) {
    showToast('High priority task completed: ' + task.title);
  }

  renderPage();
}



// Search, sort, theme


getEl('search').addEventListener('input', renderPage);
getEl('sort').addEventListener('change', renderPage);

getEl('themeBtn').addEventListener('click', function() {
  var current = document.documentElement.dataset.theme;

  if (current == 'dark') {
    document.documentElement.dataset.theme = 'light';
    getEl('themeBtn').textContent = 'Dark';
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.dataset.theme = 'dark';
    getEl('themeBtn').textContent = 'Light';
    localStorage.setItem('theme', 'dark');
  }
});

// load the saved theme when the page opens
var savedTheme = localStorage.getItem('theme');
if (savedTheme == 'dark') {
  document.documentElement.dataset.theme = 'dark';
  getEl('themeBtn').textContent = 'Light';
} else {
  document.documentElement.dataset.theme = 'light';
  getEl('themeBtn').textContent = 'Dark';
}

// change the active category filter
function setCategory(cat) {
  activeCategory = cat;
  renderPage();
}



// Render the page (show tasks on screen)

function renderPage() {

  // show category buttons
  var categories = ['All', 'Personal', 'Work', 'Urgent'];
  var filterButtons = '';

  for (var i = 0; i < categories.length; i++) {
    var cat = categories[i];
    var isActive = '';

    if (cat == activeCategory) {
      isActive = 'active';
    }

    filterButtons = filterButtons + '<button class="filter-btn ' + isActive + '" onclick="setCategory(\'' + cat + '\')">' + cat + '</button>';
  }

  getEl('filters').innerHTML = filterButtons;

  // get the filtered tasks from the manager
  var searchWord = getEl('search').value;
  var sortType = getEl('sort').value;
  var filteredTasks = manager.getFilteredTasks(activeCategory, searchWord, sortType);

  // show the stats line
  var totalTasks = manager.tasks.length;
  var openTasks = manager.countOpen();
  var doneTasks = totalTasks - openTasks;

  getEl('stats').textContent = filteredTasks.length + ' shown · ' + openTasks + ' open · ' + doneTasks + ' done';

  // if no tasks to show
  if (filteredTasks.length == 0) {
    if (totalTasks == 0) {
      getEl('tasks').innerHTML = '<div class="empty">No tasks yet. Add one above!</div>';
    } else {
      getEl('tasks').innerHTML = '<div class="empty">No tasks match your filters.</div>';
    }
    return;
  }

  // build the HTML for each task
  var allTasksHtml = '';

  for (var i = 0; i < filteredTasks.length; i++) {
    var t = filteredTasks[i];

    var checkedAttr = '';
    if (t.completed == true) {
      checkedAttr = 'checked';
    }

    var doneClass = '';
    if (t.completed == true) {
      doneClass = 'done';
    }

    var descriptionHtml = '';
    if (t.description != '') {
      descriptionHtml = '<div class="desc">' + safeText(t.description) + '</div>';
    }

    var oneTask = '<div class="task ' + doneClass + '">' +
      '<input type="checkbox" ' + checkedAttr + ' onchange="toggleTask(\'' + t.id + '\')">' +
      '<div class="task-content">' +
        '<div class="task-meta">' +
          '<span class="badge ' + t.priority + '">' + t.priority + '</span>' +
          '<span class="badge cat">' + safeText(t.category) + '</span>' +
        '</div>' +
        '<div class="title">' + safeText(t.title) + '</div>' +
        descriptionHtml +
      '</div>' +
      '<div class="task-actions">' +
        '<button class="icon-btn" onclick="editTask(\'' + t.id + '\')">Edit</button>' +
        '<button class="icon-btn danger" onclick="deleteTask(\'' + t.id + '\')">Delete</button>' +
      '</div>' +
    '</div>';

    allTasksHtml = allTasksHtml + oneTask;
  }

  getEl('tasks').innerHTML = allTasksHtml;
}

// run when the page first loads
renderPage();