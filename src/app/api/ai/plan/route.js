// AI Trip Planner — Server-side API route (keeps API key safe)
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { city, startDate, endDate, tempo, budget, interests, existingPins } = await request.json()

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
        }

        // Build the prompt
        const days = startDate && endDate
            ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
            : 3

        let pinsContext = ''
        if (existingPins && existingPins.length > 0) {
            pinsContext = `\n\nThe couple already has these saved pins in ${city}:\n${existingPins.map(p => `- ${p.title} (${p.type}, ${p.status}${p.rating ? `, ${p.rating}★` : ''}${p.notes ? `: ${p.notes}` : ''})`).join('\n')}\nIncorporate their favorites into the plan where it makes sense.`
        }

        const prompt = `You are a travel planning assistant for a couple. Create a detailed ${days}-day itinerary for ${city}.

Dates: ${startDate || 'flexible'} to ${endDate || 'flexible'}
Pace/Tempo: ${tempo || 'moderate'}
Budget level: ${budget || 'moderate'}
Interests: ${interests?.join(', ') || 'general sightseeing'}
${pinsContext}

IMPORTANT RULES:
- You are creating plans based on GENERAL KNOWLEDGE. If you are unsure about specific opening hours or prices, mark them as "estimated" or "approximate".
- Include realistic time blocks (e.g., 09:00-11:00).
- All tips should be practical.
- The plan should be romantic but not cheesy — think thoughtful, not cliché.

Please respond in EXACTLY this JSON format:
{
  "overview": "A 2-3 sentence summary of the trip",
  "days": [
    {
      "dayNumber": 1,
      "date": "${startDate || 'Day 1'}",
      "theme": "Short theme for the day",
      "items": [
        {
          "timeStart": "09:00",
          "timeEnd": "10:30",
          "title": "Place/Activity name",
          "description": "What to do, tips, why it's worth it",
          "type": "sightseeing|food|activity|transport|rest",
          "estimatedCost": "$XX (approximate)",
          "isEstimated": true
        }
      ]
    }
  ],
  "budgetEstimate": {
    "accommodation": "$XXX total (approximate)",
    "food": "$XXX total (approximate)",
    "activities": "$XXX total (approximate)",
    "transport": "$XXX total (approximate)",
    "total": "$XXX total (approximate)"
  },
  "tips": ["tip 1", "tip 2", "tip 3"],
  "rainPlan": {
    "overview": "What to do if weather is bad",
    "alternatives": [
      {
        "instead_of": "Original activity",
        "do_this": "Indoor alternative",
        "description": "Why this works"
      }
    ]
  }
}

Respond ONLY with valid JSON, no markdown.`

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a knowledgeable travel planner. Always respond with valid JSON only. When uncertain about specific details, mark them as estimated.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
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
