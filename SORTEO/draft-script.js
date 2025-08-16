// Constantes y elementos del DOM
const loginScreen = document.getElementById('login-screen');
const draftContent = document.getElementById('draft-content');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const currentPickSpan = document.getElementById('currentPick');
const countdownSpan = document.getElementById('countdown');
const teamsGrid = document.getElementById('teamsGrid');
const draftSelectionsList = document.getElementById('draftSelections');
const playersList = document.getElementById('playersList');
const exportCsvBtn = document.getElementById('exportCsvBtn');

// Variables de estado
let currentPick = 0;
let countdown;
let timerDuration = 60; // Duración inicial del temporizador en segundos
let isDraftInProgress = false;

// Usuarios y roles
const users = {
    'admin': { password: 'adminpass', role: 'admin' },
    'jugador1': { password: 'pass1', role: 'jugador' },
    'jugador2': { password: 'pass2', role: 'jugador' },
    'jugador3': { password: 'pass3', role: 'jugador' },
    'jugador4': { password: 'pass4', role: 'jugador' },
    'jugador5': { password: 'pass5', role: 'jugador' }
};

let loggedInUser = null;
let draftedTeams = [];

// Array de jugadores en orden de selección
const players = Object.keys(users).filter(user => users[user].role === 'jugador');
let draftOrder = [...players]; // Copia el array para el orden de draft

// Array de selecciones del draft
let draftSelections = [];

// Funciones
function startDraft() {
    isDraftInProgress = true;
    currentPick = 0;
    draftedTeams = [...teams]; // Inicializa todos los equipos como disponibles
    startNextTurn();
    exportCsvBtn.style.display = 'block';
}

function startNextTurn() {
    if (currentPick < draftOrder.length) {
        currentPick++;
        const currentPlayer = draftOrder[currentPick - 1];
        currentPickSpan.textContent = `Turno: #${currentPick} - ${currentPlayer}`;

        const playersLi = playersList.querySelectorAll('li');
        playersLi.forEach((li, index) => {
            if (index === currentPick - 1) {
                li.classList.add('current-turn');
            } else {
                li.classList.remove('current-turn');
            }
        });

        startCountdown();
        renderTeams();
    } else {
        endDraft();
    }
}

function startCountdown() {
    clearInterval(countdown);
    let timeLeft = timerDuration;
    countdownSpan.textContent = formatTime(timeLeft);

    countdown = setInterval(() => {
        timeLeft--;
        countdownSpan.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(countdown);
            handleAutoPick();
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function handleTeamSelection(event) {
    if (!isDraftInProgress) return;

    const teamItem = event.target.closest('.team-item');
    if (!teamItem || teamItem.classList.contains('picked')) return;

    const teamId = teamItem.dataset.teamId;
    const team = teams.find(t => t.id === teamId);
    const currentPlayer = draftOrder[currentPick - 1];

    if (loggedInUser && loggedInUser.role === 'jugador' && loggedInUser.name !== currentPlayer) {
        alert("No es tu turno de seleccionar.");
        return;
    }

    if (team) {
        const selection = {
            pick: currentPick,
            player: currentPlayer,
            team: team.name,
        };
        draftSelections.push(selection);

        const teamIndex = draftedTeams.findIndex(t => t.id === teamId);
        if (teamIndex !== -1) {
            draftedTeams.splice(teamIndex, 1);
        }

        renderDraftSelections();
        startNextTurn();
    }
}

function handleAutoPick() {
    if (draftedTeams.length > 0) {
        const randomTeam = draftedTeams[Math.floor(Math.random() * draftedTeams.length)];
        const currentPlayer = draftOrder[currentPick - 1];

        const selection = {
            pick: currentPick,
            player: currentPlayer,
            team: randomTeam.name,
        };
        draftSelections.push(selection);

        const teamIndex = draftedTeams.findIndex(t => t.id === randomTeam.id);
        if (teamIndex !== -1) {
            draftedTeams.splice(teamIndex, 1);
        }

        renderDraftSelections();
        startNextTurn();
    } else {
        endDraft();
    }
}

function renderTeams() {
    teamsGrid.innerHTML = '';
    teams.forEach(team => {
        const isDrafted = draftSelections.some(s => s.team === team.name);
        if (!isDrafted) {
            const teamItem = document.createElement('div');
            teamItem.className = 'team-item';
            teamItem.dataset.teamId = team.id;
            teamItem.innerHTML = `<span>${team.name}</span>`;
            teamsGrid.appendChild(teamItem);
        }
    });
}

function renderDraftSelections() {
    draftSelectionsList.innerHTML = '';
    draftSelections.forEach(selection => {
        const li = document.createElement('li');
        li.className = 'selection-item';
        li.textContent = `${selection.team} (${selection.player})`;
        draftSelectionsList.appendChild(li);
    });
}

function renderPlayersList() {
    playersList.innerHTML = '';
    draftOrder.forEach((player, index) => {
        const li = document.createElement('li');
        li.textContent = `#${index + 1} - ${player}`;
        playersList.appendChild(li);
    });
}

function endDraft() {
    isDraftInProgress = false;
    clearInterval(countdown);
    countdownSpan.textContent = '0:00';
    currentPickSpan.textContent = 'El Draft ha finalizado.';
    alert('El draft ha terminado. ¡Revisa los resultados!');
}

function exportToCsv() {
    const csvHeader = ['Pick', 'Jugador', 'Equipo'];
    const csvRows = draftSelections.map(s => [s.pick, s.player, s.team]);
    const csvContent = [csvHeader.join(',')].concat(csvRows.map(row => row.join(','))).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, 'resultados_draft.csv');
    } else {
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'resultados_draft.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Event Listeners
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');

    if (users[username] && users[username].password === password) {
        loggedInUser = { name: username, role: users[username].role };
        loginScreen.style.display = 'none';
        draftContent.style.display = 'flex';
        renderPlayersList();
        renderTeams();
        if (loggedInUser.role === 'admin') {
            adminPanel.style.display = 'block';
        }
    } else {
        loginError.textContent = 'Usuario o contraseña incorrectos.';
    }
});

document.getElementById('save-timer-btn').addEventListener('click', () => {
    const timerInput = document.getElementById('timer-config');
    const newDuration = parseInt(timerInput.value, 10);
    if (!isNaN(newDuration) && newDuration > 0) {
        timerDuration = newDuration;
        alert(`Temporizador configurado a ${timerDuration} segundos.`);
    } else {
        alert('Por favor, ingresa un valor válido para el temporizador.');
    }
});

document.getElementById('start-draft-btn').addEventListener('click', () => {
    if (!isDraftInProgress) {
        startDraft();
        alert('¡El draft ha comenzado!');
    }
});

teamsGrid.addEventListener('click', handleTeamSelection);
exportCsvBtn.addEventListener('click', exportToCsv);