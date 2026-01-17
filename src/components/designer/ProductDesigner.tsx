import { useState } from "react";
import { ToolSidebar } from "./ToolSidebar";
import { DesignCanvas } from "./DesignCanvas";
import { PropertyInspector } from "./PropertyInspector";
import { LayersPanel } from "./LayersPanel";
import { Button } from "@/components/ui/button";
import { Plus, Download, Save, Undo, Redo, Settings } from "lucide-react";

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

export function ProductDesigner() {
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(100);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [elements, setElements] = useState<DesignElement[]>([
    {
      id: "1",
      type: "text",
      content: "Your Design",
      x: 50,
      y: 40,
      fontSize: 32,
      color: "#3B82F6",
      fontFamily: "Inter",
    },
    {
      id: "2",
      type: "text",
      content: "Here",
      x: 50,
      y: 50,
      fontSize: 24,
      color: "#000000",
      fontFamily: "Inter",
    },
  ]);

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  const handleUpdateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const handleDeleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const handleAddText = () => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: "text",
      content: "New Text",
      x: 50,
      y: 45,
      fontSize: 24,
      color: "#000000",
      fontFamily: "Inter",
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Product Designer</h1>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAddText}>
            <Plus className="w-4 h-4 mr-2" />
            Add Text
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <ToolSidebar activeTool={activeTool} onToolChange={setActiveTool} />

        {/* Layers Panel (shown when layers tool is active) */}
        {activeTool === "layers" && (
          <LayersPanel
            elements={elements}
            selectedElement={selectedElementId}
            onSelectElement={setSelectedElementId}
            onDeleteElement={handleDeleteElement}
          />
        )}

        {/* Canvas */}
        <DesignCanvas
          elements={elements}
          selectedElement={selectedElementId}
          onSelectElement={setSelectedElementId}
          zoom={zoom}
          onZoomChange={setZoom}
        />

        {/* Right Sidebar - Properties */}
        <PropertyInspector
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
        />
      </div>
    </div>
  );
}
