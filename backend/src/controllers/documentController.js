const multer = require('multer');
const service = require('../services/documentService');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message, details: {} } });
}

function uploadMiddleware(req, res, next) {
  service.upload(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 413, 'UPLOAD_ERROR', 'O arquivo excede o tamanho permitido.');
      }
      return sendError(res, 400, 'VALIDATION_ERROR', 'Dados de upload inválidos.');
    }
    return sendError(res, 500, 'UPLOAD_ERROR', 'Não foi possível armazenar o arquivo.');
  });
}

async function upload(req, res) {
  if (!req.file) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Envie um arquivo no campo file.');
  }
  if (req.body.owner !== undefined && typeof req.body.owner !== 'string') {
    try {
      await service.removeFile(req.file.filename);
    } catch (error) {
      return sendError(res, 500, 'UPLOAD_ERROR', 'Não foi possível remover o arquivo inválido.');
    }
    return sendError(res, 400, 'VALIDATION_ERROR', 'O proprietário informado é inválido.');
  }
  try {
    return res.status(201).json(service.create(req.file, req.body.owner));
  } catch (error) {
    await service.removeFile(req.file.filename).catch(() => {});
    return sendError(res, 500, 'INTERNAL_ERROR', 'Não foi possível registrar o documento.');
  }
}

function list(req, res) {
  if (req.query.owner !== undefined && typeof req.query.owner !== 'string') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'O proprietário informado é inválido.');
  }
  try {
    return res.json({ documents: service.list(req.query.owner) });
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Não foi possível listar os documentos.');
  }
}

function download(req, res) {
  if (!req.params.id.trim()) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'O identificador informado é inválido.');
  }
  const document = service.findForDownload(req.params.id);
  if (!document) {
    return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }
  res.type(document.mimeType);
  return res.download(document.filePath, document.originalName, (error) => {
    if (!error) return;
    if (res.headersSent) return res.destroy(error);
    res.removeHeader('Content-Disposition');
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return sendError(res, 404, 'FILE_NOT_FOUND', 'Arquivo não encontrado.');
    }
    return sendError(res, 500, 'INTERNAL_ERROR', 'Não foi possível ler o arquivo.');
  });
}

module.exports = { uploadMiddleware, upload, list, download };