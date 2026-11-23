import { useState } from "react";
import { Download } from "lucide-react";
import { downloadDocument } from "../services/documentApi";

export default function DownloadButton({ document }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setError("");
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="download-action">
        <button
          className="icon-button download-button"
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          title={`Baixar ${document.originalName}`}
          aria-label={`Baixar ${document.originalName}`}
        >
          <Download size={18} />
        </button>
      </div>
      {error && (
        <span className="download-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
