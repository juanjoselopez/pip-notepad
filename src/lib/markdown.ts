let TurndownService: any = null;

async function getTurndown(): Promise<any> {
  if (!TurndownService) {
    const mod = await import("turndown");
    TurndownService = mod.default || mod;
  }
  return TurndownService;
}

export async function htmlToMarkdown(html: string): Promise<string> {
  try {
    const Turndown = await getTurndown();
    const turndownService = new Turndown({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      bulletListMarker: "-",
    });
    return turndownService.turndown(html);
  } catch {
    return stripHtml(html);
  }
}

export function htmlToPlainText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText;
}

export function wrapAsHtmlPage(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PiP Notepad Export</title>
<style>
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #1e1e2e;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0 0.25em; color: #3b82f6; }
  h2 { font-size: 1.5em; font-weight: 600; margin: 0.5em 0 0.25em; color: #06b6d4; }
  h3 { font-size: 1.25em; font-weight: 600; margin: 0.4em 0 0.2em; color: #6366f1; }
  blockquote { border-left: 3px solid #3b82f6; padding-left: 12px; margin: 0.5em 0; color: #64748b; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
${content}
</body>
</html>`;
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText;
}
