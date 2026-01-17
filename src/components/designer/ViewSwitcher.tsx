import { Button } from "@/components/ui/button";
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
        <span className="text-sm text-muted-foreground">No views available - select a product</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {views.map((view) => (
        <Button
          key={view.id}
          variant={activeViewId === view.id ? "default" : "outline"}
          size="sm"
          onClick={() => onViewChange(view.id)}
          className="min-w-[100px]"
        >
          {view.view_name}
        </Button>
      ))}
    </div>
  );
}
