// Estado Global
const state = {
    activities: [],
    currentQuestionIndex: 0,
    currentTaskIndex: 0,
    questions: [],
    classifications: {},
    answers: {}
};

// Elementos del DOM
const screenActivities = document.getElementById('screen-activities');
const screenQuestions = document.getElementById('screen-questions');
const screenMatrix = document.getElementById('screen-matrix');

const btnContinue = document.getElementById('btn-continue');
const btnNext = document.getElementById('btn-next');
const btnPrevious = document.getElementById('btn-previous');
const btnRestart = document.getElementById('btn-restart');
const btnExport = document.getElementById('btn-export');

const activitiesInput = document.getElementById('activities-input');
const errorMessage = document.getElementById('error-message');
const currentTaskElement = document.getElementById('current-task');
const progressText = document.getElementById('progress-text');
const questionsContainer = document.getElementById('questions-container');

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await loadQuestions();
    setupEventListeners();
});

// Cargar preguntas desde JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        state.questions = data.questions;
    } catch (error) {
        console.error('Error al cargar preguntas:', error);
        // Fallback a preguntas hardcodeadas
        state.questions = [
            {
                "id": 1,
                "question": "¿Esta tarea tiene un plazo inminente o límite de tiempo próximo?",
                "type": "urgency",
                "answers": [
                    { "text": "Sí, tiene un plazo muy próximo o debe hacerse hoy/mañana", "value": true },
                    { "text": "No, el plazo es lejano o flexible", "value": false }
                ]
            },
            {
                "id": 2,
                "question": "¿Si no completas esta tarea, habrá consecuencias negativas inmediatas?",
                "type": "urgency",
                "answers": [
                    { "text": "Sí, causaría problemas inmediatos importantes", "value": true },
                    { "text": "No, las consecuencias son mínimas o a largo plazo", "value": false }
                ]
            },
            {
                "id": 3,
                "question": "¿Esta tarea se alinea con tus objetivos y valores personales/profesionales?",
                "type": "importance",
                "answers": [
                    { "text": "Sí, es fundamental para mis metas", "value": true },
                    { "text": "No, es algo secundario o irrelevante", "value": false }
                ]
            },
            {
                "id": 4,
                "question": "¿Completar esta tarea contribuirá significativamente a tu crecimiento o resultados?",
                "type": "importance",
                "answers": [
                    { "text": "Sí, tendrá un impacto importante", "value": true },
                    { "text": "No, el impacto es mínimo", "value": false }
                ]
            }
        ];
    }
}

// Configurar eventos
function setupEventListeners() {
    btnContinue.addEventListener('click', handleContinueActivities);
    btnNext.addEventListener('click', handleNextQuestion);
    btnPrevious.addEventListener('click', handlePreviousQuestion);
    btnRestart.addEventListener('click', handleRestart);
    btnExport.addEventListener('click', handleExport);
}

// ========== PANTALLA 1: ACTIVIDADES ==========
function handleContinueActivities() {
    const input = activitiesInput.value.trim();
    
    if (!input) {
        showError('Por favor ingresa al menos una actividad');
        return;
    }

    // Procesar actividades
    state.activities = input
        .split('\n')
        .map(activity => activity.trim())
        .filter(activity => activity.length > 0);

    if (state.activities.length === 0) {
        showError('Por favor ingresa al menos una actividad válida');
        return;
    }

    // Inicializar respuestas y clasificaciones
    state.activities.forEach(activity => {
        state.answers[activity] = {
            deadline: null,
            urgency: [],
            importance: []
        };
        state.classifications[activity] = {
            isUrgent: false,
            isImportant: false,
            deadline: null
        };
    });

    // Cambiar a pantalla de preguntas
    hideError();
    goToQuestionsScreen();
}

// ========== PANTALLA 2: PREGUNTAS ==========
function goToQuestionsScreen() {
    state.currentTaskIndex = 0;
    state.currentQuestionIndex = 0;
    switchScreen(screenQuestions);
    displayQuestion();
}

function displayQuestion() {
    const currentActivity = state.activities[state.currentTaskIndex];
    currentTaskElement.textContent = `📌 ${currentActivity}`;
    progressText.textContent = `Tarea ${state.currentTaskIndex + 1} de ${state.activities.length}`;

    const question = state.questions[state.currentQuestionIndex];
    questionsContainer.innerHTML = '';

    // Crear grupo de preguntas
    const questionGroup = document.createElement('div');
    questionGroup.className = 'question-text';
    
    const questionLabel = document.createElement('h3');
    questionLabel.textContent = question.question;
    questionLabel.style.marginBottom = '15px';
    questionLabel.style.fontSize = '1.1rem';
    questionGroup.appendChild(questionLabel);

    // Manejar preguntas de tipo fecha
    if (question.inputType === 'date') {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-input-wrapper';
        
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = `date-${state.currentTaskIndex}-${state.currentQuestionIndex}`;
        
        // Recuperar fecha anterior si existe
        if (state.answers[currentActivity].deadline) {
            dateInput.value = state.answers[currentActivity].deadline;
        }
        
        dateInput.addEventListener('change', () => {
            saveAnswer(question.id, question.type, dateInput.value);
        });
        
        dateDiv.appendChild(dateInput);
        questionGroup.appendChild(dateDiv);
    } else {
        // Manejar preguntas de tipo radio (urgencia e importancia)
        question.answers.forEach((answer, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'question-item';

            const inputId = `answer-${state.currentTaskIndex}-${state.currentQuestionIndex}-${index}`;
            const input = document.createElement('input');
            input.type = 'radio';
            input.id = inputId;
            input.name = `question-${state.currentTaskIndex}-${state.currentQuestionIndex}`;
            input.value = answer.value;

            // Recuperar respuesta anterior si existe
            const answerIndex = state.answers[currentActivity][question.type].findIndex(
                a => a.questionId === question.id
            );
            if (answerIndex !== -1) {
                input.checked = state.answers[currentActivity][question.type][answerIndex].value === answer.value;
            }

            input.addEventListener('change', () => {
                saveAnswer(question.id, question.type, answer.value);
            });

            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.appendChild(document.createTextNode(answer.text));

            itemDiv.appendChild(input);
            itemDiv.appendChild(label);
            questionGroup.appendChild(itemDiv);
        });
    }

    questionsContainer.innerHTML = '';
    questionsContainer.appendChild(questionGroup);

    // Actualizar estado de botones
    btnPrevious.disabled = state.currentQuestionIndex === 0;
    btnNext.textContent = state.currentQuestionIndex === state.questions.length - 1 
        ? (state.currentTaskIndex === state.activities.length - 1 ? 'Ver Matriz →' : 'Siguiente Tarea →')
        : 'Siguiente →';
}

function saveAnswer(questionId, type, value) {
    const currentActivity = state.activities[state.currentTaskIndex];
    
    if (type === 'deadline') {
        // Guardar fecha límite directamente
        state.answers[currentActivity].deadline = value;
        state.classifications[currentActivity].deadline = value;
    } else {
        // Guardar respuestas de urgencia e importancia
        const answers = state.answers[currentActivity][type];
        const existingIndex = answers.findIndex(a => a.questionId === questionId);
        if (existingIndex !== -1) {
            answers[existingIndex].value = value;
        } else {
            answers.push({ questionId, value });
        }
    }
}

function handleNextQuestion() {
    if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++;
        displayQuestion();
    } else {
        // Pasar a siguiente tarea o ir a matriz
        classifyCurrentTask();
        
        if (state.currentTaskIndex < state.activities.length - 1) {
            state.currentTaskIndex++;
            state.currentQuestionIndex = 0;
            displayQuestion();
        } else {
            // Ir a la matriz
            goToMatrixScreen();
        }
    }
}

function handlePreviousQuestion() {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        displayQuestion();
    }
}

function classifyCurrentTask() {
    const currentActivity = state.activities[state.currentTaskIndex];
    const answers = state.answers[currentActivity];

    // Calcular si es urgente
    const urgencyAnswers = answers.urgency.map(a => a.value);
    state.classifications[currentActivity].isUrgent = urgencyAnswers.some(a => a === true || a === 'true');

    // Calcular si es importante
    const importanceAnswers = answers.importance.map(a => a.value);
    state.classifications[currentActivity].isImportant = importanceAnswers.some(a => a === true || a === 'true');
}

// ========== PANTALLA 3: MATRIZ ==========
function goToMatrixScreen() {
    // Clasificar última tarea
    classifyCurrentTask();
    
    // Renderizar matriz
    renderMatrix();
    switchScreen(screenMatrix);
}

function renderMatrix() {
    // Limpiar cuadrantes
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`quadrant-${i}`).innerHTML = '';
    }

    let urgent_important = 0;
    let not_urgent_important = 0;
    let urgent_not_important = 0;
    let not_urgent_not_important = 0;

    // Distribuir tareas en cuadrantes
    state.activities.forEach(activity => {
        const classification = state.classifications[activity];
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        
        // Crear contenido con tarea y fecha
        const taskContent = document.createElement('div');
        taskContent.style.display = 'flex';
        taskContent.style.flexDirection = 'column';
        taskContent.style.gap = '5px';
        
        const taskName = document.createElement('span');
        taskName.style.fontWeight = '500';
        taskName.textContent = activity;
        taskContent.appendChild(taskName);
        
        // Agregar fecha si existe
        if (classification.deadline) {
            const dateSpan = document.createElement('span');
            dateSpan.style.fontSize = '0.85rem';
            dateSpan.style.opacity = '0.8';
            const deadlineDate = new Date(classification.deadline);
            dateSpan.textContent = `📅 ${deadlineDate.toLocaleDateString('es-ES')}`;
            taskContent.appendChild(dateSpan);
        }
        
        taskDiv.appendChild(taskContent);

        if (classification.isUrgent && classification.isImportant) {
            document.getElementById('quadrant-1').appendChild(taskDiv);
            urgent_important++;
        } else if (!classification.isUrgent && classification.isImportant) {
            document.getElementById('quadrant-2').appendChild(taskDiv);
            not_urgent_important++;
        } else if (classification.isUrgent && !classification.isImportant) {
            document.getElementById('quadrant-3').appendChild(taskDiv);
            urgent_not_important++;
        } else {
            document.getElementById('quadrant-4').appendChild(taskDiv);
            not_urgent_not_important++;
        }
    });

    // Mostrar mensajes de vacío
    for (let i = 1; i <= 4; i++) {
        const quadrant = document.getElementById(`quadrant-${i}`);
        if (quadrant.children.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-message';
            emptyDiv.textContent = '(sin tareas en esta categoría)';
            quadrant.appendChild(emptyDiv);
        }
    }

    // Actualizar resumen
    document.getElementById('total-tasks').textContent = state.activities.length;
    document.getElementById('urgent-important').textContent = urgent_important;
    document.getElementById('important-only').textContent = not_urgent_important;
}

// ========== UTILIDADES ==========
function switchScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
    errorMessage.classList.add('hidden');
}

function handleRestart() {
    // Resetear estado
    state.activities = [];
    state.currentQuestionIndex = 0;
    state.currentTaskIndex = 0;
    state.classifications = {};
    state.answers = {};
    
    // Limpiar input
    activitiesInput.value = '';
    hideError();
    
    // Volver a pantalla inicial
    switchScreen(screenActivities);
}

function handleExport() {
    // Crear contenido del reporte
    let reportContent = `MATRIZ DE EISENHOWER - REPORTE DE TAREAS\n`;
    reportContent += `Generado: ${new Date().toLocaleDateString('es-ES')}\n\n`;

    // Función auxiliar para formatear tareas con fecha
    const formatTask = (task) => {
        const classification = state.classifications[task];
        const dateStr = classification.deadline 
            ? ` [Fecha límite: ${new Date(classification.deadline).toLocaleDateString('es-ES')}]`
            : '';
        return `${task}${dateStr}`;
    };

    // Cuadrante 1
    reportContent += `\n🔴 URGENTE E IMPORTANTE (Hacer ahora)\n`;
    reportContent += `═══════════════════════════════════════\n`;
    const quad1 = state.activities.filter(a => 
        state.classifications[a].isUrgent && state.classifications[a].isImportant
    );
    if (quad1.length > 0) {
        quad1.forEach((task, i) => reportContent += `${i + 1}. ${formatTask(task)}\n`);
    } else {
        reportContent += `(sin tareas)\n`;
    }

    // Cuadrante 2
    reportContent += `\n🟡 NO URGENTE PERO IMPORTANTE (Planificar)\n`;
    reportContent += `═══════════════════════════════════════\n`;
    const quad2 = state.activities.filter(a => 
        !state.classifications[a].isUrgent && state.classifications[a].isImportant
    );
    if (quad2.length > 0) {
        quad2.forEach((task, i) => reportContent += `${i + 1}. ${formatTask(task)}\n`);
    } else {
        reportContent += `(sin tareas)\n`;
    }

    // Cuadrante 3
    reportContent += `\n🟠 URGENTE PERO NO IMPORTANTE (Delegar)\n`;
    reportContent += `═══════════════════════════════════════\n`;
    const quad3 = state.activities.filter(a => 
        state.classifications[a].isUrgent && !state.classifications[a].isImportant
    );
    if (quad3.length > 0) {
        quad3.forEach((task, i) => reportContent += `${i + 1}. ${formatTask(task)}\n`);
    } else {
        reportContent += `(sin tareas)\n`;
    }

    // Cuadrante 4
    reportContent += `\n⚪ NO URGENTE Y NO IMPORTANTE (Eliminar)\n`;
    reportContent += `═══════════════════════════════════════\n`;
    const quad4 = state.activities.filter(a => 
        !state.classifications[a].isUrgent && !state.classifications[a].isImportant
    );
    if (quad4.length > 0) {
        quad4.forEach((task, i) => reportContent += `${i + 1}. ${formatTask(task)}\n`);
    } else {
        reportContent += `(sin tareas)\n`;
    }

    // Descargar
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Matriz_Eisenhower_${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
}
