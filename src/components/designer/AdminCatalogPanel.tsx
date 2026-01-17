import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Save, Package, Loader2, Image as ImageIcon, ChevronDown, ChevronUp, Pencil, Upload, Palette } from "lucide-react";
import { AdminViewEditor } from "./AdminViewEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface ProductColor {
  id: string;
  name: string;
  hex_code: string;
  sort_order: number;
  is_active: boolean;
}

interface ProductView {
  id: string;
  product_id: string;
  view_name: string;
  view_order: number;
  mockup_image_url: string | null;
  design_area_top: number;
  design_area_left: number;
  design_area_width: number;
  design_area_height: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
}

interface ViewFormData {
  view_name: string;
  mockup_image_url: string;
  design_area_top: number;
  design_area_left: number;
  design_area_width: number;
  design_area_height: number;
}

const DEFAULT_VIEWS: Omit<ViewFormData, 'mockup_image_url'>[] = [
  { view_name: "Ön", design_area_top: 25, design_area_left: 25, design_area_width: 50, design_area_height: 40 },
  { view_name: "Arka", design_area_top: 25, design_area_left: 25, design_area_width: 50, design_area_height: 40 },
  { view_name: "Sol Kol", design_area_top: 30, design_area_left: 30, design_area_width: 40, design_area_height: 50 },
  { view_name: "Sağ Kol", design_area_top: 30, design_area_left: 30, design_area_width: 40, design_area_height: 50 },
];

export function AdminCatalogPanel() {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<"products" | "colors">("products");
  
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-amber-500" />
        <h2 className="font-semibold">Admin Kataloğu</h2>
      </div>
      
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as "products" | "colors")} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Ürünler</TabsTrigger>
          <TabsTrigger value="colors">Renkler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="flex-1 mt-4">
          <ProductsTab />
        </TabsContent>
        
        <TabsContent value="colors" className="flex-1 mt-4">
          <ColorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// === PRODUCTS TAB ===
function ProductsTab() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [viewsData, setViewsData] = useState<ViewFormData[]>(
    DEFAULT_VIEWS.map(v => ({ ...v, mockup_image_url: "" }))
  );
  const [uploadingViewIndex, setUploadingViewIndex] = useState<number | null>(null);

  // Fetch all products (including inactive for admin)
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Product[];
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async () => {
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: newProductName,
          category: newProductCategory || null,
          is_active: false, // Start as inactive (draft)
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create views
      const viewsToInsert = viewsData.map((view, index) => ({
        product_id: product.id,
        view_name: view.view_name,
        view_order: index,
        mockup_image_url: view.mockup_image_url || null,
        design_area_top: view.design_area_top,
        design_area_left: view.design_area_left,
        design_area_width: view.design_area_width,
        design_area_height: view.design_area_height,
      }));

      const { error: viewsError } = await supabase
        .from("product_views")
        .insert(viewsToInsert);

      if (viewsError) throw viewsError;

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ürün oluşturuldu");
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Ürün oluşturulamadı: " + error.message);
    },
  });

  // Toggle product active status
  const toggleProductMutation = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: isActive })
        .eq("id", productId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(isActive ? "Ürün yayınlandı" : "Ürün yayından kaldırıldı");
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ürün silindi");
    },
  });

  const resetForm = () => {
    setNewProductName("");
    setNewProductCategory("");
    setViewsData(DEFAULT_VIEWS.map(v => ({ ...v, mockup_image_url: "" })));
  };

  const handleImageUpload = useCallback(async (file: File, viewIndex: number) => {
    // Validate file type - PNG or JPG only
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error("Sadece PNG veya JPG dosyaları yüklenebilir");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Dosya boyutu maksimum 50MB olmalıdır");
      return;
    }

    setUploadingViewIndex(viewIndex);
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${viewIndex}.${fileExt}`;
    const filePath = `mockups/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-mockups")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Görsel yüklenemedi");
      setUploadingViewIndex(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("product-mockups")
      .getPublicUrl(filePath);

    setViewsData(prev => prev.map((v, i) => 
      i === viewIndex ? { ...v, mockup_image_url: publicUrl } : v
    ));
    
    setUploadingViewIndex(null);
    toast.success(`${viewsData[viewIndex].view_name} görseli yüklendi`);
  }, [viewsData]);

  const handleViewAreaChange = (viewIndex: number, field: keyof ViewFormData, value: number) => {
    setViewsData(prev => prev.map((v, i) => 
      i === viewIndex ? { ...v, [field]: value } : v
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="w-full mb-4">
            <Plus className="w-4 h-4 mr-1" />
            Yeni Ürün Ekle
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Ürün Ekle</DialogTitle>
            <DialogDescription>
              Ürün bilgilerini ve 4 farklı açı için mockup görsellerini yükleyin (2048x2048 px önerilir)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ürün Adı</Label>
                <Input
                  placeholder="Örn: Premium Hoodie"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input
                  placeholder="Örn: Giyim"
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Görünümler (4 Açı)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Her görünüm için 2048x2048 px PNG veya JPG formatında mockup yükleyin
              </p>
              <Accordion type="single" collapsible className="space-y-2">
                {viewsData.map((view, index) => (
                  <AccordionItem value={`view-${index}`} key={index} className="border rounded-lg px-3">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        {view.mockup_image_url ? (
                          <img src={view.mockup_image_url} alt="" className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Upload className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <span>{view.view_name}</span>
                        {view.mockup_image_url && (
                          <Badge variant="secondary" className="text-xs">✓</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Görsel (PNG/JPG, max 50MB)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, index);
                            }}
                            disabled={uploadingViewIndex === index}
                          />
                          {uploadingViewIndex === index && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Üst Konum: {view.design_area_top}%</Label>
                          <Slider
                            value={[view.design_area_top]}
                            onValueChange={([val]) => handleViewAreaChange(index, "design_area_top", val)}
                            min={0}
                            max={80}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Sol Konum: {view.design_area_left}%</Label>
                          <Slider
                            value={[view.design_area_left]}
                            onValueChange={([val]) => handleViewAreaChange(index, "design_area_left", val)}
                            min={0}
                            max={80}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Genişlik: {view.design_area_width}%</Label>
                          <Slider
                            value={[view.design_area_width]}
                            onValueChange={([val]) => handleViewAreaChange(index, "design_area_width", val)}
                            min={10}
                            max={100}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Yükseklik: {view.design_area_height}%</Label>
                          <Slider
                            value={[view.design_area_height]}
                            onValueChange={([val]) => handleViewAreaChange(index, "design_area_height", val)}
                            min={10}
                            max={100}
                            step={1}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={() => createProductMutation.mutate()}
              disabled={!newProductName || createProductMutation.isPending}
            >
              {createProductMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Taslak Olarak Kaydet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {products?.map((product) => (
              <ProductItemAdmin
                key={product.id}
                product={product}
                onToggle={(isActive) => toggleProductMutation.mutate({ productId: product.id, isActive })}
                onDelete={() => deleteProductMutation.mutate(product.id)}
              />
            ))}
            
            {products?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Henüz ürün eklenmemiş
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Product item with publish toggle
interface ProductItemAdminProps {
  product: Product;
  onToggle: (isActive: boolean) => void;
  onDelete: () => void;
}

function ProductItemAdmin({ product, onToggle, onDelete }: ProductItemAdminProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [views, setViews] = useState<ProductView[]>([]);
  const [isLoadingViews, setIsLoadingViews] = useState(false);
  const [editorViewId, setEditorViewId] = useState<string | null>(null);

  const editorView = views.find(v => v.id === editorViewId);

  const loadViews = async () => {
    if (views.length > 0) return;
    setIsLoadingViews(true);
    const { data, error } = await supabase
      .from("product_views")
      .select("*")
      .eq("product_id", product.id)
      .order("view_order");
    
    if (data && !error) {
      setViews(data);
    }
    setIsLoadingViews(false);
  };


  return (
    <div className="border rounded-lg">
      <div className="p-3 flex items-center justify-between">
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (!isExpanded) loadViews();
          }}
        >
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{product.name}</p>
            <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
              {product.is_active ? "Yayında" : "Taslak"}
            </Badge>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          {product.category && (
            <p className="text-xs text-muted-foreground">{product.category}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={product.is_active}
            onCheckedChange={onToggle}
            title={product.is_active ? "Yayından Kaldır" : "Yayınla"}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t p-3 space-y-3">
          {isLoadingViews ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {views.map((view) => (
                <div 
                  key={view.id} 
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {view.mockup_image_url ? (
                    <img src={view.mockup_image_url} alt="" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{view.view_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {view.mockup_image_url ? "Mockup yüklendi" : "Mockup bekleniyor"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditorViewId(view.id)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Düzenle
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* View Editor Dialog */}
          {editorView && (
            <AdminViewEditor
              view={editorView}
              isOpen={!!editorViewId}
              onClose={() => setEditorViewId(null)}
              onUpdate={(updates) => {
                setViews(prev => prev.map(v => 
                  v.id === editorViewId ? { ...v, ...updates } : v
                ));
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// === COLORS TAB ===
function ColorsTab() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  // Fetch all colors (including inactive for admin)
  const { data: colors, isLoading } = useQuery({
    queryKey: ["admin-colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_colors")
        .select("*")
        .order("sort_order");
      
      if (error) throw error;
      return data as ProductColor[];
    },
  });

  // Create color mutation
  const createColorMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = colors?.reduce((max, c) => Math.max(max, c.sort_order || 0), 0) || 0;
      
      const { error } = await supabase
        .from("product_colors")
        .insert({
          name: newColorName,
          hex_code: newColorHex,
          sort_order: maxOrder + 1,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      queryClient.invalidateQueries({ queryKey: ["product-colors"] });
      toast.success("Renk eklendi");
      setNewColorName("");
      setNewColorHex("#000000");
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Renk eklenemedi: " + error.message);
    },
  });

  // Toggle color active status
  const toggleColorMutation = useMutation({
    mutationFn: async ({ colorId, isActive }: { colorId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("product_colors")
        .update({ is_active: isActive })
        .eq("id", colorId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      queryClient.invalidateQueries({ queryKey: ["product-colors"] });
      toast.success(isActive ? "Renk aktifleştirildi" : "Renk devre dışı bırakıldı");
    },
  });

  // Delete color mutation
  const deleteColorMutation = useMutation({
    mutationFn: async (colorId: string) => {
      const { error } = await supabase
        .from("product_colors")
        .delete()
        .eq("id", colorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      queryClient.invalidateQueries({ queryKey: ["product-colors"] });
      toast.success("Renk silindi");
    },
  });

  return (
    <div className="h-full flex flex-col">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="w-full mb-4">
            <Palette className="w-4 h-4 mr-1" />
            Yeni Renk Ekle
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Renk Ekle</DialogTitle>
            <DialogDescription>
              Ürünler için yeni bir renk seçeneği ekleyin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Renk Adı</Label>
              <Input
                placeholder="Örn: Kırmızı"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Renk Kodu</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={() => createColorMutation.mutate()}
              disabled={!newColorName || createColorMutation.isPending}
            >
              {createColorMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Ekle"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {colors?.map((color) => (
              <div key={color.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full border-2"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <div>
                    <p className="font-medium text-sm">{color.name}</p>
                    <p className="text-xs text-muted-foreground">{color.hex_code}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={color.is_active}
                    onCheckedChange={(isActive) => toggleColorMutation.mutate({ colorId: color.id, isActive })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteColorMutation.mutate(color.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {colors?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Henüz renk eklenmemiş
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
