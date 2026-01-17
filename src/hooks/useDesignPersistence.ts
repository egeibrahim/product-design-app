import { useCallback, useEffect, useState } from "react";
import { DesignElement, DesignState } from "@/components/designer/types";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "product-designer-state";

export function useDesignPersistence() {
  const { toast } = useToast();
  const [savedDesigns, setSavedDesigns] = useState<{ name: string; state: DesignState; timestamp: number }[]>([]);

  // Load saved designs list on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY + "-list");
    if (saved) {
      try {
        setSavedDesigns(JSON.parse(saved));
      } catch {
        console.error("Failed to load saved designs");
      }
    }
  }, []);

  const saveDesign = useCallback((name: string, elements: DesignElement[], productId: string) => {
    const newDesign = {
      name,
      state: { elements, productId },
      timestamp: Date.now(),
    };

    setSavedDesigns((prev) => {
      const existing = prev.findIndex((d) => d.name === name);
      let updated;
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = newDesign;
      } else {
        updated = [...prev, newDesign];
      }
      localStorage.setItem(STORAGE_KEY + "-list", JSON.stringify(updated));
      return updated;
    });

    toast({
      title: "Design saved",
      description: `"${name}" has been saved successfully.`,
    });
  }, [toast]);

  const loadDesign = useCallback((name: string): DesignState | null => {
    const design = savedDesigns.find((d) => d.name === name);
    if (design) {
      toast({
        title: "Design loaded",
        description: `"${name}" has been loaded.`,
      });
      return design.state;
    }
    return null;
  }, [savedDesigns, toast]);

  const deleteDesign = useCallback((name: string) => {
    setSavedDesigns((prev) => {
      const updated = prev.filter((d) => d.name !== name);
      localStorage.setItem(STORAGE_KEY + "-list", JSON.stringify(updated));
      return updated;
    });

    toast({
      title: "Design deleted",
      description: `"${name}" has been removed.`,
    });
  }, [toast]);

  // Auto-save current design
  const autoSave = useCallback((elements: DesignElement[], productId: string) => {
    const state: DesignState = { elements, productId };
    localStorage.setItem(STORAGE_KEY + "-autosave", JSON.stringify(state));
  }, []);

  const loadAutoSave = useCallback((): DesignState | null => {
    const saved = localStorage.getItem(STORAGE_KEY + "-autosave");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  return {
    savedDesigns,
    saveDesign,
    loadDesign,
    deleteDesign,
    autoSave,
    loadAutoSave,
  };
}
