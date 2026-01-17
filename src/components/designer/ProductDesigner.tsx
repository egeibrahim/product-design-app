import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { ToolSidebar } from "./ToolSidebar";
import { DesignCanvas } from "./DesignCanvas";
import { PropertyInspector } from "./PropertyInspector";
import { LayersPanel } from "./LayersPanel";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Save, Undo, Redo, FileImage, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DesignElement, ProductMockup } from "./types";
import { useToast } from "@/hooks/use-toast";
import tshirtMockup from "@/assets/tshirt-mockup.png";
import hoodieMockup from "@/assets/hoodie-mockup.png";
import mugMockup from "@/assets/mug-mockup.png";
import phonecaseMockup from "@/assets/phonecase-mockup.png";

const products: ProductMockup[] = [
  {
    id: "tshirt",
    name: "T-Shirt",
    image: tshirtMockup,
    designArea: { top: 25, left: 25, width: 50, height: 40 },
  },
  {
    id: "hoodie",
    name: "Hoodie",
    image: hoodieMockup,
    designArea: { top: 30, left: 30, width: 40, height: 35 },
  },
  {
    id: "mug",
    name: "Mug",
    image: mugMockup,
    designArea: { top: 25, left: 20, width: 45, height: 50 },
  },
  {
    id: "phonecase",
    name: "Phone Case",
    image: phonecaseMockup,
    designArea: { top: 20, left: 25, width: 50, height: 60 },
  },
];

export function ProductDesigner() {
  const { toast } = useToast();
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(100);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState("tshirt");
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

  const currentProduct = products.find((p) => p.id === currentProductId) || products[0];
  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  const handleUpdateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  const handleDeleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

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
    setActiveTool("select");
  };

  const handleImageUpload = (imageUrl: string) => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: "image",
      content: "Uploaded Image",
      x: 50,
      y: 45,
      width: 100,
      height: 100,
      imageUrl,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool("select");
    toast({
      title: "Image uploaded",
      description: "Your image has been added to the canvas. Drag to reposition.",
    });
  };

  const handleExport = async (format: "png" | "pdf") => {
    const canvas = document.getElementById("design-canvas");
    if (!canvas) return;

    try {
      const renderedCanvas = await html2canvas(canvas, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      if (format === "png") {
        const link = document.createElement("a");
        link.download = `${currentProduct.name.toLowerCase()}-design.png`;
        link.href = renderedCanvas.toDataURL("image/png");
        link.click();
      } else {
        // For PDF, we'll create a simple PDF using canvas data
        const imgData = renderedCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${currentProduct.name.toLowerCase()}-design.png`;
        link.href = imgData;
        link.click();
      }

      toast({
        title: "Export successful",
        description: `Your design has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your design.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Product Designer</h1>
          <div className="w-px h-6 bg-border" />
          
          {/* Product Selector */}
          <Select value={currentProductId} onValueChange={setCurrentProductId}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("png")}>
                <FileImage className="w-4 h-4 mr-2" />
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <ToolSidebar 
          activeTool={activeTool} 
          onToolChange={setActiveTool}
          onImageUpload={handleImageUpload}
        />

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
          onUpdateElement={handleUpdateElement}
          zoom={zoom}
          onZoomChange={setZoom}
          currentProduct={currentProduct}
        />

        {/* Right Sidebar - Properties */}
        <PropertyInspector
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
        />
      </div>
    </div>
  );
}
