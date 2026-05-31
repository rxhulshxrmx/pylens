import * as vscode from 'vscode';
import { ProvenanceRecord } from './types';

export class PyLensStatusBar implements vscode.Disposable {
  private readonly _item: vscode.StatusBarItem;

  constructor() {
    this._item = vscode.window.createStatusBarItem(
      'pylens.blame',
      vscode.StatusBarAlignment.Right,
      1000,
    );
    this._item.name = 'PyLens Provenance';
    this._item.command = 'pylens.showProvenance';
  }

  dispose() {
    this._item.dispose();
  }

  update(record: ProvenanceRecord | null) {
    if (!record) {
      this._item.hide();
      return;
    }

    const tool = record.aiSession?.tool ?? '—';
    this._item.text = `$(git-commit) ${record.requirement.id}  ·  ${record.requirement.title}  ·  ${tool}`;

    const tooltip = new vscode.MarkdownString(
      `**PyLens** — \`${record.target.kind === 'function' ? record.target.functionName + '()' : record.target.kind === 'file' ? (record.target.label ?? record.target.filePath) : record.target.label}\`\n\n` +
      `**Requirement:** [${record.requirement.id}](${record.requirement.url ?? '#'}) — ${record.requirement.title}\n\n` +
      (record.aiSession
        ? `**AI Tool:** ${record.aiSession.tool}\n\n` +
          (record.aiSession.messages?.[0]
            ? `> *"${record.aiSession.messages[0].content.slice(0, 120)}…"*\n\n`
            : '')
        : '') +
      `**Commit:** \`${record.commit.sha}\` — ${record.commit.message}\n\n` +
      `---\n\nClick to open provenance panel`,
      true,
    );
    tooltip.isTrusted = true;
    this._item.tooltip = tooltip;
    this._item.show();
  }
}
