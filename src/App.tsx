import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import './App.css';

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Çekirdek yükleniyor...");

  const [phpRunning, setPhpRunning] = useState(false);
  const [mysqlRunning, setMysqlRunning] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [domain, setDomain] = useState("projem.test");
  const [phpPort, setPhpPort] = useState("8000");
  const [mysqlPort, setmysqlPort] = useState("3306");
  const [isUpdating, setIsUpdating] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const now = new Date();
    const time = now.toLocaleTimeString('tr-TR', { hour12: false });
    setLogs(prev => [...prev, { id: Date.now(), time, message, type }]);
  };

  // --- KLAVYE KISAYOLLARINI ENGELLEME (F12, Ctrl+Shift+I vb.) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  // -------------------------------------------------------------

  useEffect(() => {
    const timer1 = setTimeout(() => setLoadingText("PHP 8.3 & MariaDB taranıyor..."), 500);
    const timer2 = setTimeout(() => setLoadingText("Hosts ve port izinleri kontrol ediliyor..."), 1000);
    const timer3 = setTimeout(() => {
      setIsLoading(false);
      addLog('CabaStack Control Panel v0.1.0 başarıyla başlatıldı.', 'success');
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);
  const togglePhp = async () => {
    try {
      if (phpRunning) {
        await invoke('stop_php');
        addLog('PHP 8.3 servisi durduruldu.', 'info');
        setPhpRunning(false);
      } else {
        addLog(`PHP 8.3 başlatılıyor (Port: ${phpPort})...`, 'info');
        const response = await invoke('start_php', { port: phpPort }) as String;
        addLog(response.toString(), 'success');
        setPhpRunning(true);
      }
    } catch (error) {
      addLog(`PHP Kritik Hata: ${error}`, 'error');
    }
  };

  const toggleMysql = async () => {
    try {
      if (mysqlRunning) {
        await invoke('stop_mysql');
        addLog('MariaDB servisi durduruldu.', 'info');
        setMysqlRunning(false);
      } else {
        addLog(`MariaDB başlatılıyor (Port: ${mysqlPort})...`, 'info');
        const response = await invoke('start_mysql', { port: mysqlPort }) as String;
        addLog(response.toString(), 'success');
        setMysqlRunning(true);
      }
    } catch (error) {
      addLog(`MariaDB Kritik Hata: ${error}`, 'error');
    }
  };

  const saveSettings = async () => {
    try {
      addLog(`Hosts dosyası güncelleniyor: ${domain}`, 'info');
      const response = await invoke('update_hosts', { domain: domain }) as String;
      addLog(response.toString(), 'success');
      setIsSettingsOpen(false);
    } catch (error) {
      addLog(`Hosts Hatası: ${error} (Yönetici yetkisi gerekli)`, 'error');
    }
  };

  const generateSslCertificate = async () => {
    try {
      addLog(`${domain} için yerel SSL sertifikası oluşturuluyor...`, 'info');
      const response = await invoke('generate_ssl', { domain: domain }) as String;
      addLog(response.toString(), 'success');
    } catch (error) {
      addLog(`SSL Hatası: ${error}`, 'error');
    }
  };

  const checkAppUpdates = async () => {
    try {
      setIsUpdating(true);
      addLog('Güncellemeler denetleniyor...', 'info');
      const update = await check();
      
      if (update) {
        addLog(`Yeni sürüm bulundu (${update.version}). İndiriliyor ve kuruluyor...`, 'success');
        await update.downloadAndInstall();
        addLog('Güncelleme tamamlandı, uygulama yeniden başlatılıyor...', 'success');
        await relaunch();
      } else {
        addLog('CabaStack Control Panel güncel. Yeni sürüm yok.', 'info');
      }
    } catch (error) {
      addLog(`Güncelleme Denetlenemedi: ${error}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const openConfig = async (service: 'php' | 'mysql') => {
    try {
      addLog(`${service.toUpperCase()} yapılandırma dosyası açılıyor...`, 'info');
      const response = await invoke('open_config', { service });
      addLog(response as string, 'success');
    } catch (error) {
      addLog(`Config Hatası: ${error}`, 'error');
    }
  };

  const openLog = async (service: 'php' | 'mysql') => {
    try {
      addLog(`${service.toUpperCase()} log akışı açılıyor...`, 'info');
      const response = await invoke('open_log', { service });
      addLog(response as string, 'success');
    } catch (error) {
      addLog(`Log Hatası: ${error}`, 'error');
    }
  };

  const openPhpMyAdmin = async () => {
    try {
      if (!phpRunning) {
        addLog('Uyarı: phpMyAdmin için önce PHP servisini başlatmalısınız!', 'error');
        return;
      }
      addLog('phpMyAdmin tarayıcınızda açılıyor...', 'info');
      const response = await invoke('open_phpmyadmin');
      addLog(response as string, 'success');
    } catch (error) {
      addLog(`phpMyAdmin Hatası: ${error}`, 'error');
    }
  };

  const StatusDot = ({ active }: { active: boolean }) => (
    <span className="relative flex h-2.5 w-2.5">
      {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${active ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-zinc-600'}`}></span>
    </span>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans flex flex-col items-center justify-center p-6 select-none">
        <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full animate-pulse"></div>
            <div className="relative p-5 bg-zinc-950 rounded-3xl border border-zinc-800 text-emerald-400 shadow-2xl">
              <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
            CabaStack Control Panel
          </h2>
          <p className="text-xs font-mono text-zinc-400 h-6 transition-all">
            {loadingText}
          </p>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-6 border border-zinc-800">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full animate-pulse w-3/4 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      data-tauri-drag-region 
      style={{ paddingTop: '90px' }} 
      className="min-h-screen bg-[#050507] text-zinc-100 font-sans relative overflow-hidden selection:bg-emerald-500/30 flex flex-col px-6 pb-4"
    >
      
      <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] bg-emerald-500/5 blur-[160px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[160px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col flex-1 w-full">
        
        {/* ÜST HERO HEADER KARTI */}
        <div className="relative bg-gradient-to-r from-zinc-900/90 via-[#0b0b10] to-zinc-900/90 border border-zinc-800/80 p-6 rounded-3xl shadow-2xl mb-4 shrink-0 overflow-hidden backdrop-blur-xl">
          
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-75"></div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                <div className="relative p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 text-emerald-400 shadow-inner flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                    CabaStack Control Panel
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">
                    v0.1.0
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400 flex items-center justify-center sm:justify-start gap-2">
                  <span>Environment:</span>
                  <span className="text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    http://{domain}:{phpPort} (DB: {mysqlPort})
                  </span>
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 rounded-2xl transition-all border border-zinc-800/80 text-zinc-300 hover:text-emerald-400 shadow-md flex items-center gap-2 text-xs font-mono group"
              title="Panel Ayarları"
            >
              <span className="group-hover:rotate-90 transition-transform duration-300">⚙️</span> 
              <span>Settings</span>
            </button>

          </div>
        </div>

        {/* SERVİSLER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 shrink-0">
          
          {/* PHP KARTI */}
          <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-zinc-700/40 to-zinc-900/40 shadow-xl transition-all hover:from-emerald-500/40 hover:to-zinc-900/60">
            <div className="bg-[#0b0b0e] backdrop-blur-2xl p-5 rounded-2xl flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-indigo-400 shadow-inner">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2.5">
                      PHP 8.3 Service
                      <StatusDot active={phpRunning} />
                    </h2>
                    <p className="text-xs font-mono text-zinc-500 mt-0.5">Port: {phpPort} (Built-in Server)</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openLog('php')} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-400 hover:text-amber-400 rounded-lg border border-zinc-800 transition-colors flex items-center gap-1.5" title="Error Log">
                    <span>📄</span> Logs
                  </button>
                  <button onClick={() => openConfig('php')} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-400 hover:text-emerald-400 rounded-lg border border-zinc-800 transition-colors flex items-center gap-1.5" title="php.ini">
                    <span>⚙️</span> Config
                  </button>
                </div>

                <button 
                  onClick={togglePhp}
                  className={`px-6 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                    phpRunning 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20' 
                      : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold'
                  }`}
                >
                  {phpRunning ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>
          </div>

          {/* MYSQL KARTI */}
          <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-zinc-700/40 to-zinc-900/40 shadow-xl transition-all hover:from-cyan-500/40 hover:to-zinc-900/60">
            <div className="bg-[#0b0b0e] backdrop-blur-2xl p-5 rounded-2xl flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-cyan-400 shadow-inner">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2.5">
                      MariaDB Service
                      <StatusDot active={mysqlRunning} />
                    </h2>
                    <p className="text-xs font-mono text-zinc-500 mt-0.5">Port: {mysqlPort} (Database Engine)</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => openLog('mysql')} className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-amber-400 rounded-lg border border-zinc-800 transition-colors flex items-center gap-1" title="Startup Log">
                    <span>📄</span> Log
                  </button>
                  <button onClick={() => openConfig('mysql')} className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-cyan-400 rounded-lg border border-zinc-800 transition-colors flex items-center gap-1" title="my.ini">
                    <span>⚙️</span> Config
                  </button>
                  <button onClick={openPhpMyAdmin} className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-orange-400 rounded-lg border border-zinc-800 transition-colors flex items-center gap-1" title="phpMyAdmin">
                    <span>🗄️</span> PhpMyAdmin
                  </button>
                </div>

                <button 
                  onClick={toggleMysql}
                  className={`px-6 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                    mysqlRunning 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20' 
                      : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold'
                  }`}
                >
                  {mysqlRunning ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* LOG KONSOLU */}
        <div className="flex-1 min-h-0 bg-[#040405] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col mb-3">
          <div className="bg-zinc-900/60 px-4 py-2.5 border-b border-zinc-800/80 flex justify-between items-center shrink-0">
            <span className="text-xs font-mono font-medium text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              CabaStack Control Panel Log Stream
            </span>
            <button 
              onClick={() => setLogs([])} 
              className="text-xs font-mono px-2.5 py-1 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg border border-zinc-700/50 transition-colors"
            >
              Clear Log
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1 font-mono text-[12px] space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {logs.map(log => (
              <div key={log.id} className="flex gap-3 hover:bg-zinc-900/30 px-2 py-0.5 rounded transition-colors">
                <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                <span className={`break-all ${
                  log.type === 'error' ? 'text-rose-400' : 
                  log.type === 'success' ? 'text-emerald-400' : 
                  'text-zinc-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* FOOTER / İMZA ALANI */}
        <footer className="text-center pt-2 pb-1 shrink-0 select-none">
          <p className="text-[11px] font-mono text-zinc-500 flex items-center justify-center gap-1.5">
            <span>CabaStack Control Panel</span>
            <span className="text-zinc-700">•</span>
            <span>Designed & Developed by <strong className="text-zinc-400 font-semibold">Talha Caba</strong></span>
          </p>
        </footer>

      </div>

      {/* AYARLAR MODALI */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md z-50 animate-in fade-in duration-200">
          <div className="bg-[#0e0e11] border border-zinc-800 p-7 rounded-3xl w-full max-w-md shadow-[0_0_60px_rgba(0,0,0,0.9)] relative">
            <h2 className="text-xl font-bold mb-5 text-zinc-100 flex items-center justify-between">
              <span className="flex items-center gap-2"><span>⚙️</span> Control Panel Settings</span>
              <button 
                onClick={checkAppUpdates}
                disabled={isUpdating}
                className="text-[11px] font-mono px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Güncellemeleri Kontrol Et"
              >
                <span>🔄</span> {isUpdating ? 'Kontrol Ediliyor...' : 'Güncelleme Denetle'}
              </button>
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-1.5">Virtual Host Domain</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="projem.test"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none font-mono text-sm"
                  />
                  <button 
                    onClick={generateSslCertificate}
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5"
                    title="Bu Domain İçin SSL Sertifikası Üret (mkcert)"
                  >
                    <span>🔒</span> SSL Üret
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-1.5">PHP Port</label>
                  <input 
                    type="text" 
                    value={phpPort}
                    onChange={(e) => setPhpPort(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-1.5">MariaDB Port</label>
                  <input 
                    type="text" 
                    value={mysqlPort}
                    onChange={(e) => setmysqlPort(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800"
              >
                Vazgeç
              </button>
              <button 
                onClick={saveSettings}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Hosts Güncelle & Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;