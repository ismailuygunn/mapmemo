// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE AIRPORTS DATABASE
// City-to-airport mapping, multi-airport cities
// ═══════════════════════════════════════════════════════════════

// Multi-airport city mappings
export const CITY_AIRPORTS = {
    'istanbul': ['IST', 'SAW'],
    'londra': ['LHR', 'LGW', 'STN'],
    'london': ['LHR', 'LGW', 'STN'],
    'paris': ['CDG', 'ORY'],
    'new york': ['JFK', 'EWR'],
    'tokyo': ['NRT', 'HND'],
    'roma': ['FCO', 'CIA'],
    'rome': ['FCO', 'CIA'],
    'milano': ['MXP', 'LIN'],
    'milan': ['MXP', 'LIN'],
    'moskova': ['SVO', 'DME', 'VKO'],
    'moskow': ['SVO', 'DME', 'VKO'],
    'buenos aires': ['EZE', 'AEP'],
    'são paulo': ['GRU', 'CGH'],
    'sao paulo': ['GRU', 'CGH'],
    'bangkok': ['BKK', 'DMK'],
    'seul': ['ICN', 'GMP'],
    'seoul': ['ICN', 'GMP'],
    'şanghay': ['PVG', 'SHA'],
    'shanghai': ['PVG', 'SHA'],
    'dubai': ['DXB', 'DWC'],
    'washington': ['IAD', 'DCA'],
    'chicago': ['ORD', 'MDW'],
    'ankara': ['ESB'],
    'izmir': ['ADB'],
    'antalya': ['AYT'],
}

// Full airport database
export const AIRPORTS = [
    // ═══ TÜRKİYE ═══
    { code: 'IST', city: 'İstanbul', name: 'İstanbul Havalimanı', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'SAW', city: 'İstanbul', name: 'Sabiha Gökçen', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'ESB', city: 'Ankara', name: 'Esenboğa', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'ADB', city: 'İzmir', name: 'Adnan Menderes', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'AYT', city: 'Antalya', name: 'Antalya', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'TZX', city: 'Trabzon', name: 'Trabzon', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'DLM', city: 'Dalaman', name: 'Dalaman', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'BJV', city: 'Bodrum', name: 'Milas-Bodrum', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'GZT', city: 'Gaziantep', name: 'Oğuzeli', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'VAS', city: 'Sivas', name: 'Nuri Demirağ', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'ERZ', city: 'Erzurum', name: 'Erzurum', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'DIY', city: 'Diyarbakır', name: 'Diyarbakır', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'SZF', city: 'Samsun', name: 'Çarşamba', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'KYA', city: 'Konya', name: 'Konya', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'ASR', city: 'Kayseri', name: 'Erkilet', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'ADA', city: 'Adana', name: 'Şakirpaşa', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'VAN', city: 'Van', name: 'Ferit Melen', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'MLX', city: 'Malatya', name: 'Erhaç', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'MZH', city: 'Merzifon', name: 'Merzifon', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'NOP', city: 'Sinop', name: 'Sinop', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'HTY', city: 'Hatay', name: 'Hatay', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'NAV', city: 'Nevşehir', name: 'Kapadokya', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'GNY', city: 'Şanlıurfa', name: 'GAP', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'MQM', city: 'Mardin', name: 'Mardin', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'AOE', city: 'Eskişehir', name: 'Anadolu', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'BZI', city: 'Balıkesir', name: 'Merkez', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'BDM', city: 'Bandırma', name: 'Bandırma', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'CKZ', city: 'Çanakkale', name: 'Çanakkale', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'DNZ', city: 'Denizli', name: 'Çardak', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'EZS', city: 'Elazığ', name: 'Elazığ', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'OGU', city: 'Ordu-Giresun', name: 'Ordu-Giresun', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'KCM', city: 'Kahramanmaraş', name: 'Kahramanmaraş', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'IGD', city: 'Iğdır', name: 'Iğdır', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'KSY', city: 'Kars', name: 'Harakani', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'SRI', city: 'Şırnak', name: 'Şerafettin Elçi', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'TJK', city: 'Tokat', name: 'Tokat', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'MSR', city: 'Muş', name: 'Muş', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'BGG', city: 'Bingöl', name: 'Bingöl', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'BAL', city: 'Batman', name: 'Batman', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'YKO', city: 'Yüksekova', name: 'Selahaddin Eyyubi', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'NKT', city: 'Şırnak', name: 'Şırnak Şerafettin Elçi', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'USQ', city: 'Uşak', name: 'Uşak', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'ONQ', city: 'Zonguldak', name: 'Zonguldak', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'KFS', city: 'Kastamonu', name: 'Kastamonu', country: 'Türkiye', emoji: '🇹🇷' },
    { code: 'EDO', city: 'Edremit', name: 'Edremit Koca Seyit', country: 'Türkiye', emoji: '🇹🇷' },

    // ═══ AVRUPA ═══
    { code: 'LHR', city: 'Londra', name: 'Heathrow', country: 'İngiltere', emoji: '🇬🇧' },
    { code: 'LGW', city: 'Londra', name: 'Gatwick', country: 'İngiltere', emoji: '🇬🇧' },
    { code: 'STN', city: 'Londra', name: 'Stansted', country: 'İngiltere', emoji: '🇬🇧' },
    { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle', country: 'Fransa', emoji: '🇫🇷' },
    { code: 'ORY', city: 'Paris', name: 'Orly', country: 'Fransa', emoji: '🇫🇷' },
    { code: 'FCO', city: 'Roma', name: 'Fiumicino', country: 'İtalya', emoji: '🇮🇹' },
    { code: 'CIA', city: 'Roma', name: 'Ciampino', country: 'İtalya', emoji: '🇮🇹' },
    { code: 'MXP', city: 'Milano', name: 'Malpensa', country: 'İtalya', emoji: '🇮🇹' },
    { code: 'LIN', city: 'Milano', name: 'Linate', country: 'İtalya', emoji: '🇮🇹' },
    { code: 'BCN', city: 'Barselona', name: 'El Prat', country: 'İspanya', emoji: '🇪🇸' },
    { code: 'MAD', city: 'Madrid', name: 'Barajas', country: 'İspanya', emoji: '🇪🇸' },
    { code: 'AMS', city: 'Amsterdam', name: 'Schiphol', country: 'Hollanda', emoji: '🇳🇱' },
    { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt', country: 'Almanya', emoji: '🇩🇪' },
    { code: 'MUC', city: 'Münih', name: 'Franz Josef Strauss', country: 'Almanya', emoji: '🇩🇪' },
    { code: 'BER', city: 'Berlin', name: 'Brandenburg', country: 'Almanya', emoji: '🇩🇪' },
    { code: 'DUS', city: 'Düsseldorf', name: 'Düsseldorf', country: 'Almanya', emoji: '🇩🇪' },
    { code: 'HAM', city: 'Hamburg', name: 'Hamburg', country: 'Almanya', emoji: '🇩🇪' },
    { code: 'VIE', city: 'Viyana', name: 'Schwechat', country: 'Avusturya', emoji: '🇦🇹' },
    { code: 'ZRH', city: 'Zürih', name: 'Kloten', country: 'İsviçre', emoji: '🇨🇭' },
    { code: 'GVA', city: 'Cenevre', name: 'Cointrin', country: 'İsviçre', emoji: '🇨🇭' },
    { code: 'PRG', city: 'Prag', name: 'Václav Havel', country: 'Çekya', emoji: '🇨🇿' },
    { code: 'BUD', city: 'Budapeşte', name: 'Liszt Ferenc', country: 'Macaristan', emoji: '🇭🇺' },
    { code: 'WAW', city: 'Varşova', name: 'Chopin', country: 'Polonya', emoji: '🇵🇱' },
    { code: 'KRK', city: 'Krakow', name: 'Balice', country: 'Polonya', emoji: '🇵🇱' },
    { code: 'ATH', city: 'Atina', name: 'Eleftherios Venizelos', country: 'Yunanistan', emoji: '🇬🇷' },
    { code: 'SKG', city: 'Selanik', name: 'Makedonia', country: 'Yunanistan', emoji: '🇬🇷' },
    { code: 'HER', city: 'Girit', name: 'Nikos Kazantzakis', country: 'Yunanistan', emoji: '🇬🇷' },
    { code: 'RHO', city: 'Rodos', name: 'Diagoras', country: 'Yunanistan', emoji: '🇬🇷' },
    { code: 'CPH', city: 'Kopenhag', name: 'Kastrup', country: 'Danimarka', emoji: '🇩🇰' },
    { code: 'ARN', city: 'Stockholm', name: 'Arlanda', country: 'İsveç', emoji: '🇸🇪' },
    { code: 'OSL', city: 'Oslo', name: 'Gardermoen', country: 'Norveç', emoji: '🇳🇴' },
    { code: 'HEL', city: 'Helsinki', name: 'Vantaa', country: 'Finlandiya', emoji: '🇫🇮' },
    { code: 'LIS', city: 'Lizbon', name: 'Portela', country: 'Portekiz', emoji: '🇵🇹' },
    { code: 'DUB', city: 'Dublin', name: 'Dublin', country: 'İrlanda', emoji: '🇮🇪' },
    { code: 'BRU', city: 'Brüksel', name: 'Zaventem', country: 'Belçika', emoji: '🇧🇪' },
    { code: 'OTP', city: 'Bükreş', name: 'Henri Coandă', country: 'Romanya', emoji: '🇷🇴' },
    { code: 'SOF', city: 'Sofya', name: 'Sofia', country: 'Bulgaristan', emoji: '🇧🇬' },
    { code: 'BEG', city: 'Belgrad', name: 'Nikola Tesla', country: 'Sırbistan', emoji: '🇷🇸' },
    { code: 'SJJ', city: 'Saraybosna', name: 'Butmir', country: 'Bosna', emoji: '🇧🇦' },
    { code: 'ZAG', city: 'Zagreb', name: 'Franjo Tuđman', country: 'Hırvatistan', emoji: '🇭🇷' },
    { code: 'DBV', city: 'Dubrovnik', name: 'Čilipi', country: 'Hırvatistan', emoji: '🇭🇷' },
    { code: 'SKP', city: 'Üsküp', name: 'Alexander the Great', country: 'K. Makedonya', emoji: '🇲🇰' },
    { code: 'PRN', city: 'Priştine', name: 'Adem Jashari', country: 'Kosova', emoji: '🇽🇰' },
    { code: 'TGD', city: 'Podgorica', name: 'Golubovci', country: 'Karadağ', emoji: '🇲🇪' },
    { code: 'TIA', city: 'Tiran', name: 'Nënë Tereza', country: 'Arnavutluk', emoji: '🇦🇱' },
    { code: 'TLL', city: 'Tallinn', name: 'Lennart Meri', country: 'Estonya', emoji: '🇪🇪' },
    { code: 'RIX', city: 'Riga', name: 'Riga', country: 'Letonya', emoji: '🇱🇻' },
    { code: 'VNO', city: 'Vilnius', name: 'Vilnius', country: 'Litvanya', emoji: '🇱🇹' },
    { code: 'KIV', city: 'Kişinev', name: 'Kişinev', country: 'Moldova', emoji: '🇲🇩' },
    { code: 'NCE', city: 'Nice', name: "Côte d'Azur", country: 'Fransa', emoji: '🇫🇷' },
    { code: 'PMI', city: 'Mallorca', name: 'Son Sant Joan', country: 'İspanya', emoji: '🇪🇸' },
    { code: 'NAP', city: 'Napoli', name: 'Capodichino', country: 'İtalya', emoji: '🇮🇹' },
    { code: 'VCE', city: 'Venedik', name: 'Marco Polo', country: 'İtalya', emoji: '🇮🇹' },
    { code: 'PSA', city: 'Pisa', name: 'Galileo Galilei', country: 'İtalya', emoji: '🇮🇹' },

    // ═══ KAFKASYA & ORTA ASYA ═══
    { code: 'TBS', city: 'Tiflis', name: 'Shota Rustaveli', country: 'Gürcistan', emoji: '🇬🇪' },
    { code: 'BUS', city: 'Batum', name: 'Batum', country: 'Gürcistan', emoji: '🇬🇪' },
    { code: 'GYD', city: 'Bakü', name: 'Haydar Aliyev', country: 'Azerbaycan', emoji: '🇦🇿' },
    { code: 'EVN', city: 'Erivan', name: 'Zvartnots', country: 'Ermenistan', emoji: '🇦🇲' },
    { code: 'NQZ', city: 'Astana', name: 'Nursultan', country: 'Kazakistan', emoji: '🇰🇿' },
    { code: 'ALA', city: 'Almatı', name: 'Almatı', country: 'Kazakistan', emoji: '🇰🇿' },
    { code: 'TAS', city: 'Taşkent', name: 'Islam Karimov', country: 'Özbekistan', emoji: '🇺🇿' },
    { code: 'FRU', city: 'Bişkek', name: 'Manas', country: 'Kırgızistan', emoji: '🇰🇬' },

    // ═══ ORTADOĞU ═══
    { code: 'DXB', city: 'Dubai', name: 'Dubai', country: 'BAE', emoji: '🇦🇪' },
    { code: 'AUH', city: 'Abu Dabi', name: 'Zayed', country: 'BAE', emoji: '🇦🇪' },
    { code: 'DOH', city: 'Doha', name: 'Hamad', country: 'Katar', emoji: '🇶🇦' },
    { code: 'AMM', city: 'Amman', name: 'Queen Alia', country: 'Ürdün', emoji: '🇯🇴' },
    { code: 'BEY', city: 'Beyrut', name: 'Rafic Hariri', country: 'Lübnan', emoji: '🇱🇧' },
    { code: 'TLV', city: 'Tel Aviv', name: 'Ben Gurion', country: 'İsrail', emoji: '🇮🇱' },
    { code: 'RUH', city: 'Riyad', name: 'King Khaled', country: 'S. Arabistan', emoji: '🇸🇦' },
    { code: 'JED', city: 'Cidde', name: 'King Abdulaziz', country: 'S. Arabistan', emoji: '🇸🇦' },
    { code: 'BAH', city: 'Manama', name: 'Bahrain', country: 'Bahreyn', emoji: '🇧🇭' },
    { code: 'MCT', city: 'Maskat', name: 'Maskat', country: 'Umman', emoji: '🇴🇲' },
    { code: 'KWI', city: 'Kuveyt', name: 'Kuwait', country: 'Kuveyt', emoji: '🇰🇼' },
    { code: 'IKA', city: 'Tahran', name: 'Imam Khomeini', country: 'İran', emoji: '🇮🇷' },

    // ═══ AFRİKA ═══
    { code: 'CAI', city: 'Kahire', name: 'Cairo', country: 'Mısır', emoji: '🇪🇬' },
    { code: 'SSH', city: 'Sharm el-Sheikh', name: 'Sharm el-Sheikh', country: 'Mısır', emoji: '🇪🇬' },
    { code: 'HRG', city: 'Hurghada', name: 'Hurghada', country: 'Mısır', emoji: '🇪🇬' },
    { code: 'CMN', city: 'Kazablanka', name: 'Mohammed V', country: 'Fas', emoji: '🇲🇦' },
    { code: 'RAK', city: 'Marakeş', name: 'Menara', country: 'Fas', emoji: '🇲🇦' },
    { code: 'TUN', city: 'Tunus', name: 'Carthage', country: 'Tunus', emoji: '🇹🇳' },
    { code: 'ALG', city: 'Cezayir', name: 'Houari Boumediene', country: 'Cezayir', emoji: '🇩🇿' },
    { code: 'NBO', city: 'Nairobi', name: 'Jomo Kenyatta', country: 'Kenya', emoji: '🇰🇪' },
    { code: 'CPT', city: 'Cape Town', name: 'Cape Town', country: 'G. Afrika', emoji: '🇿🇦' },
    { code: 'JNB', city: 'Johannesburg', name: 'OR Tambo', country: 'G. Afrika', emoji: '🇿🇦' },
    { code: 'ZNZ', city: 'Zanzibar', name: 'Abeid Amani Karume', country: 'Tanzanya', emoji: '🇹🇿' },
    { code: 'ADD', city: 'Addis Ababa', name: 'Bole', country: 'Etiyopya', emoji: '🇪🇹' },

    // ═══ ASYA ═══
    { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi', country: 'Tayland', emoji: '🇹🇭' },
    { code: 'DMK', city: 'Bangkok', name: 'Don Mueang', country: 'Tayland', emoji: '🇹🇭' },
    { code: 'SIN', city: 'Singapur', name: 'Changi', country: 'Singapur', emoji: '🇸🇬' },
    { code: 'KUL', city: 'Kuala Lumpur', name: 'KLIA', country: 'Malezya', emoji: '🇲🇾' },
    { code: 'DPS', city: 'Bali', name: 'Ngurah Rai', country: 'Endonezya', emoji: '🇮🇩' },
    { code: 'CGK', city: 'Cakarta', name: 'Soekarno–Hatta', country: 'Endonezya', emoji: '🇮🇩' },
    { code: 'NRT', city: 'Tokyo', name: 'Narita', country: 'Japonya', emoji: '🇯🇵' },
    { code: 'HND', city: 'Tokyo', name: 'Haneda', country: 'Japonya', emoji: '🇯🇵' },
    { code: 'ICN', city: 'Seul', name: 'Incheon', country: 'G. Kore', emoji: '🇰🇷' },
    { code: 'PVG', city: 'Şanghay', name: 'Pudong', country: 'Çin', emoji: '🇨🇳' },
    { code: 'PEK', city: 'Pekin', name: 'Capital', country: 'Çin', emoji: '🇨🇳' },
    { code: 'HKG', city: 'Hong Kong', name: 'Hong Kong', country: 'Hong Kong', emoji: '🇭🇰' },
    { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi', country: 'Hindistan', emoji: '🇮🇳' },
    { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji', country: 'Hindistan', emoji: '🇮🇳' },
    { code: 'MLE', city: 'Male', name: 'Velana', country: 'Maldivler', emoji: '🇲🇻' },
    { code: 'CMB', city: 'Kolombo', name: 'Bandaranaike', country: 'Sri Lanka', emoji: '🇱🇰' },
    { code: 'KTM', city: 'Katmandu', name: 'Tribhuvan', country: 'Nepal', emoji: '🇳🇵' },
    { code: 'HAN', city: 'Hanoi', name: 'Noi Bai', country: 'Vietnam', emoji: '🇻🇳' },
    { code: 'SGN', city: 'Ho Chi Minh', name: 'Tan Son Nhat', country: 'Vietnam', emoji: '🇻🇳' },
    { code: 'MNL', city: 'Manila', name: 'Ninoy Aquino', country: 'Filipinler', emoji: '🇵🇭' },
    { code: 'PNH', city: 'Phnom Penh', name: 'Phnom Penh', country: 'Kamboçya', emoji: '🇰🇭' },

    // ═══ AMERİKA ═══
    { code: 'JFK', city: 'New York', name: 'John F. Kennedy', country: 'ABD', emoji: '🇺🇸' },
    { code: 'EWR', city: 'New York', name: 'Newark', country: 'ABD', emoji: '🇺🇸' },
    { code: 'LAX', city: 'Los Angeles', name: 'LAX', country: 'ABD', emoji: '🇺🇸' },
    { code: 'ORD', city: 'Chicago', name: "O'Hare", country: 'ABD', emoji: '🇺🇸' },
    { code: 'MIA', city: 'Miami', name: 'Miami', country: 'ABD', emoji: '🇺🇸' },
    { code: 'SFO', city: 'San Francisco', name: 'SFO', country: 'ABD', emoji: '🇺🇸' },
    { code: 'IAH', city: 'Houston', name: 'George Bush', country: 'ABD', emoji: '🇺🇸' },
    { code: 'IAD', city: 'Washington', name: 'Dulles', country: 'ABD', emoji: '🇺🇸' },
    { code: 'ATL', city: 'Atlanta', name: 'Hartsfield-Jackson', country: 'ABD', emoji: '🇺🇸' },
    { code: 'YYZ', city: 'Toronto', name: 'Pearson', country: 'Kanada', emoji: '🇨🇦' },
    { code: 'YUL', city: 'Montreal', name: 'Trudeau', country: 'Kanada', emoji: '🇨🇦' },
    { code: 'MEX', city: 'Meksiko City', name: 'Benito Juárez', country: 'Meksika', emoji: '🇲🇽' },
    { code: 'CUN', city: 'Cancún', name: 'Cancún', country: 'Meksika', emoji: '🇲🇽' },
    { code: 'GRU', city: 'São Paulo', name: 'Guarulhos', country: 'Brezilya', emoji: '🇧🇷' },
    { code: 'GIG', city: 'Rio de Janeiro', name: 'Galeão', country: 'Brezilya', emoji: '🇧🇷' },
    { code: 'EZE', city: 'Buenos Aires', name: 'Ezeiza', country: 'Arjantin', emoji: '🇦🇷' },
    { code: 'SCL', city: 'Santiago', name: 'Arturo Merino', country: 'Şili', emoji: '🇨🇱' },
    { code: 'BOG', city: 'Bogota', name: 'El Dorado', country: 'Kolombiya', emoji: '🇨🇴' },
    { code: 'LIM', city: 'Lima', name: 'Jorge Chávez', country: 'Peru', emoji: '🇵🇪' },
    { code: 'HAV', city: 'Havana', name: 'José Martí', country: 'Küba', emoji: '🇨🇺' },
    { code: 'PTY', city: 'Panama City', name: 'Tocumen', country: 'Panama', emoji: '🇵🇦' },

    // ═══ OKYANUSYA ═══
    { code: 'SYD', city: 'Sidney', name: 'Kingsford Smith', country: 'Avustralya', emoji: '🇦🇺' },
    { code: 'MEL', city: 'Melbourne', name: 'Tullamarine', country: 'Avustralya', emoji: '🇦🇺' },
    { code: 'AKL', city: 'Auckland', name: 'Auckland', country: 'Yeni Zelanda', emoji: '🇳🇿' },
]

// Destinations for flight deals (subset with visa info + flight hours)
export const DESTINATIONS_DEALS = [
    { code: 'AYT', city: 'Antalya', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'ADB', city: 'İzmir', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'TZX', city: 'Trabzon', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1.5 },
    { code: 'DLM', city: 'Dalaman', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'BJV', city: 'Bodrum', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'GZT', city: 'Gaziantep', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1.5 },
    { code: 'ESB', city: 'Ankara', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'NAV', city: 'Kapadokya', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1.3 },
    { code: 'ERZ', city: 'Erzurum', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 2 },
    { code: 'VAN', city: 'Van', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 2.5 },
    { code: 'KSY', city: 'Kars', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 2.5 },
    { code: 'SJJ', city: 'Saraybosna', country: 'Bosna', visa: 'visa_free', emoji: '🇧🇦', flightH: 1.5 },
    { code: 'TBS', city: 'Tiflis', country: 'Gürcistan', visa: 'visa_free', emoji: '🇬🇪', flightH: 2 },
    { code: 'GYD', city: 'Bakü', country: 'Azerbaycan', visa: 'visa_free', emoji: '🇦🇿', flightH: 3 },
    { code: 'SKP', city: 'Üsküp', country: 'K. Makedonya', visa: 'visa_free', emoji: '🇲🇰', flightH: 1.5 },
    { code: 'PRN', city: 'Priştine', country: 'Kosova', visa: 'visa_free', emoji: '🇽🇰', flightH: 1.5 },
    { code: 'BEG', city: 'Belgrad', country: 'Sırbistan', visa: 'visa_free', emoji: '🇷🇸', flightH: 1.5 },
    { code: 'SOF', city: 'Sofya', country: 'Bulgaristan', visa: 'visa_free', emoji: '🇧🇬', flightH: 1 },
    { code: 'OTP', city: 'Bükreş', country: 'Romanya', visa: 'visa_free', emoji: '🇷🇴', flightH: 1.5 },
    { code: 'DOH', city: 'Doha', country: 'Katar', visa: 'visa_free', emoji: '🇶🇦', flightH: 4.5 },
    { code: 'AMM', city: 'Amman', country: 'Ürdün', visa: 'visa_free', emoji: '🇯🇴', flightH: 2 },
    { code: 'BKK', city: 'Bangkok', country: 'Tayland', visa: 'visa_free', emoji: '🇹🇭', flightH: 9.5 },
    { code: 'TIA', city: 'Tiran', country: 'Arnavutluk', visa: 'visa_free', emoji: '🇦🇱', flightH: 1.5 },
    { code: 'DXB', city: 'Dubai', country: 'BAE', visa: 'visa_on_arrival', emoji: '🇦🇪', flightH: 4 },
    { code: 'SSH', city: 'Sharm El-Sheikh', country: 'Mısır', visa: 'visa_on_arrival', emoji: '🇪🇬', flightH: 2 },
    { code: 'CAI', city: 'Kahire', country: 'Mısır', visa: 'visa_on_arrival', emoji: '🇪🇬', flightH: 2 },
    { code: 'MLE', city: 'Maldivler', country: 'Maldivler', visa: 'visa_on_arrival', emoji: '🇲🇻', flightH: 7 },
    { code: 'CDG', city: 'Paris', country: 'Fransa', visa: 'visa_required', emoji: '🇫🇷', flightH: 3.5 },
    { code: 'FCO', city: 'Roma', country: 'İtalya', visa: 'visa_required', emoji: '🇮🇹', flightH: 2.5 },
    { code: 'BCN', city: 'Barselona', country: 'İspanya', visa: 'visa_required', emoji: '🇪🇸', flightH: 3.5 },
    { code: 'AMS', city: 'Amsterdam', country: 'Hollanda', visa: 'visa_required', emoji: '🇳🇱', flightH: 3.5 },
    { code: 'BER', city: 'Berlin', country: 'Almanya', visa: 'visa_required', emoji: '🇩🇪', flightH: 3 },
    { code: 'VIE', city: 'Viyana', country: 'Avusturya', visa: 'visa_required', emoji: '🇦🇹', flightH: 2.5 },
    { code: 'PRG', city: 'Prag', country: 'Çekya', visa: 'visa_required', emoji: '🇨🇿', flightH: 2.5 },
    { code: 'BUD', city: 'Budapeşte', country: 'Macaristan', visa: 'visa_required', emoji: '🇭🇺', flightH: 2 },
    { code: 'ATH', city: 'Atina', country: 'Yunanistan', visa: 'visa_required', emoji: '🇬🇷', flightH: 1.5 },
    { code: 'LHR', city: 'Londra', country: 'İngiltere', visa: 'visa_required', emoji: '🇬🇧', flightH: 4 },
    { code: 'MXP', city: 'Milano', country: 'İtalya', visa: 'visa_required', emoji: '🇮🇹', flightH: 2.5 },
    { code: 'MAD', city: 'Madrid', country: 'İspanya', visa: 'visa_required', emoji: '🇪🇸', flightH: 4 },
    { code: 'LIS', city: 'Lizbon', country: 'Portekiz', visa: 'visa_required', emoji: '🇵🇹', flightH: 4.5 },
    { code: 'CPH', city: 'Kopenhag', country: 'Danimarka', visa: 'visa_required', emoji: '🇩🇰', flightH: 3 },
    { code: 'DBV', city: 'Dubrovnik', country: 'Hırvatistan', visa: 'visa_required', emoji: '🇭🇷', flightH: 2 },
    { code: 'RAK', city: 'Marakeş', country: 'Fas', visa: 'visa_free', emoji: '🇲🇦', flightH: 5 },
    { code: 'SIN', city: 'Singapur', country: 'Singapur', visa: 'visa_free', emoji: '🇸🇬', flightH: 10 },
    { code: 'KUL', city: 'Kuala Lumpur', country: 'Malezya', visa: 'visa_free', emoji: '🇲🇾', flightH: 10 },
    { code: 'DPS', city: 'Bali', country: 'Endonezya', visa: 'visa_on_arrival', emoji: '🇮🇩', flightH: 12 },
    { code: 'NRT', city: 'Tokyo', country: 'Japonya', visa: 'visa_free', emoji: '🇯🇵', flightH: 12 },
    { code: 'ICN', city: 'Seul', country: 'G. Kore', visa: 'visa_free', emoji: '🇰🇷', flightH: 10 },
    { code: 'JFK', city: 'New York', country: 'ABD', visa: 'visa_required', emoji: '🇺🇸', flightH: 11 },
]

// Helper: resolve city or IATA code to list of IATA codes
export function resolveAirportCodes(input) {
    if (!input) return []
    const lower = input.toLowerCase().trim()

    // Check city mapping first
    if (CITY_AIRPORTS[lower]) return CITY_AIRPORTS[lower]

    // Check if it's already an IATA code
    const upper = input.toUpperCase().trim()
    const byCode = AIRPORTS.find(a => a.code === upper)
    if (byCode) {
        // Also check if this city has multiple airports
        const cityLower = byCode.city.toLowerCase()
        return CITY_AIRPORTS[cityLower] || [upper]
    }

    // Fuzzy search by city name
    const match = AIRPORTS.find(a => a.city.toLowerCase() === lower)
    if (match) {
        const cityLower = match.city.toLowerCase()
        return CITY_AIRPORTS[cityLower] || [match.code]
    }

    return [upper] // fallback — treat as IATA code
}

// Helper: search airports/cities for autocomplete
export function searchAirports(query) {
    if (!query || query.length < 1) return []
    const q = query.toLowerCase().trim()
    const results = AIRPORTS.filter(a =>
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
    )
    // Dedupe by code, limit to 15
    const seen = new Set()
    return results.filter(a => {
        if (seen.has(a.code)) return false
        seen.add(a.code)
        return true
    }).slice(0, 15)
}
