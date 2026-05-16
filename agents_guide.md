# 🤖 Agent Roles & Context Management

The Site Director (Human) will call upon specific agents. Agents must stay strictly in their domain to prevent context dilution.

* **Agent 1: Lead Full-Stack Architect**
  * *Domain:* Core Scaffolding, `eventBus`, State Management, `engine.js` (AI).
  * *Task:* Building the structural foundation and robust Dummy Data logic.
* **Agent 2: Mobile UX Engineer**
  * *Domain:* `timeline.js`, `map.js`, CSS, Touch Interactions.
  * *Task:* Building the "Travel Mode," bottom tabs, and the premium Magazine UI.
* **Agent 3: Cloud Architect**
  * *Domain:* `cloud.js`, Firebase Auth, Firestore.
  * *Task:* Implementing `onSnapshot`, family sharing, and IndexedDB offline persistence.
* **Agent 4: DevOps & Security**
  * *Domain:* PWA manifests, Setup Wizard, Deployment.
  * *Task:* Building the key-injection UI to protect API keys and configuring Vercel/Netlify.
* **Agent 5: Debug & QA Specialist**
  * *Domain:* Root Cause Analysis, `errorBoundaries`, Performance Profiling, Edge Case Validation.
  * *Task:* Hunting "The Misses," implementing robust `try/catch` fallbacks, and auditing 60fps mobile performance.
* **Agent 6: Context Architect (Agentic Engineer)**
  * *Domain:* Context Density, Modularization, Naming Conventions, Token Efficiency.
  * *Task:* Preventing AI hallucination by auditing file lengths, enforcing `SCHEMA.md` naming standards, and breaking down complex modules into "AI-digestible" chunks.
* **Agent 7: The Nomad (Travel Industry Expert)**
  * *Domain:* Travel APIs (Amadeus, Skyscanner), OTA Knowledge (Booking, Expedia, Airbnb), Transit Logistics (Rome2Rio, Omio), and Local Curation (GetYourGuide, Eater).
  * *Task:* Ensuring the planning flow is "logistically seamless" and "commercially smart." Providing the "Deep Context" for transit slots and hotel selection logic.

## 🛡️ Hallucination Guardrails (Context Hygiene)

To keep the "Agentic Brain" sharp and prevent model drift, all agents must adhere to these hygiene rules:

1.  **The 400-Line Rule**: No single file should exceed 400 lines. If a module grows larger, Agent 6 must be called to refactor it into smaller, focused sub-modules.
2.  **Explicit Naming (Anti-Drift)**: Never use generic variables like `data`, `item`, or `obj`. Use domain-explicit names (e.g., `journey`, `journeyDay`, `activityPick`) to prevent the AI from losing the reference pointer.
3.  **Flat State Preference**: Avoid nesting state objects more than 3 levels deep. Deep nesting is the primary cause of "property hallucinations."
4.  **JSDoc "Frozen Context"**: Every exported function must have a JSDoc block. This provides a permanent, immutable definition that the AI can reference even if the surrounding code gets complex.

### 🛑 Anti-Drift Policies (Agent 5/6 Verified)
- **Static Import Rule**: NEVER use dynamic `import()` for core state modules (e.g., `journeyState.js`). This causes HMR loops and state fragmentation. Use static ES6 imports.
- **The 300ms Resize Rule**: When switching visibility of Canvas elements (Map/Calendar), always trigger a `resize` event with a minimum 300ms `setTimeout` to account for mobile browser layout reflow.
- **Noun Enforcement**: The primary entity is `Journey`. Never use `Trip` in code or documentation.

## 🏁 QA Gates (The "Definition of Done")

Before any feature is merged from an Agent's domain to the Main branch, it must pass through these professional gates:

1.  **The "Flight Mode" Test**: Does the UI gracefully handle a sudden loss of network? (No infinite spinners).
2.  **The "Empty State" Test**: Does the view look premium when there is zero data? (No "null" or "undefined" text).
3.  **The "Mobile Throttling" Test**: Does the page load in <3s on 3G? Are touch targets at least 44x44px?
4.  **The "Misses" Audit**: Does the new code violate any of the specific pitfalls listed below?

## 🚨 Active Learnings & Known Pitfalls (The "Misses")

All agents must adhere to these defensive programming patterns discovered during active development:

1. **Google Maps API Fragility**:
   * *Autocomplete*: Do not use `locationBias` for strict boundary constraints; it fails. Use `bounds` combined with `strictBounds: true`.
   * *Places Photos*: Never use `findPlaceFromQuery` to fetch photos—it's brittle and fails if the #1 result lacks a photo. ALWAYS use `textSearch` to get a pool of 20 results and iterate to find a valid photo.
2. **State & Chronology Integrity**:
   * *Timeline Logic*: Never append a day blindly. Always explicitly `sort()` the days array by date before emitting state changes, otherwise `DirectionsService` will route a zigzag path across continents.
3. **Browser Native & Hardware Quirks**:
   * *Geolocation*: `navigator.geolocation.getCurrentPosition` can hang indefinitely on desktop browsers (especially Windows). You MUST provide a visual fallback (e.g., panning to a wide continent view first) and enforce a strict `timeout` parameter so the UI doesn't freeze.
4. **Asynchronous UI Fallbacks**:
   * Never leave a grey box. If a network request (like fetching a city image) fails, always fall back to a premium, CSS-based dark gradient.