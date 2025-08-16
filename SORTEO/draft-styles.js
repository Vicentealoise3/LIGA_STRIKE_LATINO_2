let currentTurn = 0; // El turno actual, 0-indexado para el array
let players = []; // Array que contendrá a los jugadores del sorteo anterior
let pickedTeams = []; // Array para guardar los equipos seleccionados
let timer;
let countdownTime = 60; // Tiempo del temporizador en segundos (por defecto)

// Simulación de los resultados del sorteo anterior (esto vendrá de la fase 1)
// En un sistema real, se cargaría desde una base de datos o un archivo
const draftOrder = [
    { id: 'jugador1', console: 'psn', draftNumber: 1 },
    { id: 'jugador2', console: 'xbox', draftNumber: 2 },
    { id: 'jugador3', console: 'psn', draftNumber: 3 },
    { id: 'jugador4', console: 'xbox', draftNumber: 4 },
    { id: 'jugador5', console: 'psn', draftNumber: 5 }
];

document.addEventListener('DOMContentLoaded', () => {
    players = draftOrder; // Carga el orden de selección
    renderTeams(); // Muestra los logos de los equipos
    updateTurnInfo(); // Actualiza la información del turno
    startTimer(); // Inicia el temporizador automáticamente
});

function renderTeams() {
    const teamsGrid = document.getElementById('teamsGrid');
    teamsGrid.innerHTML = '';
    
    teams.forEach(team => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';
        teamItem.innerHTML = `<img src="${team.logo}" alt="${team.name}">`;
        teamItem.dataset.id = team.id;
        teamItem.dataset.name = team.name;

        // Añade un evento de clic para simular la selección
        teamItem.addEventListener('click', () => selectTeam(team));

        teamsGrid.appendChild(teamItem);
    });
}

function updateTurnInfo() {
    const currentPickElem = document.getElementById('currentPick');
    if (currentTurn < players.length) {
        currentPickElem.textContent = `Turno: #${players[currentTurn].draftNumber} - ${players[currentTurn].id}`;
    } else {
        currentPickElem.textContent = "El Draft ha finalizado.";
        document.getElementById('countdown').textContent = "0:00";
        clearInterval(timer);
    }
}

function startTimer() {
    clearInterval(timer); // Limpiar cualquier temporizador anterior
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
    if (currentTurn >= players.length) return; // No hacer nada si el draft ha terminado

    // Marca el equipo como seleccionado y lo oculta del grid
    const teamElement = document.querySelector(`.team-item[data-id="${team.id}"]`);
    if (teamElement) {
        teamElement.classList.add('picked');
    }

    // Guarda la selección en la lista de equipos elegidos
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
    
    // Mueve al jugador al final de la cola
    const playerWhoTimedOut = players.splice(currentTurn, 1)[0];
    players.push(playerWhoTimedOut);

    // No se llama a nextTurn() porque el bucle ya avanza
    updateTurnInfo();
    startTimer();
}

function nextTurn() {
    currentTurn++;
    updateTurnInfo();
    startTimer();
}