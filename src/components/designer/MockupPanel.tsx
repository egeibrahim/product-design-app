import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductView, DesignElement } from "./types";

interface MockupPanelProps {
  views: ProductView[];
  designsByView: Record<string, DesignElement[]>;
  productColor: string;
}

export function MockupPanel({ views, designsByView, productColor }: MockupPanelProps) {
  const [selectedView, setSelectedView] = useState<string | null>(null);

  const renderMockupPreview = (view: ProductView, elements: DesignElement[]) => {
    return (
      <div
        className="relative w-full aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        style={{ backgroundColor: productColor }}
        onClick={() => setSelectedView(view.id)}
      >
        {/* Mockup image would go here */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative"
            style={{
              width: `${view.design_area_width}%`,
              height: `${view.design_area_height}%`,
              top: `${view.design_area_top}%`,
              left: `${view.design_area_left}%`,
            }}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: element.width ? `${element.width}px` : "auto",
                  height: element.height ? `${element.height}px` : "auto",
                  transform: `rotate(${element.rotation || 0}deg) scale(0.3)`,
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
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
          {view.view_name}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium text-sm">Realistic Preview</h3>
        <p className="text-xs text-muted-foreground mt-1">
          See how your design looks on the product
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-4">
          {views.map((view) => (
            <div key={view.id}>
              {renderMockupPreview(view, designsByView[view.id] || [])}
            </div>
          ))}
        </div>

        {/* Large Preview */}
        {selectedView && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">
              {views.find((v) => v.id === selectedView)?.view_name} - Full Preview
            </div>
            <div
              className="relative w-full aspect-square rounded-lg overflow-hidden"
              style={{ backgroundColor: productColor }}
            >
              {/* Full size mockup preview */}
              <div className="absolute inset-0 flex items-center justify-center">
                {views
                  .filter((v) => v.id === selectedView)
                  .map((view) => (
                    <div
                      key={view.id}
                      className="relative"
                      style={{
                        width: `${view.design_area_width}%`,
                        height: `${view.design_area_height}%`,
                      }}
                    >
                      {(designsByView[view.id] || []).map((element) => (
                        <div
                          key={element.id}
                          className="absolute"
                          style={{
                            left: `${element.x}%`,
                            top: `${element.y}%`,
                            width: element.width ? `${element.width}px` : "auto",
                            height: element.height ? `${element.height}px` : "auto",
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
                              className="max-w-full max-h-full object-contain"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
