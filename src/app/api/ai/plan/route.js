// AI Trip Planner — Enhanced with Gemini for consistency + location accuracy
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      // Basic
      cities,              // string[] — multi-city support
      city,                // string — legacy single-city fallback
      startDate, endDate,
      tempo, budget,
      interests,
      existingPins,
      // Advanced
      transportMode,       // 'public' | 'taxi' | 'walk' | 'mixed'
      priorities,          // string[] — ['cheap', 'fast', 'comfortable']
      totalBudget,         // number | null
      currency,            // 'TRY' | 'EUR' | 'USD' | 'GBP'
      mealStyle,           // string[] — ['local', 'streetFood']
      dietOptions,         // string[] — ['halal', 'vegan']
      tourGroupType,       // 'group' | 'private'
      walkingLevel,        // 'light' | 'medium' | 'hard'
      photoStops,          // 'few' | 'normal' | 'many'
      shoppingStop,        // 'no' | 'optional' | 'yes'
      accessibility,       // string[] — ['childFriendly', 'pregnantFriendly']
      guideLanguage,       // 'tr' | 'en' | 'other'
      dateNightMode,       // boolean
      locale,              // 'tr' | 'en' — response language
      wishlist,            // string[] — ['romantic', 'adventure', 'culture', etc.]
      weatherData,         // object | null
      eventsData,          // array  | null
      flexDates,           // boolean
      preferredTime,       // 'morning' | 'afternoon' | 'evening' | 'any'
    } = body

    // Support both single city and multi-city
    const cityList = cities?.length > 0 ? cities : (city ? [city] : [])
    if (cityList.length === 0) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }

    // Try Gemini first, fall back to OpenAI
    const geminiKey = process.env.GEMINI_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!geminiKey && !openaiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    // Calculate days
    const days = startDate && endDate
      ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
      : 3

    const isMultiCity = cityList.length > 1
    const destinationText = isMultiCity
      ? `Multi-city trip: ${cityList.join(' → ')}`
      : cityList[0]

    // ── Build Context Sections ──
    let pinsContext = ''
    if (existingPins?.length > 0) {
      pinsContext = `\n\nUSER'S EXISTING PINS in these cities:\n${existingPins.map(p => `- ${p.title} (${p.type}, ${p.status}${p.rating ? `, ${p.rating}★` : ''}${p.notes ? `: ${p.notes}` : ''})`).join('\n')}\nIncorporate favorites and note which ones they should revisit.`
    }

    const transportText = transportMode
      ? `\nTRANSPORT PREFERENCE: ${transportMode}
- ${transportMode === 'public' ? 'Use metro, bus, tram. Include line numbers, station names, card info.' : ''}
- ${transportMode === 'taxi' ? 'Suggest taxi/Uber. Include estimated costs per ride.' : ''}
- ${transportMode === 'walk' ? 'Prioritize walkable routes. Note walking times between places.' : ''}
- ${transportMode === 'mixed' ? 'Mix of public transit and walking. Suggest taxi only for long distances.' : ''}
Include transport details for every transition between activities.`
      : ''

    const priorityText = priorities?.length > 0
      ? `\nOPTIMIZATION PRIORITY: ${priorities.join(' + ').toUpperCase()}
- ${priorities.includes('cheap') ? 'Prioritize free/cheap options. Suggest free museum days, street food, walking routes.' : ''}
- ${priorities.includes('fast') ? 'Minimize transit time. Pack activities efficiently. No wasted hours.' : ''}
- ${priorities.includes('comfortable') ? 'Include rest time. No early mornings. Suggest comfortable transport.' : ''}`
      : ''

    const budgetText = totalBudget
      ? `\nSTRICT BUDGET LIMIT: ${totalBudget} ${currency || 'TRY'} total for the entire trip.
Do NOT exceed this. Each item must show estimated cost in ${currency || 'TRY'}.
Track running total per day.`
      : ''

    const mealText = (mealStyle?.length > 0 || dietOptions?.length > 0)
      ? `\nMEAL PREFERENCES:
${mealStyle?.length > 0 ? `- Cuisine style: ${mealStyle.join(', ')}` : ''}
${dietOptions?.length > 0 ? `- Dietary requirements: ${dietOptions.join(', ')}` : ''}
- Include breakfast, lunch, and dinner for each day
- Each meal: restaurant name, cuisine type, estimated cost`
      : ''

    const tourText = (tourGroupType || walkingLevel || shoppingStop)
      ? `\nTOUR PREFERENCES:
${tourGroupType ? `- Tour type: ${tourGroupType} tours preferred` : ''}
${walkingLevel ? `- Walking level: ${walkingLevel}` : ''}
${photoStops ? `- Photo stops: ${photoStops === 'few' ? 'minimal' : photoStops === 'many' ? 'lots, 5+' : 'normal 3-5'}` : ''}
${shoppingStop ? `- Shopping stops: ${shoppingStop === 'no' ? 'NO SHOPPING STOPS (very important!)' : shoppingStop === 'yes' ? 'include shopping' : 'optional only'}` : ''}
${guideLanguage ? `- Guide language: ${guideLanguage}` : ''}
${accessibility?.length > 0 ? `- Accessibility: ${accessibility.join(', ')}` : ''}
${wishlist?.length > 0 ? `- Trip style / wishlist: ${wishlist.join(', ')} — STRONGLY tailor the plan to these themes` : ''}
When suggesting tours, respect ALL these preferences strictly.`
      : ''

    const dateNightText = dateNightMode
      ? `\nDATE NIGHT MODE: ON
- Plan with romantic couple activities
- Each evening: romantic dinner → scenic walk → viewpoint → return transport
- Suggest specific seating (terrace, window, rooftop)
- Include surprise elements: local flower shop, card writing spot
- Avoid: crowded tourist traps, noisy areas, chain restaurants`
      : ''

    const multiCityText = isMultiCity
      ? `\nMULTI-CITY TRIP:
Cities in order: ${cityList.join(' → ')}
- Plan transport between cities as explicit items (bus, train, flight, car)
- Suggest best transport option per segment (cost + time + comfort)
- Add realistic buffer for inter-city travel (station arrival, boarding, etc.)`
      : ''

    const langText = locale === 'tr'
      ? '\nIMPORTANT: Respond entirely in TURKISH. All descriptions, tips, names should be in Turkish.'
      : '\nIMPORTANT: Respond entirely in ENGLISH.'

    let weatherContext = ''
    if (weatherData?.available && weatherData.forecasts?.length > 0) {
      weatherContext = `\nWEATHER FORECAST (real data):\n${weatherData.forecasts.map(f => `- ${f.date}: ${f.weather} (${Math.round(f.tempMin)}°C – ${Math.round(f.tempMax)}°C), Rain: ${Math.round((f.pop || 0) * 100)}%`).join('\n')}\nUse this to schedule outdoor activities on clear days and indoor on rainy days.`
    }

    let eventsContext = ''
    if (eventsData?.length > 0) {
      eventsContext = `\nLOCAL EVENTS DURING TRIP:\n${eventsData.slice(0, 10).map(e => `- ${e.date || 'TBD'}: ${e.title} (${e.category})${e.venue ? ` at ${e.venue}` : ''}`).join('\n')}\nIncorporate relevant events as optional activities.`
    }

    // ── Fetch REAL Google Places data ──
    let placesContext = ''
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
    if (googleApiKey) {
      try {
        const mainCity = cityList[0]
        const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place'

        // Geocode the city
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(mainCity)}&key=${googleApiKey}`)
        const geoData = await geoRes.json()
        const coords = geoData.results?.[0]?.geometry?.location

        if (coords) {
          // Fetch restaurants, attractions, cafes in parallel
          const fetchPlaces = async (type, keyword = '') => {
            const params = new URLSearchParams({
              location: `${coords.lat},${coords.lng}`,
              radius: '8000',
              type,
              key: googleApiKey,
              language: locale === 'tr' ? 'tr' : 'en',
            })
            if (keyword) params.append('keyword', keyword)
            const res = await fetch(`${PLACES_BASE}/nearbysearch/json?${params}`)
            const data = await res.json()
            return (data.results || [])
              .filter(p => p.rating && p.user_ratings_total)
              .sort((a, b) => (b.rating * Math.log10(b.user_ratings_total + 1)) - (a.rating * Math.log10(a.user_ratings_total + 1)))
          }

          const fetchTextPlaces = async (query) => {
            const params = new URLSearchParams({ query: `${query} ${mainCity}`, key: googleApiKey, language: locale === 'tr' ? 'tr' : 'en' })
            const res = await fetch(`${PLACES_BASE}/textsearch/json?${params}`)
            const data = await res.json()
            return (data.results || []).filter(p => p.rating).sort((a, b) => (b.rating || 0) - (a.rating || 0))
          }

          const [restaurants, attractions, cafes, localFood, nightlife] = await Promise.all([
            fetchPlaces('restaurant'),
            fetchPlaces('tourist_attraction'),
            fetchPlaces('cafe'),
            fetchTextPlaces('yerel yemek local food traditional'),
            fetchPlaces('bar', 'nightlife rooftop'),
          ])

          const formatForPrompt = (places, count = 10) => places.slice(0, count).map(p => {
            const price = p.price_level != null ? ' | Fiyat: ' + '₺'.repeat(p.price_level || 1) : ''
            return `  • ${p.name} — ⭐${p.rating} (${p.user_ratings_total} yorum)${price} | ${p.vicinity || p.formatted_address || ''}`
          }).join('\n')

          placesContext = `

═══ GOOGLE PLACES REAL DATA (USE THESE!) ═══
The following are REAL places from Google Maps with real ratings. You MUST prioritize these in your plan.

🍽️ TOP RESTAURANTS:
${formatForPrompt(restaurants, 12)}

🏛️ TOP ATTRACTIONS:
${formatForPrompt(attractions, 12)}

☕ TOP CAFES:
${formatForPrompt(cafes, 8)}

🍖 LOCAL FOOD & TRADITIONAL:
${formatForPrompt(localFood, 8)}

🌙 NIGHTLIFE & BARS:
${formatForPrompt(nightlife, 6)}

📌 HIDDEN GEMS (high rating, fewer reviews — include 2-3 of these):
${formatForPrompt(restaurants.filter(p => p.rating >= 4.4 && p.user_ratings_total < 300 && p.user_ratings_total >= 15), 5)}
${formatForPrompt(cafes.filter(p => p.rating >= 4.4 && p.user_ratings_total < 200 && p.user_ratings_total >= 10), 3)}

IMPORTANT: Use the EXACT restaurant/cafe names from above. Include ratings when mentioning them.
For each meal in the plan, pick from the real restaurants listed above.
For attractions, use the real ones listed above.
Include 2-3 hidden gems as "niş öneri" (niche suggestion) markers.`
        }
      } catch (placesErr) {
        console.warn('Google Places fetch failed, continuing without:', placesErr.message)
      }
    }

    // ── Build Mega-Prompt ──
    const prompt = `You are an expert travel planner. Create a detailed ${days}-day itinerary for: ${destinationText}.

Dates: ${startDate || 'flexible'} to ${endDate || 'flexible'}
Pace/Tempo: ${tempo || 'moderate'}
Budget level: ${budget || 'moderate'}
Interests: ${interests?.join(', ') || 'general sightseeing'}

═══ CRITICAL: GEOGRAPHIC & FACTUAL ACCURACY ═══
You MUST be 100% accurate about ${destinationText}. Follow these rules STRICTLY:

1. ONLY suggest places, restaurants, cafes, shops, and attractions that ACTUALLY EXIST in ${destinationText}.
   - Do NOT invent or hallucinate restaurant names, cafe names, or shop names.
   - If you are not 100% certain a specific restaurant/place exists, describe the TYPE of place instead
     (e.g. "A traditional kebab restaurant in Ulus district" instead of inventing a name).
   
2. GEOGRAPHIC TRUTH:
   - Only mention geographic features that ACTUALLY exist in the city.
   - If the city is landlocked (e.g. Ankara, Madrid), do NOT suggest beach/harbor/coastal activities.
   - If the city has no mountains nearby, do NOT suggest mountain activities.
   - Respect the actual climate, terrain, and topography.

3. LOCAL FOOD ACCURACY:
   - Suggest REAL local dishes and cuisine specific to that region.
   - For Turkish cities: know the regional specialties (e.g. Ankara = Ankara Tava, Çubuk turşusu; İstanbul = balık ekmek, lahmacun; Gaziantep = baklava, kebap).
   - Do NOT suggest dishes from other regions as local (e.g. do NOT suggest "fresh seafood" in Ankara).
   - Recommend actual popular local food streets, bazaars, or well-known food areas.

4. REAL LANDMARKS:
   - Only suggest landmarks, museums, and attractions that ACTUALLY exist.
   - Include accurate opening hours, ticket prices, and addresses where possible.
   - Popular places like Google Maps top-rated restaurants and attractions should be prioritized.

5. TRANSPORT ACCURACY:
   - Only mention transport systems that ACTUALLY exist (e.g. Ankara has metro/bus, no tram; Istanbul has metro/tram/ferry/metrobüs).
   - Use real line numbers, station names, and fare information.
${pinsContext}${transportText}${priorityText}${budgetText}${mealText}${tourText}${dateNightText}${multiCityText}${weatherContext}${eventsContext}${placesContext}${langText}
${flexDates ? `
FLEXIBLE DATES: Suggest 2-3 alternative date ranges (within ±5 days) that could be cheaper. Add to JSON as "alternativeDates": [{ "dates": "Mar 17-22", "reason": "Flights 30% cheaper", "estimatedSaving": "~500 TRY" }]` : ''}
${preferredTime && preferredTime !== 'any' ? `
TIME PREFERENCE: Schedule activities primarily in the ${preferredTime}. ${preferredTime === 'morning' ? 'Start at 07:00-08:00, wrap up by 15:00.' : preferredTime === 'afternoon' ? 'Start at 11:00, activities until 19:00.' : 'Start at 14:00, focus on evening activities until 23:00.'}` : ''}

TIME BUFFER RULES (mandatory):
- Before flights: 2.5 hours buffer for airport
- Hotel check-in: after 14:00, check-out before 11:00
- Between activities: minimum 30 min travel + buffer
- Museum/attractions: 15 min ticket queue buffer
- Last evening: nothing after 22:00 if early morning next day

Respond ONLY in this EXACT JSON format:
{
  "overview": "3-4 sentence trip summary with highlights and what makes this trip special",
  "suggestions": [
    {
      "id": "unique-id",
      "name": "Place/Restaurant/Attraction Name",
      "type": "sightseeing|food|activity|transport|rest|shopping|nightlife",
      "category": "Müze|Restoran|Kafe|Park|Tarihi Yer|Aktivite|...",
      "aiSummary": "3-4 sentences written as if by a local friend. Include WHY this place is special, best time to go, what to order/see, and a personal insider tip.",
      "estimatedDuration": "1-2 saat",
      "estimatedCost": "${currency || 'TRY'} XX",
      "priceRange": "free|budget|moderate|expensive",
      "rating": 4.5,
      "reviewCount": 1200,
      "googleMapsUrl": "https://maps.google.com/?q=Place+Name+City",
      "address": "Approximate address",
      "openHours": "09:00-18:00",
      "isHiddenGem": false,
      "bestTimeToVisit": "morning|afternoon|evening|any",
      "suggestedDay": 1,
      "tags": ["romantic", "family-friendly", "instagram", "budget", "free-entry", "sunset-spot"]
    }
  ],
  "days": [
    {
      "dayNumber": 1,
      "date": "${startDate || 'Day 1'}",
      "theme": "Day theme",
      "dailyBudget": "${currency || 'TRY'} XXX (breakdown: transport X, food X, activities X)",
      "dressCode": {
        "morning": "Outfit suggestion for morning activities",
        "evening": "Outfit suggestion for evening",
        "tip": "Special notes (mosque visit = cover shoulders, etc.)"
      },
      "items": [
        {
          "timeStart": "09:00",
          "timeEnd": "10:30",
          "title": "Place/Activity",
          "description": "What to do, tips, why worth it",
          "type": "sightseeing|food|activity|transport|rest",
          "estimatedCost": "${currency || 'TRY'} XX",
          "isEstimated": true,
          "transportNote": "Detailed: how to get here (metro line X → station Y, then walk 5 min). Or: take bus 42A from Z stop. Include fare cost.",
          "rating": 4.5,
          "reviewCount": 1200,
          "googleMapsUrl": "https://maps.google.com/?q=Place+Name+City",
          "isHiddenGem": false,
          "proTip": "An insider tip for this specific stop"
        }
      ]
    }
  ],
  "budgetEstimate": {
    "accommodation": "${currency || 'TRY'} XXX",
    "food": "${currency || 'TRY'} XXX",
    "activities": "${currency || 'TRY'} XXX",
    "transport": "${currency || 'TRY'} XXX",
    "total": "${currency || 'TRY'} XXX",
    "perPersonPerDay": "${currency || 'TRY'} XXX"
  },
  "tips": [
    "Tip 1: specific, actionable travel tip",
    "Tip 2: money-saving hack for this city",
    "Tip 3: safety/comfort tip",
    "Tip 4: cultural etiquette",
    "Tip 5: best photo spots and times",
    "Tip 6: local customs to know",
    "Tip 7: wifi/internet advice",
    "Tip 8: shopping bargaining tips"
  ],
  "transportGuide": {
    "overview": "City transport system overview (metro, bus, tram, ferry etc.)",
    "transportCard": "Which transport card to buy, where to get it, cost, how to top up",
    "fromAirport": "How to get from airport to city center (options with prices)",
    "metroLines": ["Line name: key stations"],
    "apps": ["App name — what it does, why useful"],
    "taxiTips": "Taxi app recommendations, average costs, scam warnings",
    "walkingTips": "Best walking routes, pedestrian areas"
  },
  "cheapEats": [
    {
      "name": "Restaurant/Street Food Name",
      "type": "street-food|local-restaurant|bakery|market",
      "dish": "Famous dish to try",
      "cost": "${currency || 'TRY'} XX",
      "area": "Neighborhood/street name",
      "tip": "Why it's good, when to go"
    }
  ],
  "travelHacks": [
    "Hack 1: A specific money-saving trick for this city",
    "Hack 2: A time-saving shortcut",
    "Hack 3: A comfort hack",
    "Hack 4: A local secret",
    "Hack 5: A free activity most tourists miss"
  ],
  "rainPlan": {
    "overview": "What to do if weather is bad",
    "alternatives": [
      { "instead_of": "Outdoor thing", "do_this": "Indoor thing", "description": "Why this works" }
    ]
  },
  "survivalPack": {
    "transportApps": ["App name (what it does)"],
    "safeAreas": ["Area name — why safe"],
    "cautionAreas": ["Area — what to watch for"],
    "tipping": "Tipping culture summary",
    "closingHours": "General closing hours, Sunday status",
    "scamWarnings": ["Scam type: how to avoid"],
    "emergencyNumbers": "Police, ambulance, tourist police",
    "pharmacyInfo": "24-hour pharmacy areas, common medicine brands"
  },
  "alternatives": [
    {
      "name": "Budget Mix",
      "description": "What changes",
      "totalCost": "${currency || 'TRY'} XXX",
      "savings": "${currency || 'TRY'} XXX saved",
      "tradeoff": "What you trade off"
    }
  ],
  "nextTimeSuggestions": [
    { "title": "Place name", "reason": "Why visit next time" }
  ]
}

IMPORTANT for suggestions array:
- Include 20-30 unique suggestions covering: top attractions, restaurants, cafes, hidden gems, activities, nightlife, street food spots
- Each suggestion MUST have a unique, compelling aiSummary (3-4 sentences, written as a knowledgeable local friend)
- Include suggestedDay so users know which day each place fits best
- Tag each place appropriately (romantic, family-friendly, instagram, budget, free-entry, sunset-spot, etc.)
- Include at least 5 budget-friendly/free options
- Include at least 3 hidden gems with isHiddenGem: true
- tips array MUST have 8-12 specific, actionable tips (not generic travel advice)
- cheapEats MUST have 5-8 affordable dining options with specific dishes and costs
- travelHacks MUST have 5 city-specific hacks
- transportGuide MUST include real transport card name, metro lines, and airport transfer details
- Each day item MUST include a detailed transportNote explaining how to get there

Respond ONLY with valid JSON, no markdown, no comments.`

    // ── Try Gemini first (consistent with cover gen) ──
    if (geminiKey) {
      try {
        const geminiResult = await callGemini(geminiKey, prompt, locale)
        if (geminiResult) return NextResponse.json(geminiResult)
      } catch (geminiErr) {
        console.error('Gemini plan error, falling back to OpenAI:', geminiErr.message)
      }
    }

    // ── Fallback to OpenAI ──
    if (openaiKey) {
      const result = await callOpenAI(openaiKey, prompt)
      if (result) return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 500 })

  } catch (err) {
    console.error('Plan API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── Gemini API Call ──
async function callGemini(apiKey, prompt, locale) {
  // Try multiple models in case some aren't available for this API key
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash']

  const systemInstruction = locale === 'tr'
    ? 'Sen uzman bir seyahat planlayıcısınsın. Her zaman geçerli JSON ile yanıt ver. Yalnızca gerçek, var olan mekanları, restoranları ve turistik yerleri öner. Emin olmadığın bir şey varsa, tahmini olarak işaretle. Pratik ve gerçekçi ol. Konumun coğrafyasına sadık kal.'
    : 'You are an expert travel planner. Always respond with valid JSON only. Only suggest real, existing places, restaurants, and attractions. When uncertain, mark as estimated. Be practical and realistic. Stay faithful to the location geography.'

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 16384,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error(`Gemini ${model} error:`, response.status, errText.substring(0, 200))
        continue // Try next model
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        console.error(`Gemini ${model}: empty response`)
        continue
      }

      console.log(`Gemini ${model}: success`)
      return JSON.parse(content)
    } catch (err) {
      console.error(`Gemini ${model} exception:`, err.message)
      continue
    }
  }

  throw new Error('All Gemini models failed')
}

// ── OpenAI Fallback ──
async function callOpenAI(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner. Always respond with valid JSON only. Only suggest REAL places, restaurants, and attractions that actually exist. When uncertain about a specific name, describe the type of place instead. Be practical and geographically accurate.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('OpenAI error:', errorBody)
    throw new Error('OpenAI error')
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  try {
    return JSON.parse(content)
  } catch {
    const jsonMatch = content?.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error('Invalid JSON from OpenAI')
  }
}
