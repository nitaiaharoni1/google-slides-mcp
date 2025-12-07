/**
 * API validation utilities
 * Pre-validate operations before making API calls to provide better error messages
 */

import { logger } from "./logger";

/**
 * API capability limitations
 * These represent known limitations of the Google Slides API
 */
export const API_LIMITATIONS = {
  /**
   * Google Slides API does not support gradient fills directly on pageBackgroundFill
   * Workaround: Create a full-slide rectangle shape with gradient fill
   */
  GRADIENT_BACKGROUND: {
    supported: false,
    workaround:
      "Create a full-slide rectangle shape with gradient fill and send it to the back",
    message: "Gradient fills are not directly supported on pageBackgroundFill",
  },
  /**
   * Image backgrounds are supported but have requirements
   */
  IMAGE_BACKGROUND: {
    supported: true,
    requirements: {
      maxSizeMB: 50,
      maxMegapixels: 25,
      formats: ["PNG", "JPEG", "GIF"],
      mustBePublic: true,
    },
  },
} as const;

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
  workaround?: string;
  provided?: unknown;
  expected?: unknown;
}

/**
 * Validate gradient fill parameters
 */
export function validateGradientFill(gradientFill: {
  stops: Array<{
    color: { rgbColor: { red: number; green: number; blue: number } };
    position?: number;
  }>;
  angle?: number;
}): ValidationResult {
  // Check if gradient fills are supported
  if (!API_LIMITATIONS.GRADIENT_BACKGROUND.supported) {
    return {
      valid: false,
      error: API_LIMITATIONS.GRADIENT_BACKGROUND.message,
      suggestion: `Gradient backgrounds are not directly supported by the Google Slides API. ${API_LIMITATIONS.GRADIENT_BACKGROUND.workaround}. The tool will automatically use this workaround.`,
      workaround: API_LIMITATIONS.GRADIENT_BACKGROUND.workaround,
    };
  }

  // Validate stops
  if (!gradientFill.stops || gradientFill.stops.length < 2) {
    return {
      valid: false,
      error: "Gradient fill requires at least 2 color stops",
      suggestion: "Provide at least 2 color stops with rgbColor values",
      provided: gradientFill.stops?.length || 0,
      expected: "2 or more stops",
    };
  }

  // Validate color values
  for (let i = 0; i < gradientFill.stops.length; i++) {
    const stop = gradientFill.stops[i];
    if (!stop.color?.rgbColor) {
      return {
        valid: false,
        error: `Gradient stop ${i + 1} is missing color.rgbColor`,
        suggestion:
          "Each gradient stop must have a color object with rgbColor (red, green, blue values 0-1)",
        provided: stop,
        expected: { color: { rgbColor: { red: 0.0, green: 0.0, blue: 0.0 } } },
      };
    }

    const { red, green, blue } = stop.color.rgbColor;
    if (
      red === undefined ||
      green === undefined ||
      blue === undefined ||
      red < 0 ||
      red > 1 ||
      green < 0 ||
      green > 1 ||
      blue < 0 ||
      blue > 1
    ) {
      return {
        valid: false,
        error: `Gradient stop ${i + 1} has invalid RGB values`,
        suggestion: "RGB values must be between 0 and 1",
        provided: stop.color.rgbColor,
        expected: { red: 0.0, green: 0.0, blue: 0.0 },
      };
    }

    // Validate position if provided
    if (
      stop.position !== undefined &&
      (stop.position < 0 || stop.position > 1)
    ) {
      return {
        valid: false,
        error: `Gradient stop ${i + 1} has invalid position`,
        suggestion: "Position must be between 0 and 1",
        provided: stop.position,
        expected: "0.0 to 1.0",
      };
    }
  }

  // Validate angle if provided
  if (
    gradientFill.angle !== undefined &&
    (gradientFill.angle < 0 || gradientFill.angle > 360)
  ) {
    return {
      valid: false,
      error: "Gradient angle is out of range",
      suggestion: "Angle must be between 0 and 360 degrees",
      provided: gradientFill.angle,
      expected: "0 to 360",
    };
  }

  return { valid: true };
}

/**
 * Validate image URL for background
 */
export function validateImageUrl(imageUrl: string): ValidationResult {
  if (!imageUrl || typeof imageUrl !== "string") {
    return {
      valid: false,
      error: "Image URL is required and must be a string",
      suggestion: "Provide a publicly accessible image URL",
      provided: imageUrl,
      expected: "A valid URL string",
    };
  }

  // Basic URL validation
  try {
    const url = new URL(imageUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      return {
        valid: false,
        error: "Image URL must use HTTP or HTTPS protocol",
        suggestion: "Use a publicly accessible HTTPS URL",
        provided: imageUrl,
        expected: "https://example.com/image.png",
      };
    }
  } catch {
    return {
      valid: false,
      error: "Image URL is not a valid URL format",
      suggestion: "Provide a valid URL (e.g., https://example.com/image.png)",
      provided: imageUrl,
      expected: "A valid URL string",
    };
  }

  // Check file extension (basic check)
  const validExtensions = [".png", ".jpg", ".jpeg", ".gif"];
  const lowerUrl = imageUrl.toLowerCase();
  const hasValidExtension = validExtensions.some((ext) =>
    lowerUrl.includes(ext)
  );

  if (!hasValidExtension) {
    logger.warn(
      `⚠️  Image URL doesn't appear to have a standard image extension. Supported formats: ${API_LIMITATIONS.IMAGE_BACKGROUND.requirements.formats.join(", ")}`
    );
  }

  return {
    valid: true,
    suggestion: `Ensure the image is publicly accessible, under ${API_LIMITATIONS.IMAGE_BACKGROUND.requirements.maxSizeMB}MB, and under ${API_LIMITATIONS.IMAGE_BACKGROUND.requirements.maxMegapixels} megapixels`,
  };
}

/**
 * Create an informative error message for API limitations
 */
export function createAPIError(
  operation: string,
  limitation: string,
  workaround?: string,
  provided?: unknown,
  expected?: unknown
): Error {
  let message = `${operation} failed: ${limitation}`;

  if (workaround) {
    message += `. Workaround: ${workaround}`;
  }

  if (provided !== undefined || expected !== undefined) {
    const details: string[] = [];
    if (provided !== undefined) {
      details.push(`Provided: ${JSON.stringify(provided)}`);
    }
    if (expected !== undefined) {
      details.push(`Expected: ${JSON.stringify(expected)}`);
    }
    message += ` (${details.join(", ")})`;
  }

  const error = new Error(message) as Error & {
    limitation?: string;
    workaround?: string;
    provided?: unknown;
    expected?: unknown;
    isAPILimitation?: boolean;
  };

  error.limitation = limitation;
  if (workaround) {
    error.workaround = workaround;
  }
  if (provided !== undefined) {
    error.provided = provided;
  }
  if (expected !== undefined) {
    error.expected = expected;
  }
  error.isAPILimitation = true;

  return error;
}

/**
 * Error with API limitation properties
 */
export interface APILimitationError extends Error {
  limitation?: string;
  workaround?: string;
  provided?: unknown;
  expected?: unknown;
  isAPILimitation?: boolean;
}

/**
 * Type guard to check if error has API limitation properties
 */
function isAPILimitationError(error: Error): error is APILimitationError {
  return (
    "isAPILimitation" in error &&
    (error as APILimitationError).isAPILimitation === true
  );
}

/**
 * Enhanced error message formatter for AI agents
 */
export function formatErrorForAI(
  error: Error,
  context: string
): {
  message: string;
  suggestion: string;
  workaround?: string;
  provided?: unknown;
  expected?: unknown;
} {
  const errorMessage = error.message;
  const errorLower = errorMessage.toLowerCase();

  // Check for API limitation errors
  if (
    errorLower.includes("cannot find field") ||
    errorLower.includes("unknown name") ||
    errorLower.includes("invalid json")
  ) {
    // This is likely an API limitation or unsupported feature
    return {
      message: `${context}: ${errorMessage}`,
      suggestion:
        "This operation may not be directly supported by the Google Slides API. Check the API documentation for supported features and consider using alternative approaches.",
      workaround: "The tool may automatically apply a workaround if available.",
    };
  }

  // Check for validation errors
  if (errorLower.includes("invalid") || errorLower.includes("out of range")) {
    const apiError = isAPILimitationError(error) ? error : null;
    return {
      message: `${context}: ${errorMessage}`,
      suggestion: "Verify all parameters are within valid ranges and formats.",
      provided: apiError?.provided,
      expected: apiError?.expected,
    };
  }

  // Default enhanced error
  return {
    message: `${context}: ${errorMessage}`,
    suggestion:
      "Review the error message and check that all required parameters are provided correctly.",
  };
}
