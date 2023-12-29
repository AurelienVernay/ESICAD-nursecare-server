import "dotenv/config";

const gMapsAPIKey = process.env.GOOGLE_MAP_API_KEY || undefined;
const ORServiceAPIKey = process.env.OPENROUTE_SERVICE_API_KEY || undefined;
const googleDirectionsAPIURL =
   "https://routes.googleapis.com/directions/v2:computeRoutes";
// defining URL used for ORService API calls
const geocodeURL = `https://api.openrouteservice.org/geocode/search?api_key=${ORServiceAPIKey}&`;
/**
 * technical function to mimick latency from network in mock mode
 * @param {number} time the miliseconds to wait
 * @returns {Promise<void>} a promise that resolves after `time` ms
 */
const delay = (time: number) =>
   new Promise((resolve) => setTimeout(resolve, time));

/**
 * Function able to call Google Map API
 * @param {string[]} addresses an array of adresses (e.g. "1 rue de l'exemple, 75000 Paris"). Addresses must be in France.
 * @param {string} startingPoint a starting point for the trip (following same formalism than `adresses` param)
 * @returns {Promise<{orderedAddresses: string[], encodedPolyline: string}>} Promise of an object with the list of the adresses ordered to optimize duration of transit, and encoded polyline that cna be injected inside a google Maps widget to display track
 */
const computeRoutes = async (addresses: string[], startingPoint: string) => {
   let result;
   // computing timezone offset in milliseconds
   const timezoneOffset = new Date().getTimezoneOffset() * 60000;
   // computing timestamp taking timezone into account
   const now = new Date(Date.now() - timezoneOffset);

   if (gMapsAPIKey?.length) {
      const requestBody = {
         origin: {
            address: startingPoint,
         },
         destination: {
            address: startingPoint,
         },
         intermediates: addresses.map((a) => ({ address: a })),
         regionCode: "fr",
         travelMode: "DRIVE",
         routingPreference: "TRAFFIC_AWARE",
         departureTime: now.toISOString(),
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
            "X-Goog-Api-Key": gMapsAPIKey,
            "X-Goog-FieldMask":
               "routes.optimizedIntermediateWaypointIndex,routes.polyline",
         },
      });

      const gMapsResult =
         (await response.json()) as google.maps.DirectionsResult & {
            error: unknown;
         };
      if (gMapsResult.error) {
         console.log(
            "Error while retrieving result",
            JSON.stringify(gMapsResult.error),
         );
         result = null;
      } else {
         const { routes } = gMapsResult;
         result = {
            // ugly casts to get the properties that i need (dunno why the types are out of date, might be doing smth wrong)
            orderedAddresses: (
               routes[0] as unknown as {
                  optimizedIntermediateWaypointIndex: number[];
               }
            ).optimizedIntermediateWaypointIndex.map(
               (i: number) => addresses[i],
            ),
            encodedPolyline: (
               routes[0] as unknown as { polyline: { encodedPolyline: string } }
            ).polyline.encodedPolyline,
         };
      }
   } else if (ORServiceAPIKey?.length) {
      console.log("Using OpenRouteService :");

      console.log("Step 1 : resolve coordinates from addresses");
      /** 
         for each address, get coordinates by one call, 
         dispatching parallel requests and using Promise.all 
         to wait for them all to resolve 
       */
      const addressesWithStart = [startingPoint, ...addresses];
      const addressesCoordinates = await Promise.all(
         addressesWithStart.map((address) =>
            fetch(
               `${geocodeURL}text=${encodeURI(address)}&boundary.country=FRA`,
               {
                  headers: {
                     "Accept-Language": "fr-FR",
                  },
               },
            )
               .then((response) => response.json())
               .then((response) => {
                  return response.features[0].geometry.coordinates;
               }),
         ),
      );

      console.log("Step 2 : Obtain distance matrix from coordinates");
      const distanceMatrix = (
         await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
            method: "post",
            headers: {
               Authorization: ORServiceAPIKey,
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               metrics: ["distance"],
               locations: addressesCoordinates,
            }),
         }).then((response) => response.json())
      ).distances;
      console.table(distanceMatrix);
      console.log(
         "Step 3: Generating permutations of addresses and resolving distances",
      );
      const permutations = generatePermutations(
         addressesWithStart.map((_, i) => i),
      ) as number[][];
      const distancesByPermutations = permutations
         .map((permutation) => ({
            permutation: permutation,
            distance: permutation.reduce(
               (acc, addressPosition, index, array) => {
                  console.log(
                     acc,
                     addressPosition,
                     index + 1,
                     distanceMatrix[addressPosition][array[index + 1]],
                  );
                  return (
                     acc +
                     (index + 1 !== array.length
                        ? distanceMatrix[addressPosition][array[index + 1]]
                        : 0)
                  );
               },
               0,
            ),
         }))
         .sort((a, b) => {
            return a.distance - b.distance ?? 0;
         });
      const bestPermutation = distancesByPermutations[0];
      console.log("best permutation : ", JSON.stringify(bestPermutation));
      result = {
         orderedAddresses: bestPermutation.permutation.map(
            (a) => addressesWithStart[a],
         ),
         encodedPolyline: null, // not available on mocked data
      };
   } else {
      console.log(
         "No Google Map or OpenRouteService API Key found in environement variables, using mock random mode",
      );
      result = {
         orderedAddresses: addresses.sort(
            () => Math.floor(Math.random() * 2) - 1,
         ),
         encodedPolyline: null, // not available on mocked data
      };
   }
   await delay(1500);
   return result;
};

/**
 * Helper function to generate all permutations of the elements of an array
 * @param arr the array
 * @returns all possible permutations of the elements of the array
 */
const generatePermutations = <T>(arr: T[]): T[][] => {
   const result: T[][] = [];

   function permute(current: T[], remaining: T[]) {
      if (remaining.length === 0) {
         result.push([...current]);
         return;
      }

      for (let i = 0; i < remaining.length; i++) {
         const next = remaining.slice();
         const element = next.splice(i, 1)[0];
         permute([...current, element], next);
      }
   }

   permute([], arr);

   return result;
};

export { computeRoutes };
