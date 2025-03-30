const axios = require("axios");
const xml2js = require("xml2js");
const config = require("../config");

exports.fetchNews = async () => {
  try {
    console.log("Inside fetchNews function...");
    console.log("Checking NewsAPI key...");
    console.log("Config object:", config);
    if (!config.newsApiKey) {
      throw new Error("NewsAPI key is missing in configuration");
    }
    console.log(
      "NewsAPI key loaded successfully:",
      config.newsApiKey.substring(0, 5) + "..."
    );
    console.log("Making NewsAPI request...");
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: "flood OR earthquake OR cyclone OR disaster OR storm OR landslide OR tsunami OR heatwave OR forest fire", 
        apiKey: config.newsApiKey,
        language: "en",
        sortBy: "publishedAt",
        pageSize: 100,
      },
    });
    console.log("NewsAPI response status:", response.status);
    const articles = response.data.articles || [];
    console.log("NewsAPI raw data:", articles);

    const disasterKeywords = [
      "flood",
      "earthquake",
      "cyclone",
      "disaster",
      "storm",
      "landslide",
      "tsunami",
      "heatwave",
      "heat wave",
      "forest fire",
    ];
    const exclusionKeywords = [
      "violence",
      "arson",
      "protest",
      "riot",
      "clash",
      "attack",
      "political",
      "election",
      "scandal",
      "space",
      "trade",
      "cricket",
      "ipl",
      "market",
      "coffee",
    ];

    const filteredArticles = articles.filter((article) => {
      const text = (article.title + " " + (article.description || "")).toLowerCase();
      const hasDisasterKeyword = disasterKeywords.some((keyword) =>
        text.includes(keyword)
      );
      const hasExclusionKeyword = exclusionKeywords.some((keyword) =>
        text.includes(keyword)
      );
      return hasDisasterKeyword && !hasExclusionKeyword;
    });

    console.log("Filtered NewsAPI articles:", filteredArticles);

    return filteredArticles.map((article) => ({
      text: article.title + " " + (article.description || "") + (article.url ? " " + article.url : ""),
      created_at: article.publishedAt,
      source: "NewsAPI",
    }));
  } catch (error) {
    console.error("Error fetching news articles:", error.message);
    console.error("Error stack:", error.stack);
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }
    return [];
  }
};

exports.fetchGdacs = async () => {
  try {
    console.log("Fetching GDACS data...");
    const response = await axios.get("https://www.gdacs.org/xml/rss.xml");
    console.log("GDACS response status:", response.status);
    const result = await xml2js.parseStringPromise(response.data);
    const items = result.rss.channel[0].item || [];
    console.log("GDACS raw data:", items);
    return items
      .map((item) => ({
        text: item.title[0] + " " + (item.description[0] || ""),
        created_at: item.pubDate[0],
        source: "GDACS",
        link: item.link[0],
      })); // Removed India filter to fetch global GDACS alerts
  } catch (error) {
    console.error("Error fetching GDACS alerts:", error.message);
    return [];
  }
};

exports.fetchUsgs = async () => {
  try {
    console.log("Fetching USGS data...");
    const response = await axios.get(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
    );
    const features = response.data.features || [];
    console.log("USGS raw data:", features);

    return features.map((feature) => ({
      text: `Earthquake: ${feature.properties.title}`,
      created_at: new Date(feature.properties.time).toISOString(),
      source: "USGS",
      coordinates: feature.geometry.coordinates,
    })); // Removed India-specific bounding box filter to fetch global earthquakes
  } catch (error) {
    console.error("Error fetching USGS data:", error.message);
    return [];
  }
};

exports.fetchWeather = async () => {
  try {
    // Define multiple locations across the world (latitude, longitude, and name)
    const locations = [
      { name: "Kerala (Thrissur)", latitude: 10.8505, longitude: 76.2711, country: "India" },
      { name: "Mumbai", latitude: 19.076, longitude: 72.8777, country: "India" },
      { name: "Delhi", latitude: 28.7041, longitude: 77.1025, country: "India" },
      { name: "Chennai", latitude: 13.0827, longitude: 80.2707, country: "India" },
      { name: "Kolkata", latitude: 22.5726, longitude: 88.3639, country: "India" },
      { name: "Bengaluru", latitude: 12.9716, longitude: 77.5946, country: "India" },
      { name: "Guwahati (Assam)", latitude: 26.1445, longitude: 91.7362, country: "India" },
      { name: "Bhubaneswar (Odisha)", latitude: 20.2961, longitude: 85.8245, country: "India" },
      { name: "Tokyo", latitude: 35.6762, longitude: 139.6503, country: "Japan" },
      { name: "Los Angeles", latitude: 34.0522, longitude: -118.2437, country: "United States" },
      { name: "Sydney", latitude: -33.8688, longitude: 151.2093, country: "Australia" },
      { name: "London", latitude: 51.5074, longitude: -0.1278, country: "United Kingdom" },
      { name: "Sao Paulo", latitude: -23.5505, longitude: -46.6333, country: "Brazil" },
      { name: "Nairobi", latitude: -1.2921, longitude: 36.8219, country: "Kenya" },
      { name: "Moscow", latitude: 55.7558, longitude: 37.6173, country: "Russia" },
    ];

    const allAlerts = [];

    // Fetch weather data for each location
    for (const location of locations) {
      console.log(`Fetching Open-Meteo data for ${location.name}...`);
      const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          hourly: "precipitation,windspeed_10m",
          forecast_days: 1,
        },
      });

      const hourly = response.data.hourly;
      const alerts = [];

      // Check for heavy rainfall and high winds
      for (let i = 0; i < hourly.time.length; i++) {
        if (hourly.precipitation[i] > 30) {
          alerts.push({
            text: `Heavy rainfall detected in ${location.name}: ${hourly.precipitation[i]} mm`,
            created_at: hourly.time[i],
            source: "Open-Meteo",
            category: "flood",
            coordinates: [location.longitude, location.latitude],
            country: location.country,
          });
        }
        if (hourly.windspeed_10m[i] > 50) {
          alerts.push({
            text: `High winds detected in ${location.name}: ${hourly.windspeed_10m[i]} km/h`,
            created_at: hourly.time[i],
            source: "Open-Meteo",
            category: "cyclone",
            coordinates: [location.longitude, location.latitude],
            country: location.country,
          });
        }
      }

      console.log(`Open-Meteo alerts for ${location.name}:`, alerts);
      allAlerts.push(...alerts);
    }

    console.log("All Open-Meteo alerts:", allAlerts);
    return allAlerts;
  } catch (error) {
    console.error("Error fetching Open-Meteo weather data:", error.message);
    return [];
  }
};

// Helper function to process posts
const processPost = async (post) => {
  try {
    let category = "unknown";
    const textLower = post.text.toLowerCase();

    // Check for disaster keywords
    if (textLower.includes("earthquake")) category = "earthquake";
    if (textLower.includes("flood")) category = "flood";
    if (textLower.includes("cyclone") || textLower.includes("storm")) category = "cyclone";
    if (textLower.includes("landslide")) category = "landslide";
    if (textLower.includes("tsunami")) category = "tsunami";
    if (textLower.includes("forest fire")) category = "forest fire";
    if (textLower.includes("heatwave") || textLower.includes("heat wave")) category = "heatwave";

    // Use category from fetchWeather if provided
    if (post.category) {
      category = post.category;
    }

    // Skip if no disaster category is identified
    if (category === "unknown") {
      console.log("Skipping post with no disaster category:", post.text);
      return null;
    }

    // Define Indian states and cities with their coordinates
    const indianLocations = {
      "andhra pradesh": { coordinates: [80.0, 16.5], type: "state" },
      "arunachal pradesh": { coordinates: [93.0, 28.0], type: "state" },
      "assam": { coordinates: [92.0, 26.0], type: "state" },
      "bihar": { coordinates: [85.0, 25.0], type: "state" },
      "chhattisgarh": { coordinates: [82.0, 21.0], type: "state" },
      "goa": { coordinates: [74.0, 15.0], type: "state" },
      "gujarat": { coordinates: [72.0, 23.0], type: "state" },
      "haryana": { coordinates: [76.0, 29.0], type: "state" },
      "himachal pradesh": { coordinates: [77.0, 31.0], type: "state" },
      "jharkhand": { coordinates: [85.0, 23.0], type: "state" },
      "karnataka": { coordinates: [76.0, 15.0], type: "state" },
      "kerala": { coordinates: [76.0, 10.0], type: "state" },
      "madhya pradesh": { coordinates: [78.0, 23.0], type: "state" },
      "maharashtra": { coordinates: [73.0, 19.0], type: "state" },
      "manipur": { coordinates: [94.0, 24.0], type: "state" },
      "meghalaya": { coordinates: [91.0, 25.0], type: "state" },
      "mizoram": { coordinates: [92.0, 23.0], type: "state" },
      "nagaland": { coordinates: [94.0, 26.0], type: "state" },
      "odisha": { coordinates: [85.0, 20.0], type: "state" },
      "punjab": { coordinates: [75.0, 31.0], type: "state" },
      "rajasthan": { coordinates: [74.0, 27.0], type: "state" },
      "sikkim": { coordinates: [88.0, 27.0], type: "state" },
      "tamil nadu": { coordinates: [78.0, 11.0], type: "state" },
      "telangana": { coordinates: [79.0, 17.0], type: "state" },
      "tripura": { coordinates: [91.0, 23.0], type: "state" },
      "uttar pradesh": { coordinates: [80.0, 27.0], type: "state" },
      "uttarakhand": { coordinates: [79.0, 30.0], type: "state" },
      "west bengal": { coordinates: [88.0, 22.0], type: "state" },
      "nicobar islands": { coordinates: [92.5, 7.0], type: "state" },
      "bengaluru": { coordinates: [77.5946, 12.9716], type: "city", state: "Karnataka" },
      "delhi": { coordinates: [77.1025, 28.7041], type: "city", state: "Delhi" },
      "mumbai": { coordinates: [72.8777, 19.0760], type: "city", state: "Maharashtra" },
      "faridabad": { coordinates: [77.3178, 28.4089], type: "city", state: "Haryana" },
      "gwalior": { coordinates: [78.1828, 26.2183], type: "city", state: "Madhya Pradesh" },
      "kota": { coordinates: [75.8391, 25.2138], type: "city", state: "Rajasthan" },
      "ludhiana": { coordinates: [75.8573, 30.9010], type: "city", state: "Punjab" },
      "meerut": { coordinates: [77.7064, 28.9845], type: "city", state: "Uttar Pradesh" },
      "surat": { coordinates: [72.8311, 21.1702], type: "city", state: "Gujarat" },
    };

    let location = { name: "Unknown", coordinates: null, type: "unknown" };
    let mentionedLocations = [];

    for (const [locationName, locData] of Object.entries(indianLocations)) {
      if (textLower.includes(locationName)) {
        const formattedName = locationName.charAt(0).toUpperCase() + locationName.slice(1);
        if (locData.type === "state") {
          mentionedLocations.push({
            name: formattedName,
            coordinates: locData.coordinates,
            type: "state",
          });
        } else if (locData.type === "city") {
          mentionedLocations.push({
            name: locData.state,
            coordinates: locData.coordinates,
            type: "state",
          });
        }
      }
    }

    if (mentionedLocations.length === 0) {
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

      for (const [countryKey, countryName] of Object.entries(countries)) {
        if (textLower.includes(countryKey)) {
          mentionedLocations.push({
            name: countryName,
            coordinates: null, 
            type: "country",
          });
          break; 
        }
      }
    }

   
    if (post.country) {
      mentionedLocations = [
        {
          name: post.country,
          coordinates: post.coordinates,
          type: "country",
        },
      ];
    }

 
    if (mentionedLocations.length === 0) {
      mentionedLocations.push({ name: "Unknown", coordinates: null, type: "unknown" });
    }

    const disasterEntries = mentionedLocations.map((location) => ({
      text: post.text,
      category,
      location: {
        name: location.name,
        coordinates: location.coordinates,
        type: location.type,
      },
      timestamp: new Date(post.created_at).toISOString(),
      source: post.source,
    }));

    if ((post.source === "USGS" || post.source === "Open-Meteo") && post.coordinates) {
      disasterEntries.forEach((entry) => {
        entry.location.coordinates = post.coordinates.slice(0, 2); 
      });
    }

    return disasterEntries.length === 1 ? disasterEntries[0] : disasterEntries;
  } catch (error) {
    console.error("Error processing post:", error.message);
    return null;
  }
};

exports.processPost = processPost;