// ---------- CONFIGURACIÓN ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('scoreValue');
const livesSpan = document.getElementById('livesValue');

// Mapeo de colores
const keyColorMap = {
    'c': '#FF4D4D', // rojo
    'v': '#4DFF4D', // verde
    'b': '#4DA6FF', // azul
    'n': '#FFE64D'  // amarillo
};
const keys = ['c', 'v', 'b', 'n'];

// ZONA DE ACIERTO MÁS GRANDE
const HIT_ZONE_Y = canvas.height - 100;  // Empieza más arriba
const HIT_ZONE_HEIGHT = 60;              // Mucho más alta (antes era 25)

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

// Crear nueva nota
function spawnNote() {
    if (!gameActive) return;

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    notes.push({
        key: randomKey,
        color: keyColorMap[randomKey],
        y: 30,
        speed: 2.2,
        active: true,
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

    // ZONA DE ACIERTO MÁS VISIBLE Y GRANDE
    ctx.fillStyle = '#ffffff30'; // Un poco más visible
    ctx.fillRect(0, HIT_ZONE_Y, canvas.width, HIT_ZONE_HEIGHT);
    ctx.strokeStyle = '#f0f0f0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, HIT_ZONE_Y, canvas.width, HIT_ZONE_HEIGHT);
    
    // Texto más grande y llamativo
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 8;
    ctx.fillText('¡TOCA AQUÍ!', 20, HIT_ZONE_Y + 35);
    ctx.shadowBlur = 0;

    // Dibujar notas
    notes.forEach(note => {
        if (!note.active) return;

        const keyIndex = keys.indexOf(note.key);
        const laneWidth = canvas.width / 4;
        const x = keyIndex * laneWidth + 5;
        const width = laneWidth - 10;

        // Guardamos coordenadas para detección de toques
        note.x = x;
        note.width = width;
        note.height = 35;

        const gradient = ctx.createLinearGradient(x, note.y, x + width, note.y + 35);
        gradient.addColorStop(0, note.color);
        gradient.addColorStop(1, '#ffffff80');
        ctx.fillStyle = gradient;
        ctx.shadowColor = note.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(x, note.y, width, 35);
        ctx.shadowBlur = 0;

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

        note.y += note.speed;

        // Si pasó la zona sin ser tocada
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

// ---------- DETECTAR TOQUE INSTANTÁNEO ----------
function handleTouch(e) {
    e.preventDefault();
    
    if (!gameActive) return;

    const touch = e.touches[0];
    if (!touch) return;

    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const touchX = (touch.clientX - rect.left) * scaleX;
    const touchY = (touch.clientY - rect.top) * scaleY;

    if (touchX < 0 || touchX > canvas.width || touchY < 0 || touchY > canvas.height) return;

    let hit = false;

    // Recorrer notas
    for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        if (!note.active) continue;

        // Verificar si el toque está dentro del rectángulo de la nota
        if (touchX >= note.x && 
            touchX <= note.x + note.width &&
            touchY >= note.y && 
            touchY <= note.y + note.height) {
            
            // Verificar que la nota esté en la ZONA GRANDE de acierto
            const noteBottom = note.y + note.height;
            const noteTop = note.y;

            if (noteBottom >= HIT_ZONE_Y && noteTop <= HIT_ZONE_Y + HIT_ZONE_HEIGHT) {
                // ¡ACERTÓ!
                score += 10;
                notes.splice(i, 1);
                hit = true;

                canvas.style.boxShadow = '0 0 30px lime';
                setTimeout(() => canvas.style.boxShadow = 'inset 0 0 20px #00000055, 0 10px 20px black', 150);

                updateInfo();
                break;
            }
        }
    }

    // Si no acertó en ninguna nota
    if (!hit) {
        score = Math.max(0, score - 5);
        canvas.style.boxShadow = '0 0 30px red';
        setTimeout(() => canvas.style.boxShadow = 'inset 0 0 20px #00000055, 0 10px 20px black', 150);
        updateInfo();
    }

    if (lives <= 0) gameOver();
}

// ---------- GAME OVER ----------
function gameOver() {
    gameActive = false;
    clearInterval(spawnInterval);

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

// ---------- EVENTOS TÁCTILES ----------
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
canvas.addEventListener('touchend', (e) => e.preventDefault());
canvas.addEventListener('touchcancel', (e) => e.preventDefault());

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
