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

    fn find_existing_path(candidates: &[PathBuf]) -> Option<PathBuf> {
        for candidate in candidates {
            if candidate.exists() {
                return Some(candidate.clone());
            }
        }

        None
    }

    fn has_server_entry(server_root: &PathBuf) -> bool {
        server_root.join("main.js").exists()
            || server_root.join("dist").join("main.js").exists()
            || server_root.join("dist").join("src").join("main.js").exists()
    }

    fn get_server_entry_path(server_root: &PathBuf) -> PathBuf {
        let root_entry = server_root.join("main.js");
        if root_entry.exists() {
            return root_entry;
        }

        let dist_entry = server_root.join("dist").join("main.js");
        if dist_entry.exists() {
            return dist_entry;
        }

        server_root.join("dist").join("src").join("main.js")
    }

    /// Get the path to the bundled Node.js runtime
    /// Tries installed bundle layout, resources layout, then system PATH.
    fn get_node_runtime_path() -> Option<PathBuf> {
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                let node_exe_name = if cfg!(target_os = "windows") { "node.exe" } else { "node" };

                let mut candidates = vec![
                    exe_dir.join("node").join("bin").join(node_exe_name),
                    exe_dir.join("resources").join("node").join("bin").join(node_exe_name),
                ];

                if let Some(parent) = exe_dir.parent() {
                    candidates.push(parent.join("node").join("bin").join(node_exe_name));
                    candidates.push(parent.join("resources").join("node").join("bin").join(node_exe_name));
                }

                if let Some(node_path) = Self::find_existing_path(&candidates) {
                    info!("Found Node.js at: {}", node_path.display());
                    return Some(node_path);
                }
            }
        }

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
    /// Looks for installed bundle layout first, then resources/dev locations.
    fn get_server_bundle_path() -> PathBuf {
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                let mut candidates = vec![
                    exe_dir.join("server"),
                    exe_dir.join("resources").join("server"),
                ];

                if let Some(parent) = exe_dir.parent() {
                    candidates.push(parent.join("server"));
                    candidates.push(parent.join("resources").join("server"));
                }

                for candidate in candidates {
                    if Self::has_server_entry(&candidate) {
                        info!("Found server at: {}", candidate.display());
                        return candidate;
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

    /// Run `prisma migrate deploy` to initialise or upgrade the SQLite schema.
    /// Non-fatal: logs a warning and continues if the CLI is not found or fails.
    fn run_prisma_migrations(node_path: &PathBuf, server_path: &PathBuf, db_dir: &PathBuf) {
        let prisma_cli = server_path
            .join("node_modules")
            .join("prisma")
            .join("build")
            .join("index.js");

        if !prisma_cli.exists() {
            warn!("Prisma CLI not found at {}, skipping migrations", prisma_cli.display());
            return;
        }

        info!("Running Prisma database migrations...");
        match Command::new(node_path)
            .arg(&prisma_cli)
            .args(["migrate", "deploy"])
            .current_dir(server_path)
            .env(
                "DATABASE_URL",
                format!("file:{}", db_dir.join("investment_portfolio.db").to_string_lossy()),
            )
            .output()
        {
            Ok(out) if out.status.success() => {
                info!("Database migrations applied successfully");
            }
            Ok(out) => {
                let stderr = String::from_utf8_lossy(&out.stderr);
                if !stderr.is_empty() {
                    warn!("Migration output: {}", stderr);
                }
            }
            Err(e) => {
                warn!("Failed to run Prisma migrations ({}), server may not function correctly", e);
            }
        }
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

        // Apply any pending Prisma migrations before starting the server
        Self::run_prisma_migrations(&node_path, &server_path, &db_dir);

        let server_entry = Self::get_server_entry_path(&server_path);

        let child = Command::new(&node_path)
            .arg(&server_entry)
            .current_dir(&server_path)
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
            let _ = self.stop(); // Clean up
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
}

impl Drop for ServerManager {
    fn drop(&mut self) {
        let _ = self.stop();
    }
}
