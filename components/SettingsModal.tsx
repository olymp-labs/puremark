import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Download, Upload, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { AppSettings } from "../types";

interface Props {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ settings, onUpdate, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportConfirmDialog, setShowImportConfirmDialog] = useState(false);
  const [allowExport, setAllowExport] = useState(true);
  const [allowImport, setAllowImport] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);

  // Load config from API
  useEffect(() => {
    const loadConfig = async () => {
      setConfigLoading(true);
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const config = await res.json();
          setAllowExport(config.allowExport);
          setAllowImport(config.allowImport);
        }
      } catch (error) {
        console.error("Failed to load config:", error);
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showImportConfirmDialog) {
          cancelImportDialog();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showImportConfirmDialog]);

  const toggleSetting = (key: keyof AppSettings) => {
    onUpdate({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleDownloadDb = async () => {
    try {
      const res = await fetch("/api/database/export");
      if (!res.ok) {
        throw new Error("Failed to download database");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
        "puremark-db.sqlite";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download database:", error);
    }
  };

  const handleImportDb = () => {
    setShowImportConfirmDialog(true);
  };

  const confirmImport = () => {
    fileInputRef.current?.click();
  };

  const cancelImportDialog = () => {
    setShowImportConfirmDialog(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/database/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to import database");
      }

      window.location.reload();
    } catch (error) {
      console.error("Failed to import database:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-sm bg-neutral-925 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-medium text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Setting Item */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-neutral-200">Save links as new bookmarks</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                When pasting a URL, automatically open a dialog to save it as a new bookmark.
              </p>
            </div>

            <button
              onClick={() => toggleSetting("autoDetectClipboardLinks")}
              className={`
                relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30
                ${settings.autoDetectClipboardLinks ? "bg-blue-600" : "bg-neutral-800"}
              `}
            >
              <motion.div
                initial={false}
                animate={{
                  x: settings.autoDetectClipboardLinks ? 22 : 2,
                  scale: settings.autoDetectClipboardLinks ? 1.1 : 1,
                }}
                className={`absolute top-1 left-0 w-4 h-4 rounded-full shadow-sm flex items-center justify-center ${settings.autoDetectClipboardLinks ? "bg-white" : "bg-neutral-400"}`}
              >
                {settings.autoDetectClipboardLinks && (
                  <Check className="w-2.5 h-2.5 text-blue-600" strokeWidth={4} />
                )}
              </motion.div>
            </button>
          </div>

          <div className="border-t border-neutral-800 pt-4">
            <div className="flex gap-3">
              <button
                onClick={allowExport && !configLoading ? handleDownloadDb : undefined}
                disabled={!allowExport || configLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                  allowExport && !configLoading
                    ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    : "bg-neutral-900/50 text-neutral-600 cursor-not-allowed"
                }`}
                title={
                  configLoading
                    ? "Loading..."
                    : !allowExport
                      ? "Database export disabled by the administrator"
                      : undefined
                }
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
              <button
                onClick={allowImport && !configLoading ? handleImportDb : undefined}
                disabled={!allowImport || configLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                  allowImport && !configLoading
                    ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    : "bg-neutral-900/50 text-neutral-600 cursor-not-allowed"
                }`}
                title={
                  configLoading
                    ? "Loading..."
                    : !allowImport
                      ? "Database import disabled by the administrator"
                      : undefined
                }
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Import</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sqlite,.db"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showImportConfirmDialog && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={cancelImportDialog}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-neutral-925 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-800">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/30">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-medium text-white">Import Database</h2>
                <button
                  onClick={cancelImportDialog}
                  className="ml-auto p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <p className="text-sm text-neutral-200 leading-relaxed">
                    This will replace all your current bookmarks and settings with the content of
                    this file. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  onClick={cancelImportDialog}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span>Cancel</span>
                  <span className="text-[10px] font-mono opacity-50 group-hover:opacity-100 transition-opacity border border-neutral-700 rounded px-1">
                    ESC
                  </span>
                </button>
                <button
                  onClick={confirmImport}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-orange-900/20 flex items-center gap-2 transition-all group"
                >
                  <span>Import</span>
                  <span className="text-[10px] font-mono bg-white/20 px-1.5 rounded text-white/90">
                    ↵
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
