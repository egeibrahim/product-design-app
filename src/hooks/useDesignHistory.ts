import { useState, useCallback, useEffect } from "react";
import { DesignElement } from "@/components/designer/types";

interface HistoryState {
  elements: DesignElement[];
}

export function useDesignHistory(initialElements: DesignElement[]) {
  const [history, setHistory] = useState<HistoryState[]>([{ elements: initialElements }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const elements = history[currentIndex]?.elements || [];

  const setElements = useCallback((newElements: DesignElement[] | ((prev: DesignElement[]) => DesignElement[])) => {
    setHistory((prev) => {
      const current = prev[currentIndex]?.elements || [];
      const updated = typeof newElements === "function" ? newElements(current) : newElements;
      
      // Remove any future states when making a new change
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push({ elements: updated });
      
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    setCurrentIndex((prev) => Math.min(prev + 1, 50));
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, history.length]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    elements,
    setElements,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
