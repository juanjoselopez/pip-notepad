import { Editor } from "../lib/editor";
import { exportFile } from "../lib/storage";
import { htmlToPlainText, wrapAsHtmlPage } from "../lib/markdown";
import { save } from "@tauri-apps/plugin-dialog";

export type ExportFormat = "html" | "plaintext";

export class Exporter {
  private editor: Editor;
  private dropdownEl: HTMLElement;

  constructor(editor: Editor) {
    this.editor = editor;
    const btn = document.getElementById("btn-export");
    if (!btn) throw new Error("Export button not found");
    this.dropdownEl = this.createDropdown();
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });
    document.addEventListener("click", () => this.closeDropdown());
  }

  private createDropdown(): HTMLElement {
    const el = document.createElement("div");
    el.id = "export-dropdown";
    el.className = "dropdown-menu";
    el.innerHTML = `
      <button data-format="html">📄 Conservar formato (HTML)</button>
      <button data-format="plaintext">📝 Solo texto plano (TXT)</button>
    `;
    el.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const format = (btn as HTMLElement).dataset.format as ExportFormat;
        this.export(format);
        this.closeDropdown();
      });
    });
    document.getElementById("toolbar")?.appendChild(el);
    return el;
  }

  toggleDropdown(): void {
    this.dropdownEl.classList.toggle("visible");
  }

  closeDropdown(): void {
    this.dropdownEl.classList.remove("visible");
  }

  isDropdownVisible(): boolean {
    return this.dropdownEl.classList.contains("visible");
  }

  async export(format: ExportFormat): Promise<void> {
    const content = this.editor.getContent();
    let fileContent: string;
    let extension: string;
    let filterName: string;

    switch (format) {
      case "html":
        fileContent = wrapAsHtmlPage(content);
        extension = "html";
        filterName = "HTML";
        break;
      case "plaintext":
        fileContent = htmlToPlainText(content);
        extension = "txt";
        filterName = "Texto plano";
        break;
    }

    const result = await save({
      filters: [{ name: filterName, extensions: [extension] }],
      defaultPath: `nota.${extension}`,
    });

    if (result) {
      await exportFile(result, fileContent);
    }
  }
}
