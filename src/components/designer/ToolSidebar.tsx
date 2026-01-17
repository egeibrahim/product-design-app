import { Eye, Image, Type, Package, Bookmark, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ActiveTab } from "./types";

interface ToolSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const tabs = [
  { id: "mockup" as const, icon: Eye, label: "Mockup" },
  { id: "upload" as const, icon: Upload, label: "Upload" },
  { id: "image" as const, icon: Image, label: "Image" },
  { id: "text" as const, icon: Type, label: "Text" },
  { id: "product" as const, icon: Package, label: "Product" },
  { id: "saved" as const, icon: Bookmark, label: "Saved" },
];

export function ToolSidebar({ activeTab, onTabChange }: ToolSidebarProps) {
  return (
    <aside className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-1">
      <TooltipProvider delayDuration={200}>
        {tabs.map((tab) => (
          <Tooltip key={tab.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                size="icon"
                className="w-12 h-12"
                onClick={() => onTabChange(tab.id)}
              >
                <tab.icon className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{tab.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </aside>
  );
}
