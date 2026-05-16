import { loadGoogleMapsScript } from '../ui/map.js';
import { vibeEngine } from './engine.js';

class DiscoveryEngine {
  constructor() {
    this.placesService = null;
  }

  /**
   * Initializes the Google Places service
   */
  async init() {
    if (this.placesService) return;
    await loadGoogleMapsScript();
    const dummyMap = document.createElement('div');
    this.placesService = new window.google.maps.places.PlacesService(dummyMap);
  }

  /**
   * The Main Orchestrator
   */
  async runDiscovery(category, coords, city, cityCoords, isNomadMode = false) {
    try {
      // 1. Get Keywords
      const keywords = await vibeEngine.generateDiscoveryStrategy(category, coords, city, isNomadMode);
      
      // 2. Find Real Places
      const rawPlaces = await this.findRealPlaces(keywords, cityCoords, isNomadMode);
      
      // 3. Enrich with AI
      const enriched = await vibeEngine.enrichDiscoveryResults(rawPlaces, category, city);
      
      return enriched;
    } catch (e) {
      console.error("Discovery Pipeline Failed", e);
      return [];
    }
  }

  /**
   * Stage 1: Convert Radar Coordinates to Search Strategy
   * @param {string} category - 'spooky', 'dining', etc.
   * @param {Object} coords - { distance, intensity } (0 to 1)
   * @param {string} city - The current city context
   * @param {boolean} isNomadMode - Whether to avoid tourist icons
   */
  async getSearchStrategy(category, coords, city, isNomadMode) {
    // This will call Gemini via vibeEngine
    return vibeEngine.generateDiscoveryStrategy(category, coords, city, isNomadMode);
  }

  /**
   * Stage 2: Search Google for REAL operational places
   */
  async findRealPlaces(keywords, cityCoords, isNomadMode = false) {
    await this.init();
    
    const results = [];
    const searchPromises = keywords.slice(0, 3).map(keyword => {
      return new Promise((resolve) => {
        const request = {
          query: keyword,
          locationBias: { radius: 10000, center: cityCoords },
          fields: ['name', 'geometry', 'place_id', 'business_status', 'opening_hours', 'rating', 'photos', 'formatted_address', 'types', 'user_ratings_total']
        };

        this.placesService.textSearch(request, (places, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && places) {
            // Filter Logic
            const valid = places.filter(p => {
              const isOperational = p.business_status === 'OPERATIONAL';
              if (!isOperational) return false;
              
              if (isNomadMode) {
                // Nomad Mode: Prefer high rating but low review count (Hidden Gem)
                return p.rating >= 4.2 && p.user_ratings_total < 1000;
              } else {
                return true;
              }
            });
            resolve(valid.slice(0, 2));
          } else {
            resolve([]);
          }
        });
      });
    });

    const nestedResults = await Promise.all(searchPromises);
    let finalResults = nestedResults.flat();

    // FALLBACK: If specific keywords failed, try a broad category search
    if (finalResults.length === 0) {
       console.log("DiscoveryEngine: No specific results found. Broadening search...");
       const fallbackRequest = {
         query: `${keywords[0]} in ${cityCoords.lat}, ${cityCoords.lng}`,
         locationBias: { radius: 10000, center: cityCoords },
         fields: ['name', 'geometry', 'place_id', 'business_status', 'rating', 'user_ratings_total', 'types']
       };
       
       return new Promise((resolve) => {
         this.placesService.textSearch(fallbackRequest, (places) => {
           resolve((places || []).filter(p => p.business_status === 'OPERATIONAL').slice(0, 3));
         });
       });
    }

    return finalResults;
  }

  /**
   * findHotels: Specialized search for accommodations
   */
  async findHotels(city, cityCoords) {
    await this.init();
    return new Promise((resolve) => {
      const request = {
        query: `best hotels in ${city}`,
        locationBias: { radius: 5000, center: cityCoords },
        types: ['lodging'],
        fields: ['name', 'geometry', 'place_id', 'rating', 'user_ratings_total', 'photos']
      };

      this.placesService.textSearch(request, (places, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && places) {
          resolve(places.slice(0, 5).map(p => ({
            id: p.place_id,
            name: p.name,
            lat: p.geometry.location.lat(),
            lng: p.geometry.location.lng(),
            rating: p.rating,
            photo: p.photos && p.photos.length > 0 ? p.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 }) : null
          })));
        } else {
          resolve([]);
        }
      });
    });
  }

  /**
   * Stage 3: Verify Opening Hours for a specific date
   */
  isPlaceOpenOnDate(place, dateStr) {
    if (!place.opening_hours) return true; // Assume open if no data
    // In a real implementation, we'd check the periods array against the day of week
    return true; 
  }
}

export const discoveryEngine = new DiscoveryEngine();
