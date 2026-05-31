import * as vscode from 'vscode';
import { ProvenanceRecord } from './types';

export interface DecoratedState {
  uri: vscode.Uri;
  line: number;
  record: ProvenanceRecord;
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function buildMarkdown(record: ProvenanceRecord): vscode.MarkdownString {
  const md = new vscode.MarkdownString('', true);
  md.isTrusted = true;
  md.supportHtml = true;

  // Header — function name
  const heading = record.target.kind === 'function'
    ? `\`${record.target.functionName}()\``
    : record.target.kind === 'file'
      ? (record.target.label ?? record.target.filePath)
      : record.target.label;
  md.appendMarkdown(`### ${heading}\n\n`);
  md.appendMarkdown(`---\n\n`);

  // Requirement
  md.appendMarkdown(`**$(issues) Requirement**\n\n`);
  const reqLink = record.requirement.url
    ? `[${record.requirement.id}](${record.requirement.url})`
    : `\`${record.requirement.id}\``;
  md.appendMarkdown(`${reqLink} &nbsp; ${record.requirement.title}\n\n`);

  // AI session
  if (record.aiSession) {
    const firstMsg = record.aiSession.messages?.[0];
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`**$(hubot) AI Session** &nbsp; · &nbsp; ${record.aiSession.tool} &nbsp; · &nbsp; ${fmt(record.aiSession.date)}\n\n`);
    if (firstMsg) md.appendMarkdown(`> *"${firstMsg.content.slice(0, 200)}${firstMsg.content.length > 200 ? '…' : ''}"*\n\n`);
  }

  // Commit
  md.appendMarkdown(`---\n\n`);
  md.appendMarkdown(`**$(git-commit) Commit** &nbsp; \`${record.commit.sha}\` &nbsp; · &nbsp; ${record.commit.author} &nbsp; · &nbsp; ${fmt(record.commit.date)}\n\n`);
  md.appendMarkdown(`${record.commit.message}\n\n`);

  // File origin
  md.appendMarkdown(`---\n\n`);
  const fileRef = record.target.kind === 'function' ? record.target.filePath
    : record.target.kind === 'file' ? record.target.filePath
    : record.target.filePaths.join(', ');
  md.appendMarkdown(`$(file) \`${fileRef}\``);

  return md;
}

export class PyLensHoverController implements vscode.Disposable {
  private _state: DecoratedState | null = null;
  private _providerDisposable: vscode.Disposable | undefined;
  private _registeredUri: string | undefined;

  setState(state: DecoratedState | null) {
    this._state = state;

    // Register/unregister hover provider scoped to the active file — same pattern as GitLens
    const newUri = state?.uri.toString();
    if (newUri === this._registeredUri) return;

    this._providerDisposable?.dispose();
    this._providerDisposable = undefined;
    this._registeredUri = undefined;

    if (!state) return;

    this._registeredUri = newUri;
    this._providerDisposable = vscode.languages.registerHoverProvider(
      { pattern: state.uri.fsPath },
      { provideHover: this._provideHover.bind(this) },
    );
  }

  private _provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.Hover | undefined {
    if (!this._state) return undefined;
    if (document.uri.toString() !== this._state.uri.toString()) return undefined;
    if (position.line !== this._state.line) return undefined;

    // Return hover for the whole line so it appears whether hovering code or ghost text
    const lineLen = document.lineAt(position.line).text.length;
    const range = new vscode.Range(position.line, 0, position.line, lineLen);
    return new vscode.Hover(buildMarkdown(this._state.record), range);
  }

  dispose() {
    this._providerDisposable?.dispose();
  }
}
