export interface Toast {
  message(text: string): void;
  destroy(): void;
}
