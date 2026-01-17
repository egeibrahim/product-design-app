import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProductColor } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (hexCode: string) => void;
}

export function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
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
                    selectedColor === color.hex_code
                      ? "border-primary ring-2 ring-primary/50 scale-110"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: color.hex_code }}
                  onClick={() => onColorSelect(color.hex_code)}
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
