import { Transform } from "stream";

export class AgdaConsole extends Transform {
  private buffer: string;
  public readable = true;
  private initial = true;

  constructor() {
    super({ readableObjectMode: true, writableObjectMode: true });
    this.buffer = "";
  }

  private processPrompt(line: string): string {
    const result = /^JSON>\s*(.*)$/.exec(line);
    if (result) {
      if (this.initial) {
        this.initial = false;
      } else {
        this.push(Idle.Idle);
      }
      return result[1];
    } else {
      return line;
    }
  }

  _transform(chunk_: string | Buffer, encoding: string, callback: Function) {
    let chunk: string = String(chunk_);
    const lfLast = chunk.lastIndexOf("\n");
    if (lfLast >= 0) {
      const lines = chunk.split("\n");
      let init = true;
      for (let line of lines.slice(0, lines.length - 1)) {
        if (init && this.buffer.length > 0) {
          line = this.buffer + line;
          this.buffer = "";
          init = false;
        }
        line = this.processPrompt(line);
        if (line.length === 0) {
          continue;
        }
        this.push({ payload: line });
      }
      const rest = this.processPrompt(lines[lines.length - 1]);
      this.buffer += rest;
    } else {
      this.buffer += chunk;
      this.buffer = this.processPrompt(this.buffer);
    }
    callback();
  }

  _final(callback: Function) {
    const line = this.processPrompt(this.buffer);
    this.buffer = "";
    this.push({ payload: line });
    callback();
  }
}

export type ConsoleAction = Idle | Incoming;
export enum Idle {
  Idle = 0
}
export interface Incoming {
  payload: string;
}
