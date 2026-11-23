import { useRef, useState } from "react";
import { ArrowUpRight, FilePlus2, Upload } from "lucide-react";
import { uploadDocument } from "../services/documentApi";

export default function UploadComponent({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const document = await uploadDocument(file, owner.trim());
      setFile(null);
      setOwner("");
      fileInput.current.value = "";
      onUploaded(document);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="upload-intro">
        <span className="upload-icon">
          <FilePlus2 size={22} />
        </span>
        <div>
          <div className="section-kicker">ADICIONAR AO ACERVO</div>
          <h2 id="upload-title">Novo documento</h2>
          <p>Selecione um arquivo para guardar.</p>
        </div>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="field file-field">
          <label htmlFor="file">ARQUIVO</label>
          <div className="file-picker">
            <label className="choose-file" htmlFor="file">
              <Upload size={15} /> Selecionar
            </label>
            <input
              ref={fileInput}
              id="file"
              type="file"
              onChange={(event) => {
                setFile(event.target.files[0] || null);
                setError("");
              }}
              disabled={uploading}
            />
            <span title={file?.name}>
              {file ? file.name : "Nenhum arquivo selecionado"}
            </span>
          </div>
        </div>
        <div className="field owner-field">
          <label htmlFor="owner">
            PROPRIETÁRIO <span>OPCIONAL</span>
          </label>
          <input
            id="owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Ex.: Maria"
            disabled={uploading}
          />
        </div>
        <button
          className="primary-button"
          type="submit"
          disabled={!file || uploading}
        >
          {uploading ? "Enviando..." : "Enviar arquivo"}{" "}
          <ArrowUpRight size={17} />
        </button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
