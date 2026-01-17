import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, ProductView } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface ProductPanelProps {
  selectedProductId: string;
  onProductSelect: (productId: string) => void;
  onViewsLoaded: (views: ProductView[]) => void;
}

export function ProductPanel({
  selectedProductId,
  onProductSelect,
  onViewsLoaded,
}: ProductPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productViews, setProductViews] = useState<Record<string, ProductView[]>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId && productViews[selectedProductId]) {
      onViewsLoaded(productViews[selectedProductId]);
    }
  }, [selectedProductId, productViews]);

  const fetchProducts = async () => {
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (productsData && !productsError) {
      setProducts(productsData);

      // Fetch views for all products
      const { data: viewsData, error: viewsError } = await supabase
        .from("product_views")
        .select("*")
        .in(
          "product_id",
          productsData.map((p) => p.id)
        )
        .order("view_order");

      if (viewsData && !viewsError) {
        const viewsByProduct: Record<string, ProductView[]> = {};
        viewsData.forEach((view) => {
          if (!viewsByProduct[view.product_id]) {
            viewsByProduct[view.product_id] = [];
          }
          viewsByProduct[view.product_id].push(view);
        });
        setProductViews(viewsByProduct);

        // Load views for initially selected product
        if (selectedProductId && viewsByProduct[selectedProductId]) {
          onViewsLoaded(viewsByProduct[selectedProductId]);
        }
      }
    }
  };

  const handleProductSelect = (productId: string) => {
    onProductSelect(productId);
    if (productViews[productId]) {
      onViewsLoaded(productViews[productId]);
    }
  };

  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium text-sm">Products</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Select a product to customize
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{category}</span>
                <Badge variant="secondary" className="text-xs">
                  {categoryProducts.length}
                </Badge>
              </div>

              <div className="grid gap-2">
                {categoryProducts.map((product) => {
                  const views = productViews[product.id] || [];
                  const isSelected = selectedProductId === product.id;

                  return (
                    <Button
                      key={product.id}
                      variant={isSelected ? "default" : "outline"}
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleProductSelect(product.id)}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium">{product.name}</span>
                        <div className="flex gap-1">
                          {views.map((view) => (
                            <Badge
                              key={view.id}
                              variant="outline"
                              className="text-[10px] px-1"
                            >
                              {view.view_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
