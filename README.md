<h1 align="center">
  <br>
  🚀 CabaStack Control Panel
  <br>
</h1>

<h4 align="center">Tauri v2, Rust ve React ile geliştirilmiş, ultra hafif, taşınabilir ve modern WAMP/XAMPP alternatifi web geliştirme ortamı.</h4>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-v2.0-24C8D8?style=flat-square&logo=tauri&logoColor=white" alt="Tauri">
  <img src="https://img.shields.io/badge/Rust-Backend-000000?style=flat-square&logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/PHP-8.3-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP">
  <img src="https://img.shields.io/badge/MariaDB-Included-003545?style=flat-square&logo=mariadb&logoColor=white" alt="MariaDB">
</p>

<hr>

## 🌟 Neden CabaStack?

Geleneksel geliştirme ortamları (XAMPP, WAMP) genellikle sistem kaynaklarını tüketir, yavaş başlar ve modern frontend teknolojilerinden yoksundur. **CabaStack**, Tauri v2'nin gücünü kullanarak Chromium tabanlı hantal yapılar (Electron) yerine, işletim sisteminin yerleşik WebView'unu kullanır. Bu sayede **neredeyse sıfır RAM tüketimiyle** arka planda şimşek hızında çalışır.

## ✨ Temel Özellikler

- **📦 Bağımlılık Gerektirmez:** PHP, MariaDB, phpMyAdmin ve SSL araçları (`mkcert`) doğrudan projenin içine gömülüdür (`resources`). Kullanıcının bilgisayarına ekstra hiçbir şey kurmasına gerek kalmaz.
- **🔒 Tek Tıkla Yerel SSL:** Geliştirme ortamınız için saniyeler içinde `mkcert` entegrasyonu ile "Güvenilir" yerel SSL sertifikaları üretir.
- **🔄 Akıllı Otomatik Güncelleme (Auto-Updater):** Özel yapılandırılmış JSON API'si üzerinden yeni sürümleri algılar ve sessizce günceller.
- **🛡️ Dinamik ve Güvenli Dosya Yolları:** Rust backend'i kullanılarak Windows genişletilmiş yol (`\\?\`) sorunları tamamen çözülmüştür, PHP ve MariaDB kusursuz iletişim kurar.
- **⚡ Kullanıcı Bazlı Kurulum:** Yönetici izni (UAC) krizlerini aşmak için `currentUser` modunda (NSIS) paketlenmiştir, Windows'ta `htdocs` klasörüne dosya atarken asla yetki hatası vermez.

---

## 🏗️ Proje Mimarisi (Klasör Yapısı)

Projeyi indirdiğinizde, çekirdek servislerin düzgün çalışabilmesi için `src-tauri` altında şu yapı bulunur:

```text
cabastack/
├── src/                # React tabanlı Frontend arayüzü
├── src-tauri/          # Rust tabanlı Backend & Tauri konfigürasyonları
│   ├── htdocs/         # Web projelerinizin (PHP/HTML) çalışacağı kök dizin
│   ├── mysql/          # MariaDB / MySQL çalıştırılabilir dosyaları ve veri tabanları
│   ├── php/            # PHP derleyicisi (php.exe) ve ayar dosyaları
│   ├── phpmyadmin/     # Veri tabanı yönetimi için arayüz
│   └── ssl/            # mkcert aracı ve üretilen sertifikalar
└── tauri.conf.json     # Uygulamanın beyni, derleme ve güncelleme ayarları
