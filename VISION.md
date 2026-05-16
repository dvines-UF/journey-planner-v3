# Journey Planner v3: The Nomad Command Center Vision

This document tracks the core requirements for the v3 "Elite" architecture, as brainstormed and verified by the user.

## 🚀 The 8-Point Vision List

1.  **[DONE] Click on New Journey**: Starting the flow with a clean slate via the Trip Manager.
2.  **[DONE] Calendar-First Logic**: Range selection on a physical calendar grid to assign cities.
3.  **[DONE] Dynamic Side-Rail**: Real-time population of the Day Card rail during planning.
4.  **[DONE] The "Hotel Hub"**: A dedicated anchor for each city stay. 
    *   *Status*: Fully operational with Google Places search integration.
5.  **[DONE] The "Activity Slots"**: Dynamic flex boxes for AI and Google-grounded discoveries.
6.  **[DONE] Persistent Map Integration**: Switching between Map and Timeline while maintaining focus context.
7.  **[DONE] Click-to-Add from Map**: Adding "Ghost Pins" directly to the active day card.
8.  **[DONE] The "Transit Slot"**: Logistics for travel days between cities.
    *   *Status*: Auto-generation of transfer legs between city stops.

## 🛠️ Implementation Progress

| Feature | Status | Goal |
| :--- | :--- | :--- |
| **Nomad Mode** | ✅ 100% | High-rating/Low-review filtering to avoid tourists. |
| **XSS Hardening** | ✅ 100% | No `innerHTML` on dynamic data. |
| **Ghost Slots** | ✅ 100% | Interactive placeholders for activities. |
| **Transit Engine** | ✅ 100% | Auto-calculation between city stops. |
| **Hotel Picker** | ✅ 100% | Integrated Google Places Hotel search. |

---
*Created: 2026-05-15*