"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarProvider = void 0;
const vscode = require("vscode");
class SidebarProvider {
    constructor(_extensionUri, context) {
        this._extensionUri = _extensionUri;
        this._context = context;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            console.log('Received message from webview:', message);
            switch (message.command) {
                case 'alert':
                    vscode.window.showInformationMessage(message.text);
                    return;
                case 'apiRequest':
                    try {
                        const result = await vscode.commands.executeCommand('triage-ai.makeApiRequest', message.endpoint, message.method, message.body);
                        // If this is a task creation result, store the task ID
                        if (message.endpoint === '/run' && message.method === 'POST' && result && result.task_id) {
                            this._context.globalState.update('triage-current-task', result.task_id);
                            // Also store current step as step 1 (PM)
                            this._context.globalState.update('triage-current-step', 1);
                            console.log(`Stored task ID: ${result.task_id} in globalState`);
                        }
                        // Send the result back to the webview
                        webviewView.webview.postMessage({
                            command: 'apiResponse',
                            requestId: message.requestId,
                            data: result,
                            error: null
                        });
                    }
                    catch (error) {
                        console.error('API request failed:', error);
                        // Send the error back to the webview
                        webviewView.webview.postMessage({
                            command: 'apiResponse',
                            requestId: message.requestId,
                            data: null,
                            error: error instanceof Error ? error.message : String(error)
                        });
                    }
                    return;
                case 'updateCurrentStep':
                    // Store the current step in global state
                    this._context.globalState.update('triage-current-step', message.step);
                    console.log(`Updated current step to: ${message.step}`);
                    return;
                case 'getStoredSession':
                    // Return the stored session info (current task ID and step)
                    const taskId = this._context.globalState.get('triage-current-task');
                    const currentStep = this._context.globalState.get('triage-current-step') || 1;
                    webviewView.webview.postMessage({
                        command: 'sessionInfo',
                        taskId: taskId,
                        currentStep: currentStep
                    });
                    console.log(`Sending stored session: task=${taskId}, step=${currentStep}`);
                    return;
                case 'clearSession':
                    // Clear stored session data
                    this._context.globalState.update('triage-current-task', undefined);
                    this._context.globalState.update('triage-current-step', 1);
                    console.log('Cleared session data');
                    return;
                case 'openFile':
                    // Open a file in the editor
                    vscode.commands.executeCommand('triage-ai.openGeneratedFile', message.path);
                    return;
            }
        });
    }
    _getHtmlForWebview(webview) {
        // Get the local path to main script and CSS
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.css"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "webview.js"));
        // Get icons
        const pmIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "icons", "pm-icon.svg"));
        const architectIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "icons", "architect-icon.svg"));
        const securityIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "icons", "security-icon.svg"));
        const testIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "icons", "test-icon.svg"));
        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
  <title>Triage AI</title>
  <link href="${styleUri}" rel="stylesheet" />
</head>
<body>
  <div class="triage-root">
    <aside class="triage-sidebar">
      <div class="triage-logo"><img src="${pmIconUri}" alt="Triage AI" /></div>
      <nav class="triage-stepper">
        <div class="triage-step" data-step="1">
          <img src="${pmIconUri}" alt="PM" />
          <span>PM</span>
        </div>
        <div class="triage-step" data-step="2">
          <img src="${architectIconUri}" alt="Architect" />
          <span>Architect</span>
        </div>
        <div class="triage-step" data-step="3">
          <img src="${securityIconUri}" alt="Security" />
          <span>Security</span>
        </div>
        <div class="triage-step" data-step="4">
          <img src="${testIconUri}" alt="Test" />
          <span>Test</span>
        </div>
      </nav>
    </aside>
    <main class="triage-main">
      <section id="pm-panel" class="triage-agent-panel pm">
        <div class="triage-agent-header">
          <img src="${pmIconUri}" alt="PM Agent" />
          <div>
            <h2>Product Manager</h2>
            <p>Converts your request into feature requirements.</p>
          </div>
        </div>
        <div class="triage-agent-output" id="pm-output"></div>
        <button class="approve-button primary-button">Approve</button>
      </section>
      <section id="architect-panel" class="triage-agent-panel architect">
        <div class="triage-agent-header">
          <img src="${architectIconUri}" alt="Architect Agent" />
          <div>
            <h2>Architect</h2>
            <p>Creates a technical design based on the requirements.</p>
          </div>
        </div>
        <div class="triage-agent-output" id="architect-output"></div>
        <button class="approve-button primary-button">Approve</button>
      </section>
      <section id="security-panel" class="triage-agent-panel security">
        <div class="triage-agent-header">
          <img src="${securityIconUri}" alt="Security Agent" />
          <div>
            <h2>Security</h2>
            <p>Reviews the architecture for potential security issues.</p>
          </div>
        </div>
        <div class="triage-agent-output" id="security-output"></div>
        <button class="approve-button primary-button">Approve</button>
      </section>
      <section id="test-panel" class="triage-agent-panel test">
        <div class="triage-agent-header">
          <img src="${testIconUri}" alt="Test Agent" />
          <div>
            <h2>Test</h2>
            <p>Provides a comprehensive testing strategy.</p>
          </div>
        </div>
        <div class="triage-agent-output" id="test-output"></div>
        <button class="approve-button primary-button">Approve</button>
      </section>
      <div id="loading-spinner" class="loading-overlay">
        <div class="spinner">
          <div class="spinner-inner"></div>
        </div>
        <p id="loading-message">Processing...</p>
      </div>
    </main>
    <footer class="triage-footer">
      <div class="input-area global-input-area">
        <textarea id="user-prompt" placeholder="Describe the product or feature you want to build..." rows="2"></textarea>
        <button id="analyze-prompt" class="primary-button">Send</button>
      </div>
    </footer>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}
exports.SidebarProvider = SidebarProvider;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=SidebarProvider.js.map