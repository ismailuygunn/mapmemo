# 🗺️ MapMemo — Kurulum ve Deploy Rehberi

Bu rehber seni adım adım yönlendirecek. Kod bilmene gerek yok — sadece hesap aç, anahtarları yapıştır, "Deploy" tıkla.

---

## 📋 Genel Bakış

MapMemo, kız arkadaşınla birlikte kullanacağın bir seyahat haritası uygulaması:
- 🗺️ Dünya haritası üzerinde pin ekleme
- 📸 Fotoğraf/video yükleme
- 🏙️ Şehir bazlı albüm ve timeline
- 🤖 AI ile seyahat planı oluşturma
- 🌙 Dark/Light tema

---

## 🔑 ADIM 1: Supabase Hesabı Aç ve Proje Oluştur

1. **[supabase.com](https://supabase.com)** adresine git
2. **"Start your project"** butonuna tıkla
3. GitHub hesabınla giriş yap (veya e-posta ile kayıt ol)
4. **"New Project"** butonuna tıkla
5. Aşağıdaki bilgileri gir:
   - **Organization**: Varsayılan organizasyonu seç
   - **Name**: `mapmemo` yaz
   - **Database Password**: Güçlü bir şifre gir (bunu bir yere not et!)
   - **Region**: Sana en yakın bölgeyi seç (örn: Frankfurt)
6. **"Create new project"** tıkla
7. ⏳ 1-2 dakika bekle, proje hazırlanıyor

---

## 🗄️ ADIM 2: Veritabanı Tablolarını Oluştur (SQL Çalıştır)

1. Supabase Dashboard'dayken sol menüden **"SQL Editor"** tıkla
2. **"+ New Query"** butonuna tıkla
3. Projedeki `supabase/migration.sql` dosyasının **tüm içeriğini** kopyala
4. SQL Editor'e **yapıştır**
5. **"Run"** butonuna tıkla (veya Ctrl+Enter)
6. ✅ "Success. No rows returned" mesajı görmelisin

> ⚠️ Hata alırsan: SQL'i tekrar kopyalayıp yapıştırdığından emin ol. Bazen kopyalamada karakterler eksik kalabiliyor.

---

## 🔐 ADIM 3: Supabase Authentication Ayarları

1. Sol menüden **"Authentication"** → **"Providers"** tıkla
2. **"Email"** provider'ın açık olduğundan emin ol (varsayılan olarak açıktır)
3. **"Confirm email"** seçeneğini **kapat** (test için, daha sonra açabilirsin)
   - Authentication → Settings → "Enable email confirmations" → Kapat

---

## 🔒 ADIM 4: Supabase API Anahtarlarını Al

1. Sol menüden **"Settings"** → **"API"** tıkla
2. Şu değerleri kopyala ve bir yere kaydet:

| Değer | Nerede? |
|-------|---------|
| **Project URL** | Sayfanın üstünde "Project URL" başlığı altında |
| **anon public** | "Project API Keys" altında — `anon` `public` yazan |
| **service_role** | "Project API Keys" altında — `service_role` `secret` yazan (👁️ göz ikonuna tıkla) |

> ⚠️ **service_role** anahtarını kimseyle paylaşma! Bu anahtar tam yetkiye sahip.

---

## 🗺️ ADIM 5: Mapbox Hesabı Aç

1. **[mapbox.com](https://www.mapbox.com/)** adresine git
2. **"Sign Up"** tıkla ve hesap oluştur (ücretsiz)
3. Giriş yaptıktan sonra **Dashboard**'a git
4. **"Access Tokens"** bölümünde **"Default public token"** değerini kopyala

> 💡 Mapbox'un ücretsiz katmanı aylık 50.000 harita yüklemesi içerir — bu senin için fazlasıyla yeterli.

---

## 🤖 ADIM 6: OpenAI API Anahtarı Al

1. **[platform.openai.com](https://platform.openai.com/)** adresine git
2. Hesap oluştur veya giriş yap
3. Sol menüden **"API Keys"** tıkla
4. **"Create new secret key"** tıkla
5. İsim ver: `mapmemo`
6. Anahtarı kopyala (bu ekranı kapattıktan sonra tekrar göremezsin!)

> 💡 Harcama limiti koymak için: Settings → Billing → Usage Limits ayarını kullan. Her plan üretimi yaklaşık $0.01 tutuyor.

---

## 🚀 ADIM 7: Vercel'e Deploy Et

### 7a. GitHub'a Yükle (Tarayıcıdan — Terminal Gerektirmez!)

1. **[github.com](https://github.com)** adresine git ve giriş yap
2. Sağ üstteki **"+"** → **"New repository"** tıkla
3. Repository adı: `mapmemo`
4. ⚠️ **Önemli**: Altta "Add a README file" seçeneğini **işaretleme** (boş bırak)
5. **"Create repository"** tıkla
6. Açılan sayfada **"uploading an existing file"** linkine tıkla
7. Bilgisayarında şu klasörü aç: `/Users/socialmedia/.gemini/antigravity/scratch/mapmemo`
8. Bu klasörün **içindeki tüm dosya ve klasörleri seç** (⌘+A) ve GitHub sayfasındaki upload alanına **sürükle-bırak** yap
   - Yüklenmesi gereken başlıca klasörler: `src/`, `supabase/`, `public/`, ve dosyalar: `package.json`, `next.config.mjs`, `.env.example`, `SETUP_GUIDE.md`
   - **`.next` klasörünü yükleme** (build çıktısıdır, gerekli değil)
9. Altta "Commit changes" bölümünde mesaj yaz: `Initial commit`
10. **"Commit changes"** butonuna tıkla
11. ⏳ Yüklenmesini bekle (dosya boyutuna göre 1-3 dakika)

### 7b. Vercel'de Deploy

1. **[vercel.com](https://vercel.com)** adresine git
2. **"Sign Up"** → GitHub ile giriş yap
3. **"Import Project"** veya **"New Project"** tıkla
4. GitHub repo'larından **`mapmemo`** seçerek **"Import"** tıkla
5. **"Environment Variables"** bölümünde şu değişkenleri ekle:

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase'den aldığın Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase'den aldığın anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase'den aldığın service_role key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox'tan aldığın access token |
| `OPENAI_API_KEY` | OpenAI'dan aldığın API key |

6. Her birini tek tek ekle: **Name** kutusuna ismi, **Value** kutusuna değeri yapıştır → **"Add"** tıkla
7. Tüm değişkenleri ekledikten sonra **"Deploy"** tıkla
8. ⏳ 1-2 dakika bekle
9. ✅ **"Congratulations!"** ekranını gördüğünde uygulaman hazır!
10. Verilen URL'ye tıkla (örn: `mapmemo-xyz.vercel.app`)

---

## ✅ ADIM 8: Test Et

Uygulamayı açtığında şu adımları test et:

| # | Test | Beklenen |
|---|------|----------|
| 1 | Register sayfasını aç | Hesap oluşturma formu görünsün |
| 2 | Hesap oluştur | Onboarding sayfasına yönlensin |
| 3 | "Couple Space" oluştur | Invite linki görünsün |
| 4 | Invite linkini kopyala | Clipboard'a kopyalansın |
| 5 | Harita sayfasını aç | Mapbox harita tam ekran görsün |
| 6 | Bir pin ekle | Pin form açılsın, doldur, kaydet |
| 7 | Eklenen pin haritada görünsün | Emoji marker haritada olsun |
| 8 | Filtreleri dene | Visited/Planned/Wishlist çalışsın |
| 9 | Planner'da plan üret | AI itinerary dönsün |
| 10 | Settings'den tema değiştir | Dark/Light geçiş çalışsın |

---

## 📱 BONUS: Telefona Ekle (PWA)

### iPhone:
1. Safari'de uygulamayı aç
2. Alt barda **paylaş** (kare+ok) ikonuna tıkla
3. **"Ana Ekrana Ekle"** seç
4. ✅ Artık bir uygulama gibi açılıyor!

### Android:
1. Chrome'da uygulamayı aç
2. Üç nokta menüsünden **"Ana ekrana ekle"** seç
3. ✅ Hazır!

---

## 🔧 Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| "Supabase client error" | Environment variable'ları kontrol et, doğru yapıştırdığından emin ol |
| Harita görünmüyor | Mapbox token'ını kontrol et, `NEXT_PUBLIC_` ile başladığından emin ol |
| AI plan üretmiyor | OpenAI API key'ini ve bakiyeni kontrol et |
| Register olunca hata | Supabase → Auth → "Enable email confirmations" kapalı olsun |
| SQL hata | migration.sql'i tekrar kopyala, tüm SQL'i seç ve çalıştır |

---

## 🚀 v2 Backlog (İlerideki Özellikler)

- ☐ Offline/PWA — İnternetsiz pin ekleme
- ☐ Oylama modu — "Bu akşam nereye?" oylaması
- ☐ Aylık recap — Ay sonunda güzel bir özet
- ☐ Bütçe takibi — Her pin'e harcama ekle
- ☐ Calendar export — Trip'i takvime aktar
- ☐ Yorum/reaction — Pin altına yorum yapma
- ☐ Paylaşım linki — Read-only trip linki

---

🎉 **Tebrikler!** MapMemo artık hazır. Güzel yolculuklar! 🗺️💕
