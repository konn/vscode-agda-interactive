import {
  window,
  ThemeColor,
  TextEditorDecorationType,
  DecorationRenderOptions,
  DecorationRangeBehavior
} from "vscode";
import { Aspects } from "./response";

export function FUNCTION_OPERATOR() {
  return window.createTextEditorDecorationType({
    color: new ThemeColor("entity.name.function.agda")
  });
}

const SYMBOL_STYLE: DecorationRenderOptions = {
  color: "#a9a9a9"
};

const KEYWORD_STYLE: DecorationRenderOptions = {
  color: "#e06c75",
  fontWeight: "bold"
};

const PRAGMA_STYLE: DecorationRenderOptions = {
  color: "#ffffff",
  fontWeight: "bold"
};

const PRIM_TYPE_STYLE: DecorationRenderOptions = {
  color: "#56b6c2",
  fontWeight: "bold"
};

const NUMBER_STYLE: DecorationRenderOptions = {
  color: "#c678dd"
};

const PRIMITIVE_STYLE: DecorationRenderOptions = {
  color: "#61afef"
};

const COMMENT_STYLE: DecorationRenderOptions = {
  color: "#676f7d",
  fontStyle: "italic"
};

const MODULE_STYLE: DecorationRenderOptions = {};

const IND_CONS_STYLE: DecorationRenderOptions = {
  color: "#56b6c2",
  fontWeight: "bold"
};

const BOUND_STYLE: DecorationRenderOptions = {
  color: "#ffffff",
  fontWeight: "#bolder"
};

const DATATYPE_STYLE: DecorationRenderOptions = {};

const FUNCTION_STYLE: DecorationRenderOptions = {
  color: "#98c379"
};

const POSTULATE_STYLE: DecorationRenderOptions = {
  color: "#61afef"
};

export function toDecoration(aspects: Aspects): TextEditorDecorationType {
  let opts: DecorationRenderOptions = {};
  if (aspects.atoms.indexOf("symbol") >= 0) {
    opts = SYMBOL_STYLE;
  } else if (aspects.atoms.indexOf("keyword") >= 0) {
    opts = KEYWORD_STYLE;
  } else if (aspects.atoms.indexOf("pragma") >= 0) {
    opts = PRAGMA_STYLE;
  } else if (aspects.atoms.indexOf("primitivetype") >= 0) {
    opts = PRIM_TYPE_STYLE;
  } else if (aspects.atoms.indexOf("primitive") >= 0) {
    opts = PRIMITIVE_STYLE;
  } else if (aspects.atoms.indexOf("number") >= 0) {
    opts = NUMBER_STYLE;
  } else if (aspects.atoms.indexOf("comment") >= 0) {
    opts = COMMENT_STYLE;
  } else if (aspects.atoms.indexOf("module") >= 0) {
    opts = MODULE_STYLE;
  } else if (aspects.atoms.indexOf("inductiveconstructor") >= 0) {
    opts = IND_CONS_STYLE;
  } else if (aspects.atoms.indexOf("bound") >= 0) {
    opts = BOUND_STYLE;
  } else if (aspects.atoms.indexOf("datatype") >= 0) {
    opts = DATATYPE_STYLE;
  } else if (aspects.atoms.indexOf("function") >= 0) {
    opts = FUNCTION_STYLE;
  } else if (aspects.atoms.indexOf("postulate") >= 0) {
    opts = POSTULATE_STYLE;
  }
  opts.rangeBehavior = DecorationRangeBehavior.ClosedClosed;
  return window.createTextEditorDecorationType(opts);
}
