/**
 * translations.js
 * ====================================================
 * Bilingual translation dictionary for the Car Repair
 * Shop Finder app. Supports English (en) and Burmese (mm).
 * ====================================================
 */

const translations = {
  en: {
    // App title & header
    appTitle: "Car Repair Shop Finder",
    appSubtitle: "Find trusted repair shops near you",
    langButton: "မြန်မာ",

    // Step labels
    step1Title: "Select Your Car",
    step2Title: "Describe The Problem",
    step3Title: "Price Estimate",
    step4Title: "Nearby Repair Shops",

    // Form labels
    selectBrand: "Select Car Brand",
    selectModel: "Select Car Model",
    selectProblem: "Select Car Problem",
    selectBrandFirst: "— Select brand first —",
    chooseBrand: "— Choose a brand —",
    chooseModel: "— Choose a model —",
    chooseProblem: "— Choose a problem —",

    // Buttons
    btnEstimate: "Get Price Estimate",
    btnSearch: "Search Repair Shops",
    btnOpenMap: "Open in Map",

    // Price result
    estimatedCost: "Estimated Repair Cost",
    priceRange: "Price Range",
    currency: "MMK",

    // Shop list
    noShopsFound: "No repair shops found. Try searching again.",
    loading: "Loading...",
    searchingShops: "Searching for repair shops...",
    phone: "Phone",
    address: "Address",

    // Map
    mapTitle: "Repair Shops Map",
    mapNote: "Click a marker to see shop details",

    // Errors & messages
    errorLoadBrands: "Failed to load car brands. Please refresh.",
    errorLoadModels: "Failed to load car models.",
    errorLoadProblems: "Failed to load car problems.",
    errorLoadShops: "Failed to load repair shops.",
    selectCarAndProblem: "Please select a car and problem first.",
    selectProblemFirst: "Please select a problem first.",

    // Directions
    btnDirections: "Get Directions",
    directionsTo: "Directions to",
    calculatingRoute: "Calculating route...",
    routeOnMap: "Follow the route on the map above.",
    routeError: "Could not calculate route. Try Google Maps.",
    gettingLocationForRoute: "Getting your location for directions...",
    minutes: "min",
    openGoogleMaps: "Google Maps",
    mapNotReady: "Map is not ready yet.",
    clearRoute: "Clear Route",

    // Location
    btnMyLocation: "Use My Location",
    locating: "Getting your location...",
    locationFound: "📍 Location found! Shops sorted by distance.",
    locationError: "Could not get location. Showing all shops.",
    locationDenied: "Location permission denied. Showing all shops.",
    locationUnsupported: "Location not supported by this browser.",
    youAreHere: "You are here",
    kmAway: "km away",

    // Footer
    footerText: "ကား ပြင်ဆိုင် • Built with ❤️ for Myanmar drivers",

    // Steps indicator
    stepCar: "Car",
    stepProblem: "Problem",
    stepPrice: "Price",
    stepShops: "Shops",
  },

  mm: {
    // App title & header
    appTitle: "ကား ပြင်ဆိုင် ရှာဖွေရေး",
    appSubtitle: "သင့်အနီးနားရှိ ယုံကြည်ရသော ပြင်ဆိုင်များကို ရှာပါ",
    langButton: "English",

    // Step labels
    step1Title: "ကားမော်ဒယ် ရွေးချယ်ပါ",
    step2Title: "ပြဿနာ ဖော်ပြပါ",
    step3Title: "ဈေးနှုန်း ခန့်မှန်းချက်",
    step4Title: "နီးစပ်ရာ ပြင်ဆိုင်များ",

    // Form labels
    selectBrand: "ကားအမှတ်တံဆိပ် ရွေးပါ",
    selectModel: "ကားမော်ဒယ် ရွေးပါ",
    selectProblem: "ပြဿနာ ရွေးပါ",
    selectBrandFirst: "— အမှတ်တံဆိပ် အရင်ရွေးပါ —",
    chooseBrand: "— အမှတ်တံဆိပ် ရွေးချယ်ပါ —",
    chooseModel: "— မော်ဒယ် ရွေးချယ်ပါ —",
    chooseProblem: "— ပြဿနာ ရွေးချယ်ပါ —",

    // Buttons
    btnEstimate: "ဈေးနှုန်း ကြည့်ရှုပါ",
    btnSearch: "ပြင်ဆိုင် ရှာဖွေပါ",
    btnOpenMap: "မြေပုံတွင် ဖွင့်ပါ",

    // Price result
    estimatedCost: "ခန့်မှန်း ပြင်ဆင်ရေးကုန်ကျစရိတ်",
    priceRange: "ဈေးနှုန်း",
    currency: "ကျပ်",

    // Shop list
    noShopsFound: "ပြင်ဆိုင် မတွေ့ပါ။ ထပ်မံ ရှာဖွေပါ။",
    loading: "ဖတ်ရှုနေသည်...",
    searchingShops: "ပြင်ဆိုင်များ ရှာဖွေနေသည်...",
    phone: "ဖုန်းနံပါတ်",
    address: "လိပ်စာ",

    // Map
    mapTitle: "ပြင်ဆိုင် မြေပုံ",
    mapNote: "ဆိုင်အသေးစိတ် ကြည့်ရန် မြေပုံ အမှတ်အသားကို နှိပ်ပါ",

    // Errors & messages
    errorLoadBrands: "ကားအမှတ်တံဆိပ် ဖတ်ရှုမရပါ။ ပြန်လည် ဖွင့်ပါ။",
    errorLoadModels: "ကားမော်ဒယ် ဖတ်ရှုမရပါ။",
    errorLoadProblems: "ပြဿနာများ ဖတ်ရှုမရပါ။",
    errorLoadShops: "ပြင်ဆိုင်များ ဖတ်ရှုမရပါ။",
    selectCarAndProblem: "ကားနှင့် ပြဿနာကို အရင်ရွေးပါ။",
    selectProblemFirst: "ပြဿနာကို အရင်ရွေးပါ။",

    // Directions
    btnDirections: "Get Directions",
    directionsTo: "Directions to",
    calculatingRoute: "Calculating route...",
    routeOnMap: "Follow the route on the map above.",
    routeError: "Could not calculate route. Try Google Maps.",
    gettingLocationForRoute: "Getting your location for directions...",
    minutes: "min",
    openGoogleMaps: "Google Maps",
    mapNotReady: "Map is not ready yet.",
    clearRoute: "Clear Route",

    // Directions
    btnDirections: "လမ်းညွှန် ရယူပါ",
    directionsTo: "လမ်းညွှန် -",
    calculatingRoute: "လမ်းကြောင်း တွက်နေသည်...",
    routeOnMap: "အပေါ်မြေပုံတွင် လမ်းကြောင်းကို လိုက်ပါ။",
    routeError: "လမ်းကြောင်း မတွက်နိုင်ပါ။ Google Maps သုံးပါ။",
    gettingLocationForRoute: "လမ်းညွှန်အတွက် တည်နေရာ ရယူနေသည်...",
    minutes: "မိနစ်",
    openGoogleMaps: "Google Maps",
    mapNotReady: "မြေပုံ မသင့်သေးပါ။",
    clearRoute: "လမ်းကြောင်း ဖယ်ရှားပါ",

    // Location
    btnMyLocation: "ကျွန်ုပ်တည်နေရာ သုံးပါ",
    locating: "တည်နေရာ ရှာဖွေနေသည်...",
    locationFound: "📍 တည်နေရာ တွေ့ပြီ! ဆိုင်များကို အနီးဆုံးအစဉ် စီထားသည်။",
    locationError: "တည်နေရာ မရပါ။ ဆိုင်အားလုံး ပြသသည်။",
    locationDenied: "တည်နေရာ ခွင့်ပြုချက် ငြင်းဆန်သည်။ ဆိုင်အားလုံး ပြသသည်။",
    locationUnsupported: "ဤဘရောက်ဇာတွင် တည်နေရာ မရရှိနိုင်ပါ။",
    youAreHere: "သင်ဤနေရာတွင် ရှိသည်",
    kmAway: "ကီလိုမီတာ အကွာ",

    // Footer
    footerText: "ကား ပြင်ဆိုင် • မြန်မာ ယာဉ်မောင်းများအတွက် ❤️ ဖြင့် တည်ဆောက်သည်",

    // Steps indicator
    stepCar: "ကား",
    stepProblem: "ပြဿနာ",
    stepPrice: "ဈေးနှုန်း",
    stepShops: "ဆိုင်များ",
  }
};
