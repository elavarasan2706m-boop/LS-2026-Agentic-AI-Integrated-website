// Grab the key injected securely by Vite from your working .env file
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// DOM Elements
const goalInput = document.getElementById('goal-input');
const generateBtn = document.getElementById('generate-btn');
const loadingState = document.getElementById('loading-state');
const errorMessage = document.getElementById('error-message');
const taskContainer = document.getElementById('task-container');
const taskList = document.getElementById('task-list');

generateBtn.addEventListener('click', handlePlanGeneration);

async function handlePlanGeneration() {
    const goal = goalInput.value.trim();
    if (!goal) return alert('Please enter a goal first!');

    // Reset UI View States
    errorMessage.classList.add('hidden');
    taskContainer.classList.add('hidden');
    loadingState.classList.remove('hidden');
    generateBtn.disabled = true;

    // Use the reliable production v1beta REST endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: `You are an elite, contextual real-world travel and task itinerary scheduler. The user wants to achieve this specific goal: "${goal}".
                
                Generate a highly realistic, chronologically organized schedule containing the actual specific real-world tasks required to execute this exact goal from start to finish.
                
                CRITICAL INSTRUCTIONS:
                1. Use actual logic for time-of-day planning. For example, outdoor activities like visiting a beach or walking tours MUST be scheduled during cooler morning hours (e.g., 6:30 AM) or sunset hours (e.g., 5:30 PM). Never put hot outdoor activities in the afternoon.
                2. Explicitly map meals to normal real-world times (Breakfast at 8:00 AM, Lunch at 1:00 PM, Dinner at 8:30 PM) at specific, famous local matching establishments.
                3. Group the tasks sequentially. If it spans multiple days, clearly mark "Day 1:", "Day 2:" inside the taskName strings.

                Return your response ONLY as a valid JSON array of objects. Do not include markdown formatting, backticks, or introductory text.
                Each object must contain exactly these fields:
                - "timeOfDay": The exact clock time when this task should start (e.g., "08:30 AM", "01:00 PM", "05:30 PM").
                - "taskName": A specific, detailed action step including real location names (e.g., "Day 1: Watch the sunset at Marina Beach and try local sundal stalls").
                - "priority": Must be "high", "medium", or "low".
                - "duration": The duration length of the activity (e.g., "1.5 hours", "45 mins").`
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the generated text from Gemini's structural payload response
        const rawText = data.candidates[0].content.parts[0].text.trim();
        console.log("Raw Gemini Response:", rawText);

        // Find the first '[' and the last ']' to isolate ONLY the clean JSON array structure
        const jsonStart = rawText.indexOf('[');
        const jsonEnd = rawText.lastIndexOf(']') + 1;
        
        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error("The AI didn't return the plan in a clean list format. Please try clicking generate again.");
        }
        
        // Slice out the exact JSON block and parse it safely
        const cleanedJsonString = rawText.substring(jsonStart, jsonEnd);
        const planTasks = JSON.parse(cleanedJsonString);
        
        displayTasks(planTasks);
    } catch (error) {
        console.error("Gemini Execution Error:", error);
        errorMessage.textContent = `Error: ${error.message || "Failed to parse the action plan. Please try clicking generate again."}`;
        errorMessage.classList.remove('hidden');
    } finally {
        loadingState.classList.add('hidden');
        generateBtn.disabled = false;
    }
}

function displayTasks(tasks) {
    taskList.innerHTML = ''; // Clear previous items

    if (!Array.isArray(tasks) || tasks.length === 0) {
        errorMessage.textContent = "The response did not return as a structured list. Please try again.";
        errorMessage.classList.remove('hidden');
        return;
    }

    tasks.forEach((task) => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        
        // Match our updated explicit timing fields safely
        const timeLog = task.timeOfDay || "Flexible";
        const name = task.taskName || task.task || "Unnamed Step";
        const durationLength = task.duration || task.estimatedTime || "N/A";
        const priorityLevel = (task.priority || "medium").toLowerCase();

        taskItem.innerHTML = `
            <div class="task-details">
                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 0.25rem;">
                    <span style="background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.9rem;">
                        ⏰ ${escapeHTML(timeLog)}
                    </span>
                    <h3 style="margin: 0;">${escapeHTML(name)}</h3>
                </div>
                <span class="task-time">⏱ Duration: ${escapeHTML(durationLength)}</span>
            </div>
            <span class="badge ${priorityLevel}">${escapeHTML(priorityLevel)}</span>
        `;
        taskList.appendChild(taskItem);
    });

    taskContainer.classList.remove('hidden');
}

// XSS Protection helper to sanitize strings rendered in the DOM
function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}