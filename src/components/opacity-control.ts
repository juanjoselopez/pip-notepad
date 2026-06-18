export class OpacityControl {
  private slider: HTMLInputElement;
  private currentOpacity: number = 1.0;
  private listeners: Array<(opacity: number) => void> = [];

  constructor() {
    const slider = document.getElementById("opacity-slider") as HTMLInputElement;
    if (!slider) throw new Error("Opacity slider not found");
    this.slider = slider;
    slider.addEventListener("input", () => {
      this.currentOpacity = parseFloat(slider.value);
      this.listeners.forEach((fn) => fn(this.currentOpacity));
    });
  }

  setOpacity(opacity: number): void {
    this.currentOpacity = Math.max(0.5, Math.min(1.0, opacity));
    this.slider.value = this.currentOpacity.toString();
  }

  getOpacity(): number {
    return this.currentOpacity;
  }

  onChange(fn: (opacity: number) => void): void {
    this.listeners.push(fn);
  }
}
