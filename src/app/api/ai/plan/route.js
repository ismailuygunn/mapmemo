// AI Trip Planner — Enhanced Mega-Prompt API Route
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
      // Phase 1 — Advanced
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
      // Phase 3 — Weather + Events
      weatherData,         // object | null — pre-fetched weather
      eventsData,          // array  | null — pre-fetched events
      // Phase 6 — Flex Dates + Time
      flexDates,           // boolean — suggest alternative dates
      preferredTime,       // 'morning' | 'afternoon' | 'evening' | 'any'
    } = body

    // Support both single city and multi-city
    const cityList = cities?.length > 0 ? cities : (city ? [city] : [])
    if (cityList.length === 0) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
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

    // ── Existing Pins Context ──
    let pinsContext = ''
    if (existingPins?.length > 0) {
      pinsContext = `\n\nCOUPLE'S EXISTING PINS in these cities:\n${existingPins.map(p => `- ${p.title} (${p.type}, ${p.status}${p.rating ? `, ${p.rating}★` : ''}${p.notes ? `: ${p.notes}` : ''})`).join('\n')}\nIncorporate favorites and note which ones they should revisit.`
    }

    // ── Transport Context ──
    const transportText = transportMode
      ? `\nTRANSPORT PREFERENCE: ${transportMode}
- ${transportMode === 'public' ? 'Use metro, bus, tram. Include line numbers, station names, card info.' : ''}
- ${transportMode === 'taxi' ? 'Suggest taxi/Uber. Include estimated costs per ride.' : ''}
- ${transportMode === 'walk' ? 'Prioritize walkable routes. Note walking times between places.' : ''}
- ${transportMode === 'mixed' ? 'Mix of public transit and walking. Suggest taxi only for long distances.' : ''}
Include transport details for every transition between activities.`
      : ''

    // ── Priority Context ──
    const priorityText = priorities?.length > 0
      ? `\nOPTIMIZATION PRIORITY: ${priorities.join(' + ').toUpperCase()}
- ${priorities.includes('cheap') ? 'Prioritize free/cheap options. Suggest free museum days, street food, walking routes.' : ''}
- ${priorities.includes('fast') ? 'Minimize transit time. Pack activities efficiently. No wasted hours.' : ''}
- ${priorities.includes('comfortable') ? 'Include rest time. No early mornings. Suggest comfortable transport.' : ''}`
      : ''

    // ── Budget Context ──
    const budgetText = totalBudget
      ? `\nSTRICT BUDGET LIMIT: ${totalBudget} ${currency || 'TRY'} total for the entire trip.
Do NOT exceed this. Each item must show estimated cost in ${currency || 'TRY'}.
Track running total per day.`
      : ''

    // ── Meal Context ──
    const mealText = (mealStyle?.length > 0 || dietOptions?.length > 0)
      ? `\nMEAL PREFERENCES:
${mealStyle?.length > 0 ? `- Cuisine style: ${mealStyle.join(', ')}` : ''}
${dietOptions?.length > 0 ? `- Dietary requirements: ${dietOptions.join(', ')}` : ''}
- Include breakfast, lunch, and dinner for each day
- Each meal: restaurant name, cuisine type, estimated cost`
      : ''

    // ── Tour Context ──
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

    // ── Date Night Context ──
    const dateNightText = dateNightMode
      ? `\nDATE NIGHT MODE: ON
- Plan with romantic couple activities
- Each evening: romantic dinner → scenic walk → viewpoint → return transport
- Suggest specific seating (terrace, window, rooftop)
- Include surprise elements: local flower shop, card writing spot
- Avoid: crowded tourist traps, noisy areas, chain restaurants`
      : ''

    // ── Multi-City Context ──
    const multiCityText = isMultiCity
      ? `\nMULTI-CITY TRIP:
Cities in order: ${cityList.join(' → ')}
- Plan transport between cities as explicit items (bus, train, flight, car)
- Suggest best transport option per segment (cost + time + comfort)
- Add realistic buffer for inter-city travel (station arrival, boarding, etc.)`
      : ''

    // ── Response Language ──
    const langText = locale === 'tr'
      ? '\nIMPORTANT: Respond entirely in TURKISH. All descriptions, tips, names should be in Turkish.'
      : '\nIMPORTANT: Respond entirely in ENGLISH.'

    // ── Weather Context (Phase 3) ──
    let weatherContext = ''
    if (weatherData?.available && weatherData.forecasts?.length > 0) {
      weatherContext = `\nWEATHER FORECAST (real data):
${weatherData.forecasts.map(f => `- ${f.date}: ${f.weather} (${Math.round(f.tempMin)}°C – ${Math.round(f.tempMax)}°C), Rain: ${Math.round((f.pop || 0) * 100)}%`).join('\n')}
Use this to schedule outdoor activities on clear days and indoor on rainy days.`
    }

    // ── Events Context (Phase 3) ──
    let eventsContext = ''
    if (eventsData?.length > 0) {
      eventsContext = `\nLOCAL EVENTS DURING TRIP:
${eventsData.slice(0, 10).map(e => `- ${e.date || 'TBD'}: ${e.title} (${e.category})${e.venue ? ` at ${e.venue}` : ''}`).join('\n')}
Incorporate relevant events as optional activities.`
    }

    // ── Build Mega-Prompt ──
    const prompt = `You are an expert travel planner for couples. Create a detailed ${days}-day itinerary for: ${destinationText}.

Dates: ${startDate || 'flexible'} to ${endDate || 'flexible'}
Pace/Tempo: ${tempo || 'moderate'}
Budget level: ${budget || 'moderate'}
Interests: ${interests?.join(', ') || 'general sightseeing'}
${pinsContext}${transportText}${priorityText}${budgetText}${mealText}${tourText}${dateNightText}${multiCityText}${weatherContext}${eventsContext}${langText}
${flexDates ? `
FLEXIBLE DATES: The traveler is flexible with dates. Based on transport costs, suggest 2-3 alternative date ranges (within ±5 days) that could be cheaper for flights/transport. Add these to the JSON as "alternativeDates": [{ "dates": "Mar 17-22", "reason": "Flights 30% cheaper", "estimatedSaving": "~500 TRY" }]` : ''}
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
            content: 'You are an expert travel planner specialized in couple trips. Always respond with valid JSON only. When uncertain about details, mark as estimated. Be practical and realistic.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 5000,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('OpenAI error:', errorBody)
      return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    try {
      const itinerary = JSON.parse(content)
      return NextResponse.json(itinerary)
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]))
      }
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
    }
  } catch (err) {
    console.error('Plan API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
