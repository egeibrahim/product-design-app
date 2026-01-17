import { Button } from "@/components/ui/button";
import { ProductView } from "./types";

interface ViewSwitcherProps {
  views: ProductView[];
  activeViewId: string;
  onViewChange: (viewId: string) => void;
}

export function ViewSwitcher({ views, activeViewId, onViewChange }: ViewSwitcherProps) {
  if (views.length <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
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
