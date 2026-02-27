// Weather API — OpenWeatherMap forecast + Open-Meteo historical fallback
// If trip dates are beyond 5-day forecast, uses historical weather from same dates last year
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const lat = searchParams.get('lat')
        const lon = searchParams.get('lon')
        const startDate = searchParams.get('startDate') // Trip start date (optional)
        const endDate = searchParams.get('endDate')     // Trip end date (optional)

        if (!city && (!lat || !lon)) {
            return NextResponse.json({ error: 'City or coordinates required' }, { status: 400 })
        }

        const apiKey = process.env.OPENWEATHER_API_KEY

        // ── Step 1: Get coordinates for the city ──
        let cityLat = parseFloat(lat) || 0
        let cityLon = parseFloat(lon) || 0
        let cityName = city
        let countryCode = ''

        if (city && apiKey) {
            // Use OpenWeatherMap geocoding
            const geoRes = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
            )
            if (geoRes.ok) {
                const geoData = await geoRes.json()
                if (geoData.length > 0) {
                    cityLat = geoData[0].lat
                    cityLon = geoData[0].lon
                    cityName = geoData[0].local_names?.tr || geoData[0].name
                    countryCode = geoData[0].country
                }
            }
        }

        // ── Step 2: Check if dates are within 5-day forecast range ──
        const now = new Date()
        const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
        const tripStart = startDate ? new Date(startDate) : null
        const tripEnd = endDate ? new Date(endDate) : null

        const needsHistorical = tripStart && tripStart > fiveDaysLater

        // ── Step 3A: Standard 5-day forecast (OpenWeatherMap) ──
        let forecasts = []
        if (apiKey && !needsHistorical) {
            const lang = searchParams.get('lang') || 'tr'
            const params = new URLSearchParams({
                appid: apiKey,
                units: 'metric',
                cnt: 40,
                lang,
            })
            if (city) params.append('q', city)
            else { params.append('lat', lat); params.append('lon', lon) }

            const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?${params}`)
            if (res.ok) {
                const data = await res.json()
                const dailyForecasts = {}
                data.list.forEach(item => {
                    const day = item.dt_txt.split(' ')[0]
                    if (!dailyForecasts[day]) {
                        dailyForecasts[day] = {
                            date: day,
                            tempMin: item.main.temp_min,
                            tempMax: item.main.temp_max,
                            weather: item.weather[0].main,
                            description: item.weather[0].description,
                            icon: item.weather[0].icon,
                            humidity: item.main.humidity,
                            windSpeed: item.wind.speed,
                            pop: item.pop,
                        }
                    } else {
                        dailyForecasts[day].tempMin = Math.min(dailyForecasts[day].tempMin, item.main.temp_min)
                        dailyForecasts[day].tempMax = Math.max(dailyForecasts[day].tempMax, item.main.temp_max)
                        dailyForecasts[day].pop = Math.max(dailyForecasts[day].pop, item.pop)
                    }
                })
                forecasts = Object.values(dailyForecasts)
                cityName = data.city?.name || cityName
                countryCode = data.city?.country || countryCode
            }
        }

        // ── Step 3B: Historical weather from Open-Meteo (free, no API key) ──
        if (needsHistorical && cityLat && cityLon) {
            // Use same dates from LAST YEAR
            const lastYearStart = new Date(tripStart)
            lastYearStart.setFullYear(lastYearStart.getFullYear() - 1)
            const lastYearEnd = tripEnd ? new Date(tripEnd) : new Date(lastYearStart.getTime() + 7 * 24 * 60 * 60 * 1000)
            lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1)

            const fmt = (d) => d.toISOString().split('T')[0]

            const histRes = await fetch(
                `https://archive-api.open-meteo.com/v1/archive?` +
                `latitude=${cityLat}&longitude=${cityLon}` +
                `&start_date=${fmt(lastYearStart)}&end_date=${fmt(lastYearEnd)}` +
                `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max` +
                `&timezone=auto`
            )

            if (histRes.ok) {
                const histData = await histRes.json()
                const daily = histData.daily || {}
                const dates = daily.time || []

                forecasts = dates.map((date, i) => {
                    // Map the date to the ACTUAL trip date (this year)
                    const actualDate = new Date(date)
                    actualDate.setFullYear(actualDate.getFullYear() + 1)

                    // Map WMO weather codes to descriptions
                    const wmoCode = daily.weathercode?.[i] || 0
                    const { weather, description } = wmoToWeather(wmoCode)

                    return {
                        date: actualDate.toISOString().split('T')[0],
                        tempMin: daily.temperature_2m_min?.[i] || 0,
                        tempMax: daily.temperature_2m_max?.[i] || 0,
                        weather,
                        description,
                        icon: wmoToIcon(wmoCode),
                        humidity: 50, // Not available in historical, estimate
                        windSpeed: daily.windspeed_10m_max?.[i] || 0,
                        pop: (daily.precipitation_sum?.[i] || 0) > 0 ? 0.6 : 0.1,
                        isHistorical: true,
                        historicalYear: new Date(date).getFullYear(),
                    }
                })
            }
        }

        // ── Step 3C: No API key fallback — use Open-Meteo forecast (free) ──
        if (!apiKey && forecasts.length === 0 && cityLat && cityLon) {
            const forecastRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?` +
                `latitude=${cityLat}&longitude=${cityLon}` +
                `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max` +
                `&timezone=auto&forecast_days=14`
            )
            if (forecastRes.ok) {
                const fData = await forecastRes.json()
                const daily = fData.daily || {}
                forecasts = (daily.time || []).map((date, i) => {
                    const wmoCode = daily.weathercode?.[i] || 0
                    const { weather, description } = wmoToWeather(wmoCode)
                    return {
                        date,
                        tempMin: daily.temperature_2m_min?.[i] || 0,
                        tempMax: daily.temperature_2m_max?.[i] || 0,
                        weather,
                        description,
                        icon: wmoToIcon(wmoCode),
                        humidity: 50,
                        windSpeed: daily.windspeed_10m_max?.[i] || 0,
                        pop: (daily.precipitation_sum?.[i] || 0) > 0 ? 0.6 : 0.1,
                    }
                })
            }
        }

        return NextResponse.json({
            available: forecasts.length > 0,
            city: cityName,
            country: countryCode,
            forecasts,
            isHistorical: needsHistorical,
            historicalNote: needsHistorical
                ? 'Tahmin verileri geçen yılın aynı tarihlerine dayanmaktadır.'
                : undefined,
            coordinates: { lat: cityLat, lon: cityLon },
        })
    } catch (err) {
        console.error('Weather API error:', err)
        return NextResponse.json({ available: false, message: 'Server error' }, { status: 500 })
    }
}

// WMO Weather Code → Description
function wmoToWeather(code) {
    const map = {
        0: { weather: 'Clear', description: 'Açık' },
        1: { weather: 'Clear', description: 'Genellikle açık' },
        2: { weather: 'Clouds', description: 'Parçalı bulutlu' },
        3: { weather: 'Clouds', description: 'Bulutlu' },
        45: { weather: 'Fog', description: 'Sisli' },
        48: { weather: 'Fog', description: 'Yoğun sis' },
        51: { weather: 'Drizzle', description: 'Hafif çisenti' },
        53: { weather: 'Drizzle', description: 'Çisenti' },
        55: { weather: 'Drizzle', description: 'Yoğun çisenti' },
        61: { weather: 'Rain', description: 'Hafif yağmur' },
        63: { weather: 'Rain', description: 'Yağmurlu' },
        65: { weather: 'Rain', description: 'Şiddetli yağmur' },
        71: { weather: 'Snow', description: 'Hafif kar' },
        73: { weather: 'Snow', description: 'Karlı' },
        75: { weather: 'Snow', description: 'Yoğun kar' },
        80: { weather: 'Rain', description: 'Sağanak yağış' },
        81: { weather: 'Rain', description: 'Sağanak' },
        82: { weather: 'Rain', description: 'Şiddetli sağanak' },
        85: { weather: 'Snow', description: 'Hafif kar sağanağı' },
        86: { weather: 'Snow', description: 'Yoğun kar sağanağı' },
        95: { weather: 'Thunderstorm', description: 'Gök gürültülü fırtına' },
        96: { weather: 'Thunderstorm', description: 'Dolu ile fırtına' },
        99: { weather: 'Thunderstorm', description: 'Şiddetli fırtına' },
    }
    return map[code] || { weather: 'Clear', description: 'Açık' }
}

function wmoToIcon(code) {
    if (code === 0 || code === 1) return '01d'
    if (code === 2) return '02d'
    if (code === 3) return '04d'
    if (code >= 45 && code <= 48) return '50d'
    if (code >= 51 && code <= 55) return '09d'
    if (code >= 61 && code <= 65) return '10d'
    if (code >= 71 && code <= 77) return '13d'
    if (code >= 80 && code <= 82) return '09d'
    if (code >= 85 && code <= 86) return '13d'
    if (code >= 95) return '11d'
    return '01d'
}
