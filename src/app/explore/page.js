'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Compass, Plane, Home, Ticket, MapPin, TrendingUp,
    ArrowRight, Star, Sparkles, Globe, Calendar, Heart,
    Sun, Mountain, Waves, Building, TreePine, Filter, Shield, Clock, ChevronDown, ChevronUp, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const HERO_DESTINATIONS = [
    {
        city: 'İstanbul', country: 'Türkiye', emoji: '🌉', image: '/destinations/istanbul.png',
        desc: 'İki kıtanın buluştuğu büyülü şehir', tag: 'Kültür & Tarih', color: '#F59E0B'
    },
    {
        city: 'Kapadokya', country: 'Türkiye', emoji: '🎈', image: '/destinations/cappadocia.png',
        desc: 'Balon turları ve peri bacaları', tag: 'Doğa & Macera', color: '#EC4899'
    },
    {
        city: 'Antalya', country: 'Türkiye', emoji: '🏖️', image: '/destinations/antalya.png',
        desc: 'Turkuaz deniz ve antik kalıntılar', tag: 'Deniz & Güneş', color: '#06B6D4'
    },
]

const QUICK_ACTIONS = [
    { icon: Plane, label: 'Uçuş Ara', desc: '3 kaynaktan en ucuz', href: '/flights', gradient: 'linear-gradient(135deg, #4F46E5, #7C3AED)', emoji: '✈️' },
    { icon: Home, label: 'Konaklama', desc: 'Airbnb ilanları', href: '/airbnb', gradient: 'linear-gradient(135deg, #E11D48, #F43F5E)', emoji: '🏠' },
    { icon: Ticket, label: 'Etkinlikler', desc: 'Konser, festival...', href: '/events', gradient: 'linear-gradient(135deg, #EC4899, #8B5CF6)', emoji: '🎭' },
    { icon: Calendar, label: 'Trip Planla', desc: 'AI destekli planlama', href: '/planner', gradient: 'linear-gradient(135deg, #0D9488, #10B981)', emoji: '📅' },
]

const DESTINATION_CARDS = [
    {
        city: 'Paris', country: 'Fransa', emoji: '🇫🇷', tag: 'Romantik', tagColor: '#EC4899',
        gradient: 'linear-gradient(135deg, #1E1B4B, #312E81)', highlights: ['Eyfel Kulesi', 'Louvre', 'Montmartre']
    },
    {
        city: 'Roma', country: 'İtalya', emoji: '🇮🇹', tag: 'Tarih', tagColor: '#F59E0B',
        gradient: 'linear-gradient(135deg, #78350F, #92400E)', highlights: ['Kolezyum', 'Vatikan', 'Trevi Çeşmesi']
    },
    {
        city: 'Barselona', country: 'İspanya', emoji: '🇪🇸', tag: 'Sanat', tagColor: '#8B5CF6',
        gradient: 'linear-gradient(135deg, #7F1D1D, #991B1B)', highlights: ['Sagrada Familia', 'Park Güell', 'La Rambla']
    },
    {
        city: 'Dubai', country: 'BAE', emoji: '🇦🇪', tag: 'Lüks', tagColor: '#F59E0B',
        gradient: 'linear-gradient(135deg, #1C1917, #44403C)', highlights: ['Burj Khalifa', 'Dubai Mall', 'Çöl Safari']
    },
    {
        city: 'Tiflis', country: 'Gürcistan', emoji: '🇬🇪', tag: 'Vizesiz', tagColor: '#22C55E',
        gradient: 'linear-gradient(135deg, #14532D, #166534)', highlights: ['Eski Şehir', 'Hamam', 'Gürcü Mutfağı']
    },
    {
        city: 'Saraybosna', country: 'Bosna', emoji: '🇧🇦', tag: 'Vizesiz', tagColor: '#22C55E',
        gradient: 'linear-gradient(135deg, #0C4A6E, #075985)', highlights: ['Baščaršija', 'Mostar', 'Doğa Yürüyüşü']
    },
    {
        city: 'Budapeşte', country: 'Macaristan', emoji: '🇭🇺', tag: 'Termal', tagColor: '#06B6D4',
        gradient: 'linear-gradient(135deg, #1E3A5F, #2D4A6F)', highlights: ['Termal Havuzlar', 'Parlamento', 'Tuna']
    },
    {
        city: 'Prag', country: 'Çekya', emoji: '🇨🇿', tag: 'Masalsı', tagColor: '#A855F7',
        gradient: 'linear-gradient(135deg, #3B0764, #581C87)', highlights: ['Eski Şehir', 'Karl Köprüsü', 'Bira']
    },
]

const TRAVEL_MOODS = [
    { icon: Sun, label: 'Deniz & Güneş', emoji: '🏖️', color: '#F59E0B', cities: ['Antalya', 'Bodrum', 'Fethiye', 'Barselona'] },
    { icon: Mountain, label: 'Doğa & Macera', emoji: '🏔️', color: '#22C55E', cities: ['Kapadokya', 'Trabzon', 'Bolu', 'İsviçre'] },
    { icon: Building, label: 'Şehir & Kültür', emoji: '🏛️', color: '#818CF8', cities: ['İstanbul', 'Paris', 'Roma', 'Londra'] },
    { icon: Heart, label: 'Romantik Kaçamak', emoji: '💕', color: '#EC4899', cities: ['Paris', 'Venedik', 'Santorini', 'Prag'] },
    { icon: Waves, label: 'Vizesiz Ucuz', emoji: '✅', color: '#10B981', cities: ['Tiflis', 'Saraybosna', 'Belgrad', 'Üsküp'] },
    { icon: TreePine, label: 'Kış Tatili', emoji: '❄️', color: '#06B6D4', cities: ['Uludağ', 'Viyana', 'Prag', 'Budapeşte'] },
]

const TRAVEL_TIPS = [
    { emoji: '💡', title: 'Erken Rezervasyon', desc: 'Uçak biletlerini 6-8 hafta önceden almak fiyatı %30 düşürür' },
    { emoji: '🛂', title: 'Vizesiz Ülkeler', desc: 'Türk vatandaşları 100+ ülkeye vizesiz veya kapıda vize ile gidebilir' },
    { emoji: '💰', title: 'Bütçe Takibi', desc: 'Günlük harcama limiti belirleyip uygulamada takip edin' },
    { emoji: '📱', title: 'eSIM Kullanın', desc: 'Yurtdışında pahalı roaming yerine eSIM ile internete bağlanın' },
    { emoji: '🏠', title: 'Airbnb vs Otel', desc: 'Uzun konaklamalarda Airbnb, kısa gezilerde otel daha avantajlı' },
    { emoji: '✈️', title: 'Aktarmalı Uçuş', desc: 'Aktarmalı uçuşlarla %40\'a kadar tasarruf edebilirsiniz' },
]

// ═══ VISA DATA FOR TURKISH PASSPORT ═══
const VISA_COUNTRIES = {
    visa_free: [
        { country: 'Gürcistan', emoji: '🇬🇪', stay: '1 yıl', currency: 'GEL', flight: '2s', highlights: ['Tiflis', 'Batum'] },
        { country: 'Sırbistan', emoji: '🇷🇸', stay: '90 gün', currency: 'RSD', flight: '1.5s', highlights: ['Belgrad', 'Novi Sad'] },
        { country: 'Bosna Hersek', emoji: '🇧🇦', stay: '90 gün', currency: 'BAM', flight: '2s', highlights: ['Saraybosna', 'Mostar'] },
        { country: 'Karadağ', emoji: '🇲🇪', stay: '90 gün', currency: 'EUR', flight: '1.5s', highlights: ['Kotor', 'Budva'] },
        { country: 'Arnavutluk', emoji: '🇦🇱', stay: '90 gün', currency: 'ALL', flight: '1.5s', highlights: ['Tiran', 'Sarandë'] },
        { country: 'K. Makedonya', emoji: '🇲🇰', stay: '90 gün', currency: 'MKD', flight: '1.5s', highlights: ['Üsküp', 'Ohrid'] },
        { country: 'Kosova', emoji: '🇽🇰', stay: '90 gün', currency: 'EUR', flight: '1.5s', highlights: ['Priştine', 'Prizren'] },
        { country: 'Brezilya', emoji: '🇧🇷', stay: '90 gün', currency: 'BRL', flight: '13s', highlights: ['Rio', 'São Paulo'] },
        { country: 'Arjantin', emoji: '🇦🇷', stay: '90 gün', currency: 'ARS', flight: '15s', highlights: ['Buenos Aires', 'Patagonya'] },
        { country: 'Güney Kore', emoji: '🇰🇷', stay: '90 gün', currency: 'KRW', flight: '10s', highlights: ['Seul', 'Busan'] },
        { country: 'Japonya', emoji: '🇯🇵', stay: '90 gün', currency: 'JPY', flight: '11s', highlights: ['Tokyo', 'Kyoto'] },
        { country: 'Malezya', emoji: '🇲🇾', stay: '90 gün', currency: 'MYR', flight: '10s', highlights: ['Kuala Lumpur', 'Langkawi'] },
        { country: 'Singapur', emoji: '🇸🇬', stay: '90 gün', currency: 'SGD', flight: '10s', highlights: ['Marina Bay', 'Sentosa'] },
        { country: 'Katar', emoji: '🇶🇦', stay: '90 gün', currency: 'QAR', flight: '4s', highlights: ['Doha', 'Souq Waqif'] },
        { country: 'Tunus', emoji: '🇹🇳', stay: '90 gün', currency: 'TND', flight: '3s', highlights: ['Tunus', 'Kartuş'] },
        { country: 'Moldova', emoji: '🇲🇩', stay: '90 gün', currency: 'MDL', flight: '2s', highlights: ['Kişinev'] },
        { country: 'Ukrayna', emoji: '🇺🇦', stay: '90 gün', currency: 'UAH', flight: '2s', highlights: ['Lviv', 'Odessa'] },
        { country: 'Belarus', emoji: '🇧🇾', stay: '30 gün', currency: 'BYN', flight: '3s', highlights: ['Minsk'] },
        { country: 'İran', emoji: '🇮🇷', stay: '90 gün', currency: 'IRR', flight: '3s', highlights: ['Tahran', 'İsfahan'] },
        { country: 'Fas', emoji: '🇲🇦', stay: '90 gün', currency: 'MAD', flight: '4s', highlights: ['Marakeş', 'Fes'] },
    ],
    visa_on_arrival: [
        { country: 'Mısır', emoji: '🇪🇬', stay: '30 gün', currency: 'EGP', flight: '2.5s', cost: '$25', highlights: ['Kahire', 'Piramitler'] },
        { country: 'Maldivler', emoji: '🇲🇻', stay: '30 gün', currency: 'MVR', flight: '7s', cost: 'Ücretsiz', highlights: ['Male', 'Resortlar'] },
        { country: 'Tayland', emoji: '🇹🇭', stay: '30 gün', currency: 'THB', flight: '9s', cost: 'Ücretsiz', highlights: ['Bangkok', 'Phuket'] },
        { country: 'Ürdün', emoji: '🇯🇴', stay: '30 gün', currency: 'JOD', flight: '2s', cost: '~$60', highlights: ['Petra', 'Amman'] },
        { country: 'Nepal', emoji: '🇳🇵', stay: '90 gün', currency: 'NPR', flight: '8s', cost: '$30-50', highlights: ['Katmandu', 'Everest'] },
        { country: 'Kamboçya', emoji: '🇰🇭', stay: '30 gün', currency: 'KHR', flight: '10s', cost: '$30', highlights: ['Angkor Wat', 'Phnom Penh'] },
        { country: 'Laos', emoji: '🇱🇦', stay: '30 gün', currency: 'LAK', flight: '10s', cost: '$35', highlights: ['Vientiane', 'Luang Prabang'] },
        { country: 'Madagaskar', emoji: '🇲🇬', stay: '90 gün', currency: 'MGA', flight: '12s', cost: '€35', highlights: ['Antananarivo'] },
        { country: 'Tanzanya', emoji: '🇹🇿', stay: '90 gün', currency: 'TZS', flight: '7s', cost: '$50', highlights: ['Zanzibar', 'Safari'] },
        { country: 'Mozambik', emoji: '🇲🇿', stay: '30 gün', currency: 'MZN', flight: '10s', cost: '$50', highlights: ['Maputo', 'Plajlar'] },
        { country: 'Endonezya', emoji: '🇮🇩', stay: '30 gün', currency: 'IDR', flight: '12s', cost: '$35', highlights: ['Bali', 'Jakarta'] },
        { country: 'Sri Lanka', emoji: '🇱🇰', stay: '30 gün', currency: 'LKR', flight: '7s', cost: '$50', highlights: ['Kolombo', 'Kandy'] },
        { country: 'Mauritius', emoji: '🇲🇺', stay: '90 gün', currency: 'MUR', flight: '10s', cost: 'Ücretsiz', highlights: ['Port Louis'] },
        { country: 'Özbekistan', emoji: '🇺🇿', stay: '30 gün', currency: 'UZS', flight: '4s', cost: 'Ücretsiz', highlights: ['Semerkant', 'Buhara'] },
    ],
    e_visa: [
        { country: 'Avustralya', emoji: '🇦🇺', stay: '90 gün', currency: 'AUD', flight: '18s', cost: '$20', highlights: ['Sidney', 'Melbourne'] },
        { country: 'Hindistan', emoji: '🇮🇳', stay: '60 gün', currency: 'INR', flight: '7s', cost: '$25', highlights: ['Delhi', 'Goa'] },
        { country: 'Vietnam', emoji: '🇻🇳', stay: '30 gün', currency: 'VND', flight: '10s', cost: '$25', highlights: ['Hanoi', 'Ho Chi Minh'] },
        { country: 'Azerbaycan', emoji: '🇦🇿', stay: '30 gün', currency: 'AZN', flight: '3s', cost: '$20', highlights: ['Bakü'] },
        { country: 'Kenya', emoji: '🇰🇪', stay: '90 gün', currency: 'KES', flight: '7s', cost: '$51', highlights: ['Nairobi', 'Safari'] },
        { country: 'Etiyopya', emoji: '🇪🇹', stay: '30 gün', currency: 'ETB', flight: '5s', cost: '$52', highlights: ['Addis Ababa'] },
        { country: 'Myanmar', emoji: '🇲🇲', stay: '28 gün', currency: 'MMK', flight: '10s', cost: '$50', highlights: ['Yangon', 'Bagan'] },
        { country: 'Bahreyn', emoji: '🇧🇭', stay: '14 gün', currency: 'BHD', flight: '4s', cost: '$29', highlights: ['Manama'] },
        { country: 'Umman', emoji: '🇴🇲', stay: '30 gün', currency: 'OMR', flight: '4s', cost: '$20', highlights: ['Muskat'] },
        { country: 'Ruanda', emoji: '🇷🇼', stay: '30 gün', currency: 'RWF', flight: '8s', cost: '$50', highlights: ['Kigali', 'Goriller'] },
    ],
}

// ═══ 50+ DESTINATION INFO CARDS ═══
const DESTINATION_INFO_CARDS = [
    // AVRUPA
    { city: 'Paris', country: 'Fransa', emoji: '🇫🇷', cat: 'avrupa', gradient: 'linear-gradient(135deg,#1E1B4B,#312E81)', fact: 'Eyfel Kulesi her 7 yılda 60 ton boyayla boyanır. Yaz sıcağında 15 cm uzar.', highlights: ['Eyfel', 'Louvre', 'Montmartre'] },
    { city: 'Roma', country: 'İtalya', emoji: '🇮🇹', cat: 'avrupa', gradient: 'linear-gradient(135deg,#78350F,#92400E)', fact: 'Trevi Çeşmesi\'ne her gün yaklaşık 3.000€ atılır. Bu para hayır kurumlarına gider.', highlights: ['Kolezyum', 'Vatikan', 'Pantheon'] },
    { city: 'Barselona', country: 'İspanya', emoji: '🇪🇸', cat: 'avrupa', gradient: 'linear-gradient(135deg,#7F1D1D,#991B1B)', fact: 'Sagrada Familia\'nın yapımı 1882\'de başladı ve hâlâ tamamlanmadı. 2026 hedefleniyor.', highlights: ['Sagrada Familia', 'La Rambla', 'Park Güell'] },
    { city: 'Amsterdam', country: 'Hollanda', emoji: '🇳🇱', cat: 'avrupa', gradient: 'linear-gradient(135deg,#0C4A6E,#075985)', fact: 'Şehirde 1.281 köprü var — Venedik\'ten bile fazla. Bisiklet sayısı insandan çok.', highlights: ['Kanallar', 'Van Gogh', 'Anne Frank'] },
    { city: 'Venedik', country: 'İtalya', emoji: '🇮🇹', cat: 'avrupa', gradient: 'linear-gradient(135deg,#1C1917,#44403C)', fact: '118 küçük ada üzerine kurulu ve motorlu araç yok. Her yıl 1-2 mm batıyor.', highlights: ['San Marco', 'Gondol', 'Murano'] },
    { city: 'Prag', country: 'Çekya', emoji: '🇨🇿', cat: 'avrupa', gradient: 'linear-gradient(135deg,#3B0764,#581C87)', fact: "Astronomik Saat 1410'dan beri çalışıyor — dünyanın en eski çalışan saati.", highlights: ['Eski Şehir', 'Karl Köprüsü', 'Kalesi'] },
    { city: 'Viyana', country: 'Avusturya', emoji: '🇦🇹', cat: 'avrupa', gradient: 'linear-gradient(135deg,#451a03,#78350F)', fact: "Dünyanın ilk metro hattı burada açıldı. Mozart 6 yaşında sarayda konser verdi.", highlights: ['Schönbrunn', 'Opera', 'Sachertorte'] },
    { city: 'Budapeşte', country: 'Macaristan', emoji: '🇭🇺', cat: 'avrupa', gradient: 'linear-gradient(135deg,#1E3A5F,#2D4A6F)', fact: "Avrupa'nın en büyük termal su sistemi. Széchenyi Hamamı'nda suda satranç oynanır.", highlights: ['Termal', 'Parlamento', 'Tuna'] },
    { city: 'Londra', country: 'İngiltere', emoji: '🇬🇧', cat: 'avrupa', gradient: 'linear-gradient(135deg,#1F2937,#374151)', fact: "Big Ben aslında saatin değil, çanın adı. Tower of London'da 6 kuzgun yaşıyor.", highlights: ['Big Ben', 'Tower Bridge', 'Camden'] },
    { city: 'Santorini', country: 'Yunanistan', emoji: '🇬🇷', cat: 'avrupa', gradient: 'linear-gradient(135deg,#1E3A5F,#1E40AF)', fact: "MÖ 1600'deki volkan patlaması Atlantis efsanesinin kaynağı olabilir.", highlights: ['Oia', 'Mavi Kubbe', 'Volkan'] },
    { city: 'Belgrad', country: 'Sırbistan', emoji: '🇷🇸', cat: 'avrupa', gradient: 'linear-gradient(135deg,#14532D,#166534)', fact: 'Tarihin en çok yıkılıp yeniden kurulan şehri — 115 kez. Eğlence hayatı efsane.', highlights: ['Kalemegdan', 'Skadarlija', 'Ada'] },
    { city: 'Saraybosna', country: 'Bosna Hersek', emoji: '🇧🇦', cat: 'avrupa', gradient: 'linear-gradient(135deg,#0C4A6E,#075985)', fact: "1. Dünya Savaşı'nı başlatan suikast burada gerçekleşti. Eski şehir kokusu büyüleyici.", highlights: ['Baščaršija', 'Tünel', 'Mostar'] },
    { city: 'Dubrovnik', country: 'Hırvatistan', emoji: '🇭🇷', cat: 'avrupa', gradient: 'linear-gradient(135deg,#7F1D1D,#B91C1C)', fact: "Game of Thrones'un King's Landing'i burada çekildi. Surları 2 km boyunda.", highlights: ['Surlar', 'Eski Şehir', 'Lokrum'] },
    { city: 'Kotor', country: 'Karadağ', emoji: '🇲🇪', cat: 'avrupa', gradient: 'linear-gradient(135deg,#0F172A,#1E293B)', fact: "Fiyortların Akdeniz'deki tek örneği. 1.350 metre yüksekteki kaleye 1.350 basamak.", highlights: ['Fiyort', 'Eski Şehir', 'Kale'] },
    { city: 'Tiflis', country: 'Gürcistan', emoji: '🇬🇪', cat: 'avrupa', gradient: 'linear-gradient(135deg,#14532D,#166534)', fact: "Şehrin adı 'sıcak' anlamına gelir — antik kükürt hamamları hâlâ aktif.", highlights: ['Hamam', 'Narikala', 'Şarap'] },

    // ASYA
    { city: 'Tokyo', country: 'Japonya', emoji: '🇯🇵', cat: 'asya', gradient: 'linear-gradient(135deg,#0F172A,#1E293B)', fact: "Dünyanın en yoğun metro ağı. Shibuya kavşağından her seferinde 3.000 kişi geçer.", highlights: ['Shibuya', 'Akihabara', 'Meiji'] },
    { city: 'Seul', country: 'Güney Kore', emoji: '🇰🇷', cat: 'asya', gradient: 'linear-gradient(135deg,#312E81,#4338CA)', fact: "Dünyanın en hızlı WiFi'si. Gangnam ilçesinde dünya nüfusunun 1/7'si K-pop dinler.", highlights: ['Gyeongbokgung', 'Myeongdong', 'Han'] },
    { city: 'Bangkok', country: 'Tayland', emoji: '🇹🇭', cat: 'asya', gradient: 'linear-gradient(135deg,#78350F,#B45309)', fact: "Şehrin resmi adı 168 harften oluşur — dünyanın en uzun şehir adı.", highlights: ['Grand Palace', 'Wat Arun', 'Chatuchak'] },
    { city: 'Bali', country: 'Endonezya', emoji: '🇮🇩', cat: 'asya', gradient: 'linear-gradient(135deg,#065F46,#047857)', fact: "Adada 20.000'den fazla tapınak var. Her evin önünde günlük çiçek sunusu yapılır.", highlights: ['Ubud', 'Tapınaklar', 'Pirinç'] },
    { city: 'Singapur', country: 'Singapur', emoji: '🇸🇬', cat: 'asya', gradient: 'linear-gradient(135deg,#0F172A,#334155)', fact: "Sakız çiğnemek yasak. Changi Havalimanı'nda kelebek bahçesi ve kayak pisti var.", highlights: ['Marina Bay', 'Gardens', 'Sentosa'] },
    { city: 'Kuala Lumpur', country: 'Malezya', emoji: '🇲🇾', cat: 'asya', gradient: 'linear-gradient(135deg,#1E3A5F,#1E40AF)', fact: "Petronas Kuleleri 1998-2004 arası dünyanın en yüksek binasıydı (452m).", highlights: ['Petronas', 'Batu Caves', 'Jalan Alor'] },
    { city: 'Hanoi', country: 'Vietnam', emoji: '🇻🇳', cat: 'asya', gradient: 'linear-gradient(135deg,#7F1D1D,#991B1B)', fact: "1.000 yıllık şehirde tren evlerin arasından geçer. Pho çorbası ulusal gurur.", highlights: ['Old Quarter', 'Tren Sokağı', 'Ha Long'] },
    { city: 'Katmandu', country: 'Nepal', emoji: '🇳🇵', cat: 'asya', gradient: 'linear-gradient(135deg,#312E81,#4338CA)', fact: "Dünyanın çatısı Everest buradan tırmanılır. 7 UNESCO mirası tek vadide.", highlights: ['Durbar', 'Swayambhu', 'Everest'] },
    { city: 'Kolombo', country: 'Sri Lanka', emoji: '🇱🇰', cat: 'asya', gradient: 'linear-gradient(135deg,#065F46,#047857)', fact: "Dünyanın en iyi çayı burada yetişir. Sigiriya kaya kalesi 200m yükseklikte.", highlights: ['Sigiriya', 'Çay', 'Galle'] },

    // ORTADOĞU & KUZEY AFRİKA
    { city: 'Dubai', country: 'BAE', emoji: '🇦🇪', cat: 'ortadogu', gradient: 'linear-gradient(135deg,#1C1917,#44403C)', fact: "Burj Khalifa'nın tepesinden gün batımını 2 dakika geç izlersiniz (828m).", highlights: ['Burj Khalifa', 'Dubai Mall', 'Çöl'] },
    { city: 'Marakeş', country: 'Fas', emoji: '🇲🇦', cat: 'ortadogu', gradient: 'linear-gradient(135deg,#7F1D1D,#B91C1C)', fact: "Jemaa el-Fna meydanı UNESCO maddi olmayan miras listesinde. Yılan oynatıcıları ünlü.", highlights: ['Medina', 'Jemaa el-Fna', 'Majorelle'] },
    { city: 'Petra', country: 'Ürdün', emoji: '🇯🇴', cat: 'ortadogu', gradient: 'linear-gradient(135deg,#78350F,#B45309)', fact: "2.000 yıllık kaya şehri. Binaların %85'i hâlâ toprağın altında keşfedilmedi.", highlights: ['Hazine', 'Siq', 'Manastır'] },
    { city: 'Kahire', country: 'Mısır', emoji: '🇪🇬', cat: 'ortadogu', gradient: 'linear-gradient(135deg,#451a03,#78350F)', fact: "Büyük Piramit 4.500 yaşında — tamamlandığında yapımı Roma'nın kuruluşundan eski.", highlights: ['Piramitler', 'Sfenks', 'Nil'] },
    { city: 'Doha', country: 'Katar', emoji: '🇶🇦', cat: 'ortadogu', gradient: 'linear-gradient(135deg,#0F172A,#1E293B)', fact: "Souq Waqif 100 yıllık pazar. 2022 Dünya Kupası stadyumları hâlâ kullanılıyor.", highlights: ['Souq Waqif', 'MIA', 'The Pearl'] },
    { city: 'Bakü', country: 'Azerbaycan', emoji: '🇦🇿', cat: 'ortadogu', gradient: 'linear-gradient(135deg,#0C4A6E,#075985)', fact: "Ateşler Ülkesi — doğal gaz çıkışları binlerce yıldır yanıyor. F1 yarışı yapılır.", highlights: ['Flame Towers', 'Eski Şehir', 'Heydar'] },

    // AFRİKA
    { city: 'Zanzibar', country: 'Tanzanya', emoji: '🇹🇿', cat: 'afrika', gradient: 'linear-gradient(135deg,#065F46,#047857)', fact: "Freddie Mercury burada doğdu. Stone Town'un labirent sokakları UNESCO mirası.", highlights: ['Stone Town', 'Plajlar', 'Baharat'] },
    { city: 'Cape Town', country: 'G. Afrika', emoji: '🇿🇦', cat: 'afrika', gradient: 'linear-gradient(135deg,#1E3A5F,#1E40AF)', fact: "Table Mountain dünyanın en eski dağlarından biri — 600 milyon yaşında.", highlights: ['Table Mt.', 'Penguen', 'Şarap'] },
    { city: 'Nairobi', country: 'Kenya', emoji: '🇰🇪', cat: 'afrika', gradient: 'linear-gradient(135deg,#78350F,#B45309)', fact: "Dünyanın tek şehir içi milli parkı. Gökdelenlerin arkasında zürafalar dolaşır.", highlights: ['Safari', 'Masai Mara', 'Giraffe'] },

    // AMERİKA
    { city: 'New York', country: 'ABD', emoji: '🇺🇸', cat: 'amerika', gradient: 'linear-gradient(135deg,#0F172A,#1E293B)', fact: "Central Park'ta 800+ farklı ağaç türü var. Manhattan aslında Lenape toprağıydı.", highlights: ['Times Square', 'Central Park', 'Brooklyn'] },
    { city: 'Buenos Aires', country: 'Arjantin', emoji: '🇦🇷', cat: 'amerika', gradient: 'linear-gradient(135deg,#1E3A5F,#2D4A6F)', fact: "Dünyanın en geniş bulvarı (Av. 9 de Julio, 140m). Tango burada doğdu.", highlights: ['La Boca', 'Tango', 'Recoleta'] },
    { city: 'Rio de Janeiro', country: 'Brezilya', emoji: '🇧🇷', cat: 'amerika', gradient: 'linear-gradient(135deg,#065F46,#047857)', fact: "Cristo Redentor dünyada en çok yıldırım düşen anıt — yılda 6 kez.", highlights: ['Cristo', 'Copacabana', 'Karnaval'] },
    { city: 'Küba (Havana)', country: 'Küba', emoji: '🇨🇺', cat: 'amerika', gradient: 'linear-gradient(135deg,#7F1D1D,#B91C1C)', fact: "1950'lerden kalma Amerikan arabaları hâlâ taksi olarak kullanılıyor.", highlights: ['Malecón', 'Old Havana', 'Classic Cars'] },
    { city: 'Meksiko City', country: 'Meksika', emoji: '🇲🇽', cat: 'amerika', gradient: 'linear-gradient(135deg,#78350F,#B45309)', fact: "Azteklerin kurduğu Tenochtitlan üzerine inşa edilmiş. Her yıl 10 cm batıyor.", highlights: ['Zócalo', 'Teotihuacan', 'Frida'] },

    // TÜRKİYE
    { city: 'İstanbul', country: 'Türkiye', emoji: '🇹🇷', cat: 'turkiye', gradient: 'linear-gradient(135deg,#4F46E5,#7C3AED)', fact: "Dünyanın üç imparatorluğa başkentlik yapmış tek şehri. Kapalıçarşı 4.000+ dükkan.", highlights: ['Ayasofya', 'Kapalıçarşı', 'Boğaz'] },
    { city: 'Kapadokya', country: 'Türkiye', emoji: '🇹🇷', cat: 'turkiye', gradient: 'linear-gradient(135deg,#78350F,#B45309)', fact: 'Peri bacaları 60 milyon yıllık volkanik tüften oluştu. Yeraltı şehirleri 8 kat derine iner.', highlights: ['Balonlar', 'Göreme', 'Yeraltı'] },
    { city: 'Antalya', country: 'Türkiye', emoji: '🇹🇷', cat: 'turkiye', gradient: 'linear-gradient(135deg,#0D9488,#06B6D4)', fact: "Yılda 300+ gün güneşli. Düden Şelalesi denize dökülen nadir şelalelerden.", highlights: ['Kaleiçi', 'Düden', 'Aspendos'] },
    { city: 'Efes', country: 'Türkiye', emoji: '🇹🇷', cat: 'turkiye', gradient: 'linear-gradient(135deg,#451a03,#78350F)', fact: "Antik dünyanın 7 harikasından biri Artemis Tapınağı buradaydı. 25.000 kişilik tiyatro.", highlights: ['Kütüphane', 'Tiyatro', 'Artemis'] },
    { city: 'Pamukkale', country: 'Türkiye', emoji: '🇹🇷', cat: 'turkiye', gradient: 'linear-gradient(135deg,#1E3A5F,#1E40AF)', fact: 'Pamuk Kalesi — 2.500 yıldır akan termal sular bembeyaz travertenler oluşturdu.', highlights: ['Travertenler', 'Hierapolis', 'Antik Havuz'] },
    { city: 'Trabzon', country: 'Türkiye', emoji: '🇹🇷', cat: 'turkiye', gradient: 'linear-gradient(135deg,#14532D,#166534)', fact: 'Sümela Manastırı 1.600 yıldır uçurumdan sarkar. Uzungöl doğa harikası.', highlights: ['Sümela', 'Uzungöl', 'Çay'] },
    { city: 'Mardin', country: 'Türkiye', emoji: '🇹🇷', cat: 'turkiye', gradient: 'linear-gradient(135deg,#78350F,#B45309)', fact: "Mezopotamya ovasına bakan taş evleri ile açık hava müzesi. Arapça, Türkçe, Kürtçe konuşulur.", highlights: ['Taş Evler', 'Deyr-ul Zafaran', 'Midyat'] },
    { city: 'Şanlıurfa', country: 'Türkiye', emoji: '🇹🇷', cat: 'turkiye', gradient: 'linear-gradient(135deg,#451a03,#78350F)', fact: "Göbeklitepe 12.000 yaşında — insanlığın bilinen ilk tapınağı. Piramitlerden 7.000 yıl eski.", highlights: ['Göbeklitepe', 'Balıklıgöl', 'Harran'] },
]

const INFO_CATEGORIES = [
    { key: 'all', label: 'Tümü', emoji: '🌍' },
    { key: 'turkiye', label: 'Türkiye', emoji: '🇹🇷' },
    { key: 'avrupa', label: 'Avrupa', emoji: '🏰' },
    { key: 'asya', label: 'Asya', emoji: '⛩️' },
    { key: 'ortadogu', label: 'Ortadoğu', emoji: '🕌' },
    { key: 'afrika', label: 'Afrika', emoji: '🦁' },
    { key: 'amerika', label: 'Amerika', emoji: '🗽' },
]

// ═══ DESTINATION COVER IMAGES ═══
const DEST_IMAGES = {
    // Existing
    'Paris': '/destinations/paris.png',
    'Roma': '/destinations/roma.png',
    'İstanbul': '/destinations/istanbul.png',
    'Tokyo': '/destinations/tokyo.png',
    'Dubai': '/destinations/dubai.png',
    'Kapadokya': '/destinations/kapadokya.png',
    'Barselona': '/destinations/barselona.png',
    'Santorini': '/destinations/santorini.png',
    'Antalya': '/destinations/antalya.png',
    'Amsterdam': '/destinations/amsterdam.png',
    'Londra': '/destinations/londra.png',
    'New York': '/destinations/newyork.png',
    'Bali': '/destinations/bali.png',
    'Marakeş': '/destinations/marakes.png',
    'Prag': '/destinations/prag.png',
    'Budapeşte': '/destinations/budapeste.png',
    'Bangkok': '/destinations/bangkok.png',
    'Venedik': '/destinations/venedik.png',
    'Rio de Janeiro': '/destinations/rio.png',
    // Europe
    'Viyana': '/destinations/viyana.png',
    'Belgrad': '/destinations/belgrad.png',
    'Saraybosna': '/destinations/saraybosna.png',
    'Dubrovnik': '/destinations/dubrovnik.png',
    'Kotor': '/destinations/kotor.png',
    'Tiflis': '/destinations/tiflis.png',
    // Asia
    'Seul': '/destinations/seul.png',
    'Singapur': '/destinations/singapur.png',
    'Kuala Lumpur': '/destinations/kualalumpur.png',
    'Hanoi': '/destinations/hanoi.png',
    'Katmandu': '/destinations/katmandu.png',
    'Kolombo': '/destinations/kolombo.png',
    // Middle East
    'Petra': '/destinations/petra.png',
    'Kahire': '/destinations/kahire.png',
    'Doha': '/destinations/doha.png',
    'Bakü': '/destinations/baku.png',
    // Africa
    'Zanzibar': '/destinations/zanzibar.png',
    'Cape Town': '/destinations/capetown.png',
    'Nairobi': '/destinations/nairobi.png',
    // Americas
    'Buenos Aires': '/destinations/buenosaires.png',
    'Küba (Havana)': '/destinations/havana.png',
    'Meksiko City': '/destinations/meksikocity.png',
    // Turkey
    'Efes': '/destinations/efes.png',
    'Pamukkale': '/destinations/pamukkale.png',
    'Trabzon': '/destinations/trabzon.png',
    'Mardin': '/destinations/mardin.png',
    'Şanlıurfa': '/destinations/sanliurfa.png',
}

const VISA_TAB_CONFIG = [
    { key: 'visa_free', label: 'Vizesiz', emoji: '✅', color: '#22C55E', count: VISA_COUNTRIES.visa_free.length },
    { key: 'visa_on_arrival', label: 'Kapıda Vize', emoji: '🛬', color: '#F59E0B', count: VISA_COUNTRIES.visa_on_arrival.length },
    { key: 'e_visa', label: 'E-Vize', emoji: '💻', color: '#818CF8', count: VISA_COUNTRIES.e_visa.length },
]

export default function ExplorePage() {
    const router = useRouter()
    const { user, profile } = useAuth()
    const { t } = useLanguage()
    const [heroIdx, setHeroIdx] = useState(0)
    const [visaTab, setVisaTab] = useState('visa_free')
    const [showAllVisa, setShowAllVisa] = useState(false)
    const [infoCat, setInfoCat] = useState('all')
    const [selectedDest, setSelectedDest] = useState(null)

    useEffect(() => {
        const interval = setInterval(() => setHeroIdx(i => (i + 1) % HERO_DESTINATIONS.length), 5000)
        return () => clearInterval(interval)
    }, [])

    const hero = HERO_DESTINATIONS[heroIdx]

    const sectionStyle = {
        background: 'var(--bg-secondary)', borderRadius: 20,
        border: '1px solid var(--border)', padding: '24px 28px', marginBottom: 24,
    }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* ═══ HERO CAROUSEL ═══ */}
                    <motion.div
                        key={heroIdx}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 280, cursor: 'pointer',
                        }}
                        onClick={() => router.push('/flights')}>
                        <img src={hero.image} alt={hero.city}
                            style={{ width: '100%', height: 280, objectFit: 'cover' }} />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.75))',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 32px 28px',
                        }}>
                            <span style={{
                                alignSelf: 'flex-start', background: hero.color, color: 'white',
                                padding: '4px 12px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 700, marginBottom: 8,
                            }}>{hero.tag}</span>
                            <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 900, margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                                {hero.emoji} {hero.city}
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', margin: '4px 0 0' }}>{hero.desc}</p>
                            {/* Dots */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                                {HERO_DESTINATIONS.map((_, i) => (
                                    <button key={i} onClick={e => { e.stopPropagation(); setHeroIdx(i) }}
                                        style={{
                                            width: i === heroIdx ? 24 : 8, height: 8, borderRadius: 4, border: 'none',
                                            background: i === heroIdx ? 'white' : 'rgba(255,255,255,0.4)',
                                            transition: 'all 300ms', cursor: 'pointer',
                                        }} />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* ═══ QUICK ACTIONS ═══ */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                        {QUICK_ACTIONS.map((action, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => router.push(action.href)}
                                style={{
                                    background: action.gradient, borderRadius: 16, padding: '20px 18px',
                                    cursor: 'pointer', color: 'white', transition: 'all 200ms',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                                }}>
                                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{action.emoji}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{action.label}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: 2 }}>{action.desc}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ═══ TRAVEL MOODS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        style={sectionStyle}>
                        <h2 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800 }}>
                            <Sparkles size={18} style={{ color: '#FBBF24', marginRight: 6 }} /> Nasıl Bir Tatil İstiyorsun?
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                            {TRAVEL_MOODS.map((mood, i) => (
                                <motion.div key={i} whileHover={{ scale: 1.03, y: -2 }}
                                    onClick={() => router.push(`/flights`)}
                                    style={{
                                        background: 'var(--bg-primary)', borderRadius: 14,
                                        border: '1px solid var(--border)', padding: '14px',
                                        cursor: 'pointer', transition: 'all 200ms',
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: '1.3rem' }}>{mood.emoji}</span>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: mood.color }}>{mood.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                        {mood.cities.map((c, ci) => (
                                            <span key={ci} style={{
                                                fontSize: '0.6rem', padding: '2px 6px', borderRadius: 5,
                                                background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontWeight: 600,
                                            }}>{c}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ═══ POPULAR DESTINATIONS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h2 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800 }}>
                            <Globe size={18} style={{ color: '#818CF8', marginRight: 6 }} /> Popüler Destinasyonlar
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
                            {DESTINATION_CARDS.map((dest, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.04 }}
                                    whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.18)' }}
                                    onClick={() => router.push('/flights')}
                                    style={{
                                        background: dest.gradient, borderRadius: 18, padding: '20px',
                                        cursor: 'pointer', transition: 'all 200ms', color: 'white',
                                        minHeight: 140,
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{dest.emoji} {dest.city}</h3>
                                            <p style={{ fontSize: '0.72rem', opacity: 0.7, margin: '2px 0 0' }}>{dest.country}</p>
                                        </div>
                                        <span style={{
                                            fontSize: '0.6rem', padding: '3px 8px', borderRadius: 6,
                                            background: `${dest.tagColor}30`, color: dest.tagColor, fontWeight: 700,
                                        }}>{dest.tag}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 5, marginTop: 14, flexWrap: 'wrap' }}>
                                        {dest.highlights.map((h, hi) => (
                                            <span key={hi} style={{
                                                fontSize: '0.6rem', padding: '3px 8px', borderRadius: 6,
                                                background: 'rgba(255,255,255,0.12)', fontWeight: 600,
                                            }}>📍 {h}</span>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: '0.7rem', opacity: 0.7 }}>
                                        Uçuş Ara <ArrowRight size={12} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ═══ 50+ DESTINATION INFO CARDS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                        style={sectionStyle}>
                        <h2 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800 }}>
                            <Compass size={18} style={{ color: '#F59E0B', marginRight: 6 }} /> 🗺️ Destinasyon Rehberi — {DESTINATION_INFO_CARDS.length} Yer
                        </h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
                            Tarihi niş bilgiler ve insanı içine çeken detaylar
                        </p>

                        {/* Category Filter */}
                        <div style={{ display: 'flex', gap: 5, marginBottom: 16, flexWrap: 'wrap' }}>
                            {INFO_CATEGORIES.map(cat => (
                                <button key={cat.key} onClick={() => setInfoCat(cat.key)}
                                    style={{
                                        padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                        background: infoCat === cat.key ? 'var(--primary-1)' : 'var(--bg-primary)',
                                        color: infoCat === cat.key ? 'white' : 'var(--text-secondary)',
                                        fontWeight: infoCat === cat.key ? 700 : 500, fontSize: '0.78rem',
                                        border: infoCat === cat.key ? 'none' : '1px solid var(--border)',
                                        transition: 'all 200ms', display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                    <span>{cat.emoji}</span> {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Info Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                            {DESTINATION_INFO_CARDS
                                .filter(c => infoCat === 'all' || c.cat === infoCat)
                                .map((card, i) => {
                                    const hasImage = DEST_IMAGES[card.city]
                                    return (
                                        <motion.div key={card.city}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.25)' }}
                                            onClick={() => setSelectedDest(card)}
                                            style={{
                                                borderRadius: 20, overflow: 'hidden',
                                                cursor: 'pointer', transition: 'all 250ms',
                                                position: 'relative',
                                                height: 220,
                                                background: hasImage
                                                    ? `url(${hasImage}) center/cover no-repeat`
                                                    : card.gradient,
                                                border: '1px solid rgba(255,255,255,0.08)',
                                            }}>
                                            {/* Gradient overlay */}
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: hasImage
                                                    ? 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.1) 75%)'
                                                    : 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%)',
                                            }} />
                                            {/* Country tag */}
                                            <div style={{
                                                position: 'absolute', top: 12, right: 12,
                                                padding: '5px 12px', borderRadius: 10,
                                                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)',
                                                fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)',
                                                letterSpacing: '0.02em', border: '1px solid rgba(255,255,255,0.1)',
                                            }}>{card.emoji} {card.country}</div>
                                            {/* Content */}
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                                padding: '18px 20px', color: 'white',
                                            }}>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 6px', textShadow: '0 2px 10px rgba(0,0,0,0.7)', letterSpacing: '-0.01em' }}>
                                                    {card.city}
                                                </h3>
                                                <p style={{
                                                    fontSize: '0.73rem', lineHeight: 1.5, margin: '0 0 10px',
                                                    color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                    fontWeight: 400,
                                                }}>
                                                    {card.fact}
                                                </p>
                                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                    {card.highlights.map((h, hi) => (
                                                        <span key={hi} style={{
                                                            fontSize: '0.62rem', padding: '4px 10px', borderRadius: 8,
                                                            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
                                                            fontWeight: 600, color: 'rgba(255,255,255,0.95)',
                                                            border: '1px solid rgba(255,255,255,0.12)',
                                                        }}>📍 {h}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                        </div>
                    </motion.div>

                    {/* ═══ DESTINATION DETAIL MODAL ═══ */}
                    <AnimatePresence>
                        {selectedDest && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 9999,
                                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: 20,
                                }}
                                onClick={() => setSelectedDest(null)}>
                                <motion.div
                                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                                    transition={{ type: 'spring', damping: 25 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
                                        background: 'var(--bg-primary)', borderRadius: 28,
                                        boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                                        border: '1px solid var(--border)',
                                    }}>
                                    {/* Hero image */}
                                    <div style={{
                                        height: 240, position: 'relative',
                                        background: DEST_IMAGES[selectedDest.city]
                                            ? `url(${DEST_IMAGES[selectedDest.city]}) center/cover no-repeat`
                                            : selectedDest.gradient,
                                    }}>
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(to top, var(--bg-primary) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                                        }} />
                                        {/* Close button */}
                                        <button onClick={() => setSelectedDest(null)} style={{
                                            position: 'absolute', top: 16, right: 16,
                                            width: 36, height: 36, borderRadius: 12,
                                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                                            border: 'none', color: 'white', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}><X size={18} /></button>
                                        {/* Title overlay */}
                                        <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
                                            <span style={{
                                                fontSize: '0.65rem', padding: '4px 10px', borderRadius: 8,
                                                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                                                color: 'white', fontWeight: 700,
                                            }}>{selectedDest.country}</span>
                                            <h2 style={{ color: 'white', margin: '8px 0 0', fontSize: '1.6rem', fontWeight: 900, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                                {selectedDest.emoji} {selectedDest.city}
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '20px 24px 28px' }}>
                                        {/* Fun fact */}
                                        <div style={{
                                            padding: '14px 18px', borderRadius: 16,
                                            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.05))',
                                            border: '1px solid rgba(245,158,11,0.15)', marginBottom: 20,
                                        }}>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#F59E0B', marginBottom: 4 }}>💡 Biliyor muydun?</div>
                                            <p style={{ fontSize: '0.82rem', lineHeight: 1.6, margin: 0, color: 'var(--text-primary)' }}>{selectedDest.fact}</p>
                                        </div>

                                        {/* Highlights */}
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 10px' }}>📍 Mutlaka Görülmeli</h4>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                                            {selectedDest.highlights.map((h, i) => (
                                                <span key={i} style={{
                                                    padding: '8px 14px', borderRadius: 12,
                                                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)',
                                                }}>{h}</span>
                                            ))}
                                        </div>

                                        {/* Why visit */}
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 10px' }}>✨ Neden Gitmelisin?</h4>
                                        <div style={{
                                            padding: '14px 18px', borderRadius: 16,
                                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                            marginBottom: 20,
                                        }}>
                                            <p style={{ fontSize: '0.78rem', lineHeight: 1.6, margin: 0, color: 'var(--text-secondary)' }}>
                                                {selectedDest.city}, keşfedilmeyi bekleyen eşsiz bir destinasyon.
                                                {selectedDest.highlights[0] && ` ${selectedDest.highlights[0]} başta olmak üzere`}
                                                {selectedDest.highlights[1] && `, ${selectedDest.highlights[1]}`}
                                                {selectedDest.highlights[2] && ` ve ${selectedDest.highlights[2]}`}
                                                {' gibi noktaları ile hafızanızda yer edecek bir seyahat deneyimi sunuyor. '}
                                                {selectedDest.country} mutfağının tadına bakın, yerel kültürü keşfedin ve unutulmaz anılar biriktirin.
                                            </p>
                                        </div>

                                        {/* Action buttons */}
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <motion.button whileTap={{ scale: 0.95 }}
                                                onClick={() => { setSelectedDest(null); router.push('/flights') }}
                                                style={{
                                                    flex: 1, padding: '14px 20px', borderRadius: 14, border: 'none',
                                                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                                    color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                }}>✈️ Uçuş Ara</motion.button>
                                            <motion.button whileTap={{ scale: 0.95 }}
                                                onClick={() => { setSelectedDest(null); router.push('/planner') }}
                                                style={{
                                                    flex: 1, padding: '14px 20px', borderRadius: 14, border: 'none',
                                                    background: 'linear-gradient(135deg, #0D9488, #10B981)',
                                                    color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                }}>📅 Plan Yap</motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ VISA-FREE COUNTRIES ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        style={sectionStyle}>
                        <h2 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800 }}>
                            <Shield size={18} style={{ color: '#22C55E', marginRight: 6 }} /> 🛂 Türk Pasaportu ile Gidilen Ülkeler
                        </h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
                            Vizesiz, kapıda vize ve e-vize ile gidebileceğiniz tüm ülkeler
                        </p>

                        {/* Visa Tabs */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                            {VISA_TAB_CONFIG.map(tab => (
                                <button key={tab.key} onClick={() => { setVisaTab(tab.key); setShowAllVisa(false) }}
                                    style={{
                                        padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                        background: visaTab === tab.key ? `${tab.color}20` : 'var(--bg-primary)',
                                        color: visaTab === tab.key ? tab.color : 'var(--text-secondary)',
                                        fontWeight: visaTab === tab.key ? 700 : 500, fontSize: '0.82rem',
                                        border: visaTab === tab.key ? `2px solid ${tab.color}40` : '1px solid var(--border)',
                                        transition: 'all 200ms', display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                    <span>{tab.emoji}</span> {tab.label}
                                    <span style={{
                                        background: visaTab === tab.key ? tab.color : 'var(--bg-tertiary)',
                                        color: visaTab === tab.key ? 'white' : 'var(--text-tertiary)',
                                        padding: '1px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 700,
                                    }}>{tab.count}</span>
                                </button>
                            ))}
                        </div>

                        {/* Country Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                            {(showAllVisa ? VISA_COUNTRIES[visaTab] : VISA_COUNTRIES[visaTab].slice(0, 8)).map((c, i) => (
                                <motion.div key={c.country}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
                                    style={{
                                        background: 'var(--bg-primary)', borderRadius: 14,
                                        border: '1px solid var(--border)', padding: '14px',
                                        cursor: 'pointer', transition: 'all 200ms',
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: '1.4rem' }}>{c.emoji}</span>
                                            <div>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.country}</div>
                                                <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>✈️ {c.flight} · 💰 {c.currency}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                                        <Clock size={11} style={{ color: 'var(--text-tertiary)' }} />
                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{c.stay}</span>
                                        {c.cost && <span style={{
                                            fontSize: '0.6rem', padding: '1px 6px', borderRadius: 5,
                                            background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 600, marginLeft: 4,
                                        }}>Vize: {c.cost}</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                        {c.highlights.map((h, hi) => (
                                            <span key={hi} style={{
                                                fontSize: '0.58rem', padding: '2px 6px', borderRadius: 5,
                                                background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontWeight: 600,
                                            }}>📍 {h}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Show More */}
                        {VISA_COUNTRIES[visaTab].length > 8 && (
                            <button onClick={() => setShowAllVisa(!showAllVisa)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    width: '100%', padding: '12px', marginTop: 12,
                                    borderRadius: 12, border: '1px solid var(--border)',
                                    background: 'var(--bg-primary)', cursor: 'pointer',
                                    fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)',
                                    transition: 'all 200ms',
                                }}>
                                {showAllVisa ? <><ChevronUp size={14} /> Daha Az Göster</> : <><ChevronDown size={14} /> Tümünü Göster ({VISA_COUNTRIES[visaTab].length})</>}
                            </button>
                        )}
                    </motion.div>

                    {/* ═══ TRAVEL TIPS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        style={sectionStyle}>
                        <h2 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800 }}>
                            <TrendingUp size={18} style={{ color: '#10B981', marginRight: 6 }} /> Seyahat İpuçları
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                            {TRAVEL_TIPS.map((tip, i) => (
                                <motion.div key={i} whileHover={{ x: 4 }}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 12,
                                        padding: '14px', borderRadius: 14, background: 'var(--bg-primary)',
                                        border: '1px solid var(--border)',
                                    }}>
                                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{tip.emoji}</span>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{tip.title}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{tip.desc}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
