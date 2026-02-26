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
${pinsContext}${transportText}${priorityText}${budgetText}${mealText}${tourText}${dateNightText}${multiCityText}${weatherContext}${eventsContext}${langText}
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
  "overview": "2-3 sentence trip summary",
  "days": [
    {
      "dayNumber": 1,
      "date": "${startDate || 'Day 1'}",
      "theme": "Day theme",
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
          "transportNote": "How to get here from previous stop"
        }
      ]
    }
  ],
  "budgetEstimate": {
    "accommodation": "${currency || 'TRY'} XXX",
    "food": "${currency || 'TRY'} XXX",
    "activities": "${currency || 'TRY'} XXX",
    "transport": "${currency || 'TRY'} XXX",
    "total": "${currency || 'TRY'} XXX"
  },
  "tips": ["tip 1", "tip 2"],
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
    "scamWarnings": ["Scam type: how to avoid"]
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
  const model = 'gemini-2.5-flash-preview-05-20'
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const systemInstruction = locale === 'tr'
    ? 'Sen uzman bir seyahat planlayıcısınsın. Her zaman geçerli JSON ile yanıt ver. Yalnızca gerçek, var olan mekanları, restoranları ve turistik yerleri öner. Emin olmadığın bir şey varsa, tahmini olarak işaretle. Pratik ve gerçekçi ol. Konumun coğrafyasına sadık kal.'
    : 'You are an expert travel planner. Always respond with valid JSON only. Only suggest real, existing places, restaurants, and attractions. When uncertain, mark as estimated. Be practical and realistic. Stay faithful to the location geography.'

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
    throw new Error(`Gemini error: ${errText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) throw new Error('Empty Gemini response')

  return JSON.parse(content)
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
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner. Always respond with valid JSON only. Only suggest REAL places, restaurants, and attractions that actually exist. When uncertain about a specific name, describe the type of place instead. Be practical and geographically accurate.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 5000,
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
