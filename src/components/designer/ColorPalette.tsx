import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProductColor } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface ColorPaletteProps {
  selectedColorId: string | null;
  onColorSelect: (colorId: string, hexCode: string) => void;
}

export function ColorPalette({ selectedColorId, onColorSelect }: ColorPaletteProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetchColors();
  }, []);

  useEffect(() => {
    checkScroll();
  }, [colors]);

  // Auto-select first color if none selected
  useEffect(() => {
    if (colors.length > 0 && !selectedColorId) {
      onColorSelect(colors[0].id, colors[0].hex_code);
    }
  }, [colors, selectedColorId, onColorSelect]);

  const fetchColors = async () => {
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
          {colors.map((color) => (
            <Tooltip key={color.id}>
              <TooltipTrigger asChild>
                <button
                  className={`w-8 h-8 rounded-full shrink-0 border-2 transition-all hover:scale-110 ${
                    selectedColorId === color.id
                      ? "ring-2 ring-offset-2 ring-foreground scale-110 border-foreground"
                      : "border-border hover:border-foreground/50"
                  }`}
                  style={{ backgroundColor: color.hex_code }}
                  onClick={() => onColorSelect(color.id, color.hex_code)}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{color.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
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
    </div>
  );
}
