const vscode = acquireVsCodeApi();
const wheelOptions = ['Quick Math', 'Typing Race', 'Coding Craze'];
const segmentColors = ['#FFFFFF', '#FCD8CC', '#E2817B']; // 3 colors
let spinning = false;
let selectedOption = null;


// Fighter selection
document.querySelectorAll('.fighter-option').forEach(fighter => {
    fighter.addEventListener('click', () => {
        const option = fighter.dataset.option;
        selectedOption = option;

        // Send message to extension
        vscode.postMessage({ command: 'resolve', option });

        const selectedFighterEl = document.getElementById('selected-fighter');
        selectedFighterEl.textContent = option;

        document.getElementById('main-page').style.display = 'none';
        document.getElementById('wheel-page').style.display = 'block';

        drawWheel();
    });
});

// Draw the wheel
function drawWheel(rotation = 0) {
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const num = wheelOptions.length;
    const arc = 2 * Math.PI / num;
    const center = 150;
    const radius = 140;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < num; i++) {
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, i * arc + rotation, (i + 1) * arc + rotation);
        ctx.closePath();
        ctx.fillStyle = segmentColors[i];
        ctx.fill();

        // Text
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate((i + 0.5) * arc + rotation);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#1E1E1E';
        ctx.font = '20px "Jersey 10"';
        ctx.fillText(wheelOptions[i], radius - 20, 10);
        ctx.restore();
    }

    // Outer outline
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1E1E1E';
    ctx.stroke();
}

// Ease-out function for smooth spin
function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Spin button
document.getElementById('spinBtn').addEventListener('click', () => {
    if (spinning) return;
    spinning = true;

    const spins = Math.floor(Math.random() * 5) + 5; // full rotations
    const chosenIndex = Math.floor(Math.random() * wheelOptions.length);
    const arc = 2 * Math.PI / wheelOptions.length;
    const endRotation = spins * 2 * Math.PI + chosenIndex * arc + arc / 2;
    const duration = 3000;
    const startTime = performance.now();

    function animate(now) {
        const t = (now - startTime) / duration;
        if (t >= 1) {
            spinning = false;
            drawWheel(endRotation);
            showGamePage(chosenIndex);
            return;
        }
        const eased = easeOut(t) * endRotation;
        drawWheel(eased);
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
});

function chooseRandomOpponent(options, userChoice) {
    const opponents = options.filter(opt => opt !== userChoice);
    const randomIndex = Math.floor(Math.random() * opponents.length);
    return opponents[randomIndex];
}

function chooseWeightedWinner(userChoice, opponent) {
    const weighted = [userChoice, opponent, opponent];
    const randomIndex = Math.floor(Math.random() * weighted.length);
    return weighted[randomIndex];
}

function showEndPageAndApplyChanges(game_id, winner) {
    document.getElementById(game_id).style.display = 'none';
    if (winner === selectedOption) {
        document.getElementById('page-win').style.display = 'flex';
    } else {
        document.getElementById('page-lose').style.display = 'flex';
        const loseApplying = document.querySelector('#page-lose .applying');
        if (loseApplying) loseApplying.textContent = `Applying ${winner}...`;
    }
    
    vscode.postMessage({ command: 'finishResult', result: 'Typing Racer', winner: winner, option: selectedOption});
}

// Show game page based on chosen index
function showGamePage(index) {
    // const pages = ['page-coding', 'page-typing', 'page-math'];
    // pages.forEach((id, i) => {
    //     document.getElementById(id).style.display = i === index ? 'block' : 'none';
    // });
    // document.getElementById('page-typing').style.display = 'block'; //TODO: REMOVE LATER
    document.getElementById('page-math').style.display = 'block'; //TODO: REMOVE LATER
    // if (wheelOptions[index] === 'Typing Race') {
    //     startTypingGame();
    // }

    document.getElementById('wheel-page').style.display = 'none';

    // Update selected fighter
    const selectedFighter = document.getElementById('selected-fighter');

    if (selectedFighter) selectedFighter.textContent = wheelOptions[index];
    
    const options = ['Current Changes', 'Incoming Changes', 'Combination'];
    const opponent = chooseRandomOpponent(options, selectedOption);
    const winner = chooseWeightedWinner(selectedOption, opponent);

    // if (pages[index] == 'page-math') {
        vscode.postMessage({ command: 'playMathGame', option: selectedOption, winner })
    // }

    // Notify extension
    // vscode.postMessage({ command: 'finishResult', result: wheelOptions[index], option: selectedOption, winner });
}

// Close extension buttons
document.getElementById('closeBtnWin').addEventListener('click', () => {
    vscode.postMessage({ command: 'closeExtension' });
});

document.getElementById('closeBtnLose').addEventListener('click', () => {
    vscode.postMessage({ command: 'closeExtension' });
});

document.getElementById('iconBtn').addEventListener('click', () => {
    vscode.postMessage({ command: 'closeExtension' });
});

// ==== MATH GAME ====

window.addEventListener('message', function(event) {
    var message = event.data;

    if (message.command === 'displayMathGame') {
        mathGameLogic(message.questions, message.winner, message.option);
    }
});

function getFailureMessage() {
    const messages = [
        "That was not even close...",
        "That answer was... creative.",
        "You might want to brush up on your math skills.",
        "At least you tried. I guess.",
        "Did you even try?",
        "That wasn't even that hard.",
        "Womp womp",
        "...Really?"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

function mathGameLogic(generatedQuestions, winner, option) {
    let questions = [];

    var lives = 3;

    var opponentLives = 3;

    if (winner == option) {
        generatedQuestions.splice(4, 1);
        questions = generatedQuestions;
    } else {
        questions = generatedQuestions.slice(0, 5);
    }
    
    var count = 0;
    var currentQuestion = questions[count];

    let opponentInterval = null;

    function updateLivesDisplay() {
        const heartIconSrc = document.getElementById('heartIconTemplate').src;
        const playerHeartsHtml = `<img src="${heartIconSrc}" height="20px" style="margin: 2px;"/>`.repeat(lives);
        const opponentHeartsHtml = `<img src="${heartIconSrc}" height="20px" style="margin: 2px;"/>`.repeat(opponentLives);
        document.getElementById('playerLivesDisplayMath').innerHTML = playerHeartsHtml;
        document.getElementById('opponentLivesDisplayMath').innerHTML = opponentHeartsHtml;
    }

    function showWin() {
        if (opponentInterval) clearInterval(opponentInterval);
        document.getElementById('page-math').style.display = 'none';
        document.getElementById('page-win').style.display = 'flex';

        const loseApplying = document.querySelector('#page-lose .applying');
        if (loseApplying) loseApplying.textContent = `Applying ${winner}...`;
        
        vscode.postMessage({ command: 'finishResult', result: 'Typing Racer', winner: winner, option: selectedOption});
        // showEndPageAndApplyChanges(2, winner);
        // document.getElementById('page-math').style.display = 'none';
        // document.getElementById('page-win').style.display = 'flex';
    }

    function showLose() {
        if (opponentInterval) clearInterval(opponentInterval);
        document.getElementById('page-math').style.display = 'none';
        document.getElementById('page-lose').style.display = 'flex';

        const loseApplying = document.querySelector('#page-lose .applying');
        if (loseApplying) loseApplying.textContent = `Applying ${winner}...`;

        
        vscode.postMessage({ command: 'finishResult', result: 'Quick Math', winner, option: selectedOption});
        // showEndPageAndApplyChanges(2, winner);
        
        // document.getElementById('page-math').style.display = 'none';
        // document.getElementById('page-lose').style.display = 'flex';
    }

    // Display first question
    updateLivesDisplay();
    document.getElementById('mathQuestion').textContent = String(currentQuestion.expression);
    
    function decreaseOpponentLives() {
        // Only decrease to 0 if player is supposed to win
        if (winner == option) {
            opponentInterval = setInterval(() => {
                if (opponentLives > 0) {
                    opponentLives--;
                    updateLivesDisplay();
                }
                if (opponentLives === 0 && opponentInterval) {
                    clearInterval(opponentInterval);
                }

                if (opponentLives === 0) {
                    showWin()
                }
            }, 2000 + Math.random() * 3000);
        } else {
            // slowly decrease the timers for realism, but never go to zero
            opponentInterval = setInterval(() => {
                if (opponentLives > 0) {
                    opponentLives--;
                    updateLivesDisplay();
                }
                if (opponentLives === 1 && opponentInterval) {
                    clearInterval(opponentInterval);
                }
            }, 5000 + Math.random() * 3000);
        }
    }

    decreaseOpponentLives();

    document.getElementById('mathButton').onclick = function() {
        document.getElementById('mathError').textContent = '';

        var inputVal = document.getElementById('mathInput').value;

        if (inputVal == currentQuestion.solution) {
            if (count < questions.length - 1) {
                count++;
                currentQuestion = questions[count];
                document.getElementById('mathQuestion').textContent = String(currentQuestion.expression);
                document.getElementById('mathInput').value = '';
                document.getElementById('mathError').textContent = '';
            } else {
                showWin()
            }
        } else {
            lives--;
            if (lives == 0) {
                updateLivesDisplay()
                showLose()

            } else {
                updateLivesDisplay();
                document.getElementById('mathInput').value = '';
                document.getElementById('mathError').textContent = getFailureMessage();
            }
            
        }
    };
}

// ==== MATH GAME END ====

// ==== TYPING RACE GAME START ====
function getRandomQuote() {
    const QUOTES = [
            "You don't lose when the scoreboard says so, you lose when you give up.",
            "You only fail when you stop believing in yourself.",
            "A bad game doesn't make you a bad player.",
            "Losing doesn't define you, it only proves you're still trying.",
            "Defeat is not an end, it's a new beginning.",
            "One defeat doesn NOT take away the effort and heart you put in."
        ];
    const idx = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[idx];
}

function calculateWPM(charsTyped, elapsedMs) {
    if (elapsedMs === 0) return 0;
    const words = charsTyped / 5;
    const minutes = elapsedMs / 60000;
    return Math.round(words / minutes);
}

function getOpponentWPM(userWPM, winner) {
    if (winner === selectedOption) {
        // Opponent is just 1 WPM slower than user
        return Math.max(1, userWPM - 1);
    } else {
        // Opponent won and is double the user's WPM
        return Math.max(1, userWPM * 2);
    }
}

function startTypingGame() {
    const quote = getRandomQuote();
    document.getElementById('typing-quote').textContent = quote;
    let startTime = null;
    let timerStarted = false;
    let wpmElem = document.getElementById('wpm');
    let opponentWpmElem = document.getElementById('opponentWpm');
    let typingBox = document.getElementById('typingBox');
    typingBox.value = '';
    wpmElem.textContent = 'WPM: 0';
    opponentWpmElem.textContent = 'WPM: 0';
    typingBox.oninput = function(e) {
        const input = e.target.value;
        if (!timerStarted && input.length > 0) {
            startTime = Date.now();
            timerStarted = true;
        }
        const elapsed = timerStarted ? Date.now() - startTime : 0;
        const wpm = calculateWPM(input.length, elapsed);
        wpmElem.textContent = 'WPM: ' + wpm;
        const winner = 'Combination'
        const opponentWpm = getOpponentWPM(wpm, winner);
        opponentWpmElem.textContent = 'WPM: ' + opponentWpm;
        let correct = 0;
        for (let i = 0; i < input.length; i++) {
            if (input[i] === quote[i]) correct++;
        }
    };
    typingBox.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const vscode = acquireVsCodeApi();
            vscode.postMessage({ command: 'applyWinner', winner: winner });
        }
    });


}

// ==== TYPING RACE GAME END ====
