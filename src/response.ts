import * as di from "./display-info";
import { AgdaRange } from "./commands";

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

export interface InteractionPoints {
  kind: "InteractionPoints";
  interactionPoints: InteractionId[];
}

export type HighlightingInfo =
  | DirectHighlightingInfo
  | IndirectHighlightingInfo;

export interface DirectHighlightingInfo {
  kind: "HighlightingInfo";
  direct: true;
  info: {
    remove: boolean;
    payload: [AgdaRange, Aspects][];
  };
}

export interface Aspect {}

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
