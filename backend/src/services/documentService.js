const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documentRepository');

function publicDocument(document) {
  const { storedName, ...metadata } = document;
  return metadata;
}

function create(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: owner || 'anonymous',
  };
  repository.save(document);
  return publicDocument(document);
}

function list(owner) {
  return repository.findAll()
    .filter((document) => owner === undefined || document.owner === owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(publicDocument);
}

function findForDownload(id) {
  const document = repository.findById(id);
  if (!document) return null;
  return { ...publicDocument(document), filePath: repository.getFilePath(document.storedName) };
}

module.exports = {
  upload: repository.upload,
  removeFile: repository.removeFile,
  create,
  list,
  findForDownload,
};