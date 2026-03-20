// ---------- CONFIGURACIÓN ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('scoreValue');
const livesSpan = document.getElementById('livesValue');

// Elementos de control
const colorCountInput = document.getElementById('colorCount');
const colorCountValue = document.getElementById('colorCountValue');
const speedInput = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const livesInput = document.getElementById('livesCount');
const livesValue = document.getElementById('livesValueDisplay');

// Mapeo de colores
const keyColorMap = {
    'c': '#FF4D4D', // rojo
    'v': '#4DFF4D', // verde
    'b': '#4DA6FF', // azul
    'n': '#FFE64D'  // amarillo
};
const keys = ['c', 'v', 'b', 'n'];

// ZONA DE ACIERTO GRANDE
const HIT_ZONE_Y = canvas.height - 100;
const HIT_ZONE_HEIGHT = 100;

// Estado del juego
let score = 0;
let lives = 10; // Valor por defecto, se actualizará con el slider
let maxLives = 10;
let gameActive = true;
let totalColorsSpawned = 0;
let maxColors = 50;

// Notas activas
let notes = [];

// Generación de notas
let spawnInterval;
const BASE_SPAWN_RATE = 600; // ms base para velocidad 2.2

// ---------- CALCULAR SPAWN RATE SEGÚN VELOCIDAD ----------
function calculateSpawnRate(speed) {
    const baseSpeed = 2.2;
    const baseRate = 600;
    
    let newRate = baseRate * (baseSpeed / speed);
    newRate = Math.max(300, Math.min(2000, newRate));
    
    return Math.round(newRate);
}

// ---------- INICIALIZAR CONTROLES ----------
function initControls() {
    // Control de cantidad de colores
    colorCountInput.addEventListener('input', (e) => {
        const val = e.target.value;
        colorCountValue.textContent = val;
        maxColors = parseInt(val);
    });

    // Control de velocidad
    speedInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value).toFixed(1);
        speedValue.textContent = val;
        
        const newSpeed = parseFloat(val);
        
        notes.forEach(note => {
            note.speed = newSpeed;
        });
        
        if (gameActive && spawnInterval) {
            clearInterval(spawnInterval);
            const newSpawnRate = calculateSpawnRate(newSpeed);
            spawnInterval = setInterval(() => spawnNote(newSpeed), newSpawnRate);
        }
    });

    // Control de vidas
    livesInput.addEventListener('input', (e) => {
        const val = e.target.value;
        livesValue.textContent = val;
        maxLives = parseInt(val);
        
        // Si el juego está activo, actualizar vidas actuales también
        if (gameActive) {
            lives = maxLives;
            updateInfo();
        }
    });

    // Valores iniciales
    colorCountValue.textContent = colorCountInput.value;
    speedValue.textContent = speedInput.value;
    livesValue.textContent = livesInput.value;
    
    maxColors = parseInt(colorCountInput.value);
    maxLives = parseInt(livesInput.value);
    lives = maxLives;
}

// ---------- INICIALIZAR ----------
function initGame() {
    score = 0;
    lives = maxLives; // Usar el valor seleccionado
    notes = [];
    gameActive = true;
    totalColorsSpawned = 0;
    updateInfo();

    if (spawnInterval) clearInterval(spawnInterval);
    
    const currentSpeed = parseFloat(speedInput.value);
    const spawnRate = calculateSpawnRate(currentSpeed);
    
    spawnInterval = setInterval(() => spawnNote(currentSpeed), spawnRate);
}

// Crear nueva nota con velocidad específica
function spawnNote(currentSpeed) {
    if (!gameActive) return;
    
    if (totalColorsSpawned >= maxColors) {
        if (notes.length === 0) {
            gameVictory();
        }
        return;
    }

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    notes.push({
        key: randomKey,
        color: keyColorMap[randomKey],
        y: 30,
        speed: currentSpeed,
        active: true,
    });
    
    totalColorsSpawned++;
}

// ---------- VICTORIA ----------
function gameVictory() {
    gameActive = false;
    clearInterval(spawnInterval);

    ctx.fillStyle = '#000000aa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = 'gold';
    ctx.shadowColor = 'orange';
    ctx.shadowBlur = 15;
    ctx.fillText('¡VICTORIA!', 40, canvas.height / 2);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Puntuación: ' + score, 80, canvas.height / 2 + 50);
    ctx.shadowBlur = 0;
}

// Actualizar UI
function updateInfo() {
    scoreSpan.innerText = score;
    livesSpan.innerText = lives;
}

// ---------- DIBUJAR ----------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Información de progreso
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#ffffffaa';
    ctx.fillText(`Colores: ${totalColorsSpawned}/${maxColors}`, 10, 25);
    
    const currentSpeed = parseFloat(speedInput.value).toFixed(1);
    const spawnRate = calculateSpawnRate(parseFloat(speedInput.value));
    ctx.fillText(`Vel: ${currentSpeed} | Ritmo: ${spawnRate}ms`, 10, 45);
    
    // Mostrar vidas restantes / total
    ctx.fillStyle = lives > maxLives * 0.3 ? '#aaffaa' : '#ffaa88';
    ctx.fillText(`Vidas: ${lives}/${maxLives}`, 10, 65);

    // ZONA DE ACIERTO
    ctx.fillStyle = '#ffffff40';
    ctx.fillRect(0, HIT_ZONE_Y, canvas.width, HIT_ZONE_HEIGHT);
    ctx.strokeStyle = '#ffffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, HIT_ZONE_Y, canvas.width, HIT_ZONE_HEIGHT);
    
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 10;
    ctx.fillText('👆 TOCA AQUÍ 👆', 60, HIT_ZONE_Y + 38);
    ctx.shadowBlur = 0;

    // Dibujar notas
    notes.forEach(note => {
        if (!note.active) return;

        const keyIndex = keys.indexOf(note.key);
        const laneWidth = canvas.width / 4;
        const x = keyIndex * laneWidth + 5;
        const width = laneWidth - 10;

        note.x = x;
        note.width = width;
        note.height = 60;

        const gradient = ctx.createLinearGradient(x, note.y, x + width, note.y + 60);
        gradient.addColorStop(0, note.color);
        gradient.addColorStop(1, '#ffffff80');
        ctx.fillStyle = gradient;
        ctx.shadowColor = note.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(x, note.y, width, 60);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, note.y, width, 60);
    });
}

// ---------- ACTUALIZAR POSICIONES ----------
function update() {
    if (!gameActive) return;

    for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        if (!note.active) continue;

        note.y += note.speed;

        if (note.y > canvas.height + 20) {
            notes.splice(i, 1);
            if (gameActive) {
                lives--;
                updateInfo();
                if (lives <= 0) gameOver();
            }
        }
    }
    
    if (gameActive && notes.length === 0 && totalColorsSpawned >= maxColors) {
        gameVictory();
    }
}

// ---------- DETECCIÓN TÁCTIL ----------
function handleTouchStart(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!gameActive) return;

    const touches = e.touches;
    if (!touches || touches.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    for (let t = 0; t < touches.length; t++) {
        const touch = touches[t];
        
        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;

        if (touchX < 0 || touchX > canvas.width || touchY < 0 || touchY > canvas.height) continue;

        let hit = false;

        for (let i = notes.length - 1; i >= 0; i--) {
            const note = notes[i];
            if (!note.active) continue;

            if (touchX >= note.x && 
                touchX <= note.x + note.width &&
                touchY >= note.y && 
                touchY <= note.y + note.height) {
                
                const noteBottom = note.y + note.height;
                const noteTop = note.y;

                if (noteBottom >= HIT_ZONE_Y && noteTop <= HIT_ZONE_Y + HIT_ZONE_HEIGHT) {
                    score += 10;
                    notes.splice(i, 1);
                    hit = true;

                    canvas.style.boxShadow = '0 0 40px lime';
                    canvas.style.transition = 'box-shadow 0.05s';
                    setTimeout(() => {
                        canvas.style.boxShadow = 'inset 0 0 20px #00000055, 0 10px 20px black';
                    }, 100);

                    updateInfo();
                    break;
                }
            }
        }

        if (!hit) {
            score = Math.max(0, score - 5);
            
            canvas.style.boxShadow = '0 0 40px red';
            canvas.style.transition = 'box-shadow 0.05s';
            setTimeout(() => {
                canvas.style.boxShadow = 'inset 0 0 20px #00000055, 0 10px 20px black';
            }, 100);
            
            updateInfo();
        }

        if (lives <= 0) {
            gameOver();
            break;
        }
    }
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
    
    canvas.style.boxShadow = 'inset 0 0 20px #00000055, 0 10px 20px black';
}

// ---------- EVENTOS TÁCTILES ----------
canvas.addEventListener('touchstart', handleTouchStart, { 
    passive: false,
    capture: true
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    e.stopPropagation();
}, { passive: false, capture: true });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
}, { passive: false, capture: true });

canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    e.stopPropagation();
}, { passive: false, capture: true });

canvas.addEventListener('click', (e) => {
    e.preventDefault();
    return false;
});

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    return false;
});

const restartBtn = document.getElementById('restartButton');
restartBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    restartGame();
}, { passive: false });

restartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    restartGame();
});

document.body.addEventListener('touchmove', (e) => {
    if (e.target === canvas || e.target === restartBtn) {
        e.preventDefault();
    }
}, { passive: false });

// ---------- BUCLE PRINCIPAL ----------
function gameLoop() {
    if (gameActive) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicializar controles y arrancar
initControls();
initGame();
gameLoop();
