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

// Show game page based on chosen index
function showGamePage(index) {
    // const pages = ['page-coding', 'page-typing', 'page-math'];
    // pages.forEach((id, i) => {
    //     document.getElementById(id).style.display = i === index ? 'block' : 'none';
    // });
    document.getElementById('page-coding').style.display = 'block'; //TODO: REMOVE LATER
    
    document.getElementById('wheel-page').style.display = 'none';

    // Update selected fighter
    const selectedFighter = document.getElementById('selected-fighter');

    if (selectedFighter) selectedFighter.textContent = wheelOptions[index];
    
    const options = ['Current Changes', 'Incoming Changes', 'Combination'];
    const opponent = chooseRandomOpponent(options, selectedOption);
    const winner = chooseWeightedWinner(selectedOption, opponent);
    
    // Start coding game with winner info
    startCodingGame(winner, selectedOption);

    if (pages[index] == 'page-math') {
        vscode.postMessage({ command: 'playMathGame', option: selectedOption, winner })
    }
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
        mathGameLogic(message.questions, message.option, message.winner);
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

    var opOneLives = 3;
    var opTwoLives = 3;

    // document.getElementById('main').classList.remove('active');
    // document.getElementById('mathScreen').classList.add('active');

    if (winner == option) {
        generatedQuestions.splice(4, 1);
        questions = generatedQuestions;
    } else {
        questions = generatedQuestions.slice(0, 5);
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
        if (winner == option) {
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
                    showWinScreen();
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

// ==== CODING CRAZE GAME START ====
function startCodingGame(winner, userChoice) {
    let playerLives = 3;
    let opponentLives = 3;
    let opponentInterval = null;
    
    // Sample problem - in production this would come from the backend
    const problem = {
        id: 1,
        title: "Sum of Two Numbers",
        description: "Fix the syntax so the function returns the sum of two numbers.",
        code: "function solution(a, b {\n    return a + b;\n}",
        testCases: [
            { input: [1, 2], expected: 3 },
            { input: [5, 7], expected: 12 },
            { input: [-1, 1], expected: 0 }
        ]
    };

    // Display the problem
    document.getElementById('codingTitle').textContent = problem.title;
    document.getElementById('codingDescription').textContent = problem.description;
    document.getElementById('codeInput').value = problem.code;
    
    // Display test cases
    const testCasesDiv = document.getElementById('testCases');
    testCasesDiv.innerHTML = problem.testCases
        .map((tc, i) => `<p>Test ${i + 1}: Input: ${JSON.stringify(tc.input)}, Expected: ${JSON.stringify(tc.expected)}</p>`)
        .join('');
    
    // Simulate opponent solving based on who should win
    function simulateOpponent() {
        if (winner === userChoice) {
            // Player should win - opponent loses lives faster
            opponentInterval = setInterval(() => {
                if (opponentLives > 0) {
                    opponentLives--;
                    if (opponentLives === 0) {
                        clearInterval(opponentInterval);
                    }
                }
            }, 8000 + Math.random() * 4000);
        } else {
            // Opponent should win - slower life loss, stops at 1
            opponentInterval = setInterval(() => {
                if (opponentLives > 1) {
                    opponentLives--;
                }
            }, 15000 + Math.random() * 5000);
        }
    }
    
    function showWinPage() {
        if (opponentInterval) clearInterval(opponentInterval);
        document.getElementById('page-coding').style.display = 'none';
        document.getElementById('page-win').style.display = 'flex';
        // Apply the winner's changes to resolve merge conflict
        vscode.postMessage({ command: 'finishResult', result: 'win', winner: winner });
    }
    
    function showLosePage() {
        if (opponentInterval) clearInterval(opponentInterval);
        document.getElementById('page-coding').style.display = 'none';
        document.getElementById('page-lose').style.display = 'flex';
        // Apply the winner's changes to resolve merge conflict
        vscode.postMessage({ command: 'finishResult', result: 'lose', winner: winner });
    }
    
    // Start opponent simulation
    simulateOpponent();
    
    // Run Tests button
    document.getElementById('runCodeBtn').onclick = function() {
        const userCode = document.getElementById('codeInput').value;
        const results = validateCode(userCode, problem.testCases);
        
        const resultsDiv = document.getElementById('codeResults');
        resultsDiv.innerHTML = `<h3 style="font-family: 'Jersey 10'; font-size: 24px; color: #A12523;">Test Results (${results.passed}/${results.total} passed):</h3>`;
        results.results.forEach(result => {
            const p = document.createElement('p');
            p.textContent = result;
            p.style.color = result.startsWith('✓') ? '#2d7a2d' : '#A12523';
            p.style.fontWeight = 'bold';
            resultsDiv.appendChild(p);
        });
        
        // Check win/lose conditions
        if (results.passed === results.total) {
            // All tests passed - check if opponent is out
            if (opponentLives === 0) {
                showWinPage();
            }
        } else {
            // Tests failed - player loses a life
            playerLives--;
            if (playerLives === 0) {
                showLosePage();
            }
        }
    };
}

function validateCode(userCode, testCases) {
    const results = [];
    let passed = 0;
    
    try {
        const wrappedCode = `${userCode}\nreturn solution;`;
        const solutionFunc = new Function(wrappedCode)();
        
        testCases.forEach((testCase, i) => {
            try {
                const result = solutionFunc(...testCase.input);
                const isCorrect = JSON.stringify(result) === JSON.stringify(testCase.expected);
                
                if (isCorrect) {
                    passed++;
                    results.push(`✓ Test ${i + 1} passed`);
                } else {
                    results.push(`✗ Test ${i + 1} failed: Expected ${JSON.stringify(testCase.expected)}, got ${JSON.stringify(result)}`);
                }
            } catch (err) {
                results.push(`✗ Test ${i + 1} error: ${err.message}`);
            }
        });
    } catch (err) {
        results.push(`✗ Syntax error: ${err.message}`);
    }
    
    return { passed, total: testCases.length, results };
}
// ==== CODING CRAZE GAME END ====
