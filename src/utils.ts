import { Range, Position, TextDocument } from "vscode";

export interface StringWithLocation {
  body: string;
  file?: string;
  range: Range;
}

export function wiseButSlowPositionAt(document: TextDocument, n: number) {
  const txt: string[] = [...document.getText()].slice(0, n);
  return document.positionAt(txt.join("").length);
}

export function splitLocation(src: string): StringWithLocation {
  const regex = /(.+)\s+\[ at (?:(.+)?:)(\d+),(\d+)-(?:(\d+),)?(\d+)\s*\]$/im;
  const matched = regex.exec(src);
  if (matched) {
    const body: string = matched[1] || src;
    const file = matched[2];
    const startLine = Number(matched[3]) - 1 || 0;
    const startCol = Number(matched[4]) - 1 || 0;
    const endLine = Number(matched[5]) - 1 || startLine;
    const endCol = Number(matched[6]) - 1 || startCol + 1;
    const range = new Range(
      new Position(startLine, startCol),
      new Position(endLine, endCol)
    );
    return {
      body,
      file,
      range
    };
  } else {
    return {
      body: src,
      file: undefined,
      range: new Range(new Position(0, 0), new Position(0, 0))
    };
  }
}
