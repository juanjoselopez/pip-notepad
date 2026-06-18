const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.1;

export class Zoom {
  private level: number = 1.0;
  private editorContainer: HTMLElement;
  private editor: HTMLElement;
  private baseFontSize: number;

  constructor() {
    const container = document.getElementById("editor-container");
    const editor = document.getElementById("editor");
    if (!container || !editor) throw new Error("Editor elements not found");
    this.editorContainer = container;
    this.editor = editor;
    this.baseFontSize = parseFloat(window.getComputedStyle(editor).fontSize) || 14;
    this.apply();
  }

  getLevel(): number {
    return this.level;
  }

  setLevel(level: number): void {
    this.level = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
    this.apply();
  }

  zoomIn(): void {
    this.setLevel(Math.round((this.level + ZOOM_STEP) * 100) / 100);
  }

  zoomOut(): void {
    this.setLevel(Math.round((this.level - ZOOM_STEP) * 100) / 100);
  }

  reset(): void {
    this.level = 1.0;
    this.apply();
  }

  getPercent(): string {
    return `${Math.round(this.level * 100)}%`;
  }

  private apply(): void {
    this.editor.style.fontSize = `${this.baseFontSize * this.level}px`;
  }
}
