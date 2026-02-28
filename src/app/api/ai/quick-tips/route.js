// UMAE — Quick AI Budget Travel Suggestions (No Plan Needed)
// City-based cheap tips: budget food, free activities, transport hacks
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { city, locale = 'tr', weatherContext = '' } = await request.json()

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }

    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
    }

    const lang = locale === 'tr' ? 'Turkish' : 'English'

    // Weather context for season-appropriate suggestions
    const weatherSection = weatherContext
      ? `\nWEATHER CONTEXT (CRITICAL — adapt ALL suggestions to this):\n${weatherContext}\n- If cold (<10°C): suggest warm clothing, indoor activities, hot food/drinks\n- If hot (>30°C): suggest light clothing, water activities, cold foods\n- If rainy: suggest indoor alternatives, umbrellas, waterproof gear\n- If snowy: suggest winter gear, snow activities\n- NEVER suggest summer clothes in cold weather or winter clothes in hot weather\n`
      : ''

    const prompt = `You are an expert budget travel advisor. Give quick, actionable budget tips for ${city}.
${weatherSection}
RESPOND IN ${lang}.

Return JSON with this EXACT structure:
{
  "city": "${city}",
  "quickTips": [
    {
      "emoji": "🚌",
      "title": "Tip title",
      "description": "2-3 sentence tip with specific pricing and names",
      "category": "transport|food|activity|accommodation|hack",
      "savingsEstimate": "~XX TRY per day"
    }
  ],
  "budgetTransport": {
    "cheapestFromIstanbul": "Bus ~XXX TRY (Xh), Train ~XXX TRY (Xh)",
    "localTransport": "Metro card XX TRY, single ride X TRY",
    "tips": ["Specific transport tip 1", "Tip 2"]
  },
  "freeActivities": [
    { "name": "Activity name", "description": "Brief description", "bestTime": "morning|afternoon|evening" }
  ],
  "cheapEats": [
    { "name": "Restaurant or food type", "dish": "Signature dish", "price": "~XX TRY", "area": "Neighborhood" }
  ],
  "budgetAccommodation": {
    "hostelRange": "XX-XX TRY/night",
    "budgetHotelRange": "XX-XX TRY/night",
    "tip": "Best area for budget stays"
  },
  "dailyBudget": {
    "ultraBudget": "XXX TRY/day (summary)",
    "comfortable": "XXX TRY/day (summary)",
    "breakdown": "Transport XX + Food XX + Activities XX"
  },
  "slogan": "A catchy one-line travel slogan about ${city}"
}

RULES:
- Include 8-12 quickTips covering ALL categories
- All prices must be in TRY (Turkish Lira) and realistic for 2025
- Use REAL place names, bus companies (Metro Turizm, Pamukkale, etc.), train lines
- Include specific neighborhoods and street names
- budgetTransport should include intercity options FROM Istanbul
- freeActivities should have at least 5 entries
- cheapEats should have at least 5 entries with real dishes
- Be practical and actionable, not generic
- ALL suggestions MUST be consistent with the current weather/season

Respond ONLY with valid JSON, no markdown.`

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: locale === 'tr'
              ? 'Sen uzman bir bütçe seyahat danışmanısın. Gerçek fiyatlar ve gerçek mekanlarla pratik öneriler ver.'
              : 'You are an expert budget travel advisor. Give practical tips with real prices and real places.'
          }]
        },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Quick tips Gemini error:', response.status, errText.substring(0, 200))
      // Fallback to gemini-2.0-flash
      const fallbackRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 8192, responseMimeType: 'application/json' },
          }),
        }
      )
      if (!fallbackRes.ok) {
        return NextResponse.json({ error: 'AI service error' }, { status: 500 })
      }
      const fallbackData = await fallbackRes.json()
      const content = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text
      if (content) return NextResponse.json(JSON.parse(content))
      return NextResponse.json({ error: 'No response' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })
    }

    return NextResponse.json(JSON.parse(content))
  } catch (err) {
    console.error('Quick tips API error:', err)
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 })
  }
}
