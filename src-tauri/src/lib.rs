// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use chrono::{DateTime, Utc};
use tauri::{command, State};
use tauri_plugin_dialog::DialogExt;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecentFile {
    pub path: String,
    pub name: String,
    pub last_opened: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppState {
    pub recent_files: Vec<RecentFile>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            recent_files: Vec::new(),
        }
    }
}

pub type AppStateType = Mutex<AppState>;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
    pub content: String,
    pub path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub description: String,
    pub content: String,
    pub category: String,
}

#[command]
pub async fn save_file_content_to_disk(
    content: String,
    path: Option<String>,
    app_handle: tauri::AppHandle,
    state: State<'_, AppStateType>,
) -> Result<String, String> {
    let file_path = if let Some(p) = path {
        PathBuf::from(p)
    } else {
        let dialog_result = app_handle
            .dialog()
            .file()
            .add_filter("Mermaid Files", &["mmd", "mermaid"])
            .add_filter("All Files", &["*"])
            .blocking_save_file();

        match dialog_result {
            Some(file_path) => file_path.into_path().map_err(|e| format!("Failed to convert path: {}", e))?,
            None => return Err("File save cancelled".to_string()),
        }
    };

    match fs::write(&file_path, content) {
        Ok(_) => {
            if let Ok(mut app_state) = state.lock() {
                let path_str = file_path.to_string_lossy().to_string();
                let name = file_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();

                app_state.recent_files.retain(|f| f.path != path_str);
                app_state.recent_files.insert(
                    0,
                    RecentFile {
                        path: path_str.clone(),
                        name,
                        last_opened: Utc::now(),
                    },
                );
                app_state.recent_files.truncate(10);
                let _ = save_app_state(&app_state);
            }

            Ok(file_path.to_string_lossy().to_string())
        }
        Err(e) => Err(format!("Failed to save file: {}", e)),
    }
}

#[command]
pub async fn load_file(
    path: Option<String>,
    app_handle: tauri::AppHandle,
    state: State<'_, AppStateType>,
) -> Result<FileContent, String> {
    let file_path = if let Some(p) = path {
        PathBuf::from(p)
    } else {
        let dialog_result = app_handle
            .dialog()
            .file()
            .add_filter("Mermaid Files", &["mmd", "mermaid", "txt"])
            .add_filter("All Files", &["*"])
            .blocking_pick_file();

        match dialog_result {
            Some(file_path) => file_path.into_path().map_err(|e| format!("Failed to convert path: {}", e))?,
            None => return Err("File selection cancelled".to_string()),
        }
    };

    match fs::read_to_string(&file_path) {
        Ok(content) => {
            if let Ok(mut app_state) = state.lock() {
                let path_str = file_path.to_string_lossy().to_string();
                let name = file_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();

                app_state.recent_files.retain(|f| f.path != path_str);
                app_state.recent_files.insert(
                    0,
                    RecentFile {
                        path: path_str.clone(),
                        name,
                        last_opened: Utc::now(),
                    },
                );
                app_state.recent_files.truncate(10);
                let _ = save_app_state(&app_state);
            }

            Ok(FileContent {
                content,
                path: Some(file_path.to_string_lossy().to_string()),
            })
        }
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[command]
pub async fn validate_mermaid_syntax(content: String) -> Result<ValidationResult, String> {
    let errors = Vec::new();
    let mut warnings = Vec::new();

    let lines: Vec<&str> = content.lines().collect();

    if lines.is_empty() {
        warnings.push("Empty diagram".to_string());
        return Ok(ValidationResult {
            is_valid: true,
            errors,
            warnings,
        });
    }

    let first_line = lines[0].trim().to_lowercase();
    let valid_diagrams = [
        "graph", "flowchart", "sequencediagram", "classdiagram",
        "statediagram", "erdiagram", "journey", "gantt", "pie",
        "gitgraph", "mindmap", "timeline", "zenuml", "sankey"
    ];

    let has_valid_start = valid_diagrams.iter().any(|&diagram| {
        first_line.starts_with(diagram)
    });

    if !has_valid_start {
        warnings.push("Diagram type not recognized. Make sure to start with a valid diagram type.".to_string());
    }

    Ok(ValidationResult {
        is_valid: errors.is_empty(),
        errors,
        warnings,
    })
}

#[command]
pub async fn get_recent_files(state: State<'_, AppStateType>) -> Result<Vec<RecentFile>, String> {
    match state.lock() {
        Ok(app_state) => Ok(app_state.recent_files.clone()),
        Err(_) => Err("Failed to access app state".to_string()),
    }
}

#[command]
pub async fn clear_recent_files(state: State<'_, AppStateType>) -> Result<(), String> {
    match state.lock() {
        Ok(mut app_state) => {
            app_state.recent_files.clear();
            save_app_state(&app_state).map_err(|e| format!("Failed to save state: {}", e))
        }
        Err(_) => Err("Failed to access app state".to_string()),
    }
}

#[command]
pub async fn get_templates() -> Result<Vec<Template>, String> {
    Ok(vec![
        Template {
            id: "flowchart-basic".to_string(),
            name: "Basic Flowchart".to_string(),
            description: "A simple flowchart template".to_string(),
            content: "flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Action 1]\n    B -->|No| D[Action 2]\n    C --> E[End]\n    D --> E".to_string(),
            category: "Flowchart".to_string(),
        },
        Template {
            id: "sequence-basic".to_string(),
            name: "Basic Sequence".to_string(),
            description: "A simple sequence diagram template".to_string(),
            content: "sequenceDiagram\n    participant A as Alice\n    participant B as Bob\n    A->>B: Hello Bob, how are you?\n    B-->>A: Great!".to_string(),
            category: "Sequence".to_string(),
        },
    ])
}

#[command]
pub async fn export_diagram(
    content: String,
    format: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let extension = match format.as_str() {
        "png" => "png",
        "svg" => "svg",
        "pdf" => "pdf",
        _ => return Err("Unsupported format".to_string()),
    };

    let dialog_result = app_handle
        .dialog()
        .file()
        .add_filter(&format!("{} Files", format.to_uppercase()), &[extension])
        .blocking_save_file();

    match dialog_result {
        Some(file_path) => {
            let path_buf = file_path.into_path().map_err(|e| format!("Failed to convert path: {}", e))?;
            let path_str = path_buf.to_string_lossy().to_string();

            match fs::write(&path_buf, content) {
                Ok(_) => Ok(path_str),
                Err(e) => Err(format!("Failed to export: {}", e)),
            }
        }
        None => Err("Export cancelled".to_string()),
    }
}

fn get_app_data_dir() -> Result<PathBuf, String> {
    dirs::data_dir()
        .map(|dir| dir.join("flowcraft-studio"))
        .ok_or_else(|| "Could not determine app data directory".to_string())
}

fn load_app_state() -> Result<AppState, String> {
    let app_dir = get_app_data_dir()?;
    let state_file = app_dir.join("state.json");

    if !state_file.exists() {
        return Ok(AppState::default());
    }

    let content = fs::read_to_string(state_file)
        .map_err(|e| format!("Failed to read state file: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse state file: {}", e))
}

fn save_app_state(state: &AppState) -> Result<(), String> {
    let app_dir = get_app_data_dir()?;

    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app directory: {}", e))?;

    let state_file = app_dir.join("state.json");
    let content = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize state: {}", e))?;

    fs::write(state_file, content)
        .map_err(|e| format!("Failed to write state file: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(load_app_state().unwrap_or_default()))
        .invoke_handler(tauri::generate_handler![
            save_file_content_to_disk,
            load_file,
            validate_mermaid_syntax,
            get_recent_files,
            clear_recent_files,
            get_templates,
            export_diagram
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
