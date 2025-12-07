/**
 * Google Slides API OAuth2 Scopes
 */

export const GOOGLE_SLIDES_SCOPES = [
  "https://www.googleapis.com/auth/presentations",
  "https://www.googleapis.com/auth/drive.file",
] as const;

export const GOOGLE_SLIDES_SCOPES_READONLY = [
  "https://www.googleapis.com/auth/presentations.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
] as const;

export type GoogleSlidesScope = (typeof GOOGLE_SLIDES_SCOPES)[number];

