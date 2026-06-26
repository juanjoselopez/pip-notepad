import DOMPurify from "dompurify";

let markedModule: any = null;

async function getMarked(): Promise<any> {
  if (!markedModule) {
    markedModule = await import("marked");
  }
  return markedModule.marked || markedModule;
}

export type ImportFormat = "html" | "txt" | "md";

export interface ImportResult {
  html: string;
  format: ImportFormat;
  fileName: string | null;
}

export async function importFile(): Promise<ImportResult | null> {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");

    const path = await open({
      multiple: false,
      filters: [
        { name: "Todos los soportados", extensions: ["html", "txt", "md", "markdown"] },
        { name: "HTML", extensions: ["html"] },
        { name: "Texto plano", extensions: ["txt"] },
        { name: "Markdown", extensions: ["md", "markdown"] },
      ],
    });

    if (!path) return null;

    const content: string = await invoke("import_file", { path });

    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const fileName = path.split(/[\\/]/).pop() ?? null;

    let html: string;

    switch (ext) {
      case "html":
        html = processHtmlImport(content);
        break;
      case "txt":
        html = processTextImport(content);
        break;
      case "md":
      case "markdown":
        html = await processMarkdownImport(content);
        break;
      default:
        throw new Error(`Formato no soportado: .${ext}`);
    }

    return {
      html: DOMPurify.sanitize(html),
      format: (ext === "md" || ext === "markdown") ? "md" : (ext as ImportFormat),
      fileName,
    };
  } catch (err) {
    console.error("Error al importar:", err);
    return null;
  }
}

function processHtmlImport(raw: string): string {
  if (!/<html/i.test(raw) && !/<body/i.test(raw)) {
    return raw;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "text/html");
  const body = doc.body;
  if (body && body.innerHTML.trim()) {
    return body.innerHTML;
  }
  return raw;
}

function processTextImport(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const paragraphs = escaped.split(/\n\n+/);
  return paragraphs
    .map((p) => p.replace(/\n/g, "<br>"))
    .join("<div><br></div>");
}

async function processMarkdownImport(raw: string): Promise<string> {
  const marked = await getMarked();
  return await marked.parse(raw, {
    async: true,
    breaks: true,
    gfm: true,
  });
}

export async function importMarkdown(): Promise<string | null> {
  const result = await importFile();
  return result?.html ?? null;
}
