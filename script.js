import { supabase } from './src/supabase.js';

let currentUser = null;
let tasks = [];

// Auth functions
async function login() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        currentUser = data.user;
        showApp();
        await loadTasks();
    } catch (error) {
        alert('Error logging in: ' + error.message);
    }
}

async function register() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        alert('Registration successful! You can now login.');
    } catch (error) {
        alert('Error registering: ' + error.message);
    }
}

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        tasks = [];
        showAuth();
    } catch (error) {
        alert('Error logging out: ' + error.message);
    }
}

function showAuth() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userEmail').textContent = currentUser.email;
}

// Task functions
async function loadTasks() {
    try {
        // Load tasks from Supabase
        const { data: supaTasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        tasks = supaTasks;

        // Set up local reminders for tasks
        tasks.forEach(task => {
            if (task.reminder && task.reminder_date) {
                const timeUntilReminder = new Date(task.reminder_date) - new Date();
                if (timeUntilReminder > 0) {
                    setTimeout(() => {
                        showNotification(task.text);
                    }, timeUntilReminder);
                }
            }
        });

        renderTasks();
    } catch (error) {
        alert('Error loading tasks: ' + error.message);
    }
}

async function addTask() {
    const taskInput = document.getElementById("taskInput");
    const taskPriority = document.getElementById("taskPriority");
    const dueDate = document.getElementById("dueDate");
    const category = document.getElementById("category");
    const reminderEmail = document.getElementById("reminderEmail");
    const reminderDate = document.getElementById("reminderDate");

    if (taskInput.value.trim() === "") {
        alert("Please enter a task!");
        return;
    }

    const task = {
        user_id: currentUser.id,
        text: taskInput.value,
        priority: taskPriority.value,
        due_date: dueDate.value,
        category: category.value,
        completed: false,
        created_at: new Date().toISOString(),
        reminder: reminderEmail.checked,
        reminder_date: reminderEmail.checked ? new Date(reminderDate.value).toISOString() : null
    };

    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([task])
            .select();

        if (error) throw error;

        const newTask = data[0];
        tasks.unshift(newTask);
        
        if (task.reminder) {
            const timeUntilReminder = new Date(task.reminder_date) - new Date();
            if (timeUntilReminder > 0) {
                setTimeout(() => {
                    showNotification(task.text);
                }, timeUntilReminder);
                
                // Calculate time remaining
                const hours = Math.floor(timeUntilReminder / (1000 * 60 * 60));
                const minutes = Math.floor((timeUntilReminder % (1000 * 60 * 60)) / (1000 * 60));
                alert(`Reminder set! Will notify you in ${hours} hours and ${minutes} minutes`);
            }
        }

        renderTasks();
        resetForm();
    } catch (error) {
        alert('Error adding task: ' + error.message);
    }
}

async function deleteTask(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id)
                .eq('user_id', currentUser.id);

            if (error) throw error;

            tasks = tasks.filter(task => task.id !== id);
            renderTasks();
        } catch (error) {
            alert('Error deleting task: ' + error.message);
        }
    }
}

function showNotification(taskText) {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications");
        return;
    }

    if (Notification.permission === "granted") {
        new Notification("Task Reminder", {
            body: taskText,
            icon: "https://cdn-icons-png.flaticon.com/512/1584/1584831.png"
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Task Reminder", {
                    body: taskText,
                    icon: "https://cdn-icons-png.flaticon.com/512/1584/1584831.png"
                });
            }
        });
    }
}

function toggleReminderDate() {
    const reminderDate = document.getElementById('reminderDate');
    const reminderEmail = document.getElementById('reminderEmail');
    reminderDate.disabled = !reminderEmail.checked;
    
    if (reminderEmail.checked && !reminderDate.value) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 30); // Set default to 30 minutes from now
        reminderDate.value = now.toISOString().slice(0, 16);
    }
}

function sortTasks(criteria) {
    let sortedTasks = [...tasks];
    switch (criteria) {
        case "date-asc":
            sortedTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
            break;
        case "date-desc":
            sortedTasks.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
            break;
        case "priority":
            const priorityOrder = { High: 1, Medium: 2, Low: 3 };
            sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
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

        let reminderStatus = '';
        if (task.reminder && task.reminder_date) {
            const timeUntilReminder = new Date(task.reminder_date) - new Date();
            if (timeUntilReminder > 0) {
                const hours = Math.floor(timeUntilReminder / (1000 * 60 * 60));
                const minutes = Math.floor((timeUntilReminder % (1000 * 60 * 60)) / (1000 * 60));
                reminderStatus = `<span class="reminder-badge">⏰ Reminder in ${hours}h ${minutes}m</span>`;
            }
        }

        taskElement.innerHTML = `
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                <span class="task-date">${task.due_date}</span>
                <span class="task-category">${task.category}</span>
                ${reminderStatus}
            </div>
            <div class="task-actions">
                <button onclick="deleteTask('${task.id}')" class="delete-btn">🗑</button>
            </div>
        `;

        taskListElement.appendChild(taskElement);
    });

    updateTaskStats();
}

function updateTaskStats() {
    const stats = document.getElementById("taskStats");
    const total = tasks.length;
    const withReminders = tasks.filter(task => task.reminder).length;
    stats.innerHTML = `
        <div class="stat">Total Tasks: ${total}</div>
        <div class="stat">With Reminders: ${withReminders}</div>
    `;
}

function resetForm() {
    document.getElementById("taskInput").value = "";
    document.getElementById("taskPriority").value = "Low";
    document.getElementById("dueDate").value = "";
    document.getElementById("category").value = "personal";
    document.getElementById("reminderEmail").checked = false;
    document.getElementById("reminderDate").disabled = true;
    document.getElementById("reminderDate").value = "";
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
}

// Request notification permission on page load
if ("Notification" in window) {
    Notification.requestPermission();
}

// Check auth state on load
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
        showApp();
        loadTasks();
    } else {
        showAuth();
    }
});

// Expose functions to window object for HTML onclick handlers
window.addTask = addTask;
window.deleteTask = deleteTask;
window.sortTasks = sortTasks;
window.toggleTheme = toggleTheme;
window.toggleReminderDate = toggleReminderDate;
window.login = login;
window.register = register;
window.logout = logout;