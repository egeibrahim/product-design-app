import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Type, Bold, Italic } from "lucide-react";

interface TextTemplatesProps {
  onAddText: (text: string, style?: Partial<{
    fontSize: number;
    fontWeight: "normal" | "bold";
    fontStyle: "normal" | "italic";
    fontFamily: string;
  }>) => void;
}

const textTemplates = [
  { label: "Heading", text: "Your Text Here", fontSize: 32, fontWeight: "bold" as const },
  { label: "Subheading", text: "Subtitle Text", fontSize: 24, fontWeight: "normal" as const },
  { label: "Body Text", text: "Add your text", fontSize: 16, fontWeight: "normal" as const },
  { label: "Small Text", text: "Small text", fontSize: 12, fontWeight: "normal" as const },
  { label: "Quote", text: '"Inspiring Quote"', fontSize: 20, fontStyle: "italic" as const },
  { label: "Bold Statement", text: "BOLD TEXT", fontSize: 28, fontWeight: "bold" as const },
];

const fontFamilies = [
  "Arial",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Impact",
  "Comic Sans MS",
];

export function TextTemplates({ onAddText }: TextTemplatesProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium text-sm">Text Elements</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Add text to your design
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Quick Add Button */}
          <Button
            variant="outline"
            className="w-full h-16 border-dashed"
            onClick={() => onAddText("Click to edit", { fontSize: 24 })}
          >
            <div className="flex flex-col items-center gap-1">
              <Type className="h-5 w-5" />
              <span className="text-xs">Add Text</span>
            </div>
          </Button>

          {/* Text Templates */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Templates</span>
            <div className="grid gap-2">
              {textTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() =>
                    onAddText(template.text, {
                      fontSize: template.fontSize,
                      fontWeight: template.fontWeight,
                      fontStyle: template.fontStyle,
                    })
                  }
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground">{template.label}</span>
                    <span
                      style={{
                        fontSize: Math.min(template.fontSize * 0.6, 18),
                        fontWeight: template.fontWeight,
                        fontStyle: template.fontStyle,
                      }}
                    >
                      {template.text}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Font Families */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Fonts</span>
            <div className="grid gap-1">
              {fontFamilies.map((font) => (
                <Button
                  key={font}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    onAddText("Sample Text", { fontSize: 20, fontFamily: font })
                  }
                >
                  <span style={{ fontFamily: font }}>{font}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
