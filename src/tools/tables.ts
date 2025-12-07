/**
 * Table-related MCP tools
 * Create and manipulate tables on slides
 */

import { ensureSlidesClient } from "../slides";
import { MCPToolDefinition } from "../types/mcp";
import { logger } from "../utils/logger";
import {
  createStringParam,
  createNumberParam,
  createBooleanParam,
} from "../utils/schema-builder";
import { unescapeText } from "../utils/text-handling";
import { invalidatePresentationCache } from "../utils/cache";
import { retryWithBackoff } from "../utils/error-handling";
import { normalizeColorForAPI } from "./utils";
import {
  PRESENTATION_ID_EXAMPLES,
  ELEMENT_ID_EXAMPLES,
  TABLE_EXAMPLES,
} from "../config/examples";
import {
  UpdateTableCellArgs,
  InsertTableRowsArgs,
  DeleteTableRowsArgs,
  InsertTableColumnsArgs,
  DeleteTableColumnArgs,
  MergeTableCellsArgs,
  UnmergeTableCellsArgs,
  UpdateTableBorderPropertiesArgs,
} from "../types/slides";

/**
 * Update a table cell's text content
 */
const updateTableCell = async (args: UpdateTableCellArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(
    `✏️  Updating table cell [${args.rowIndex}, ${args.columnIndex}]`
  );

  // Get the table to find existing text in the cell
  const presentation = await slides.presentations.get({
    presentationId: args.presentationId,
  });

  let existingTextLength = 0;
  const page = presentation.data.slides?.find((slide) =>
    slide.pageElements?.some((element) => element.objectId === args.objectId)
  );

  if (page) {
    const table = page.pageElements?.find(
      (element) => element.objectId === args.objectId
    )?.table;
    if (table && table.tableRows && table.tableRows[args.rowIndex]) {
      const row = table.tableRows[args.rowIndex];
      if (row.tableCells && row.tableCells[args.columnIndex]) {
        const cellText = row.tableCells[args.columnIndex].text;
        if (cellText?.textElements) {
          // Calculate total text length in the cell
          existingTextLength = cellText.textElements.reduce((sum, element) => {
            if (element.textRun?.content) {
              return sum + element.textRun.content.length;
            }
            return sum;
          }, 0);
        }
      }
    }
  }

  const requests = [];

  // Delete existing text if any
  if (existingTextLength > 0) {
    requests.push({
      deleteText: {
        objectId: args.objectId,
        cellLocation: {
          rowIndex: args.rowIndex,
          columnIndex: args.columnIndex,
        },
        textRange: {
          type: "ALL",
        },
      },
    });
  }

  // Convert escape sequences to actual characters
  const processedText = unescapeText(args.text);

  // Insert new text
  requests.push({
    insertText: {
      objectId: args.objectId,
      cellLocation: {
        rowIndex: args.rowIndex,
        columnIndex: args.columnIndex,
      },
      insertionIndex: 0,
      text: processedText,
    },
  });

  // Update cell properties if provided
  if (
    args.backgroundColor !== undefined ||
    args.contentAlignment !== undefined
  ) {
    const tableCellProperties: Record<string, unknown> = {};

    if (args.backgroundColor !== undefined) {
      if (args.backgroundColor === null) {
        // Remove background
        tableCellProperties.tableCellBackgroundFill = {
          propertyState: "NOT_RENDERED",
        };
      } else {
        const normalizedColor = normalizeColorForAPI(args.backgroundColor);
        if (normalizedColor) {
          tableCellProperties.tableCellBackgroundFill = {
            solidFill: {
              color: normalizedColor.opaqueColor,
            },
          };
        }
      }
    }

    if (args.contentAlignment !== undefined) {
      if (args.contentAlignment === null) {
        // Use default alignment - don't set the field
      } else {
        tableCellProperties.contentAlignment = args.contentAlignment;
      }
    }

    if (Object.keys(tableCellProperties).length > 0) {
      requests.push({
        updateTableCellProperties: {
          objectId: args.objectId,
          tableCellProperties,
          tableRange: {
            location: {
              rowIndex: args.rowIndex,
              columnIndex: args.columnIndex,
            },
            rowSpan: 1,
            columnSpan: 1,
          },
          fields: Object.keys(tableCellProperties).join(","),
        },
      });
    }
  }

  await slides.presentations.batchUpdate({
    presentationId: args.presentationId,
    requestBody: { requests },
  });

  logger.success(`✅ Updated table cell`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectId: args.objectId,
            presentationId: args.presentationId,
            rowIndex: args.rowIndex,
            columnIndex: args.columnIndex,
            text: args.text,
            message: "Table cell updated successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Insert rows into a table
 */
const insertTableRows = async (args: InsertTableRowsArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(
    `➕ Inserting ${args.numRows} row(s) at index ${args.rowIndex}`
  );

  const requests = [
    {
      insertTableRows: {
        objectId: args.objectId,
        cellLocation: {
          rowIndex: args.rowIndex,
          columnIndex: 0,
        },
        insertBelow: true,
        number: args.numRows,
      },
    },
  ];

  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: { requests },
    });
  });

  // Invalidate cache
  invalidatePresentationCache(args.presentationId);

  logger.success(`✅ Inserted ${args.numRows} row(s)`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectId: args.objectId,
            presentationId: args.presentationId,
            rowIndex: args.rowIndex,
            numRows: args.numRows,
            message: "Table rows inserted successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Delete rows from a table
 */
const deleteTableRows = async (args: DeleteTableRowsArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(
    `➖ Deleting ${args.numRows} row(s) starting at index ${args.rowIndex}`
  );

  // Delete multiple rows by calling deleteTableRow multiple times
  for (let i = 0; i < args.numRows; i++) {
    await retryWithBackoff(async () => {
      await slides.presentations.batchUpdate({
        presentationId: args.presentationId,
        requestBody: {
          requests: [
            {
              deleteTableRow: {
                tableObjectId: args.objectId,
                cellLocation: {
                  rowIndex: args.rowIndex + i,
                  columnIndex: 0,
                },
              },
            },
          ],
        },
      });
    });
  }

  // Invalidate cache
  invalidatePresentationCache(args.presentationId);

  logger.success(`✅ Deleted ${args.numRows} row(s)`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectId: args.objectId,
            presentationId: args.presentationId,
            rowIndex: args.rowIndex,
            numRows: args.numRows,
            message: "Table rows deleted successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Insert columns into a table
 */
const insertTableColumns = async (args: InsertTableColumnsArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(
    `➕ Inserting ${args.numColumns} column(s) at index ${args.columnIndex}`
  );

  const requests = [
    {
      insertTableColumns: {
        tableObjectId: args.objectId,
        cellLocation: {
          rowIndex: 0,
          columnIndex: args.columnIndex,
        },
        insertRight: args.insertRight !== undefined ? args.insertRight : true,
        number: args.numColumns,
      },
    },
  ];

  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: { requests },
    });
  });

  // Invalidate cache
  invalidatePresentationCache(args.presentationId);

  logger.success(`✅ Inserted ${args.numColumns} column(s)`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectId: args.objectId,
            presentationId: args.presentationId,
            columnIndex: args.columnIndex,
            numColumns: args.numColumns,
            message: "Table columns inserted successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Delete a column from a table
 */
const deleteTableColumn = async (args: DeleteTableColumnArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`➖ Deleting ${args.columnIndexes.length} column(s)`);

  // Sort column indexes in descending order to avoid index shifting issues
  const sortedIndexes = [...args.columnIndexes].sort((a, b) => b - a);

  const requests = sortedIndexes.map((columnIndex) => ({
    deleteTableColumn: {
      tableObjectId: args.objectId,
      cellLocation: {
        rowIndex: 0,
        columnIndex,
      },
    },
  }));

  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: { requests },
    });
  });

  // Invalidate cache
  invalidatePresentationCache(args.presentationId);

  logger.success(`✅ Deleted ${args.columnIndexes.length} column(s)`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectId: args.objectId,
            presentationId: args.presentationId,
            columnIndexes: args.columnIndexes,
            message: `${args.columnIndexes.length} table column(s) deleted successfully`,
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Merge cells in a table
 */
const mergeTableCells = async (args: MergeTableCellsArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(
    `🔗 Merging cells: [${args.startRowIndex}, ${args.startColumnIndex}] spanning ${args.rowSpan}x${args.columnSpan}`
  );

  const requests = [
    {
      mergeTableCells: {
        objectId: args.objectId,
        tableRange: {
          location: {
            rowIndex: args.startRowIndex,
            columnIndex: args.startColumnIndex,
          },
          rowSpan: args.rowSpan,
          columnSpan: args.columnSpan,
        },
      },
    },
  ];

  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: { requests },
    });
  });

  // Invalidate cache
  invalidatePresentationCache(args.presentationId);

  logger.success(`✅ Merged table cells`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectId: args.objectId,
            presentationId: args.presentationId,
            startRowIndex: args.startRowIndex,
            startColumnIndex: args.startColumnIndex,
            rowSpan: args.rowSpan,
            columnSpan: args.columnSpan,
            message: "Table cells merged successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Unmerge cells in a table
 */
const unmergeTableCells = async (args: UnmergeTableCellsArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(
    `🔓 Unmerging cells: [${args.startRowIndex}, ${args.startColumnIndex}] spanning ${args.rowSpan}x${args.columnSpan}`
  );

  const requests = [
    {
      unmergeTableCells: {
        objectId: args.objectId,
        tableRange: {
          location: {
            rowIndex: args.startRowIndex,
            columnIndex: args.startColumnIndex,
          },
          rowSpan: args.rowSpan,
          columnSpan: args.columnSpan,
        },
      },
    },
  ];

  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: { requests },
    });
  });

  // Invalidate cache
  invalidatePresentationCache(args.presentationId);

  logger.success(`✅ Unmerged table cells`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectId: args.objectId,
            presentationId: args.presentationId,
            startRowIndex: args.startRowIndex,
            startColumnIndex: args.startColumnIndex,
            rowSpan: args.rowSpan,
            columnSpan: args.columnSpan,
            message: "Table cells unmerged successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Update table border properties
 */
const updateTableBorderProperties = async (
  args: UpdateTableBorderPropertiesArgs
) => {
  const slides = await ensureSlidesClient();

  logger.progress(`🎨 Updating table border properties`);

  const tableBorderProperties: Record<string, unknown> = {};

  if (args.color) {
    const normalizedColor = normalizeColorForAPI(args.color);
    if (normalizedColor) {
      tableBorderProperties.tableBorderFill = {
        solidFill: {
          color: normalizedColor.opaqueColor,
        },
      };
    }
  }

  if (args.weight !== undefined) {
    tableBorderProperties.weight = {
      magnitude: args.weight,
      unit: "PT",
    };
  }

  if (args.dashStyle) {
    tableBorderProperties.dashStyle = args.dashStyle;
  }

  if (Object.keys(tableBorderProperties).length === 0) {
    throw new Error("No border properties provided to update");
  }

  const tableRange =
    args.startRowIndex !== undefined
      ? {
          location: {
            rowIndex: args.startRowIndex,
            columnIndex: args.startColumnIndex ?? 0,
          },
          rowSpan: args.rowSpan ?? 1,
          columnSpan: args.columnSpan ?? 1,
        }
      : undefined;

  const requests = [
    {
      updateTableBorderProperties: {
        objectId: args.objectId,
        ...(tableRange && { tableRange }),
        ...(args.borderPosition && { borderPosition: args.borderPosition }),
        tableBorderProperties,
        fields: Object.keys(tableBorderProperties).join(","),
      },
    },
  ];

  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: { requests },
    });
  });

  // Invalidate cache
  invalidatePresentationCache(args.presentationId);

  logger.success(`✅ Updated table border properties`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectId: args.objectId,
            presentationId: args.presentationId,
            updatedProperties: Object.keys(tableBorderProperties),
            message: "Table border properties updated successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

// Tool definitions
export const tableTools: MCPToolDefinition[] = [
  {
    name: "update_table_cell",
    description:
      "Update the text content of a specific table cell in a Google Slides presentation. Example: Update cell at row 1, column 0 (rowIndex=1, columnIndex=0) with text 'New Value'.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the table",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        rowIndex: createNumberParam({
          description:
            "Zero-based row index. Example: 0 for first row (header), 1 for first data row",
          minimum: 0,
          examples: [0, 1, 2],
        }),
        columnIndex: createNumberParam({
          description:
            "Zero-based column index. Example: 0 for first column, 1 for second column",
          minimum: 0,
          examples: [0, 1, 2],
        }),
        text: createStringParam({
          description: "The text content to set",
          examples: [TABLE_EXAMPLES.CELL_TEXT, "Sample data"],
        }),
        backgroundColor: {
          type: "object",
          description:
            "Background color for the cell as RGB object. Omit to keep current background.",
          properties: {
            rgbColor: {
              type: "object",
              description: "RGB color values (0-1)",
              properties: {
                red: createNumberParam({
                  description: "Red component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.9, 1],
                }),
                green: createNumberParam({
                  description: "Green component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.7, 1],
                }),
                blue: createNumberParam({
                  description: "Blue component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.8, 1],
                }),
              },
            },
          },
        },
        contentAlignment: createStringParam({
          description:
            "Content alignment in the cell: TOP, MIDDLE, or BOTTOM. Set to null to use default.",
          enum: ["TOP", "MIDDLE", "BOTTOM"],
          examples: ["MIDDLE", "TOP"],
        }),
      },
      required: [
        "presentationId",
        "objectId",
        "rowIndex",
        "columnIndex",
        "text",
      ],
    },
    handler: updateTableCell,
  },
  {
    name: "insert_table_rows",
    description:
      "Insert one or more rows into a table in a Google Slides presentation at the specified row index. Example: Insert 2 rows at index 1 (rowIndex=1, numRows=2) to add rows between existing rows. Useful for adding data to existing tables.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the table",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        rowIndex: createNumberParam({
          description:
            "Zero-based row index where to insert. Example: 1 inserts after first row",
          minimum: 0,
          examples: [0, 1, 2],
        }),
        numRows: createNumberParam({
          description: "Number of rows to insert",
          minimum: 1,
          maximum: 100,
          examples: [1, 2, 5],
        }),
      },
      required: ["presentationId", "objectId", "rowIndex", "numRows"],
    },
    handler: insertTableRows,
  },
  {
    name: "delete_table_rows",
    description:
      "Delete one or more rows from a table in a Google Slides presentation starting at the specified row index. Example: Delete 2 rows starting at index 1 (rowIndex=1, numRows=2) to remove rows from table. Use this to clean up or remove unwanted data.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the table",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        rowIndex: createNumberParam({
          description:
            "Zero-based row index to start deleting from. Example: 1 deletes from second row",
          minimum: 0,
          examples: [0, 1, 2],
        }),
        numRows: createNumberParam({
          description: "Number of rows to delete",
          minimum: 1,
          maximum: 100,
          examples: [1, 2, 5],
        }),
      },
      required: ["presentationId", "objectId", "rowIndex", "numRows"],
    },
    handler: deleteTableRows,
  },
  {
    name: "insert_table_columns",
    description:
      "Insert one or more columns into a table in a Google Slides presentation at the specified column index. Example: Insert 2 columns at index 1 (columnIndex=1, numColumns=2) to add columns between existing columns.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the table",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        columnIndex: createNumberParam({
          description:
            "Zero-based column index where to insert. Example: 1 inserts after first column",
          minimum: 0,
          examples: [0, 1, 2],
        }),
        numColumns: createNumberParam({
          description: "Number of columns to insert",
          minimum: 1,
          maximum: 20,
          examples: [1, 2, 5],
        }),
        insertRight: createBooleanParam({
          description:
            "Whether to insert columns to the right. True = insert right, False = insert left. Default: true",
          default: true,
          examples: [true, false],
        }),
      },
      required: ["presentationId", "objectId", "columnIndex", "numColumns"],
    },
    handler: insertTableColumns,
  },
  {
    name: "delete_table_column",
    description:
      "Delete one or more columns from a table in a Google Slides presentation. Example: Delete columns at indexes [1, 3] (columnIndexes=[1, 3]). Single delete operations will be a single element in the array.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the table",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        columnIndexes: {
          type: "array",
          items: createNumberParam({
            description:
              "Zero-based column index to delete. Example: 1 deletes the second column",
            minimum: 0,
            examples: [0, 1, 2],
          }),
          description:
            "Array of column indexes to delete. Example: [1, 3] deletes columns at indexes 1 and 3",
        },
      },
      required: ["presentationId", "objectId", "columnIndexes"],
    },
    handler: deleteTableColumn,
  },
  {
    name: "merge_table_cells",
    description:
      "Merge cells in a table. Example: Merge cells starting at [0,0] spanning 2 rows and 3 columns (startRowIndex=0, startColumnIndex=0, rowSpan=2, columnSpan=3).",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the table",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        startRowIndex: createNumberParam({
          description: "Zero-based row index where merging starts",
          minimum: 0,
          examples: [0, 1, 2],
        }),
        startColumnIndex: createNumberParam({
          description: "Zero-based column index where merging starts",
          minimum: 0,
          examples: [0, 1, 2],
        }),
        rowSpan: createNumberParam({
          description: "Number of rows to span",
          minimum: 1,
          examples: [1, 2, 3],
        }),
        columnSpan: createNumberParam({
          description: "Number of columns to span",
          minimum: 1,
          examples: [1, 2, 3],
        }),
      },
      required: [
        "presentationId",
        "objectId",
        "startRowIndex",
        "startColumnIndex",
        "rowSpan",
        "columnSpan",
      ],
    },
    handler: mergeTableCells,
  },
  {
    name: "unmerge_table_cells",
    description:
      "Unmerge cells in a table. Example: Unmerge cells starting at [0,0] spanning 2 rows and 3 columns (startRowIndex=0, startColumnIndex=0, rowSpan=2, columnSpan=3).",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the table",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        startRowIndex: createNumberParam({
          description: "Zero-based row index where unmerging starts",
          minimum: 0,
          examples: [0, 1, 2],
        }),
        startColumnIndex: createNumberParam({
          description: "Zero-based column index where unmerging starts",
          minimum: 0,
          examples: [0, 1, 2],
        }),
        rowSpan: createNumberParam({
          description: "Number of rows to unmerge",
          minimum: 1,
          examples: [1, 2, 3],
        }),
        columnSpan: createNumberParam({
          description: "Number of columns to unmerge",
          minimum: 1,
          examples: [1, 2, 3],
        }),
      },
      required: [
        "presentationId",
        "objectId",
        "startRowIndex",
        "startColumnIndex",
        "rowSpan",
        "columnSpan",
      ],
    },
    handler: unmergeTableCells,
  },
  {
    name: "update_table_border_properties",
    description:
      "Update border properties of a table (color, weight, dash style). Example: Set all borders to black, 2pt solid (borderPosition='ALL', color={rgbColor:{red:0,green:0,blue:0}}, weight=2, dashStyle='SOLID').",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the table",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        borderPosition: createStringParam({
          description:
            "Which borders to update: ALL, OUTER, INNER, TOP, BOTTOM, LEFT, RIGHT, INNER_HORIZONTAL, INNER_VERTICAL",
          enum: [
            "ALL",
            "OUTER",
            "INNER",
            "TOP",
            "BOTTOM",
            "LEFT",
            "RIGHT",
            "INNER_HORIZONTAL",
            "INNER_VERTICAL",
          ],
          examples: ["ALL", "OUTER", "INNER"],
        }),
        startRowIndex: createNumberParam({
          description:
            "Optional: Start row index for table range. If not provided, applies to entire table.",
          minimum: 0,
          examples: [0, 1],
        }),
        startColumnIndex: createNumberParam({
          description:
            "Optional: Start column index for table range. If not provided, applies to entire table.",
          minimum: 0,
          examples: [0, 1],
        }),
        rowSpan: createNumberParam({
          description:
            "Optional: Row span for table range. If not provided, applies to entire table.",
          minimum: 1,
          examples: [1, 2],
        }),
        columnSpan: createNumberParam({
          description:
            "Optional: Column span for table range. If not provided, applies to entire table.",
          minimum: 1,
          examples: [1, 2],
        }),
        color: {
          type: "object",
          description: "Border color as RGB object",
          properties: {
            rgbColor: {
              type: "object",
              description: "RGB color values (0-1)",
              properties: {
                red: createNumberParam({
                  description: "Red component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.9, 1],
                }),
                green: createNumberParam({
                  description: "Green component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.7, 1],
                }),
                blue: createNumberParam({
                  description: "Blue component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.8, 1],
                }),
              },
            },
          },
        },
        weight: createNumberParam({
          description: "Border weight in points",
          minimum: 0,
          examples: [1, 2, 5],
        }),
        dashStyle: createStringParam({
          description: "Border dash style",
          enum: [
            "SOLID",
            "DOT",
            "DASH",
            "DASH_DOT",
            "LONG_DASH",
            "LONG_DASH_DOT",
          ],
          examples: ["SOLID", "DASH"],
        }),
      },
      required: ["presentationId", "objectId"],
    },
    handler: updateTableBorderProperties,
  },
];
