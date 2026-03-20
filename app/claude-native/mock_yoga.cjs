// Minimal mock yoga that does simple top-to-bottom layout
// Just enough to make Ink render without WASM

const Unit = { Point: 1, Percent: 2, Auto: 3, Undefined: 0 };
const Direction = { LTR: 0, RTL: 1, Inherit: 2 };
const FlexDirection = { Column: 0, ColumnReverse: 1, Row: 2, RowReverse: 3 };
const Justify = { FlexStart: 0, Center: 1, FlexEnd: 2, SpaceBetween: 3, SpaceAround: 4, SpaceEvenly: 5 };
const Align = { Auto: 0, FlexStart: 1, Center: 2, FlexEnd: 3, Stretch: 4, Baseline: 5, SpaceBetween: 6, SpaceAround: 7 };
const Wrap = { NoWrap: 0, Wrap: 1, WrapReverse: 2 };
const Overflow = { Visible: 0, Hidden: 1, Scroll: 2 };
const Display = { Flex: 0, None: 1 };
const Edge = { Left: 0, Top: 1, Right: 2, Bottom: 3, Start: 4, End: 5, Horizontal: 6, Vertical: 7, All: 8 };
const PositionType = { Static: 0, Relative: 1, Absolute: 2 };
const Gutter = { Column: 0, Row: 1, All: 2 };

class Node {
  constructor() {
    this._children = [];
    this._parent = null;
    this._style = {};
    this._layout = { left: 0, top: 0, width: 0, height: 0 };
    this._measureFunc = null;
  }
  static create() { return new Node(); }
  insertChild(child, index) { this._children.splice(index, 0, child); child._parent = this; }
  removeChild(child) { const i = this._children.indexOf(child); if (i >= 0) { this._children.splice(i, 1); child._parent = null; } }
  getChildCount() { return this._children.length; }
  getChild(index) { return this._children[index]; }
  setMeasureFunc(fn) { this._measureFunc = fn; }
  unsetMeasureFunc() { this._measureFunc = null; }
  markDirty() {}
  isDirty() { return false; }
  
  // Style setters (mostly no-ops for basic layout)
  setWidth(v) { this._style.width = v; }
  setWidthPercent(v) { this._style.width = v + '%'; }
  setWidthAuto() { this._style.width = 'auto'; }
  setHeight(v) { this._style.height = v; }
  setHeightPercent(v) { this._style.height = v + '%'; }
  setHeightAuto() { this._style.height = 'auto'; }
  setMinWidth(v) { this._style.minWidth = v; }
  setMinWidthPercent() {}
  setMinHeight(v) { this._style.minHeight = v; }
  setMinHeightPercent() {}
  setMaxWidth(v) { this._style.maxWidth = v; }
  setMaxWidthPercent() {}
  setMaxHeight(v) { this._style.maxHeight = v; }
  setMaxHeightPercent() {}
  setFlexDirection(v) { this._style.flexDirection = v; }
  setFlexWrap(v) { this._style.flexWrap = v; }
  setFlexGrow(v) { this._style.flexGrow = v; }
  setFlexShrink(v) { this._style.flexShrink = v; }
  setFlexBasis(v) { this._style.flexBasis = v; }
  setFlexBasisPercent() {}
  setFlexBasisAuto() {}
  setFlex(v) { this._style.flex = v; }
  setJustifyContent(v) { this._style.justifyContent = v; }
  setAlignItems(v) { this._style.alignItems = v; }
  setAlignSelf(v) { this._style.alignSelf = v; }
  setAlignContent(v) { this._style.alignContent = v; }
  setPosition(edge, v) {}
  setPositionPercent(edge, v) {}
  setPositionType(v) { this._style.positionType = v; }
  setMargin(edge, v) {}
  setPadding(edge, v) {}
  setBorder(edge, v) {}
  setGap(gutter, v) {}
  setOverflow(v) {}
  setDisplay(v) { this._style.display = v; }
  setAspectRatio(v) {}
  
  // Style getters
  getWidth() { return { value: this._style.width || 0, unit: Unit.Point }; }
  getHeight() { return { value: this._style.height || 0, unit: Unit.Point }; }
  getFlexDirection() { return this._style.flexDirection || FlexDirection.Column; }
  getFlexGrow() { return this._style.flexGrow || 0; }
  getFlexShrink() { return this._style.flexShrink || 1; }
  getMinWidth() { return { value: 0, unit: Unit.Undefined }; }
  getMinHeight() { return { value: 0, unit: Unit.Undefined }; }
  getMaxWidth() { return { value: 0, unit: Unit.Undefined }; }
  getMaxHeight() { return { value: 0, unit: Unit.Undefined }; }
  getPosition(edge) { return { value: 0, unit: Unit.Undefined }; }
  getMargin(edge) { return { value: 0, unit: Unit.Undefined }; }
  getPadding(edge) { return { value: 0, unit: Unit.Undefined }; }
  getBorder(edge) { return 0; }
  getFlexBasis() { return { value: 0, unit: Unit.Auto }; }
  getOverflow() { return Overflow.Visible; }
  getDisplay() { return this._style.display || Display.Flex; }
  getGap(gutter) { return 0; }
  
  // Layout
  calculateLayout(width, height, direction) {
    this._doLayout(0, 0, width || 80, height || 24);
  }
  
  _doLayout(x, y, availW, availH) {
    this._layout.left = x;
    this._layout.top = y;
    this._layout.width = typeof this._style.width === 'number' ? this._style.width : availW;
    this._layout.height = typeof this._style.height === 'number' ? this._style.height : 0;
    
    if (this._measureFunc && this._children.length === 0) {
      const measured = this._measureFunc(availW, 1, availH, 1); // MeasureMode.AtMost = 1
      this._layout.width = measured.width || availW;
      this._layout.height = measured.height || 1;
      return;
    }
    
    const isRow = (this._style.flexDirection === FlexDirection.Row || 
                   this._style.flexDirection === FlexDirection.RowReverse);
    
    let offset = 0;
    for (const child of this._children) {
      if (child._style.display === Display.None) continue;
      if (isRow) {
        child._doLayout(offset, 0, availW - offset, availH);
        offset += child._layout.width;
      } else {
        child._doLayout(0, offset, availW, availH - offset);
        offset += child._layout.height;
      }
    }
    
    if (typeof this._style.height !== 'number') {
      this._layout.height = offset || 1;
    }
  }
  
  getComputedLeft() { return this._layout.left; }
  getComputedTop() { return this._layout.top; }
  getComputedWidth() { return this._layout.width; }
  getComputedHeight() { return this._layout.height; }
  getComputedLayout() { return this._layout; }
  getComputedMargin(edge) { return 0; }
  getComputedPadding(edge) { return 0; }
  getComputedBorder(edge) { return 0; }
  
  free() {}
  freeRecursive() {}
}

class Config {
  static create() { return new Config(); }
  setPointScaleFactor(v) {}
  free() {}
}

module.exports = {
  Node, Config, 
  Unit, Direction, FlexDirection, Justify, Align, Wrap,
  Overflow, Display, Edge, PositionType, Gutter,
  UNIT_POINT: Unit.Point, UNIT_PERCENT: Unit.Percent, UNIT_AUTO: Unit.Auto, UNIT_UNDEFINED: Unit.Undefined,
  DIRECTION_LTR: Direction.LTR, DIRECTION_RTL: Direction.RTL, DIRECTION_INHERIT: Direction.Inherit,
};
