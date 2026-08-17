// ESPAÇO ZEN — LIGHT ORGANIC THEME

// DOM Elements
const setupView = document.getElementById('setup-view');
const sessionView = document.getElementById('session-view');
const timerDisplay = document.getElementById('timer-display');
const rippleCircle = document.getElementById('ripple-circle');
const breathText = document.getElementById('breath-text');
const zenQuote = document.getElementById('zen-quote');
const zenGreeting = document.getElementById('zen-greeting');

const timeButtons = document.querySelectorAll('.time-btn');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnEnd = document.getElementById('btn-end');

const soundToggle = document.getElementById('btn-sound-toggle');
const soundDrawer = document.getElementById('sound-drawer');
const btnSoundClose = document.getElementById('btn-sound-close');
const btnSounds = [
    document.getElementById('btn-sound-1'),
    document.getElementById('btn-sound-2'),
    document.getElementById('btn-sound-3')
];
const volumeSlider = document.getElementById('volume-slider');

const statCompleted = document.getElementById('stat-completed');
const statMinutes = document.getElementById('stat-minutes');
const statStreak = document.getElementById('stat-streak');

const modalOverlay = document.getElementById('modal-overlay');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Novas Funções DOM
const intentionInput = document.getElementById('intention-input');
const sessionIntention = document.getElementById('session-intention');
const modeButtons = document.querySelectorAll('.mode-btn');

// State
let totalSeconds = 300;
let secondsLeft = 300;
let countdownInterval = null;
let isPaused = false;
let breathTimeouts = [];

let stats = {
    completed: 0,
    minutes: 0,
    streak: 0,
    lastDate: null
};

// Breathing Modes Config
const breathModes = {
    classic: [
        { time: 4000, text: 'Inspirar', class: 'ripple-circle grow' },
        { time: 4000, text: 'Reter', class: 'ripple-circle grow hold' },
        { time: 4000, text: 'Expirar', class: 'ripple-circle' }
    ],
    relax: [
        { time: 4000, text: 'Inspirar', class: 'ripple-circle grow' },
        { time: 7000, text: 'Reter', class: 'ripple-circle grow hold' },
        { time: 8000, text: 'Expirar', class: 'ripple-circle' }
    ],
    box: [
        { time: 4000, text: 'Inspirar', class: 'ripple-circle grow' },
        { time: 4000, text: 'Reter', class: 'ripple-circle grow hold' },
        { time: 4000, text: 'Expirar', class: 'ripple-circle' },
        { time: 4000, text: 'Vazio', class: 'ripple-circle hold-empty' }
    ]
};
let currentBreathMode = 'classic';
let currentBreathStep = 0;

// Quotes
const quotes = [
    "O silêncio não é vazio, ele está cheio de respostas.",
    "Acalme a mente e a alma falará.",
    "Respire fundo. Deixe ir o que você não pode controlar.",
    "Sua paz interior é o seu maior poder.",
    "Apenas seja aqui e agora.",
    "A mente clara é como a água mansa."
];

// Audio
let audioCtx = null;
let masterGainNode = null;
let currentVolume = 0.5;
let activeSoundNode = null; 
let activeSoundIndex = -1;

// INIT
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    setGreeting();
    zenQuote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
});

function setGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) zenGreeting.textContent = 'Bom dia.';
    else if (hour >= 12 && hour < 18) zenGreeting.textContent = 'Boa tarde.';
    else if (hour >= 18 && hour < 22) zenGreeting.textContent = 'Boa noite.';
    else zenGreeting.textContent = 'Noite serena.';
}

// STORAGE
function loadStats() {
    try {
        const d = JSON.parse(localStorage.getItem('espacozen_org'));
        if (d) stats = d;
        
        const today = new Date().toDateString();
        if (stats.lastDate !== today) {
            const yest = new Date();
            yest.setDate(yest.getDate() - 1);
            if (stats.lastDate !== yest.toDateString() && stats.lastDate !== null) {
                stats.streak = 0;
            }
        }
        updateStatsUI();
    } catch (e) {}
}

function saveStats() {
    try {
        localStorage.setItem('espacozen_org', JSON.stringify(stats));
    } catch(e) {}
}

function updateStatsUI() {
    statCompleted.textContent = `${stats.completed} sessões`;
    statMinutes.textContent = `${stats.minutes} min`;
    statStreak.textContent = `${stats.streak} 🔥`;
}

// TIME PICKER & MODE PICKER
timeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        timeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        totalSeconds = parseInt(btn.getAttribute('data-time'));
        secondsLeft = totalSeconds;
    });
});

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentBreathMode = btn.getAttribute('data-mode');
    });
});

// START
btnStart.addEventListener('click', () => {
    if(!audioCtx) initAudio();
    if(audioCtx) audioCtx.resume();

    // Tocar sino tibetano suave
    playTibetanBell();

    // Definir intenção
    const intention = intentionInput.value.trim();
    sessionIntention.textContent = intention;

    setupView.classList.add('hidden');
    setTimeout(() => {
        sessionView.classList.remove('hidden');
        
        secondsLeft = totalSeconds;
        isPaused = false;
        btnPause.textContent = 'Pausar';
        updateTimerDisplay();
        
        startTimer();
        startBreathingCycle();
    }, 1500); 
});

function updateTimerDisplay() {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
}

// TIMER
function startTimer() {
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        if (!isPaused) {
            secondsLeft--;
            updateTimerDisplay();
            if (secondsLeft <= 0) endSession(true);
        }
    }, 1000);
}

// BREATHING LOGIC
function startBreathingCycle() {
    breathTimeouts.forEach(clearTimeout);
    breathTimeouts = [];
    currentBreathStep = 0;
    executeBreathStep();
}

function executeBreathStep() {
    if (isPaused) return;
    
    const steps = breathModes[currentBreathMode];
    const step = steps[currentBreathStep];

    // Mudar UI
    breathText.style.opacity = '0';
    setTimeout(() => { 
        if(!isPaused) {
            breathText.textContent = step.text; 
            breathText.style.opacity = '1'; 
        }
    }, 300);
    rippleCircle.className = step.class;

    // Agendar próximo passo
    const timeoutId = setTimeout(() => {
        currentBreathStep = (currentBreathStep + 1) % steps.length;
        executeBreathStep();
    }, step.time);
    
    breathTimeouts.push(timeoutId);
}

// PAUSE / END
btnPause.addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        btnPause.textContent = 'Retomar';
        breathText.textContent = 'Pausado';
        rippleCircle.className = 'ripple-circle hold';
        breathTimeouts.forEach(clearTimeout);
    } else {
        btnPause.textContent = 'Pausar';
        startBreathingCycle();
    }
});

btnEnd.addEventListener('click', () => endSession(false));

function endSession(completed) {
    clearInterval(countdownInterval);
    breathTimeouts.forEach(clearTimeout);
    rippleCircle.className = 'ripple-circle';
    
    stopSound(); 
    playTibetanBell(); // Tocar sino no fim

    if (completed) {
        stats.completed++;
        stats.minutes += Math.round(totalSeconds / 60);
        
        const today = new Date().toDateString();
        if (stats.lastDate !== today) {
            stats.streak++;
            stats.lastDate = today;
        }
        saveStats();
        updateStatsUI();

        modalOverlay.classList.remove('hidden');
    } else {
        backToSetup();
    }
}

modalCloseBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    backToSetup();
});

function backToSetup() {
    sessionView.classList.add('hidden');
    setTimeout(() => {
        setupView.classList.remove('hidden');
        zenQuote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
        intentionInput.value = ''; // Reset
    }, 1500);
}

// DRAWER
soundToggle.addEventListener('click', () => soundDrawer.classList.add('open'));
btnSoundClose.addEventListener('click', () => soundDrawer.classList.remove('open'));

// AUDIO ENGINE
volumeSlider.addEventListener('input', () => {
    currentVolume = parseInt(volumeSlider.value) / 100;
    if (masterGainNode) {
        masterGainNode.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, 0.05);
    }
});

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioCtx.createGain();
        masterGainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
        masterGainNode.connect(audioCtx.destination);
    }
}

// Sino Tibetano Sintético (Novo)
function playTibetanBell() {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Frequência harmónica calmante
    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, t); 
    
    // Attack suave, Decay longo
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 6);
    
    osc.connect(gain);
    gain.connect(masterGainNode);
    
    osc.start(t);
    osc.stop(t + 6);
}

// Background Sounds
function getBrownianNoiseBuffer() {
    const size = 2 * audioCtx.sampleRate;
    const buf = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
    const out = buf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < size; i++) {
        const white = Math.random() * 2 - 1;
        out[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = out[i];
        out[i] *= 3.5;
    }
    return buf;
}

const soundGenerators = [
    // 1. Rain
    () => {
        const src = audioCtx.createBufferSource();
        src.buffer = getBrownianNoiseBuffer();
        src.loop = true;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.2;
        src.connect(filter); filter.connect(gain); gain.connect(masterGainNode);
        return { start: () => src.start(0), stop: () => src.stop() };
    },
    // 2. Waves
    () => {
        const src = audioCtx.createBufferSource();
        src.buffer = getBrownianNoiseBuffer();
        src.loop = true;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.01;
        src.connect(filter); filter.connect(gain); gain.connect(masterGainNode);
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.18;
        lfo.connect(lfoGain); lfoGain.connect(gain.gain);
        return { start: () => { src.start(0); lfo.start(0); }, stop: () => { src.stop(); lfo.stop(); } };
    },
    // 3. Forest
    () => {
        const src = audioCtx.createBufferSource();
        src.buffer = getBrownianNoiseBuffer();
        src.loop = true;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 250;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.08;
        src.connect(filter); filter.connect(gain); gain.connect(masterGainNode);
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.05;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.04;
        lfo.connect(lfoGain); lfoGain.connect(gain.gain);
        return { start: () => { src.start(0); lfo.start(0); }, stop: () => { src.stop(); lfo.stop(); } };
    }
];

btnSounds.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        if(!audioCtx) initAudio();
        audioCtx.resume();
        
        if (activeSoundIndex === index) {
            stopSound();
        } else {
            stopSound();
            activeSoundNode = soundGenerators[index]();
            activeSoundNode.start();
            activeSoundIndex = index;
            btn.classList.add('playing');
        }
    });
});

function stopSound() {
    if (activeSoundNode) {
        try { activeSoundNode.stop(); } catch(e){}
        activeSoundNode = null;
    }
    activeSoundIndex = -1;
    btnSounds.forEach(b => b.classList.remove('playing'));
}