import * as vscode from 'vscode';
import { store } from './store';

function flattenSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
  const out: vscode.DocumentSymbol[] = [];
  for (const s of symbols) {
    out.push(s);
    if (s.children?.length) out.push(...flattenSymbols(s.children));
  }
  return out;
}

export class PyLensGutterController implements vscode.Disposable {
  private readonly _type: vscode.TextEditorDecorationType;
  private readonly _disposable: vscode.Disposable;
  private _debounce: ReturnType<typeof setTimeout> | undefined;

  constructor(
    extensionUri: vscode.Uri,
    private readonly _onCoverage: (tracked: number, total: number) => void,
  ) {
    this._type = vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.joinPath(extensionUri, 'media', 'gutter.svg'),
      gutterIconSize: 'contain',
    });

    this._disposable = vscode.Disposable.from(
      vscode.window.onDidChangeActiveTextEditor(e => this._refresh(e)),
      vscode.workspace.onDidChangeTextDocument(() => {
        clearTimeout(this._debounce);
        this._debounce = setTimeout(() => this._refresh(vscode.window.activeTextEditor), 800);
      }),
    );

    this._refresh(vscode.window.activeTextEditor);
  }

  dispose() {
    this._type.dispose();
    clearTimeout(this._debounce);
    this._disposable.dispose();
  }

  clear() {
    vscode.window.activeTextEditor?.setDecorations(this._type, []);
    this._onCoverage(0, 0);
  }

  private async _refresh(editor: vscode.TextEditor | undefined) {
    if (!editor) { this._onCoverage(0, 0); return; }

    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      'vscode.executeDocumentSymbolProvider', editor.document.uri,
    );
    if (!symbols?.length) { editor.setDecorations(this._type, []); this._onCoverage(0, 0); return; }

    const fns = flattenSymbols(symbols).filter(
      s => s.kind === vscode.SymbolKind.Function || s.kind === vscode.SymbolKind.Method,
    );

    const ranges: vscode.Range[] = [];
    // Function-level: dot on the function's own line
    for (const fn of fns) {
      if (store.getByFunction(fn.name)) ranges.push(fn.range);
    }
    // File-level: dot on line 0 if any file/files record covers this file
    const fileRecords = store.getByFile(editor.document.uri.fsPath)
      .filter(r => r.target.kind !== 'function');
    if (fileRecords.length > 0) {
      ranges.push(new vscode.Range(0, 0, 0, 0));
    }

    editor.setDecorations(this._type, ranges);
    this._onCoverage(ranges.length, fns.length);
  }
}
