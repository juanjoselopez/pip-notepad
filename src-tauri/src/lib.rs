use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct NoteData {
    pub content: String,
    pub zoom_level: f64,
    pub font_size: i32,
    pub theme: String,
    pub opacity: f64,
}

fn get_notes_dir(app: &tauri::AppHandle) -> PathBuf {
    let mut path = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    path.push("notes");
    path
}

fn get_window(app: &tauri::AppHandle) -> Option<tauri::WebviewWindow> {
    app.get_webview_window("main")
}

fn sanitize_filename(filename: &str) -> Result<&str, String> {
    if filename.contains("..")
        || filename.contains('/')
        || filename.contains('\\')
        || filename.contains(':')
    {
        return Err("Invalid filename: path traversal detected".into());
    }
    if filename.is_empty() || filename.len() > 255 {
        return Err("Invalid filename: wrong length".into());
    }
    let allowed_extensions = ["json", "md", "html", "txt"];
    let path = Path::new(filename);
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        if !allowed_extensions.contains(&ext) {
            return Err("Invalid filename: extension not allowed".into());
        }
    }
    Ok(filename)
}

#[tauri::command]
fn save_note(app: tauri::AppHandle, filename: String, data: NoteData) -> Result<(), String> {
    let safe_name = sanitize_filename(&filename)?;
    let notes_dir = get_notes_dir(&app);
    std::fs::create_dir_all(&notes_dir).map_err(|e| e.to_string())?;

    let file_path = notes_dir.join(safe_name);
    if !file_path.starts_with(&notes_dir) {
        return Err("Path traversal detected".into());
    }

    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, &json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_note(app: tauri::AppHandle, filename: String) -> Result<NoteData, String> {
    let safe_name = sanitize_filename(&filename)?;
    let notes_dir = get_notes_dir(&app);
    let file_path = notes_dir.join(safe_name);

    if !file_path.starts_with(&notes_dir) {
        return Err("Path traversal detected".into());
    }

    if !file_path.exists() {
        return Ok(NoteData {
            content: String::new(),
            zoom_level: 1.0,
            font_size: 14,
            theme: "dark".into(),
            opacity: 1.0,
        });
    }

    let json = std::fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let data: NoteData = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    Ok(data)
}

#[tauri::command]
fn list_notes(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let notes_dir = get_notes_dir(&app);
    if !notes_dir.exists() {
        return Ok(Vec::new());
    }

    let mut notes = Vec::new();
    let entries = std::fs::read_dir(&notes_dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        if let Some(name) = entry.file_name().to_str() {
            if name.ends_with(".json") {
                notes.push(name.to_string());
            }
        }
    }
    notes.sort();
    Ok(notes)
}

#[tauri::command]
fn export_file(path: String, content: String) -> Result<(), String> {
    let p = Path::new(&path);
    let allowed_extensions = ["md", "html", "txt"];
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if !allowed_extensions.contains(&ext.as_str()) {
        return Err("Export failed: file extension not allowed".into());
    }

    let parent = p.parent().unwrap_or(Path::new(""));
    if parent
        .to_str()
        .map(|s| s.contains(".."))
        .unwrap_or(false)
    {
        return Err("Export failed: path traversal detected".into());
    }

    std::fs::write(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn import_file(path: String) -> Result<String, String> {
    let p = Path::new(&path);
    let allowed_extensions = ["md", "markdown", "txt", "html", "json"];
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if !allowed_extensions.contains(&ext.as_str()) {
        return Err("Import failed: file extension not allowed".into());
    }

    if path.contains("..") {
        return Err("Import failed: path traversal detected".into());
    }

    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_skip_taskbar(app: tauri::AppHandle, skip: bool) -> Result<(), String> {
    if let Some(window) = get_window(&app) {
        window.set_skip_taskbar(skip).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let notes_dir = get_notes_dir(&app.handle());
            std::fs::create_dir_all(&notes_dir).expect("failed to create notes dir");

            let show =
                MenuItem::with_id(app, "show", "Mostrar/Ocultar", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Salir", true, Some("CmdOrCtrl+Q"))?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let icon = Image::from_bytes(include_bytes!("../icons/icon.png"))
                .expect("failed to load tray icon");

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .tooltip("PiP Notepad")
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = get_window(app) {
                            if window.is_visible().unwrap_or(true) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = get_window(app) {
                            if window.is_visible().unwrap_or(true) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_note,
            load_note,
            list_notes,
            export_file,
            import_file,
            set_skip_taskbar,
            exit_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
