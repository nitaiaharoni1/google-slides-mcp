/**
 * Google Slides API Type Definitions
 */

import { slides_v1 } from "googleapis";

// Re-export commonly used types from googleapis
export type Presentation = slides_v1.Schema$Presentation;
export type Page = slides_v1.Schema$Page;
export type PageElement = slides_v1.Schema$PageElement;
export type Request = slides_v1.Schema$Request;
export type Response = slides_v1.Schema$Response;
export type Size = slides_v1.Schema$Size;
export type Dimension = slides_v1.Schema$Dimension;
export type PageProperties = slides_v1.Schema$PageProperties;
export type LayoutProperties = slides_v1.Schema$LayoutProperties;
export type TextContent = slides_v1.Schema$TextContent;
export type Shape = slides_v1.Schema$Shape;
export type Table = slides_v1.Schema$Table;
export type Image = slides_v1.Schema$Image;
export type Video = slides_v1.Schema$Video;
export type WordArt = slides_v1.Schema$WordArt;
export type SheetsChart = slides_v1.Schema$SheetsChart;
export type Group = slides_v1.Schema$Group;
export type Line = slides_v1.Schema$Line;
export type AutoText = slides_v1.Schema$AutoText;

// Tool argument interfaces
export interface CreatePresentationArgs {
  title: string;
  presentationId?: string;
  locale?: string;
}

export interface GetPresentationArgs {
  presentationId: string;
}

export interface DeletePresentationArgs {
  presentationIds: string[];
}

export interface CreateSlideArgs {
  presentationId: string;
  layoutId?: string;
  insertionIndex?: number;
}

export interface DuplicateSlideArgs {
  presentationId: string;
  slideId: string;
  insertionIndex?: number;
}

export interface DeleteSlideArgs {
  presentationId: string;
  slideIds: string[];
}

export interface ReorderSlidesArgs {
  presentationId: string;
  slideIds: string[];
}

export interface GetSlideArgs {
  presentationId: string;
  slideId: string;
}

export interface GetSlideThumbnailArgs {
  presentationId: string;
  slideId: string;
  mimeType?: string;
  thumbnailSize?: string;
}

export interface RGBColor {
  red?: number;
  green?: number;
  blue?: number;
}

export interface ColorSpec {
  rgbColor?: RGBColor;
}

export interface AddTextBoxArgs {
  presentationId: string;
  pageId: string;
  text: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  autoFit?: boolean; // Automatically adjust font size to fit text
  alignment?: "START" | "CENTER" | "END" | "JUSTIFIED"; // Text alignment
  // Formatting options - applied at creation time to prevent size/position issues
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  foregroundColor?: ColorSpec;
}

export interface TextBoxDefinition {
  text: string;
  x?: number; // Custom X position in points. If not provided, uses automatic positioning.
  y?: number; // Custom Y position in points. If not provided, uses automatic vertical stacking.
  width?: number; // If not provided, uses defaultWidth
  height?: number; // If not provided, auto-calculated or uses defaultHeight
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  alignment?: "START" | "CENTER" | "END" | "JUSTIFIED";
  autoFit?: boolean;
  foregroundColor?: ColorSpec;
}

export interface AddMultipleTextBoxesArgs {
  presentationId: string;
  pageId: string;
  textBoxes: TextBoxDefinition[]; // Always an array (can be single element)
  startX?: number; // Starting X position (default: centers boxes)
  startY?: number; // Starting Y position (default: margin)
  defaultWidth?: number; // Default width for all boxes (default: 500)
  defaultHeight?: number; // Default height if not auto-calculated (default: 100)
  verticalGap?: number; // Space between boxes (default: 16)
  centerHorizontally?: boolean; // Center all boxes horizontally (default: true)
}

export interface ImageOutline {
  color?: {
    rgbColor?: {
      red?: number;
      green?: number;
      blue?: number;
    };
  };
  weight?: number; // Outline weight in points
  dashStyle?:
    | "SOLID"
    | "DOT"
    | "DASH"
    | "DASH_DOT"
    | "LONG_DASH"
    | "LONG_DASH_DOT";
}

export interface ImageShadow {
  type?: "OUTER";
  color?: {
    rgbColor?: {
      red?: number;
      green?: number;
      blue?: number;
    };
    alpha?: number; // 0-1, opacity of shadow
  };
  blurRadius?: number; // Blur radius in points
  offsetX?: number; // Horizontal offset in points
  offsetY?: number; // Vertical offset in points
}

export interface ImageLink {
  url?: string;
  relativeLink?: "NEXT_SLIDE" | "PREVIOUS_SLIDE" | "FIRST_SLIDE" | "LAST_SLIDE";
  pageObjectId?: string;
  slideIndex?: number;
}

export interface AddImageArgs {
  presentationId: string;
  pageId: string;
  imageUrl: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  preserveAspectRatio?: boolean; // Preserve image aspect ratio when clamping
  title?: string; // Title for accessibility (alt text)
  description?: string; // Description for accessibility (alt text)
  outline?: ImageOutline;
  shadow?: ImageShadow;
  link?: ImageLink;
}

export interface UpdateImagePropertiesArgs {
  presentationId: string;
  objectId: string;
  outline?: ImageOutline | null; // null to remove outline
  shadow?: ImageShadow | null; // null to remove shadow
  link?: ImageLink | null; // null to remove link
}

export interface AddShapeArgs {
  presentationId: string;
  pageId: string;
  shapeType: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Optional text content and formatting
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  foregroundColor?: ColorSpec;
  alignment?: "START" | "CENTER" | "END" | "JUSTIFIED";
}

export interface UpdateTextArgs {
  presentationId: string;
  objectId: string;
  text: string;
}

export interface DeleteElementArgs {
  presentationId: string;
  objectIds: string[];
}

export interface AddLineArgs {
  presentationId: string;
  pageId: string;
  x1: number; // Start X position
  y1: number; // Start Y position
  x2: number; // End X position
  y2: number; // End Y position
  lineType?:
    | "STRAIGHT"
    | "STRAIGHT_CONNECTOR"
    | "CURVED_CONNECTOR"
    | "ELBOW_CONNECTOR"
    | "BENT_CONNECTOR";
  lineFill?: {
    solidFill?: {
      color: {
        rgbColor: {
          red: number;
          green: number;
          blue: number;
        };
      };
    };
  };
  weight?: number; // Line weight in points
}

export interface AddLinkArgs {
  presentationId: string;
  objectId: string;
  startIndex: number;
  endIndex: number;
  url: string;
}

export interface AddListArgs {
  presentationId: string;
  pageId: string;
  items: string[];
  listType?: "BULLET" | "NUMBERED";
  x?: number;
  y?: number;
  width?: number;
  fontSize?: number;
  bulletStyle?:
    | "BULLET_DISC_CIRCLE_SQUARE"
    | "BULLET_DIAMONDX_ARROW3D_SQUARE"
    | "BULLET_CHECKBOX"
    | "BULLET_ARROW_DIAMOND_DISC"
    | "BULLET_STAR_CIRCLE_SQUARE"
    | "BULLET_ARROW3D_CIRCLE_SQUARE"
    | "BULLET_LEFTTRIANGLE_DIAMOND_DISC"
    | "BULLET_DIAMONDX_HOLLOWDIAMOND_SQUARE"
    | "BULLET_DIAMOND_CIRCLE_SQUARE"
    | "NUMBERED_DECIMAL_ALPHA_ROMAN"
    | "NUMBERED_DECIMAL_ALPHA_ROMAN_PARENS"
    | "NUMBERED_DECIMAL_NESTED"
    | "NUMBERED_UPPERALPHA_ALPHA_ROMAN"
    | "NUMBERED_UPPERROMAN_UPPERALPHA_DECIMAL"
    | "NUMBERED_UPPERALPHA_DECIMAL"
    | "NUMBERED_UPPERROMAN_DECIMAL";
}

export interface CreateTableArgs {
  presentationId: string;
  pageId: string;
  rows: number;
  columns: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface UpdateTableCellArgs {
  presentationId: string;
  objectId: string;
  rowIndex: number;
  columnIndex: number;
  text: string;
  backgroundColor?: {
    rgbColor?: {
      red?: number;
      green?: number;
      blue?: number;
    };
  } | null; // null to remove background
  contentAlignment?: "TOP" | "MIDDLE" | "BOTTOM" | null; // null to use default
}

export interface InsertTableRowsArgs {
  presentationId: string;
  objectId: string;
  rowIndex: number;
  numRows: number;
}

export interface DeleteTableRowsArgs {
  presentationId: string;
  objectId: string;
  rowIndex: number;
  numRows: number;
}

export interface InsertTableColumnsArgs {
  presentationId: string;
  objectId: string;
  columnIndex: number;
  numColumns: number;
  insertRight?: boolean; // true = insert right, false = insert left (default: true)
}

export interface DeleteTableColumnArgs {
  presentationId: string;
  objectId: string;
  columnIndexes: number[];
}

export interface MergeTableCellsArgs {
  presentationId: string;
  objectId: string;
  startRowIndex: number;
  startColumnIndex: number;
  rowSpan: number;
  columnSpan: number;
}

export interface UnmergeTableCellsArgs {
  presentationId: string;
  objectId: string;
  startRowIndex: number;
  startColumnIndex: number;
  rowSpan: number;
  columnSpan: number;
}

export interface UpdateTableBorderPropertiesArgs {
  presentationId: string;
  objectId: string;
  borderPosition?:
    | "ALL"
    | "OUTER"
    | "INNER"
    | "TOP"
    | "BOTTOM"
    | "LEFT"
    | "RIGHT"
    | "INNER_HORIZONTAL"
    | "INNER_VERTICAL";
  startRowIndex?: number;
  startColumnIndex?: number;
  rowSpan?: number;
  columnSpan?: number;
  color?: {
    rgbColor?: {
      red?: number;
      green?: number;
      blue?: number;
    };
  };
  weight?: number; // Weight in points
  dashStyle?:
    | "SOLID"
    | "DOT"
    | "DASH"
    | "DASH_DOT"
    | "LONG_DASH"
    | "LONG_DASH_DOT";
}

export interface ReplaceImageArgs {
  presentationId: string;
  objectId: string;
  imageUrl: string;
  imageReplaceMethod?: "CENTER_INSIDE" | "CENTER_CROP";
}

export interface CreateParagraphBulletsArgs {
  presentationId: string;
  objectId: string;
  startIndex?: number;
  endIndex?: number;
  bulletPreset?:
    | "BULLET_DISC_CIRCLE_SQUARE"
    | "BULLET_DIAMONDX_ARROW3D_SQUARE"
    | "BULLET_CHECKBOX"
    | "BULLET_ARROW_DIAMOND_DISC"
    | "BULLET_STAR_CIRCLE_SQUARE"
    | "BULLET_ARROW3D_CIRCLE_SQUARE"
    | "BULLET_LEFTTRIANGLE_DIAMOND_DISC"
    | "BULLET_DIAMONDX_HOLLOWDIAMOND_SQUARE"
    | "BULLET_DIAMOND_CIRCLE_SQUARE"
    | "NUMBERED_DIGIT_ALPHA_ROMAN"
    | "NUMBERED_DIGIT_ALPHA_ROMAN_PARENS"
    | "NUMBERED_DIGIT_NESTED"
    | "NUMBERED_UPPERALPHA_ALPHA_ROMAN"
    | "NUMBERED_UPPERROMAN_UPPERALPHA_DIGIT"
    | "NUMBERED_ZERODIGIT_ALPHA_ROMAN";
  rowIndex?: number;
  columnIndex?: number;
}

export interface DeleteParagraphBulletsArgs {
  presentationId: string;
  objectId: string;
  startIndex?: number;
  endIndex?: number;
  rowIndex?: number;
  columnIndex?: number;
}

export interface UpdatePageElementAltTextArgs {
  presentationId: string;
  objectId: string;
  title?: string;
  description?: string;
}

export interface FormatTextArgs {
  presentationId: string;
  objectId: string;
  startIndex?: number;
  endIndex?: number;
  // Text style properties
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  smallCaps?: boolean;
  baselineOffset?: "NONE" | "SUPERSCRIPT" | "SUBSCRIPT";
  foregroundColor?: {
    rgbColor?: {
      red?: number;
      green?: number;
      blue?: number;
    };
  };
  backgroundColor?: {
    rgbColor?: {
      red?: number;
      green?: number;
      blue?: number;
    };
  };
  link?: {
    url?: string;
    relativeLink?:
      | "NEXT_SLIDE"
      | "PREVIOUS_SLIDE"
      | "FIRST_SLIDE"
      | "LAST_SLIDE";
    pageObjectId?: string;
    slideIndex?: number;
  };
  weightedFontFamily?: {
    fontFamily: string;
    weight?: number; // 100-900, multiples of 100
  };
  // Paragraph style properties
  alignment?: string;
  spacingMode?: string;
  spacingMagnitude?: number; // spaceAbove
  spaceBelow?: number;
  lineSpacing?: number; // Percentage of normal (100.0 = normal)
  indentFirstLine?: number;
  indentStart?: number;
  indentEnd?: number;
  direction?: "LEFT_TO_RIGHT" | "RIGHT_TO_LEFT";
}

export interface FormatShapeArgs {
  presentationId: string;
  objectId: string;
  fillColor?: {
    rgbColor?: {
      red?: number;
      green?: number;
      blue?: number;
    };
  };
  outline?: {
    color?: {
      rgbColor?: {
        red?: number;
        green?: number;
        blue?: number;
      };
    };
    weight?: number;
  };
  shadow?: {
    type?: "OUTER" | "INNER";
    color?: {
      rgbColor?: {
        red?: number;
        green?: number;
        blue?: number;
      };
      alpha?: number; // 0-1, opacity of shadow
    };
    blurRadius?: number; // Blur radius in points
    offsetX?: number; // Horizontal offset in points
    offsetY?: number; // Vertical offset in points
    rotation?: number; // Rotation angle in degrees
  };
}

export interface SetElementPositionArgs {
  presentationId: string;
  objectId: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface UpdateZOrderArgs {
  presentationId: string;
  objectIds: string[];
  operation:
    | "BRING_TO_FRONT"
    | "BRING_FORWARD"
    | "SEND_BACKWARD"
    | "SEND_TO_BACK";
}

export interface SetSlideBackgroundArgs {
  presentationId: string;
  slideId: string;
  // Solid color background
  backgroundColor?: {
    rgbColor: {
      red: number;
      green: number;
      blue: number;
    };
  };
  // Gradient background
  gradientFill?: {
    stops: Array<{
      color: {
        rgbColor: {
          red: number;
          green: number;
          blue: number;
        };
      };
      position?: number; // 0.0 to 1.0
    }>;
    angle?: number; // Gradient angle in degrees (0-360)
  };
  // Image background
  imageUrl?: string;
}

export interface ApplyParagraphStyleArgs {
  presentationId: string;
  objectId: string;
  startIndex?: number;
  endIndex?: number;
  alignment?: string;
  spacingMode?: string;
  spacingMagnitude?: number;
  indentFirstLine?: number;
  indentStart?: number;
}

export interface ListLayoutsArgs {
  presentationId: string;
}

export interface ApplyLayoutArgs {
  presentationId: string;
  slideId: string;
  layoutId: string;
}

export interface ListMastersArgs {
  presentationId: string;
}

export interface BatchUpdateArgs {
  presentationId: string;
  requests: Request[];
}

export interface CreateTableWithDataArgs {
  presentationId: string;
  pageId: string;
  headers: string[];
  rows: string[][];
  position?: "center" | "full" | { x: number; y: number };
  headerStyle?: {
    bold?: boolean;
    backgroundColor?: {
      rgbColor: { red: number; green: number; blue: number };
    };
  };
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface DesignedSlideContent {
  title?: string;
  subtitle?: string;
  bullets?: string[];
  leftColumn?: { heading: string; bullets: string[] };
  rightColumn?: { heading: string; bullets: string[] };
  tableData?: { headers: string[]; rows: string[][] };
  metrics?: Array<{ label: string; value: string; subtext?: string }>;
  quote?: { text: string; attribution?: string };
  roadmap?: Array<{ label: string; date?: string; description?: string }>;
  funnel?: Array<{ label: string; value?: string; percentage?: number }>;
  imageUrl?: string;
  imageCaption?: string;
  statsHighlight?: { value: string; label: string; context?: string };
}

export interface CreateDesignedSlideArgs {
  presentationId: string;
  slideId?: string;
  template:
    | "title"
    | "title_bullets"
    | "two_column"
    | "comparison_table"
    | "metrics"
    | "team"
    | "roadmap"
    | "quote"
    | "stats_highlight"
    | "image_caption"
    | "funnel";
  content: DesignedSlideContent;
  theme?: "dark_professional" | "light_clean" | "startup_bold";
  speakerNotes?: string;
}

export interface PitchDeckSlide {
  type:
    | "cover"
    | "problem"
    | "solution"
    | "market"
    | "competitive"
    | "traction"
    | "metrics"
    | "team"
    | "ask"
    | "closing"
    | "custom";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: Record<string, any>; // Content structure varies by slide type
}

export interface CreatePitchDeckArgs {
  title: string;
  slides: PitchDeckSlide[];
  theme?: "dark_professional" | "light_clean" | "startup_bold";
}

export interface AddSpeakerNotesArgs {
  presentationId: string;
  slideId: string;
  notes: string;
}

export interface GetSpeakerNotesArgs {
  presentationId: string;
  slideId: string;
}

export interface CreateChartArgs {
  presentationId: string;
  pageId: string;
  chartType: "bar" | "line" | "pie" | "column";
  data: {
    labels: string[];
    series: Array<{ name: string; values: number[] }>;
  };
  title?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ExportToPdfArgs {
  presentationId: string;
  returnBase64?: boolean;
}

// Unit types
export type Unit = "EMU" | "PT" | "UNIT_UNSPECIFIED";

// Shape types
export type ShapeType =
  | "RECTANGLE"
  | "ROUND_RECTANGLE"
  | "ELLIPSE"
  | "ARC"
  | "BENT_ARROW"
  | "BENT_UP_ARROW"
  | "BRACE"
  | "BRACKET"
  | "CAN"
  | "CHEVRON"
  | "CLOUD"
  | "CORNER"
  | "CUBE"
  | "CURVED_DOWN_ARROW"
  | "CURVED_LEFT_ARROW"
  | "CURVED_RIGHT_ARROW"
  | "CURVED_UP_ARROW"
  | "DECAGON"
  | "DIAGONAL_STRIPE"
  | "DIAMOND"
  | "DODECAGON"
  | "DONUT"
  | "DOUBLE_WAVE"
  | "DOWN_ARROW"
  | "DOWN_ARROW_CALLOUT"
  | "FOLDED_CORNER"
  | "FRAME"
  | "FUNNEL"
  | "GEAR_6"
  | "GEAR_9"
  | "HAILSTONE"
  | "HEART"
  | "HEPTAGON"
  | "HEXAGON"
  | "HOME_PLATE"
  | "HORIZONTAL_SCROLL"
  | "IRREGULAR_SEAL_1"
  | "IRREGULAR_SEAL_2"
  | "LEFT_ARROW"
  | "LEFT_ARROW_CALLOUT"
  | "LEFT_BRACE"
  | "LEFT_BRACKET"
  | "LEFT_RIGHT_ARROW"
  | "LEFT_RIGHT_ARROW_CALLOUT"
  | "LEFT_RIGHT_UP_ARROW"
  | "LEFT_UP_ARROW"
  | "LIGHTNING_BOLT"
  | "MATH_DIVIDE"
  | "MATH_EQUAL"
  | "MATH_MINUS"
  | "MATH_MULTIPLY"
  | "MATH_NOT_EQUAL"
  | "MATH_PLUS"
  | "MOON"
  | "NO_SMOKING"
  | "NOTCHED_RIGHT_ARROW"
  | "OCTAGON"
  | "PARALLELOGRAM"
  | "PENTAGON"
  | "PIE"
  | "PLAQUE"
  | "PLUS"
  | "QUAD_ARROW"
  | "QUAD_ARROW_CALLOUT"
  | "RIBBON"
  | "RIBBON_2"
  | "RIGHT_ARROW"
  | "RIGHT_ARROW_CALLOUT"
  | "RIGHT_BRACE"
  | "RIGHT_BRACKET"
  | "ROUND_1_RECTANGLE"
  | "ROUND_2_DIAGONAL_RECTANGLE"
  | "ROUND_2_SAME_RECTANGLE"
  | "RIGHT_TRIANGLE"
  | "SMILEY_FACE"
  | "SNIP_1_RECTANGLE"
  | "SNIP_2_DIAGONAL_RECTANGLE"
  | "SNIP_2_SAME_RECTANGLE"
  | "SNIP_ROUND_RECTANGLE"
  | "STAR_10"
  | "STAR_12"
  | "STAR_16"
  | "STAR_24"
  | "STAR_32"
  | "STAR_4"
  | "STAR_5"
  | "STAR_6"
  | "STAR_7"
  | "STAR_8"
  | "STRIPED_RIGHT_ARROW"
  | "SUN"
  | "TRAPEZOID"
  | "TRIANGLE"
  | "UP_ARROW"
  | "UP_ARROW_CALLOUT"
  | "UP_DOWN_ARROW"
  | "UTURN_ARROW"
  | "VERTICAL_SCROLL"
  | "WAVE"
  | "WEDGE_ELLIPSE_CALLOUT"
  | "WEDGE_RECTANGLE_CALLOUT"
  | "WEDGE_ROUND_RECTANGLE_CALLOUT";

// Alignment types
export type Alignment =
  | "ALIGNMENT_UNSPECIFIED"
  | "START"
  | "CENTER"
  | "END"
  | "JUSTIFIED";

// Spacing modes
export type SpacingMode =
  | "SPACING_MODE_UNSPECIFIED"
  | "NEVER_COLLAPSE"
  | "COLLAPSE_LISTS";
