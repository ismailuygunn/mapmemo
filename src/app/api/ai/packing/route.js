'use client'

import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { city, days, weatherData, tripType, locale } = await request.json()

        if (!city) return NextResponse.json({ error: 'City required' }, { status: 400 })

        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

        // Fetch weather if not provided
        let weather = weatherData
        if (!weather) {
            try {
                const wRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/weather?city=${encodeURIComponent(city)}`)
                weather = await wRes.json()
            } catch { }
        }

        const weatherContext = weather?.forecasts?.length > 0
            ? `\nWEATHER FORECAST:\n${weather.forecasts.map(f => `- ${f.date}: ${f.weather}, ${Math.round(f.tempMin)}°C–${Math.round(f.tempMax)}°C, Rain: ${Math.round((f.pop || 0) * 100)}%`).join('\n')}`
            : ''

        const lang = locale === 'tr' ? 'Turkish' : 'English'

        const prompt = `Create a smart packing list for a ${days || 3}-day trip to ${city}.
Trip type: ${tripType || 'general'}
${weatherContext}

Respond in ${lang}. Return ONLY valid JSON:
{
  "categories": [
    {
      "name": "Giyim",
      "emoji": "👔",
      "items": [
        {
          "name": "T-shirt",
          "emoji": "👕",
          "quantity": 3,
          "priority": "must",
          "reason": "Weather is warm, pack light cotton"
        }
      ]
    }
  ],
  "weatherTips": ["Bring umbrella, 60% rain chance on Day 2"],
  "localTips": ["Mosques require covered shoulders", "Comfortable shoes for cobblestones"]
}

Categories MUST include: Giyim/Clothing, Elektronik/Electronics, Hijyen/Hygiene, Belgeler/Documents, İlaç/Medicine, Aksesuar/Accessories.
Priority values: "must" (essential), "nice" (recommended), "optional" (if space allows).
Include 6-10 items per category. Be specific to ${city} and the weather.
Respond ONLY with valid JSON.`

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: `You are a smart travel packing assistant. Always respond with valid JSON. Be specific to the destination climate and culture.` }] },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 8192, responseMimeType: 'application/json' },
            }),
        })

        if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`)

        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!content) throw new Error('Empty response')

        return NextResponse.json(JSON.parse(content))
    } catch (err) {
        console.error('Packing API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
