// UMAE — AI Day Trip Suggestions (Weekend Getaways)
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { city, locale = 'tr', season = '' } = await request.json()
        if (!city) return NextResponse.json({ error: 'City required' }, { status: 400 })

        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

        const lang = locale === 'tr' ? 'Turkish' : 'English'
        const month = new Date().toLocaleString('en', { month: 'long' })

        const prompt = `You are a local travel expert who knows every hidden gem near ${city}.
Give REALISTIC, GENUINE weekend day-trip routes from ${city}. Current month: ${month}.

IMPORTANT RULES:
- Only suggest trips reachable within 1-4 hours by car/bus/ferry
- Use REAL place names, REAL bus companies, REAL ferry lines
- All prices in TRY, realistic for 2025
- Focus on OUTDOOR, NATURE, ADVENTURE, LOCAL CULTURE experiences
- DO NOT suggest generic tourist traps
- DO NOT suggest hamam/spa/wellness/hotel experiences
- DO NOT suggest hotel restaurants or resort-type activities
- Suggest places locals actually go on weekends
- Include hidden gems that only locals know
- Each trip should have a "vibe": romantic, adventurous, family, solo, friends

RESPOND IN ${lang}. Return ONLY valid JSON:
{
  "city": "${city}",
  "season": "${month}",
  "dayTrips": [
    {
      "id": 1,
      "title": "Trip name - catchy and fun",
      "destination": "Main destination name",
      "emoji": "🏔️",
      "vibe": "adventure|romantic|family|friends|solo|chill",
      "vibeEmoji": "🧗",
      "distance": "120 km",
      "duration": "1.5 saat",
      "difficulty": "easy|moderate|hard",
      "bestTime": "Sabah erken / İlkbahar",
      "description": "2-3 sentences about why this trip is amazing",
      "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
      "transport": {
        "car": "1.5 saat, D-010 karayolu",
        "bus": "Metro Turizm, 2 saat, ~150 TRY",
        "ferry": null
      },
      "estimatedBudget": {
        "transport": "100-150 TRY",
        "food": "80-120 TRY",
        "activities": "50-100 TRY",
        "total": "230-370 TRY"
      },
      "schedule": [
        { "time": "08:00", "activity": "Yola çık", "emoji": "🚗" },
        { "time": "09:30", "activity": "Varış, kahvaltı", "emoji": "🥐" },
        { "time": "10:30", "activity": "Yürüyüş başla", "emoji": "🥾" },
        { "time": "13:00", "activity": "Lokal restoranda öğle yemeği", "emoji": "🍖" },
        { "time": "14:30", "activity": "Göl/şelale keşfi", "emoji": "💧" },
        { "time": "17:00", "activity": "Dönüş", "emoji": "🌅" }
      ],
      "tips": ["Bring water shoes", "Cash only in village"],
      "photoSpot": "En iyi fotoğraf noktası açıklaması"
    }
  ],
  "seasonalNote": "Bu mevsimde özellikle X bölgesi mükemmel çünkü..."
}

Generate exactly 8 diverse day trips. Mix vibes: 2 romantic, 2 adventure, 2 chill, 1 family, 1 friends.
Include: nature hikes, coastal villages, ancient ruins, mountain lakes, waterfalls, scenic drives, wine/olive routes, island hopping if coastal city.
Respond ONLY with valid JSON.`

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{
                        text: locale === 'tr'
                            ? 'Sen yerel bir gezi uzmanısın. Gerçek yerler, gerçek fiyatlar ve gerçek ulaşım bilgileri ver. Turistik tuzaklardan kaçın, yerel gizli noktaları öner.'
                            : 'You are a local travel expert. Suggest real places with real prices and transport. Avoid tourist traps, suggest hidden local gems.'
                    }]
                },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.6, maxOutputTokens: 16384, responseMimeType: 'application/json' },
            }),
        })

        if (!response.ok) {
            // Fallback to gemini-2.0-flash
            const fallbackRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.6, maxOutputTokens: 16384, responseMimeType: 'application/json' },
                    }),
                }
            )
            if (!fallbackRes.ok) return NextResponse.json({ error: 'AI service error' }, { status: 500 })
            const fallbackData = await fallbackRes.json()
            const content = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text
            if (content) return NextResponse.json(JSON.parse(content))
            return NextResponse.json({ error: 'No response' }, { status: 500 })
        }

        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!content) return NextResponse.json({ error: 'Empty response' }, { status: 500 })

        return NextResponse.json(JSON.parse(content))
    } catch (err) {
        console.error('DayTrip API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
