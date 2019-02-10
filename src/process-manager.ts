import { TextEditor, Disposable, commands, window, TextDocument } from "vscode";
import AgdaProcess from "./agda-process";

export default class ProcessManager implements Disposable {
  private processes: Map<TextDocument, AgdaProcess> = new Map();
  private disposables: Disposable[] = [];

  constructor() {
    this.disposables.push(
      commands.registerTextEditorCommand(
        "agda-interactive.load-file",
        this.loadFile,
        this
      )
    );
    this.disposables.push(
      window.onDidChangeActiveTextEditor(evt => {
        if (evt) {
          console.log(`Active changed: ${evt.document.uri.fsPath}`);
          const proc = this.processes.get(evt.document);
          console.log(`Procs: ${this.processes.size}`);
          try {
            (proc as AgdaProcess).updateDecorations(evt);
          } catch (e) {}
        }
      })
    );
  }

  /**
   * initialiseProcess
   */
  public initialiseProcess(editor: TextEditor) {
    let p;
    if ((p = this.processes.get(editor.document))) {
      p.dispose();
    }
    this.processes.set(editor.document, new AgdaProcess(editor));
  }

  /**
   * loadFile
   */
  public loadFile(editor: TextEditor) {
    console.log("Hello, bou que mickey!");
    try {
      let target = this.processes.get(editor.document);
      if (!target) {
        console.log(`Initiating: ${editor.document.fileName}`);
        target = new AgdaProcess(editor);
        this.processes.set(editor.document, target);
      } else {
        console.log(`Already there: ${editor.document.fileName}`);
      }
      target.loadFile(editor);
    } catch (e) {
      console.error(`Management Failed: ${e}`);
    }
  }

  dispose() {
    this.processes.forEach(p => p.dispose());
    this.disposables.forEach(p => p.dispose());
  }
}
