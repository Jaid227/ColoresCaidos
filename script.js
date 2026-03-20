
// ---------- CONFIGURACIÓN ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('scoreValue');
const livesSpan = document.getElementById('livesValue');

// Mapeo de colores (mismos que antes)
const keyColorMap = {
    'c': '#FF4D4D', // rojo
    'v': '#4DFF4D', // verde
    'b': '#4DA6FF', // azul
    'n': '#FFE64D'  // amarillo
};
const keys = ['c', 'v', 'b', 'n'];

// Zona de acierto (píxeles desde abajo)
const HIT_ZONE_Y = canvas.height - 80;
const HIT_ZONE_HEIGHT = 25;

// Estado del juego
let score = 0;
let lives = 5;
let gameActive = true;

// Notas activas
let notes = [];

// Generación de notas
let spawnInterval;
const SPAWN_RATE = 600; // ms

// ---------- INICIALIZAR ----------
function initGame() {
    score = 0;
    lives = 5;
    notes = [];
    gameActive = true;
    updateInfo();

    if (spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnNote, SPAWN_RATE);

    // Notas iniciales
    setTimeout(() => { if (gameActive) spawnNote(); }, 100);
    setTimeout(() => { if (gameActive) spawnNote(); }, 300);
}

// Crear nueva nota (color aleatorio)
function spawnNote() {
    if (!gameActive) return;

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    notes.push({
        key: randomKey,
        color: keyColorMap[randomKey],
        y: 30,
        speed: 2.2,
        active: true,
        width: (canvas.width / 4) - 10, // ancho aproximado
        height: 35
    });
}

// Actualizar UI
function updateInfo() {
    scoreSpan.innerText = score;
    livesSpan.innerText = lives;
}

// ---------- DIBUJAR ----------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Zona de acierto
    ctx.fillStyle = '#ffffff20';
    ctx.fillRect(0, HIT_ZONE_Y, canvas.width, HIT_ZONE_HEIGHT);
    ctx.strokeStyle = '#f0f0f0aa';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, HIT_ZONE_Y, canvas.width, HIT_ZONE_HEIGHT);
    
    // Texto "ZONA"
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ddd';
    ctx.fillText('¡CLICK AQUÍ!', 10, HIT_ZONE_Y - 6);

    // Dibujar notas
    notes.forEach(note => {
        if (!note.active) return;

        // Calcular X según carril (c/v/b/n)
        const keyIndex = keys.indexOf(note.key);
        const laneWidth = canvas.width / 4;
        const x = keyIndex * laneWidth + 5;
        const width = laneWidth - 10;

        // Guardamos dimensiones reales para detección de clicks
        note.x = x;
        note.width = width;
        note.height = 35;

        // Dibujar rectángulo con brillo
        const gradient = ctx.createLinearGradient(x, note.y, x + width, note.y + 35);
        gradient.addColorStop(0, note.color);
        gradient.addColorStop(1, '#ffffff80');
        ctx.fillStyle = gradient;
        ctx.shadowColor = note.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(x, note.y, width, 35);
        ctx.shadowBlur = 0;

        // Borde
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, note.y, width, 35);
    });
}

// ---------- ACTUALIZAR POSICIONES ----------
function update() {
    if (!gameActive) return;

    for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        if (!note.active) continue;

        // Mover hacia abajo
        note.y += note.speed;

        // Si pasó la zona sin ser clickeada
        if (note.y > canvas.height + 20) {
            notes.splice(i, 1);
            if (gameActive) {
                lives--;
                updateInfo();
                if (lives <= 0) gameOver();
            }
        }
    }
}

// ---------- DETECTAR CLICK EN COLOR ----------
function handleCanvasClick(e) {
    if (!gameActive) return;

    // Obtener coordenadas del click/tap relativas al canvas
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;   // escala si el canvas es responsive
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if (e.touches) {
        // Evento táctil
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        e.preventDefault(); // evitar scroll
    } else {
        // Evento ratón
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // Coordenadas dentro del canvas (en píxeles de resolución)
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    // Buscar si el click dio sobre alguna nota activa Y que esté en zona de acierto
    let hitNote = false;

    for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        if (!note.active) continue;

        // Comprobar si el punto está dentro del rectángulo de la nota
        if (canvasX >= note.x && 
            canvasX <= note.x + note.width &&
            canvasY >= note.y && 
            canvasY <= note.y + note.height) {
            
            // Además, la nota debe estar EN la zona de acierto (o cerca)
            const noteBottom = note.y + note.height;
            const noteTop = note.y;

            if (noteBottom >= HIT_ZONE_Y && noteTop <= HIT_ZONE_Y + HIT_ZONE_HEIGHT) {
                // ¡ACERTÓ!
                score += 10;
                notes.splice(i, 1); // eliminar nota
                hitNote = true;

                // Feedback visual
                canvas.style.boxShadow = '0 0 30px lime';
                setTimeout(() => canvas.style.boxShadow = 'inset 0 0 20px #00000055, 0 10px 20px black', 150);

                updateInfo();
                break; // solo un acierto por click
            }
        }
    }

    // Si no acertó en ninguna nota (click en zona vacía)
    if (!hitNote) {
        score = Math.max(0, score - 5);
        canvas.style.boxShadow = '0 0 30px red';
        setTimeout(() => canvas.style.boxShadow = 'inset 0 0 20px #00000055, 0 10px 20px black', 150);
        updateInfo();
    }

    // Revisar si murió
    if (lives <= 0) gameOver();
}

// ---------- GAME OVER ----------
function gameOver() {
    gameActive = false;
    clearInterval(spawnInterval);

    // Mensaje en canvas
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 15;
    ctx.fillText('GAME OVER', 30, canvas.height / 2);
    ctx.shadowBlur = 0;
}

// ---------- REINICIAR ----------
function restartGame() {
    if (spawnInterval) clearInterval(spawnInterval);
    initGame();
}

// ---------- EVENTOS DE CLICK / TAP ----------
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('touchstart', handleCanvasClick, { passive: false });

// Prevenir menú contextual en canvas (opcional)
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Botón reiniciar
document.getElementById('restartButton').addEventListener('click', restartGame);
document.getElementById('restartButton').addEventListener('touchstart', (e) => {
    e.preventDefault();
    restartGame();
});

// ---------- BUCLE PRINCIPAL ----------
function gameLoop() {
    if (gameActive) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Arrancar
initGame();
gameLoop();

// Ajuste responsive (ya está)