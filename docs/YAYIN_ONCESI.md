# Yayın Öncesi Kontrol Listesi (İşletme Sahibi)

Kod hazır ve test edildi. Canlıya almak için sırasıyla şunlar yapılmalı. Teknik
ayrıntılar için `DEPLOY.md` / `OPS.md`.

## 1. Veritabanı
- [ ] Managed Postgres oluştur (Neon / Vercel Postgres / Supabase-Postgres).
- [ ] `DATABASE_URL` (havuzlu) **ve** `DIRECT_URL` (havuzsuz) ayarla. Çoğu managed
      Postgres havuzlu bağlantı verir; `prisma migrate deploy` havuzsuz bağlantı
      ister. Havuz kullanmıyorsan `DIRECT_URL`'i `DATABASE_URL` ile aynı yap.
      (`schema.prisma` `directUrl` bekler; onsuz `vercel-build` migration adımı hata verir.)

## 2. Ortam değişkenleri (Vercel → Project → Settings → Environment Variables)
- [ ] `DATABASE_URL` **+ `DIRECT_URL`** (migration için zorunlu — bkz. §1)
- [ ] `SESSION_SECRET` — en az 32 karakter rastgele:
      `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
- [ ] `BLOB_READ_WRITE_TOKEN` — **görsel yüklemek için zorunlu.** Vercel → Storage →
      Blob deposu oluştur, token'ı kopyala. (Yoksa logo/foto yüklemesi reddedilir.)
- [ ] `NEXT_PUBLIC_SITE_URL` — canlı adres (örn. `https://menu.monohotelantalya.com`).
- [ ] `ADMIN_PASSWORD` — güçlü bir şifre (seed bunu hash'ler). **`1234` bırakma.**
- [ ] `ADMIN_USERNAME` — *(opsiyonel)* giriş kullanıcı adı; boşsa `admin`.
- [ ] `BUSINESS_NAME` — *(opsiyonel)* seed'in oluşturduğu İşletme adı; boşsa `İşletme`
      (sonradan Ayarlar → İşletme'den değiştirilebilir).

## 3. Deploy
- [ ] Repoyu Vercel'e import et. Build otomatik migration çalıştırır (`vercel-build`).
- [ ] **Tek kurulum komutu:** `npm run seed:admin`
      → admin kullanıcısını (ADMIN_PASSWORD) **ve** bir Business kaydını oluşturur
      (adı `BUSINESS_NAME` env'inden, yoksa "İşletme"). Panelin çalışması için
      Business şart; bu komut onu garanti eder.
- [ ] İçerik tohumu **gerekmez** — menüyü panelden kuracaksın. (Sadece hazır demo
      içerik istersen `npm run seed:demo`; boş DB'ye çalışır.)

## 4. İlk giriş & menüyü kurma
- [ ] `/tr/login` → **kullanıcı adı** (varsayılan `admin`, ya da `ADMIN_USERNAME`) +
      **şifre** ile gir. (Login sayfası hiçbir yerden linklenmez; yer imine ekle.)
- [ ] **Ayarlar → Güvenlik**'ten şifreyi değiştir. (Varsayılan `1234` hâlâ aktifse
      Ayarlar sayfası üstte kırmızı uyarı gösterir.)
- [ ] **Ayarlar → Mekanlar → Mekan ekle** ile ilk mekanı oluştur (örn. Terrace).
- [ ] Mekanın sayfasında **Kategori ekle**, sonra her kategoride **Ürün ekle** ile menüyü kur.

## 5. İçerik (senin bilgin)
- [ ] Gerçek **fiyatları** gir (ürün formundan ya da Excel yedeğini düzenleyip içe aktar).
- [ ] **EN/RU çeviriler + açıklamalar** (boş bırakılırsa Türkçesi gösterilir).
- [ ] Marka **logosu** ve mekan **wordmark**'larını yükle (Ayarlar → Marka / Mekanlar).
- [ ] İşletme adı + footer notu (iletişim/adres) — Ayarlar → İşletme.

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
