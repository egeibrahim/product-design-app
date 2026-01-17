import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ColorPickerPopover } from "./ColorPickerPopover";
import { ProductColor } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface ColorPaletteProps {
  selectedColorId: string | null;
  selectedColorIds: string[];
  onColorSelect: (colorId: string, hexCode: string) => void;
  onColorToggle: (colorId: string, hexCode: string) => void;
  selectedProductId?: string;
}

export function ColorPalette({ 
  selectedColorId, 
  selectedColorIds,
  onColorSelect, 
  onColorToggle,
  selectedProductId 
}: ColorPaletteProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetchColors();
  }, [selectedProductId]);

  useEffect(() => {
    checkScroll();
  }, [colors]);

  // Auto-select first color if none selected or when product changes
  useEffect(() => {
    if (colors.length > 0 && (!selectedColorId || !colors.find(c => c.id === selectedColorId))) {
      onColorSelect(colors[0].id, colors[0].hex_code);
    }
  }, [colors, selectedColorId, onColorSelect]);

  const fetchColors = async () => {
    // If a product is selected, only show colors assigned to that product
    if (selectedProductId) {
      const { data: variants, error: variantError } = await supabase
        .from("product_color_variants")
        .select("color_id")
        .eq("product_id", selectedProductId);
      
      if (variants && !variantError && variants.length > 0) {
        const colorIds = variants.map(v => v.color_id);
        const { data, error } = await supabase
          .from("product_colors")
          .select("*")
          .eq("is_active", true)
          .in("id", colorIds)
          .order("sort_order");
        
        if (data && !error) {
          setColors(data);
          return;
        }
      }
    }

    // Fallback to all active colors
    const { data, error } = await supabase
      .from("product_colors")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (data && !error) {
      setColors(data);
    }
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  // Helper to determine if a color is light
  const isLightColor = (hexCode: string): boolean => {
    const hex = hexCode.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  if (colors.length === 0) {
    return (
      <div className="flex items-center gap-2 h-full text-sm text-muted-foreground">
        Henüz renk eklenmemiş
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 h-full">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onScroll={checkScroll}
      >
        <TooltipProvider delayDuration={200}>
          {colors.map((color) => {
            const isActive = selectedColorId === color.id;
            const isSelected = selectedColorIds.includes(color.id);
            
            return (
              <Tooltip key={color.id}>
                <TooltipTrigger asChild>
                  <button
                    className={`relative w-8 h-8 rounded-full shrink-0 border-2 transition-all hover:scale-110 ${
                      isActive
                        ? "ring-2 ring-offset-2 ring-primary scale-110 border-primary"
                        : isSelected
                        ? "ring-1 ring-offset-1 ring-primary/50 border-primary/50"
                        : "border-border hover:border-foreground/50"
                    }`}
                    style={{ backgroundColor: color.hex_code }}
                    onClick={() => onColorSelect(color.id, color.hex_code)}
                  >
                    {isSelected && (
                      <Check 
                        className={`absolute inset-0 m-auto h-4 w-4 ${
                          isLightColor(color.hex_code) ? "text-foreground" : "text-white"
                        }`} 
                      />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{color.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Color Picker Popover for multi-select */}
      <ColorPickerPopover
        selectedColorIds={selectedColorIds}
        onColorToggle={onColorToggle}
        selectedProductId={selectedProductId}
      />
    </div>
  );
}
