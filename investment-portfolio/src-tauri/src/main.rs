// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod logging;
mod server_manager;

use std::sync::{Arc, Mutex};
use logging::{setup_logging, log_system_info, handle_panic};
use server_manager::ServerManager;
use tauri::State;
use serde_json::json;

const SERVER_PORT: u16 = 3001;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn start_server(server: State<'_, Arc<Mutex<ServerManager>>>) -> Result<String, String> {
    let manager = server.lock().unwrap();
    manager.start()?;
    Ok("Server started successfully".to_string())
}

#[tauri::command]
async fn stop_server(server: State<'_, Arc<Mutex<ServerManager>>>) -> Result<String, String> {
    let manager = server.lock().unwrap();
    manager.stop()?;
    Ok("Server stopped successfully".to_string())
}

#[tauri::command]
async fn is_server_running(server: State<'_, Arc<Mutex<ServerManager>>>) -> Result<bool, String> {
    let manager = server.lock().unwrap();
    Ok(manager.is_running())
}

#[tauri::command]
async fn get_server_status(server: State<'_, Arc<Mutex<ServerManager>>>) -> Result<serde_json::Value, String> {
    let (is_running, port) = {
        let manager = server.lock().unwrap();
        (manager.is_running(), manager.get_server_port())
    }; // ← Lock dropped here
    
    if !is_running {
        return Ok(json!({
            "running": false,
            "message": "Server is not running",
            "port": SERVER_PORT
        }));
    }

    let url = format!("http://localhost:{}/api/auth/setup-status", port);
    match reqwest::get(&url).await {
        Ok(resp) => {
            match resp.json::<serde_json::Value>().await {
                Ok(json) => {
                    Ok(json!({
                        "running": true,
                        "health": json,
                        "port": SERVER_PORT,
                        "api_url": format!("http://localhost:{}", SERVER_PORT)
                    }))
                }
                Err(e) => {
                    Ok(json!({
                        "running": false,
                        "error": format!("Failed to parse health response: {}", e),
                        "port": SERVER_PORT
                    }))
                }
            }
        }
        Err(e) => {
            Ok(json!({
                "running": false,
                "error": format!("Health check failed: {}", e),
                "port": SERVER_PORT
            }))
        }
    }
}

#[tauri::command]
fn get_database_path() -> Result<String, String> {
    Ok(ServerManager::get_database_path().to_string_lossy().to_string())
}

#[tauri::command]
fn get_api_url() -> Result<String, String> {
    Ok(format!("http://localhost:{}", SERVER_PORT))
}

fn main() {
    // Initialize logging and panic handler first
    if let Err(e) = setup_logging() {
        eprintln!("Failed to setup logging: {}", e);
    }
    
    handle_panic();
    log_system_info();

    log::info!("Starting JCL Investment Portfolio application...");
    log::info!("Server will run on port {}", SERVER_PORT);

    let server_manager = Arc::new(Mutex::new(ServerManager::new(SERVER_PORT)));
    let server_manager_clone = server_manager.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_server,
            stop_server,
            is_server_running,
            get_server_status,
            get_database_path,
            get_api_url,
        ])
        .manage(server_manager.clone())
        .setup(move |_app| {
            log::info!("Tauri application setup started");
            
            // Start the backend server automatically
            log::info!("Attempting to start backend server...");
            let manager = server_manager_clone.lock().unwrap();
            match manager.start() {
                Ok(_) => {
                    log::info!("Backend server started successfully");
                }
                Err(e) => {
                    log::error!("Failed to start backend server: {}", e);
                    // Continue anyway - user can try to restart from UI
                }
            }

            log::info!("Tauri application setup completed");
            Ok(())
        })
        .on_window_event(|_window, event| {
            use tauri::WindowEvent;
            match event {
                WindowEvent::Destroyed => {
                    log::info!("Window destroyed, application will close");
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

