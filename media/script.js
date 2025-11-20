const vscode = acquireVsCodeApi();
const wheelOptions = ['Coding Craze', 'Quick Math', 'Typing Race'];
const segmentColors = ['#FFFFFF', '#FCD8CC', '#E2817B']; // 3 different colors
let spinning = false;

// Fighter selection
document.querySelectorAll('.fighter-option').forEach(fighter => {
    fighter.addEventListener('click', () => {
        const option = fighter.dataset.option;

        // Send message to extension
        vscode.postMessage({ command: 'resolve', option });

        const selectedFighterEl = document.getElementById('selected-fighter');
        selectedFighterEl.textContent = option;

        document.getElementById('main-page').style.display = 'none';
        document.getElementById('wheel-page').style.display = 'block';

        drawWheel();
    });
});

// Listen for messages from extension (optional)
window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'showWheel') {
        console.log('Option chosen:', message.option);
        // Could update diff page dynamically
    }
});

// Draw the wheel
function drawWheel() {
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const num = wheelOptions.length;
    const arc = 2 * Math.PI / num;
    const center = 150; // center of the canvas
    const radius = 140; // wheel radius

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segments
    for (let i = 0; i < num; i++) {
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, i * arc, (i + 1) * arc);
        ctx.closePath();
        // Use distinct color for each segment
        ctx.fillStyle = segmentColors[i];
        ctx.fill();

        // Draw text on each segment
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate((i + 0.5) * arc);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#1E1E1E';
        ctx.font = '20px "Jersey 10"';
        ctx.fillText(wheelOptions[i], radius - 20, 10);
        ctx.restore();
    }

    // Draw outer outline around the entire wheel
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 2;           // thickness of the outline
    ctx.strokeStyle = '#1E1E1E'; // color of the outline
    ctx.stroke();
}


// Spin logic
document.getElementById('spinBtn').addEventListener('click', () => {
    if (spinning) return;
    spinning = true;

    const canvas = document.getElementById('wheel');
    let angle = 0;
    let speed = Math.random() * 0.2 + 0.3;
    let decel = 0.995;

    const anim = setInterval(() => {
        angle += speed;
        speed *= decel;
        canvas.style.transform = 'rotate(' + angle + 'rad)';

        if (speed < 0.01) {
            clearInterval(anim);
            const idx = Math.floor(((2 * Math.PI - (angle % (2 * Math.PI))) / (2 * Math.PI)) * wheelOptions.length) % wheelOptions.length;
            document.getElementById('result').textContent = 'Result: ' + wheelOptions[idx];
            vscode.postMessage({ command: 'finishResult', result: wheelOptions[idx] });
            spinning = false;
        }
    }, 16);
});

// ==== MATH GAME ====

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

function mathGameLogic(message) {
    var lives = 3;

    var opOneLives = 3;
    var opTwoLives = 3;

    document.getElementById('main').classList.remove('active');
    document.getElementById('mathScreen').classList.add('active');

    let questions = [];
    if (message.winner == message.option) {
        message.questions.splice(4, 1);
        questions = message.questions
    } else {
        questions = message.questions.slice(0, 5);
    }
    
    var count = 0;
    var currentQuestion = questions[count];

    document.getElementById('mathLivesDebug').textContent = '[Debug] Lives ' + String(lives) + '/3';
    document.getElementById('mathOp1LivesDebug').textContent = '[Debug] Opponent 1 Lives ' + String(opOneLives) + '/3';
    document.getElementById('mathOp2LivesDebug').textContent = '[Debug] Opponent 2 Lives ' + String(opTwoLives) + '/3';

    document.getElementById('mathWinner').textContent = '[Debug] Player: ' + String(message.option) + ' Winner: ' + String(message.winner);

    document.getElementById('mathQuestionNum').textContent = '[Debug] Question ' + String(count + 1) + '/' + String(questions.length);

    // Display first question
    document.getElementById('mathQuestion').textContent = String(currentQuestion.expression);

    // Logic to decrease opponent lives
    let opOneInterval = null;
    let opTwoInterval = null;
    
    function showWinScreen() {
        clearInterval(opOneInterval);
        clearInterval(opTwoInterval);

        document.getElementById('mathQuestion').textContent = '[Debug] You Win!';

        document.getElementById('mathInput').style.display = 'none';
        document.getElementById('mathButton').style.display = 'none';
        document.getElementById('mathError').style.display = 'none';
    }

    function decreaseOpponentLives() {
        // Only decrease to 0 if player is supposed to win
        if (message.winner == message.option) {
            opOneInterval = setInterval(() => {
                if (opOneLives > 0) {
                    opOneLives--;
                    document.getElementById('mathOp1LivesDebug').textContent = '[Debug] Opponent 1 Lives ' + String(opOneLives) + '/3';
                }
                if (opOneLives === 0 && opOneInterval) {
                    clearInterval(opOneInterval);
                }

                if (opOneLives === 0 && opTwoLives === 0) {
                    showWinScreen()
                }
            }, 2000 + Math.random() * 3000);

            opTwoInterval = setInterval(() => {
                if (opTwoLives > 0) {
                    opTwoLives--;
                    document.getElementById('mathOp2LivesDebug').textContent = '[Debug] Opponent 2 Lives ' + String(opTwoLives) + '/3';
                }
                if (opTwoLives === 0 && opTwoInterval) {
                    clearInterval(opTwoInterval);
                }

                if (opOneLives === 0 && opTwoLives === 0) {
                    showWinScreen()
                }
            }, 2200 + Math.random() * 2000);
        } else {
            // slowly decrease the timers for realism, but never go to zero
            opOneInterval = setInterval(() => {
                if (opOneLives > 0) {
                    opOneLives--;
                    document.getElementById('mathOp1LivesDebug').textContent = '[Debug] Opponent 1 Lives ' + String(opOneLives) + '/3';
                }
                if (opOneLives === 1 && opOneInterval) {
                    clearInterval(opOneInterval);
                }
            }, 5000 + Math.random() * 3000);

            opTwoInterval = setInterval(() => {
                if (opTwoLives > 0) {
                    opTwoLives--;
                    document.getElementById('mathOp2LivesDebug').textContent = '[Debug] Opponent 2 Lives ' + String(opTwoLives) + '/3';
                }
                if (opTwoLives === 1 && opTwoInterval) {
                    clearInterval(opTwoInterval);
                }
            }, 6000 + Math.random() * 2000);
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
                document.getElementById('mathQuestionNum').textContent = '[Debug] Question ' + String(count + 1) + '/' + String(questions.length);
                document.getElementById('mathQuestion').textContent = String(currentQuestion.expression);
                document.getElementById('mathInput').value = '';
                document.getElementById('mathError').textContent = '';
            } else {
                showWinScreen()
            }
        } else {
            lives--;
            if (lives == 0) {
                document.getElementById('mathLivesDebug').textContent = '[Debug] Lives ' + String(lives) + '/3';

                document.getElementById('mathQuestion').textContent = '[Debug] Game Over';

                document.getElementById('mathInput').style.display = 'none';
                document.getElementById('mathButton').style.display = 'none';
                document.getElementById('mathError').style.display = 'none';

                // Stop opponent timers
                if (opOneInterval) clearInterval(opOneInterval);
                if (opTwoInterval) clearInterval(opTwoInterval);

            } else {
                document.getElementById('mathLivesDebug').textContent = '[Debug] Lives ' + String(lives) + '/3';
                document.getElementById('mathInput').value = '';
                document.getElementById('mathError').textContent = getFailureMessage();
            }
            
        }
    };
}

// ==== MATH GAME END ====