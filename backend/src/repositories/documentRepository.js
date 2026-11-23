const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const storageDir = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '../../storage'));
const documents = [];

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDir, { recursive: true }, (error) => callback(error, storageDir));
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const limits = {};
if (process.env.MAX_FILE_SIZE_BYTES) {
  const maxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES);
  if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
    throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo');
  }
  limits.fileSize = maxFileSize;
}

const upload = multer({ storage, limits, defParamCharset: 'utf8' }).single('file');

function save(document) {
  documents.unshift(document);
}

function findAll() {
  return documents;
}

function findById(id) {
  return documents.find((document) => document.id === id);
}

function getFilePath(storedName) {
  return path.join(storageDir, storedName);
}

function removeFile(storedName) {
  return fs.promises.unlink(getFilePath(storedName));
}

module.exports = { upload, save, findAll, findById, getFilePath, removeFile };