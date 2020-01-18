import * as di from "./display-info";
import { readFileSync } from "fs";
import { Interaction, AgdaRange } from "./commands";
import { Range } from "vscode";

export type Response =
  | HighlightingInfo
  | Status
  | JumpToError
  | InteractionPoints
  | GiveAction
  | MakeCase
  | SolveAll
  | DisplayInfo
  | RunningInfo
  | ClearRunningInfo
  | ClearHighlighting
  | DoneAborting;

export function parseResponse(src: string): Response | undefined {
  return JSON.parse(src);
}
export interface DisplayInfo {
  kind: "DisplayInfo";
  info: di.DisplayInfo;
}

export interface DoneAborting {
  kind: "DoneAborting";
}

export interface ClearRunningInfo {
  kind: "ClearRunningInfo";
}

export interface Status {
  kind: "Status";
  status: { showImplicitArguments: boolean; checked: boolean };
}

export interface JumpToError {
  kind: "JumpToError";
  filepath: string;
  position: number;
}

export type InteractionId = number;

export interface InteractionPoint {
  id: InteractionId;
  range: AgdaRange;
}

export interface InteractionPoints {
  kind: "InteractionPoints";
  interactionPoints: InteractionPoint[];
}

export type HighlightingInfo =
  | DirectHighlightingInfo
  | IndirectHighlightingInfo;

export interface DirectHighlightingInfo {
  kind: "HighlightingInfo";
  direct: true;
  info: HighlightInfoBody;
}

export interface HighlightInfoBody {
  remove: boolean;
  payload: [HighlightingRange, Aspects][];
}

export interface DefinitionSite {
  filepath: string;
  position: number;
}

export type HighlightingRange = [number, number];

export enum TokenBased {
  TokenBased = "TokenBased",
  NotOnlyTokenBased = "NotOnlyTokenBased"
}

export interface Aspects {
  range: HighlightingRange;
  atoms: string[];
  tokenBased: TokenBased;
  note?: string;
  definitionSite: DefinitionSite[];
}

export interface IndirectHighlightingInfo {
  kind: "HighlightingInfo";
  direct: false;
  filepath: string;
}

export interface GiveAction {
  kind: "GiveAction";
  interactionPoint: InteractionId;
  giveResult: GiveResult;
}

export type GiveResult = string | boolean;
export const Paren: GiveResult = true;
export const NoParen: GiveResult = false;

export enum MakeCaseVariant {
  Function = "Function",
  ExtendedLambda = "ExtendedLambda"
}

export interface MakeCase {
  kind: "MakeCase";
  variant: MakeCaseVariant;
  clauses: string[];
}

export interface SolveAll {
  kind: "SolveAll";
  solutions: Solution[];
}

export interface Solution {
  interactionPoint: InteractionId;
  expression: string;
}

export interface RunningInfo {
  kind: "RunningInfo";
  debugLevel: number;
  message: string;
}

export interface ClearHighlighting {
  kind: "ClearHighlighting";
  tokenBased: TokenBased;
}

export function parseHighlightInfo(path: string): HighlightInfoBody {
  const {
    remove,
    payload: pays
  }: { remove: boolean; payload: Aspects[] } = JSON.parse(
    readFileSync(path).toString()
  );
  const payload: [HighlightingRange, Aspects][] = pays.map(
    (a: Aspects): [HighlightingRange, Aspects] => [a.range, a]
  );
  return { remove, payload };
}
