// Captura de elementos DOM
const setupArea = document.getElementById('setup-area');
const sessionArea = document.getElementById('session-area');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const circle = document.getElementById('breath-circle');
const breathText = document.getElementById('breath-text');
const zenQuote = document.getElementById('zen-quote');

const timeButtons = document.querySelectorAll('.time-btn');
const btnStartSession = document.getElementById('btn-start-session');
const btnPausePlay = document.getElementById('btn-pause-play');
const btnEndEarly = document.getElementById('btn-end-early');

const btnSound1 = document.getElementById('btn-sound-1');
const btnSound2 = document.getElementById('btn-sound-2');
const btnSound3 = document.getElementById('btn-sound-3');

const statCompletedDisplay = document.getElementById('stat-completed');
const statMinutesDisplay = document.getElementById('stat-minutes');

// Lista de Frases Inspiradoras
const quotes = [
    "\"O silêncio não é vazio, ele está cheio de respostas.\"",
    "\"Acalme a mente e a alma falará.\"",
    "\"Respire fundo. Deixe ir tudo aquilo que você não pode controlar.\"",
    "\"Sua paz interior é o seu maior superpoder.\"",
    "\"No momento presente está a chave para a liberdade interior.\"",
    "\"Apenas seja aqui e agora.\""
];

// Configurações do Temporizador
let totalSeconds = 300; 
let secondsLeft = 300;
let countdownInterval = null;
let breathingInterval = null;
let breathingTimeout1 = null;
let breathingTimeout2 = null;
let isPaused = false;

// Estatísticas Locais
let completedSessions = 0;
let totalMinutesMeditated = 0;

// Configurações de Áudio (Web Audio API)
let audioCtx = null;
let activeNoiseNode = null;
let activeOscillatorNode = null;
let activeForestNode = null;

// Escolher tempo da sessão
timeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        timeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        totalSeconds = parseInt(btn.getAttribute('data-time'));
        secondsLeft = totalSeconds;
        updateTimerDisplay();
    });
});

// Atualizar o texto do cronômetro
function updateTimerDisplay() {
    const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const secs = (secondsLeft % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${mins}:${secs}`;
    
    // Atualizar a barra de progresso
    const percentage = (secondsLeft / totalSeconds) * 100;
    progressBar.style.width = `${percentage}%`;
}

// INICIAR SESSÃO ZEN
btnStartSession.addEventListener('click', () => {
    initAudio();
    if (audioCtx) audioCtx.resume();

    setupArea.classList.add('hidden');
    sessionArea.classList.remove('hidden');
    secondsLeft = totalSeconds;
    isPaused = false;
    btnPausePlay.innerText = "Pausar";

    // Escolhe uma nova frase zen aleatória para a sessão
    zenQuote.innerText = quotes[Math.floor(Math.random() * quotes.length)];

    updateTimerDisplay();
    startTimer();
    startBreathingCycle();
});

// GERENCIADOR DO CRONÔMETRO
function startTimer() {
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        if (!isPaused) {
            secondsLeft--;
            updateTimerDisplay();

            if (secondsLeft <= 0) {
                endSession(true);
            }
        }
    }, 1000);
}

// GERENCIADOR DE RESPIRAÇÃO (Ciclo de 12 segundos: 4s inspira, 4s segura, 4s expira)
function startBreathingCycle() {
    runBreathingStep();
    clearInterval(breathingInterval);
    breathingInterval = setInterval(() => {
        if (!isPaused) {
            runBreathingStep();
        }
    }, 12000);
}

function runBreathingStep() {
    if (isPaused) return;

    clearTimeout(breathingTimeout1);
    clearTimeout(breathingTimeout2);

    // Passo 1: Inspirar (4s)
    breathText.innerText = "Inspirar...";
    circle.className = "breathing-circle grow";

    // Passo 2: Segurar (4s)
    breathingTimeout1 = setTimeout(() => {
        if (isPaused) return;
        breathText.innerText = "Segurar...";
        circle.className = "breathing-circle grow hold";
    }, 4000);

    // Passo 3: Expirar (4s)
    breathingTimeout2 = setTimeout(() => {
        if (isPaused) return;
        breathText.innerText = "Expirar...";
        circle.className = "breathing-circle";
    }, 8000);
}

// BOTÃO PAUSAR / RETOMAR
btnPausePlay.addEventListener('click', () => {
    if (audioCtx) audioCtx.resume();
    isPaused = !isPaused;
    btnPausePlay.innerText = isPaused ? "Retomar" : "Pausar";
    
    if (isPaused) {
        breathText.innerText = "Pausado";
        circle.className = "breathing-circle hold";
        clearTimeout(breathingTimeout1);
        clearTimeout(breathingTimeout2);
    } else {
        startBreathingCycle();
    }
});

// BOTÃO ENCERRAR ANTES
btnEndEarly.addEventListener('click', () => {
    endSession(false);
});

// FINALIZAR SESSÃO
function endSession(completed) {
    clearInterval(countdownInterval);
    clearInterval(breathingInterval);
    clearTimeout(breathingTimeout1);
    clearTimeout(breathingTimeout2);
    
    if (completed) {
        alert("Sessão Zen Concluída! Você está pronto para focar novamente. 🌟");
        completedSessions++;
        totalMinutesMeditated += Math.round(totalSeconds / 60);
        
        statCompletedDisplay.innerText = completedSessions;
        statMinutesDisplay.innerText = `${totalMinutesMeditated}m`;
    }

    sessionArea.classList.add('hidden');
    setupArea.classList.remove('hidden');
    circle.className = "breathing-circle";
    breathText.innerText = "Inspirar";
}

// ==========================================
// SISTEMA DE SOM SINTETIZADO (WEB AUDIO API)
// ==========================================
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Auxiliar: Gera um Buffer de Ruído Marrom (Chuva profunda / base das ondas)
function getBrownianNoiseBuffer() {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; 
    }
    return noiseBuffer;
}

// SOM 1: CHUVA LEVE SINTETIZADA
function createRainSound() {
    initAudio();
    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = getBrownianNoiseBuffer();
    noiseNode.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.20, audioCtx.currentTime);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    return {
        start: () => noiseNode.start(0),
        stop: () => { try { noiseNode.stop(); } catch(e){} }
    };
}

// SOM 2: ONDAS DO MAR REALISTAS (Ruído Marrom + LFO de Volume)
function createOceanWavesSound() {
    initAudio();
    
    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = getBrownianNoiseBuffer();
    noiseNode.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, audioCtx.currentTime); 

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, audioCtx.currentTime); 

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(0.18, audioCtx.currentTime); 

    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);

    return {
        start: () => {
            noiseNode.start(0);
            lfo.start(0);
        },
        stop: () => {
            try {
                noiseNode.stop();
                lfo.stop();
            } catch(e){}
        }
    };
}

// SOM 3: FLORESTA (Vento nas folhas + Cantos de pássaros aleatórios)
function createForestSound() {
    initAudio();

    const windSource = audioCtx.createBufferSource();
    windSource.buffer = getBrownianNoiseBuffer();
    windSource.loop = true;

    const windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(250, audioCtx.currentTime);

    const windGain = audioCtx.createGain();
    windGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(audioCtx.destination);

    const windLfo = audioCtx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.setValueAtTime(0.05, audioCtx.currentTime); 
    const windLfoGain = audioCtx.createGain();
    windLfoGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windGain.gain);

    let birdsInterval = setInterval(() => {
        if (!audioCtx || audioCtx.state === 'suspended') return;
        playSingleBird();
    }, 4000 + Math.random() * 5000);

    function playSingleBird() {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        const baseFreq = 1600 + Math.random() * 800; 
        osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, audioCtx.currentTime + 0.18);
        
        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.28);
    }

    return {
        start: () => {
            windSource.start(0);
            windLfo.start(0);
        },
        stop: () => {
            try {
                windSource.stop();
                windLfo.stop();
            } catch(e){}
            clearInterval(birdsInterval);
        }
    };
}

// EVENTOS DE CLICK NOS SONS
btnSound1.addEventListener('click', () => {
    initAudio();
    audioCtx.resume();

    if (activeNoiseNode) {
        activeNoiseNode.stop();
        activeNoiseNode = null;
        btnSound1.classList.remove('playing');
    } else {
        stopAllSounds();
        activeNoiseNode = createRainSound();
        activeNoiseNode.start();
        btnSound1.classList.add('playing');
    }
});

btnSound2.addEventListener('click', () => {
    initAudio();
    audioCtx.resume();

    if (activeOscillatorNode) {
        activeOscillatorNode.stop();
        activeOscillatorNode = null;
        btnSound2.classList.remove('playing');
    } else {
        stopAllSounds();
        activeOscillatorNode = createOceanWavesSound();
        activeOscillatorNode.start();
        btnSound2.classList.add('playing');
    }
});

btnSound3.addEventListener('click', () => {
    initAudio();
    audioCtx.resume();

    if (activeForestNode) {
        activeForestNode.stop();
        activeForestNode = null;
        btnSound3.classList.remove('playing');
    } else {
        stopAllSounds();
        activeForestNode = createForestSound();
        activeForestNode.start();
        btnSound3.classList.add('playing');
    }
});

function stopAllSounds() {
    if (activeNoiseNode) { activeNoiseNode.stop(); activeNoiseNode = null; }
    if (activeOscillatorNode) { activeOscillatorNode.stop(); activeOscillatorNode = null; }
    if (activeForestNode) { activeForestNode.stop(); activeForestNode = null; }
    
    btnSound1.classList.remove('playing');
    btnSound2.classList.remove('playing');
    btnSound3.classList.remove('playing');
}