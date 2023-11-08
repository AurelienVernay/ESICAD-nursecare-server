import "dotenv/config";
const googleDirectionsAPIURL =
   "https://routes.googleapis.com/directions/v2:computeRoutes";
const APIKey = process.env.GOOGLE_MAP_API_KEY || "";
/**
 * technical function to mimick latency from network in mock mode
 * @param {number} time the miliseconds to wait
 * @returns {Promise<void>} a promise that resolves after `time`ms
 */
const delay = (time: number) =>
   new Promise((resolve) => setTimeout(resolve, time));

/**
 * Function able to call Google Map API
 * @param {string[]} adresses an array of adresses (e.g. "1 rue de l'exemple, 75000 Paris"). Addresses must be in France.
 * @param {string} startingPoint a starting point for the trip (following same formalism than `adresses` param)
 * @returns {Promise<{orderedAddresses: string[], encodedPolyline: string}>} Promise of an object with the list of the adresses ordered to optimize duration of transit, and encoded polyline that cna be injected inside a google Maps widget to display track
 */
const computeRoutes = async (adresses: string[], startingPoint: string) => {
   let result;
   if (APIKey.length) {
      const requestBody = {
         origin: {
            address: startingPoint,
         },
         destination: {
            address: startingPoint,
         },
         intermediates: adresses.map((a) => ({ address: a })),
         regionCode: "fr",
         travelMode: "DRIVE",
         routingPreference: "TRAFFIC_AWARE",
         departureTime: new Date().toISOString(),
         computeAlternativeRoutes: false,
         routeModifiers: {
            avoidTolls: true,
            avoidHighways: false,
            avoidFerries: false,
         },
         optimizeWaypointOrder: "true",
         languageCode: "fr-FR",
         units: "METRIC",
      };

      const response = await fetch(googleDirectionsAPIURL, {
         method: "POST",
         body: JSON.stringify(requestBody),
         headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": APIKey,
            "X-Goog-FieldMask":
               "routes.optimizedIntermediateWaypointIndex,routes.polyline",
         },
      });

      const gMapsResult =
         (await response.json()) as google.maps.DirectionsResult;
      const { routes } = gMapsResult;
      result = {
         // ugly casts to get the properties that i need (dunno why the types are out of date, might be doing smth wrong)
         orderedAddresses: (
            routes[0] as unknown as {
               optimizedIntermediateWaypointIndex: number[];
            }
         ).optimizedIntermediateWaypointIndex.map((i: number) => adresses[i]),
         encodedPolyline: (
            routes[0] as unknown as { polyline: { encodedPolyline: string } }
         ).polyline.encodedPolyline,
      };
   } else {
      console.log(
         "No Google Map API Key found in GOOGLE_MAP_API_KEY environement variable, using mock random mode",
      );
      result = {
         orderedAddresses: adresses.sort(
            () => Math.floor(Math.random() * 2) - 1,
         ),
         encodedPolyline: null, // not available on mocked data
      };
   }
   await delay(1500);
   return result;
};

export { computeRoutes };
