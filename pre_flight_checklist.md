# ✈️ Pre-Flight Checklist (Agent Requirements)
Agents must check these before finalizing code.

### 1. Spotty 3G & Offline Resilience
 Vibe Engine Timeout Gemini API calls MUST be wrapped in a strict 5-second timeout. If it times out, gracefully load cached data or a beautiful offline fallback.
 Map Fallback If Google Maps fails to load, the UI must not white-screen; the timeline must take up 100% width gracefully.

### 2. Mobile Browser Quirks
 Dynamic Viewports Use `min-h-[100dvh]` to account for iOS Safari search bars.
 Safe Areas Add `padding-bottom env(safe-area-inset-bottom)` to bottom navigation components.
 Touch Interactions Use `select` and `input` natively. Avoid custom DIV dropdowns on mobile to prevent sticky-hover states.

### 3. Security
 XSS Use `.textContent` instead of `.innerHTML` when rendering user inputs or AI text.
 Secrets Hardcode API keys ONLY during Phase 1. They must be moved to environment variables  setup wizard before deployment.