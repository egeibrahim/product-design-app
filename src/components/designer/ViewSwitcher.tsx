import { ProductView } from "./types";

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
    <div className="flex items-center justify-center gap-2">
      {views.map((view) => {
        const isActive = activeViewId === view.id;
        
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive 
                ? "bg-foreground text-background shadow-md" 
                : "bg-muted text-foreground hover:bg-muted/80 border border-border"
            }`}
          >
            {view.view_name}
          </button>
        );
      })}
    </div>
  );
}
