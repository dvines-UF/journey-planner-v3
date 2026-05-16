# 🏗️ Architecture Rules: Journey Planner v3

### 1. The Stack ($0 Free Tier Optimized)
* **Build Tool:** Vite
* **Language:** Vanilla JS (ES6 Modules) - *No frameworks.*
* **Backend:** Firebase (Firestore + Auth) with `enableIndexedDbPersistence` for offline mode.
* **APIs:** Google Maps Platform, Google AI Studio (Gemini 1.5 Flash).
* **Styling:** Tailwind CSS (via Vite) and CSS Variables.

### 2. The Golden Rule: Physical Modularity
To defeat LLM token limits and hallucinations, the system is strictly divided by domain. **DO NOT output monolithic files.**
* `/core/eventBus.js` (Messaging) & `/core/journeyState.js` (Source of truth)
* `/ui/timeline.js`, `/ui/map.js`, `/ui/bottomNav.js` (DOM Manipulation)
* `/services/cloud.js` (Firebase) & `/services/engine.js` (AI)

### 3. State & Communication Protocols
* **Decoupling:** Modules NEVER call each other directly. All communication routes through the `eventBus`.
* **State vs. DOM:** State files never touch the DOM. UI files never hold source-of-truth data.
* **Optimistic UI:** When the user interacts, update the DOM immediately using local state, *then* emit events for backend sync. Never make the user wait for a network round-trip.

### 5. Safety & Resilience Patterns (The "Anti-Bug" List)
To avoid recurring regressions, follow these established patterns:
*   **Date Handling:** Never use `new Date(string).toISOString()` or `toLocaleDateString()` directly on `YYYY-MM-DD` strings without manual parsing. Always parse into `[y, m, d]` to create local Date objects and avoid UTC timezone shifts.
*   **State Persistence:** Every modification to `journeyState` must call `save()` before emitting `JOURNEY_LOADED`. This ensures UI updates and LocalStorage are always in sync.
*   **Bootstrap Safety:** Always emit `JOURNEY_LOADED` during initialization, even if `journey` is null. This allows the UI to decide between showing the Planner or the Dashboard.
*   **Loop Safety:** When rendering lists of cards (Timeline, Trips), wrap the render call in a `try/catch` block. A single malformed data entry should never crash the entire view.

### 4. The Anti-Clobber Protocol (AI Output Rule)
* **Code < 200 lines:** Output the entire, fully-runnable file.
* **Code > 200 lines:** Use precise Search/Replace `diff` blocks (e.g., ``). DO NOT truncate files.