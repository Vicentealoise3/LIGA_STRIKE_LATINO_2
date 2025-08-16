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
    teams.forEach(team => draftedTeams.push(team.id)); // Inicializa todos los equipos como disponibles
    startNextTurn();
    exportCsvBtn.style.display = 'block';
}

function startNextTurn() {
    if (currentPick < draftOrder.length) {
        currentPick++;
        const currentPlayer = draftOrder[currentPick - 1];
        currentPickSpan.textContent = `Turno: #${currentPick} - ${currentPlayer}`;
        
        // Remarca al jugador actual en la lista
        const playersLi = playersList.querySelectorAll('li');
        playersLi.forEach((li, index) => {
            if (index === currentPick - 1) {
                li.classList.add('current-turn');
            } else {
                li.classList.remove('current-turn');
            }
        });
        
        startCountdown();
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

    // Verificar si el jugador logueado es el del turno actual
    if (loggedInUser && loggedInUser.role === 'jugador' && loggedInUser.name !== currentPlayer) {
        alert("No es tu turno de seleccionar.");
        return;
    }

    if (team) {
        const selection = {
            pick: currentPick,
            player: currentPlayer,
            team: team.name,
            teamLogo: team.logo
        };
        draftSelections.push(selection);
        
        teamItem.classList.add('picked');
        
        // Eliminar el equipo del array de equipos disponibles
        draftedTeams = draftedTeams.filter(id => id !== teamId);
        
        renderDraftSelections();
        startNextTurn();
    }
}

function handleAutoPick() {
    const availableTeams = teams.filter(team => draftedTeams.includes(team.id));
    if (availableTeams.length > 0) {
        const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
        const currentPlayer = draftOrder[currentPick - 1];
        
        const selection = {
            pick: currentPick,
            player: currentPlayer,
            team: randomTeam.name,
            teamLogo: randomTeam.logo
        };
        draftSelections.push(selection);
        
        const teamElement = teamsGrid.querySelector(`.team-item[data-team-id="${randomTeam.id}"]`);
        if (teamElement) {
            teamElement.classList.add('picked');
        }
        
        draftedTeams = draftedTeams.filter(id => id !== randomTeam.id);
        
        renderDraftSelections();
        startNextTurn();
    } else {
        endDraft();
    }
}

function renderTeams() {
    teamsGrid.innerHTML = '';
    teams.forEach(team => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';
        teamItem.dataset.teamId = team.id;
        
        // Muestra el nombre del equipo en lugar del logo
        teamItem.innerHTML = `<span>${team.name}</span>`;
        
        if (!draftedTeams.includes(team.id)) {
            teamItem.classList.add('picked');
        }
        
        teamsGrid.appendChild(teamItem);
    });
}

function renderDraftSelections() {
    draftSelectionsList.innerHTML = '';
    draftSelections.forEach(selection => {
        const li = document.createElement('li');
        li.className = 'selection-item';
        // También muestra el nombre del equipo en la lista de selecciones
        li.innerHTML = `<span>${selection.team}</span> - <span>(${selection.player})</span>`;
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
    
    if (navigator.msSaveBlob) { // IE 10+
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

// Inicializar
renderPlayersList();