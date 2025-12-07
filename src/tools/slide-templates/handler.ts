/**
 * Main handler for creating slides from templates
 */

import { CreateSlideTemplateArgs } from "../../types/templates";
import { createSlide } from "../slides";
import { invalidatePresentationCache } from "../../utils/cache";
import { logger } from "../../utils/logger";

// Category A: Opening & Closing
import {
  buildTitleHero,
  buildTitleMinimal,
  buildTitleImageSplit,
  buildClosingCTA,
  buildClosingThankYou,
} from "./opening-closing";

// Category B: Content & Text
import {
  buildBulletsClean,
  buildBulletsNumbered,
  buildTwoColumnText,
  buildTwoColumnImageLeft,
  buildTwoColumnImageRight,
  buildThreeColumn,
  buildQuoteSpotlight,
  buildBigStatement,
} from "./content-text";

// Category C: Data & Metrics
import {
  buildMetrics2x2,
  buildMetrics3Row,
  buildMetrics4Row,
  buildMetricsSingle,
  buildComparisonTable,
  buildPricingTiers,
  buildBeforeAfter,
} from "./data-metrics";

// Category D: Visual & Process
import {
  buildTimelineHorizontal,
  buildTimelineVertical,
  buildFunnel3Level,
  buildPyramid3Level,
  buildProcessFlow,
  buildCycle4Step,
} from "./visual-process";

// Category E: Team & People
import {
  buildTeam2Founders,
  buildTeam4Grid,
  buildTeam6Grid,
} from "./team-people";

// Category F: Specialized
import { buildSectionDivider } from "./specialized";

/**
 * Create a slide using a template
 */
export const createSlideTemplate = async (args: CreateSlideTemplateArgs) => {
  logger.progress(`🎨 Creating slide with template: ${args.template}`);

  // Create a new slide first
  const slideResult = await createSlide({
    presentationId: args.presentationId,
    insertionIndex: args.insertionIndex,
  });

  const slideData = JSON.parse(slideResult.content[0].text) as {
    slideId: string;
  };
  const pageId = slideData.slideId;

  // Build the slide based on template type
  switch (args.template) {
    // Category A: Opening & Closing
    case "title_hero":
      await buildTitleHero(pageId, args.presentationId, args.content);
      break;
    case "title_minimal":
      await buildTitleMinimal(pageId, args.presentationId, args.content);
      break;
    case "title_image_split":
      await buildTitleImageSplit(pageId, args.presentationId, args.content);
      break;
    case "closing_cta":
      await buildClosingCTA(pageId, args.presentationId, args.content);
      break;
    case "closing_thank_you":
      await buildClosingThankYou(pageId, args.presentationId, args.content);
      break;

    // Category B: Content & Text
    case "bullets_clean":
      await buildBulletsClean(pageId, args.presentationId, args.content);
      break;
    case "bullets_numbered":
      await buildBulletsNumbered(pageId, args.presentationId, args.content);
      break;
    case "two_column_text":
      await buildTwoColumnText(pageId, args.presentationId, args.content);
      break;
    case "two_column_image_left":
      await buildTwoColumnImageLeft(pageId, args.presentationId, args.content);
      break;
    case "two_column_image_right":
      await buildTwoColumnImageRight(pageId, args.presentationId, args.content);
      break;
    case "three_column":
      await buildThreeColumn(pageId, args.presentationId, args.content);
      break;
    case "quote_spotlight":
      await buildQuoteSpotlight(pageId, args.presentationId, args.content);
      break;
    case "big_statement":
      await buildBigStatement(pageId, args.presentationId, args.content);
      break;

    // Category C: Data & Metrics
    case "metrics_2x2":
      await buildMetrics2x2(pageId, args.presentationId, args.content);
      break;
    case "metrics_3_row":
      await buildMetrics3Row(pageId, args.presentationId, args.content);
      break;
    case "metrics_4_row":
      await buildMetrics4Row(pageId, args.presentationId, args.content);
      break;
    case "metrics_single":
      await buildMetricsSingle(pageId, args.presentationId, args.content);
      break;
    case "comparison_table":
      await buildComparisonTable(pageId, args.presentationId, args.content);
      break;
    case "pricing_tiers":
      await buildPricingTiers(pageId, args.presentationId, args.content);
      break;
    case "before_after":
      await buildBeforeAfter(pageId, args.presentationId, args.content);
      break;

    // Category D: Visual & Process
    case "timeline_horizontal":
      await buildTimelineHorizontal(pageId, args.presentationId, args.content);
      break;
    case "timeline_vertical":
      await buildTimelineVertical(pageId, args.presentationId, args.content);
      break;
    case "funnel_3_level":
      await buildFunnel3Level(pageId, args.presentationId, args.content);
      break;
    case "pyramid_3_level":
      await buildPyramid3Level(pageId, args.presentationId, args.content);
      break;
    case "process_flow":
      await buildProcessFlow(pageId, args.presentationId, args.content);
      break;
    case "cycle_4_step":
      await buildCycle4Step(pageId, args.presentationId, args.content);
      break;

    // Category E: Team & People
    case "team_2_founders":
      await buildTeam2Founders(pageId, args.presentationId, args.content);
      break;
    case "team_4_grid":
      await buildTeam4Grid(pageId, args.presentationId, args.content);
      break;
    case "team_6_grid":
      await buildTeam6Grid(pageId, args.presentationId, args.content);
      break;

    // Category F: Specialized
    case "section_divider":
      await buildSectionDivider(pageId, args.presentationId, args.content);
      break;

    default: {
      const _exhaustive: never = args.template;
      throw new Error(`Unknown template: ${String(_exhaustive)}`);
    }
  }

  invalidatePresentationCache(args.presentationId);
  logger.success(`✅ Created slide with template: ${args.template}`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            presentationId: args.presentationId,
            slideId: pageId,
            template: args.template,
            message: `Successfully created slide using template: ${args.template}`,
          },
          null,
          2
        ),
      },
    ],
  };
};
