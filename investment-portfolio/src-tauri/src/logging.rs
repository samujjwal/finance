use log::{LevelFilter, SetLoggerError};
use env_logger::Builder;
use std::io::Write;

struct CustomLogger {
    log_file: std::sync::Mutex<Option<std::fs::File>>,
}

impl log::Log for CustomLogger {
    fn enabled(&self, metadata: &log::Metadata) -> bool {
        metadata.level() <= log::max_level()
    }

    fn log(&self, record: &log::Record) {
        if self.enabled(record.metadata()) {
            let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S%.3f UTC");
            let log_entry = format!(
                "{} [{}] ({}): {}\n",
                timestamp,
                record.level(),
                record.target(),
                record.args()
            );

            // Print to console
            eprint!("{}", log_entry);

            // Write to file if available
            if let Ok(mut file_guard) = self.log_file.lock() {
                if let Some(ref mut file) = *file_guard {
                    let _ = file.write_all(log_entry.as_bytes());
                    let _ = file.flush();
                }
            }
        }
    }

    fn flush(&self) {
        if let Ok(mut file_guard) = self.log_file.lock() {
            if let Some(ref mut file) = *file_guard {
                let _ = file.flush();
            }
        }
    }
}

static mut LOGGER: Option<CustomLogger> = None;

fn init_custom_logger() -> Result<(), SetLoggerError> {
    let log_dir = std::env::current_exe()
        .unwrap()
        .parent()
        .unwrap()
        .join("logs");

    std::fs::create_dir_all(&log_dir).ok();

    let log_file_path = log_dir.join(format!(
        "jcl-investment-{}.log",
        chrono::Utc::now().format("%Y-%m-%d")
    ));

    let log_file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
        .ok();

    let logger = CustomLogger {
        log_file: std::sync::Mutex::new(log_file),
    };

    unsafe {
        LOGGER = Some(logger);
    }

    let max_level = if cfg!(debug_assertions) {
        LevelFilter::Debug
    } else {
        LevelFilter::Info
    };

    unsafe {
        log::set_logger(LOGGER.as_ref().unwrap())?;
    }
    log::set_max_level(max_level);

    log::info!("Logger initialized. Log file: {:?}", log_file_path);
    Ok(())
}

pub fn setup_logging() -> Result<(), Box<dyn std::error::Error>> {
    // Try custom logger first, fallback to env_logger
    if let Err(e) = init_custom_logger() {
        eprintln!("Failed to initialize custom logger: {}, using env_logger", e);
        
        Builder::from_default_env()
            .filter_level(if cfg!(debug_assertions) {
                LevelFilter::Debug
            } else {
                LevelFilter::Info
            })
            .init();
    }

    // Log system information
    log::info!("=== JCL Investment Portfolio Starting ===");
    log::info!("Version: {}", env!("CARGO_PKG_VERSION"));
    log::info!("Platform: {}", std::env::consts::OS);
    log::info!("Architecture: {}", std::env::consts::ARCH);
    log::info!("Debug: {}", cfg!(debug_assertions));
    
    Ok(())
}

pub fn log_system_info() {
    log::info!("=== System Information ===");
    
    // CPU info
    if let Ok(output) = std::process::Command::new("uname").arg("-m").output() {
        if let Ok(cpu_info) = String::from_utf8(output.stdout) {
            log::info!("CPU: {}", cpu_info.trim());
        }
    }
    
    // Memory info (Linux)
    if std::env::consts::OS == "linux" {
        if let Ok(meminfo) = std::fs::read_to_string("/proc/meminfo") {
            for line in meminfo.lines().take(3) {
                log::info!("Memory: {}", line);
            }
        }
    }
    
    // Available disk space
    if let Ok(current_dir) = std::env::current_dir() {
        if let Ok(metadata) = std::fs::metadata(&current_dir) {
            log::info!("Working directory: {:?}", current_dir);
            log::info!("Directory permissions: {:?}", metadata.permissions());
        }
    }
}

pub fn handle_panic() {
    std::panic::set_hook(Box::new(|panic_info| {
        let location = panic_info.location().unwrap();
        let message = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            s
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s
        } else {
            "unknown"
        };

        log::error!(
            "PANIC at {}:{}: {}",
            location.file(),
            location.line(),
            message
        );
        
        // Attempt to create crash report
        let crash_report = format!(
            "Crash Report - {}\nLocation: {}:{}\nMessage: {}\nBacktrace: {:?}",
            chrono::Utc::now(),
            location.file(),
            location.line(),
            message,
            backtrace::Backtrace::new()
        );

        if let Ok(current_dir) = std::env::current_exe() {
            let crash_dir = current_dir.parent().unwrap().join("crashes");
            std::fs::create_dir_all(&crash_dir).ok();
            
            let crash_file = crash_dir.join(format!(
                "crash-{}.txt",
                chrono::Utc::now().format("%Y%m%d_%H%M%S")
            ));
            
            let _ = std::fs::write(&crash_file, crash_report);
            log::error!("Crash report written to: {:?}", crash_file);
        }
    }));
}
