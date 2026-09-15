#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{Manager, State}; // Manager eklendi (AppHandle ve PathResolver için)

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

struct AppState {
    php_process: Mutex<Option<Child>>,
    mysql_process: Mutex<Option<Child>>,
}

// =======================
// HOSTS DOSYASI YÖNETİMİ
// =======================
#[tauri::command]
fn update_hosts(domain: String) -> Result<String, String> {
    let hosts_path = std::path::Path::new("C:\\Windows\\System32\\drivers\\etc\\hosts");

    let content = std::fs::read_to_string(hosts_path).map_err(|_| {
        "Hosts dosyası okunamadı. Uygulamayı Yönetici olarak çalıştırdığınızdan emin olun."
            .to_string()
    })?;

    let target_line = format!("127.0.0.1 {}", domain);

    if content.contains(&target_line) {
        return Ok("Domain zaten kayıtlı, işlem yapmaya gerek yok.".into());
    }

    let mut file = std::fs::OpenOptions::new()
        .append(true)
        .open(hosts_path)
        .map_err(|_| {
            "Hosts dosyasına yazılamadı! Lütfen uygulamayı YÖNETİCİ olarak çalıştırın.".to_string()
        })?;

    writeln!(file, "\n{}", target_line).map_err(|e| format!("Yazma hatası: {}", e))?;
    Ok(format!("{} başarıyla hosts dosyasına eklendi!", domain))
}

// =======================
// CONFIG VE LOG YÖNETİMİ
// =======================
#[tauri::command]
fn open_config(app: tauri::AppHandle, service: String) -> Result<String, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    
    let config_path = match service.as_str() {
        "php" => resource_dir.join("php").join("php.ini"),
        "mysql" => resource_dir.join("mysql").join("my.ini"),
        _ => return Err("Geçersiz servis".into()),
    };

    if !config_path.exists() {
        let _ = std::fs::File::create(&config_path);
    }

    match Command::new("notepad").arg(&config_path).spawn() {
        Ok(_) => Ok(format!(
            "{} ayar dosyası açıldı.",
            config_path.file_name().unwrap().to_string_lossy()
        )),
        Err(e) => Err(format!("Dosya açılamadı: {}", e)),
    }
}

#[tauri::command]
fn open_log(app: tauri::AppHandle, service: String) -> Result<String, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    
    let log_path = match service.as_str() {
        "php" => resource_dir.join("php").join("php_error.log"),
        "mysql" => resource_dir.join("mysql").join("startup.log"),
        _ => return Err("Geçersiz servis".into()),
    };

    if !log_path.exists() {
        let _ = std::fs::File::create(&log_path);
    }

    match Command::new("notepad").arg(&log_path).spawn() {
        Ok(_) => Ok(format!(
            "{} log dosyası açıldı.",
            log_path.file_name().unwrap().to_string_lossy()
        )),
        Err(e) => Err(format!("Log dosyası açılamadı: {}", e)),
    }
}

#[tauri::command]
fn open_phpmyadmin() -> Result<String, String> {
    let url = "http://localhost:8000/phpmyadmin/";
    match Command::new("cmd").args(["/C", "start", url]).spawn() {
        Ok(_) => Ok("phpMyAdmin tarayıcıda açıldı.".into()),
        Err(e) => Err(format!("Tarayıcı açılamadı: {}", e)),
    }
}

// =======================
// LOCAL SSL (MKCERT) YÖNETİMİ
// =======================
#[tauri::command]
fn generate_ssl(app: tauri::AppHandle, domain: String) -> Result<String, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    let ssl_dir = resource_dir.join("ssl");
    let mkcert_exe = ssl_dir.join("mkcert.exe");

    if !mkcert_exe.exists() {
        return Err("mkcert.exe aracı ssl klasöründe bulunamadı!".into());
    }

    if !ssl_dir.exists() {
        let _ = std::fs::create_dir_all(&ssl_dir);
    }

    let cert_path = ssl_dir.join(format!("{}.pem", domain));
    let key_path = ssl_dir.join(format!("{}-key.pem", domain));

    if cert_path.exists() && key_path.exists() {
        return Ok(format!("{} için SSL sertifikası zaten mevcut.", domain));
    }

    let _ = Command::new(&mkcert_exe).arg("-install").output();

    let output = Command::new(&mkcert_exe)
        .current_dir(&ssl_dir)
        .args([
            "-cert-file",
            cert_path.to_str().unwrap(),
            "-key-file",
            key_path.to_str().unwrap(),
            &domain,
        ])
        .output();

    match output {
        Ok(res) => {
            if res.status.success() {
                Ok(format!(
                    "{} için yerel SSL sertifikası başarıyla üretildi!",
                    domain
                ))
            } else {
                let err_msg = String::from_utf8_lossy(&res.stderr);
                Err(format!("Sertifika üretilemedi: {}", err_msg))
            }
        }
        Err(e) => Err(format!("mkcert çalıştırılamadı: {}", e)),
    }
}

// =======================
// PHP YÖNETİMİ
// =======================
#[tauri::command]
fn start_php(app: tauri::AppHandle, state: State<AppState>, port: String) -> Result<String, String> {
    let mut php = state.php_process.lock().unwrap();
    if php.is_some() {
        return Ok("PHP zaten çalışıyor.".into());
    }

    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    let php_exe = resource_dir.join("php").join("php.exe");
    let htdocs = resource_dir.join("htdocs");

    if !php_exe.exists() {
        return Err(format!("PHP bulunamadı: {}", php_exe.display()));
    }

    // 1. ADIM: Yolları string'e çeviriyoruz
    let mut php_exe_clean = php_exe.to_string_lossy().to_string();
    let mut htdocs_clean = htdocs.to_string_lossy().to_string();

    // 2. ADIM: Başındaki o lanet \\?\ kısmını GARANTİLİ olarak kesip atıyoruz
    if php_exe_clean.starts_with(r"\\?\") {
        php_exe_clean = php_exe_clean[4..].to_string();
    }
    if htdocs_clean.starts_with(r"\\?\") {
        htdocs_clean = htdocs_clean[4..].to_string();
    }

    let mut cmd = Command::new(&php_exe_clean);
    cmd.args([
        "-S",
        &format!("127.0.0.1:{}", port),
        "-t",
        &htdocs_clean,
    ]);

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    match cmd.spawn() {
        Ok(child) => {
            *php = Some(child);
            Ok(format!("PHP {} portunda başlatıldı", port))
        }
        Err(e) => Err(format!("PHP başlatılamadı: {}", e)),
    }
}
#[tauri::command]
fn stop_php(state: State<AppState>) -> Result<String, String> {
    let mut php = state.php_process.lock().unwrap();
    if let Some(mut child) = php.take() {
        let _ = child.kill();
        Ok("PHP Durduruldu".into())
    } else {
        Ok("PHP zaten kapalı.".into())
    }
}

// =======================
// MYSQL YÖNETİMİ
// =======================
#[tauri::command]
fn start_mysql(app: tauri::AppHandle, state: State<AppState>, port: String) -> Result<String, String> {
    let mut mysql = state.mysql_process.lock().unwrap();
    if mysql.is_some() {
        return Ok("MySQL zaten çalışıyor.".into());
    }

    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    let mysql_dir = resource_dir.join("mysql");
    let mysql_bin_dir = mysql_dir.join("bin"); // mysql/bin klasörü
    let mysqld_exe = mysql_bin_dir.join("mysqld.exe");
    let data_dir = mysql_dir.join("data");

    if !mysqld_exe.exists() {
        return Err(format!("MySQL bulunamadı: {}", mysqld_exe.display()));
    }

    let basedir_str = mysql_dir.to_string_lossy().replace("\\", "/");
    let datadir_str = data_dir.to_string_lossy().replace("\\", "/");

    let log_path = mysql_dir.join("startup.log");
    let log_file = std::fs::File::create(&log_path)
        .map_err(|e| format!("Log dosyası oluşturulamadı: {}", e))?;
    let err_file = log_file
        .try_clone()
        .map_err(|e| format!("Log dosyası kopyalanamadı: {}", e))?;

    let mut cmd = Command::new(&mysqld_exe);
    cmd.current_dir(&mysql_bin_dir)
        .args([
            "--console",
            &format!("--basedir={}", basedir_str),
            &format!("--datadir={}", datadir_str),
            &format!("--port={}", port),
        ])
        .stdout(Stdio::from(log_file))
        .stderr(Stdio::from(err_file));

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    match cmd.spawn() {
        Ok(child) => {
            *mysql = Some(child);
            Ok(format!("MySQL/MariaDB {} portunda başlatıldı", port))
        }
        Err(e) => Err(format!("MySQL başlatılamadı: {}", e)),
    }
}

#[tauri::command]
fn stop_mysql(state: State<AppState>) -> Result<String, String> {
    let mut mysql = state.mysql_process.lock().unwrap();
    if let Some(mut child) = mysql.take() {
        let _ = child.kill();
        Ok("MySQL Durduruldu".into())
    } else {
        Ok("MySQL zaten kapalı.".into())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState {
            php_process: Mutex::new(None),
            mysql_process: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            start_php,
            stop_php,
            start_mysql,
            stop_mysql,
            update_hosts,
            open_config,
            open_log,
            open_phpmyadmin,
            generate_ssl
        ])
        // SAĞ TIK VE İNCELE SEÇENEĞİNİ ENGELLEYEN SCRİPT
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.addEventListener('contextmenu', e => e.preventDefault());");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Tauri çalışırken hata oluştu");
}