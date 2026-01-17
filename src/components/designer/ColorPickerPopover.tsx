import { useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProductColor } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface ColorPickerPopoverProps {
  selectedColorIds: string[];
  onColorToggle: (colorId: string, hexCode: string) => void;
  selectedProductId?: string;
}

export function ColorPickerPopover({ 
  selectedColorIds, 
  onColorToggle, 
  selectedProductId 
}: ColorPickerPopoverProps) {
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchColors();
  }, [selectedProductId]);

  const fetchColors = async () => {
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

    const { data, error } = await supabase
      .from("product_colors")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (data && !error) {
      setColors(data);
    }
  };

  if (colors.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 shrink-0"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3 bg-popover border border-border shadow-lg" 
        align="start"
        sideOffset={8}
      >
        <div className="space-y-3">
          <div className="text-sm font-medium">Renkleri Seç</div>
          <p className="text-xs text-muted-foreground">
            Birden fazla renk seçerek farklı varyantları önizleyin
          </p>
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color) => {
              const isSelected = selectedColorIds.includes(color.id);
              return (
                <button
                  key={color.id}
                  className={`relative w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-primary border-primary"
                      : "border-border hover:border-foreground/50"
                  }`}
                  style={{ backgroundColor: color.hex_code }}
                  onClick={() => onColorToggle(color.id, color.hex_code)}
                  title={color.name}
                >
                  {isSelected && (
                    <Check 
                      className={`absolute inset-0 m-auto h-5 w-5 ${
                        isLightColor(color.hex_code) ? "text-foreground" : "text-white"
                      }`} 
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {selectedColorIds.length} renk seçili
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper to determine if a color is light
function isLightColor(hexCode: string): boolean {
  const hex = hexCode.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
