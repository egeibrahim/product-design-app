import { Button } from "@/components/ui/button";
import { ProductView } from "./types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ViewSwitcherProps {
  views: ProductView[];
  activeViewId: string;
  onViewChange: (viewId: string) => void;
}

export function ViewSwitcher({ views, activeViewId, onViewChange }: ViewSwitcherProps) {
  if (views.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-sm text-muted-foreground">Görünüm yok - bir ürün seçin</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <TooltipProvider delayDuration={200}>
        {views.map((view) => {
          const isActive = activeViewId === view.id;
          
          return (
            <Tooltip key={view.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewChange(view.id)}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    isActive 
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                      : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {view.mockup_image_url ? (
                    <div className="w-16 h-16 rounded overflow-hidden bg-background">
                      <img 
                        src={view.mockup_image_url} 
                        alt={view.view_name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded bg-background flex items-center justify-center">
                      <div 
                        className="w-8 h-10 border-2 border-dashed rounded"
                        style={{ borderColor: isActive ? 'currentColor' : 'hsl(var(--muted-foreground))' }}
                      />
                    </div>
                  )}
                  <span className="text-xs font-medium">{view.view_name}</span>
                  
                  {/* Design area indicator */}
                  <div 
                    className={`absolute inset-0 rounded-lg pointer-events-none ${
                      isActive ? 'ring-2 ring-primary/50' : ''
                    }`} 
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{view.view_name} görünümü</p>
                <p className="text-xs text-muted-foreground">
                  Baskı alanı: {view.design_area_width}% x {view.design_area_height}%
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}
