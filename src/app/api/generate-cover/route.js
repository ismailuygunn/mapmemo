// NAVISO — AI Cover Image Generator
// Supports: Gemini image gen, Unsplash fallback, multi-reference images, slogan generation
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { city, style, startDate, endDate, referenceImage, referenceImages, locale, includeSlogan } = await request.json()

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
        }

        // Style descriptions for consistent, stunning results
        const styleDescriptions = {
            romantic: 'Romantic golden hour scene with warm amber and rose gold tones. Soft bokeh lights, dreamy atmospheric haze.',
            adventure: 'Epic dramatic wide-angle vista at dawn. Bold cinematic lighting with deep shadows and vivid highlights.',
            vintage: 'Classic analog film photography aesthetic with Kodak Portra 400 film grain. Warm nostalgic color palette.',
            minimal: 'Clean contemporary architectural photography. Geometric composition with negative space. Muted pastel colors.',
            cinematic: 'Wes Anderson-inspired symmetrical composition. Cinematic color grading with teal and orange palette.',
            watercolor: 'Delicate watercolor painting interpretation of the cityscape. Wet-on-wet technique with flowing washes.',
            neon: 'Vibrant cyberpunk nightscape with neon reflections on wet streets. Electric blues, hot pinks, vivid purples.',
            dreamy: 'Surreal dreamscape with floating elements and magical golden particles. Soft pastel gradient sky.',
            polaroid: 'Instant camera aesthetic with warm color cast. White polaroid frame feel. Nostalgic summer vacation vibe.',
            editorial: 'High-fashion editorial travel photography. Vogue-style dramatic lighting with strong contrast.',
            sunset: 'Breathtaking golden hour to blue hour transition. Spectacular sunset sky with rich oranges and purples.',
            noir: 'Black and white fine art photography with dramatic contrast. Film noir atmosphere.',
        }

        const styleDesc = styleDescriptions[style] || styleDescriptions.romantic

        // Build the prompt
        const prompt = `Generate a stunning, high-quality vertical travel poster photograph for ${city}.

STYLE: ${styleDesc}

GEOGRAPHIC ACCURACY — CRITICAL:
- Accurately represent the REAL geography, climate, terrain, and architecture of ${city}.
- Feature REAL, recognizable landmarks of ${city}.
- The architecture and vegetation must match the REAL ${city}.
- If landlocked, NO ocean/beach. If coastal, water is OK.

COMPOSITION:
- Portrait orientation (9:16 aspect ratio)
- Professional travel magazine cover quality
- Photorealistic and breathtaking
- NO text, words, numbers, watermarks, or typography in the image
- No borders, no frames

Make this look like a Condé Nast Traveler magazine cover. 100% geographically faithful to ${city}.`

        // Build request parts
        const parts = [{ text: prompt }]

        // Support multiple reference images or single (legacy)
        const allRefs = referenceImages?.length > 0 ? referenceImages : (referenceImage ? [referenceImage] : [])

        if (allRefs.length > 0) {
            allRefs.forEach((ref) => {
                const base64Match = ref.match(/^data:image\/(.*?);base64,(.*)$/)
                if (base64Match) {
                    parts.unshift({
                        inlineData: {
                            mimeType: `image/${base64Match[1]}`,
                            data: base64Match[2],
                        }
                    })
                }
            })
            parts.push({
                text: `IMPORTANT: The provided reference photo(s) contain REAL PEOPLE/CHARACTERS.
Extract the people/characters from the reference photo(s) and place them naturally into the ${city} scene.
Keep their appearance, clothing, and features as close to the original as possible.
Place them in a natural pose appropriate for the ${city} setting and ${style} style.
The background MUST be an accurate, real view of ${city}.
Do NOT change the location to the reference photo's location — the background MUST be ${city}.`
            })
        }

        // Gemini image generation models
        const models = [
            'gemini-2.5-flash-image',
            'gemini-3.1-flash-image-preview',
            'gemini-3-pro-image-preview',
            'gemini-2.0-flash-exp-image-generation',
        ]

        let imageData = null
        let mimeType = 'image/png'
        let usedModel = null

        for (const model of models) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: {
                            responseModalities: ['IMAGE', 'TEXT'],
                        },
                    }),
                })

                if (!response.ok) {
                    const errText = await response.text()
                    console.error(`Gemini ${model} error:`, response.status, errText.substring(0, 300))
                    continue
                }

                const data = await response.json()
                for (const candidate of (data.candidates || [])) {
                    for (const part of (candidate.content?.parts || [])) {
                        if (part.inlineData) {
                            imageData = part.inlineData.data
                            mimeType = part.inlineData.mimeType || 'image/png'
                            usedModel = model
                            break
                        }
                    }
                    if (imageData) break
                }

                if (imageData) break
            } catch (err) {
                console.error(`Gemini ${model} exception:`, err.message)
                continue
            }
        }

        // Fallback: Try Imagen 3 API
        if (!imageData) {
            try {
                const imagenEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`
                const imagenPrompt = `A stunning, high-quality travel photograph of ${city}. ${styleDesc} Professional travel magazine cover quality, photorealistic, no text or watermarks.`

                const imagenRes = await fetch(imagenEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: imagenPrompt }],
                        parameters: {
                            sampleCount: 1,
                            aspectRatio: '9:16',
                            safetyFilterLevel: 'block_few',
                        },
                    }),
                })

                if (imagenRes.ok) {
                    const imagenData = await imagenRes.json()
                    const prediction = imagenData.predictions?.[0]
                    if (prediction?.bytesBase64Encoded) {
                        imageData = prediction.bytesBase64Encoded
                        mimeType = prediction.mimeType || 'image/png'
                        usedModel = 'imagen-3.0-generate-002'
                    }
                } else {
                    console.error('Imagen 3 error:', imagenRes.status, (await imagenRes.text()).substring(0, 200))
                }
            } catch (err) {
                console.error('Imagen 3 exception:', err.message)
            }
        }

        // Generate a slogan for the city
        let slogan = ''
        if (includeSlogan) {
            try {
                const sloganRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `Generate a short, catchy travel slogan for ${city} (max 8 words). ${locale === 'tr' ? 'In Turkish.' : 'In English.'} Return ONLY the slogan text, nothing else.` }] }],
                            generationConfig: { temperature: 0.9, maxOutputTokens: 100 },
                        }),
                    }
                )
                if (sloganRes.ok) {
                    const sloganData = await sloganRes.json()
                    slogan = sloganData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.replace(/"/g, '') || ''
                }
            } catch { /* silent */ }
        }

        // Fallback: Unsplash (free, no API key needed)
        if (!imageData) {
            try {
                const unsplashUrl = `https://source.unsplash.com/800x1200/?${encodeURIComponent(city + ' landmark cityscape travel')}`
                const unsplashRes = await fetch(unsplashUrl, { redirect: 'follow' })

                if (unsplashRes.ok) {
                    return NextResponse.json({
                        imageUrl: unsplashRes.url,
                        city,
                        style: style || 'photo',
                        model: 'unsplash',
                        isUnsplash: true,
                        slogan,
                    })
                }
            } catch (err) {
                console.error('Unsplash fallback error:', err.message)
            }

            return NextResponse.json({
                error: 'Image generation not available',
                fallbackGradient: true,
                slogan,
            }, { status: 200 })
        }

        const imageUrl = `data:${mimeType};base64,${imageData}`

        return NextResponse.json({
            imageUrl,
            city,
            style: style || 'romantic',
            model: usedModel,
            slogan,
        })
    } catch (err) {
        console.error('Cover generation error:', err)
        return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 })
    }
}
