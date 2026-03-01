import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { city, country, locale } = await request.json()
    if (!city && !country) return NextResponse.json({ error: 'City or country required' }, { status: 400 })

    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

    const lang = locale === 'tr' ? 'Turkish' : 'English'
    const destination = city || country
    const month = new Date().toLocaleString('en', { month: 'long' })

    const prompt = `You are a local expert writing a practical travel guidebook for someone visiting ${destination} in ${month}.
Focus on DAILY PRACTICAL things a traveler actually needs — not just emergencies.

Respond in ${lang}. Return ONLY valid JSON with these 8 categories:
{
  "destination": "${destination}",
  "dailyEssentials": {
    "workingHours": "Typical shop hours, e.g. 09:00-21:00",
    "weekendHours": "Saturday/Sunday hours",
    "supermarkets": "Chain names (Migros, BIM, A101 etc), typical hours",
    "pharmacy": "Normal hours, how to find nöbetçi/duty pharmacy at night",
    "publicToilets": "Where to find, paid or free, typical price",
    "electricity": "Outlet type (C/F), voltage 220V",
    "waterSafety": "Tap water drinkable? Bottled water price",
    "laundry": "Self-service laundromats available? Prices",
    "lostPassport": "Step-by-step what to do if passport lost/stolen",
    "tips": ["Practical daily tip 1", "Tip 2", "Tip 3"]
  },
  "transport": {
    "cityCard": "Card name, where to buy, cost, how to reload",
    "metro": "Lines, coverage, hours, price per ride",
    "bus": "System info, night buses, how to pay",
    "tram": "If available, info about tram",
    "taxi": "Apps (BiTaksi, Uber etc), starting fare, per km",
    "ferry": "If coastal city, ferry info",
    "bikeRental": "Bike sharing services, cost",
    "airportTransfer": "How to get from airport to city center, options and prices",
    "carRental": "International companies available, driving tips, license needed",
    "tips": ["Transport hack 1", "Tip 2"]
  },
  "moneyAndShopping": {
    "currency": "Currency name, symbol, current rough exchange rate",
    "atm": "Best ATM banks (low fees), daily limits",
    "cardAcceptance": "Visa/MC acceptance level, contactless",
    "exchange": "Best areas for exchange, avoid airport",
    "tipping": {
      "restaurants": "10-15%",
      "cafes": "Round up",
      "taxis": "Round up",
      "hotels": "5-20 TRY housekeeping",
      "hairdresser": "10%"
    },
    "bargaining": "Where is bargaining appropriate? (Bazaar yes, mall no)",
    "taxRefund": "Tax-free shopping threshold, how to claim",
    "shoppingHours": "Mall hours, bazaar hours, Sunday open?",
    "tips": ["Money tip 1", "Tip 2"]
  },
  "foodAndDrink": {
    "mealTimes": "Typical breakfast/lunch/dinner hours",
    "restaurantEtiquette": "Cover charge (kuver), service charge, bread usually free",
    "streetFoodSafety": "General safety level, what to look for",
    "waterAdvice": "Drink bottled or tap? Ice safe?",
    "alcoholRules": "Legal age, where to buy, sales hours restriction",
    "vegetarianOptions": "How easy to find, useful phrases",
    "localSpecialties": ["Must-try dish 1", "Dish 2", "Dish 3", "Dish 4", "Dish 5"],
    "coffeeCulture": "Turkish coffee etiquette, çay (tea) culture",
    "reservations": "Needed? How to make (Google, phone, walk-in)",
    "tips": ["Food tip 1", "Tip 2"]
  },
  "cultureAndEtiquette": {
    "greetings": "How locals greet (handshake, cheek kiss, etc)",
    "dressCode": "General street dress + mosque/religious site rules",
    "mosqueEtiquette": "Shoes off, head cover for women, quiet, no photos of praying",
    "photographyRules": "Military no-photo, ask people before photos, selfie spots ok",
    "localTaboos": ["Taboo 1 — what NOT to do", "Taboo 2"],
    "giftCulture": "When/what to bring as guest gift",
    "bodyLanguage": "Thumbs up ok? Pointing? Eye contact?",
    "queuing": "Queue culture? Or push-in?",
    "noiseLevels": "Are locals loud or quiet? Music hours?",
    "tips": ["Culture tip 1", "Tip 2"]
  },
  "safety": {
    "emergencyNumbers": [
      { "service": "Police", "number": "155", "emoji": "🚔" },
      { "service": "Ambulance", "number": "112", "emoji": "🚑" },
      { "service": "Fire", "number": "110", "emoji": "🚒" },
      { "service": "Tourist Police", "number": "xxx", "emoji": "👮" }
    ],
    "embassy": {
      "name": "Turkish Embassy/Consulate name",
      "address": "Full address",
      "phone": "+xx xxx",
      "googleMapsUrl": "https://maps.google.com/?q=..."
    },
    "hospitals": [
      { "name": "Hospital", "address": "Addr", "phone": "+xx", "hasER": true, "isPublic": true, "googleMapsUrl": "..." }
    ],
    "safeAreas": [{ "name": "Area", "description": "Why safe", "emoji": "✅" }],
    "cautionAreas": [{ "name": "Area", "description": "What to watch", "emoji": "⚠️" }],
    "scamWarnings": [{ "type": "Scam type", "description": "How it works, how to avoid", "emoji": "🚨" }],
    "nightSafety": {
      "generalLevel": "safe|moderate|caution",
      "safeNeighborhoods": ["Area1", "Area2"],
      "tips": ["Night tip 1"],
      "lateNightTransport": "How to get home late"
    }
  },
  "health": {
    "pharmacyHours": "Normal hours, how to find 24h/duty pharmacy",
    "dutyPharmacy": "How to find nöbetçi eczane (app, website, pharmacy door sign)",
    "waterSafety": "Tap water safe?",
    "commonMeds": "Parol (paracetamol), ibuprofen — available OTC?",
    "insurance": "Travel insurance recommended? ER visit cost?",
    "vaccines": "Any recommended vaccines",
    "sunProtection": "UV index, sunscreen availability",
    "seasonalHealth": [{ "season": "Summer", "warning": "Heat stroke risk", "emoji": "☀️" }],
    "emergencyPhrases": [
      { "phrase": "I need help", "local": "Yardım!", "pronunciation": "yar-duhm" },
      { "phrase": "Call ambulance", "local": "Ambulans çağırın", "pronunciation": "am-bu-lans cha-uh-ruhn" },
      { "phrase": "I need a doctor", "local": "Doktora ihtiyacım var", "pronunciation": "dok-to-ra eeh-tee-ya-juhm var" },
      { "phrase": "Where is pharmacy?", "local": "Eczane nerede?", "pronunciation": "ej-za-ne ne-re-de" },
      { "phrase": "I'm allergic to...", "local": "...alerjim var", "pronunciation": "a-ler-zheem var" }
    ],
    "tips": ["Health tip 1"]
  },
  "digital": {
    "simCard": {
      "providers": ["Turkcell", "Vodafone", "Türk Telekom"],
      "touristPackage": "Price, data included, where to buy",
      "registration": "Passport needed? Registration deadline?"
    },
    "wifi": "Free WiFi availability (cafes, metro, etc)",
    "usefulApps": [
      { "name": "App name", "description": "What it's for", "emoji": "📱" }
    ],
    "vpn": "VPN needed for any blocked services?",
    "chargingSpots": "Powerbank rental, public chargers available?",
    "emergencyApps": "112 app, Google Translate offline packs",
    "socialMedia": "Popular local social media / messaging apps",
    "tips": ["Digital tip 1"]
  }
}

CRITICAL RULES:
- ALL information must be REAL and ACCURATE for ${destination}
- Use REAL phone numbers, addresses, app names, prices
- Prices in local currency, realistic for 2025
- Include cultural nuances specific to ${destination}
- Be practical, not generic — a traveler should be able to use this info TODAY
- Emergency numbers MUST be correct for the country
- Hospital names and addresses should be real
Respond ONLY with valid JSON.`

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are a comprehensive travel guide expert. Provide accurate, practical daily travel information. Always respond with valid JSON. Use real data: real phone numbers, real addresses, real app names, real prices.' }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 16384, responseMimeType: 'application/json' },
      }),
    })

    if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`)

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) throw new Error('Empty response')

    return NextResponse.json(JSON.parse(content))
  } catch (err) {
    console.error('Guidebook API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
