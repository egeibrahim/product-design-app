import { useRef } from "react";
import { Upload, Type, Layers, Image, Shapes, MousePointer2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ToolSidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onImageUpload: (imageUrl: string) => void;
}

const tools = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "upload", icon: Upload, label: "Upload Image" },
  { id: "text", icon: Type, label: "Add Text" },
  { id: "shapes", icon: Shapes, label: "Shapes" },
  { id: "images", icon: Image, label: "Images" },
  { id: "layers", icon: Layers, label: "Layers" },
];

export function ToolSidebar({ activeTool, onToolChange, onImageUpload }: ToolSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (toolId: string) => {
    if (toolId === "upload") {
      fileInputRef.current?.click();
    } else {
      onToolChange(toolId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        onImageUpload(imageUrl);
      };
      reader.readAsDataURL(file);
      // Reset input so same file can be uploaded again
      e.target.value = "";
    }
  };

  return (
    <aside className="w-16 bg-sidebar-bg flex flex-col items-center py-4 border-r border-sidebar-hover">
      <div className="mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Shapes className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
      
      <nav className="flex flex-col gap-1 flex-1">
        {tools.map((tool) => (
          <Tooltip key={tool.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleToolClick(tool.id)}
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

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </aside>
  );
}
