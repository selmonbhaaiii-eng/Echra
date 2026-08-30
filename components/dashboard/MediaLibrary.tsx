"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Trash2, Search, X, Loader2, Sparkles, Filter, Pencil, Check } from "lucide-react";

type BusinessImage = {
  id: string;
  url: string;
  category: "product" | "store" | "staff" | "offer";
  label: string | null;
  created_at: string;
};

const categories = [
  { id: "product", name: "Product photos", desc: "Food, drinks, items you sell" },
  { id: "store", name: "Store photos", desc: "Interior, exterior, ambiance" },
  { id: "staff", name: "Staff photos", desc: "Team, owner, behind the scenes" },
  { id: "offer", name: "Special offers", desc: "Banners, promotions" },
];

export function MediaLibrary({ businessId }: { businessId: string }) {
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("product");
  const [label, setLabel] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Edit label state
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState("");
  const [savingLabelId, setSavingLabelId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing images
  const fetchImages = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/media");
      if (!res.ok) throw new Error("Failed to fetch media library");
      const data = await res.json();
      setImages(data.images || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not load media files. Ensure database tables are migrated.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !businessId) return;

    setUploading(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      
      // Clean filename
      const ext = selectedFile.name.split(".").pop();
      const baseName = selectedFile.name.split(".").slice(0, -1).join(".");
      const cleanName = `${baseName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${Date.now()}.${ext}`;
      const filePath = `${businessId}/${category}/${cleanName}`;

      // 1. Upload file directly to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("business-images")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      // 2. Fetch the public URL
      const { data: { publicUrl } } = supabase.storage
        .from("business-images")
        .getPublicUrl(filePath);

      // 3. Register the record in public.business_images database table
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: publicUrl,
          category,
          label: label.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to register image metadata");
      }

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setLabel("");
      
      // Refresh list
      await fetchImages();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo from your library?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/media?image_id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
      } else {
        setErrorMessage(data.error || "Failed to delete image.");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveLabel = async (id: string) => {
    if (!editLabelValue.trim()) {
      setEditingLabelId(null);
      return;
    }

    setSavingLabelId(id);
    setErrorMessage("");
    try {
      const res = await fetch("/api/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, label: editLabelValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, label: editLabelValue.trim() } : img
          )
        );
        setEditingLabelId(null);
      } else {
        setErrorMessage(data.error || "Failed to update label.");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to update label.");
    } finally {
      setSavingLabelId(null);
    }
  };

  // Filter and search images
  const filteredImages = images.filter((img) => {
    const matchesCategory = filter === "all" || img.category === filter;
    const matchesSearch =
      !search ||
      img.label?.toLowerCase().includes(search.toLowerCase()) ||
      img.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "product": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "store": return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "staff": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      default: return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="grid md:grid-cols-12 gap-6 bg-lp-surface border border-lp-border rounded-xl p-6">
        <div 
          className={`md:col-span-7 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition min-h-[220px] ${
            dragActive ? "border-lp-accent bg-lp-accent/5" : "border-lp-border hover:border-lp-border2 bg-lp-bg/20"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <div className="relative w-full h-[180px] rounded-lg overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Upload preview" 
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="text-center space-y-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-lp-surface3 text-lp-accent">
                <Upload className="size-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-lp-text">Drag & drop your photo here</p>
                <p className="text-xs text-lp-text2 mt-1">or click to browse from device (max 5MB)</p>
              </div>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Upload Metadata Fields */}
        <div className="md:col-span-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-lp-text3 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm text-lp-text focus:border-lp-accent outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.desc.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-lp-text3 mb-2">
                Tag / Search Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. croissant, storefront, latte"
                className="w-full h-10 rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm text-lp-text focus:border-lp-accent outline-none"
              />
              <p className="text-[11px] text-lp-text2 mt-1">
                Gemini will use this label to match photos with standard post topics.
              </p>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Sparkles className="size-4 fill-current" />
                Upload Image
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-lp-red/20 bg-lp-red/5 p-4 text-sm text-lp-red">
          {errorMessage}
        </div>
      )}

      {/* Grid List & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-lp-border pb-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            <Filter className="size-4 text-lp-text3 shrink-0" />
            <button
              onClick={() => setFilter("all")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filter === "all" ? "bg-lp-surface3 text-lp-text" : "text-lp-text2 hover:bg-lp-surface2"
              }`}
            >
              All Photos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  filter === cat.id ? "bg-lp-surface3 text-lp-text" : "text-lp-text2 hover:bg-lp-surface2"
                }`}
              >
                {cat.name.split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-lp-text3" />
            <input
              type="text"
              placeholder="Search labels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-lp-border bg-lp-surface px-3 pl-9 text-xs text-lp-text focus:border-lp-accent outline-none placeholder:text-lp-text3"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-lp-text2">
            <Loader2 className="size-8 animate-spin text-lp-accent mb-2" />
            <p className="text-sm">Loading media library...</p>
          </div>
        ) : filteredImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredImages.map((img) => (
              <div 
                key={img.id} 
                className="group relative rounded-xl border border-lp-border bg-lp-surface overflow-hidden aspect-square flex flex-col justify-end transition hover:border-lp-border2 hover:shadow-lg"
              >
                <img 
                  src={img.url} 
                  alt={img.label || img.category} 
                  className="absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
                
                {/* Overlay details */}
                <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-1 w-full">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(img.category)}`}>
                      {img.category}
                    </span>
                    {editingLabelId === img.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editLabelValue}
                          onChange={(e) => setEditLabelValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveLabel(img.id);
                            if (e.key === 'Escape') setEditingLabelId(null);
                          }}
                          autoFocus
                          disabled={savingLabelId === img.id}
                          className="h-6 w-24 rounded border border-white/20 bg-black/60 px-1 text-[10px] text-white focus:border-lp-accent outline-none"
                        />
                        <button
                          onClick={() => handleSaveLabel(img.id)}
                          disabled={savingLabelId === img.id}
                          className="flex size-6 items-center justify-center rounded bg-lp-accent text-lp-bg hover:brightness-110"
                        >
                          {savingLabelId === img.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                        </button>
                      </div>
                    ) : (
                      img.label ? (
                        <span className="group/label px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white text-[10px] font-bold truncate max-w-[100px] flex items-center gap-1 cursor-pointer" onClick={() => { setEditingLabelId(img.id); setEditLabelValue(img.label || ""); }}>
                          {img.label}
                          <Pencil className="size-2.5 opacity-0 group-hover/label:opacity-100 transition-opacity" />
                        </span>
                      ) : (
                        <button onClick={() => { setEditingLabelId(img.id); setEditLabelValue(""); }} className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-white/70 hover:text-white text-[10px] font-bold flex items-center gap-1 transition">
                          <Pencil className="size-2.5" /> Add Tag
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Delete button (displays on hover) */}
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={deletingId === img.id}
                  className="absolute top-2 right-2 z-20 flex size-8 items-center justify-center rounded-lg bg-black/70 hover:bg-lp-red/20 text-lp-text2 hover:text-lp-red border border-white/10 transition opacity-0 group-hover:opacity-100"
                  title="Delete image"
                >
                  {deletingId === img.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-lp-border2 p-12 text-center text-lp-text2">
            <p className="text-sm font-bold text-lp-text">No images found</p>
            <p className="text-xs mt-1">Upload business photos to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
