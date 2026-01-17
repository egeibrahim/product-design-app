import { useState, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
import { ToolSidebar } from "./ToolSidebar";
import { DesignCanvas } from "./DesignCanvas";
import { PropertyInspector } from "./PropertyInspector";
import { LayersPanel } from "./LayersPanel";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Save, Undo, Redo, FileImage, FileText, FolderOpen } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DesignElement, ProductMockup } from "./types";
import { useToast } from "@/hooks/use-toast";
import { useDesignHistory } from "@/hooks/useDesignHistory";
import { useDesignPersistence } from "@/hooks/useDesignPersistence";
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

const initialElements: DesignElement[] = [
  {
    id: "1",
    type: "text",
    content: "Your Design",
    x: 50,
    y: 40,
    fontSize: 32,
    color: "#3B82F6",
    fontFamily: "Inter",
    fontWeight: "bold",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
    rotation: 0,
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
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
    rotation: 0,
  },
];

export function ProductDesigner() {
  const { toast } = useToast();
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(100);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState("tshirt");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [designName, setDesignName] = useState("");

  const { elements, setElements, resetElements, undo, redo, canUndo, canRedo } = useDesignHistory(initialElements);
  const { savedDesigns, saveDesign, loadDesign, deleteDesign, autoSave, loadAutoSave, clearStorage } = useDesignPersistence();

  const currentProduct = products.find((p) => p.id === currentProductId) || products[0];
  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  const handleUpdateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, [setElements]);

  const handleDeleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId, setElements]);

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
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "center",
      rotation: 0,
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
      rotation: 0,
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

      const imgData = renderedCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${currentProduct.name.toLowerCase()}-design.${format === "pdf" ? "png" : "png"}`;
      link.href = imgData;
      link.click();

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

  const handleSaveDesign = () => {
    if (!designName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your design.",
        variant: "destructive",
      });
      return;
    }
    saveDesign(designName.trim(), elements, currentProductId);
    setSaveDialogOpen(false);
    setDesignName("");
  };

  const handleLoadDesign = (name: string) => {
    const state = loadDesign(name);
    if (state) {
      resetElements(state.elements);
      setCurrentProductId(state.productId);
      setSelectedElementId(null);
    }
    setLoadDialogOpen(false);
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
                <Save className="w-4 h-4 mr-2" />
                Save Design
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLoadDialogOpen(true)}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Load Design
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearStorage} className="text-destructive">
                Clear All Saved Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Design</DialogTitle>
            <DialogDescription>
              Enter a name for your design. Note: Uploaded images are not persisted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="design-name">Design Name</Label>
            <Input
              id="design-name"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="My Awesome Design"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDesign}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Design</DialogTitle>
            <DialogDescription>
              Select a saved design to load.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 max-h-64 overflow-y-auto">
            {savedDesigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No saved designs yet.
              </p>
            ) : (
              savedDesigns.map((design) => (
                <div
                  key={design.name}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => handleLoadDesign(design.name)}
                >
                  <div>
                    <p className="font-medium">{design.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(design.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDesign(design.name);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
