/**
 * Chart-related MCP tools
 * Create charts and graphs on slides
 */

import * as crypto from "crypto";
import { ensureSlidesClient } from "../slides";
import { SLIDE_REGIONS } from "../config/constants";
import { MCPToolDefinition } from "../types/mcp";
import { CreateChartArgs } from "../types/slides";
import {
  createStringParam,
  createXPositionParam,
  createYPositionParam,
  createWidthParam,
  createHeightParam,
} from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  SLIDE_ID_EXAMPLES,
  CHART_DATA_EXAMPLES,
} from "../config/examples";
import { ptToEmu } from "./utils";
import { logger } from "../utils/logger";
import { unescapeText } from "../utils/text-handling";

/**
 * Get region coordinates
 */
function getRegion(regionName: keyof typeof SLIDE_REGIONS) {
  return SLIDE_REGIONS[regionName];
}

/**
 * Create a chart on a slide
 * Note: Google Slides API requires charts to be created from Google Sheets
 * This implementation creates a visual representation using shapes as a fallback
 */
const createChart = async (args: CreateChartArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(
    `📊 Creating ${args.chartType} chart on slide: ${args.pageId}`
  );

  const generateId = (prefix: string) =>
    `${prefix}_${crypto.randomBytes(4).toString("hex")}`;

  // Determine position
  const region = getRegion("CENTER");
  const x = args.x ?? region.x;
  const y = args.y ?? region.y;
  const width = args.width ?? region.width;
  const height = args.height ?? region.height * 0.8;

  const requests: Array<Record<string, unknown>> = [];

  // Create title if provided
  if (args.title) {
    const titleId = generateId("chart_title");
    requests.push({
      createShape: {
        objectId: titleId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: args.pageId,
          size: {
            height: { magnitude: ptToEmu(40), unit: "EMU" },
            width: { magnitude: ptToEmu(width), unit: "EMU" },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: ptToEmu(x),
            translateY: ptToEmu(y - 50),
            unit: "EMU",
          },
        },
      },
    });
    requests.push({
      insertText: {
        objectId: titleId,
        insertionIndex: 0,
        text: unescapeText(args.title),
      },
    });
    requests.push({
      updateTextStyle: {
        objectId: titleId,
        style: {
          fontSize: { magnitude: 24, unit: "PT" },
          bold: true,
        },
        fields: "fontSize,bold",
        textRange: { type: "ALL" },
      },
    });
    requests.push({
      updateParagraphStyle: {
        objectId: titleId,
        style: { alignment: "CENTER" },
        fields: "alignment",
        textRange: { type: "ALL" },
      },
    });
  }

  // Create visual chart representation using shapes
  const { labels, series } = args.data;
  const numDataPoints = labels.length;
  const maxValue = Math.max(...series.flatMap((s) => s.values), 1);

  // Calculate bar/column positions
  const barWidth = width / (numDataPoints + 1);
  const chartHeight = height - 60; // Leave space for labels
  const chartY = y + 60;

  if (args.chartType === "bar" || args.chartType === "column") {
    // Create bars/columns
    labels.forEach((label, index) => {
      const barX = x + (index + 0.5) * barWidth;
      const values = series.map((s) => s.values[index] || 0);
      const totalValue = values.reduce((sum, val) => sum + val, 0);
      const barHeight = (totalValue / maxValue) * chartHeight;

      // Create bar shape
      const barId = generateId(`bar_${index}`);
      const isColumn = args.chartType === "column";
      requests.push({
        createShape: {
          objectId: barId,
          shapeType: "ROUND_RECTANGLE",
          elementProperties: {
            pageObjectId: args.pageId,
            size: {
              height: {
                magnitude: ptToEmu(isColumn ? barHeight : barWidth * 0.8),
                unit: "EMU",
              },
              width: {
                magnitude: ptToEmu(isColumn ? barWidth * 0.8 : barHeight),
                unit: "EMU",
              },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: ptToEmu(isColumn ? barX - barWidth * 0.4 : x + 20),
              translateY: ptToEmu(
                isColumn
                  ? chartY + chartHeight - barHeight
                  : chartY + index * barWidth + barWidth * 0.1
              ),
              unit: "EMU",
            },
          },
        },
      });

      // Color bars (cycle through colors)
      const colors = [
        { red: 0.2, green: 0.6, blue: 1 },
        { red: 0.9, green: 0.2, blue: 0.2 },
        { red: 0.2, green: 0.8, blue: 0.4 },
        { red: 1, green: 0.6, blue: 0.2 },
        { red: 0.6, green: 0.2, blue: 0.8 },
      ];
      requests.push({
        updateShapeProperties: {
          objectId: barId,
          shapeProperties: {
            shapeBackgroundFill: {
              solidFill: {
                color: {
                  rgbColor: colors[index % colors.length],
                },
              },
            },
          },
          fields: "shapeBackgroundFill",
        },
      });

      // Add value label
      const valueId = generateId(`value_${index}`);
      requests.push({
        createShape: {
          objectId: valueId,
          shapeType: "TEXT_BOX",
          elementProperties: {
            pageObjectId: args.pageId,
            size: {
              height: { magnitude: ptToEmu(20), unit: "EMU" },
              width: { magnitude: ptToEmu(barWidth * 0.8), unit: "EMU" },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: ptToEmu(isColumn ? barX - barWidth * 0.4 : x + 20),
              translateY: ptToEmu(
                isColumn
                  ? chartY + chartHeight - barHeight - 25
                  : chartY +
                      index * barWidth +
                      barWidth * 0.1 +
                      (isColumn ? barHeight : barWidth * 0.8) +
                      5
              ),
              unit: "EMU",
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: valueId,
          insertionIndex: 0,
          text: totalValue.toString(),
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: valueId,
          style: {
            fontSize: { magnitude: 10, unit: "PT" },
            bold: true,
          },
          fields: "fontSize,bold",
          textRange: { type: "ALL" },
        },
      });
      requests.push({
        updateParagraphStyle: {
          objectId: valueId,
          style: { alignment: "CENTER" },
          fields: "alignment",
          textRange: { type: "ALL" },
        },
      });

      // Add label
      const labelId = generateId(`label_${index}`);
      requests.push({
        createShape: {
          objectId: labelId,
          shapeType: "TEXT_BOX",
          elementProperties: {
            pageObjectId: args.pageId,
            size: {
              height: { magnitude: ptToEmu(30), unit: "EMU" },
              width: { magnitude: ptToEmu(barWidth * 0.8), unit: "EMU" },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: ptToEmu(
                isColumn ? barX - barWidth * 0.4 : x + width - 100
              ),
              translateY: ptToEmu(
                isColumn
                  ? chartY + chartHeight + 10
                  : chartY + index * barWidth + barWidth * 0.1
              ),
              unit: "EMU",
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: labelId,
          insertionIndex: 0,
          text: unescapeText(label),
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: labelId,
          style: {
            fontSize: { magnitude: 10, unit: "PT" },
          },
          fields: "fontSize",
          textRange: { type: "ALL" },
        },
      });
      requests.push({
        updateParagraphStyle: {
          objectId: labelId,
          style: { alignment: isColumn ? "CENTER" : "START" },
          fields: "alignment",
          textRange: { type: "ALL" },
        },
      });
    });
  } else if (args.chartType === "pie") {
    // Create pie chart representation (simplified as donut segments)
    const totalValue =
      series[0]?.values.reduce((sum, val) => sum + val, 0) || 1;
    let currentAngle = 0;

    labels.forEach((label, index) => {
      const value = series[0]?.values[index] || 0;
      const percentage = (value / totalValue) * 100;
      const angle = (value / totalValue) * 360;

      // Create donut segment
      const segmentId = generateId(`segment_${index}`);
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radius = Math.min(width, height) * 0.3;

      // Use donut shape (simplified representation)
      requests.push({
        createShape: {
          objectId: segmentId,
          shapeType: "DONUT",
          elementProperties: {
            pageObjectId: args.pageId,
            size: {
              height: { magnitude: ptToEmu(radius * 2), unit: "EMU" },
              width: { magnitude: ptToEmu(radius * 2), unit: "EMU" },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: ptToEmu(centerX - radius),
              translateY: ptToEmu(centerY - radius),
              unit: "EMU",
            },
          },
        },
      });

      const colors = [
        { red: 0.2, green: 0.6, blue: 1 },
        { red: 0.9, green: 0.2, blue: 0.2 },
        { red: 0.2, green: 0.8, blue: 0.4 },
        { red: 1, green: 0.6, blue: 0.2 },
        { red: 0.6, green: 0.2, blue: 0.8 },
      ];
      requests.push({
        updateShapeProperties: {
          objectId: segmentId,
          shapeProperties: {
            shapeBackgroundFill: {
              solidFill: {
                color: {
                  rgbColor: colors[index % colors.length],
                },
              },
            },
          },
          fields: "shapeBackgroundFill",
        },
      });

      // Add label with percentage
      const labelId = generateId(`pie_label_${index}`);
      const labelX =
        centerX +
        radius * 1.3 * Math.cos((currentAngle + angle / 2) * (Math.PI / 180));
      const labelY =
        centerY +
        radius * 1.3 * Math.sin((currentAngle + angle / 2) * (Math.PI / 180));
      requests.push({
        createShape: {
          objectId: labelId,
          shapeType: "TEXT_BOX",
          elementProperties: {
            pageObjectId: args.pageId,
            size: {
              height: { magnitude: ptToEmu(40), unit: "EMU" },
              width: { magnitude: ptToEmu(100), unit: "EMU" },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: ptToEmu(labelX - 50),
              translateY: ptToEmu(labelY - 20),
              unit: "EMU",
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: labelId,
          insertionIndex: 0,
          text: `${unescapeText(label)}\n${percentage.toFixed(1)}%`,
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: labelId,
          style: {
            fontSize: { magnitude: 10, unit: "PT" },
          },
          fields: "fontSize",
          textRange: { type: "ALL" },
        },
      });

      currentAngle += angle;
    });
  } else if (args.chartType === "line") {
    // Create line chart using connected shapes
    const chartAreaHeight = chartHeight;
    const chartAreaWidth = width - 40;
    const stepX = chartAreaWidth / (numDataPoints - 1);

    // Create line segments
    series.forEach((serie, serieIndex) => {
      const points: Array<{ x: number; y: number }> = [];
      labels.forEach((_, index) => {
        const value = serie.values[index] || 0;
        const xPos = x + 20 + index * stepX;
        const yPos =
          chartY + chartAreaHeight - (value / maxValue) * chartAreaHeight;
        points.push({ x: xPos, y: yPos });
      });

      // Create line segments
      for (let i = 0; i < points.length - 1; i++) {
        const lineId = generateId(`line_${serieIndex}_${i}`);
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        requests.push({
          createShape: {
            objectId: lineId,
            shapeType: "LINE",
            elementProperties: {
              pageObjectId: args.pageId,
              size: {
                height: { magnitude: ptToEmu(2), unit: "EMU" },
                width: { magnitude: ptToEmu(length), unit: "EMU" },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: ptToEmu(points[i].x),
                translateY: ptToEmu(points[i].y),
                rotation: angle,
                unit: "EMU",
              },
            },
          },
        });
      }

      // Add data point markers
      points.forEach((point, pointIndex) => {
        const markerId = generateId(`marker_${serieIndex}_${pointIndex}`);
        requests.push({
          createShape: {
            objectId: markerId,
            shapeType: "ELLIPSE",
            elementProperties: {
              pageObjectId: args.pageId,
              size: {
                height: { magnitude: ptToEmu(8), unit: "EMU" },
                width: { magnitude: ptToEmu(8), unit: "EMU" },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: ptToEmu(point.x - 4),
                translateY: ptToEmu(point.y - 4),
                unit: "EMU",
              },
            },
          },
        });
      });
    });

    // Add labels
    labels.forEach((label, index) => {
      const labelId = generateId(`line_label_${index}`);
      requests.push({
        createShape: {
          objectId: labelId,
          shapeType: "TEXT_BOX",
          elementProperties: {
            pageObjectId: args.pageId,
            size: {
              height: { magnitude: ptToEmu(20), unit: "EMU" },
              width: { magnitude: ptToEmu(60), unit: "EMU" },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: ptToEmu(x + 20 + index * stepX - 30),
              translateY: ptToEmu(chartY + chartAreaHeight + 10),
              unit: "EMU",
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: labelId,
          insertionIndex: 0,
          text: unescapeText(label),
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: labelId,
          style: {
            fontSize: { magnitude: 9, unit: "PT" },
          },
          fields: "fontSize",
          textRange: { type: "ALL" },
        },
      });
      requests.push({
        updateParagraphStyle: {
          objectId: labelId,
          style: { alignment: "CENTER" },
          fields: "alignment",
          textRange: { type: "ALL" },
        },
      });
    });
  }

  await slides.presentations.batchUpdate({
    presentationId: args.presentationId,
    requestBody: { requests },
  });

  logger.success(`✅ Created ${args.chartType} chart`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            presentationId: args.presentationId,
            pageId: args.pageId,
            chartType: args.chartType,
            message:
              "Chart created successfully (visual representation using shapes)",
          },
          null,
          2
        ),
      },
    ],
  };
};

// Tool definitions
export const chartTools: MCPToolDefinition[] = [
  {
    name: "create_chart",
    description:
      "Create a chart on a slide. Supports bar, column, line, and pie charts. Creates visual representation using shapes. Example: Create bar chart with labels ['Q1', 'Q2', 'Q3'] and series [{name: 'Sales', values: [100, 150, 120]}]. NOTE: For true Google Sheets-linked charts, use Google Sheets API separately.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        pageId: createStringParam({
          description: "The ID of the slide/page",
          examples: SLIDE_ID_EXAMPLES,
        }),
        chartType: createStringParam({
          description:
            "Type of chart. 'bar' (horizontal bars), 'column' (vertical bars), 'line' (line graph), 'pie' (pie chart)",
          enum: ["bar", "line", "pie", "column"],
          examples: ["bar", "column", "line"],
        }),
        data: {
          type: "object",
          description:
            "Chart data. Example: {labels: ['Q1', 'Q2', 'Q3'], series: [{name: 'Sales', values: [100, 150, 120]}]}",
          properties: {
            labels: {
              type: "array",
              description:
                "X-axis labels or categories. Example: ['Q1', 'Q2', 'Q3', 'Q4']",
              items: {
                type: "string",
                description: "Label text",
                examples: [...CHART_DATA_EXAMPLES.LABELS],
              },
            },
            series: {
              type: "array",
              description:
                "Data series. Example: [{name: 'Sales', values: [100, 150, 120]}]",
              items: {
                type: "object",
                description: "Data series item",
                properties: {
                  name: {
                    type: "string",
                    description: "Series name",
                    examples: ["Sales", "Revenue", "Users"],
                  },
                  values: {
                    type: "array",
                    description: "Series data values",
                    items: {
                      type: "number",
                      description: "Data point value",
                      examples: [...CHART_DATA_EXAMPLES.VALUES],
                    },
                  },
                },
              },
            },
          },
        },
        title: createStringParam({
          description: "Optional chart title",
          examples: ["Sales Overview", "Revenue by Quarter"],
        }),
        x: createXPositionParam(),
        y: createYPositionParam(),
        width: createWidthParam(),
        height: createHeightParam(),
      },
      required: ["presentationId", "pageId", "chartType", "data"],
    },
    handler: createChart,
  },
];
