// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod logging;

use std::process::{Command, Child, Stdio};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{Manager, State};
use tokio::time::interval;
use logging::{setup_logging, log_system_info, handle_panic};

#[derive(Clone)]
pub struct AppState {
    node_process: Arc<Mutex<Option<Child>>>,
    backend_process: Arc<Mutex<Option<Child>>>,
}

#[derive(Clone, serde::Serialize)]
struct ProcessStatus {
    node_running: bool,
    backend_running: bool,
    last_restart: String,
}

fn start_node_process() -> Result<Child, String> {
    let node_path = std::env::current_exe()
        .unwrap()
        .parent()
        .unwrap()
        .join("node-runtime")
        .join("bin")
        .join("node");
    
    let backend_path = std::env::current_exe()
        .unwrap()
        .parent()
        .unwrap()
        .join("backend-server")
        .join("server.js");

    log::info!("Starting Node.js process from: {:?}", node_path);
    log::info!("Backend script path: {:?}", backend_path);

    Command::new(node_path)
        .arg(&backend_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Node.js process: {}", e))
}

fn restart_node_process(state: State<AppState>) -> Result<(), String> {
    log::warn!("Restarting Node.js process...");
    
    // Kill existing process if running
    if let Ok(mut process_guard) = state.node_process.lock() {
        if let Some(mut child) = process_guard.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
    
    // Start new process
    match start_node_process() {
        Ok(child) => {
            if let Ok(mut process_guard) = state.node_process.lock() {
                *process_guard = Some(child);
            }
            log::info!("Node.js process restarted successfully");
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to restart Node.js process: {}", e);
            Err(e)
        }
    }
}

async fn monitor_processes(state: State<'_, AppState>) {
    let mut interval = interval(Duration::from_secs(5));
    
    loop {
        interval.tick().await;
        
        let mut needs_restart = false;
        
        // Check Node.js process
        if let Ok(mut process_guard) = state.node_process.lock() {
            if let Some(ref mut child) = *process_guard {
                match child.try_wait() {
                    Ok(Some(status)) => {
                        log::warn!("Node.js process exited with status: {:?}", status);
                        *process_guard = None;
                        needs_restart = true;
                    }
                    Ok(None) => {
                        // Process is still running
                    }
                    Err(e) => {
                        log::error!("Error checking Node.js process: {}", e);
                        needs_restart = true;
                    }
                }
            } else {
                log::warn!("Node.js process is not running, attempting to start...");
                needs_restart = true;
            }
        }
        
        if needs_restart {
            if let Err(e) = restart_node_process(state.clone()) {
                log::error!("Failed to restart Node.js process: {}", e);
            }
        }
    }
}

#[tauri::command]
fn get_process_status(state: State<AppState>) -> ProcessStatus {
    let node_running = if let Ok(mut process_guard) = state.node_process.lock() {
        process_guard.as_mut().map_or(false, |child| {
            child.try_wait().ok().map_or(true, |status| status.is_none())
        })
    } else {
        false
    };
    
    ProcessStatus {
        node_running,
        backend_running: node_running, // Assuming backend runs with Node.js
        last_restart: chrono::Utc::now().to_rfc3339(),
    }
}

#[tauri::command]
fn force_restart_backend(state: State<AppState>) -> Result<(), String> {
    restart_node_process(state)
}

fn main() {
    // Initialize logging and panic handler first
    if let Err(e) = setup_logging() {
        eprintln!("Failed to setup logging: {}", e);
    }
    
    handle_panic();
    log_system_info();

    log::info!("Starting JCL Investment Portfolio application...");

    let app_state = AppState {
        node_process: Arc::new(Mutex::new(None)),
        backend_process: Arc::new(Mutex::new(None)),
    };

    // Start Node.js process initially
    let state_clone = app_state.clone();
    std::thread::spawn(move || {
        if let Err(e) = start_node_process() {
            log::error!("Failed to start initial Node.js process: {}", e);
        } else {
            log::info!("Node.js process started successfully");
        }
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_process_status,
            force_restart_backend
        ])
        .setup(|app| {
            let state = app.state::<AppState>();
            let state_clone = state.clone();
            
            // Start process monitoring in background
            tokio::spawn(async move {
                monitor_processes(state_clone).await;
            });
            
            log::info!("Tauri application setup completed");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
