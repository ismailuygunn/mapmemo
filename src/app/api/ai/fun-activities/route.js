// UMAE — AI Fun Activities & Local Experiences
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { city, locale = 'tr' } = await request.json()
        if (!city) return NextResponse.json({ error: 'City required' }, { status: 400 })

        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

        const lang = locale === 'tr' ? 'Turkish' : 'English'
        const month = new Date().toLocaleString('en', { month: 'long' })

        const prompt = `You are a fun-loving local who knows every cool, quirky, exciting thing to do in ${city}.
Current month: ${month}.

IMPORTANT RULES:
- Suggest REAL, FUN, GENUINE activities and experiences
- Focus on things that LOCALS actually enjoy doing
- DO NOT suggest hamam, spa, wellness, or hotel-based experiences
- DO NOT suggest hotel restaurants, resort buffets, or generic dining
- DO NOT suggest generic museum visits (unless it's truly unique/quirky)
- Instead suggest: street art tours, rooftop sunset spots, hidden cafes, book cafes, vintage markets, food streets, live music venues, outdoor cinema, kayaking, cycling routes, hilltop viewpoints, fishing spots, local craft workshops (pottery, ebru etc.), escape rooms, board game cafes, retro arcades, stand-up comedy, open mic nights, jam sessions, farmer markets, street food tours
- Each activity must feel authentic and exciting, not touristy
- Include price range and booking info where applicable

RESPOND IN ${lang}. Return ONLY valid JSON:
{
  "city": "${city}",
  "categories": [
    {
      "id": "outdoor",
      "name": "Açık Hava & Doğa",
      "emoji": "🌿",
      "activities": [
        {
          "name": "Activity name",
          "emoji": "🚴",
          "description": "2-3 exciting sentences",
          "where": "Specific location/neighborhood",
          "price": "Ücretsiz|50-100 TRY|150+ TRY",
          "duration": "2-3 saat",
          "bestTime": "morning|afternoon|evening|night|weekend",
          "vibe": "romantic|adventure|chill|social|creative",
          "tip": "Pro tip from a local",
          "rating": 4.5,
          "bookingUrl": null
        }
      ]
    }
  ],
  "todaysPick": {
    "name": "Today's top recommendation",
    "emoji": "⭐",
    "reason": "Why this is perfect for today"
  },
  "hiddenGems": [
    {
      "name": "Secret spot name",
      "emoji": "💎",
      "description": "Why it's special",
      "where": "Location"
    }
  ],
  "weekendIdeas": [
    {
      "title": "Weekend plan title",
      "emoji": "🎯",
      "plan": "Brief 2-sentence weekend plan combining activities"
    }
  ]
}

Categories to include (6-8 categories, 3-5 activities each):
1. 🌿 Açık Hava & Doğa — hiking, cycling, picnic spots, viewpoints, parks
2. 🎨 Sanat & Kültür — street art, galleries (not typical museums), workshops
3. 🍕 Sokak Lezzetleri — street food spots, hidden gems, food markets
4. 🎵 Müzik & Gece — live music, jazz bars, rooftop bars, outdoor events
5. 🎮 Eğlence & Oyun — escape rooms, board game cafes, VR, retro arcades
6. 📸 Fotoğraf Turları — Instagram spots, graffiti walls, hidden viewpoints
7. 🛍️ Vintage & Pazar — flea markets, vintage shops, artisan markets
8. ☕ Keyif & Kafe — book cafes, rooftop cafes, cat cafes, specialty coffee

Include 3 hidden gems and 3 weekend ideas.
All places must be REAL, with REAL addresses.
Respond ONLY with valid JSON.`

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{
                        text: locale === 'tr'
                            ? 'Sen eğlence odaklı yerel bir rehbersin. Gerçek, heyecan verici, yerel deneyimler öner. Sıkıcı turistik aktivitelerden kaçın.'
                            : 'You are a fun-loving local guide. Suggest real, exciting, local experiences. Avoid boring tourist activities.'
                    }]
                },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 16384, responseMimeType: 'application/json' },
            }),
        })

        if (!response.ok) {
            const fallbackRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 16384, responseMimeType: 'application/json' },
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
        console.error('Fun Activities API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
