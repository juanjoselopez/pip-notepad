import { invoke } from "@tauri-apps/api/core";

export interface NoteData {
  content: string;
  zoom_level: number;
  font_size: number;
  theme: "dark" | "light";
  opacity: number;
}

const CURRENT_NOTE = "current.json";

export async function saveNote(data: NoteData): Promise<void> {
  try {
    await invoke("save_note", { filename: CURRENT_NOTE, data });
  } catch (err) {
    console.error("Failed to save note:", err);
  }
}

export async function loadNote(): Promise<NoteData | null> {
  try {
    const data = await invoke<NoteData>("load_note", { filename: CURRENT_NOTE });
    return data;
  } catch {
    return null;
  }
}

export async function listNotes(): Promise<string[]> {
  try {
    return await invoke<string[]>("list_notes");
  } catch {
    return [];
  }
}

export async function exportFile(path: string, content: string): Promise<void> {
  await invoke("export_file", { path, content });
}

export async function importFile(path: string): Promise<string> {
  return await invoke<string>("import_file", { path });
}
