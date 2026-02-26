// AI Route Planner — Optimized route from existing pins (Gemini + OpenAI fallback)
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { pins, city, days } = await request.json()

        if (!pins || pins.length === 0) {
            return NextResponse.json({ error: 'No pins provided' }, { status: 400 })
        }

        const geminiKey = process.env.GEMINI_API_KEY
        const openaiKey = process.env.OPENAI_API_KEY
        if (!geminiKey && !openaiKey) {
            return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
        }

        const pinsDescription = pins.map(p =>
            `- ${p.title} (${p.type}, lat: ${p.lat}, lng: ${p.lng}${p.rating ? `, ${p.rating}★` : ''})`
        ).join('\n')

        const prompt = `Given these pins/places in ${city}, create an optimized ${days || 1}-day route plan that minimizes travel time and groups nearby places together:

${pinsDescription}

IMPORTANT: Use REAL walking distances and travel times based on these GPS coordinates. Be geographically accurate about ${city}.

Consider:
- Actual walking distances between places (calculate from lat/lng)
- Logical grouping (e.g., morning activities, lunch spots near morning sites)
- A reasonable pace
- Real transport options available in ${city}

Respond in this JSON format only:
{
  "route": [
    {
      "dayNumber": 1,
      "stops": [
        {
          "order": 1,
          "pinTitle": "Place name from the list",
          "suggestedTime": "09:00-10:30",
          "travelNote": "15 min walk from previous stop",
          "tip": "Best visited in the morning"
        }
      ]
    }
  ],
  "totalWalkingTime": "approximately X hours",
  "suggestion": "A brief overall suggestion"
}

Respond ONLY with valid JSON.`

        // Try Gemini first
        if (geminiKey) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiKey}`
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: 'You are a route optimization assistant. Always respond with valid JSON only. Use real geographic data to calculate distances.' }] },
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 4096,
                            responseMimeType: 'application/json',
                        },
                    }),
                })

                if (response.ok) {
                    const data = await response.json()
                    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
                    if (content) return NextResponse.json(JSON.parse(content))
                }
            } catch (err) {
                console.error('Gemini route-plan error, falling back:', err.message)
            }
        }

        // Fallback to OpenAI
        if (openaiKey) {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: 'You are a route optimization assistant. Always respond with valid JSON only.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                const content = data.choices?.[0]?.message?.content
                try {
                    return NextResponse.json(JSON.parse(content))
                } catch {
                    const jsonMatch = content?.match(/\{[\s\S]*\}/)
                    if (jsonMatch) return NextResponse.json(JSON.parse(jsonMatch[0]))
                }
            }
        }

        return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    } catch (err) {
        console.error('Route plan error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
