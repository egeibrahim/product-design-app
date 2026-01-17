import { Trash2, GripVertical, Type, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DesignElement } from "./types";

interface LayersPanelProps {
  elements: DesignElement[];
  selectedElement: string | null;
  onSelectElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
}

export function LayersPanel({
  elements,
  selectedElement,
  onSelectElement,
  onDeleteElement,
}: LayersPanelProps) {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col animate-fade-in">
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        <h2 className="text-sm font-semibold">Layers</h2>
        <span className="text-xs text-muted-foreground">{elements.length} items</span>
      </div>

      <ScrollArea className="flex-1">
        {elements.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No layers yet. Add text or images to get started.
            </p>
          </div>
        ) : (
          <div className="p-2">
            {elements.map((element) => (
              <div
                key={element.id}
                className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                  selectedElement === element.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelectElement(element.id)}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                
                <div className="w-6 h-6 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {element.type === "text" ? (
                    <Type className="w-3 h-3 text-muted-foreground" />
                  ) : element.imageUrl ? (
                    <img src={element.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{element.content}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {element.type}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement(element.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
