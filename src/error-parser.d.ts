import { DiagnosticSeverity } from "vscode";

export declare class SyntaxError extends Error {
  message: string;
  expected: string | null;
  found: string | null;
  location: Location;
  name: "SyntaxError";
}

export interface ParserOptions {
  startRule?: string;
}

export interface Position {
  line: number;
  column?: number;
}

export interface Location {
  file: string;
  begin: Position;
  end: Position;
}

export interface Message {
  kind: DiagnosticSeverity;
  location: Location;
  message: string;
}

export declare function parse(
  input: string,
  options?: ParserOptions
): Message[];
