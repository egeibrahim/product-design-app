import { Eye, Image, Type, Package, Bookmark, Upload, Layers, Settings, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ActiveTab } from "./types";

interface ToolSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isAdmin?: boolean;
}

const tabs = [
  { id: "mockup" as const, icon: Eye, label: "Mockup" },
  { id: "upload" as const, icon: Upload, label: "Yükle" },
  { id: "image" as const, icon: Image, label: "Galeri" },
  { id: "text" as const, icon: Type, label: "Yazı" },
  { id: "product" as const, icon: Package, label: "Ürünler" },
  { id: "saved" as const, icon: Bookmark, label: "Kayıtlı" },
  { id: "layers" as const, icon: Layers, label: "Katmanlar" },
];

const adminTabs = [
  { id: "admin" as const, icon: FolderOpen, label: "Katalog" },
];

export function ToolSidebar({ activeTab, onTabChange, isAdmin }: ToolSidebarProps) {
  const allTabs = isAdmin ? [...tabs, ...adminTabs] : tabs;

  return (
    <aside className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-1">
      <TooltipProvider delayDuration={200}>
        {allTabs.map((tab) => (
          <div key={tab.id}>
            {/* Add separator before admin tabs */}
            {isAdmin && tab.id === "admin" && (
              <div className="w-10 h-px bg-border my-2" />
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  size="icon"
                  className={`w-12 h-12 ${tab.id === "admin" ? "text-amber-500" : ""}`}
                  onClick={() => onTabChange(tab.id)}
                >
                  <tab.icon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tab.label}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </TooltipProvider>
    </aside>
  );
}
