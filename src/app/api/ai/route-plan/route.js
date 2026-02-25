// AI Route Planner — Generate optimized route from existing pins
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { pins, city, days } = await request.json()

        if (!pins || pins.length === 0) {
            return NextResponse.json({ error: 'No pins provided' }, { status: 400 })
        }

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
        }

        const pinsDescription = pins.map(p =>
            `- ${p.title} (${p.type}, lat: ${p.lat}, lng: ${p.lng}${p.rating ? `, ${p.rating}★` : ''})`
        ).join('\n')

        const prompt = `Given these pins/places in ${city}, create an optimized ${days || 1}-day route plan that minimizes travel time and groups nearby places together:

${pinsDescription}

Consider:
- Walking distances between places
- Logical grouping (e.g., morning activities, lunch spots near morning sites)
- A reasonable pace for a couple

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

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a route optimization assistant. Always respond with valid JSON only.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 2000,
            }),
        })

        if (!response.ok) {
            return NextResponse.json({ error: 'AI service error' }, { status: 500 })
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content

        try {
            return NextResponse.json(JSON.parse(content))
        } catch {
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) return NextResponse.json(JSON.parse(jsonMatch[0]))
            return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })
        }
    } catch (err) {
        console.error('Route plan error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
