// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use chrono::{DateTime, Utc};
use tauri::{command, Manager, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FsExt;
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

type AppStateType = Mutex<AppState>;

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

// Command handlers
#[command]
pub async fn save_file(
    content: String,
    path: Option<String>,
    app_handle: tauri::AppHandle,
    state: State<'_, AppStateType>,
) -> Result<String, String> {
    let file_path = if let Some(p) = path {
        PathBuf::from(p)
    } else {
        // Show save dialog
        let dialog_result = app_handle
            .dialog()
            .file()
            .add_filter("Mermaid Files", &["mmd", "mermaid"])
            .add_filter("All Files", &["*"])
            .blocking_save_file();

        match dialog_result {
            Some(file_path) => file_path.into_path_buf(),
            None => return Err("File save cancelled".to_string()),
        }
    };

    // Write file
    match fs::write(&file_path, content) {
        Ok(_) => {
            // Update recent files
            if let Ok(mut app_state) = state.lock() {
                let path_str = file_path.to_string_lossy().to_string();
                let name = file_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();

                // Remove existing entry if present
                app_state.recent_files.retain(|f| f.path != path_str);

                // Add new entry at the beginning
                app_state.recent_files.insert(
                    0,
                    RecentFile {
                        path: path_str.clone(),
                        name,
                        last_opened: Utc::now(),
                    },
                );

                // Keep only last 10 files
                app_state.recent_files.truncate(10);

                // Save state to file
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
        // Show open dialog
        let dialog_result = app_handle
            .dialog()
            .file()
            .add_filter("Mermaid Files", &["mmd", "mermaid", "txt"])
            .add_filter("All Files", &["*"])
            .blocking_pick_file();

        match dialog_result {
            Some(file_path) => file_path.into_path_buf(),
            None => return Err("File selection cancelled".to_string()),
        }
    };

    match fs::read_to_string(&file_path) {
        Ok(content) => {
            // Update recent files
            if let Ok(mut app_state) = state.lock() {
                let path_str = file_path.to_string_lossy().to_string();
                let name = file_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();

                // Remove existing entry if present
                app_state.recent_files.retain(|f| f.path != path_str);

                // Add new entry at the beginning
                app_state.recent_files.insert(
                    0,
                    RecentFile {
                        path: path_str.clone(),
                        name,
                        last_opened: Utc::now(),
                    },
                );

                // Keep only last 10 files
                app_state.recent_files.truncate(10);

                // Save state to file
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
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    // Basic Mermaid syntax validation
    let lines: Vec<&str> = content.lines().collect();

    if lines.is_empty() {
        warnings.push("Empty diagram".to_string());
        return Ok(ValidationResult {
            is_valid: true,
            errors,
            warnings,
        });
    }

    // Check for basic diagram types
    let first_line = lines[0].trim().to_lowercase();
    let valid_diagrams = [
        "graph", "flowchart", "sequencediagram", "classDiagram",
        "stateDiagram", "erDiagram", "journey", "gantt", "pie",
        "gitgraph", "mindmap", "timeline", "zenuml", "sankey"
    ];

    let has_valid_start = valid_diagrams.iter().any(|&diagram| {
        first_line.starts_with(diagram) ||
        first_line.starts_with(&format!("{}:", diagram)) ||
        first_line == diagram
    });

    if !has_valid_start {
        warnings.push("Diagram type not clearly specified in first line".to_string());
    }

    // Check for common syntax issues
    for (line_num, line) in lines.iter().enumerate() {
        let trimmed = line.trim();

        // Check for unmatched brackets
        let open_brackets = trimmed.matches('[').count() + trimmed.matches('(').count() + trimmed.matches('{').count();
        let close_brackets = trimmed.matches(']').count() + trimmed.matches(')').count() + trimmed.matches('}').count();

        if open_brackets != close_brackets {
            warnings.push(format!("Line {}: Potentially unmatched brackets", line_num + 1));
        }

        // Check for invalid characters in node IDs
        if trimmed.contains("-->") || trimmed.contains("---") {
            let parts: Vec<&str> = trimmed.split("-->").collect();
            if parts.len() == 1 {
                let parts: Vec<&str> = trimmed.split("---").collect();
            }

            for part in parts {
                let node_id = part.trim().split_whitespace().next().unwrap_or("");
                if node_id.contains(' ') && !node_id.starts_with('[') && !node_id.starts_with('(') {
                    warnings.push(format!("Line {}: Node ID '{}' contains spaces", line_num + 1, node_id));
                }
            }
        }
    }

    let is_valid = errors.is_empty();

    Ok(ValidationResult {
        is_valid,
        errors,
        warnings,
    })
}

#[command]
pub async fn get_recent_files(state: State<'_, AppStateType>) -> Result<Vec<RecentFile>, String> {
    match state.lock() {
        Ok(app_state) => Ok(app_state.recent_files.clone()),
        Err(_) => Err("Failed to access recent files".to_string()),
    }
}

#[command]
pub async fn clear_recent_files(state: State<'_, AppStateType>) -> Result<(), String> {
    match state.lock() {
        Ok(mut app_state) => {
            app_state.recent_files.clear();
            save_app_state(&app_state).map_err(|e| format!("Failed to save state: {}", e))?;
            Ok(())
        }
        Err(_) => Err("Failed to access recent files".to_string()),
    }
}

#[command]
pub async fn get_templates() -> Result<Vec<Template>, String> {
    let templates = vec![
        Template {
            id: "flowchart-basic".to_string(),
            name: "Basic Flowchart".to_string(),
            description: "A simple flowchart template".to_string(),
            category: "Flowchart".to_string(),
            content: r#"flowchart TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E"#.to_string(),
        },
        Template {
            id: "sequence-basic".to_string(),
            name: "Basic Sequence Diagram".to_string(),
            description: "A simple sequence diagram template".to_string(),
            category: "Sequence".to_string(),
            content: r#"sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob, how are you?
    B-->>A: Great!"#.to_string(),
        },
        Template {
            id: "class-basic".to_string(),
            name: "Basic Class Diagram".to_string(),
            description: "A simple class diagram template".to_string(),
            category: "Class".to_string(),
            content: r#"classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    Animal <|-- Dog"#.to_string(),
        },
        Template {
            id: "state-basic".to_string(),
            name: "Basic State Diagram".to_string(),
            description: "A simple state diagram template".to_string(),
            category: "State".to_string(),
            content: r#"stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]"#.to_string(),
        },
        Template {
            id: "gantt-basic".to_string(),
            name: "Basic Gantt Chart".to_string(),
            description: "A simple gantt chart template".to_string(),
            category: "Gantt".to_string(),
            content: r#"gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d"#.to_string(),
        },
        Template {
            id: "pie-basic".to_string(),
            name: "Basic Pie Chart".to_string(),
            description: "A simple pie chart template".to_string(),
            category: "Pie".to_string(),
            content: r#"pie title Sample Pie Chart
    "Dogs" : 386
    "Cats" : 85
    "Birds" : 15"#.to_string(),
        },
    ];

    Ok(templates)
}

#[command]
pub async fn export_diagram(
    content: String,
    format: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like headless Chrome
    // or a Mermaid CLI tool to render the diagram to the specified format

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
            let path_str = file_path.to_string_lossy().to_string();

            // Placeholder: In a real implementation, render the diagram here
            // For now, just save the mermaid content as a text file
            match fs::write(&file_path, content) {
                Ok(_) => Ok(path_str),
                Err(e) => Err(format!("Failed to export: {}", e)),
            }
        }
        None => Err("Export cancelled".to_string()),
    }
}

// Helper functions
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

    // Create directory if it doesn't exist
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
        .manage(AppStateType::new(Mutex::new(
            load_app_state().unwrap_or_default()
        )))
        .invoke_handler(tauri::generate_handler![
            save_file,
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
