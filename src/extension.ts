// import { resolveAllConflicts } from './utils';
// import { MergeOption, GameOption } from './types';
// import * as vscode from 'vscode';




// export function activate(context: vscode.ExtensionContext) {
//     vscode.workspace.onDidOpenTextDocument((doc) => {
//         if (hasMergeConflict(doc.getText())) {
//             vscode.window.showInformationMessage(
//                 'Merge conflict detected! Play a game to resolve?',
//                 'Play'
//             ).then(selection => {
//                 if (selection === 'Play') {
//                     openGameWebview(context, doc);
//                 }
//             });
//         }
//     });
// }

// function hasMergeConflict(text: string): boolean {
//     return text.includes('<<<<<<<') && text.includes('=======');
// }


// function openGameWebview(context: vscode.ExtensionContext, doc: vscode.TextDocument) {
//     const panel = vscode.window.createWebviewPanel(
//         'mergeGame',
//         'Merge Conflict Game',
//         vscode.ViewColumn.One,
//         { enableScripts: true }
//     );

//     // Get the URI for typing_game.html for the webview
//     const typingGameHtmlUri = panel.webview.asWebviewUri(
//         vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'typing_game.html')
//     );

//     panel.webview.html = `
//         <html>
//         <head>
//             <style>
//                 #main, #wheelScreen { display: none; }
//                 #main.active, #wheelScreen.active { display: block; }
//                 #choice { margin-top: 20px; font-weight: bold; }
//                 .wheel-container { margin: 40px auto; width: 300px; text-align: center; }
//                 #wheel { width: 300px; height: 300px; border-radius: 50%; border: 8px solid #333; position: relative; overflow: hidden; }
//                 #spinBtn { margin-top: 20px; padding: 10px 30px; font-size: 18px; }
//                 #pointer { position: absolute; left: 50%; top: -30px; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-bottom: 30px solid #e11d48; z-index: 2; }
//             </style>
//         </head>
//         <body>
//             <div id="main" class="active">
//                 <h2>Conflict Crashout</h2>
//                 <button id="currentBtn">${MergeOption.Current}</button>
//                 <button id="incomingBtn">${MergeOption.Incoming}</button>
//                 <button id="combinationBtn">${MergeOption.Combination}</button>
//             </div>
//             <div id="typingGameContainer" style="display:none; width:100%; height:400px;">
//                 <iframe id="typingGameFrame" src="${typingGameHtmlUri}" style="width:100%; height:100%; border:none;"></iframe>
//             </div>
//             <div id="typingGameContainer" style="display:none; width:100%; height:400px;">
//                 <iframe id="typingGameFrame" src="${typingGameHtmlUri}" style="width:100%; height:100%; border:none;"></iframe>
//             </div>
//             <script>
//                 const vscode = acquireVsCodeApi();
//                 let winnerFromExtension = null;
//                 let userChoiceFromExtension = null;
//                 let opponentFromExtension = null;
//                 // Spinner game options as enum values
//                 const GameOption = {
//                     SurpriseEasy: '${GameOption.SurpriseEasy}',
//                     MathFun: '${GameOption.MathFun}',
//                     TypingSpeed: '${GameOption.TypingSpeed}',
//                     Matching: '${GameOption.Matching}'
//                 };
//                 // Option selection: immediately start typing game
//                 function startTypingGame(option) {
//                     // Simulate backend logic for opponent and winner
//                     const options = ['${MergeOption.Current}', '${MergeOption.Incoming}', '${MergeOption.Combination}'];
//                     const opponents = options.filter(opt => opt !== option);
//                     const opponent = opponents[Math.floor(Math.random() * opponents.length)];
//                     const weighted = [option, opponent, opponent];
//                     const winner = weighted[Math.floor(Math.random() * weighted.length)];
//                     // Hide main, show typing game
//                     document.getElementById('main').classList.remove('active');
//                     document.getElementById('typingGameContainer').style.display = 'block';
//                     // Pass values to the iframe
//                     const frame = document.getElementById('typingGameFrame');
//                     frame.contentWindow.postMessage({
//                         command: 'initTypingGame',
//                         winner: winner,
//                         userChoice: option,
//                         opponentChoice: opponent
//                     }, '*');
//                 }
//                 document.getElementById('currentBtn').onclick = () => startTypingGame('${MergeOption.Current}');
//                 document.getElementById('incomingBtn').onclick = () => startTypingGame('${MergeOption.Incoming}');
//                 document.getElementById('combinationBtn').onclick = () => startTypingGame('${MergeOption.Combination}');
//                 // Spinner uses enum values
//                 const wheelOptions = [
//                     GameOption.SurpriseEasy,
//                     GameOption.MathFun,
//                     GameOption.TypingSpeed,
//                     GameOption.Matching
//                 ];
//                 let spinning = false;
//                 function drawWheel() {
//                     const canvas = document.getElementById('wheel');
//                     const ctx = canvas.getContext('2d');
//                     const num = wheelOptions.length;
//                     const arc = 2 * Math.PI / num;
//                     for (let i = 0; i < num; i++) {
//                         ctx.beginPath();
//                         ctx.moveTo(150, 150);
//                         ctx.arc(150, 150, 140, i * arc, (i + 1) * arc);
//                         ctx.closePath();
//                         ctx.fillStyle = i % 2 === 0 ? '#3b82f6' : '#fbbf24';
//                         ctx.fill();
//                         ctx.save();
//                         ctx.translate(150, 150);
//                         ctx.rotate((i + 0.5) * arc);
//                         ctx.textAlign = 'right';
//                         ctx.fillStyle = '#fff';
//                         ctx.font = '18px sans-serif';
//                         ctx.fillText(wheelOptions[i], 120, 10);
//                         ctx.restore();
//                     }
//                 }
//                 document.getElementById('spinBtn').onclick = function() {
//                     if (spinning) return;
//                     spinning = true;
//                     const canvas = document.getElementById('wheel');
//                     let angle = 0;
//                     let speed = Math.random() * 0.2 + 0.3;
//                     let decel = 0.995;
//                     let anim = setInterval(function() {
//                         angle += speed;
//                         speed *= decel;
//                         canvas.style.transform = 'rotate(' + angle + 'rad)';
//                         if (speed < 0.01) {
//                             clearInterval(anim);
//                             // Randomly select a game option
//                             const idx = Math.floor(Math.random() * wheelOptions.length);
//                             // const selectedGame = wheelOptions[idx];
//                             selectedGame = GameOption.TypingSpeed;
//                             document.getElementById('result').textContent = 'Game: ' + selectedGame + ' ... Winner: ' + winnerFromExtension;
//                             // Call a function based on the selected game
//                             if (selectedGame === GameOption.SurpriseEasy) {
//                                 // playSurpriseEasyGame(userChoiceFromExtension, opponentFromExtension, winnerFromExtension);
//                             } else if (selectedGame === GameOption.MathFun) {
//                                 // playMathFunGame(userChoiceFromExtension, opponentFromExtension, winnerFromExtension);
//                             } else if (selectedGame === GameOption.TypingSpeed) {
//                                 // Send message to start typing game with winner, userChoice, opponentChoice
//                                 vscode.postMessage({
//                                     command: 'initTypingGame',
//                                     winner: winnerFromExtension,
//                                     userChoice: userChoiceFromExtension,
//                                     opponentChoice: opponentFromExtension
//                                 });
//                             } else if (selectedGame === GameOption.Matching) {
//                                 // playMatchingGame(userChoiceFromExtension, opponentFromExtension, winnerFromExtension);
//                             }
//                             spinning = false;
//                         }
//                     }, 16);
//                 };
//             </script>
//         </body>
//         </html>
//     `;

//     panel.webview.onDidReceiveMessage(
//         async message => {
//             if (message.command === 'resolve') {
//                 // Store user choice as enum
//                 const userChoice: MergeOption = message.option as MergeOption;
//                 const options = [MergeOption.Current, MergeOption.Incoming, MergeOption.Combination];
//                 const opponent = chooseRandomOpponent(options, userChoice);
//                 const winner = chooseWeightedWinner(userChoice, opponent);
//                 // Switch to wheel screen and show the chosen option, and send winner and opponent
//                 panel.webview.postMessage({ command: 'showWheel', option: userChoice, opponent, winner });
//                 // After the game, resolve all conflicts with the winner
//                 // Uncomment the next line to auto-resolve after the game:
//                 await resolveAllConflicts(doc, winner);
//             }
//         },
//         undefined,
//         context.subscriptions
//     );
// }


// // Randomly choose one of the two options not picked by the user
// function chooseRandomOpponent(options: MergeOption[], userChoice: MergeOption): MergeOption {
//     const opponents = options.filter(opt => opt !== userChoice);
//     const randomIndex = Math.floor(Math.random() * opponents.length);
//     return opponents[randomIndex];
// }

// // Choose between user and opponent, with more weight on the opponent
// function chooseWeightedWinner(userChoice: MergeOption, opponent: MergeOption): MergeOption {
//     const weighted: MergeOption[] = [userChoice, opponent, opponent]; // 2x weight for opponent
//     const randomIndex = Math.floor(Math.random() * weighted.length);
//     return weighted[randomIndex];
// }

// export function deactivate() {}



import * as vscode from 'vscode';
import { resolveAllConflicts } from './utils';
import { MergeOption } from './types';

export function activate(context: vscode.ExtensionContext) {
    vscode.workspace.onDidOpenTextDocument((doc) => {
        if (hasMergeConflict(doc.getText())) {
            vscode.window.showInformationMessage(
                'Merge conflict detected! Play a game to resolve?',
                'Play'
            ).then(selection => {
                if (selection === 'Play') {
                    openGameWebview(context, doc);
                }
            });
        }
    });
}

function hasMergeConflict(text: string): boolean {
    return text.includes('<<<<<<<') && text.includes('=======');
}

function openGameWebview(context: vscode.ExtensionContext, doc: vscode.TextDocument) {
    const panel = vscode.window.createWebviewPanel(
        'mergeGame',
        'Merge Conflict Typing Game',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    // Helper to map string to MergeOption
    function toMergeOption(str: string): MergeOption {
        if (str === 'Current Changes') return MergeOption.Current;
        if (str === 'Incoming Changes') return MergeOption.Incoming;
        if (str === 'Combination') return MergeOption.Combination;
        return MergeOption.Current;
    }

    panel.webview.onDidReceiveMessage(async message => {
        if (message.command === 'applyWinner') {
            const winner = toMergeOption(message.winner);
            await resolveAllConflicts(doc, winner);
            vscode.window.showInformationMessage('Applied: ' + winner);
            panel.dispose();
        }
    });

    panel.webview.html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Typing Game</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 40px; }
        #main { margin-bottom: 30px; }
        #quote { color: #333; margin-bottom:10px; font-size:18px; }
        #typingBox { border: 1px solid #bbb; border-radius: 4px; padding: 8px; box-sizing: border-box; width:100%; font-size:16px; }
        #stats { margin-top:10px; }
    </style>
</head>
<body>
    <div id="main">
        <h2>Conflict Crashout</h2>
        <button id="currentBtn">Current Changes</button>
        <button id="incomingBtn">Incoming Changes</button>
        <button id="combinationBtn">Combination</button>
    </div>
    <div id="typingGame" style="display:none;">
        <div id="quote"></div>
        <textarea id="typingBox" rows="3" placeholder="Start typing here..."></textarea>
        <div id="stats">
            <span id="wpm">WPM: 0</span> |
            <span id="spm">SPM: 0</span> |
            <span id="opponentWpm">Opponent WPM: 0</span> |
            <span id="accuracy">Accuracy: 100%</span>
        </div>
    </div>
    <script>
    window.onload = function() {
        const QUOTES = [
            'You don\\'t lose when the scoreboard says so, you lose when you give up.',
            'You only fail when you stop believing in yourself.',
            'A bad game doesn\\'t make you a bad player.',
            'Losing doesn\\'t define you, it only proves you\\'re still trying.',
            'Defeat is not an end, it\\'s a new beginning.',
            'One defeat doesn NOT take away the effort and heart you put in.'
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
        function getOpponentWPM(userWPM, winner, userChoice, opponentChoice) {
            if (!winner || !userChoice || !opponentChoice) {
                return userWPM > 0 ? userWPM * 2 : 0;
            }
            if (winner === userChoice) {
                return Math.max(1, userWPM - 1);
            } else {
                return Math.max(1, userWPM * 2);
            }
        }
        let winner = null;
        let userChoice = null;
        let opponentChoice = null;
        function startTypingGame(option) {
            const options = ['Current Changes', 'Incoming Changes', 'Combination'];
            const opponents = options.filter(opt => opt !== option);
            opponentChoice = opponents[Math.floor(Math.random() * opponents.length)];
            const weighted = [option, opponentChoice, opponentChoice];
            winner = weighted[Math.floor(Math.random() * weighted.length)];
            userChoice = option;
            document.getElementById('main').style.display = 'none';
            document.getElementById('typingGame').style.display = 'block';
            const quote = getRandomQuote();
            document.getElementById('quote').textContent = quote;
            let startTime = null;
            let timerStarted = false;
            let wpmElem = document.getElementById('wpm');
            let spmElem = document.getElementById('spm');
            let opponentWpmElem = document.getElementById('opponentWpm');
            let typingBox = document.getElementById('typingBox');
            let accuracyElem = document.getElementById('accuracy');
            typingBox.value = '';
            wpmElem.textContent = 'WPM: 0';
            spmElem.textContent = 'SPM: 0';
            opponentWpmElem.textContent = 'Opponent WPM: 0';
            accuracyElem.textContent = 'Accuracy: 100%';
            typingBox.oninput = function(e) {
                const input = e.target.value;
                if (!timerStarted && input.length > 0) {
                    startTime = Date.now();
                    timerStarted = true;
                }
                const elapsed = timerStarted ? Date.now() - startTime : 0;
                const wpm = calculateWPM(input.length, elapsed);
                wpmElem.textContent = 'WPM: ' + wpm;
                const spm = calculateSPM(input.length, elapsed);
                spmElem.textContent = 'SPM: ' + spm;
                const opponentWpm = getOpponentWPM(wpm, winner, userChoice, opponentChoice);
                opponentWpmElem.textContent = 'Opponent WPM: ' + opponentWpm;
                let correct = 0;
                for (let i = 0; i < input.length; i++) {
                    if (input[i] === quote[i]) correct++;
                }
                const accuracy = input.length > 0 ? Math.round((correct / input.length) * 100) : 100;
                accuracyElem.textContent = 'Accuracy: ' + accuracy + '%';
            };
            typingBox.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({ command: 'applyWinner', winner: winner });
                }
            });
        }
        document.getElementById('currentBtn').onclick = () => startTypingGame('Current Changes');
        document.getElementById('incomingBtn').onclick = () => startTypingGame('Incoming Changes');
        document.getElementById('combinationBtn').onclick = () => startTypingGame('Combination');
    };
    </script>
</body>
</html>
    `;
}

export function deactivate() {}