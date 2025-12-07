/**
 * Authentication Module Exports
 */

export {
  getOAuth2Client,
  saveTokens,
  getAuthUrl,
  exchangeCodeForTokens,
  hasValidTokens,
  ensureValidToken,
  getTokensPath,
  clearTokens,
  startAuthFlow,
} from "./oauth2";

export { GOOGLE_SLIDES_SCOPES, GOOGLE_SLIDES_SCOPES_READONLY } from "./scopes";

