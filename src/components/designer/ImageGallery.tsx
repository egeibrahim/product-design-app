import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DesignTemplate } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface ImageGalleryProps {
  onImageSelect: (imageUrl: string) => void;
}

export function ImageGallery({ onImageSelect }: ImageGalleryProps) {
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("design_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setTemplates(data);
      const uniqueCategories = [...new Set(data.map((t) => t.category).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
    }
  };

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium text-sm">Ready-made Designs</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Choose from our design library
        </p>
      </div>

      {categories.length > 0 && (
        <div className="px-4 pt-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              className="aspect-square rounded-lg overflow-hidden border hover:border-primary transition-all hover:scale-105"
              onClick={() => onImageSelect(template.image_url)}
            >
              <img
                src={template.thumbnail_url || template.image_url}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p className="text-sm">No designs available</p>
            <p className="text-xs">Check back later for new designs</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
