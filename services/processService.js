const axios = require("axios");
const Disaster = require("../models/disasterModel");

// Remove INDIA_BOUNDS and isWithinIndia since we want global coverage
// const INDIA_BOUNDS = {
//   minLat: 6.5,
//   maxLat: 37.0,
//   minLon: 68.0,
//   maxLon: 97.5,
// };

// const isWithinIndia = (lon, lat) => {
//   return (
//     lat >= INDIA_BOUNDS.minLat &&
//     lat <= INDIA_BOUNDS.maxLat &&
//     lon >= INDIA_BOUNDS.minLon &&
//     lon <= INDIA_BOUNDS.maxLon
//   );
// };

// Define Indian cities for location extraction
const indianLocations = {
  Bengaluru: { coordinates: [77.5946, 12.9716], state: "Karnataka", type: "city" },
  Delhi: { coordinates: [77.1025, 28.7041], state: "Delhi", type: "city" },
  Mumbai: { coordinates: [72.8777, 19.0760], state: "Maharashtra", type: "city" },
  Faridabad: { coordinates: [77.3178, 28.4089], state: "Haryana", type: "city" },
  Gwalior: { coordinates: [78.1828, 26.2183], state: "Madhya Pradesh", type: "city" },
  Kota: { coordinates: [75.8391, 25.1825], state: "Rajasthan", type: "city" },
  Ludhiana: { coordinates: [75.8573, 30.9010], state: "Punjab", type: "city" },
  Meerut: { coordinates: [77.7064, 28.9845], state: "Uttar Pradesh", type: "city" },
  Surat: { coordinates: [72.8311, 21.1702], state: "Gujarat", type: "city" },
  Shillong: { coordinates: [91.8933, 25.5788], state: "Meghalaya", type: "city" },
  Jowai: { coordinates: [92.2971, 25.4414], state: "Meghalaya", type: "city" },
  Khliehriat: { coordinates: [92.3748, 25.3590], state: "Meghalaya", type: "city" },
  "Nicobar Islands": {
    coordinates: [92.5324, 6.7709],
    state: "Andaman and Nicobar Islands",
    type: "city",
  },
  "Port Blair": {
    coordinates: [92.7265, 11.6234],
    state: "Andaman and Nicobar Islands",
    type: "city",
  },
};

// Define countries for global location extraction
const countries = {
  afghanistan: "Afghanistan",
  albania: "Albania",
  algeria: "Algeria",
  andorra: "Andorra",
  angola: "Angola",
  "antigua and barbuda": "Antigua and Barbuda",
  anguilla: "Anguilla",
  argentina: "Argentina",
  armenia: "Armenia",
  australia: "Australia",
  austria: "Austria",
  azerbaijan: "Azerbaijan",
  bahamas: "Bahamas",
  bahrain: "Bahrain",
  bangladesh: "Bangladesh",
  barbados: "Barbados",
  belarus: "Belarus",
  belgium: "Belgium",
  belize: "Belize",
  benin: "Benin",
  bhutan: "Bhutan",
  bolivia: "Bolivia",
  "bosnia and herzegovina": "Bosnia and Herzegovina",
  botswana: "Botswana",
  brazil: "Brazil",
  brunei: "Brunei",
  bulgaria: "Bulgaria",
  "burkina faso": "Burkina Faso",
  burundi: "Burundi",
  "cape verde": "Cape Verde",
  cambodia: "Cambodia",
  cameroon: "Cameroon",
  canada: "Canada",
  "central african republic": "Central African Republic",
  chad: "Chad",
  chile: "Chile",
  china: "China",
  colombia: "Colombia",
  comoros: "Comoros",
  "republic of congo": "Republic of Congo",
  "democratic republic of the congo": "Democratic Republic of the Congo",
  "costa rica": "Costa Rica",
  croatia: "Croatia",
  cuba: "Cuba",
  cyprus: "Cyprus",
  "czech republic": "Czech Republic",
  denmark: "Denmark",
  djibouti: "Djibouti",
  dominica: "Dominica",
  "dominican republic": "Dominican Republic",
  ecuador: "Ecuador",
  egypt: "Egypt",
  "el salvador": "El Salvador",
  "equatorial guinea": "Equatorial Guinea",
  eritrea: "Eritrea",
  estonia: "Estonia",
  eswatini: "Eswatini",
  ethiopia: "Ethiopia",
  fiji: "Fiji",
  finland: "Finland",
  france: "France",
  gabon: "Gabon",
  gambia: "Gambia",
  georgia: "Georgia",
  germany: "Germany",
  ghana: "Ghana",
  greece: "Greece",
  grenada: "Grenada",
  guatemala: "Guatemala",
  guinea: "Guinea",
  "guinea-bissau": "Guinea-Bissau",
  guyana: "Guyana",
  haiti: "Haiti",
  honduras: "Honduras",
  hungary: "Hungary",
  iceland: "Iceland",
  india: "India",
  indonesia: "Indonesia",
  iran: "Iran",
  iraq: "Iraq",
  ireland: "Ireland",
  israel: "Israel",
  italy: "Italy",
  jamaica: "Jamaica",
  japan: "Japan",
  jordan: "Jordan",
  kazakhstan: "Kazakhstan",
  kenya: "Kenya",
  kiribati: "Kiribati",
  "north korea": "North Korea",
  "south korea": "South Korea",
  kuwait: "Kuwait",
  kyrgyzstan: "Kyrgyzstan",
  laos: "Laos",
  latvia: "Latvia",
  lebanon: "Lebanon",
  lesotho: "Lesotho",
  liberia: "Liberia",
  libya: "Libya",
  liechtenstein: "Liechtenstein",
  lithuania: "Lithuania",
  luxembourg: "Luxembourg",
  madagascar: "Madagascar",
  malawi: "Malawi",
  malaysia: "Malaysia",
  maldives: "Maldives",
  mali: "Mali",
  malta: "Malta",
  "marshall islands": "Marshall Islands",
  mauritania: "Mauritania",
  mauritius: "Mauritius",
  mexico: "Mexico",
  micronesia: "Micronesia",
  moldova: "Moldova",
  monaco: "Monaco",
  mongolia: "Mongolia",
  montenegro: "Montenegro",
  morocco: "Morocco",
  mozambique: "Mozambique",
  myanmar: "Myanmar",
  namibia: "Namibia",
  nauru: "Nauru",
  nepal: "Nepal",
  netherlands: "Netherlands",
  "new zealand": "New Zealand",
  nicaragua: "Nicaragua",
  niger: "Niger",
  nigeria: "Nigeria",
  norway: "Norway",
  oman: "Oman",
  pakistan: "Pakistan",
  palau: "Palau",
  panama: "Panama",
  "papua new guinea": "Papua New Guinea",
  paraguay: "Paraguay",
  peru: "Peru",
  philippines: "Philippines",
  poland: "Poland",
  portugal: "Portugal",
  qatar: "Qatar",
  romania: "Romania",
  russia: "Russia",
  rwanda: "Rwanda",
  "saint kitts and nevis": "Saint Kitts and Nevis",
  "saint lucia": "Saint Lucia",
  "saint vincent and the grenadines": "Saint Vincent and the Grenadines",
  samoa: "Samoa",
  "san marino": "San Marino",
  "sao tome and principe": "Sao Tome and Principe",
  "saudi arabia": "Saudi Arabia",
  senegal: "Senegal",
  serbia: "Serbia",
  seychelles: "Seychelles",
  "sierra leone": "Sierra Leone",
  singapore: "Singapore",
  slovakia: "Slovakia",
  slovenia: "Slovenia",
  "solomon islands": "Solomon Islands",
  somalia: "Somalia",
  "south africa": "South Africa",
  "south sudan": "South Sudan",
  spain: "Spain",
  "sri lanka": "Sri Lanka",
  sudan: "Sudan",
  suriname: "Suriname",
  sweden: "Sweden",
  switzerland: "Switzerland",
  syria: "Syria",
  tajikistan: "Tajikistan",
  tanzania: "Tanzania",
  thailand: "Thailand",
  "timor-leste": "Timor-Leste",
  togo: "Togo",
  tonga: "Tonga",
  "trinidad and tobago": "Trinidad and Tobago",
  tunisia: "Tunisia",
  turkey: "Turkey",
  turkmenistan: "Turkmenistan",
  tuvalu: "Tuvalu",
  uganda: "Uganda",
  ukraine: "Ukraine",
  "united arab emirates": "United Arab Emirates",
  "united kingdom": "United Kingdom",
  "united states": "United States",
  uruguay: "Uruguay",
  uzbekistan: "Uzbekistan",
  vanuatu: "Vanuatu",
  "vatican city": "Vatican City",
  venezuela: "Venezuela",
  vietnam: "Vietnam",
  "wallis and futuna": "Wallis and Futuna",
  yemen: "Yemen",
  mayotte: "Mayotte",
  zambia: "Zambia",
  zimbabwe: "Zimbabwe",
};

// Helper function to extract location from text
const extractLocationFromText = (text, source) => {
  const lowerText = text.toLowerCase();

  // Check if the text mentions any known Indian cities
  const citiesMentioned = Object.keys(indianLocations).filter((city) =>
    lowerText.includes(city.toLowerCase())
  );

  if (citiesMentioned.length > 0) {
    const city = citiesMentioned[0];
    return {
      name: indianLocations[city].state,
      coordinates: indianLocations[city].coordinates,
      type: "state",
    };
  }

  // For USGS posts, extract location after " - "
  if (source === "USGS" && text.includes(" - ")) {
    const parts = text.split(" - ");
    if (parts.length > 1) {
      const locationText = parts[1].split(",")[0].trim();
      const matchedCity = Object.keys(indianLocations).find((city) =>
        locationText.toLowerCase().includes(city.toLowerCase())
      );
      if (matchedCity) {
        return {
          name: indianLocations[matchedCity].state,
          coordinates: indianLocations[matchedCity].coordinates,
          type: "state",
        };
      }
      // Check for countries
      const matchedCountry = Object.keys(countries).find((country) =>
        locationText.toLowerCase().includes(country)
      );
      if (matchedCountry) {
        return {
          name: countries[matchedCountry],
          coordinates: null,
          type: "country",
        };
      }
      return {
        name: "Unknown",
        coordinates: null,
        type: "unknown",
      };
    }
  }

  // For GDACS posts, extract countries between "affects these countries: [" and "]"
  if (source === "GDACS" && text.includes("affects these countries: [")) {
    const start = text.indexOf("affects these countries: [") + 26;
    const end = text.indexOf("]", start);
    const countryList = text
      .substring(start, end)
      .split(",")
      .map((c) => c.trim());
    if (countryList.length > 0 && countryList[0] !== "[unknown]") {
      const matchedCountry = Object.keys(countries).find((country) =>
        countryList[0].toLowerCase().includes(country)
      );
      if (matchedCountry) {
        return {
          name: countries[matchedCountry],
          coordinates: null,
          type: "country",
        };
      }
    }
  }

  // Check for countries in the text
  const matchedCountry = Object.keys(countries).find((country) =>
    lowerText.includes(country)
  );
  if (matchedCountry) {
    return {
      name: countries[matchedCountry],
      coordinates: null,
      type: "country",
    };
  }

  return {
    name: "Unknown",
    coordinates: null,
    type: "unknown",
  };
};

// Remove reverseGeocode since we don't need it for global disasters
// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// const reverseGeocode = async (lon, lat, requestIndex = 0) => {
//   try {
//     await delay(requestIndex * 500);
//     const apiKey = "pk.5be457253f673a8cb2ce17d11ca17749";
//     const response = await axios.get("https://us1.locationiq.com/v1/reverse", {
//       params: {
//         key: apiKey,
//         lat: lat,
//         lon: lon,
//         format: "json",
//       },
//     });
//     const data = response.data;
//     const state = data.address?.state || "Unknown";
//     return state;
//   } catch (error) {
//     console.error("Error in reverse geocoding with LocationIQ:", error.message);
//     return "Unknown";
//   }
// };

exports.processPost = async (post, requestIndex) => {
  try {
    let category = "unknown";
    let coordinates = null;
    let locationName = "Unknown";
    let locationType = "unknown";

    const text = post.text.toLowerCase();

    if (text.includes("earthquake")) {
      category = "earthquake";
    } else if (text.includes("flood")) {
      category = "flood";
    } else if (text.includes("cyclone") || text.includes("storm")) {
      category = "cyclone";
    } else if (text.includes("heatwave") || text.includes("heat wave")) {
      category = "heatwave";
    }

    // Extract location from text
    let location = extractLocationFromText(post.text, post.source);
    locationName = location.name;
    coordinates = location.coordinates;
    locationType = location.type;

    // If coordinates are provided, use them
    if (post.coordinates) {
      coordinates = post.coordinates;
    }

    // Special handling for NewsAPI posts
    if (post.source === "NewsAPI") {
      const entries = [];
      const citiesMentioned = Object.keys(indianLocations).filter((city) =>
        text.includes(city.toLowerCase())
      );

      if (citiesMentioned.length > 0) {
        for (let i = 0; i < citiesMentioned.length; i++) {
          const city = citiesMentioned[i];
          let cityState = indianLocations[city].state;
          let cityCoordinates = indianLocations[city].coordinates;

          entries.push({
            text: post.text,
            timestamp: post.created_at,
            source: post.source,
            category: category,
            location: {
              name: cityState,
              coordinates: cityCoordinates,
              type: "state",
            },
          });
        }
        return entries;
      } else {
        // Check for countries
        const matchedCountry = Object.keys(countries).find((country) =>
          text.includes(country)
        );
        if (matchedCountry) {
          locationName = countries[matchedCountry];
          locationType = "country";
        }
      }
    }

    return [
      {
        text: post.text,
        timestamp: post.created_at,
        source: post.source,
        category: category,
        location: {
          name: locationName,
          coordinates: coordinates,
          type: locationType,
        },
      },
    ];
  } catch (error) {
    console.error("Error processing post:", error.message);
    return null;
  }
};