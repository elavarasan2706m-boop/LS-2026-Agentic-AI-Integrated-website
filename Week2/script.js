const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const notification = document.getElementById("notification");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function showNotification(message, type) {
    notification.textContent = message;
    notification.className = type;

    setTimeout(() => {
        notification.textContent = "";
        notification.className = "";
    }, 2500);
}

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.classList.add("task");

        li.innerHTML = `
            <span>${task}</span>
            <div class="actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        // Edit Task
        li.querySelector(".edit-btn").addEventListener("click", () => {
            const updatedTask = prompt("Edit Task", task);

            if (updatedTask === null) return;

            if (updatedTask.trim() === "") {
                showNotification("Task cannot be empty!", "error");
                return;
            }

            tasks[index] = updatedTask.trim();
            saveTasks();
            renderTasks();

            showNotification("Task updated successfully!", "success");
        });

        // Delete Task
        li.querySelector(".delete-btn").addEventListener("click", () => {
            tasks.splice(index, 1);

            saveTasks();
            renderTasks();

            showNotification("Task deleted successfully!", "success");
        });

        taskList.appendChild(li);
    });
}

function addTask() {
    const task = taskInput.value.trim();

    if (task === "") {
        showNotification("Please enter a task!", "error");
        return;
    }

    tasks.push(task);

    saveTasks();
    renderTasks();

    taskInput.value = "";

    showNotification("Task added successfully!", "success");
}

addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        addTask();
    }
});

renderTasks();