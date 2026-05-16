# Journey Planner v3 — Flow Specification
## Living Document: Update this BEFORE implementing new features

---

## Flow A: New Journey Creation / Edit Journey

### The Golden Path (Happy Path)

1. **Click "Plan New Trip"** from the Home dashboard
   - → `journeyState.loadEmptyJourney()` creates blank journey
   - → Auto-navigates to **Calendar view**
   - → Timeline sidebar shows editable "New Adventure" title card

2. **Title card** appears on top of the timeline (left rail)
   - Click to rename inline (saves on blur/Enter)
   - Shows trip stats: days count, cities count, countdown

3. **Calendar multi-city picker**
   - Click start date → click end date → modal asks "Where?"
   - Google Autocomplete suggests cities/airports
   - On selection: days are created and appended
   - ⚠️ FUTURE: Add "Continue Adding?" prompt → loop back to step 3
   - ⚠️ FUTURE: Add "Trip Builder Bar" showing segments at top

4. **Day cards auto-populate** in the timeline sidebar
   - Sorted chronologically
   - Each card shows: city hero image, date, hotel slot, activity slots
   - Transit legs auto-calculated between different cities

5. **Switch to Map view** — day cards STAY on the left
   - **UI INVARIANT**: Timeline sidebar is NEVER hidden
   - Desktop: sidebar + map side-by-side
   - Mobile: **Bottom Sheet drawer** allows expanding/collapsing the timeline over the map

6. **Add activities** from three entry points:
   - **6a. Map click**: Click any POI → InfoWindow shows "📍 Activity" or "🏨 Hotel"
   - **6b. Search bar**: Top-center bar using Google Autocomplete for manual POI entry
   - **6c. AI Discovery Sparkle**: Floating action button (bottom-right) for AI suggestions

7. **Reallocate days** when plans change
   - Click a planned date on the Calendar → Reassign modal appears
   - Options: Search new city (keeps activities) or "Remove Day" (deletes)
   - Day cards update immediately

8. **Calendar reassignment** (same as step 7)
   - Clicking any blue-badged date opens the reassign modal
   - NOT just a scroll-to-card anymore

9. **Map view with persistent day cards** (same invariant as step 5)

10. **Add flight/transit information**
    - **Logistics section** in each day card
    - Add via quick prompt or managed list
    - Data persists in `day.logistics[]`

11. **Hotel from map or day card**
    - From day card: Click "Add Hotel Hub" ghost slot → Hotel Picker modal
    - From map: Click any POI → "🏨 Hotel" button in InfoWindow
    - Both call `journeyState.setHotel(dayId, hotel)`

---

## Architecture Map (Who Owns What)

| Step | Component | Event Emitted | State Method |
|------|-----------|--------------|--------------|
| 1 | `dashboard.js` | `NAVIGATE_TO calendar` | `loadEmptyJourney()` |
| 2 | `timelineSummary.js` | — | `journey.title` (direct) |
| 3 | `calendar.js` | `JOURNEY_LOADED` | `addRange()` |
| 4 | `timeline.js` + `timelineCard.js` | listens `JOURNEY_LOADED` | — |
| 5 | `viewOrchestrator.js` | `VIEW_CHANGED` | — |
| 6a | `map.js` | — | `addPick()` / `setHotel()` |
| 6c | `discovery.js` | `DISCOVERY_RESULTS_READY` | — |
| 7-8 | `calendar.js` | `JOURNEY_LOADED` | `removeDay()` / `reassignDay()` |
| 10 | ⚠️ TODO | — | `addTicket()` (exists, no UI) |
| 11 | `hotelPicker.js` + `map.js` | `OPEN_HOTEL_PICKER` | `setHotel()` |

---

## UI Invariants (NEVER violate these)

1. **Timeline sidebar is ALWAYS visible** on every view
2. **Day cards are sorted chronologically** — always
3. **No innerHTML with dynamic user data** — use textContent/createElement
4. **Transit legs auto-recalculate** on every `save()` call
5. **Focused day drives Discovery Radar location** — not first day or user GPS

---

## Event Bus Registry

| Event | Emitter(s) | Listener(s) |
|-------|-----------|-------------|
| `JOURNEY_LOADED` | journeyState | timeline, calendar, map, dashboard |
| `JOURNEYS_UPDATED` | journeyState | dashboard |
| `NAVIGATE_TO` | bottomNav, dashboard, calendar | viewOrchestrator |
| `VIEW_CHANGED` | viewOrchestrator | bottomNav, map, calendar, discovery |
| `CITY_FOCUSED` | timeline (scroll-spy) | map |
| `DAY_FOCUSED` | journeyState | — |
| `OPEN_HOTEL_PICKER` | timelineCard | hotelPicker |
| `DISCOVERY_RESULTS_READY` | discoveryUI | map |
| `DAYS_REORDERED` | timeline (drag) | journeyState |
| `THEME_CHANGED` | theme.js | map |
| `API_TIMEOUT` | vibeEngine | — |
