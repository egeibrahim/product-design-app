import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  FlipHorizontal,
  FlipVertical,
  Eraser,
  Crop,
  Copy,
  Save,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ElementActionsBarProps {
  onAlign: (alignment: string) => void;
  onFlip: (direction: "horizontal" | "vertical") => void;
  onRemoveBg: () => void;
  onCrop: () => void;
  onDuplicate: () => void;
  onSaveAsTemplate: () => void;
  elementType: "text" | "image";
}

export function ElementActionsBar({
  onAlign,
  onFlip,
  onRemoveBg,
  onCrop,
  onDuplicate,
  onSaveAsTemplate,
  elementType,
}: ElementActionsBarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 h-full">
        {/* Align Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <AlignCenter className="h-4 w-4" />
                  <span className="text-xs">Align</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Align element</TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAlign("left")}>
              <AlignLeft className="h-4 w-4 mr-2" />
              Left
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAlign("center")}>
              <AlignCenter className="h-4 w-4 mr-2" />
              Center
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAlign("right")}>
              <AlignRight className="h-4 w-4 mr-2" />
              Right
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAlign("top")}>
              <AlignStartVertical className="h-4 w-4 mr-2" />
              Top
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAlign("middle")}>
              <AlignCenterVertical className="h-4 w-4 mr-2" />
              Middle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAlign("bottom")}>
              <AlignEndVertical className="h-4 w-4 mr-2" />
              Bottom
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Flip Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <FlipHorizontal className="h-4 w-4" />
                  <span className="text-xs">Flip</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Flip element</TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onFlip("horizontal")}>
              <FlipHorizontal className="h-4 w-4 mr-2" />
              Horizontal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFlip("vertical")}>
              <FlipVertical className="h-4 w-4 mr-2" />
              Vertical
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Remove BG - Only for images */}
        {elementType === "image" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={onRemoveBg}>
                <Eraser className="h-4 w-4" />
                <span className="text-xs">Remove BG</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove background</TooltipContent>
          </Tooltip>
        )}

        {/* Crop */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={onCrop}>
              <Crop className="h-4 w-4" />
              <span className="text-xs">Crop</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Crop element</TooltipContent>
        </Tooltip>

        {/* Duplicate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
              <span className="text-xs">Duplicate</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicate element</TooltipContent>
        </Tooltip>

        {/* Save as Template */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={onSaveAsTemplate}>
              <Save className="h-4 w-4" />
              <span className="text-xs">Save as Template</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save as template</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
