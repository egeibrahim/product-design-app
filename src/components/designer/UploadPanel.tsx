import { useState, useRef, useEffect } from "react";
import { Upload, FolderPlus, Folder, Image, Grid, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserFolder, UserUpload } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadPanelProps {
  onImageSelect: (imageUrl: string) => void;
}

export function UploadPanel({ onImageSelect }: UploadPanelProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFolders();
    fetchUploads();
  }, [currentFolderId]);

  const fetchFolders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const query = supabase
      .from("user_folders")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (currentFolderId) {
      query.eq("parent_folder_id", currentFolderId);
    } else {
      query.is("parent_folder_id", null);
    }

    const { data, error } = await query;
    if (data && !error) {
      setFolders(data);
    }
  };

  const fetchUploads = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const query = supabase
      .from("user_uploads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (currentFolderId) {
      query.eq("folder_id", currentFolderId);
    } else {
      query.is("folder_id", null);
    }

    const { data, error } = await query;
    if (data && !error) {
      setUploads(data);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Lütfen giriş yapın");
      return;
    }

    setIsLoading(true);

    for (const file of Array.from(files)) {
      // Validate file type - only PNG
      if (file.type !== "image/png") {
        toast.error(`${file.name}: Sadece PNG formatı desteklenmektedir`);
        continue;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name}: Dosya boyutu maksimum 50MB olmalıdır`);
        continue;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-uploads")
        .upload(fileName, file);

      if (uploadError) {
        toast.error(`${file.name} yüklenemedi`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("user-uploads")
        .getPublicUrl(fileName);

      // Get image dimensions
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const { error: dbError } = await supabase.from("user_uploads").insert({
        user_id: user.id,
        folder_id: currentFolderId,
        file_name: file.name,
        original_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        width: img.width,
        height: img.height,
      });

      if (!dbError) {
        toast.success(`${file.name} yüklendi`);
      }
    }

    setIsLoading(false);
    fetchUploads();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to create folders");
      return;
    }

    const { error } = await supabase.from("user_folders").insert({
      user_id: user.id,
      name: newFolderName,
      parent_folder_id: currentFolderId,
    });

    if (!error) {
      toast.success("Folder created");
      setShowNewFolderDialog(false);
      setNewFolderName("");
      fetchFolders();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "history")}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="flex-1 mt-4">
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-24 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6" />
                <span className="text-xs">{isLoading ? "Yükleniyor..." : "PNG yüklemek için tıklayın (max 50MB)"}</span>
              </div>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Folders Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Folders</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewFolderDialog(true)}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {currentFolderId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setCurrentFolderId(null)}
                    >
                      <ChevronRight className="h-3 w-3 mr-1 rotate-180" />
                      Back
                    </Button>
                  )}
                  {folders.map((folder) => (
                    <Button
                      key={folder.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setCurrentFolderId(folder.id)}
                    >
                      <Folder className="h-3 w-3 mr-2" />
                      {folder.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Images Grid */}
            <div className="space-y-2">
              <span className="text-sm font-medium">
                {currentFolderId ? "Folder Images" : "All Images"}
              </span>
              <ScrollArea className="h-48">
                <div className="grid grid-cols-3 gap-2">
                  {uploads.map((upload) => (
                    <button
                      key={upload.id}
                      className="aspect-square rounded-md overflow-hidden border hover:border-primary transition-colors"
                      onClick={() => onImageSelect(upload.original_url)}
                    >
                      <img
                        src={upload.compressed_url || upload.original_url}
                        alt={upload.file_name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 mt-4">
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-3 gap-2">
              {uploads.map((upload) => (
                <button
                  key={upload.id}
                  className="aspect-square rounded-md overflow-hidden border hover:border-primary transition-colors"
                  onClick={() => onImageSelect(upload.original_url)}
                >
                  <img
                    src={upload.compressed_url || upload.original_url}
                    alt={upload.file_name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
