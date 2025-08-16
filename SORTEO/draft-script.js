let currentTurn = 0;
let players = [];
let pickedTeams = [];
let timer;
let countdownTime = 60;

const draftOrder = [
    { id: 'jugador1', console: 'psn', draftNumber: 1 },
    { id: 'jugador2', console: 'xbox', draftNumber: 2 },
    { id: 'jugador3', console: 'psn', draftNumber: 3 },
    { id: 'jugador4', console: 'xbox', draftNumber: 4 },
    { id: 'jugador5', console: 'psn', draftNumber: 5 }
];

const users = {
    'admin': 'adminpass',
    'jugador1': 'pass123',
    'jugador2': 'pass123',
    'jugador3': 'pass123',
    'jugador4': 'pass123',
    'jugador5': 'pass123'
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);
});

function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (users[username] && users[username] === password) {
        document.getElementById('login-screen').style.display = 'none';

        if (username === 'admin') {
            document.getElementById('admin-panel').style.display = 'block';
            document.getElementById('save-timer-btn').addEventListener('click', saveTimerConfig);
            document.getElementById('start-draft-btn').addEventListener('click', startDraft);
        } else {
            document.getElementById('draft-content').style.display = 'flex';
            startDraft();
        }
    } else {
        loginError.textContent = 'Nombre de usuario o contraseña incorrectos.';
    }
}

function saveTimerConfig() {
    const newTime = document.getElementById('timer-config').value;
    countdownTime = parseInt(newTime, 10);
    alert(`El tiempo del temporizador se ha configurado en ${countdownTime} segundos.`);
}

function startDraft() {
    if (document.getElementById('admin-panel').style.display === 'block') {
        document.getElementById('admin-panel').style.display = 'none';
        document.getElementById('draft-content').style.display = 'flex';
    }
    players = [...draftOrder]; // Copia el array para no modificar el original
    renderTeams();
    renderPlayersList();
    updateTurnInfo();
    startTimer();
}

function renderTeams() {
    const teamsGrid = document.getElementById('teamsGrid');
    teamsGrid.innerHTML = '';
    teams.forEach(team => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';
        teamItem.innerHTML = `<img src="${team.logo}" alt="${team.name}">`;
        teamItem.dataset.id = team.id;
        teamItem.dataset.name = team.name;
        teamItem.addEventListener('click', () => selectTeam(team));
        teamsGrid.appendChild(teamItem);
    });
}

function renderPlayersList() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.textContent = `#${player.draftNumber} - ${player.id}`;
        if (index === currentTurn) {
            li.classList.add('current-turn');
        }
        playersList.appendChild(li);
    });
}

function updateTurnInfo() {
    const currentPickElem = document.getElementById('currentPick');
    if (currentTurn < players.length) {
        currentPickElem.textContent = `Turno: #${players[currentTurn].draftNumber} - ${players[currentTurn].id}`;
        renderPlayersList();
    } else {
        currentPickElem.textContent = "El Draft ha finalizado.";
        document.getElementById('countdown').textContent = "0:00";
        clearInterval(timer);
        document.getElementById('exportCsvBtn').style.display = 'block';
    }
}

function startTimer() {
    clearInterval(timer);
    let timeLeft = countdownTime;
    const countdownElem = document.getElementById('countdown');
    countdownElem.textContent = formatTime(timeLeft);
    timer = setInterval(() => {
        timeLeft--;
        countdownElem.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function selectTeam(team) {
    if (currentTurn >= players.length) return;
    const teamElement = document.querySelector(`.team-item[data-id="${team.id}"]`);
    if (teamElement) {
        teamElement.classList.add('picked');
    }
    pickedTeams.push({
        player: players[currentTurn].id,
        teamName: team.name,
        teamLogo: team.logo
    });
    renderSelections();
    nextTurn();
}

function renderSelections() {
    const selectionsList = document.getElementById('draftSelections');
    selectionsList.innerHTML = '';
    pickedTeams.forEach(selection => {
        const li = document.createElement('li');
        li.className = 'selection-item';
        li.innerHTML = `<img src="${selection.teamLogo}" alt="${selection.teamName}"> ${selection.teamName} (${selection.player})`;
        selectionsList.appendChild(li);
    });
}

function handleTimeout() {
    console.log(`El turno de ${players[currentTurn].id} ha expirado. Pierde su turno.`);
    const playerWhoTimedOut = players.splice(currentTurn, 1)[0];
    players.push(playerWhoTimedOut);
    updateTurnInfo();
    startTimer();
}

function nextTurn() {
    currentTurn++;
    updateTurnInfo();
    startTimer();
}

function exportToCsv() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Jugador,Equipo,URL Logo\n';
    pickedTeams.forEach(selection => {
        const row = [selection.player, selection.teamName, selection.teamLogo].join(',');
        csvContent += row + '\n';
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'resultados_draft.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);