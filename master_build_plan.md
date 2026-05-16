# 🗺️ Master Build Plan

* **PHASE 1: Core Engine & Dummy Data**
  * Setup Vite, `eventBus.js`, and `journeyState.js`.
  * *Crucial:* Architect generates a highly complex `dummyData.js` (Flight -> Train -> Ferry -> Farmhouse) so the UI has robust data to build against.
  * Connect Gemini API (with 5-second timeout).

* **PHASE 2: Magazine UI & Travel Mode**
  * Build Desktop map/timeline split.
  * Build Mobile "Travel Mode" (Bottom Nav, `100dvh`, Safe Areas).
  * Render the complex dummy data.

* **PHASE 3: Cloud Sync & Offline State**
  * Hook up Firebase Anonymous Auth.
  * Implement Firestore `onSnapshot` with `enableIndexedDbPersistence`.
  * Swap dummy data for live Cloud state.

* **PHASE 4: Portable Shell & PWA**
  * Build the "Setup Wizard" to remove hardcoded API keys.
  * Add `manifest.json` and Service Workers for true offline installability.