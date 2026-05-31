import * as vscode from 'vscode';
import { store } from './store';

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

export class PyLensCodeLensProvider implements vscode.CodeLensProvider {
  private _onChange = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onChange.event;

  provideCodeLenses(document: vscode.TextDocument): vscode.ProviderResult<vscode.CodeLens[]> {
    const enabled = vscode.workspace.getConfiguration('pylens').get<boolean>('enableCodeLens', true);
    if (!enabled) return [];

    return vscode.commands
      .executeCommand<vscode.DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri)
      .then(symbols => {
        if (!symbols?.length) return [];

        const fns = flattenSymbols(symbols).filter(
          s => s.kind === vscode.SymbolKind.Function || s.kind === vscode.SymbolKind.Method
        );

        const lenses: vscode.CodeLens[] = [];
        for (const sym of fns) {
          const record = store.getByFunction(sym.name);
          if (!record) continue;

          const tool = record.aiSession?.tool ?? 'unknown';
          const ago = timeAgo(record.commit.date);
          const title = `⬡ ${record.requirement.id}  ·  ${record.requirement.title}  ·  ${tool}  ·  ${ago}`;

          lenses.push(
            new vscode.CodeLens(sym.range, {
              title,
              command: 'pylens.showProvenance',
              arguments: [record],
              tooltip: 'Click to see full provenance in the PyLens panel'
            })
          );
        }
        return lenses;
      });
  }
}
