import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";

export default function DropZone({ onFile, accept = "*", loading = false, label = "Clique ou arraste o arquivo aqui", disabled = false }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || loading) return;
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !loading) setDragging(true);
  };

  return (
    <label
      className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-all ${disabled || loading ? "opacity-60 pointer-events-none" : ""}`}
      style={{
        border: `2px dashed ${dragging ? "rgba(11,95,255,0.6)" : "rgba(255,255,255,0.12)"}`,
        background: dragging ? "rgba(11,95,255,0.08)" : "rgba(255,255,255,0.02)",
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {loading ? (
        <>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#5E9BFF" }} />
          <span className="text-xs" style={{ color: "#6B7FA3" }}>Enviando...</span>
        </>
      ) : (
        <>
          <Upload className="w-6 h-6" style={{ color: dragging ? "#5E9BFF" : "#6B7FA3" }} />
          <span className="text-xs text-center" style={{ color: dragging ? "#5E9BFF" : "#6B7FA3" }}>
            {dragging ? "Solte o arquivo aqui" : label}
          </span>
        </>
      )}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => e.target.files[0] && onFile(e.target.files[0])}
      />
    </label>
  );
}