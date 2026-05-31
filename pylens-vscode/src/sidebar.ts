import * as vscode from 'vscode';
import { esc, safeUrl } from './html';
import { ProvenanceRecord } from './types';

export class PyLensSidebarProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'pylens.sidebar';
  private _view?: vscode.WebviewView;

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: false };
    webviewView.webview.html = this._welcome();
  }

  showRecord(record: ProvenanceRecord) {
    if (!this._view) return;
    this._view.show(true);
    this._view.webview.html = this._record(record);
  }

  private _fmt(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private _shell(body: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family:var(--vscode-font-family);font-size:var(--vscode-font-size);color:var(--vscode-foreground);background:var(--vscode-sideBar-background);padding:12px 14px;line-height:1.4; }
.muted { color: var(--vscode-descriptionForeground); }
.section { margin-bottom: 14px; }
.label { font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--vscode-descriptionForeground);margin-bottom:6px; }
.card { background:var(--vscode-editor-background);border:1px solid var(--vscode-widget-border);border-radius:4px;padding:9px 11px; }
.card-title { font-size:13px;font-weight:500;margin-bottom:4px; }
.row { display:flex;align-items:center;gap:8px;margin-bottom:6px; }
.badge { font-size:10px;font-weight:500;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);padding:1px 6px;border-radius:3px; }
.meta { font-size:11px;color:var(--vscode-descriptionForeground); }
.prompt { font-size:11px;color:var(--vscode-descriptionForeground);font-style:italic;line-height:1.45; }
.sha { font-family:var(--vscode-editor-font-family);font-size:11px;background:var(--vscode-textCodeBlock-background);color:var(--vscode-descriptionForeground);padding:1px 5px;border-radius:3px; }
a { color:var(--vscode-textLink-foreground);text-decoration:none; }
a:hover { text-decoration:underline; }
</style>
</head>
<body>${body}</body>
</html>`;
  }

  private _welcome() {
    return this._shell(`
<div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:48px;gap:12px">
  <div style="font-size:28px">⬡</div>
  <div class="muted" style="font-size:12px;line-height:1.5;max-width:180px">
    Click a PyLens annotation above a function to see its full provenance here.
  </div>
</div>`);
  }

  private _targetLabel(r: ProvenanceRecord): string {
    if (r.target.kind === 'function') return `fn ${esc(r.target.functionName)}()`;
    if (r.target.kind === 'file') return esc(r.target.label ?? r.target.filePath);
    return esc(r.target.label);
  }

  private _targetSub(r: ProvenanceRecord): string {
    if (r.target.kind === 'function') return esc(r.target.filePath);
    if (r.target.kind === 'file') return esc(r.target.filePath);
    return r.target.filePaths.map(esc).join('<br>');
  }

  private _record(r: ProvenanceRecord) {
    const req = r.requirement;
    const url = safeUrl(req.url);
    const reqId = url
      ? `<a href="${url}">${esc(req.id)}</a>`
      : esc(req.id);

    const firstMsg = r.aiSession?.messages?.[0]?.content ?? '';
    const preview = esc(firstMsg.slice(0, 160)) + (firstMsg.length > 160 ? '…' : '');

    const aiSection = r.aiSession ? `
<div class="section">
  <div class="label">AI Session</div>
  <div class="card">
    <div class="row">
      <span class="badge">${esc(r.aiSession.tool)}</span>
      <span class="meta">${esc(this._fmt(r.aiSession.date))}</span>
    </div>
    <div class="prompt">&ldquo;${preview}&rdquo;</div>
  </div>
</div>` : '';

    return this._shell(`
<div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--vscode-widget-border)">
  <div style="font-family:var(--vscode-editor-font-family);font-size:14px;font-weight:600;color:var(--vscode-symbolIcon-functionForeground,#dcdcaa)">
    ${this._targetLabel(r)}
  </div>
  <div class="meta" style="margin-top:2px">${this._targetSub(r)}</div>
</div>

<div class="section">
  <div class="label">Requirement</div>
  <div class="card">
    <div class="row"><span class="badge">${reqId}</span></div>
    <div class="card-title">${esc(req.title)}</div>
  </div>
</div>

${aiSection}

<div class="section">
  <div class="label">Commit</div>
  <div class="card">
    <div class="row">
      <span class="sha">${esc(r.commit.sha)}</span>
      <span class="meta">${esc(this._fmt(r.commit.date))}</span>
    </div>
    <div class="card-title">${esc(r.commit.message)}</div>
    <div class="meta" style="margin-top:4px">${esc(r.commit.author)}</div>
  </div>
</div>`);
  }
}
