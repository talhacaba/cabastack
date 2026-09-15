<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CabaStack • Yerel Geliştirme Ortamı</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#050508] text-zinc-100 font-sans min-h-screen flex flex-col justify-between selection:bg-emerald-500/30 overflow-x-hidden">

    <!-- Arka Plan Parlama Efektleri -->
    <div class="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[160px] pointer-events-none"></div>

    <!-- Ana İçerik -->
    <main class="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-12 w-full flex-1 flex flex-col justify-center items-center text-center">
        
        <!-- Rozet / Badge -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            CabaStack Environment Aktif
        </div>

        <!-- Büyük Başlık -->
        <h1 class="text-4xl sm:text-6xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 leading-tight">
            Geliştirme Ortamını <br/>Tercih Ettiğiniz İçin Teşekkürler!
        </h1>

        <p class="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-10 font-mono leading-relaxed">
            XAMPP ve hantal kurulumların ötesinde; yüksek performanslı, modern ve tamamen senin kontrolünde olan <strong class="text-zinc-200">CabaStack</strong> ile kodlamaya hazırsın.
        </p>

        <!-- Hızlı İşlem Butonları -->
        <div class="flex flex-wrap items-center justify-center gap-4 mb-14">
            <a href="http://localhost:8000/phpmyadmin/" target="_blank" class="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-bold text-xs tracking-wide transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center gap-2">
                <span>🗄️</span> PhpMyAdmin Panele Git
            </a>
            <a href="https://github.com" target="_blank" class="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-mono text-xs transition-all border border-zinc-800 flex items-center gap-2">
                <span>⚡</span> Proje Klasörünü Aç
            </a>
        </div>

        <!-- Bilgi Kartları Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
            
            <div class="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl backdrop-blur-md">
                <div class="text-emerald-400 mb-2 font-mono text-xs uppercase tracking-wider">01. Sunucu</div>
                <h3 class="font-bold text-sm text-zinc-200 mb-1">PHP 8.3 Entegre</h3>
                <p class="text-xs text-zinc-500">Yerleşik dahili sunucu ile anında çalışan test ortamı.</p>
            </div>

            <div class="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl backdrop-blur-md">
                <div class="text-cyan-400 mb-2 font-mono text-xs uppercase tracking-wider">02. Veritabanı</div>
                <h3 class="font-bold text-sm text-zinc-200 mb-1">MariaDB Engine</h3>
                <p class="text-xs text-zinc-500">Hızlı, hafif ve kesintisiz veritabanı altyapısı.</p>
            </div>

            <div class="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl backdrop-blur-md">
                <div class="text-indigo-400 mb-2 font-mono text-xs uppercase tracking-wider">03. Güvenlik</div>
                <h3 class="font-bold text-sm text-zinc-200 mb-1">Yerel SSL (.test)</h3>
                <p class="text-xs text-zinc-500">mkcert destekli güvenli yerel domain sertifikaları.</p>
            </div>

        </div>

    </main>

    <!-- Footer -->
    <footer class="text-center py-6 border-t border-zinc-900/80 z-10 select-none">
        <p class="text-[11px] font-mono text-zinc-500">
            CabaStack Environment Manager • Designed & Developed by <strong class="text-zinc-400 font-semibold">Talha Caba</strong>
        </p>
    </footer>

</body>
</html>