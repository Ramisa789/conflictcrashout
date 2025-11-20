
// Utility functions (inline for browser use)
const QUOTES = [
    "You don`t lose when the scoreboard says so, you lose when you give up.",
    "You only fail when you stop believing in yourself.",
    "A bad game doesn`t make you a bad player.",
    "Losing doesn`t define you, it only proves you`re still trying.",
    "Defeat is not an end, it`s a new beginning.",
    "One defeat doesn NOT take away the effort and heart you put in."
];
function getRandomQuote() {
    const idx = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[idx];
}
function calculateWPM(charsTyped, elapsedMs) {
    if (elapsedMs === 0) return 0;
    const words = charsTyped / 5;
    const minutes = elapsedMs / 60000;
    return Math.round(words / minutes);
}
function calculateSPM(charsTyped, elapsedMs) {
    if (elapsedMs === 0) return 0;
    const seconds = elapsedMs / 1000;
    return Math.round(charsTyped / seconds * 60);
}
// Advanced opponent WPM logic using winner, userChoice, opponentChoice
function getOpponentWPM(userWPM, winner, userChoice, opponentChoice) {
    if (!winner || !userChoice || !opponentChoice) {
        // fallback to simple logic if not set
        return userWPM > 0 ? userWPM * 2 : 0;
    }
    if (winner === userChoice) {
        return Math.max(1, userWPM - 1);
    } else {
        return Math.max(1, userWPM * 2);
    }
}

// These will be set from the extension via postMessage
let winner = null;
let userChoice = null;
let opponentChoice = null;

// Listen for values from the extension
window.addEventListener('message', function(event) {
    const message = event.data;
    if (message.command === 'initTypingGame') {
        winner = message.winner;
        userChoice = message.userChoice;
        opponentChoice = message.opponentChoice;
    }
});

const quote = getRandomQuote();
document.getElementById('quote').textContent = quote;

let startTime = null;
let timerStarted = false;

let wpmElem = document.getElementById('wpm');
let spmElem = document.getElementById('spm');
let opponentWpmElem = document.getElementById('opponentWpm');

document.getElementById('typingBox').addEventListener('input', function(e) {
    const input = e.target.value;
    if (!timerStarted && input.length > 0) {
        startTime = Date.now();
        timerStarted = true;
    }
    const elapsed = timerStarted ? Date.now() - startTime : 0;

    // WPM calculation
    const wpm = calculateWPM(input.length, elapsed);
    wpmElem.textContent = 'WPM: ' + wpm;

    // SPM calculation
    const spm = calculateSPM(input.length, elapsed);
    spmElem.textContent = 'SPM: ' + spm;

    // Opponent WPM calculation (now uses advanced logic)
    const opponentWpm = getOpponentWPM(wpm, winner, userChoice, opponentChoice);
    opponentWpmElem.textContent = 'Opponent WPM: ' + opponentWpm;

    // Accuracy calculation
    let correct = 0;
    for (let i = 0; i < input.length; i++) {
        if (input[i] === quote[i]) correct++;
    }
    const accuracy = input.length > 0 ? Math.round((correct / input.length) * 100) : 100;
    document.getElementById('accuracy').textContent = 'Accuracy: ' + accuracy + '%';
});
