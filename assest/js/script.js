function toggleMenu() {
  const navLinks = document.getElementById("navLinks");
  navLinks.classList.toggle("show");
}


// ----- Local Storage State -----
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let flashcards = JSON.parse(localStorage.getItem("flashcards")) || [];
let notes = localStorage.getItem("notes") || "";
let pomodoroTime = 25 * 60;
let timerInterval;
let isRunning = false;
let notesLocked = true;
let notesPassword = "";


// ----- Task Management -----
function addTask() {
  const task = document.getElementById("taskInput").value;
  const dueDate = document.getElementById("dueDate").value;
  const subject = document.getElementById("subjectSelect").value;

  if (task && dueDate && subject) {
    tasks.push({ task, dueDate, subject, completed: false });
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    updateCalendar();
    updateChart();
  }
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  tasks.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = t.completed ? "completed-task" : "";
    li.innerHTML = `
      <input type="checkbox" onchange="toggleComplete(${i})" ${t.completed ? "checked" : ""} />
      <div>
        <strong>${t.task}</strong><br/>
        Subject: ${t.subject} | Due: ${t.dueDate}
      </div>
      <button onclick="deleteTask(${i})">Delete</button>
    `;
    taskList.appendChild(li);
  });
}

function deleteTask(index) {
  tasks.splice(index, 1);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
  updateCalendar();
  updateChart();
}

function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

// ----- Calendar View -----
function updateCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "Tasks:<br/>";
  tasks.forEach(t => {
    const p = document.createElement("p");
    p.textContent = `${t.dueDate}: ${t.task} (${t.subject})`;
    calendar.appendChild(p);
  });
}

// ----- Pomodoro Timer -----
function updateTimerDisplay() {
  const min = Math.floor(pomodoroTime / 60);
  const sec = pomodoroTime % 60;
  document.getElementById("timer").textContent =
    `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function startTimer() {
  if (!isRunning) {
    isRunning = true;
    document.getElementById("status").textContent = "Focus Time!";
    timerInterval = setInterval(() => {
      pomodoroTime--;
      updateTimerDisplay();
      if (pomodoroTime <= 0) {
        clearInterval(timerInterval);
        document.getElementById("status").textContent = "Take a break!";
        isRunning = false;
      }
    }, 1000);
  }
}

function pauseTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  document.getElementById("status").textContent = "Paused";
}

function resetTimer() {
  clearInterval(timerInterval);
  pomodoroTime = 25 * 60;
  updateTimerDisplay();
  isRunning = false;
  document.getElementById("status").textContent = "Ready to focus!";
}

// ----- Flashcards -----
function addFlashcard() {
  const q = document.getElementById("question").value;
  const a = document.getElementById("answer").value;
  if (q && a) {
    flashcards.push({ q, a });
    localStorage.setItem("flashcards", JSON.stringify(flashcards));
    renderFlashcards();
  }
}

function renderFlashcards() {
  const container = document.getElementById("flashcardList");
  container.innerHTML = "";
  flashcards.forEach(card => {
    const div = document.createElement("div");
    div.className = "flashcard";
    div.innerHTML = `
      <strong>Q:</strong> ${card.q}<br/>
      <strong>A:</strong> ${card.a}
    `;
    container.appendChild(div);
  });
}

// ----- Notes -----
function saveNotes() {
  if (notesLocked) {
    alert("Unlock notes before saving!");
    return;
  }
  const text = document.getElementById("notes").value;
  localStorage.setItem("notes", text);
  alert("Notes saved!");
}

function loadNotes() {
  const saved = localStorage.getItem("notes") || "";
  document.getElementById("notes").value = saved;
  document.getElementById("notes").disabled = true;
}

function toggleNotesLock() {
  const inputPwd = document.getElementById("notesPassword").value;

  if (notesLocked) {
    const savedPwd = localStorage.getItem("notesPassword");
    
    if (!savedPwd) {
      if (inputPwd.trim() === "") {
        alert("Please set a password to lock your notes.");
        return;
      }
      notesPassword = inputPwd;
      localStorage.setItem("notesPassword", notesPassword);
      notesLocked = false;
      document.getElementById("notes").disabled = false;
      alert("Password set and notes unlocked.");
    } else {
      if (inputPwd === savedPwd) {
        notesLocked = false;
        document.getElementById("notes").disabled = false;
        alert("Notes unlocked.");
      } else {
        alert("Incorrect password!");
      }
    }
  } else {
    notesLocked = true;
    document.getElementById("notes").disabled = true;
    alert("Notes locked.");
  }

  document.getElementById("notesPassword").value = "";
}


// ----- Progress Chart -----
function updateChart() {
  const subjects = {};
  tasks.forEach(t => {
    subjects[t.subject] = (subjects[t.subject] || 0) + 1;
  });

  const ctx = document.getElementById("progressChart").getContext("2d");
  if (window.studyChart) window.studyChart.destroy();
  window.studyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(subjects),
      datasets: [{
        label: "Tasks per Subject",
        data: Object.values(subjects),
        backgroundColor: "#007bff"
      }]
    }
  });
}

// ----- Notifications -----
function checkNotifications() {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  let dueToday = tasks.filter(t => t.dueDate === today && !t.completed);
  let dueTomorrow = tasks.filter(t => t.dueDate === tomorrow && !t.completed);

  if (dueToday.length > 0) {
    alert(`📌 You have ${dueToday.length} task(s) due TODAY!`);
  }
  if (dueTomorrow.length > 0) {
    alert(`📌 You have ${dueTomorrow.length} task(s) due TOMORROW!`);
  }
}

// ----- Dark Mode -----
document.getElementById("toggleDark").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// ----- Export Tasks -----
function exportTasks() {
  const dataStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks.json";
  a.click();

  URL.revokeObjectURL(url);
}

// ----- Import Tasks -----
function importTasks(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedTasks = JSON.parse(e.target.result);
      if (Array.isArray(importedTasks)) {
        tasks = importedTasks;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
        updateCalendar();
        updateChart();
        checkNotifications();
        alert("Tasks imported successfully!");
      } else {
        alert("Invalid file format");
      }
    } catch {
      alert("Error reading file");
    }
  };
  reader.readAsText(file);
}

// ----- Init on Load -----
window.onload = () => {
  renderTasks();
  updateCalendar();
  updateTimerDisplay();
  renderFlashcards();
  loadNotes();
  updateChart();
  checkNotifications();
  document.getElementById("notes").disabled = true;
};
