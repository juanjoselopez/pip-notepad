import { Editor } from "../lib/editor";

export class StatusBar {
  private editor: Editor;
  private wordEl: HTMLElement;
  private charEl: HTMLElement;

  constructor(editor: Editor) {
    this.editor = editor;
    const wordEl = document.getElementById("word-count");
    const charEl = document.getElementById("char-count");
    if (!wordEl || !charEl) throw new Error("Status bar elements not found");
    this.wordEl = wordEl;
    this.charEl = charEl;
    this.update();
  }

  update(): void {
    this.wordEl.textContent = `Palabras: ${this.editor.getWordCount()}`;
    this.charEl.textContent = `Caracteres: ${this.editor.getCharCount()}`;
  }
}
