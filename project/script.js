let tasks = JSON.parse(localStorage.getItem("taskManager") || "[]");

function addTask() {
  const taskInput = document.getElementById("taskInput");
  const taskPriority = document.getElementById("taskPriority");
  const dueDate = document.getElementById("dueDate");
  const category = document.getElementById("category");

  if (taskInput.value.trim() === "") {
    showNotification("Please enter a task!", "error");
    return;
  }

  const task = {
    id: Date.now(),
    text: taskInput.value,
    priority: taskPriority.value,
    dueDate: dueDate.value,
    category: category.value,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  saveAndRender();
  resetForm();
}

function saveAndRender() {
  localStorage.setItem("taskManager", JSON.stringify(tasks));
  renderTasks();
}

function searchTasks() {
  const searchInput = document.getElementById("searchInput");
  const searchTerm = searchInput.value.toLowerCase();
  const filteredTasks = tasks.filter(
    (task) =>
      task.text.toLowerCase().includes(searchTerm) ||
      task.category.toLowerCase().includes(searchTerm)
  );
  renderTasks(filteredTasks);
}

function sortTasks(criteria) {
  let sortedTasks = [...tasks];
  switch (criteria) {
    case "date-asc":
      sortedTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      break;
    case "date-desc":
      sortedTasks.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
      break;
    case "priority":
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      sortedTasks.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
      break;
  }
  renderTasks(sortedTasks);
}

function renderTasks(taskList = tasks) {
  const taskListElement = document.getElementById("taskList");
  taskListElement.innerHTML = "";

  taskList.forEach((task) => {
    const taskElement = document.createElement("div");
    taskElement.className = "task-item";

    taskElement.innerHTML = `
      <div class="task-content">
        <span class="task-text">${task.text}</span>
        <span class="priority-badge priority-${task.priority.toLowerCase()}">${
      task.priority
    }</span>
        <span class="task-date">${task.dueDate}</span>
        <span class="task-category">${task.category}</span>
      </div>
      <div class="task-actions">
        <button onclick="deleteTask(${task.id})" class="delete-btn">🗑</button>
      </div>
    `;

    taskListElement.appendChild(taskElement);
  });

  updateTaskStats();
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB");
}

function updateTaskStats() {
  const stats = document.getElementById("taskStats");
  const total = tasks.length;
  stats.innerHTML = `<div class="stat">Total Tasks: ${total}</div>`;
}

function clearTasks() {
  let taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
}

function resetForm() {
  document.getElementById("taskInput").value = "";
  document.getElementById("taskPriority").value = "low";
  document.getElementById("dueDate").value = "";
  document.getElementById("category").value = "personal";
}

function deleteTask(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks = tasks.filter((task) => task.id !== id);
    localStorage.setItem("taskManager", JSON.stringify(tasks));
    renderTasks();
    showNotification("Task deleted successfully", "success");
  }
}

const styleSheet = document.createElement("style");
styleSheet.textContent = `
    .task-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .task-text {
        flex: 1;
    }
    
    .task-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .task-actions button {
        padding: 4px 8px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        background: var(--input-bg);
        color: var(--text-color);
    }
    
    .task-date, .task-category {
        font-size: 0.9rem;
        color: #666;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 8px;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
    }
    
    .notification.success { background: var(--success); color: white; }
    .notification.error { background: var(--danger); color: white; }
    .notification.warning { background: var(--warning); }
`;
document.head.appendChild(styleSheet);
