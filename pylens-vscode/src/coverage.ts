import * as vscode from 'vscode';

export class PyLensCoverageBar implements vscode.Disposable {
  private readonly _item: vscode.StatusBarItem;

  constructor() {
    this._item = vscode.window.createStatusBarItem('pylens.coverage', vscode.StatusBarAlignment.Right, 999);
    this._item.name = 'PyLens Coverage';
    this._item.command = 'pylens.panel.focus';
  }

  dispose() { this._item.dispose(); }

  update(tracked: number, total: number) {
    if (total === 0) { this._item.hide(); return; }
    const pct = Math.round((tracked / total) * 100);
    this._item.text = `⬡ ${tracked}/${total} tracked`;
    this._item.tooltip = new vscode.MarkdownString(
      `**PyLens Coverage** — ${pct}% of functions in this file have provenance\n\n` +
      `${tracked} tracked · ${total - tracked} untracked\n\n` +
      `Click to open PyLens panel`,
    );
    this._item.color = pct === 100
      ? new vscode.ThemeColor('testing.iconPassed')
      : pct >= 50
        ? undefined
        : new vscode.ThemeColor('testing.iconFailed');
    this._item.show();
  }
}
