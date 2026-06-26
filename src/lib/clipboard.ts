import DOMPurify from "dompurify";

export async function copyHtml(plainText: string, htmlContent: string): Promise<void> {
  const sanitized = DOMPurify.sanitize(htmlContent);
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([plainText], { type: "text/plain" }),
        "text/html": new Blob([sanitized], { type: "text/html" }),
      }),
    ]);
  } catch {
    try {
      await navigator.clipboard.writeText(plainText);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }
}
