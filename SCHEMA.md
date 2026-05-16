# Journey Planner Data Schema (v3)
*Standardized for AI Context & Local-First Persistence*

## 🏛️ Root Collection: `JourneyCollection`
Stored in `localStorage` under `journey_planner_collection_v3`.

```typescript
interface JourneyCollection {
  journeys: Journey[];
  activeJourneyId: string | null;
}
```

## 🗺️ Object: `Journey`
Represents a complete expedition.

```typescript
interface Journey {
  id: string;              // Unique ID (j-timestamp)
  title: string;           // Display name (e.g., "The Great Alps")
  status: 'planning' | 'active' | 'completed' | 'archived';
  createdAt: number;       // Unix timestamp
  lastModified: number;    // Unix timestamp
  days: JourneyDay[];      // Chronological array of days
}
```

## 📅 Object: `JourneyDay`
A single unit of the itinerary.

```typescript
interface JourneyDay {
  id: string;              // day-timestamp
  date: string;            // ISO Date (YYYY-MM-DD)
  city: {
    name: string;
    lat: number;
    lng: number;
  };
  hotelHub?: {
    name: string;
    type: 'luxury' | 'boutique' | 'budget';
  };
  transit: TransitLeg[];
  name: string;
  type: 'dining' | 'sight' | 'trail' | 'wine';
  vibe_reasoning: string; // AI generated context
}

interface TransitLeg {
  mode: 'flight' | 'train' | 'regional_rail' | 'ferry';
  departureTime: string; // Dumb string "14:30"
  provider: string; // e.g., "Trenitalia"
}

### 2. Event Dictionary (eventBus.js)
* `JOURNEY_LOADED` (payload: { journey: Journey }) - Emitted when data is ready.
* `DAY_ADDED` (payload: { dayId: string })
* `CITY_FOCUSED` (payload: { lat: number, lng: number }) - Triggers map pan.
* `VIBE_REQUESTED` (payload: { city: string, contextLeg: string })
* `API_TIMEOUT` (payload: { service: string }) - Triggers offline UI fallbacks.