import { binarySearchLeast } from "./algorithms";

export interface CodePointInfo {
  unitArray: CodePointPosition[];
  codePointCount: number;
}

export interface CodePointPosition {
  offset: number;
  end: number;
}

export default class CodePointCounter {
  units: CodePointPosition[] = [];
  public codePointCount: number = 0;
  constructor(private string: string = "") {
    const { unitArray, codePointCount } = this.unitArray(string);
    this.codePointCount = codePointCount;
    this.units.push(...unitArray);
  }

  private unitArray(source: string): CodePointInfo {
    const len = source.length;
    const unitArray: CodePointPosition[] = [];
    let codePointCount = 0;
    for (let i = 0; i < len; i++) {
      const code = source.charCodeAt(i);
      let pos = { offset: i, end: i + 1 };
      codePointCount++;
      if (0xd800 <= code && code <= 0xdbff && i + 1 < len) {
        const nextCode = source.charCodeAt(i + 1);
        if (0xdc00 <= nextCode && nextCode <= 0xdfff) {
          i++;
          pos.end++;
        }
      }
      unitArray.push(pos);
    }
    return { unitArray, codePointCount };
  }

  /**
   * updateText
   */
  public updateText(offset: number, length: number, text: string) {
    console.log(`Updating: ${JSON.stringify({ offset, length, text })}`);
    const start = binarySearchLeast(this.units, v => v.offset >= offset);
    const end = binarySearchLeast(
      this.units,
      v => v.end >= offset + length,
      start
    );
    const { unitArray, codePointCount } = this.unitArray(text);
    const middlePart = this.string.slice(offset, offset + length);
    const middleCount = length === 0 ? 0 : end - start + 1;
    const lenDelta = text.length - middlePart.length;
    console.log(
      `Start: ${start}, ${JSON.stringify(
        this.units[start]
      )}; End: ${end}, ${JSON.stringify(this.units[end])}`
    );
    for (let i = end; i < this.units.length; i++) {
      this.units[i].offset += lenDelta;
      this.units[i].end += lenDelta;
    }
    this.codePointCount += codePointCount - middleCount;
    this.string =
      this.string.slice(0, offset) + text + this.string.slice(offset + length);
    this.units.splice(
      start,
      middleCount,
      ...unitArray.map(val => ({
        offset: val.offset + offset,
        end: val.end + offset
      }))
    );
  }

  /**
   * toUtf16Offset
   */
  public toUtf16Offset(n: number): number | null {
    if (0 <= n && n < this.units.length) {
      return this.units[n].offset;
    } else {
      return null;
    }
  }

  public fromUtf16Offset(offset: number): number | undefined {
    const pos = binarySearchLeast(this.units, v => v.offset >= offset);
    if (pos >= 0) {
      return pos;
    }
  }
}
