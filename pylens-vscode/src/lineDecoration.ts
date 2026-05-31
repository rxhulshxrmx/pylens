import * as vscode from 'vscode';
import { store } from './store';
import { ProvenanceRecord } from './types';
import { DecoratedState } from './hoverProvider';

// Ghost text that appears at end of current line — same mechanism as GitLens inline blame
const decorationType = vscode.window.createTextEditorDecorationType({
  after: { margin: '0 0 0 3em', textDecoration: 'none' },
});

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function flattenSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
  const out: vscode.DocumentSymbol[] = [];
  for (const s of symbols) {
    out.push(s);
    if (s.children?.length) out.push(...flattenSymbols(s.children));
  }
  return out;
}

function enclosingFunction(symbols: vscode.DocumentSymbol[], line: number): vscode.DocumentSymbol | undefined {
  const fns = flattenSymbols(symbols).filter(
    s =>
      (s.kind === vscode.SymbolKind.Function || s.kind === vscode.SymbolKind.Method) &&
      s.range.start.line <= line &&
      s.range.end.line >= line,
  );
  // Sort descending by start line to get the innermost (most specific) function
  fns.sort((a, b) => b.range.start.line - a.range.start.line);
  return fns[0];
}

export class PyLensLineDecorationController implements vscode.Disposable {
  private readonly _disposable: vscode.Disposable;
  private _editor: vscode.TextEditor | undefined;
  private _editing = false;
  private _enabled = true;
  private _editTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly _onRecord: (record: ProvenanceRecord | null, state: DecoratedState | null) => void) {
    this._disposable = vscode.Disposable.from(
      vscode.window.onDidChangeActiveTextEditor(e => {
        if (this._editor !== e) {
          this._clear(this._editor);
          this._editor = e;
        }
        void this._refresh(e);
      }),
      vscode.window.onDidChangeTextEditorSelection(e => {
        if (!this._editing) void this._refresh(e.textEditor);
      }),
      vscode.workspace.onDidChangeTextDocument(() => {
        // Typing — hide immediately, restore after 500 ms idle (same pattern as GitLens)
        this._editing = true;
        this._clear(vscode.window.activeTextEditor);
        clearTimeout(this._editTimer);
        this._editTimer = setTimeout(() => {
          this._editing = false;
          void this._refresh(vscode.window.activeTextEditor);
        }, 500);
      }),
    );
  }

  dispose() {
    this._clear(this._editor);
    clearTimeout(this._editTimer);
    this._disposable.dispose();
  }

  disable() { this._enabled = false; this._clear(this._editor); }
  enable()  { this._enabled = true;  void this._refresh(vscode.window.activeTextEditor); }

  private _clear(editor: vscode.TextEditor | undefined) {
    editor?.setDecorations(decorationType, []);
    this._onRecord(null, null);
  }

  private async _refresh(editor: vscode.TextEditor | undefined) {
    if (!this._enabled) return;
    if (!editor) { this._clear(undefined); return; }

    const cursorLine = editor.selection.active.line;

    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      'vscode.executeDocumentSymbolProvider',
      editor.document.uri,
    );
    // Check function-level record first, fall back to file-level
    const fn = symbols?.length ? enclosingFunction(symbols, cursorLine) : undefined;
    const record = (fn ? store.getByFunction(fn.name) : null)
      ?? store.getByFile(editor.document.uri.fsPath).find(r => r.target.kind !== 'function')
      ?? null;

    if (!record) { this._clear(editor); return; }

    const label = record.target.kind === 'function'
      ? record.target.functionName
      : record.target.kind === 'file'
        ? (record.target.label ?? record.target.filePath.split('/').pop() ?? record.target.filePath)
        : record.target.label;

    const ago = timeAgo(record.commit.date);
    const author = record.commit.author;
    const message = ` ${record.requirement.id} · ${label} · ${author} · ${ago}`;

    const lineLen = editor.document.lineAt(cursorLine).text.length;
    const endOfLine = new vscode.Range(cursorLine, lineLen, cursorLine, lineLen);

    editor.setDecorations(decorationType, [{
      range: endOfLine,
      renderOptions: {
        after: {
          contentText: message,
          color: new vscode.ThemeColor('editorCodeLens.foreground'),
          textDecoration: 'none; white-space: pre; font-variant-numeric: tabular-nums;',
        },
      },
    }]);

    this._onRecord(record, { uri: editor.document.uri, line: cursorLine, record });
  }
}
