import React, { useState } from "react";
import {
  Building,
  Upload,
  Image,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Button, Card, Badge, Input } from "../../components/ui/Primitives";

export const CompanyProfilePage: React.FC = () => {
  const { user, refreshUser, addToast } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleUploadLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select an image file to upload as the company logo.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");
    try {
      const res = await api.auth.uploadCompanyLogo(selectedFile);
      addToast({
        type: "success",
        title: "Logo Uploaded Successfully",
        message: "Your new corporate logo has been deployed.",
      });
      await refreshUser();
      setSelectedFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload logo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Company Profile & Branding
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage tenant branding, corporate credentials, and storage assets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Company Logo Preview Card */}
        <Card className="p-6 text-center space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Current Logo Asset</h3>
          <div className="w-32 h-32 mx-auto rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
            {previewUrl || user?.company_logo_url ? (
              <img
                src={previewUrl || user?.company_logo_url}
                alt="Company Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-400 flex flex-col items-center">
                <Building className="w-8 h-8 mb-1" />
                <span className="text-[10px]">No Logo Configured</span>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {user?.company_name || "Enterprise Tenant"}
            </h4>
            <p className="text-xs text-purple-700 font-mono font-semibold">
              ID: {user?.company_id}
            </p>
          </div>
        </Card>

        {/* Upload Logo Form */}
        <Card className="p-6 md:col-span-2 space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#7C3AED]" />
            Upload Corporate Logo
          </h3>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUploadLogo} className="space-y-4">
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center hover:border-purple-300 transition-colors">
              <input
                type="file"
                id="logo-file-input"
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="logo-file-input"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7C3AED] flex items-center justify-center mb-2">
                  <Image className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : "Click to browse logo image"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG, SVG, or WEBP (Max 5MB)
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUploading}
                disabled={!selectedFile}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload & Apply Logo
              </Button>
            </div>
          </form>

          {/* Tenant Details */}
          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900">Tenant Metadata</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">COMPANY NAME</span>
                <span className="font-bold text-slate-800">{user?.company_name || "--"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">STORAGE BUCKET</span>
                <span className="font-semibold text-slate-800">Supabase: company-logos</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
