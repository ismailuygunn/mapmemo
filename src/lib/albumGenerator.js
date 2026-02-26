// Album Generator — Client-side Photo Album Builder
// Creates a styled HTML representation from trip data + pin photos
// Can be used with html2canvas + jsPDF to export as PDF (optional dependency)

/**
 * Generates an album HTML string from trip and pin data
 * @param {Object} trip - Trip data with itinerary_data
 * @param {Array} pins - Pin data with media/photos
 * @param {string} spaceName - Couple space name
 * @returns {string} HTML string for the album
 */
export function generateAlbumHtml(trip, pins, spaceName) {
    const itinerary = trip.itinerary_data || {}
    const days = itinerary.days || []

    // Filter pins with media
    const pinsWithMedia = pins.filter(p => p.media_urls?.length > 0 || p.pin_media?.length > 0)

    const coverHtml = `
        <div class="album-cover" style="
            text-align:center; padding:64px 32px;
            background:linear-gradient(135deg,#4F46E5,#7C3AED);
            color:white; min-height:100vh; display:flex; flex-direction:column;
            align-items:center; justify-content:center; page-break-after:always;">
            <h1 style="font-size:2.5rem;margin-bottom:8px;">${trip.city || 'Our Adventure'}</h1>
            <p style="font-size:1.125rem;opacity:0.8;margin-bottom:4px;">
                ${trip.start_date ? new Date(trip.start_date).toLocaleDateString() : ''} 
                ${trip.end_date ? '– ' + new Date(trip.end_date).toLocaleDateString() : ''}
            </p>
            <p style="font-size:1rem;opacity:0.6;margin-top:24px;">${spaceName || 'NAVISO'}</p>
        </div>
    `

    const daysHtml = days.map((day, di) => `
        <div class="album-day" style="page-break-before:always;padding:32px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
                <div style="width:48px;height:48px;border-radius:50%;
                    background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;
                    display:flex;align-items:center;justify-content:center;
                    font-weight:700;font-size:1.125rem;">${day.dayNumber}</div>
                <div>
                    <h2 style="margin:0;font-size:1.25rem;">${day.theme || `Day ${day.dayNumber}`}</h2>
                    <p style="margin:0;font-size:0.875rem;color:#6B7280;">${day.date || ''}</p>
                </div>
            </div>
            ${day.items?.map(item => `
                <div style="padding:12px 16px;margin-bottom:8px;border-left:3px solid #4F46E5;
                    background:#F9FAFB;border-radius:0 8px 8px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;">
                        <strong style="font-size:0.9375rem;">${item.title}</strong>
                        <span style="font-size:0.8125rem;color:#4F46E5;">${item.timeStart || ''}${item.timeEnd ? '–' + item.timeEnd : ''}</span>
                    </div>
                    <p style="font-size:0.8125rem;color:#6B7280;margin:4px 0 0;">${item.description || ''}</p>
                    ${item.estimatedCost ? `<span style="font-size:0.75rem;color:#10B981;background:#ECFDF5;padding:2px 8px;border-radius:999px;margin-top:4px;display:inline-block;">💰 ${item.estimatedCost}</span>` : ''}
                </div>
            `).join('') || ''}
        </div>
    `).join('')

    // Photo gallery page
    const photosHtml = pinsWithMedia.length > 0 ? `
        <div class="album-photos" style="page-break-before:always;padding:32px;">
            <h2 style="text-align:center;margin-bottom:24px;">📸 Memories</h2>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                ${pinsWithMedia.slice(0, 12).map(pin => {
        const mediaUrl = pin.pin_media?.[0]?.url || pin.media_urls?.[0] || ''
        return `
                        <div style="border-radius:12px;overflow:hidden;position:relative;">
                            ${mediaUrl ? `<img src="${mediaUrl}" style="width:100%;height:200px;object-fit:cover;" alt="${pin.title}" />` : ''}
                            <div style="padding:8px 12px;background:white;border-bottom:1px solid #E5E7EB;">
                                <strong style="font-size:0.8125rem;">${pin.title}</strong>
                                ${pin.rating ? `<span style="font-size:0.75rem;float:right;">⭐ ${pin.rating}</span>` : ''}
                            </div>
                        </div>
                    `
    }).join('')}
            </div>
        </div>
    ` : ''

    // Budget summary page
    const budgetHtml = itinerary.budgetEstimate ? `
        <div style="page-break-before:always;padding:32px;">
            <h2 style="text-align:center;margin-bottom:24px;">💰 Trip Summary</h2>
            <div style="max-width:400px;margin:0 auto;">
                ${Object.entries(itinerary.budgetEstimate).map(([key, val]) => `
                    <div style="display:flex;justify-content:space-between;padding:10px 0;
                        border-bottom:1px solid #E5E7EB;font-size:0.9375rem;
                        ${key === 'total' ? 'font-weight:700;font-size:1.125rem;border-top:2px solid #4F46E5;border-bottom:none;padding-top:16px;' : ''}">
                        <span style="text-transform:capitalize;">${key}</span>
                        <span style="color:#4F46E5;">${val}</span>
                    </div>
                `).join('')}
            </div>
            ${itinerary.tips?.length > 0 ? `
                <div style="margin-top:32px;">
                    <h3>💡 Our Tips</h3>
                    <ul style="color:#6B7280;font-size:0.875rem;">
                        ${itinerary.tips.map(t => `<li style="margin-bottom:4px;">${t}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    ` : ''

    return `
        <!DOCTYPE html>
        <html><head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <title>${trip.city || 'Trip'} — NAVISO Album</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { font-family:'Inter',system-ui,sans-serif; color:#111827; }
                @media print { .no-print { display:none; } }
            </style>
        </head><body>
            ${coverHtml}
            ${daysHtml}
            ${photosHtml}
            ${budgetHtml}
        </body></html>
    `
}

/**
 * Opens album in new window for printing/PDF
 */
export function openAlbumForPrint(trip, pins, spaceName) {
    const html = generateAlbumHtml(trip, pins, spaceName)
    const win = window.open('', '_blank')
    if (win) {
        win.document.write(html)
        win.document.close()
        // Auto-trigger print dialog after load
        win.onload = () => setTimeout(() => win.print(), 500)
    }
}
