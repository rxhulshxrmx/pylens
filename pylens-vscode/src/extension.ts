import * as vscode from 'vscode';
import { PyLensCoverageBar } from './coverage';
import { PyLensGutterController } from './gutter';
import { PyLensHoverController } from './hoverProvider';
import { PyLensLineDecorationController } from './lineDecoration';
import { PyLensPanelProvider } from './panel';
import { PyLensSidebarProvider } from './sidebar';
import { PyLensStatusBar } from './statusbar';
import { ProvenanceRecord } from './types';
import { WelcomePanel } from './welcome';

export function activate(context: vscode.ExtensionContext) {
  const sidebar = new PyLensSidebarProvider();
  const statusBar = new PyLensStatusBar();
  const hoverController = new PyLensHoverController();
  const panel = new PyLensPanelProvider();
  const coverageBar = new PyLensCoverageBar();
  const gutter = new PyLensGutterController(context.extensionUri, (tracked, total) => {
    coverageBar.update(tracked, total);
  });

  let enabled = vscode.workspace.getConfiguration('pylens').get<boolean>('enableAnnotations', true);
  let currentRecord: ProvenanceRecord | null = null;

  const decoration = new PyLensLineDecorationController((record, state) => {
    currentRecord = record;
    statusBar.update(record);
    hoverController.setState(state);
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(PyLensSidebarProvider.viewType, sidebar),
    vscode.window.registerWebviewViewProvider(PyLensPanelProvider.viewType, panel),
    statusBar,
    decoration,
    hoverController,
    gutter,
    coverageBar,
  );

  // Show provenance — called from status bar, context menu, or editor title
  context.subscriptions.push(
    vscode.commands.registerCommand('pylens.showProvenance', (record?: ProvenanceRecord) => {
      const r = record ?? currentRecord;
      if (r) sidebar.showRecord(r);
      else vscode.window.showInformationMessage('PyLens: move cursor into a tracked function first.');
    }),
  );

  // Toggle inline annotations + gutter icons
  context.subscriptions.push(
    vscode.commands.registerCommand('pylens.toggleAnnotations', () => {
      enabled = !enabled;
      vscode.workspace.getConfiguration('pylens').update('enableAnnotations', enabled, true);
      if (!enabled) {
        decoration.disable();
        gutter.clear();
        statusBar.update(null);
        coverageBar.update(0, 0);
        hoverController.setState(null);
      } else {
        decoration.enable();
      }
      vscode.window.setStatusBarMessage(`PyLens annotations ${enabled ? 'on' : 'off'}`, 2500);
    }),
  );

  // Open the bottom panel
  context.subscriptions.push(
    vscode.commands.registerCommand('pylens.openPanel', () => {
      vscode.commands.executeCommand('pylens.panel.focus');
    }),
  );

  // Welcome page
  context.subscriptions.push(
    vscode.commands.registerCommand('pylens.showWelcome', () => WelcomePanel.show(context)),
  );

  // Show welcome on first install
  WelcomePanel.showIfFirst(context);
}

export function deactivate() {}
