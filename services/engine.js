import { eventBus } from '../core/eventBus.js';
import { journeyState } from '../core/journeyState.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

class VibeEngine {
  constructor() {
    eventBus.on('VIBE_REQUESTED', this.handleVibeRequest.bind(this));
    
    if (GEMINI_API_KEY) {
      this.ai = new GoogleGenerativeAI(GEMINI_API_KEY);
      this.model = this.ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
  }

  /**
   * Basic guard against prompt injection
   */
  sanitizeInput(text) {
    if (!text) return "";
    // Strip common injection keywords
    const forbidden = ["ignore", "previous", "instruction", "system", "prompt", "password", "key"];
    let sanitized = text;
    forbidden.forEach(word => {
      const reg = new RegExp(word, "gi");
      sanitized = sanitized.replace(reg, "[filtered]");
    });
    return sanitized.substring(0, 500); // Character limit
  }

  /**
   * Robust JSON parsing with fallback
   */
  parseAIResponse(text, fallbackValue) {
    try {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleanText.indexOf('[');
      const lastBrace = cleanText.lastIndexOf(']');
      if (firstBrace !== -1 && lastBrace !== -1) {
        return JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
      }
      return JSON.parse(cleanText);
    } catch (e) {
      console.warn("AI JSON Parse Error:", e);
      return fallbackValue;
    }
  }

  async handleVibeRequest({ city, contextLeg }) {
    if (!this.model) {
      console.warn("VibeEngine: No Gemini API Key found. Returning fallback data.");
      this.applyFallbackVibe(city);
      return;
    }

    const safeCity = this.sanitizeInput(city);
    const safeContext = this.sanitizeInput(contextLeg);

    const prompt = `You are a luxury travel scout for Journey Planner v3.
The user is traveling to ${safeCity}. The context of their arrival/travel is: ${safeContext}.
Generate exactly 3 highly specific, atmospheric micro-experiences (picks) for them.
Adhere strictly to this JSON format:
[
  {
    "id": "unique-string",
    "name": "string",
    "type": "dining", // must be 'dining', 'sight', 'trail', or 'wine'
    "vibe_reasoning": "string" // exactly 1 sentence, very evocative
  }
]
Return ONLY valid JSON array without any markdown formatting or backticks.`;

    try {
      // Pre-flight check: generous 15-second timeout via Promise.race
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 5000);
      });

      const aiResponse = await Promise.race([
        this.model.generateContent(prompt),
        timeoutPromise
      ]);
      
      clearTimeout(timeoutId);
      const picks = this.parseAIResponse(aiResponse.response.text(), []);

      if (picks.length > 0) {
        this.updateJourneyWithPicks(city, picks);
      } else {
        this.applyFallbackVibe(city);
      }

    } catch (error) {
      console.error("Vibe Engine Error:", error);
      if (error.message === 'TIMEOUT') {
         eventBus.emit('API_TIMEOUT', { service: 'Gemini Vibe Engine' });
      }
      
      // Only apply fallback if the day currently has no picks
      const day = journeyState.journey?.days.find(d => d.city.name === city);
      if (day && (!day.picks || day.picks.length === 0)) {
        this.applyFallbackVibe(city);
      }
    }
  }

  applyFallbackVibe(city) {
     const fallbackPicks = [
       {
         id: `pick-fallback-${Date.now()}`,
         name: "Local Piazza Espresso",
         type: "dining",
         vibe_reasoning: "A quiet corner to watch the city wake up, completely offline and serene."
       }
     ];
     this.updateJourneyWithPicks(city, fallbackPicks);
  }

  updateJourneyWithPicks(cityName, picks) {
    if (!journeyState.journey) return;
    
    // Find the day with this city
    const day = journeyState.journey.days.find(d => d.city.name === cityName);
    if (day) {
      // Pre-flight validation on the generated types to ensure UI doesn't break
      const validTypes = ['dining', 'sight', 'trail', 'wine'];
      day.picks = picks.map(p => ({
         ...p,
         type: validTypes.includes(p.type) ? p.type : 'sight'
      }));
      
      journeyState.journey.lastModified = Date.now();
      
      // Trigger a re-render to update the timeline UI
      journeyState.save();
      eventBus.emit('JOURNEY_LOADED', { journey: journeyState.journey });
    }
  }

  /**
   * Generates a set of search keywords for the Discovery Engine
   */
  async generateDiscoveryStrategy(category, coords, city, isNomadMode = false) {
    if (!this.model) return [category, city];

    const prompt = `Act as a travel scout. User is in ${city} and wants something "${category}".
Intensity (Energy): ${coords.intensity}/1. Distance Preference: ${coords.distance}/1.
${isNomadMode ? 'CRITICAL: Avoid famous tourist icons and big landmarks. Focus on authentic, small, neighborhood hidden gems that locals love.' : 'Focus on top-rated and famous spots including icons.'}
Return exactly 3 search queries for Google Maps to find these real places.
Return ONLY a JSON array of strings. No markdown.`;

    try {
      const result = await this.model.generateContent(prompt);
      return this.parseAIResponse(result.response.text(), [category, city]);
    } catch (e) {
      console.error("Strategy Gen Error", e);
      return [category, city];
    }
  }

  /**
   * Enriches real Google Places results with AI vibe descriptions
   */
  async enrichDiscoveryResults(places, category, city) {
    if (!this.model) return places;

    const placesData = places.map(p => ({ name: p.name, types: p.types }));
    const prompt = `For these real places in ${city}, write a one-sentence evocative reason why they match a "${category}" vibe.
Places: ${JSON.stringify(placesData)}
Return ONLY a JSON array of strings in the same order as input. No markdown.`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const descriptions = JSON.parse(text);
      
      return places.map((p, i) => ({
        ...p,
        vibe_description: descriptions[i] || "A hand-picked discovery for your journey."
      }));
    } catch (e) {
      console.error("Enrichment Error", e);
      return places;
    }
  }
}

export const vibeEngine = new VibeEngine();
