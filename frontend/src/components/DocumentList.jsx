import { FileText, FolderOpen } from "lucide-react";
import DownloadButton from "./DownloadButton";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function DocumentList({ documents, loading, filtered }) {
  if (loading)
    return (
      <div className="list-message" role="status">
        Carregando documentos...
      </div>
    );
  if (!documents.length)
    return (
      <div className="empty-state">
        <FolderOpen size={27} strokeWidth={1.5} />
        <strong>Nenhum documento encontrado</strong>
        <span>
          {filtered
            ? "Tente outro proprietário."
            : "Os arquivos enviados aparecerão aqui."}
        </span>
      </div>
    );
  return (
    <div className="document-table">
      <div className="table-header" aria-hidden="true">
        <span>DOCUMENTO</span>
        <span>PROPRIETÁRIO</span>
        <span>DATA DE ENVIO</span>
        <span>TAMANHO</span>
        <span />
      </div>
      <ul className="document-list">
        {documents.map((document) => (
          <li className="document-row" key={document.id}>
            <div className="document-name">
              <span className="file-icon">
                <FileText size={19} />
              </span>
              <div>
                <strong title={document.originalName}>
                  {document.originalName}
                </strong>
                <span>{document.mimeType || "Arquivo"}</span>
              </div>
            </div>
            <div className="document-meta">
              <span className="mobile-label">PROPRIETÁRIO</span>
              {document.owner}
            </div>
            <div className="document-meta">
              <span className="mobile-label">DATA</span>
              {dateFormatter.format(new Date(document.uploadedAt))}
            </div>
            <div className="document-meta">
              <span className="mobile-label">TAMANHO</span>
              {formatSize(document.size)}
            </div>
            <DownloadButton document={document} />
          </li>
        ))}
      </ul>
    </div>
  );
}
