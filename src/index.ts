import {
   computeRoutes,
   generatePermutations,
} from "./utils/route.computations";

const startingPoint = "1 Pl. du Président Thomas Wilson, 31000 Toulouse";
const adresses = [
   "6 Rue Ampère, 31670 Labège",
   "36 Rte de Bayonne, 31000 Toulouse",
   "41 Bd de Strasbourg, 31000 Toulouse",
   "19-5 Rue des Anges, 31200 Toulouse",
   "272 Rte de Launaguet, 31200 Toulouse",
   "83 Rue Aristide Maillol, 31106 Toulouse",
];
console.log(`Executing computation of routes from :
starting point : ${startingPoint}
going through :
${adresses.join("\n")}
`);

computeRoutes(adresses, startingPoint).then((result) => console.log(result));
