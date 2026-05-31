import * as vscode from 'vscode';

export class WelcomePanel {
  static readonly viewType = 'pylens.welcome';

  static show(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
      WelcomePanel.viewType,
      'Welcome to PyLens',
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: false },
    );
    panel.webview.html = WelcomePanel._html();
    panel.webview.onDidReceiveMessage(msg => {
      if (msg.command === 'openPanel') vscode.commands.executeCommand('pylens.panel.focus');
      if (msg.command === 'openDocs') vscode.env.openExternal(vscode.Uri.parse('https://pylens.org'));
      if (msg.command === 'dismiss') panel.dispose();
    });
    context.globalState.update('pylens.welcomed', true);
  }

  static showIfFirst(context: vscode.ExtensionContext) {
    if (!context.globalState.get('pylens.welcomed')) WelcomePanel.show(context);
  }

  private static _html() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{
  font-family:var(--vscode-font-family);
  background:var(--vscode-editor-background);
  color:var(--vscode-foreground);
  display:flex;align-items:center;justify-content:center;
  min-height:100vh;padding:40px 24px;
}
.card{max-width:560px;width:100%;}
.logo{font-size:40px;margin-bottom:20px;}
h1{
  font-size:26px;font-weight:700;letter-spacing:-.02em;
  line-height:1.15;margin-bottom:10px;
}
.tagline{
  font-size:14px;color:var(--vscode-descriptionForeground);
  line-height:1.6;margin-bottom:36px;max-width:440px;
}
.steps{display:flex;flex-direction:column;gap:18px;margin-bottom:36px;}
.step{display:flex;gap:14px;align-items:flex-start;}
.step-num{
  width:26px;height:26px;border-radius:50%;flex-shrink:0;
  background:var(--vscode-button-background);color:var(--vscode-button-foreground);
  font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;
}
.step-body{}
.step-title{font-size:13px;font-weight:600;margin-bottom:3px;}
.step-desc{font-size:12px;color:var(--vscode-descriptionForeground);line-height:1.5;}
code{
  font-family:var(--vscode-editor-font-family);
  background:var(--vscode-textCodeBlock-background);
  padding:1px 5px;border-radius:3px;font-size:11px;
}
.divider{border:none;border-top:1px solid var(--vscode-widget-border);margin:32px 0;}
.actions{display:flex;gap:10px;flex-wrap:wrap;}
button{
  font-family:inherit;font-size:12px;font-weight:500;
  padding:8px 16px;border-radius:3px;border:none;cursor:pointer;
}
.btn-primary{background:var(--vscode-button-background);color:var(--vscode-button-foreground);}
.btn-primary:hover{background:var(--vscode-button-hoverBackground);}
.btn-secondary{
  background:transparent;
  color:var(--vscode-foreground);
  border:1px solid var(--vscode-widget-border);
}
.btn-secondary:hover{border-color:var(--vscode-focusBorder);}
.features{
  display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:32px;
}
.feature{
  background:var(--vscode-editor-background);
  border:1px solid var(--vscode-widget-border);
  border-radius:6px;padding:12px 14px;
}
.feature-icon{font-size:18px;margin-bottom:6px;}
.feature-title{font-size:12px;font-weight:600;margin-bottom:3px;}
.feature-desc{font-size:11px;color:var(--vscode-descriptionForeground);line-height:1.4;}
</style>
</head>
<body>
<div class="card">
  <div class="logo">⬡</div>
  <h1>Welcome to PyLens</h1>
  <p class="tagline">Provenance tracking for LLM-generated code. Trace any function back to its requirement, AI session, and commit — and back again.</p>

  <div class="features">
    <div class="feature">
      <div class="feature-icon">🔍</div>
      <div class="feature-title">Inline annotations</div>
      <div class="feature-desc">Click any function to see why it exists, right in the editor.</div>
    </div>
    <div class="feature">
      <div class="feature-icon">⬡</div>
      <div class="feature-title">Gutter indicators</div>
      <div class="feature-desc">Amber dots mark every tracked function at a glance.</div>
    </div>
    <div class="feature">
      <div class="feature-icon">📊</div>
      <div class="feature-title">Provenance panel</div>
      <div class="feature-desc">Full timeline of requirements, AI sessions, and commits.</div>
    </div>
    <div class="feature">
      <div class="feature-icon">🤖</div>
      <div class="feature-title">AI-aware</div>
      <div class="feature-desc">Tracks which AI tool wrote which function and what it was asked.</div>
    </div>
  </div>

  <div class="steps">
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body">
        <div class="step-title">Open any file</div>
        <div class="step-desc">Click into a function — an annotation appears at the end of the line showing the requirement, AI tool, and commit.</div>
      </div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body">
        <div class="step-title">Hover for the full story</div>
        <div class="step-desc">Hover over the line to see the full provenance dialog — requirement, AI prompt, and commit details.</div>
      </div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body">
        <div class="step-title">Open the PyLens panel</div>
        <div class="step-desc">Click the <strong>PyLens</strong> tab in the bottom bar to see a full timeline of all tracked functions, filterable by AI tool.</div>
      </div>
    </div>
  </div>

  <hr class="divider">

  <div class="actions">
    <button class="btn-primary" onclick="send('openPanel')">Open PyLens Panel</button>
    <button class="btn-secondary" onclick="send('openDocs')">pylens.org</button>
    <button class="btn-secondary" onclick="send('dismiss')">Dismiss</button>
  </div>
</div>
<script>
const vscode = acquireVsCodeApi();
function send(command) { vscode.postMessage({ command }); }
</script>
</body>
</html>`;
  }
}
