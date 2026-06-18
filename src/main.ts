import "./styles/main.css";
import "./styles/editor.css";
import "./styles/toolbar.css";
import "./styles/theme.css";

import { Editor } from "./lib/editor";
import { Toolbar } from "./components/toolbar";
import { Zoom } from "./lib/zoom";
import { Drag } from "./lib/drag";
import { StatusBar } from "./components/status-bar";
import { ThemeManager } from "./components/theme-manager";
import { OpacityControl } from "./components/opacity-control";
import { ClickThrough } from "./components/click-through";
import { Exporter } from "./components/exporter";
import { ToolbarToggle } from "./components/toolbar-toggle";
import { loadNote, saveNote } from "./lib/storage";
import { importFile } from "./lib/importer";

class App {
  private editor: Editor;
  private toolbar: Toolbar;
  private zoom: Zoom;
  private statusBar: StatusBar;
  private themeManager: ThemeManager;
  private opacityControl: OpacityControl;
  private clickThrough: ClickThrough;
  private exporter: Exporter;
  private toolbarToggle: ToolbarToggle;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private hasUnsavedChanges = false;

  constructor() {
    this.editor = new Editor();
    this.zoom = new Zoom();
    this.toolbar = new Toolbar(this.editor, this.zoom);
    new Drag();
    this.statusBar = new StatusBar(this.editor);
    this.themeManager = new ThemeManager();
    this.opacityControl = new OpacityControl();
    this.clickThrough = new ClickThrough();
    this.exporter = new Exporter(this.editor);
    this.toolbarToggle = new ToolbarToggle();

    this.setupImport();

    this.setupWindowControls();
    this.setupAutoSave();
    this.loadSavedContent();

    this.editor.onUpdate(() => {
      this.statusBar.update();
      this.hasUnsavedChanges = true;
    });

    this.themeManager.onChange(() => {
      this.hasUnsavedChanges = true;
    });

    this.opacityControl.onChange((opacity) => {
      this.hasUnsavedChanges = true;
      this.applyOpacity(opacity);
    });

    this.clickThrough.onChange((active) => {
      this.hasUnsavedChanges = true;
      this.applyClickThrough(active);
    });
  }

  private applyOpacity(opacity: number): void {
    document.documentElement.style.setProperty("--window-opacity", opacity.toString());
    const app = document.getElementById("app");
    if (app) {
      app.style.opacity = opacity.toString();
    }
  }

  private async applyClickThrough(active: boolean): Promise<void> {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setIgnoreCursorEvents(active);
    } catch (err) {
      console.error("Failed to set ignore cursor events:", err);
    }
  }

  private async setupWindowControls(): Promise<void> {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const { invoke } = await import("@tauri-apps/api/core");
    const appWindow = getCurrentWindow();

    document.getElementById("btn-close")?.addEventListener("click", async () => {
      await this.save();
      await invoke("exit_app");
    });

    document.getElementById("btn-minimize")?.addEventListener("click", () => appWindow.minimize());

    const { listen } = await import("@tauri-apps/api/event");
    await listen("tauri://focus", () => {
      this.editor.focus();
    });
  }

  private setupAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      if (this.hasUnsavedChanges) {
        this.save();
      }
    }, 5000);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.hasUnsavedChanges) {
        this.save();
      }
    });
  }

  private async save(): Promise<void> {
    await saveNote({
      content: this.editor.getContent(),
      zoom_level: this.zoom.getLevel(),
      font_size: 14,
      theme: this.themeManager.getTheme(),
      opacity: this.opacityControl.getOpacity(),
    });
    this.hasUnsavedChanges = false;
  }

  private async loadSavedContent(): Promise<void> {
    const data = await loadNote();
    if (data) {
      this.editor.setContent(data.content);
      this.zoom.setLevel(data.zoom_level);
      this.toolbar.updateZoomDisplay();
      this.statusBar.update();

      if (data.theme) {
        this.themeManager.setTheme(data.theme);
      }

      if (data.opacity !== undefined) {
        this.opacityControl.setOpacity(data.opacity);
        this.applyOpacity(data.opacity);
      }
    }
  }

  private setupImport(): void {
    document.addEventListener("keydown", async (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        await this.handleImport();
      }
    });

    const btn = document.getElementById("btn-import");
    const dropdown = document.getElementById("import-dropdown");
    if (btn && dropdown) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const others = document.querySelectorAll(".dropdown-menu.visible");
        others.forEach((d) => d.classList.remove("visible"));
        dropdown.classList.toggle("visible");
      });
      document.addEventListener("click", () => dropdown.classList.remove("visible"));
      dropdown.querySelectorAll("button[data-format]").forEach((item) => {
        item.addEventListener("click", async (e) => {
          e.stopPropagation();
          dropdown.classList.remove("visible");
          await this.handleImport();
        });
      });
    }
  }

  private async handleImport(): Promise<void> {
    if (this.hasUnsavedChanges) {
      const confirmed = confirm("Hay cambios sin guardar. ¿Abrir otro archivo igual?");
      if (!confirmed) return;
    }
    const result = await importFile();
    if (!result) return;
    this.editor.setContent(result.html);
    this.hasUnsavedChanges = true;
    this.statusBar.update();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new App();
});
