import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import vm from 'node:vm';
import ts from 'typescript';

interface BuggyProblem {
    id: number;
    title: string;
    description: string;
    code: string;
    testCases: { input: any[]; expected: any }[];
}

// --- Load all problems once ---
const problemsPath = path.join(__dirname, 'code_problems.json');
const allProblems: BuggyProblem[] = JSON.parse(fs.readFileSync(problemsPath, 'utf-8'));

// Track progress in memory
let currentProblemIndex = 0;
let problemPanel: vscode.WebviewPanel | null = null;

// --- TypeScript compilation ---
function compileTypeScript(code: string): { success: boolean; js?: string; error?: string } {
    try {
        const result = ts.transpileModule(code, {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
        });
        return { success: true, js: result.outputText };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// --- Run JS code safely ---
function runUserCode(jsCode: string): { success: boolean; error?: string } {
    try {
        const script = new vm.Script(jsCode);
        const context = vm.createContext({});
        script.runInContext(context, { timeout: 1000 });
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// --- Run tests ---
function runUserTests(jsCode: string, testCases: { input: any[]; expected: any }[]): { success: boolean; error?: string } {
    try {
        const context = vm.createContext({});
        const script = new vm.Script(jsCode);
        script.runInContext(context, { timeout: 1000 });

        if (typeof context['solution'] !== 'function') {
            return { success: false, error: 'Define your function as `function solution(...) {}`' };
        }

        for (const test of testCases) {
            const result = context['solution'](...test.input);
            if (JSON.stringify(result) !== JSON.stringify(test.expected)) {
                return {
                    success: false,
                    error: `❌ Test case failed\nInput: ${JSON.stringify(test.input)}\nExpected: ${JSON.stringify(test.expected)}\nGot: ${JSON.stringify(result)}`
                };
            }
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

function createProblemHTML(problem: BuggyProblem, userChoice?: string, opponent?: string, winner?: string): string {
    const exampleHTML = problem.testCases
        .map(tc => `<pre>Input: ${JSON.stringify(tc.input)}, Expected: ${JSON.stringify(tc.expected)}</pre>`)
        .join('');

    // Display user and opponent names and stars
    const playerInfoHTML = userChoice && opponent
        ? `<div>
            <strong>You:</strong> ${userChoice} <span id="userStars">★★★</span>
            &nbsp;&nbsp;
            <strong>Opponent:</strong> ${opponent} <span id="opponentStars">★★★</span>
          </div>`
        : '';

    return `
<html>
<head>
<style>
body { font-family: sans-serif; padding: 20px; }
h2 { color: #1e40af; }
textarea { width: 100%; height: 200px; margin-top: 10px; font-family: monospace; font-size: 14px; }
button { margin-top: 10px; padding: 8px 16px; font-size: 16px; }
#status { margin-top: 10px; font-weight: bold; white-space: pre-wrap; }
</style>
</head>
<body>
<h2>Fix the Code Challenge!</h2>
${playerInfoHTML}
<p><strong>Problem ${problem.id}:</strong> ${problem.title}</p>
<p>${problem.description}</p>

<h3>Test Cases:</h3>
${exampleHTML}

<textarea id="userCode">${problem.code}</textarea>
<br/>
<button id="compileBtn">Run Code</button>
<button id="testBtn">Check Test Cases</button>

<div id="status"></div>

<script>
const vscode = acquireVsCodeApi();

// Initial stars
let userStars = 3;
let opponentStars = 3;

document.getElementById('compileBtn').onclick = () => {
    const code = document.getElementById('userCode').value;
    vscode.postMessage({ command: 'runCode', code });
};

document.getElementById('testBtn').onclick = () => {
    const code = document.getElementById('userCode').value;
    vscode.postMessage({ command: 'runTests', code });
};

// Animate stars loss
function animateStars(winner) {
    const userSpan = document.getElementById('userStars');
    const opponentSpan = document.getElementById('opponentStars');

    const interval = setInterval(() => {
        if (winner === '${userChoice}') {
            if (opponentStars > 0) opponentStars -= 1;
            if (userStars > 0) userStars -= 0.2;
        } else {
            if (userStars > 0) userStars -= 1;
            if (opponentStars > 0) opponentStars -= 0.2;
        }

        userSpan.textContent = '★'.repeat(Math.ceil(userStars));
        opponentSpan.textContent = '★'.repeat(Math.ceil(opponentStars));

        if (userStars <= 0 && opponentStars <= 0) clearInterval(interval);
    }, 1000); // adjust speed here
}

window.addEventListener('message', event => {
    const message = event.data;

    if (message.command === 'syntaxResult') {
        document.getElementById('status').textContent =
            message.success ? '✅ Code ran successfully!' : '❌ ' + message.error;
    }

    if (message.command === 'testResult') {
        if (message.success) {
            // Trigger star animation based on winner
            animateStars('${winner}');
            vscode.postMessage({ command: 'nextProblem' });
        } else {
            document.getElementById('status').textContent = message.error;
        }
    }
});
</script>
</body>
</html>
`;
}


// --- Exported function to play the SurpriseEasy game ---
export function playSurpriseEasyGame(
    userChoice: string,
    opponent: string,
    winner: string
) {
    currentProblemIndex = 0;
    problemPanel = vscode.window.createWebviewPanel(
        'buggyProblem',
        'Fix the Code Challenge',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    const problem = allProblems[currentProblemIndex];
    problemPanel.webview.html = createProblemHTML(problem, userChoice, opponent, winner);

    problemPanel.webview.onDidReceiveMessage(
        async message => {
            if (message.command === 'runCode') {
                const compiled = compileTypeScript(message.code);
                problemPanel!.webview.postMessage({
                    command: 'syntaxResult',
                    ...compiled.success ? runUserCode(compiled.js!) : { success: false, error: compiled.error }
                });
            }

            if (message.command === 'runTests') {
                const compiled = compileTypeScript(message.code);
                if (!compiled.success) {
                    problemPanel!.webview.postMessage({
                        command: 'testResult',
                        success: false,
                        error: compiled.error
                    });
                    return;
                }

                const result = runUserTests(compiled.js!, problem.testCases);

                if (result.success) {
                    currentProblemIndex++;
                    if (currentProblemIndex < allProblems.length) {
                        problemPanel!.webview.html = createProblemHTML(allProblems[currentProblemIndex], userChoice, opponent, winner);
                    } else {
                        problemPanel!.webview.html = `<h1>🎉 You solved all problems!</h1>`;
                    }
                }

                problemPanel!.webview.postMessage({
                    command: 'testResult',
                    ...result
                });
            }
        },
        undefined,
        []
    );
}

// --- Function to handle messages from the spinner webview ---
export function handleGameMessage(message: any) {
    const { game, userChoice, opponent, winner } = message;
    if (game === 'SurpriseEasy') {
        playSurpriseEasyGame(userChoice, opponent, winner);
    }
    // Add more cases here for other games like MathFun, TypingSpeed, Matching
}
