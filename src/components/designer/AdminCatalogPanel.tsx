import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Loader2, Package, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ProductColor {
  id: string;
  name: string;
  hex_code: string;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string | null;
  is_active: boolean;
}

const DEFAULT_VIEWS = [
  { view_name: "Ön", design_area_top: 25, design_area_left: 25, design_area_width: 50, design_area_height: 40 },
  { view_name: "Arka", design_area_top: 25, design_area_left: 25, design_area_width: 50, design_area_height: 40 },
  { view_name: "Sol Kol", design_area_top: 30, design_area_left: 30, design_area_width: 40, design_area_height: 50 },
  { view_name: "Sağ Kol", design_area_top: 30, design_area_left: 30, design_area_width: 40, design_area_height: 50 },
];

export function AdminCatalogPanel() {
  const [activeTab, setActiveTab] = useState<"products" | "colors">("products");

  return (
    <div className="p-3 h-full flex flex-col">
      {/* Tab Buttons */}
      <div className="flex gap-1 mb-3">
        <Button
          size="sm"
          variant={activeTab === "products" ? "default" : "ghost"}
          onClick={() => setActiveTab("products")}
          className="flex-1 h-8 text-xs"
        >
          <Package className="w-3 h-3 mr-1" />
          Ürünler
        </Button>
        <Button
          size="sm"
          variant={activeTab === "colors" ? "default" : "ghost"}
          onClick={() => setActiveTab("colors")}
          className="flex-1 h-8 text-xs"
        >
          <Palette className="w-3 h-3 mr-1" />
          Renkler
        </Button>
      </div>

      {/* Content */}
      {activeTab === "products" ? <ProductsSection /> : <ColorsSection />}
    </div>
  );
}

function ProductsSection() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: product, error } = await supabase
        .from("products")
        .insert({ name, is_active: false })
        .select()
        .single();
      if (error) throw error;

      // Create default views
      const views = DEFAULT_VIEWS.map((v, i) => ({
        product_id: product.id,
        view_name: v.view_name,
        view_order: i,
        design_area_top: v.design_area_top,
        design_area_left: v.design_area_left,
        design_area_width: v.design_area_width,
        design_area_height: v.design_area_height,
      }));

      await supabase.from("product_views").insert(views);
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ürün oluşturuldu");
      setNewName("");
      setIsAdding(false);
    },
    onError: (e) => toast.error("Hata: " + e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(active ? "Yayınlandı" : "Yayından kaldırıldı");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Silindi");
    },
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Add Form */}
      {isAdding ? (
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Ürün adı..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
          <Button
            size="sm"
            className="h-8"
            disabled={!newName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate(newName.trim())}
          >
            {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ekle"}
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setIsAdding(false)}>
            ✕
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mb-3 h-8" onClick={() => setIsAdding(true)}>
          <Plus className="w-3 h-3 mr-1" />
          Yeni Ürün
        </Button>
      )}

      {/* List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : products?.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">Ürün yok</p>
        ) : (
          <div className="space-y-1">
            {products?.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                </div>
                <Switch
                  checked={p.is_active}
                  onCheckedChange={(active) => toggleMutation.mutate({ id: p.id, active })}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={() => deleteMutation.mutate(p.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function ColorsSection() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#3B82F6");
  const [isAdding, setIsAdding] = useState(false);

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = colors?.reduce((max, c) => Math.max(max, c.sort_order || 0), 0) || 0;
      const { error } = await supabase
        .from("product_colors")
        .insert({ name: newName, hex_code: newHex, sort_order: maxOrder + 1, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      queryClient.invalidateQueries({ queryKey: ["product-colors"] });
      toast.success("Renk eklendi");
      setNewName("");
      setNewHex("#3B82F6");
      setIsAdding(false);
    },
    onError: (e) => toast.error("Hata: " + e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("product_colors").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      queryClient.invalidateQueries({ queryKey: ["product-colors"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_colors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      queryClient.invalidateQueries({ queryKey: ["product-colors"] });
      toast.success("Silindi");
    },
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Add Form */}
      {isAdding ? (
        <div className="space-y-2 mb-3">
          <div className="flex gap-2">
            <input
              type="color"
              value={newHex}
              onChange={(e) => setNewHex(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <Input
              placeholder="Renk adı..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-8 text-sm flex-1"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-8 flex-1"
              disabled={!newName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ekle"}
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setIsAdding(false)}>
              ✕
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mb-3 h-8" onClick={() => setIsAdding(true)}>
          <Plus className="w-3 h-3 mr-1" />
          Yeni Renk
        </Button>
      )}

      {/* List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : colors?.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">Renk yok</p>
        ) : (
          <div className="space-y-1">
            {colors?.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group">
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: c.hex_code }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{c.name}</p>
                </div>
                <Switch
                  checked={c.is_active}
                  onCheckedChange={(active) => toggleMutation.mutate({ id: c.id, active })}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={() => deleteMutation.mutate(c.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
