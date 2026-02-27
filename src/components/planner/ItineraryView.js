'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, Loader2, Plane, Shirt, CloudRain, Heart, Save, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui'
import { openAlbumForPrint } from '@/lib/albumGenerator'

// ── Weather Section ──
function WeatherSection({ weatherInfo, locale, t }) {
    if (!weatherInfo?.forecasts?.length) return null
    const icons = { Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Snow: '❄️', Thunderstorm: '⛈️', Drizzle: '🌦️', Mist: '🌫️', Fog: '🌫️' }
    return (
        <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="planner-section-header" style={{ cursor: 'default' }}>
                <CloudRain size={18} /> {t('weather.title')}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{weatherInfo.city}, {weatherInfo.country}</span>
            </div>
            <div className="planner-section-body">
                <div className="weather-grid">
                    {weatherInfo.forecasts.map((f, i) => {
                        const icon = icons[f.weather] || '🌤️'
                        const rainPct = Math.round((f.pop || 0) * 100)
                        return (
                            <div key={i} className={`weather-card ${rainPct > 50 ? 'weather-rainy' : rainPct > 20 ? 'weather-cloudy' : 'weather-sunny'}`}>
                                <span className="weather-icon">{icon}</span>
                                <span className="weather-date">{new Date(f.date).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                <span className="weather-temp">{Math.round(f.tempMin)}° – {Math.round(f.tempMax)}°C</span>
                                <span className="weather-desc">{f.description}</span>
                                {rainPct > 0 && <span className="weather-rain">🌧 {rainPct}%</span>}
                            </div>
                        )
                    })}
                </div>
            </div>
        </motion.div>
    )
}

// ── Events Section ──
function EventsSection({ eventsInfo, locale, t }) {
    if (!eventsInfo?.length) return null
    return (
        <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="planner-section-header" style={{ cursor: 'default' }}>
                🎭 {t('events.title')}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{eventsInfo.length} {t('events.found')}</span>
            </div>
            <div className="planner-section-body">
                <div className="events-list">
                    {eventsInfo.slice(0, 12).map((event, i) => {
                        const startDate = event.start ? new Date(event.start) : null
                        const startTime = startDate ? startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : null
                        return (
                            <div key={event.id || i} className="event-card">
                                {event.poster_url && <div className="event-poster" style={{ backgroundImage: `url(${event.poster_url})` }} />}
                                <div className="event-card-left">
                                    <div className="event-date-badge">
                                        <span className="event-date-day">{startDate?.getDate() || '?'}</span>
                                        <span className="event-date-month">{startDate?.toLocaleDateString(locale, { month: 'short' }) || ''}</span>
                                    </div>
                                </div>
                                <div className="event-card-body">
                                    <h4>{event.emoji || '🎫'} {event.name}</h4>
                                    <div className="event-meta">
                                        {event.format && <span className="event-category">{event.format}</span>}
                                        {event.venue_name && <span>📍 {event.venue_name}</span>}
                                        {event.district && <span>🏘️ {event.district}</span>}
                                        {startTime && <span>🕐 {startTime}</span>}
                                        {event.is_free && <span className="event-free">🆓 {locale === 'tr' ? 'Ücretsiz' : 'Free'}</span>}
                                    </div>
                                    {event.description && <p className="event-desc">{event.description.substring(0, 150)}...</p>}
                                    {event.tags?.length > 0 && (
                                        <div className="event-tags">{event.tags.slice(0, 4).map((t, ti) => <span key={ti} className="event-tag-chip">#{t}</span>)}</div>
                                    )}
                                </div>
                                <div className="event-card-action">
                                    {event.url ? (
                                        <a href={event.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">🎟️ {t('events.getTickets')}</a>
                                    ) : (
                                        <a href={`https://www.google.com/search?q=${encodeURIComponent((event.name || '') + ' ' + (event.venue_name || '') + ' tickets')}`}
                                            target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">🔍 {t('events.search')}</a>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </motion.div>
    )
}

// ── Transport Section ──
function TransportSection({ flightsInfo, transportLoading, formData, locale, t }) {
    return (
        <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="planner-section-header" style={{ cursor: 'default' }}>
                🚀 {t('transport.title')}
                {transportLoading && <Loader2 size={14} className="spin" style={{ marginLeft: 8 }} />}
            </div>
            <div className="planner-section-body">
                {flightsInfo.length > 0 && (
                    <>
                        <h4 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}><Plane size={16} /> {t('transport.flights')}</h4>
                        <div className="flights-list">
                            {flightsInfo.slice(0, 5).map((flight, i) => (
                                <div key={i} className="flight-card">
                                    <div className="flight-card-route">
                                        {flight.segments?.map((seg, si) => (
                                            <div key={si} className="flight-segment">
                                                {seg.segments?.map((s, ssi) => (
                                                    <div key={ssi} className="flight-leg">
                                                        <span className="flight-code">{s.departure}</span>
                                                        <span className="flight-arrow">✈️→</span>
                                                        <span className="flight-code">{s.arrival}</span>
                                                        <span className="flight-time">{s.departureTime?.substring(11, 16)}</span>
                                                        <span className="flight-carrier">{s.flightNumber}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flight-card-price">
                                        <span className="flight-price">{Number(flight.price).toLocaleString()} {flight.currency}</span>
                                        <span className="flight-class">{flight.bookingClass}</span>
                                        <a href={`https://www.google.com/travel/flights?q=${encodeURIComponent(`${formData.departureCity} to ${formData.cities[0] || formData.cityInput} ${formData.startDate}`)}`}
                                            target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ marginTop: 8 }}>
                                            ✈️ {t('flights.book')}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <TransportLinks formData={formData} t={t} locale={locale} hasFlights={flightsInfo.length > 0} />
            </div>
        </motion.div>
    )
}

function TransportLinks({ formData, t, locale, hasFlights }) {
    const dep = formData.departureCity || 'Istanbul'
    const dest = formData.cities[0] || formData.cityInput
    return (
        <div className="transport-links-grid" style={{ marginTop: hasFlights ? 20 : 0 }}>
            <a href={`https://www.google.com/travel/flights?q=${encodeURIComponent(`${dep} to ${dest} ${formData.startDate || ''}`)}`}
                target="_blank" rel="noopener noreferrer" className="transport-link-card">
                <span className="transport-icon">✈️</span>
                <span className="transport-name">{t('transport.flights')}</span>
                <span className="transport-provider">Google Flights</span>
            </a>
            <a href={`https://www.trainline.com/search/${encodeURIComponent(dep)}/${encodeURIComponent(dest)}`}
                target="_blank" rel="noopener noreferrer" className="transport-link-card">
                <span className="transport-icon">🚆</span>
                <span className="transport-name">{t('transport.trains')}</span>
                <span className="transport-provider">Trainline</span>
            </a>
            <a href={`https://www.flixbus.com/bus-routes?route=${encodeURIComponent(`${dep}-${dest}`)}`}
                target="_blank" rel="noopener noreferrer" className="transport-link-card">
                <span className="transport-icon">🚌</span>
                <span className="transport-name">{t('transport.buses')}</span>
                <span className="transport-provider">FlixBus / Obilet</span>
            </a>
            <a href={`https://www.kayak.com/cars/${encodeURIComponent(dest)}/${formData.startDate || ''}/${formData.endDate || ''}`}
                target="_blank" rel="noopener noreferrer" className="transport-link-card">
                <span className="transport-icon">🚗</span>
                <span className="transport-name">{t('transport.carRental')}</span>
                <span className="transport-provider">Kayak</span>
            </a>
            <a href="https://ebilet.tcddtasimacilik.gov.tr/" target="_blank" rel="noopener noreferrer" className="transport-link-card">
                <span className="transport-icon">🚄</span>
                <span className="transport-name">TCDD</span>
                <span className="transport-provider">{t('transport.turkishTrains')}</span>
            </a>
            <a href={`https://www.obilet.com/otobus-bileti/${encodeURIComponent(dep)}-${encodeURIComponent(dest)}`}
                target="_blank" rel="noopener noreferrer" className="transport-link-card">
                <span className="transport-icon">🎫</span>
                <span className="transport-name">Obilet</span>
                <span className="transport-provider">{t('transport.turkishBuses')}</span>
            </a>
        </div>
    )
}

// ── Extra Sections (transport guide, cheap eats, travel hacks, etc) ──
function ExtraSections({ itinerary, locale, formData }) {
    return (
        <>
            {/* Alternative Dates */}
            {itinerary.alternativeDates?.length > 0 && (
                <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <div className="planner-section-header" style={{ cursor: 'default' }}>📆 {locale === 'tr' ? 'Alternatif Tarihler' : 'Alternative Dates'}</div>
                    <div className="planner-section-body">
                        <div className="alt-dates-grid">
                            {itinerary.alternativeDates.map((alt, i) => (
                                <div key={i} className="alt-date-card">
                                    <span className="alt-date-range">{alt.dates}</span>
                                    <span className="alt-date-reason">{alt.reason}</span>
                                    {alt.estimatedSaving && <span className="alt-date-saving">💰 {alt.estimatedSaving}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Transport Guide */}
            {itinerary.transportGuide && (
                <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
                    <div className="planner-section-header" style={{ cursor: 'default' }}>🚇 {locale === 'tr' ? 'Ulaşım Rehberi' : 'Transport Guide'}</div>
                    <div className="planner-section-body">
                        {itinerary.transportGuide.overview && <p style={{ marginBottom: 10, fontSize: '0.82rem' }}>{itinerary.transportGuide.overview}</p>}
                        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                            {itinerary.transportGuide.transportCard && (
                                <div style={{ padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>💳 {locale === 'tr' ? 'Ulaşım Kartı' : 'Transport Card'}</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{itinerary.transportGuide.transportCard}</div>
                                </div>
                            )}
                            {itinerary.transportGuide.fromAirport && (
                                <div style={{ padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>✈️ {locale === 'tr' ? 'Havalimanından' : 'From Airport'}</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{itinerary.transportGuide.fromAirport}</div>
                                </div>
                            )}
                            {itinerary.transportGuide.taxiTips && (
                                <div style={{ padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>🚕 {locale === 'tr' ? 'Taksi İpuçları' : 'Taxi Tips'}</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{itinerary.transportGuide.taxiTips}</div>
                                </div>
                            )}
                        </div>
                        {itinerary.transportGuide.apps?.length > 0 && (
                            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {itinerary.transportGuide.apps.map((app, i) => (
                                    <span key={i} style={{ fontSize: '0.72rem', padding: '3px 10px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-1)', borderRadius: 20, fontWeight: 600 }}>📱 {app}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Cheap Eats */}
            {itinerary.cheapEats?.length > 0 && (
                <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div className="planner-section-header" style={{ cursor: 'default' }}>🍜 {locale === 'tr' ? 'Ucuz & Lezzetli Yerler' : 'Cheap Eats'}</div>
                    <div className="planner-section-body">
                        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                            {itinerary.cheapEats.map((eat, i) => (
                                <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 3 }}>{eat.name}</div>
                                    {eat.dish && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>🍽️ {eat.dish}</div>}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                        {eat.cost && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981' }}>💰 {eat.cost}</span>}
                                        {eat.area && <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>📍 {eat.area}</span>}
                                    </div>
                                    {eat.tip && <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 3, fontStyle: 'italic' }}>💡 {eat.tip}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Travel Hacks */}
            {itinerary.travelHacks?.length > 0 && (
                <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
                    <div className="planner-section-header" style={{ cursor: 'default' }}>🧠 {locale === 'tr' ? 'Seyahat Hileleri' : 'Travel Hacks'}</div>
                    <div className="planner-section-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {itinerary.travelHacks.map((hack, i) => (
                                <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>💡</span>
                                    <span>{hack}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Airbnb Link */}
            <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}>
                <div className="planner-section-header" style={{ cursor: 'default' }}>🏠 Airbnb</div>
                <div className="planner-section-body">
                    <a href={`https://www.airbnb.com/s/${encodeURIComponent(formData.cities[0] || formData.cityInput)}/homes?checkin=${formData.startDate || ''}&checkout=${formData.endDate || ''}`}
                        target="_blank" rel="noopener noreferrer" className="transport-link-card" style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none' }}>
                        <span className="transport-icon">🏠</span>
                        <div>
                            <span className="transport-name" style={{ display: 'block' }}>{locale === 'tr' ? `${formData.cities[0] || formData.cityInput} Airbnb İlanları` : `Airbnb in ${formData.cities[0] || formData.cityInput}`}</span>
                            <span className="transport-provider">{locale === 'tr' ? 'Konaklama seçenekleri için tıkla' : 'Click to browse stays'}</span>
                        </div>
                    </a>
                </div>
            </motion.div>
        </>
    )
}

// ── Bottom Sections (budget, survival, alternatives, tips, rain plan) ──
function BottomSections({ itinerary, formData, locale, t, showRainPlan }) {
    return (
        <>
            {/* Budget Estimate */}
            {itinerary.budgetEstimate && (
                <div className="card result-card" style={{ marginTop: 24 }}>
                    <h3>💰 {t('planner.budgetEstimate')}</h3>
                    <div className="budget-grid">
                        {Object.entries(itinerary.budgetEstimate).map(([key, value]) => (
                            <div key={key} className={`budget-row ${key === 'total' ? 'budget-row-total' : ''}`}>
                                <span style={{ textTransform: 'capitalize' }}>{key}</span>
                                <span style={{ color: 'var(--primary-1)', fontWeight: key === 'total' ? 700 : 400 }}>{value}</span>
                            </div>
                        ))}
                        {formData.totalBudget && (
                            <div className="budget-row budget-row-remaining">
                                <span>{t('planner.budgetRemaining')}</span>
                                <span>{formData.currency} {formData.totalBudget}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Survival Pack */}
            {itinerary.survivalPack && (
                <div className="card result-card survival-pack" style={{ marginTop: 16 }}>
                    <h3>{t('result.survivalPack')}</h3>
                    <div className="survival-grid">
                        {itinerary.survivalPack.transportApps?.length > 0 && (
                            <div className="survival-item"><h4>🚌 {t('result.transportApps')}</h4><ul>{itinerary.survivalPack.transportApps.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
                        )}
                        {itinerary.survivalPack.safeAreas?.length > 0 && (
                            <div className="survival-item survival-safe"><h4>🟢 {t('result.safeAreas')}</h4><ul>{itinerary.survivalPack.safeAreas.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
                        )}
                        {itinerary.survivalPack.cautionAreas?.length > 0 && (
                            <div className="survival-item survival-caution"><h4>🟡 {t('result.cautionAreas')}</h4><ul>{itinerary.survivalPack.cautionAreas.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
                        )}
                        {itinerary.survivalPack.tipping && (
                            <div className="survival-item"><h4>💰 {t('result.tipping')}</h4><p>{itinerary.survivalPack.tipping}</p></div>
                        )}
                        {itinerary.survivalPack.closingHours && (
                            <div className="survival-item"><h4>🕐 {t('result.closingHours')}</h4><p>{itinerary.survivalPack.closingHours}</p></div>
                        )}
                        {itinerary.survivalPack.scamWarnings?.length > 0 && (
                            <div className="survival-item survival-danger"><h4>⚠️ {t('result.scamWarnings')}</h4><ul>{itinerary.survivalPack.scamWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
                        )}
                    </div>
                </div>
            )}

            {/* Alternatives */}
            {itinerary.alternatives?.length > 0 && (
                <div className="card result-card" style={{ marginTop: 16 }}>
                    <h3>{t('result.alternatives')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {itinerary.alternatives.map((alt, i) => (
                            <div key={i} className="alternative-card">
                                <h4>{alt.name}</h4><p>{alt.description}</p>
                                <div className="alternative-meta">
                                    <span className="badge badge-primary">{alt.totalCost}</span>
                                    {alt.savings && <span className="badge badge-success">{t('result.savings')}: {alt.savings}</span>}
                                </div>
                                {alt.tradeoff && <p className="alternative-tradeoff">⚖️ {alt.tradeoff}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tips */}
            {itinerary.tips?.length > 0 && (
                <div className="card result-card" style={{ marginTop: 16 }}>
                    <h3>💡 {t('planner.tips')}</h3>
                    <ul className="tips-list">{itinerary.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                </div>
            )}

            {/* Next Time */}
            {itinerary.nextTimeSuggestions?.length > 0 && (
                <div className="card result-card" style={{ marginTop: 16 }}>
                    <h3>{t('result.nextTime')}</h3>
                    <p className="input-hint" style={{ marginBottom: 12 }}>{t('result.nextTimeHint')}</p>
                    {itinerary.nextTimeSuggestions.map((s, i) => (
                        <div key={i} className="next-time-item">
                            <MapPin size={16} style={{ color: 'var(--primary-1)', flexShrink: 0, marginTop: 2 }} />
                            <div><strong>{s.title}</strong><p>{s.reason}</p></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Rain Plan */}
            <AnimatePresence>
                {showRainPlan && itinerary.rainPlan && (
                    <motion.div className="card result-card" style={{ marginTop: 16, borderColor: 'var(--accent-sky)' }}
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <h3>🌧️ {locale === 'tr' ? 'Yağmur Planı B' : 'Rain Plan B'}</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{itinerary.rainPlan.overview}</p>
                        {itinerary.rainPlan.alternatives?.map((alt, i) => (
                            <div key={i} className="rain-alt">
                                <p className="rain-alt-instead">{locale === 'tr' ? 'Yerine:' : 'Instead of:'} {alt.instead_of}</p>
                                <p className="rain-alt-do">→ {alt.do_this}</p>
                                <p className="rain-alt-desc">{alt.description}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

// ── Day Item (single itinerary activity) ──
function DayItem({ item, di, ii, dayLen, isEditing, onEdit, onUpdate, onDelete, onMove, locale }) {
    return (
        <div className={`itinerary-item ${isEditing ? 'editing' : ''}`}>
            <div className="itinerary-time">
                {isEditing ? (
                    <input type="time" className="edit-time-input" value={item.timeStart || ''} onChange={e => onUpdate(di, ii, 'timeStart', e.target.value)} />
                ) : (
                    <span onClick={() => onEdit({ di, ii })} style={{ cursor: 'pointer' }}>{item.timeStart}{item.timeEnd ? `–${item.timeEnd}` : ''}</span>
                )}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {isEditing ? (
                        <input className="edit-title-input" value={item.title || ''} onChange={e => onUpdate(di, ii, 'title', e.target.value)} />
                    ) : (
                        <h4 style={{ margin: 0, cursor: 'pointer' }} onClick={() => onEdit({ di, ii })}>{item.title}</h4>
                    )}
                    {item.isHiddenGem && <Badge variant="gem" icon="💎">{locale === 'tr' ? 'Niş Öneri' : 'Hidden Gem'}</Badge>}
                </div>
                {item.rating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        <span style={{ color: '#FBBF24' }}>⭐ {item.rating}</span>
                        {item.reviewCount && <span>({item.reviewCount.toLocaleString()} {locale === 'tr' ? 'yorum' : 'reviews'})</span>}
                        {item.googleMapsUrl && <a href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-1)', textDecoration: 'none', marginLeft: 4 }}>📍 Google Maps</a>}
                    </div>
                )}
                {isEditing ? (
                    <textarea className="edit-desc-input" value={item.description || ''} onChange={e => onUpdate(di, ii, 'description', e.target.value)} rows={2} />
                ) : (
                    <p>{item.description}</p>
                )}
                {item.transportNote && <p className="transport-note">🚌 {item.transportNote}</p>}
                {item.estimatedCost && <span className="cost-badge">💰 {item.estimatedCost} {item.isEstimated && (locale === 'tr' ? '(tahmini)' : '(est.)')}</span>}
            </div>
            <div className="item-edit-actions">
                {isEditing ? (
                    <button className="item-edit-btn done" onClick={() => onEdit(null)}>✅</button>
                ) : (
                    <button className="item-edit-btn" onClick={() => onEdit({ di, ii })}>✏️</button>
                )}
                <button className="item-edit-btn" onClick={() => onMove(di, ii, -1)} disabled={ii === 0}>⬆️</button>
                <button className="item-edit-btn" onClick={() => onMove(di, ii, 1)} disabled={ii === dayLen - 1}>⬇️</button>
                <button className="item-edit-btn del" onClick={() => onDelete(di, ii)}>🗑️</button>
            </div>
        </div>
    )
}

export { WeatherSection, EventsSection, TransportSection, ExtraSections, BottomSections, DayItem }
