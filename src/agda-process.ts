import {
  Disposable,
  workspace,
  TextEditor,
  WorkspaceFolder,
  Range,
  Position,
  TextEditorDecorationType,
  TextDocument,
  OutputChannel,
  window,
  DiagnosticCollection,
  languages,
  Diagnostic,
  Uri
} from "vscode";
import { ChildProcess, spawn } from "child_process";
import IOTCM from "./iotcm";
import * as utils from "./utils";
import * as ErrorParser from "./error-parser";
import {
  HighlightingLevel,
  HighlightingMethod,
  Load,
  Interaction,
  Metas,
  GoalType,
  Rewrite,
  NoRange,
  AgdaRange
} from "./commands";
import { Mutex } from "await-semaphore";
import {
  Response,
  HighlightInfoBody,
  parseHighlightInfo,
  HighlightingInfo
} from "./response";
import * as path from "path";
import { toDecoration } from "./decorations";
import { DisplayInfo } from "./display-info";
import { AgdaConsole, ConsoleAction, Idle } from "./agda-console";
import { Transform } from "stream";
import CodePointCounter from "./codepoint-counter";

export default class AgdaProcess implements Disposable {
  private agda: ChildProcess | undefined;
  private subscriptions: Disposable[] = [];
  private filePath: string;
  private procMutex: Mutex;
  private root: WorkspaceFolder;
  private defArgs: string[] = [];
  private highlights: Map<Range, TextEditorDecorationType> = new Map();
  private document: TextDocument;
  private outputChan: OutputChannel;
  private diags: DiagnosticCollection;
  private inputStream: Transform = new Transform();
  private codeCounter: CodePointCounter;

  constructor(textEditor: TextEditor) {
    this.procMutex = new Mutex();
    this.filePath = textEditor.document.fileName;
    this.document = textEditor.document;
    this.codeCounter = new CodePointCounter(this.document.getText());
    this.subscriptions.push(
      workspace.onDidChangeTextDocument(evt => {
        if (evt.document === this.document) {
          evt.contentChanges.forEach(v => {
            this.codeCounter.updateText(v.rangeOffset, v.rangeLength, v.text);
          });
        }
      })
    );
    this.outputChan = window.createOutputChannel(
      `Agda (${workspace.asRelativePath(this.filePath)})`
    );
    this.diags = languages.createDiagnosticCollection(`Agda ${this.filePath}`);
    this.subscriptions.push(this.diags);
    console.log(
      `Your destination: ${textEditor.document.offsetAt(new Position(20, 2))}`
    );

    this.root =
      (workspace.workspaceFolders || [])[0] ||
      path.dirname(this.document.fileName);

    this.subscriptions.push(
      workspace.onDidChangeConfiguration(evt => {
        if (evt.affectsConfiguration("agda-interactive.program")) {
          this.newAgda();
        }
      })
    );
    this.newAgda();
  }

  newAgda() {
    this.procMutex.use(async () => {
      const progConf = workspace.getConfiguration("agda-interactive.program");
      const exe: string = progConf.get("executable", "agda");
      const libs: string[] = progConf.get("libraries", ["standard-library"]);
      const argSeed: string[] = progConf
        .get("args", [])
        .filter(i => !/^--interact/.test(i));
      const args: string[] = ["-i", this.root.uri.fsPath, "--interaction-json"];
      for (const lib of libs) {
        args.push("-l", lib);
      }
      this.defArgs = args;
      args.push(...argSeed);
      this.agda = spawn(exe, args, { cwd: this.root.uri.fsPath });
      this.inputStream = this.agda.stdout.pipe(new AgdaConsole());
    });
  }

  async issueCommand(editor: TextEditor, cmd: Interaction) {
    console.log(`Issuing: ${JSON.stringify(cmd)}`);
    if (!this.agda) {
      console.log(`Re-initiating agda`);
      this.newAgda();
    }
    await this.procMutex.use(async () => {
      if (this.agda) {
        try {
          const iotcm = new IOTCM(
            this.filePath,
            HighlightingLevel.NonInteractive,
            HighlightingMethod.Indirect,
            cmd
          );
          this.agda.stdin.write(iotcm.toHaskell() + "\n");
          const listener = async (resp: ConsoleAction) => {
            if (resp === Idle.Idle) {
              this.inputStream.removeListener("data", listener);
            } else {
              const line = resp.payload;
              try {
                const resp: Response | undefined = JSON.parse(line);
                if (resp) {
                  await this.processResponse(editor, resp);
                  return;
                } else {
                  console.log(`Could not parse: ${line}; exiting loop...`);
                  return;
                }
              } catch (e) {
                console.log(
                  `Could not parse: ${JSON.stringify(line)}; exiting loop...`
                );
              }
            }
          };
          this.inputStream.on("data", listener);
        } catch (e) {
          console.log(
            `Issuing command ${cmd.toHaskell()} failed: ${(e as Error).stack}`
          );
        }
      } else {
        console.log(`No AGDA!!!`);
      }
    });
  }

  public async loadFile(editor: TextEditor) {
    console.log(`Issue!`);
    await this.issueCommand(editor, new Load(this.filePath, this.defArgs));
  }

  public updateDecorations(editor: TextEditor) {
    for (const [range, deco] of this.highlights) {
      editor.setDecorations(deco, [range]);
    }
  }

  async processResponse(editor: TextEditor, resp: Response) {
    try {
      switch (resp.kind) {
        case "HighlightingInfo":
          this.processHighlight(editor, resp);
          break;

        case "ClearHighlighting":
          this.clearHighlighting();
          break;

        case "ClearRunningInfo":
          this.outputChan.clear();
          this.diags.clear();
          break;

        case "RunningInfo":
          this.outputChan.appendLine(resp.message);
          if (resp.debugLevel === 1) {
            window.showInformationMessage(resp.message);
          }
          break;

        case "DisplayInfo":
          this.processDisplayInfo(editor, resp.info);
          break;

        case "InteractionPoints":
          for (const iid of resp.interactionPoints) {
            this.issueCommand(
              editor,
              new GoalType(Rewrite.AsIs, iid.id, iid.range, "")
            );
          }
          break;

        default:
          console.log(`Unprocessed resp: ${JSON.stringify(resp)}`);
          break;
      }
    } catch (e) {
      console.error(`Exception during coloring: ${e}, ${(e as Error).stack}`);
    }
  }

  async processDisplayInfo(editor: TextEditor, info: DisplayInfo) {
    console.log(`DisplayInfo: ${JSON.stringify(info)}`);
    switch (info.kind) {
      case "Error":
        this.outputChan.appendLine(`[Error] ${info.payload}`);
        const exists: Map<string, Diagnostic[]> = new Map();
        console.log(`INFOERR: ${JSON.stringify(info)}`);
        const resl: ErrorParser.Message[] = ErrorParser.parse(
          info.payload || (info as any).message || ""
        );
        console.log(`Length: ${resl.length}`);
        for (const i of resl) {
          const path: string = i.location.file;
          let target: Diagnostic[] | undefined = exists.get(path);
          if (!target) {
            target = [];
            exists.set(path, target);
          }
          target.push({
            range: this.fromAgdaLocation(i.location),
            message: i.message,
            severity: i.kind
          });
        }
        for (const [key, ds] of exists) {
          console.log(`Setting "${key}" foor ${JSON.stringify(ds)}`);
          this.diags.delete(Uri.file(key));
          this.diags.set(Uri.file(key), ds);
        }

        break;
      case "AllGoalsWarnings":
        break;

      default:
        console.log(`Unproc'd DispInfo: ${JSON.stringify(info)}`);
        break;
    }
  }

  private fromErrorPosition(pos: ErrorParser.Position): Position {
    const line = pos.line - 1;
    const colChs = (pos.column || 1) - 1;
    const utf16LineOffset = this.document.offsetAt(new Position(line, 0));
    const colOffset = this.codeCounter.fromUtf16Offset(utf16LineOffset) || 0;
    const col =
      (this.codeCounter.toUtf16Offset(colOffset + colChs) || colOffset) -
      utf16LineOffset;
    return new Position(line, col || 0);
  }

  private fromAgdaLocation(range: ErrorParser.Location): Range {
    return new Range(
      this.fromErrorPosition(range.begin),
      this.fromErrorPosition(range.end)
    );
  }

  async clearHighlighting() {
    this.highlights.forEach(deco => deco.dispose());
    this.highlights = new Map();
  }

  async processHighlight(editor: TextEditor, resp: HighlightingInfo) {
    const info: HighlightInfoBody = resp.direct
      ? resp.info
      : parseHighlightInfo(resp.filepath);
    if (info) {
      console.log(`Highlighting ala: ${JSON.stringify(info)}`);
      for (const [[beg, end], asps] of info.payload) {
        const start = this.document.positionAt(
          this.codeCounter.toUtf16Offset(beg - 1) || 0
        );
        const stop = this.document.positionAt(
          this.codeCounter.toUtf16Offset(end - 1) || 0
        );
        const range = new Range(start, stop);
        // const remove = info.remove;
        if (info.remove) {
          for (const [ran, val] of this.highlights) {
            const ints = ran.intersection(range);
            if (ints && !ints.isEmpty) {
              val.dispose();
              this.highlights.delete(ran);
            }
          }
        }
        const invert = toDecoration(asps);
        this.highlights.set(range, invert);
        editor.setDecorations(invert, [range]);
      }
    } else if (!resp.direct) {
      console.warn(`Body parsing failed: ${resp.filepath}`);
    }
  }

  dispose() {
    console.log(`Good... bye! ${this.document.fileName}`);
    if (this.agda) {
      this.agda.kill("SIGKILL");
    }
    this.subscriptions.forEach(d => d.dispose());
    for (const kv of this.highlights) {
      kv[1].dispose();
    }
  }
}
