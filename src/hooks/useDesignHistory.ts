import { useState, useCallback, useEffect, useRef } from "react";
import { DesignElement } from "@/components/designer/types";

interface HistoryState {
  elements: DesignElement[];
}

export function useDesignHistory(initialElements: DesignElement[]) {
  const [history, setHistory] = useState<HistoryState[]>([{ elements: initialElements }]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedo = useRef(false);

  const elements = history[currentIndex]?.elements || initialElements;

  const setElements = useCallback((newElements: DesignElement[] | ((prev: DesignElement[]) => DesignElement[])) => {
    // Skip history recording during undo/redo
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }

    setHistory((prevHistory) => {
      setCurrentIndex((prevIndex) => {
        const current = prevHistory[prevIndex]?.elements || [];
        const updated = typeof newElements === "function" ? newElements(current) : newElements;
        
        // Remove any future states when making a new change
        const newHistory = prevHistory.slice(0, prevIndex + 1);
        newHistory.push({ elements: updated });
        
        // Limit history to 50 states
        if (newHistory.length > 50) {
          newHistory.shift();
          // Update history in place
          setHistory(newHistory);
          return Math.min(newHistory.length - 1, 49);
        }
        
        // Update history
        setHistory(newHistory);
        return prevIndex + 1;
      });
      
      return prevHistory; // Return unchanged, actual update happens in setCurrentIndex
    });
  }, []);

  const undo = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < history.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [history.length]);

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

  // Reset elements function (for loading saved designs)
  const resetElements = useCallback((newElements: DesignElement[]) => {
    setHistory([{ elements: newElements }]);
    setCurrentIndex(0);
  }, []);

  return {
    elements,
    setElements,
    resetElements,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
