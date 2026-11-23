import { useEffect, useState } from "react";
import {
  Archive,
  FileStack,
  FolderOpen,
  RefreshCw,
  Search,
} from "lucide-react";
import UploadComponent from "./components/UploadComponent";
import DocumentList from "./components/DocumentList";
import { listDocuments } from "./services/documentApi";
import "./App.css";

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [ownerInput, setOwnerInput] = useState("");
  const [owner, setOwner] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listDocuments(owner)
      .then((result) => {
        if (active) setDocuments(result);
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [owner, revision]);

  function refresh() {
    setRevision((value) => value + 1);
  }

  function handleUploaded(document) {
    setOwnerInput("");
    setOwner("");
    setNotice(`“${document.originalName}” foi enviado com sucesso.`);
    refresh();
  }

  function handleFilter(event) {
    event.preventDefault();
    const nextOwner = ownerInput.trim();
    if (nextOwner === owner) refresh();
    else setOwner(nextOwner);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Archive size={19} />
          </span>
          <span>
            arquivo<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="sidebar-label">ESPAÇO DE TRABALHO</div>
        <div className="sidebar-active">
          <FolderOpen size={18} />
          <span>Documentos</span>
          <span className="sidebar-indicator" />
        </div>
        <div className="sidebar-bottom">
          <span className="status-dot" /> Armazenamento local
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <span>
            ESPAÇO DE TRABALHO <span className="breadcrumb-divider">/</span>{" "}
            <strong>DOCUMENTOS</strong>
          </span>
          <span className="topbar-tag">
            DMS <span>01</span>
          </span>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> SEU ESPAÇO DE DOCUMENTOS
              </div>
              <h1>
                Documentos<span>.</span>
              </h1>
              <p>Seus arquivos, organizados em um só lugar.</p>
            </div>
            <div className="heading-icon" aria-hidden="true">
              <FileStack size={29} strokeWidth={1.5} />
            </div>
          </div>
          <UploadComponent onUploaded={handleUploaded} />
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          <section
            className="documents-section"
            aria-labelledby="documents-title"
          >
            <div className="section-heading">
              <div>
                <div className="section-kicker">
                  ACERVO <span>/ 01</span>
                </div>
                <h2 id="documents-title">
                  Seus documentos{" "}
                  <span className="document-count">
                    {loading || error ? "–" : documents.length}
                  </span>
                </h2>
              </div>
              <div className="list-actions">
                <form className="filter-form" onSubmit={handleFilter}>
                  <label className="sr-only" htmlFor="owner-filter">
                    Filtrar por proprietário
                  </label>
                  <Search size={16} aria-hidden="true" />
                  <input
                    id="owner-filter"
                    value={ownerInput}
                    onChange={(event) => setOwnerInput(event.target.value)}
                    placeholder="Filtrar proprietário"
                  />
                  <button type="submit">Filtrar</button>
                </form>
                <button
                  className="icon-button"
                  type="button"
                  onClick={refresh}
                  title="Atualizar documentos"
                  aria-label="Atualizar documentos"
                  disabled={loading}
                >
                  <RefreshCw size={17} />
                </button>
              </div>
            </div>
            {error ? (
              <div className="list-message error" role="alert">
                {error}{" "}
                <button type="button" onClick={refresh}>
                  Tentar novamente
                </button>
              </div>
            ) : (
              <DocumentList
                documents={documents}
                loading={loading}
                filtered={Boolean(owner)}
              />
            )}
          </section>
          <footer className="footer">
            <span>
              ARQUIVO <span className="footer-dot">●</span> GESTÃO DOCUMENTAL
            </span>
            <span>SEU ACERVO, EM ORDEM.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
