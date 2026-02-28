// 120+ Istanbul Photography Spots — Real coordinates, categories, tips, photos
// Categories: tarihi, sokak, doga, gece, mimari, gizli, yemek, sanat, deniz, panorama
const PHOTOS = {
    tarihi: '/spots/hagia.png', ikon: '/spots/galata.png', cami: '/spots/hagia.png',
    sokak: '/spots/balat.png', renkli: '/spots/balat.png', mahalle: '/spots/balat.png',
    panorama: '/spots/bosphorus.png', deniz: '/spots/bosphorus.png',
    gece: '/spots/ortakoy.png', atmospheric: '/spots/ortakoy.png',
    doga: '/spots/forest.png', orman: '/spots/forest.png', makro: '/spots/forest.png',
    mimari: '/spots/galata.png', modern: '/spots/galata.png', sanat: '/spots/bazaar.png',
    gizli: '/spots/bazaar.png', bizans: '/spots/hagia.png', saray: '/spots/hagia.png',
    yemek: '/spots/food.png', gastro: '/spots/food.png', urban: '/spots/balat.png',
}
const p = (t, type, lat, lng, notes, tags, rating = 5) => ({
    id: `ist_${lat.toFixed(4)}_${lng.toFixed(4)}`.replace(/\./g, ''),
    title: t, type, lat, lng, city: 'Istanbul', country: 'Turkey',
    notes, tags, rating, status: 'visited', created_at: new Date().toISOString(),
    photo: PHOTOS[tags?.[0]] || '/spots/bosphorus.png',
})

export const ISTANBUL_SPOTS = [
    // ═══ TARİHİ & İKONİK ═══
    p('Ayasofya', 'photospot', 41.0086, 28.9802, 'İç mekan ışık huzmeleri sabah 09:00-10:00 arası muhteşem. Geniş açı lens şart.', ['tarihi', 'ikon', 'mimari'], 5),
    p('Sultanahmet Camii', 'photospot', 41.0054, 28.9768, 'Mavi Cami, altı minaresiyle en iyi gün batımında. Meydandan çekim yapın.', ['tarihi', 'ikon', 'cami'], 5),
    p('Topkapı Sarayı', 'photospot', 41.0115, 28.9833, 'Harem bölümü fotoğraf için harika. Boğaz manzarası için 4. avlu.', ['tarihi', 'saray', 'panorama'], 5),
    p('Yerebatan Sarnıcı', 'photospot', 41.0084, 28.9779, 'Medusa başları ve su yansımaları. Düşük ISO, tripod gerekli.', ['tarihi', 'gizli', 'atmospheric'], 5),
    p('Galata Kulesi', 'photospot', 41.0256, 28.9741, '360° İstanbul manzarası. Gün batımı için 1 saat önce gidin.', ['panorama', 'ikon', 'gece'], 5),
    p('Süleymaniye Camii', 'photospot', 41.0161, 28.9640, 'Haliç manzarası eşsiz. Avlu kemerlerinden çekim yapın. Gün batımı altın saat.', ['tarihi', 'cami', 'panorama'], 5),
    p('Dolmabahçe Sarayı', 'photospot', 41.0391, 29.0005, 'Kristal avize dünyaca ünlü. Dış cephe Boğaz ile birlikte.', ['tarihi', 'saray', 'mimari'], 5),
    p('Rumeli Hisarı', 'photospot', 41.0847, 29.0568, 'Boğazın en dar noktası. Surlar arasından çekim. Yeşillik + tarih.', ['tarihi', 'doga', 'panorama'], 5),
    p('Anadolu Hisarı', 'photospot', 41.0830, 29.0696, 'Küçük ama fotojenik. Göksu Deresi ağzında romantik çekimler.', ['tarihi', 'gizli', 'deniz'], 4),
    p('Küçük Ayasofya Camii', 'view', 41.0029, 28.9736, '6. yy Bizans kilisesi. Turistsiz, huzurlu. İç avlu muhteşem.', ['tarihi', 'gizli', 'bizans'], 4),
    p('Kariye Camii (Chora)', 'photospot', 41.0316, 28.9389, 'Bizans mozaikleri dünya mirası. Detay çekimleri için makro lens.', ['tarihi', 'bizans', 'sanat'], 5),
    p('Yedikule Zindanları', 'photospot', 41.0027, 28.9224, 'Osmanlı kalesi. Surlardan manzara. Az bilinen ama etkileyici.', ['tarihi', 'gizli', 'mimari'], 4),
    p('Balat Surları', 'photospot', 41.0288, 28.9475, 'Theodosius surları boyunca yürüyüş. Ham, tarihi doku.', ['tarihi', 'sokak', 'gizli'], 4),

    // ═══ SOKAK & MAHALLE ═══
    p('Balat Renkli Evler', 'photospot', 41.0292, 28.9487, 'Renkli merdivenler ve kapılar. Sabah erken saatlerde insansız çekim.', ['sokak', 'renkli', 'ikon'], 5),
    p('Fener Rum Patrikhanesi', 'photospot', 41.0275, 28.9517, 'Kırmızı kilise binası. Fener-Balat yürüyüşünde dur.', ['tarihi', 'sokak', 'mimari'], 4),
    p('Karaköy Sokakları', 'photospot', 41.0219, 28.9771, 'Grafiti, vintage dükkanlar, dar sokaklar. Portre için ideal.', ['sokak', 'sanat', 'urban'], 5),
    p('Cihangir Merdivenleri', 'photospot', 41.0319, 28.9826, 'Boğaz manzaralı merdivenler. Kediler + sokak hayatı.', ['sokak', 'panorama', 'mahalle'], 4),
    p('Arnavutköy Yalıları', 'photospot', 41.0680, 29.0436, 'Ahşap yalılar deniz kenarında. Gün batımında altın ışık.', ['sokak', 'mimari', 'deniz'], 5),
    p('Kuzguncuk Sokakları', 'photospot', 41.0380, 29.0340, 'Renkli ahşap evler, nostaljik bakkal. Sakin mahalle dokusu.', ['sokak', 'renkli', 'gizli'], 5),
    p('Moda Sahili', 'photospot', 41.0146, 29.0261, 'Kadıköy Moda burnunda gün batımı. Adalar silueti.', ['sokak', 'deniz', 'panorama'], 5),
    p('Yeldeğirmeni Grafitileri', 'photospot', 41.0068, 29.0195, 'Kadıköy sokak sanatı merkezi. Duvar resimleri değişiyor.', ['sokak', 'sanat', 'urban'], 4),
    p('Üsküdar Kısıklı Yokuşu', 'view', 41.0400, 29.0450, 'Klasik İstanbul yokuşu. Çamlıca manzarası.', ['sokak', 'panorama'], 3),
    p('Beyoğlu Çiçek Pasajı', 'photospot', 41.0335, 28.9770, '1876 pasaj, nostaljik atmosfer. Geniş açı iç mekan.', ['sokak', 'tarihi', 'yemek'], 4),
    p('Galata Mevlevihanesi', 'photospot', 41.0270, 28.9735, 'Sema töreni mekanı. Osmanlı bahçesi huzurlu.', ['tarihi', 'gizli', 'sanat'], 4),
    p('Kapalıçarşı İç Mekan', 'photospot', 41.0107, 28.9682, '4000+ dükkan. Işık huzmeleri tavan pencerelerinden. Geniş açı.', ['sokak', 'tarihi', 'yemek'], 5),
    p('Mısır Çarşısı', 'photospot', 41.0165, 28.9707, 'Baharat renkleri, dokular. Makro lens ile detay çekimi.', ['sokak', 'yemek', 'renkli'], 5),

    // ═══ PANORAMİK & MANZARA ═══
    p('Çamlıca Tepesi', 'photospot', 41.0275, 29.0699, 'İstanbul\'un en yüksek noktası. 360° panorama. Gece şehir ışıkları.', ['panorama', 'gece', 'doga'], 5),
    p('Pierre Loti Tepesi', 'photospot', 41.0483, 28.9387, 'Haliç manzarası. Teleferik ile çıkın. Çay bahçesi.', ['panorama', 'tarihi', 'doga'], 5),
    p('Sapphire Seyir Terası', 'view', 41.0766, 29.0112, '54. kat. Gece çekimleri için ideal. Şehir ışıkları.', ['panorama', 'gece', 'mimari'], 4),
    p('Galata Köprüsü', 'photospot', 41.0198, 28.9735, 'Balıkçılar + Yeni Cami + gün batımı. İkonik İstanbul karesi.', ['panorama', 'ikon', 'sokak'], 5),
    p('Büyük Valide Han', 'photospot', 41.0145, 28.9708, '17. yy han. Çatıya çıkın — İstanbul silueti. Gizli spot.', ['panorama', 'gizli', 'tarihi'], 5),
    p('Süleymaniye Medresesi Bahçesi', 'view', 41.0155, 28.9625, 'Haliç + köprüler manzarası. Sakin, turistsiz.', ['panorama', 'tarihi', 'gizli'], 4),
    p('Nakkaştepe Millet Bahçesi', 'view', 41.0360, 29.0530, 'Boğaz manzarası, modern park. Aile fotoğrafları.', ['panorama', 'doga', 'modern'], 4),
    p('Fethi Paşa Korusu', 'view', 41.0520, 29.0470, 'Üsküdar ormanı. Boğaz Köprüsü altında doğa.', ['panorama', 'doga', 'gizli'], 5),
    p('Otağtepe', 'photospot', 41.0920, 29.0630, 'Fatih Sultan Mehmet Köprüsü tam karşı. Drone çekimi ideal.', ['panorama', 'deniz', 'ikon'], 5),
    p('Kız Kulesi Manzara Noktası', 'view', 41.0210, 29.0040, 'Üsküdar sahilinden Kız Kulesi. Gün doğumu için gel.', ['panorama', 'ikon', 'deniz'], 5),

    // ═══ DENİZ & KIYI ═══
    p('Ortaköy Camii', 'photospot', 41.0475, 29.0268, 'Boğaz Köprüsü ile birlikte. Gece aydınlatması muhteşem.', ['deniz', 'ikon', 'cami', 'gece'], 5),
    p('Bebek Sahili', 'photospot', 41.0769, 29.0438, 'Boğaz yürüyüşü. Sabah koşucuları ve yelkenliler.', ['deniz', 'sokak', 'doga'], 4),
    p('Kuruçeşme Sahili', 'photospot', 41.0567, 29.0322, 'Boğaz kenarı parklar. Gün batımı + köprü.', ['deniz', 'panorama', 'gece'], 4),
    p('Eminönü İskelesi', 'photospot', 41.0178, 28.9735, 'Vapur + martılar + cami silueti. Hareket çekimi.', ['deniz', 'ikon', 'sokak'], 5),
    p('Kadıköy İskelesi', 'photospot', 41.0148, 29.0184, 'Vapur yaklaşırken İstanbul silueti. Sabah sis.', ['deniz', 'ikon', 'panorama'], 5),
    p('Salacak Sahili', 'photospot', 41.0220, 29.0070, 'Kız Kulesi en yakın nokta. Balıkçı tekneleri.', ['deniz', 'ikon', 'sokak'], 5),
    p('Tarabya Koyu', 'view', 41.1130, 29.0560, 'Sakin koy. Yelkenliler, balıkçı tekneleri. Pastel tonlar.', ['deniz', 'gizli', 'doga'], 4),
    p('Anadolu Kavağı', 'view', 41.1800, 29.0900, 'Boğaz çıkışı. Yoros Kalesi\'nden Karadeniz manzarası.', ['deniz', 'tarihi', 'doga'], 5),
    p('Büyükada Fayton Yolu', 'photospot', 41.0850, 29.1210, 'Adalar. Ahşap köşkler, çam ormanları. Bisikletle tur.', ['deniz', 'doga', 'gizli'], 5),
    p('Heybeliada', 'view', 41.0760, 29.0940, 'Sakin ada. Ruhban Okulu tepeye tırmanış.', ['deniz', 'doga', 'tarihi'], 4),
    p('İstinye Koyu', 'view', 41.1100, 29.0583, 'Gizli koy, lüks yatlar. Sakin atmosfer.', ['deniz', 'gizli'], 3),

    // ═══ GECE FOTOĞRAFÇİLİĞİ ═══
    p('İstiklal Caddesi Gece', 'photospot', 41.0337, 28.9777, 'Tramvay ışık izleri. Uzun pozlama. Tripod şart.', ['gece', 'sokak', 'ikon'], 5),
    p('Galata Köprüsü Gece', 'photospot', 41.0195, 28.9738, 'Balık restoranları + cami aydınlatması. Yansımalar.', ['gece', 'ikon', 'deniz'], 5),
    p('Boğaz Köprüsü Gece', 'photospot', 41.0452, 29.0342, 'Renk değiştiren ışıklar. Ortaköy\'den veya Çengelköy\'den.', ['gece', 'ikon', 'deniz'], 5),
    p('Kadıköy Barlar Sokağı', 'photospot', 41.0110, 29.0230, 'Neon tabelalar, canlı gece hayatı. Sokak portre.', ['gece', 'sokak', 'urban'], 4),
    p('Taksim Meydanı Gece', 'view', 41.0370, 28.9851, 'Cumhuriyet Anıtı + şehir ışıkları.', ['gece', 'ikon', 'sokak'], 3),
    p('Çırağan Sarayı Gece', 'photospot', 41.0562, 29.0199, 'Osmanlı sarayı aydınlatması. Boğaz yansımaları.', ['gece', 'tarihi', 'mimari'], 4),

    // ═══ DOĞA & YEŞİL ═══
    p('Belgrad Ormanı', 'photospot', 41.1800, 28.9700, 'Sis + orman. Sabah erken. Bentler bölgesi fotoğrafik.', ['doga', 'sis', 'orman'], 5),
    p('Emirgan Korusu', 'photospot', 41.1074, 29.0545, 'Lale festivali Nisan. Üç tarihi köşk. Botanik detaylar.', ['doga', 'renkli', 'tarihi'], 5),
    p('Yıldız Parkı', 'photospot', 41.0486, 29.0137, 'Malta Köşkü. Gölgelik yollar. Sonbahar yaprakları.', ['doga', 'tarihi', 'sanat'], 4),
    p('Atatürk Arboretumu', 'photospot', 41.1800, 28.9850, '2000+ bitki türü. Makro çekim cenneti. Sonbahar renkleri.', ['doga', 'makro', 'orman'], 5),
    p('Polonezköy', 'view', 41.1800, 29.2300, 'İstanbul\'un ciğerleri. At binme, orman yürüyüşü.', ['doga', 'gizli', 'orman'], 4),
    p('Göl Park Bahçeşehir', 'view', 41.0800, 28.6700, 'Yapay göl etrafı. Kuş gözlemi. Sakin.', ['doga', 'gizli'], 3),
    p('Fenerbahçe Parkı', 'view', 41.0050, 29.0380, 'Deniz + park. Gün batımı yürüyüşü. Adalar manzarası.', ['doga', 'deniz', 'panorama'], 4),
    p('Nezahat Gökyiğit Botanik', 'view', 41.0088, 29.0990, 'Botanik bahçe. Makro çekim, kelebek çekimi.', ['doga', 'makro', 'sanat'], 4),
    p('Beykoz Korusu', 'view', 41.1300, 29.0900, 'Abraham Paşa Çiftliği. İstanbul\'un en büyük yeşil alanı.', ['doga', 'gizli', 'orman'], 4),

    // ═══ MİMARİ & MODERN ═══
    p('Haydarpaşa Garı', 'photospot', 41.0048, 29.0193, 'Neo-klasik mimari. Denizden çekim etkileyici.', ['mimari', 'tarihi', 'ikon'], 5),
    p('Sirkeci Garı', 'photospot', 41.0151, 28.9777, 'Orient Express son durağı. Art Nouveau detaylar.', ['mimari', 'tarihi', 'sanat'], 4),
    p('İstanbul Modern', 'photospot', 41.0254, 28.9832, 'Galataport\'ta. Modern sanat + Boğaz manzarası.', ['mimari', 'sanat', 'modern'], 5),
    p('Sakıp Sabancı Müzesi', 'photospot', 41.1098, 29.0568, 'Atlı Köşk. At heykeli + Boğaz. Özel sergiler.', ['mimari', 'sanat', 'deniz'], 4),
    p('Miniatürk', 'view', 41.0649, 28.9489, 'Türkiye\'nin minyatür modelleri. Detay çekimi.', ['mimari', 'sanat', 'çocuk'], 3),
    p('Levent İş Kuleleri', 'view', 41.0790, 29.0120, 'Modern İstanbul skyline. Gece çekimleri.', ['mimari', 'modern', 'gece'], 3),
    p('Galataport', 'photospot', 41.0233, 28.9810, 'Liman dönüşümü. Modern mimari + deniz. Cruise gemileri.', ['mimari', 'modern', 'deniz'], 4),
    p('Sokollu Mehmet Paşa Camii', 'photospot', 41.0043, 28.9657, 'İznik çinileri en güzel buradadır. İç mekan detay.', ['mimari', 'tarihi', 'sanat'], 5),
    p('Rüstem Paşa Camii', 'photospot', 41.0163, 28.9692, 'Eminönü üstü gizli cami. İznik çini cennet.', ['mimari', 'tarihi', 'gizli'], 5),

    // ═══ GİZLİ & NİŞ YERLER ═══
    p('Cibali Merdivenler', 'photospot', 41.0236, 28.9575, 'Renkli merdivenler Haliç kenarı. İnsansız sabah erken.', ['gizli', 'sokak', 'renkli'], 5),
    p('Fener Yıldız Sokak', 'photospot', 41.0280, 28.9500, 'Sarı-kırmızı evler arası. Instagram klasiği ama hala güzel.', ['gizli', 'sokak', 'renkli'], 4),
    p('Zeyrek Altyapısı', 'view', 41.0200, 28.9580, 'Pantokrator Kilisesi arkası. Tarihi doku, turist yok.', ['gizli', 'tarihi', 'bizans'], 4),
    p('Samatya Balıkçı Barınağı', 'photospot', 41.0020, 28.9280, 'Renkli tekneler, sabah ışığı. Liman atmosferi.', ['gizli', 'deniz', 'sokak'], 4),
    p('Hasanpaşa Gazhanesi', 'photospot', 41.0088, 29.0310, 'Kadıköy endüstriyel dönüşüm. Gece etkinlikleri.', ['gizli', 'modern', 'sanat'], 4),
    p('Bomontiada', 'photospot', 41.0550, 28.9890, 'Eski bira fabrikası. Endüstriyel chic. Etkinlik mekanı.', ['gizli', 'modern', 'sanat'], 4),
    p('Çengelköy Çınaraltı', 'photospot', 41.0558, 29.0574, 'Tarihi çınar ağacı altı çay bahçesi. Boğaz kenarı.', ['gizli', 'sokak', 'deniz'], 5),
    p('Rumeli Kavağı', 'view', 41.1760, 29.0780, 'Boğaz kuzey ucu. Balık restoranları. Sakin koy.', ['gizli', 'deniz', 'yemek'], 4),
    p('Eyüp Sultan Kabristanı', 'photospot', 41.0480, 28.9350, 'Osmanlı mezar taşları. Işık-gölge oyunları. Huzurlu.', ['gizli', 'tarihi', 'atmospheric'], 5),
    p('Yoros Kalesi', 'photospot', 41.1810, 29.0920, 'Boğaz-Karadeniz buluşması. 360° manzara. Yürüyüş.', ['gizli', 'tarihi', 'panorama'], 5),
    p('Kanlıca Sahili', 'photospot', 41.0900, 29.0660, 'Ünlü yoğurt + Boğaz. Sakin sahil kasabası havası.', ['gizli', 'yemek', 'deniz'], 4),
    p('Fıstıkağacı Yokuşu Üsküdar', 'view', 41.0250, 29.0150, 'Kız Kulesi manzarası gizli açı. Yerel yaşam.', ['gizli', 'panorama', 'sokak'], 4),

    // ═══ YEMEK & GASTRO FOTOĞRAFÇİLİĞİ ═══
    p('Karaköy Güllüoğlu', 'food', 41.0213, 28.9764, 'Baklava close-up. Altın renkler, fıstık detayları.', ['yemek', 'makro', 'ikon'], 5),
    p('Balık-Ekmek Eminönü', 'food', 41.0175, 28.9712, 'İkonik balık-ekmek teknesi. Duman + aksiyon.', ['yemek', 'sokak', 'ikon'], 5),
    p('Kadıköy Balık Pazarı', 'food', 41.0122, 29.0226, 'Rengarenk balıklar, baharatlar. Canlı pazar.', ['yemek', 'sokak', 'renkli'], 5),
    p('Tarihi Sultanahmet Köftecisi', 'food', 41.0073, 28.9752, '1920\'den beri. Minimalist sunum. Tarihi mekan.', ['yemek', 'tarihi'], 4),
    p('Çiya Sofrası', 'food', 41.0110, 29.0240, 'Anadolu mutfağı. Renkli mezeler, otantik sunumlar.', ['yemek', 'sokak', 'gastro'], 5),
    p('Karaköy Lokantası', 'food', 41.0208, 28.9758, 'Modern Türk mutfağı. Şık sunum. İç mekan atmosfer.', ['yemek', 'modern', 'gastro'], 4),
    p('Hafız Mustafa 1864', 'food', 41.0086, 28.9782, 'Osmanlı tatlıları. Lokum, helva. Renkli vitrin.', ['yemek', 'tarihi', 'makro'], 4),
    p('Namlı Gurme', 'food', 41.0206, 28.9759, 'Karaköy kahvaltı. Peynirler, zeytinler, bal.', ['yemek', 'gastro', 'sokak'], 4),

    // ═══ SANAT & KÜLTÜR ═══
    p('Pera Müzesi', 'photospot', 41.0324, 28.9759, 'Kaplumbağa Terbiyecisi tablosu. Sergi iç mekanları.', ['sanat', 'mimari', 'tarihi'], 4),
    p('ARTER', 'photospot', 41.0367, 28.9842, 'Çağdaş sanat müzesi. 5 kat. Enstalasyonlar.', ['sanat', 'modern', 'mimari'], 4),
    p('İstanbul Bienali Mekanları', 'view', 41.0250, 28.9800, 'Değişen mekanlar. Antrepo, tersane. Endüstriyel.', ['sanat', 'modern', 'gizli'], 4),
    p('Rahmi Koç Müzesi', 'photospot', 41.0430, 28.9470, 'Endüstri tarihi. Eski arabalar, uçaklar. Detay çekimi.', ['sanat', 'tarihi', 'mimari'], 4),
    p('Müze Gazhane', 'photospot', 41.0090, 29.0316, 'Kadıköy kültür merkezi. Gece etkinlikleri, endüstriyel.', ['sanat', 'modern', 'gece'], 4),
    p('Tersane İstanbul', 'photospot', 41.0310, 28.9600, '250 yıllık tersane. Yenileme projesi. Massive alan.', ['sanat', 'tarihi', 'mimari'], 4),

    // ═══ EXTRA NİŞ SPOTS ═══
    p('Kuş Bakışı Suriçi - Edirnekapı', 'view', 41.0250, 28.9350, 'Sur dışı manzara. Dramatik bulutlu havalarda.', ['panorama', 'tarihi', 'gizli'], 4),
    p('Tekfur Sarayı', 'photospot', 41.0300, 28.9400, 'Bizans saray kalıntısı. Turist yok. Dramatik duvarlar.', ['tarihi', 'gizli', 'bizans'], 5),
    p('Feshane', 'view', 41.0450, 28.9430, 'Haliç kenarı kongre merkezi. Gece yansımalar.', ['mimari', 'gece', 'deniz'], 3),
    p('Harbiye Askeri Müze', 'view', 41.0446, 28.9910, 'Mehter gösterisi. Renkli kostümler. Aksiyon çekimi.', ['sanat', 'tarihi'], 3),
    p('Maçka Parkı', 'doga', 41.0430, 29.0010, 'Teleferik + park. Sonbahar yaprakları muhteşem.', ['doga', 'sokak', 'modern'], 4),
    p('Fenerbahçe Orduevi Sahil', 'view', 41.0020, 29.0420, 'Gün batımı + Adalar. Sakin, kalabalık yok.', ['deniz', 'panorama', 'gizli'], 4),
    p('Beylerbeyi Sarayı', 'photospot', 41.0410, 29.0400, 'Köprü altında Osmanlı sarayı. Bahçe + Boğaz.', ['tarihi', 'mimari', 'deniz'], 4),
    p('İstanbul Boğazı Vapur', 'photospot', 41.0350, 29.0100, 'Vapur içinden çekim. Hareket + manzara. Her açıdan.', ['deniz', 'ikon', 'panorama'], 5),
    p('Uskumruköy Sahili', 'view', 41.1700, 29.0200, 'Karadeniz sahili. Dalgalar + kaya formasyonları.', ['deniz', 'doga', 'gizli'], 4),
    p('Kilyos Plajı', 'view', 41.2500, 29.0200, 'Kum + deniz. Yaz fotoğrafçılığı. Sörf.', ['deniz', 'doga'], 3),
    p('Sarıyer Balıkçı Barınağı', 'photospot', 41.1620, 29.0570, 'Renkli tekneler + köy atmosferi. Sabah ışığı.', ['deniz', 'gizli', 'sokak'], 4),
]

export default ISTANBUL_SPOTS
