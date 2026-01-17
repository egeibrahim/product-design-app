import { useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesignElement, ProductMockup } from "./types";

interface DesignCanvasProps {
  elements: DesignElement[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  currentProduct: ProductMockup;
}

export function DesignCanvas({
  elements,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  zoom,
  onZoomChange,
  currentProduct,
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectElement(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string, element: DesignElement) => {
    e.stopPropagation();
    onSelectElement(elementId);
    setIsDragging(true);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

    const clampedX = Math.max(10, Math.min(90, x));
    const clampedY = Math.max(10, Math.min(90, y));

    onUpdateElement(selectedElement, { x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex-1 canvas-area flex flex-col">
      {/* Canvas Toolbar */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{currentProduct.name} Design</span>
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
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={canvasRef}
          id="design-canvas"
          className="relative bg-card rounded-lg shadow-designer-lg transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {/* Product Mockup */}
          <img
            src={currentProduct.image}
            alt={`${currentProduct.name} Mockup`}
            className="w-[400px] h-auto select-none"
            draggable={false}
          />

          {/* Design Area Overlay */}
          <div 
            className="absolute border-2 border-dashed border-primary/30 rounded-lg pointer-events-none"
            style={{
              top: `${currentProduct.designArea.top}%`,
              left: `${currentProduct.designArea.left}%`,
              width: `${currentProduct.designArea.width}%`,
              height: `${currentProduct.designArea.height}%`,
            }}
          />

          {/* Design Elements */}
          {elements.map((element) => (
            <div
              key={element.id}
              className={`absolute transition-shadow ${
                selectedElement === element.id
                  ? "ring-2 ring-primary ring-offset-2 cursor-grabbing"
                  : "cursor-grab hover:ring-2 hover:ring-primary/50"
              }`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id, element)}
            >
              {element.type === "text" && (
                <span
                  style={{
                    fontSize: element.fontSize || 24,
                    color: element.color || "#000000",
                    fontFamily: element.fontFamily || "Inter",
                  }}
                  className="whitespace-nowrap font-semibold select-none"
                >
                  {element.content}
                </span>
              )}
              {element.type === "image" && element.imageUrl && (
                <img
                  src={element.imageUrl}
                  alt="Design element"
                  style={{
                    width: element.width || 100,
                    height: element.height || 100,
                  }}
                  className="object-contain select-none"
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
