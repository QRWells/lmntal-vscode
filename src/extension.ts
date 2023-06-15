import * as vscode from 'vscode';
import { StateViewProvider } from './views/state_viewer';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.stateViewer', () => { }));
    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.visualizer', () => { }));
    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.ilViewer', () => { }));
    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.slim', () => { }));
}