import { useRef, useState, useCallback } from "react";
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

type ResizeHandle = "nw" | "ne" | "sw" | "se" | null;

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
  const [isResizing, setIsResizing] = useState<ResizeHandle>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [initialRotation, setInitialRotation] = useState(0);
  const [rotationCenter, setRotationCenter] = useState({ x: 0, y: 0 });

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectElement(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    // Only start dragging on primary mouse button
    if (e.button !== 0) return;
    
    e.stopPropagation();
    e.preventDefault();
    onSelectElement(elementId);
    setIsDragging(true);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

  const handleResizeStart = (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => {
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    setIsResizing(handle);
    setInitialSize({
      width: element.width || 100,
      height: element.height || 100,
    });
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handleRotateStart = (e: React.MouseEvent, elementId: string, element: DesignElement) => {
    e.stopPropagation();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + (element.x / 100) * rect.width;
    const centerY = rect.top + (element.y / 100) * rect.height;

    setIsRotating(true);
    setRotationCenter({ x: centerX, y: centerY });
    setInitialRotation(element.rotation || 0);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectedElement || !canvasRef.current) return;

    const element = elements.find((el) => el.id === selectedElement);
    if (!element) return;

    if (isRotating) {
      const angle = Math.atan2(
        e.clientY - rotationCenter.y,
        e.clientX - rotationCenter.x
      );
      const degrees = (angle * 180) / Math.PI + 90;
      onUpdateElement(selectedElement, { rotation: Math.round(degrees) });
      return;
    }

    if (isResizing) {
      const deltaX = e.clientX - dragOffset.x;
      const deltaY = e.clientY - dragOffset.y;
      
      let newWidth = initialSize.width;
      let newHeight = initialSize.height;

      if (isResizing.includes("e")) {
        newWidth = Math.max(20, initialSize.width + deltaX);
      }
      if (isResizing.includes("w")) {
        newWidth = Math.max(20, initialSize.width - deltaX);
      }
      if (isResizing.includes("s")) {
        newHeight = Math.max(20, initialSize.height + deltaY);
      }
      if (isResizing.includes("n")) {
        newHeight = Math.max(20, initialSize.height - deltaY);
      }

      onUpdateElement(selectedElement, { width: newWidth, height: newHeight });
      return;
    }

    if (isDragging) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

      const clampedX = Math.max(10, Math.min(90, x));
      const clampedY = Math.max(10, Math.min(90, y));

      onUpdateElement(selectedElement, { x: clampedX, y: clampedY });
    }
  }, [isDragging, isResizing, isRotating, selectedElement, dragOffset, initialSize, rotationCenter, onUpdateElement, elements]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
    setIsRotating(false);
  };

  const getElementStyle = (element: DesignElement) => ({
    left: `${element.x}%`,
    top: `${element.y}%`,
    transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
  });

  const getTextStyle = (element: DesignElement) => ({
    fontSize: element.fontSize || 24,
    color: element.color || "#000000",
    fontFamily: element.fontFamily || "Inter",
    fontWeight: element.fontWeight || "normal",
    fontStyle: element.fontStyle || "normal",
    textDecoration: element.textDecoration || "none",
    textAlign: element.textAlign || "center",
  });

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
          {elements.map((element) => {
            const isSelected = selectedElement === element.id;
            
            return (
              <div
                key={element.id}
                className={`absolute transition-shadow ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2"
                    : "hover:ring-2 hover:ring-primary/50"
                } ${isDragging && isSelected ? "cursor-grabbing" : "cursor-grab"}`}
                style={getElementStyle(element)}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              >
                {element.type === "text" && (
                  <span
                    style={getTextStyle(element)}
                    className="whitespace-nowrap select-none block"
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

                {/* Resize Handles */}
                {isSelected && (
                  <>
                    {/* Corner handles */}
                    <div
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-sm cursor-nw-resize"
                      onMouseDown={(e) => handleResizeStart(e, element.id, "nw")}
                    />
                    <div
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-sm cursor-ne-resize"
                      onMouseDown={(e) => handleResizeStart(e, element.id, "ne")}
                    />
                    <div
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-sm cursor-sw-resize"
                      onMouseDown={(e) => handleResizeStart(e, element.id, "sw")}
                    />
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-sm cursor-se-resize"
                      onMouseDown={(e) => handleResizeStart(e, element.id, "se")}
                    />
                    
                    {/* Rotation handle */}
                    <div
                      className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full cursor-grab flex items-center justify-center"
                      onMouseDown={(e) => handleRotateStart(e, element.id, element)}
                    >
                      <div className="absolute top-4 w-px h-4 bg-primary" />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
