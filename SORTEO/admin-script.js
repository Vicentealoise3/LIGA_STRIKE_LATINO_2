let finalParticipants = []; // Variable global para guardar los resultados del sorteo

document.addEventListener('DOMContentLoaded', () => {
    const numParticipantsInput = document.getElementById('numParticipants');
    numParticipantsInput.addEventListener('change', generateDraftItems);
    generateDraftItems();
});

function generateParticipantInputs() {
    const numParticipants = document.getElementById('numParticipants').value;
    const listContainer = document.getElementById('participantsList');
    listContainer.innerHTML = '';

    for (let i = 1; i <= numParticipants; i++) {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'participant-item';
        participantDiv.innerHTML = `
            <span>Participante ${i}:</span>
            <input type="text" placeholder="ID de consola" required>
            <select required>
                <option value="">Selecciona Consola</option>
                <option value="psn">PSN</option>
                <option value="xbox">Xbox</option>
            </select>
        `;
        listContainer.appendChild(participantDiv);
    }
}

function generateDraftItems() {
    const numParticipants = document.getElementById('numParticipants').value || 1;
    const resultsContainer = document.getElementById('draftResults');
    resultsContainer.innerHTML = '';

    for (let i = 1; i <= numParticipants; i++) {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'draft-item-container';
        itemContainer.innerHTML = `<div class="draft-item-placeholder">Esperando # ${i}</div>`;
        resultsContainer.appendChild(itemContainer);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startDraft() {
    const participants = [];
    const participantInputs = document.querySelectorAll('.participant-item input[type="text"]');
    const consoleSelects = document.querySelectorAll('.participant-item select');
    const delayTime = document.getElementById('delayTime').value;

    if (participantInputs.length === 0) {
        alert("Por favor, genera y llena los campos de los participantes primero.");
        return;
    }

    for (let i = 0; i < participantInputs.length; i++) {
        const id = participantInputs[i].value;
        const consoleType = consoleSelects[i].value;
        if (!id || !consoleType) {
            alert("Por favor, completa la información de todos los participantes.");
            return;
        }
        participants.push({ id, console: consoleType });
    }

    document.getElementById('startButton').disabled = true;
    document.getElementById('exportButton').style.display = 'none';
    document.getElementById('draftStatus').textContent = "Sorteo en curso...";
    
    generateDraftItems();
    
    shuffleArray(participants);
    for (let i = 0; i < participants.length; i++) {
        participants[i].draftNumber = i + 1;
    }
    
    finalParticipants = participants;

    revealResults(participants, delayTime);
}

function revealResults(participants, delay) {
    const resultsContainers = document.querySelectorAll('.draft-item-container');

    participants.forEach((p, index) => {
        setTimeout(() => {
            if (index > 0) {
                const prevBar = resultsContainers[index - 1].querySelector('.progress-bar');
                if (prevBar) prevBar.remove();
            }

            const container = resultsContainers[index];
            container.innerHTML = `
                <div class="draft-item-content revealed">
                    <h3># ${p.draftNumber}</h3>
                    <p>${p.id} (${p.console.toUpperCase()})</p>
                </div>
                ${index < participants.length - 1 ? `<div class="progress-bar animated" style="animation-duration: ${delay}s;"></div>` : ''}
            `;
            
            if (index === participants.length - 1) {
                document.getElementById('draftStatus').textContent = "¡Sorteo finalizado!";
                document.getElementById('startButton').disabled = false;
                document.getElementById('exportButton').style.display = 'inline-block';
            }
        }, index * delay * 1000);
    });
}

function exportToExcel() {
    if (finalParticipants.length === 0) {
        alert("No hay resultados para exportar. Por favor, realiza un sorteo primero.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Numero de Seleccion,ID de Consola,Tipo de Consola\n";

    finalParticipants.forEach(p => {
        const row = `${p.draftNumber},"${p.id}","${p.console.toUpperCase()}"`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "resultados_sorteo_draft.csv");
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}