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
const problemsPath = path.join(__dirname, 'buggyProblems.json');
const allProblems: BuggyProblem[] = JSON.parse(fs.readFileSync(problemsPath, 'utf-8'));

// Track progress in memory
let currentProblemIndex = 0;

// --- Merge conflict detection ---
function hasMergeConflict(text: string): boolean {
    return text.includes('<<<<<<<') && text.includes('=======');
}

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

// --- Creates HTML for the problem ---
function createProblemHTML(problem: BuggyProblem): string {
    const exampleHTML = problem.testCases
        .map(tc => `<pre>Input: ${JSON.stringify(tc.input)}, Expected: ${JSON.stringify(tc.expected)}</pre>`)
        .join('');

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

document.getElementById('compileBtn').onclick = () => {
    const code = document.getElementById('userCode').value;
    vscode.postMessage({ command: 'runCode', code });
};

document.getElementById('testBtn').onclick = () => {
    const code = document.getElementById('userCode').value;
    vscode.postMessage({ command: 'runTests', code });
};

window.addEventListener('message', event => {
    const message = event.data;

    if (message.command === 'syntaxResult') {
        document.getElementById('status').textContent =
            message.success ? '✅ Code ran successfully!' : '❌ ' + message.error;
    }

    if (message.command === 'testResult') {
        if (message.success) {
            document.getElementById('status').textContent = '🎉 All tests passed! Loading next problem...';
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

// --- Webview panel instance ---
let problemPanel: vscode.WebviewPanel | null = null;

// --- Load problem into existing panel ---
function loadProblemIntoWebview() {
    if (!problemPanel) return;

    if (currentProblemIndex >= allProblems.length) {
        problemPanel.webview.html = `
            <h1>🎉 You solved all problems!</h1>
            <p>Great job!</p>
        `;
        return;
    }

    const problem = allProblems[currentProblemIndex];
    problemPanel.webview.html = createProblemHTML(problem);
}

// --- Open webview and start first problem ---
function openBuggyProblemWebview(context: vscode.ExtensionContext) {
    currentProblemIndex = 0;

    problemPanel = vscode.window.createWebviewPanel(
        'buggyProblem',
        'Fix the Code Challenge',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    loadProblemIntoWebview();

    problemPanel.webview.onDidReceiveMessage(
        message => {
            const problem = allProblems[currentProblemIndex];

            if (message.command === 'runCode') {
                const compiled = compileTypeScript(message.code);
                if (!compiled.success) {
                    problemPanel!.webview.postMessage({
                        command: 'syntaxResult',
                        success: false,
                        error: compiled.error
                    });
                    return;
                }
                const runResult = runUserCode(compiled.js!);
                problemPanel!.webview.postMessage({
                    command: 'syntaxResult',
                    ...runResult
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
                    // Move to next problem
                    currentProblemIndex++;
                    loadProblemIntoWebview();
                }

                problemPanel!.webview.postMessage({
                    command: 'testResult',
                    ...result
                });
            }
        },
        undefined,
        context.subscriptions
    );
}

// --- Activation ---
export function activate(context: vscode.ExtensionContext) {
    vscode.workspace.onDidOpenTextDocument(async (doc) => {
        if (hasMergeConflict(doc.getText())) {
            const selection = await vscode.window.showInformationMessage(
                'Merge conflict detected! Solve a coding problem to continue?',
                'Play'
            );
            if (selection === 'Play') {
                openBuggyProblemWebview(context);
            }
        }
    });
}

export function deactivate() {}
