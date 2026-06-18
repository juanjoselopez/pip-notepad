export async function copyHtml(plainText: string, htmlContent: string): Promise<void> {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([plainText], { type: "text/plain" }),
        "text/html": new Blob([htmlContent], { type: "text/html" }),
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
