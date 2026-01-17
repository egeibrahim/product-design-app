import { useState, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
import { ToolSidebar } from "./ToolSidebar";
import { DesignCanvas } from "./DesignCanvas";
import { LayersPanel } from "./LayersPanel";
import { ColorPalette } from "./ColorPalette";
import { ElementActionsBar } from "./ElementActionsBar";
import { ViewSwitcher } from "./ViewSwitcher";
import { UploadPanel } from "./UploadPanel";
import { MockupPanel } from "./MockupPanel";
import { ImageGallery } from "./ImageGallery";
import { TextTemplates } from "./TextTemplates";
import { ProductPanel } from "./ProductPanel";
import { SavedDesignsPanel } from "./SavedDesignsPanel";
import { AdminCatalogPanel } from "./AdminCatalogPanel";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { Download, Save, Undo, Redo, FileImage } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DesignElement, ProductView, ActiveTab } from "./types";
import { toast } from "sonner";
import { useDesignHistory } from "@/hooks/useDesignHistory";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Static mockups for fallback
import tshirtMockup from "@/assets/tshirt-mockup.png";
import hoodieMockup from "@/assets/hoodie-mockup.png";
import mugMockup from "@/assets/mug-mockup.png";
import phonecaseMockup from "@/assets/phonecase-mockup.png";

const mockupImages: Record<string, string> = {
  "11111111-1111-1111-1111-111111111111": tshirtMockup,
  "22222222-2222-2222-2222-222222222222": hoodieMockup,
  "33333333-3333-3333-3333-333333333333": mugMockup,
  "44444444-4444-4444-4444-444444444444": phonecaseMockup,
};

const initialElements: DesignElement[] = [];

export function ProductDesigner() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("upload");
  const [zoom, setZoom] = useState(100);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState("11111111-1111-1111-1111-111111111111");
  const [currentViewId, setCurrentViewId] = useState<string>("");
  const [productViews, setProductViews] = useState<ProductView[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedColorHex, setSelectedColorHex] = useState("#FFFFFF");
  const [colorMockups, setColorMockups] = useState<Record<string, string>>({});
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [designName, setDesignName] = useState("");
  
  // Design elements per view
  const [designsByView, setDesignsByView] = useState<Record<string, DesignElement[]>>({});

  const { elements, setElements, resetElements, undo, redo, canUndo, canRedo } = useDesignHistory(initialElements);

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;
  const currentView = productViews.find((v) => v.id === currentViewId);

  // Fetch views on mount for default product
  useEffect(() => {
    const fetchInitialViews = async () => {
      const { data } = await supabase
        .from("product_views")
        .select("*")
        .eq("product_id", currentProductId)
        .order("view_order");
      
      if (data && data.length > 0) {
        setProductViews(data);
        setCurrentViewId(data[0].id);
      }
    };
    fetchInitialViews();
  }, []);

  // Load views when product changes
  const handleViewsLoaded = useCallback((views: ProductView[]) => {
    setProductViews(views);
    if (views.length > 0 && (!currentViewId || !views.find(v => v.id === currentViewId))) {
      setCurrentViewId(views[0].id);
    }
  }, [currentViewId]);

  // Switch view
  const handleViewChange = useCallback(async (viewId: string) => {
    // Save current elements to current view
    if (currentViewId) {
      setDesignsByView(prev => ({
        ...prev,
        [currentViewId]: elements
      }));
    }
    
    // Load elements for new view
    setCurrentViewId(viewId);
    const viewElements = designsByView[viewId] || [];
    resetElements(viewElements);
    setSelectedElementId(null);
    
    // Fetch color-specific mockup for new view if color is selected
    if (selectedColorId) {
      const { data } = await supabase
        .from("product_view_color_mockups")
        .select("mockup_image_url")
        .eq("product_view_id", viewId)
        .eq("color_id", selectedColorId)
        .maybeSingle();
      
      if (data?.mockup_image_url) {
        setColorMockups(prev => ({
          ...prev,
          [`${viewId}-${selectedColorId}`]: data.mockup_image_url
        }));
      }
    }
  }, [currentViewId, elements, designsByView, resetElements, selectedColorId]);

  // Save current view elements when they change
  useEffect(() => {
    if (currentViewId && elements.length > 0) {
      setDesignsByView(prev => ({
        ...prev,
        [currentViewId]: elements
      }));
    }
  }, [elements, currentViewId]);

  // Handle color selection and fetch color-specific mockup
  const handleColorSelect = useCallback(async (colorId: string, hexCode: string) => {
    setSelectedColorId(colorId);
    setSelectedColorHex(hexCode);
    
    // Fetch color-specific mockup for current view
    if (currentViewId && colorId) {
      const { data } = await supabase
        .from("product_view_color_mockups")
        .select("mockup_image_url")
        .eq("product_view_id", currentViewId)
        .eq("color_id", colorId)
        .maybeSingle();
      
      if (data?.mockup_image_url) {
        setColorMockups(prev => ({
          ...prev,
          [`${currentViewId}-${colorId}`]: data.mockup_image_url
        }));
      }
    }
  }, [currentViewId]);

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

  // Backspace/Delete key to remove selected element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedElementId) {
        e.preventDefault();
        handleDeleteElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, handleDeleteElement]);

  const handleAddText = (text: string, style?: Partial<DesignElement>) => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: "text",
      content: text,
      x: 50,
      y: 45,
      fontSize: style?.fontSize || 24,
      color: "#000000",
      fontFamily: style?.fontFamily || "Inter",
      fontWeight: style?.fontWeight || "normal",
      fontStyle: style?.fontStyle || "normal",
      textDecoration: "none",
      textAlign: "center",
      rotation: 0,
      isVisible: true,
      isLocked: false,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
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
      isVisible: true,
      isLocked: false,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    toast.success("Image added to canvas");
  };

  const handleExport = async (format: "png" | "pdf" | "original") => {
    const canvas = document.getElementById("design-canvas");
    if (!canvas) return;

    try {
      const renderedCanvas = await html2canvas(canvas, {
        backgroundColor: selectedColorHex,
        scale: format === "original" ? 4 : 2,
        useCORS: true,
      });

      const imgData = renderedCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `design-${currentViewId}.${format === "pdf" ? "png" : "png"}`;
      link.href = imgData;
      link.click();

      toast.success(`Design exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export design");
    }
  };

  const handleSaveDesign = async () => {
    if (!designName.trim()) {
      toast.error("Please enter a design name");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to save designs");
      return;
    }

    // Save current view elements first
    const allDesigns = {
      ...designsByView,
      [currentViewId]: elements
    };

    const { error } = await supabase.from("saved_designs").insert({
      user_id: user.id,
      product_id: currentProductId,
      name: designName.trim(),
      design_data: JSON.parse(JSON.stringify(allDesigns)),
    });

    if (!error) {
      toast.success("Design saved successfully");
      setSaveDialogOpen(false);
      setDesignName("");
    } else {
      toast.error("Failed to save design");
    }
  };

  const handleLoadDesign = (designData: Record<string, DesignElement[]>, productId: string) => {
    setDesignsByView(designData);
    if (productId) {
      setCurrentProductId(productId);
    }
    // Load first view's elements
    const firstViewId = Object.keys(designData)[0];
    if (firstViewId) {
      setCurrentViewId(firstViewId);
      resetElements(designData[firstViewId] || []);
    }
    setSelectedElementId(null);
  };

  // Element action handlers
  const handleAlign = (alignment: string) => {
    if (!selectedElementId || !currentView) return;
    
    const updates: Partial<DesignElement> = {};
    if (alignment === "left") updates.x = 20;
    if (alignment === "center") updates.x = 50;
    if (alignment === "right") updates.x = 80;
    if (alignment === "top") updates.y = 20;
    if (alignment === "middle") updates.y = 50;
    if (alignment === "bottom") updates.y = 80;
    
    handleUpdateElement(selectedElementId, updates);
  };

  const handleFlip = (direction: "horizontal" | "vertical") => {
    // Flip would require additional transform properties
    toast.info(`Flip ${direction} - Coming soon`);
  };

  const handleRemoveBg = () => {
    toast.info("Remove background - Coming soon");
  };

  const handleCrop = () => {
    toast.info("Crop - Coming soon");
  };

  const handleDuplicate = () => {
    if (!selectedElement) return;
    
    const newElement: DesignElement = {
      ...selectedElement,
      id: Date.now().toString(),
      x: selectedElement.x + 5,
      y: selectedElement.y + 5,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    toast.success("Element duplicated");
  };

  const handleSaveAsTemplate = () => {
    toast.info("Save as template - Coming soon");
  };

  // Get current mockup image - prioritize color-specific mockup
  const getMockupImage = () => {
    // First check for color-specific mockup
    if (currentViewId && selectedColorId) {
      const colorMockup = colorMockups[`${currentViewId}-${selectedColorId}`];
      if (colorMockup) return colorMockup;
    }
    // Fall back to view's default mockup or static mockups
    return currentView?.mockup_image_url || mockupImages[currentProductId] || tshirtMockup;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "mockup":
        return (
          <MockupPanel
            views={productViews}
            designsByView={designsByView}
            productColor={selectedColorHex}
          />
        );
      case "upload":
        return <UploadPanel onImageSelect={handleImageUpload} />;
      case "image":
        return <ImageGallery onImageSelect={handleImageUpload} />;
      case "text":
        return <TextTemplates onAddText={handleAddText} />;
      case "product":
        return (
          <ProductPanel
            selectedProductId={currentProductId}
            onProductSelect={setCurrentProductId}
            onViewsLoaded={handleViewsLoaded}
          />
        );
      case "saved":
        return <SavedDesignsPanel onLoadDesign={handleLoadDesign} />;
      case "layers":
        return (
          <LayersPanel
            elements={elements}
            selectedElement={selectedElementId}
            onSelectElement={setSelectedElementId}
            onDeleteElement={handleDeleteElement}
            onUpdateElement={handleUpdateElement}
          />
        );
      case "admin":
        return isAdmin ? <AdminCatalogPanel /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar - Dynamic based on selection */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Product Designer</h1>
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

          <div className="w-px h-6 bg-border" />

          {/* Dynamic toolbar content */}
          <div className="flex-1 overflow-hidden">
            {selectedElement ? (
              <ElementActionsBar
                onAlign={handleAlign}
                onFlip={handleFlip}
                onRemoveBg={handleRemoveBg}
                onCrop={handleCrop}
                onDuplicate={handleDuplicate}
                onSaveAsTemplate={handleSaveAsTemplate}
                elementType={selectedElement.type}
              />
            ) : (
              <ColorPalette
                selectedColorId={selectedColorId}
                onColorSelect={handleColorSelect}
                selectedProductId={currentProductId}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              <DropdownMenuItem onClick={() => handleExport("original")}>
                <FileImage className="w-4 h-4 mr-2" />
                Export Original (High-Res)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={() => setSaveDialogOpen(true)}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          <div className="w-px h-6 bg-border ml-2" />
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tabs */}
        <ToolSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isAdmin={isAdmin}
        />

        {/* Tab Content Panel */}
        <aside className="w-72 bg-card border-r border-border overflow-y-auto">
          {renderTabContent()}
        </aside>

        {/* Canvas */}
        <div className="flex-1 flex flex-col">
          <DesignCanvas
            elements={elements.filter(el => el.isVisible !== false)}
            selectedElement={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            zoom={zoom}
            onZoomChange={setZoom}
            currentView={currentView}
            mockupImage={getMockupImage()}
            productColor={selectedColorHex}
          />
          
          {/* View Switcher */}
          <div className="bg-card border-t border-border py-3">
            <ViewSwitcher
              views={productViews}
              activeViewId={currentViewId}
              onViewChange={handleViewChange}
            />
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Design</DialogTitle>
            <DialogDescription>
              Enter a name for your design. Your design will be saved to your account.
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
    </div>
  );
}
