export class Drag {
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private windowStartX = 0;
  private windowStartY = 0;

  constructor() {
    const titlebar = document.getElementById("titlebar");
    if (!titlebar) return;

    titlebar.addEventListener("mousedown", (e) => this.onMouseDown(e));
    document.addEventListener("mousemove", (e) => this.onMouseMove(e));
    document.addEventListener("mouseup", () => this.onMouseUp());
  }

  private async onMouseDown(e: MouseEvent): Promise<void> {
    if ((e.target as HTMLElement).closest("#window-controls")) return;

    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;

    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      const pos = await win.outerPosition();
      this.windowStartX = pos.x;
      this.windowStartY = pos.y;
    } catch {
      this.isDragging = false;
    }
  }

  private async onMouseMove(e: MouseEvent): Promise<void> {
    if (!this.isDragging) return;

    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;

    try {
      const { LogicalPosition } = await import("@tauri-apps/api/dpi");
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      await win.setPosition(new LogicalPosition(
        this.windowStartX + dx,
        this.windowStartY + dy,
      ));
    } catch {
      this.isDragging = false;
    }
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }
}
