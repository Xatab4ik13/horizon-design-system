// Глобальное объявление кастомного элемента <model-viewer> для TS/JSX.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string;
          "ios-src"?: string;
          alt?: string;
          ar?: boolean | "";
          "ar-modes"?: string;
          "camera-controls"?: boolean | "";
          "auto-rotate"?: boolean | "";
          "shadow-intensity"?: string;
          poster?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
