import DOMPurify from "dompurify";

export class Editor {
  private element: HTMLElement;
  private updateCallback: (() => void) | null = null;
  private observer: MutationObserver | null = null;

  constructor() {
    const el = document.getElementById("editor");
    if (!el) throw new Error("Editor element not found");
    this.element = el;

    document.execCommand("styleWithCSS", false, "true");

    this.element.addEventListener("input", () => {
      this.updateCallback?.();
    });

    this.element.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertText", false, "\t");
      }
    });

    this.wrapAllImages();

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLImageElement) {
            this.wrapImage(node);
          } else if (node instanceof HTMLElement) {
            node.querySelectorAll("img").forEach((img) => this.wrapImage(img));
          }
        }
      }
    });

    this.observer.observe(this.element, {
      childList: true,
      subtree: true,
    });
  }

  private wrapImage(img: HTMLImageElement): void {
    if (img.parentElement?.classList.contains("img-resize-wrapper")) return;

    const wrapper = document.createElement("span");
    wrapper.classList.add("img-resize-wrapper");
    wrapper.contentEditable = "false";

    const width = img.naturalWidth || img.width || 200;
    const height = img.naturalHeight || img.height || 150;
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;

    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);
  }

  private wrapAllImages(): void {
    this.element.querySelectorAll("img").forEach((img) => this.wrapImage(img as HTMLImageElement));
  }

  getElement(): HTMLElement {
    return this.element;
  }

  getContent(): string {
    return this.element.innerHTML;
  }

  setContent(html: string): void {
    this.element.innerHTML = DOMPurify.sanitize(html);
    this.wrapAllImages();
  }

  getPlainText(): string {
    return this.element.innerText;
  }

  focus(): void {
    this.element.focus();
  }

  onUpdate(callback: () => void): void {
    this.updateCallback = callback;
  }

  execCommand(command: string, value?: string): void {
    this.element.focus();
    document.execCommand(command, false, value || undefined);
    this.element.focus();
    this.updateCallback?.();
  }

  formatBlock(tag: string): void {
    this.element.focus();
    document.execCommand("formatBlock", false, `<${tag}>`);
    this.element.focus();
    this.updateCallback?.();
  }

  setFontSize(size: number): void {
    this.element.focus();
    const sizeMap: Record<number, string> = {
      8: "1",
      10: "2",
      12: "3",
      14: "4",
      18: "5",
      24: "6",
      36: "7",
    };
    const htmlSize = sizeMap[size] || "4";
    document.execCommand("fontSize", false, htmlSize);
    this.element.focus();
    this.updateCallback?.();
  }

  getWordCount(): number {
    const text = this.getPlainText().trim();
    if (!text) return 0;
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  getCharCount(): number {
    return this.getPlainText().length;
  }

  highlight(color: string): void {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    this.element.focus();
    document.execCommand("hiliteColor", false, color);
    this.element.focus();
    this.updateCallback?.();
  }

  removeHighlight(): void {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    this.element.focus();
    document.execCommand("hiliteColor", false, "transparent");
    requestAnimationFrame(() => {
      const editor = this.element;
      const spans = editor.querySelectorAll('span[style*="background"]');
      spans.forEach((span) => {
        const bg = (span as HTMLElement).style.backgroundColor;
        if (!bg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)") {
          const parent = span.parentNode;
          if (parent) {
            while (span.firstChild) {
              parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
          }
        }
      });
      editor.normalize();
      this.updateCallback?.();
    });
  }

  getActiveHighlightColor(): string | null {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    let node: Node | null = sel.anchorNode;
    while (node) {
      if (node instanceof HTMLElement && node.style.backgroundColor) {
        return node.style.backgroundColor;
      }
      node = node.parentElement;
    }
    return null;
  }

  foreColor(color: string): void {
    this.element.focus();
    if (!color) {
      document.execCommand("foreColor", false, "");
    } else {
      document.execCommand("foreColor", false, color);
    }
    this.element.focus();
    this.updateCallback?.();
  }

  removeForeColor(): void {
    this.element.focus();
    document.execCommand("foreColor", false, "");
    this.element.focus();
    this.updateCallback?.();
  }

  getActiveForeColor(): string | null {
    try {
      const color = document.queryCommandValue("foreColor");
      if (!color || color === "rgb(0, 0, 0)" || color === "#000000") return null;
      return color;
    } catch {
      return null;
    }
  }
}
