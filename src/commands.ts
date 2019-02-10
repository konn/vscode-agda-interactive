import * as cases from "change-case";

export enum HighlightingLevel {
  None = "None",
  NonInteractive = "NonInteractive",
  Interactive = "Interactive"
}

export enum HighlightingMethod {
  Direct = "Direct",
  Indirect = "Indirect"
}

export abstract class Interaction implements ToHaskell {
  commandName: string = cases.snake(this.constructor.name);
  args: HaskellValue[] = [];

  toHaskell() {
    const cmdName = `Cmd_${this.commandName}`;
    return showCons(cmdName, ...this.args);
  }
}

export abstract class HaskDataCon implements ToHaskell {
  consName: string = this.constructor.name;
  args: HaskellValue[] = [];
  constructor() {}
  toHaskell() {
    return showCons(this.consName, ...this.args);
  }
}

export class Load extends Interaction {
  constructor(target: string, argv: string[]) {
    super();
    this.args = [
      new HaskellString(target),
      new HaskellList(argv.map(i => new HaskellString(i)))
    ];
  }
}

export type CompilerBackend = CompilerBackend_ | OtherBackend;

export class OtherBackend extends HaskDataCon {
  constructor(public name: string) {
    super();
    this.args = [new HaskellString(name)];
  }
}

export enum CompilerBackend_ {
  LaTeX = "LaTeX",
  QuickLaTeX = "QuickLaTeX"
}

export class Compile extends Interaction {
  constructor(public backend: CompilerBackend, public argv: string[]) {
    super();
    this.args = [
      this.backend,
      new HaskellList(this.argv.map(i => new HaskellString(i)))
    ];
  }
}

export class Constraints extends Interaction {}

export class Metas extends Interaction {}

export enum Rewrite {
  AsIs = "AsIs",
  Instantiated = "Instantiated",
  HeadNormal = "HeadNormal",
  Simplified = "Simplified",
  Normalised = "Normalised"
}

export class ShowModuleContentsToplevel extends Interaction {
  constructor(rewrite: Rewrite, module: string) {
    super();
    this.args = [rewrite, new HaskellString(module)];
  }
}

export class SearchAboutToplevel extends Interaction {
  constructor(public rewrite: Rewrite, public pattern: string) {
    super();
    this.args = [rewrite, new HaskellString(pattern)];
  }
}

export class SolveAll extends Interaction {
  constructor(public rewrite: Rewrite) {
    super();
    this.args = [this.rewrite];
  }
  commandName = "solveAll";
}

export enum NoRange {
  NoRange = "noRange"
}

export type AgdaRange = IntervalsToRange | NoRange;

export function showCons(cons: string, ...args: HaskellValue[]): string {
  let ents = args.map(i => `(${toHaskell(i)})`);
  ents.unshift(cons);
  return ents.join(" ");
}

export class AbsolutePath extends HaskDataCon {
  constructor(path: string) {
    super();
    this.args = [new HaskellString(path)];
  }
  consName = "mkAbsolute";
}

export class Maybe<T extends HaskellValue> implements ToHaskell {
  constructor(public content: null | T) {}
  toHaskell() {
    if (this.content) {
      return showCons("Just", this.content);
    } else {
      return "Nothing";
    }
  }
}

export class Unit implements ToHaskell {
  constructor() {}
  toHaskell() {
    return "()";
  }
}
export type SrcFile = Unit | null | AbsolutePath;

export class AgdaPosition extends HaskDataCon {
  constructor(
    private srcFile: SrcFile,
    private pos: number,
    private line: number,
    private col: number
  ) {
    super();
    let file = srcFile instanceof Unit ? srcFile : new Maybe(this.srcFile);
    this.args = [file, this.pos, this.line, this.col];
  }
  consName = "Pn";
}

export class Interval extends HaskDataCon {
  constructor(iStart: AgdaPosition, iEnd: AgdaPosition) {
    super();
    this.args = [iStart, iEnd];
  }
}

export class IntervalsToRange extends HaskDataCon {
  constructor(srcFile: SrcFile, ints: Interval[]) {
    super();
    this.args = [
      srcFile instanceof Unit ? srcFile : new Maybe(srcFile),
      new HaskellList(ints)
    ];
  }
  consName = "intervalsToRange";
}

export type HaskellValue = ToHaskell | number | string | boolean;

export class HaskellList implements ToHaskell {
  constructor(public contents: HaskellValue[]) {}
  toHaskell() {
    let str = "[";
    str += this.contents.map(i => `${toHaskell(i)}`).join(", ");
    str += "]";
    return str;
  }
}

export function toHaskell(hask: HaskellValue): string {
  if (typeof hask === "string") {
    return hask;
  } else if (typeof hask === "number") {
    return JSON.stringify(hask);
  } else if (typeof hask === "boolean") {
    if (hask) {
      return "True";
    } else {
      return "False";
    }
  } else {
    return hask.toHaskell();
  }
}
export interface ToHaskell {
  toHaskell(): string;
}

export class HaskellString implements ToHaskell {
  constructor(public contents: string) {}
  toHaskell() {
    return JSON.stringify(this.contents);
  }
}

export class RawHaskell implements ToHaskell {
  constructor(public contents: string) {}
  toHaskell() {
    return this.contents;
  }
}

export type InteractionId = number;

export class SolveOne extends Interaction {
  constructor(
    public rewrite: Rewrite,
    public interactionId: InteractionId,
    public range: AgdaRange,
    public name: string
  ) {
    super();
    this.args = [rewrite, interactionId, range, new HaskellString(name)];
  }
  commandName = "solveOne";
}

export class AutoOne extends Interaction {
  constructor(
    public interactionId: InteractionId,
    public range: AgdaRange,
    public name: string
  ) {
    super();
    this.args = [interactionId, range, new HaskellString(name)];
  }
  commandName = "autoOne";
}

export class AutoAll extends Interaction {
  commandName = "autoAll";
}

export class InferToplevel extends Interaction {
  constructor(rewrite: Rewrite, expr: string) {
    super();
    this.args = [rewrite, new HaskellString(expr)];
  }
}

export enum ComputeMode {
  DefaultCompute = "DefaultCompute",
  IgnoreAbstract = "IgnoreAbstract",
  UseShowInstance = "UseShowInstance"
}

export class ComputeToplevel extends Interaction {
  constructor(compute: ComputeMode, expr: string) {
    super();
    this.args = [compute, new HaskellString(expr)];
  }
}

export class LoadHighlightingInfo extends Interaction {
  constructor(path: string) {
    super();
    this.args = [new HaskellString(path)];
  }
}

export enum Remove {
  Remove = "Remove",
  Keep = "Keep"
}

export class TokenHighlighting extends Interaction {
  constructor(path: string, remove: Remove) {
    super();
    this.args = [new HaskellString(path), remove];
  }
}

export class Highlight extends Interaction {
  constructor(iid: InteractionId, range: AgdaRange, expr: string) {
    super();
    this.args = [iid, range, new HaskellString(expr)];
  }
}

export class ToggleImplicitArgs extends Interaction {
  constructor() {
    super();
  }
  toHaskell() {
    return "ToggleImplicitArgs";
  }
}
export class ShowImplicitArgs extends Interaction {
  constructor(p: boolean) {
    super();
    this.args = [p];
  }
  toHaskell() {
    return showCons("ShowImplicitArgs", ...this.args);
  }
}

export type UseForce = number;

export class Give extends Interaction {
  constructor(
    forced: UseForce,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [forced, iid, range, new HaskellString(expr)];
  }
}

export class Refine extends Interaction {
  constructor(iid: InteractionId, range: AgdaRange, expr: string) {
    super();
    this.args = [iid, range, new HaskellString(expr)];
  }
}

export class Intro extends Interaction {
  constructor(p: boolean, iid: InteractionId, range: AgdaRange, expr: string) {
    super();
    this.args = [p, iid, range, new HaskellString(expr)];
  }
}

export class RefineOrIntro extends Interaction {
  constructor(p: boolean, iid: InteractionId, range: AgdaRange, expr: string) {
    super();
    this.args = [p, iid, range, new HaskellString(expr)];
  }
}

export class Context extends Interaction {
  constructor(
    rewrite: Rewrite,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [rewrite, iid, range, new HaskellString(expr)];
  }
}

export class HelperFunction extends Interaction {
  constructor(
    rewrite: Rewrite,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [rewrite, iid, range, new HaskellString(expr)];
  }
}

export class Infer extends Interaction {
  constructor(
    rewrite: Rewrite,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [rewrite, iid, range, new HaskellString(expr)];
  }
}

export class GoalType extends Interaction {
  constructor(
    rewrite: Rewrite,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [rewrite, iid, range, new HaskellString(expr)];
  }
}

export class ElaborateGive extends Interaction {
  constructor(
    rewrite: Rewrite,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [rewrite, iid, range, new HaskellString(expr)];
  }
}

export class GoalTypeContext extends Interaction {
  constructor(
    rewrite: Rewrite,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [rewrite, iid, range, new HaskellString(expr)];
  }
}

export class GoalTypeContextInfer extends Interaction {
  constructor(
    rewrite: Rewrite,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [rewrite, iid, range, new HaskellString(expr)];
  }
}

export class GoalTypeContextCheck extends Interaction {
  constructor(
    rewrite: Rewrite,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [rewrite, iid, range, new HaskellString(expr)];
  }
}

export class ShowModuleContents extends Interaction {
  constructor(
    rewrite: Rewrite,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [rewrite, iid, range, new HaskellString(expr)];
  }
}

export class MakeCase extends Interaction {
  constructor(iid: InteractionId, range: AgdaRange, expr: string) {
    super();
    this.args = [iid, range, new HaskellString(expr)];
  }
}

export class Compute extends Interaction {
  constructor(
    compute: ComputeMode,
    iid: InteractionId,
    range: AgdaRange,
    expr: string
  ) {
    super();
    this.args = [compute, iid, range, new HaskellString(expr)];
  }
}

export class WhyInScope extends Interaction {
  constructor(iid: InteractionId, range: AgdaRange, expr: string) {
    super();
    this.args = [iid, range, new HaskellString(expr)];
  }
}

export class WhyInScopeToplevel extends Interaction {
  constructor(expr: string) {
    super();
    this.args = [new HaskellString(expr)];
  }
}

export class ShowVersion extends Interaction {}
export class Abort extends Interaction {}
