import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save, Upload, Move, Maximize } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

interface AdminViewEditorProps {
  view: ProductView;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<ProductView>) => void;
}

export function AdminViewEditor({ view, isOpen, onClose, onUpdate }: AdminViewEditorProps) {
  const queryClient = useQueryClient();
  const [localView, setLocalView] = useState<ProductView>(view);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, top: 0, left: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const updateViewMutation = useMutation({
    mutationFn: async (updates: Partial<ProductView>) => {
      const { error } = await supabase
        .from("product_views")
        .update(updates)
        .eq("id", view.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Görünüm kaydedildi");
      onUpdate(localView);
      onClose();
    },
    onError: (error) => {
      toast.error("Kaydetme hatası: " + error.message);
    }
  });

  const handleImageUpload = async (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error("Sadece PNG veya JPG dosyaları yüklenebilir");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Dosya boyutu maksimum 50MB olmalıdır");
      return;
    }

    setUploadingImage(true);
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${view.id}.${fileExt}`;
    const filePath = `mockups/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-mockups")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Görsel yüklenemedi");
      setUploadingImage(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("product-mockups")
      .getPublicUrl(filePath);

    setLocalView(prev => ({ ...prev, mockup_image_url: publicUrl }));
    setUploadingImage(false);
    toast.success("Görsel yüklendi");
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'drag') {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        top: localView.design_area_top,
        left: localView.design_area_left
      };
    } else {
      setIsResizing(true);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: localView.design_area_width,
        height: localView.design_area_height
      };
    }
  }, [localView]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isDragging) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      
      const newLeft = Math.max(0, Math.min(100 - localView.design_area_width, dragStartRef.current.left + deltaX));
      const newTop = Math.max(0, Math.min(100 - localView.design_area_height, dragStartRef.current.top + deltaY));
      
      setLocalView(prev => ({
        ...prev,
        design_area_left: Math.round(newLeft),
        design_area_top: Math.round(newTop)
      }));
    }

    if (isResizing) {
      const deltaX = ((e.clientX - resizeStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - resizeStartRef.current.y) / rect.height) * 100;
      
      const newWidth = Math.max(10, Math.min(100 - localView.design_area_left, resizeStartRef.current.width + deltaX));
      const newHeight = Math.max(10, Math.min(100 - localView.design_area_top, resizeStartRef.current.height + deltaY));
      
      setLocalView(prev => ({
        ...prev,
        design_area_width: Math.round(newWidth),
        design_area_height: Math.round(newHeight)
      }));
    }
  }, [isDragging, isResizing, localView]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleSave = () => {
    updateViewMutation.mutate({
      mockup_image_url: localView.mockup_image_url,
      design_area_top: localView.design_area_top,
      design_area_left: localView.design_area_left,
      design_area_width: localView.design_area_width,
      design_area_height: localView.design_area_height
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{view.view_name} Görünümünü Düzenle</DialogTitle>
          <DialogDescription>
            Mockup görselini yükleyin ve baskı alanını görsel üzerinde konumlandırın
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Visual Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Mockup Önizleme</Label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Move className="w-3 h-3" /> Sürükle
                <Maximize className="w-3 h-3 ml-2" /> Boyutlandır
              </div>
            </div>

            <div 
              ref={containerRef}
              className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border select-none"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {localView.mockup_image_url ? (
                <img 
                  src={localView.mockup_image_url} 
                  alt="Mockup" 
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Upload className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Henüz mockup yüklenmedi</p>
                    <p className="text-xs">Aşağıdan görsel yükleyin</p>
                  </div>
                </div>
              )}

              {/* Design Area Overlay */}
              <div
                className="absolute border-2 border-primary bg-primary/20 cursor-move transition-colors hover:bg-primary/30"
                style={{
                  top: `${localView.design_area_top}%`,
                  left: `${localView.design_area_left}%`,
                  width: `${localView.design_area_width}%`,
                  height: `${localView.design_area_height}%`,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'drag')}
              >
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-medium text-primary-foreground bg-primary px-2 py-0.5 rounded">
                    Baskı Alanı
                  </span>
                </div>

                {/* Resize handle */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-tl cursor-se-resize hover:bg-primary/80"
                  onMouseDown={(e) => handleMouseDown(e, 'resize')}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-xs">Mockup Yükle (2048x2048 px, PNG/JPG)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  disabled={uploadingImage}
                  className="text-xs"
                />
                {uploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </div>
          </div>

          {/* Manual Controls */}
          <div className="space-y-4">
            <Label>Baskı Alanı Değerleri (Manuel)</Label>
            
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Üst Konum</Label>
                  <span className="text-xs text-muted-foreground">{localView.design_area_top}%</span>
                </div>
                <Slider
                  value={[localView.design_area_top]}
                  onValueChange={([val]) => setLocalView(prev => ({ ...prev, design_area_top: val }))}
                  min={0}
                  max={80}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Sol Konum</Label>
                  <span className="text-xs text-muted-foreground">{localView.design_area_left}%</span>
                </div>
                <Slider
                  value={[localView.design_area_left]}
                  onValueChange={([val]) => setLocalView(prev => ({ ...prev, design_area_left: val }))}
                  min={0}
                  max={80}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Genişlik</Label>
                  <span className="text-xs text-muted-foreground">{localView.design_area_width}%</span>
                </div>
                <Slider
                  value={[localView.design_area_width]}
                  onValueChange={([val]) => setLocalView(prev => ({ ...prev, design_area_width: val }))}
                  min={10}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Yükseklik</Label>
                  <span className="text-xs text-muted-foreground">{localView.design_area_height}%</span>
                </div>
                <Slider
                  value={[localView.design_area_height]}
                  onValueChange={([val]) => setLocalView(prev => ({ ...prev, design_area_height: val }))}
                  min={10}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-amber-500/10 border-amber-500/30">
              <h4 className="text-sm font-medium text-amber-600 mb-2">İpuçları</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 2048x2048 piksel kare mockup görseli yükleyin</li>
                <li>• Baskı alanını sürükleyerek konumlandırın</li>
                <li>• Sağ alt köşeden boyutlandırın</li>
                <li>• Slider'lar ile hassas ayar yapın</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateViewMutation.isPending}
          >
            {updateViewMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
