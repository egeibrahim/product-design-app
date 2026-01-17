import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { ProductView, DesignElement, ProductColor } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface MockupPanelProps {
  views: ProductView[];
  designsByView: Record<string, DesignElement[]>;
  productColor: string;
  selectedColorIds: string[];
  activeColorId: string | null;
  onColorSelect: (colorId: string, hexCode: string) => void;
  activeViewId: string;
  selectedProductId?: string;
}

export function MockupPanel({ 
  views, 
  designsByView, 
  productColor,
  selectedColorIds,
  activeColorId,
  onColorSelect,
  activeViewId,
  selectedProductId
}: MockupPanelProps) {
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [colorMockups, setColorMockups] = useState<Record<string, string>>({});
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  // Fetch colors based on selectedColorIds
  useEffect(() => {
    fetchColors();
  }, [selectedColorIds, selectedProductId]);

  // Fetch mockups for selected colors and active view
  useEffect(() => {
    if (activeViewId && selectedColorIds.length > 0) {
      fetchColorMockups();
    }
  }, [activeViewId, selectedColorIds]);

  const fetchColors = async () => {
    if (selectedColorIds.length === 0) {
      // If no colors selected, show all available colors for the product
      if (selectedProductId) {
        const { data: variants } = await supabase
          .from("product_color_variants")
          .select("color_id")
          .eq("product_id", selectedProductId);
        
        if (variants && variants.length > 0) {
          const colorIds = variants.map(v => v.color_id);
          const { data } = await supabase
            .from("product_colors")
            .select("*")
            .eq("is_active", true)
            .in("id", colorIds)
            .order("sort_order");
          
          if (data) {
            setColors(data);
            return;
          }
        }
      }

      const { data } = await supabase
        .from("product_colors")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      
      if (data) {
        setColors(data);
      }
    } else {
      const { data } = await supabase
        .from("product_colors")
        .select("*")
        .in("id", selectedColorIds)
        .order("sort_order");
      
      if (data) {
        setColors(data);
      }
    }
  };

  const fetchColorMockups = async () => {
    const { data } = await supabase
      .from("product_view_color_mockups")
      .select("*")
      .eq("product_view_id", activeViewId)
      .in("color_id", selectedColorIds);

    if (data) {
      const mockupMap: Record<string, string> = {};
      data.forEach(item => {
        mockupMap[item.color_id] = item.mockup_image_url;
      });
      setColorMockups(mockupMap);
    }
  };

  const currentView = views.find(v => v.id === activeViewId);
  const currentElements = designsByView[activeViewId] || [];

  const renderColorCard = (color: ProductColor) => {
    const isActive = activeColorId === color.id;
    const mockupUrl = colorMockups[color.id];

    return (
      <div
        key={color.id}
        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
          isActive 
            ? "border-primary ring-2 ring-primary/20" 
            : "border-border hover:border-primary/50"
        }`}
        onClick={() => onColorSelect(color.id, color.hex_code)}
      >
        {/* Background - either mockup image or solid color */}
        {mockupUrl ? (
          <img 
            src={mockupUrl} 
            alt={color.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: color.hex_code }}
          />
        )}

        {/* Design overlay */}
        {currentView && (
          <div 
            className="absolute flex items-center justify-center"
            style={{
              top: `${currentView.design_area_top}%`,
              left: `${currentView.design_area_left}%`,
              width: `${currentView.design_area_width}%`,
              height: `${currentView.design_area_height}%`,
            }}
          >
            <div className="relative w-full h-full">
              {currentElements.filter(el => el.isVisible !== false).map((element) => (
                <div
                  key={element.id}
                  className="absolute"
                  style={{
                    left: `${element.x}%`,
                    top: `${element.y}%`,
                    transform: `rotate(${element.rotation || 0}deg) scale(0.25)`,
                    transformOrigin: "top left",
                  }}
                >
                  {element.type === "text" ? (
                    <span
                      style={{
                        fontSize: element.fontSize,
                        color: element.color,
                        fontFamily: element.fontFamily,
                        fontWeight: element.fontWeight,
                        fontStyle: element.fontStyle,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {element.content}
                    </span>
                  ) : (
                    <img
                      src={element.imageUrl}
                      alt=""
                      style={{
                        width: element.width ? `${element.width}px` : "auto",
                        height: element.height ? `${element.height}px` : "auto",
                      }}
                      className="object-contain"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}

        {/* Color name label */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <span className="text-xs text-white font-medium">{color.name}</span>
        </div>
      </div>
    );
  };

  // Full preview for selected color
  const renderFullPreview = () => {
    if (!selectedPreview) return null;
    
    const color = colors.find(c => c.id === selectedPreview);
    if (!color || !currentView) return null;

    const mockupUrl = colorMockups[selectedPreview];

    return (
      <div className="mt-4 p-3 border border-border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{color.name} - Tam Önizleme</span>
          <button 
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedPreview(null)}
          >
            Kapat
          </button>
        </div>
        <div
          className="relative w-full aspect-square rounded-lg overflow-hidden"
          style={{ backgroundColor: mockupUrl ? 'transparent' : color.hex_code }}
        >
          {mockupUrl && (
            <img 
              src={mockupUrl} 
              alt={color.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div 
            className="absolute flex items-center justify-center"
            style={{
              top: `${currentView.design_area_top}%`,
              left: `${currentView.design_area_left}%`,
              width: `${currentView.design_area_width}%`,
              height: `${currentView.design_area_height}%`,
            }}
          >
            <div className="relative w-full h-full">
              {currentElements.filter(el => el.isVisible !== false).map((element) => (
                <div
                  key={element.id}
                  className="absolute"
                  style={{
                    left: `${element.x}%`,
                    top: `${element.y}%`,
                    transform: `rotate(${element.rotation || 0}deg)`,
                    transformOrigin: "top left",
                  }}
                >
                  {element.type === "text" ? (
                    <span
                      style={{
                        fontSize: element.fontSize,
                        color: element.color,
                        fontFamily: element.fontFamily,
                        fontWeight: element.fontWeight,
                        fontStyle: element.fontStyle,
                      }}
                    >
                      {element.content}
                    </span>
                  ) : (
                    <img
                      src={element.imageUrl}
                      alt=""
                      style={{
                        width: element.width ? `${element.width}px` : "auto",
                        height: element.height ? `${element.height}px` : "auto",
                      }}
                      className="object-contain"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium text-sm">Renk Varyantları</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {colors.length > 0 
            ? `${colors.length} renk seçeneği`
            : "Renk seçerek önizleme yapın"
          }
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3">
          {colors.map(renderColorCard)}
        </div>

        {colors.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Henüz renk seçilmedi</p>
            <p className="text-xs mt-1">
              Üst toolbar'dan renk seçin
            </p>
          </div>
        )}

        {renderFullPreview()}
      </ScrollArea>
    </div>
  );
}
