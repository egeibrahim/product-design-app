import { Upload, Type, Layers, Image, Shapes, Hand, MousePointer2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ToolSidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

const tools = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "upload", icon: Upload, label: "Upload" },
  { id: "text", icon: Type, label: "Text" },
  { id: "shapes", icon: Shapes, label: "Shapes" },
  { id: "images", icon: Image, label: "Images" },
  { id: "layers", icon: Layers, label: "Layers" },
];

export function ToolSidebar({ activeTool, onToolChange }: ToolSidebarProps) {
  return (
    <aside className="w-16 bg-sidebar-bg flex flex-col items-center py-4 border-r border-sidebar-hover">
      <div className="mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Hand className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
      
      <nav className="flex flex-col gap-1 flex-1">
        {tools.map((tool) => (
          <Tooltip key={tool.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onToolChange(tool.id)}
                className={`sidebar-icon ${activeTool === tool.id ? "active" : ""}`}
              >
                <tool.icon className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {tool.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </aside>
  );
}
