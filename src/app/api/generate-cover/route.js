// AI Cover Image Generator — Uses Gemini Image Generation (Nano Banana Pro)
// Geographically accurate: will NOT add fictional elements to cities
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { city, style, startDate, endDate, referenceImage } = await request.json()

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
        }

        // Rich style descriptions for consistent, stunning results
        const styleDescriptions = {
            romantic: 'Romantic golden hour scene with warm amber and rose gold tones. Soft bokeh lights, gentle lens flare, dreamy atmospheric haze. Couple silhouette viewing the landmark from a scenic viewpoint. Shot on medium format camera, shallow depth of field.',
            adventure: 'Epic dramatic wide-angle vista at dawn. Bold cinematic lighting with deep shadows and vivid highlights. Dynamic cloud formations over the landscape. Adventure travel photography style, shot from an elevated vantage point with leading lines.',
            vintage: 'Classic analog film photography aesthetic with Kodak Portra 400 film grain. Warm nostalgic color palette with faded highlights and rich shadows. Retro 1970s travel poster composition. Slight vignetting and light leaks.',
            minimal: 'Clean contemporary architectural photography. Geometric composition with negative space. Muted pastel color palette — soft pinks, pale blues, warm whites. Minimalist Scandinavian design aesthetic. Shot on Hasselblad with precise framing.',
            cinematic: 'Wes Anderson-inspired symmetrical composition. Cinematic color grading with teal and orange palette. Anamorphic lens with horizontal flare. Ultra-wide 2.39:1 feel within the frame. Dramatic moody atmosphere like a film still.',
            watercolor: 'Delicate watercolor painting interpretation of the cityscape. Wet-on-wet technique with flowing, translucent washes of color. Soft edges blending into white paper. Artistic and ethereal with splashes of vibrant pigment. Studio Ghibli-inspired dreaminess.',
            neon: 'Vibrant cyberpunk nightscape with neon reflections on wet streets. Rich electric blues, hot pinks, and vivid purples. Rain-soaked urban atmosphere with glowing signage. Shot at night with long exposure, bokeh city lights.',
            dreamy: 'Surreal dreamscape with floating elements and magical golden particles. Iridescent light rays through clouds. Soft pastel gradient sky from lavender to peach. Ethereal and otherworldly atmosphere. Fantasy travel photography.',
            polaroid: 'Instant camera aesthetic with warm color cast and slight overexposure. White polaroid frame with handwritten caption feel. Nostalgic summer vacation vibe. Candid travel snapshot composition.',
            editorial: 'High-fashion editorial travel photography. Vogue-style dramatic lighting with strong contrast. Model walking through the scene (from behind, silhouette). Professional color grading, luxury travel aesthetic.',
            sunset: 'Breathtaking golden hour to blue hour transition. Spectacular sunset sky with rich oranges, pinks, and deep purples. Silhouetted landmarks against the vivid sky.',
            noir: 'Black and white fine art photography with dramatic contrast. Film noir atmosphere with deep shadows and selective highlights. Moody and mysterious composition. Grain texture for timeless quality.',
        }

        const styleDesc = styleDescriptions[style] || styleDescriptions.romantic

        // Build the enhanced, geographically accurate prompt
        const prompt = `Generate a stunning, high-quality vertical travel poster photograph for ${city}.

STYLE: ${styleDesc}

GEOGRAPHIC ACCURACY — CRITICAL RULES:
- You MUST accurately represent the REAL geography, climate, terrain, and architecture of ${city}.
- Research what ${city} actually looks like before generating. Use only REAL landmarks and scenery.
- If ${city} is an inland/landlocked city (e.g. Ankara, Madrid, Paris, Moscow, etc.), there must be ABSOLUTELY NO ocean, sea, beach, coast, or harbor in the image.
- If ${city} is a coastal city (e.g. Istanbul, Barcelona, Sydney, etc.), you MAY include water only if it's geographically accurate.
- Show the ACTUAL landscape: if it's steppe/plateau, show that. If it's mountains, show mountains. If it's desert, show desert.
- Feature REAL, recognizable landmarks of ${city} — not generic or invented ones.
- The architecture style must match the REAL architecture of ${city}.
- The vegetation/flora must match the REAL climate zone of ${city}.

COMPOSITION RULES:
- Portrait orientation (9:16 aspect ratio for mobile story format)
- Beautiful atmospheric sky with depth and dimension
- Professional travel magazine cover quality
- Photorealistic and breathtaking
- Rich detail and sharp focus on the main subject
- DO NOT include any text, words, numbers, watermarks, or typography in the image
- No borders, no frames, no overlays

Make this look like it belongs on the cover of Condé Nast Traveler magazine. The image must be 100% geographically faithful to ${city}.`

        // Build request parts
        const parts = [{ text: prompt }]

        // If reference image is provided, include it
        if (referenceImage) {
            const base64Match = referenceImage.match(/^data:image\/(.*?);base64,(.*)$/)
            if (base64Match) {
                parts.unshift({
                    inlineData: {
                        mimeType: `image/${base64Match[1]}`,
                        data: base64Match[2],
                    }
                })
                parts.push({
                    text: `Use the provided reference photo as style/composition inspiration. But the content MUST show the real ${city}, not the reference location.`
                })
            }
        }

        // Gemini image generation models (verified via ListModels API)
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
                    continue // Try next model
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

        // Fallback: Try Imagen 3 API if Gemini image generation isn't available
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

        // Fallback: Use Unsplash for high-quality city photos (free, no API key needed)
        if (!imageData) {
            try {
                // Unsplash Source provides free, high-quality photos
                const unsplashUrl = `https://source.unsplash.com/800x1200/?${encodeURIComponent(city + ' landmark cityscape travel')}`
                const unsplashRes = await fetch(unsplashUrl, { redirect: 'follow' })

                if (unsplashRes.ok) {
                    // Return the final redirected URL directly
                    return NextResponse.json({
                        imageUrl: unsplashRes.url,
                        city,
                        style: style || 'photo',
                        model: 'unsplash',
                        isUnsplash: true,
                    })
                }
            } catch (err) {
                console.error('Unsplash fallback error:', err.message)
            }

            // Final fallback: return a placeholder gradient
            return NextResponse.json({
                error: 'Image generation not available',
                fallbackGradient: true,
            }, { status: 200 }) // 200 so UI doesn't show error
        }

        const imageUrl = `data:${mimeType};base64,${imageData}`

        return NextResponse.json({
            imageUrl,
            city,
            style: style || 'romantic',
            model: usedModel,
        })
    } catch (err) {
        console.error('Cover generation error:', err)
        return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 })
    }
}
