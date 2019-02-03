export type DisplayInfo =
  | CompilationOk
  | Constraints
  | AllGoalsWarnings
  | Time
  | Error
  | Intro
  | Auto
  | ModuleContents
  | SearchAbout
  | WhyInScope
  | NormalForm
  | GoalType
  | CurrentGoal
  | InferredType
  | Context
  | HelperFunction
  | Version;

export interface CompilationOk {
  kind: "CompilationOk";
  warnings: string;
  errors: string;
}

export interface Constraints {
  kind: "Constraints";
  constraints: string;
}

export interface AllGoalsWarnings {
  kind: "AllGoalsWarnings";
  goals: string;
  warnings: string;
  errors: string;
}

export interface Time {
  kind: "Time";
  payload: string;
}

export interface Error {
  kind: "Error";
  payload: string;
}

export interface Intro {
  kind: "Intro";
  payload: string;
}

export interface Auto {
  kind: "Auto";
  payload: string;
}

export interface ModuleContents {
  kind: "ModuleContents";
  payload: string;
}

export interface SearchAbout {
  kind: "SearchAbout";
  payload: string;
}

export interface WhyInScope {
  kind: "WhyInScope";
  payload: string;
}

export interface NormalForm {
  kind: "NormalForm";
  payload: string;
}

export interface GoalType {
  kind: "GoalType";
  payload: string;
}

export interface CurrentGoal {
  kind: "CurrentGoal";
  payload: string;
}

export interface InferredType {
  kind: "InferredType";
  payload: string;
}

export interface Context {
  kind: "Context";
  payload: string;
}

export interface HelperFunction {
  kind: "HelperFunction";
  payload: string;
}

export interface Version {
  kind: "Version";
  version: string;
}
