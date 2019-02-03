import {
  HighlightingLevel,
  HighlightingMethod,
  Interaction,
  HaskellString,
  HaskDataCon
} from "./commands";

export default class IOTCM extends HaskDataCon {
  constructor(
    public file: string,
    public lvl: HighlightingLevel,
    public mtd: HighlightingMethod,
    public int: Interaction
  ) {
    super();
    this.args = [new HaskellString(file), lvl, mtd, int];
  }
}
