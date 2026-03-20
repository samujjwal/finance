use std::process::{Command, Child, Stdio};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use log::{info, error, debug, warn};

pub struct ServerManager {
    process: Arc<Mutex<Option<Child>>>,
    is_running: Arc<Mutex<bool>>,
    server_port: u16,
}

impl ServerManager {
    pub fn new(port: u16) -> Self {
        ServerManager {
            process: Arc::new(Mutex::new(None)),
            is_running: Arc::new(Mutex::new(false)),
            server_port: port,
        }
    }

    /// Get the path to the bundled Node.js runtime
    /// Tries multiple locations: resources/node/bin, app bundle, system PATH
    fn get_node_runtime_path() -> Option<PathBuf> {
        // 1. Try resources directory relative to executable
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                // Windows: exe_dir/resources/node/bin/node.exe
                // Linux/Mac: exe_dir/resources/node/bin/node
                let node_exe_name = if cfg!(target_os = "windows") { "node.exe" } else { "node" };
                
                // Try bundled location (for packaged app)
                let bundled_node = exe_dir.join("resources").join("node").join("bin").join(node_exe_name);
                if bundled_node.exists() {
                    info!("Found bundled Node.js at: {}", bundled_node.display());
                    return Some(bundled_node);
                }
                
                // Try relative to app root (for development)
                if let Some(parent) = exe_dir.parent() {
                    let dev_node = parent.join("resources").join("node").join("bin").join(node_exe_name);
                    if dev_node.exists() {
                        info!("Found Node.js at: {}", dev_node.display());
                        return Some(dev_node);
                    }
                }
            }
        }

        // 2. Try system Node.js
        if cfg!(target_os = "windows") {
            if let Ok(output) = Command::new("where").arg("node.exe").output() {
                if output.status.success() {
                    let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !path_str.is_empty() {
                        let system_node = PathBuf::from(path_str);
                        if system_node.exists() {
                            warn!("Using system Node.js (not bundled): {}", system_node.display());
                            return Some(system_node);
                        }
                    }
                }
            }
        } else {
            if let Ok(output) = Command::new("which").arg("node").output() {
                if output.status.success() {
                    let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !path_str.is_empty() {
                        let system_node = PathBuf::from(path_str);
                        if system_node.exists() {
                            warn!("Using system Node.js (not bundled): {}", system_node.display());
                            return Some(system_node);
                        }
                    }
                }
            }
        }

        None
    }

    /// Get the path to the server bundle (where dist/main.js is located)
    /// Looks for bundled resources first, then development location
    fn get_server_bundle_path() -> PathBuf {
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                // Try bundled location (for packaged app)
                let bundled_server = exe_dir.join("resources").join("server");
                if bundled_server.exists() && bundled_server.join("dist").join("main.js").exists() {
                    info!("Found bundled server at: {}", bundled_server.display());
                    return bundled_server;
                }
                
                // Try relative to app root (for development)
                if let Some(parent) = exe_dir.parent() {
                    let dev_server = parent.join("server");
                    if dev_server.exists() && dev_server.join("dist").join("main.js").exists() {
                        info!("Found server at: {}", dev_server.display());
                        return dev_server;
                    }
                }
            }
        }
        
        // Fallback to current directory relative path
        warn!("Using fallback server path");
        PathBuf::from("server")
    }

    /// Get the database path
    pub fn get_database_path() -> PathBuf {
        let app_data = if cfg!(target_os = "windows") {
            PathBuf::from(std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string()))
        } else {
            dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
                .join(".local/share")
        };
        app_data.join("jcl-investment-portfolio")
    }

    /// Ensure database directory exists
    pub fn ensure_database_dir() -> Result<PathBuf, String> {
        let db_path = Self::get_database_path();
        std::fs::create_dir_all(&db_path).map_err(|e| {
            error!("Failed to create database directory: {}", e);
            format!("Failed to create database directory: {}", e)
        })?;
        info!("Database path: {}", db_path.display());
        Ok(db_path)
    }

    /// Start the NestJS server
    pub fn start(&self) -> Result<(), String> {
        let mut running = self.is_running.lock().unwrap();
        if *running {
            warn!("Server is already running");
            return Ok(());
        }

        // Ensure database directory exists
        let db_dir = Self::ensure_database_dir()?;

        // Get Node.js path (bundled or system)
        let node_path = Self::get_node_runtime_path().ok_or_else(|| {
            let msg = "Node.js runtime not found. Ensure Node.js is bundled or installed on system.".to_string();
            error!("{}", msg);
            msg
        })?;

        let server_path = Self::get_server_bundle_path();

        info!("Starting server...");
        info!("Node runtime: {}", node_path.display());
        info!("Server path: {}", server_path.display());
        info!("Database path: {}", db_dir.display());

        let child = Command::new(&node_path)
            .arg(server_path.join("dist/main.js"))
            .current_dir(&db_dir)
            .env("NODE_ENV", "production")
            .env("PORT", self.server_port.to_string())
            .env("DATABASE_URL", format!("file:{}",
                db_dir.join("investment_portfolio.db").display()))
            .env("CORS_ORIGIN", "http://localhost:1420")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| {
                error!("Failed to spawn server process: {}", e);
                format!("Failed to spawn server process: {}", e)
            })?;

        let child_pid = child.id();
        info!("Server process started with PID: {}", child_pid);

        *self.process.lock().unwrap() = Some(child);
        *running = true;

        // Give server time to start
        thread::sleep(Duration::from_millis(500));

        // Verify server is responding
        if self.wait_for_server(30) {
            info!("Server is responding on port {}", self.server_port);
            Ok(())
        } else {
            error!("Server did not respond after 30 seconds");
            self.stop(); // Clean up
            Err("Server did not respond after startup".to_string())
        }
    }

    /// Wait for server to respond on the health endpoint
    fn wait_for_server(&self, max_attempts: u32) -> bool {
        for attempt in 0..max_attempts {
            debug!("Health check attempt {} of {}", attempt + 1, max_attempts);
            
            // Try to connect to the server
            let client = reqwest::blocking::Client::builder()
                .timeout(Duration::from_secs(1))
                .build();

            if let Ok(client) = client {
                let url = format!("http://localhost:{}/api/auth/setup-status", self.server_port);
                match client.get(&url).send() {
                    Ok(resp) if resp.status().is_success() => {
                        debug!("Health check passed");
                        return true;
                    }
                    Ok(resp) => {
                        debug!("Health check got status: {}", resp.status());
                    }
                    Err(e) => {
                        debug!("Health check error: {}", e);
                    }
                }
            }
            
            thread::sleep(Duration::from_millis(500));
        }
        false
    }

    /// Stop the server
    pub fn stop(&self) -> Result<(), String> {
        let mut running = self.is_running.lock().unwrap();
        let mut process = self.process.lock().unwrap();

        if !*running || process.is_none() {
            debug!("Server is not running");
            return Ok(());
        }

        if let Some(mut child) = process.take() {
            info!("Stopping server (PID: {})", child.id());
            
            // Try graceful shutdown first
            let _ = child.kill().map_err(|e| {
                warn!("Failed to kill server process: {}", e);
                e
            });

            // Wait for process to terminate
            let _ = child.wait();
            info!("Server stopped");
        }

        *running = false;
        Ok(())
    }

    /// Check if server is running
    pub fn is_running(&self) -> bool {
        *self.is_running.lock().unwrap()
    }

    /// Check server health
    pub fn get_server_port(&self) -> u16 {
        self.server_port
    }

    pub async fn health_check(&self) -> Result<serde_json::Value, String> {
        let url = format!("http://localhost:{}/api/auth/setup-status", self.server_port);
        
        match reqwest::get(&url).await {
            Ok(resp) => {
                match resp.json::<serde_json::Value>().await {
                    Ok(json) => Ok(json),
                    Err(e) => {
                        error!("Failed to parse health response: {}", e);
                        Err(format!("Failed to parse health response: {}", e))
                    }
                }
            }
            Err(e) => {
                error!("Health check failed: {}", e);
                Err(format!("Health check failed: {}", e))
            }
        }
    }
}

impl Drop for ServerManager {
    fn drop(&mut self) {
        let _ = self.stop();
    }
}
