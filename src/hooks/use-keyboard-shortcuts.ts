"use client";

import { useEffect } from "react";

interface KeyHandlers {
  onSpace?: () => void;
  onEnter?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onOne?: () => void;
  onTwo?: () => void;
  onThree?: () => void;
  onFour?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === "Space" && handlers.onSpace) {
        e.preventDefault();
        handlers.onSpace();
      } else if (e.code === "Enter" && handlers.onEnter) {
        e.preventDefault();
        handlers.onEnter();
      } else if (e.code === "ArrowLeft" && handlers.onArrowLeft) {
        e.preventDefault();
        handlers.onArrowLeft();
      } else if (e.code === "ArrowRight" && handlers.onArrowRight) {
        e.preventDefault();
        handlers.onArrowRight();
      } else if (e.key === "1" && handlers.onOne) {
        e.preventDefault();
        handlers.onOne();
      } else if (e.key === "2" && handlers.onTwo) {
        e.preventDefault();
        handlers.onTwo();
      } else if (e.key === "3" && handlers.onThree) {
        e.preventDefault();
        handlers.onThree();
      } else if (e.key === "4" && handlers.onFour) {
        e.preventDefault();
        handlers.onFour();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers, enabled]);
}
