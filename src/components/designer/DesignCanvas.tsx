import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import tshirtMockup from "@/assets/tshirt-mockup.png";

interface DesignElement {
  id: string;
  type: "text" | "image";
  content: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
}

interface DesignCanvasProps {
  elements: DesignElement[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function DesignCanvas({
  elements,
  selectedElement,
  onSelectElement,
  zoom,
  onZoomChange,
}: DesignCanvasProps) {
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectElement(null);
    }
  };

  return (
    <div className="flex-1 canvas-area flex flex-col">
      {/* Canvas Toolbar */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">T-Shirt Design</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onZoomChange(Math.max(50, zoom - 10))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-2" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onZoomChange(100)}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        className="flex-1 flex items-center justify-center p-8 overflow-auto"
        onClick={handleCanvasClick}
      >
        <div
          className="relative bg-card rounded-lg shadow-designer-lg transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {/* T-Shirt Mockup */}
          <img
            src={tshirtMockup}
            alt="T-Shirt Mockup"
            className="w-[400px] h-auto select-none"
            draggable={false}
          />

          {/* Design Area Overlay */}
          <div className="absolute top-[25%] left-[25%] w-[50%] h-[40%] border-2 border-dashed border-primary/30 rounded-lg pointer-events-none" />

          {/* Design Elements */}
          {elements.map((element) => (
            <div
              key={element.id}
              className={`absolute cursor-move transition-all ${
                selectedElement === element.id
                  ? "ring-2 ring-primary ring-offset-2"
                  : ""
              }`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(element.id);
              }}
            >
              {element.type === "text" && (
                <span
                  style={{
                    fontSize: element.fontSize || 24,
                    color: element.color || "#000000",
                    fontFamily: element.fontFamily || "Inter",
                  }}
                  className="whitespace-nowrap font-semibold"
                >
                  {element.content}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
