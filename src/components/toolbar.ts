import { Editor } from "../lib/editor";
import { Zoom } from "../lib/zoom";

export class Toolbar {
  private editor: Editor;
  private zoom: Zoom;
  private headingSelect: HTMLSelectElement;

  constructor(editor: Editor, zoom: Zoom) {
    this.editor = editor;
    this.zoom = zoom;
    const headingSelect = document.getElementById("heading-select") as HTMLSelectElement;
    if (!headingSelect) throw new Error("Heading select not found");
    this.headingSelect = headingSelect;

    this.setupToolbarButtons();
    this.setupHeadingSelect();
    this.setupKeyboardShortcuts();
    this.setupColorPickers();
    this.setupSelectionChange();
  }

  private setupToolbarButtons(): void {
    document.querySelectorAll(".toolbar-btn[data-cmd]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cmd = (btn as HTMLElement).dataset.cmd;
        if (!cmd) return;

        switch (cmd) {
          case "bold":
            this.editor.execCommand("bold");
            break;
          case "italic":
            this.editor.execCommand("italic");
            break;
          case "underline":
            this.editor.execCommand("underline");
            break;
          case "increase-font-size":
            this.increaseFontSize();
            break;
          case "decrease-font-size":
            this.decreaseFontSize();
            break;
          case "zoom-in":
            this.zoom.zoomIn();
            this.updateZoomDisplay();
            break;
          case "zoom-out":
            this.zoom.zoomOut();
            this.updateZoomDisplay();
            break;
          case "zoom-reset":
            this.zoom.reset();
            this.updateZoomDisplay();
            break;
        }
      });
    });
  }

  private setupHeadingSelect(): void {
    this.headingSelect.addEventListener("change", () => {
      const value = this.headingSelect.value;
      if (value === "p") {
        this.editor.execCommand("formatBlock", "p");
      } else {
        this.editor.execCommand("formatBlock", value);
      }
      this.headingSelect.value = value;
    });
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            this.editor.execCommand("bold");
            break;
          case "i":
            e.preventDefault();
            this.editor.execCommand("italic");
            break;
          case "u":
            e.preventDefault();
            this.editor.execCommand("underline");
            break;
        }
      }
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "c":
            e.preventDefault();
            this.toggleColorPicker("forecolor");
            break;
          case "h":
            e.preventDefault();
            this.toggleColorPicker("hilite");
            break;
        }
      }
    });
  }

  private setupColorPickers(): void {
    const foreBtn = document.getElementById("btn-forecolor");
    const hiliteBtn = document.getElementById("btn-hilitecolor");
    const forePicker = document.getElementById("forecolor-picker");
    const hilitePicker = document.getElementById("hilite-picker");

    foreBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closePicker("hilite");
      this.toggleColorPicker("forecolor");
    });

    hiliteBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closePicker("forecolor");
      this.toggleColorPicker("hilite");
    });

    forePicker?.querySelectorAll(".color-swatch").forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        e.stopPropagation();
        const color = (swatch as HTMLElement).dataset.color || "";
        if (!color) {
          this.editor.removeForeColor();
        } else {
          this.editor.foreColor(color);
        }
        this.closePicker("forecolor");
        this.updateColorSwatches();
      });
    });

    hilitePicker?.querySelectorAll(".color-swatch").forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        e.stopPropagation();
        const color = (swatch as HTMLElement).dataset.color || "";
        if (color === "") {
          this.editor.removeHighlight();
        } else {
          this.editor.highlight(color);
        }
        this.closePicker("hilite");
        this.updateColorSwatches();
      });
    });

    document.addEventListener("click", () => {
      this.closePicker("forecolor");
      this.closePicker("hilite");
    });
  }

  private toggleColorPicker(type: "forecolor" | "hilite"): void {
    const picker = document.getElementById(`${type}-picker`);
    if (picker) {
      picker.classList.toggle("visible");
    }
  }

  private closePicker(type: "forecolor" | "hilite"): void {
    const picker = document.getElementById(`${type}-picker`);
    if (picker) {
      picker.classList.remove("visible");
    }
  }

  private setupSelectionChange(): void {
    document.addEventListener("selectionchange", () => {
      this.updateColorSwatches();
    });
  }

  private updateColorSwatches(): void {
    const activeFore = this.editor.getActiveForeColor();
    const activeHilite = this.editor.getActiveHighlightColor();

    this.updateSwatchGroup("forecolor", activeFore);
    this.updateSwatchGroup("hilite", activeHilite);
  }

  private updateSwatchGroup(type: string, activeColor: string | null): void {
    const picker = document.getElementById(`${type}-picker`);
    if (!picker) return;

    picker.querySelectorAll(".color-swatch").forEach((swatch) => {
      const color = (swatch as HTMLElement).dataset.color || "";
      const isActive = activeColor
        ? this.colorsMatch(color, activeColor)
        : color === "";
      swatch.classList.toggle("active", isActive);
    });
  }

  private colorsMatch(a: string, b: string): boolean {
    const na = this.normalizeColor(a);
    const nb = this.normalizeColor(b);
    return na === nb;
  }

  private normalizeColor(color: string): string {
    if (!color) return "";
    try {
      const div = document.createElement("div");
      div.style.color = color;
      document.body.appendChild(div);
      const computed = getComputedStyle(div).color;
      document.body.removeChild(div);
      const match = computed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (match) {
        return (
          "#" +
          [1, 2, 3]
            .map((i) => parseInt(match[i]).toString(16).padStart(2, "0"))
            .join("")
        );
      }
      return computed;
    } catch {
      return color.toLowerCase();
    }
  }

  updateZoomDisplay(): void {
    const el = document.getElementById("zoom-level");
    if (el) el.textContent = this.zoom.getPercent();
  }

  private increaseFontSize(): void {
    const sizes = [8, 10, 12, 14, 18, 24, 36];
    const current = this.detectFontSize();
    const next = sizes.find((s) => s > current) || sizes[sizes.length - 1];
    this.editor.setFontSize(next);
  }

  private decreaseFontSize(): void {
    const sizes = [8, 10, 12, 14, 18, 24, 36];
    const current = this.detectFontSize();
    const prev = [...sizes].reverse().find((s) => s < current) || sizes[0];
    this.editor.setFontSize(prev);
  }

  private detectFontSize(): number {
    try {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return 14;
      const node = selection.anchorNode;
      if (!node) return 14;
      const parent = node.parentElement;
      if (!parent) return 14;
      const el = parent.closest("[contenteditable]") || parent;
      const size = window.getComputedStyle(el).fontSize;
      const computedPx = Math.round(parseFloat(size)) || 14;
      return Math.round(computedPx / this.zoom.getLevel()) || 14;
    } catch {
      return 14;
    }
  }
}
