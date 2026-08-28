# Yayın Öncesi Kontrol Listesi (İşletme Sahibi)

Kod hazır ve test edildi. Canlıya almak için sırasıyla şunlar yapılmalı. Teknik
ayrıntılar için `DEPLOY.md` / `OPS.md`.

## 1. Veritabanı
- [ ] Managed Postgres oluştur (Neon / Vercel Postgres / Supabase-Postgres).
- [ ] `DATABASE_URL` (havuzlu) ve gerekiyorsa `DIRECT_URL` (migration için) ayarla.

## 2. Ortam değişkenleri (Vercel → Project → Settings → Environment Variables)
- [ ] `DATABASE_URL` (+ `DIRECT_URL`)
- [ ] `SESSION_SECRET` — en az 32 karakter rastgele:
      `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
- [ ] `BLOB_READ_WRITE_TOKEN` — **görsel yüklemek için zorunlu.** Vercel → Storage →
      Blob deposu oluştur, token'ı kopyala. (Yoksa logo/foto yüklemesi reddedilir.)
- [ ] `NEXT_PUBLIC_SITE_URL` — canlı adres (örn. `https://menu.monohotelantalya.com`).
- [ ] `ADMIN_PASSWORD` — güçlü bir şifre (seed bunu hash'ler). **`1234` bırakma.**

## 3. Deploy
- [ ] Repoyu Vercel'e import et. Build otomatik migration çalıştırır (`vercel-build`).
- [ ] İlk kurulumda admin'i tohumla: `npm run seed:admin` (ADMIN_PASSWORD'u kullanır).
- [ ] İçerik tohumu (opsiyonel, sadece boş DB): `npm run seed:demo`.

## 4. İlk giriş & güvenlik
- [ ] `/tr/login` → şifre ile gir. (Login sayfası hiçbir yerden linklenmez; yer imine ekle.)
- [ ] **Ayarlar → Güvenlik**'ten şifreyi değiştir. (Varsayılan `1234` hâlâ aktifse
      Ayarlar sayfası üstte kırmızı uyarı gösterir.)

## 5. İçerik (senin bilgin)
- [ ] Gerçek **fiyatları** gir (ürün formundan ya da Excel yedeğini düzenleyip içe aktar).
- [ ] **EN/RU çeviriler + açıklamalar** (boş bırakılırsa Türkçesi gösterilir).
- [ ] Marka **logosu** ve mekan **wordmark**'larını yükle (Ayarlar → Marka / Mekanlar).
- [ ] İşletme footer notu (iletişim/adres) — opsiyonel (Ayarlar → İşletme).

## 6. QR & masa
- [ ] **Ayarlar → QR kodları**'ndan her mekanın QR'ını indir, masalara bas.

## 7. Veri güvenliği (ops)
- [ ] Managed Postgres **yedek/PITR** açık mı doğrula; bir **restore** dene.
- [ ] İlk **Excel yedeğini** indir ve sakla (Ayarlar → Yedek).
- [ ] (Öneri) Uygulama için **least-privilege DB** rolü kullan.

## 8. Son kontrol
- [ ] Menüyü telefonda 3 dilde gez; fiyat/görsel/QR doğru mu.
- [ ] Bir ürün ekle/düzenle/gizle/sil → menüde anında yansıyor mu.
- [ ] Çıkış yap; `/tr/login` dışında admin kontrolleri görünmüyor mu.
