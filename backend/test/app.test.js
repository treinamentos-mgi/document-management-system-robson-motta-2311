const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_FILE_SIZE_BYTES = '16';
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download de documentos', async (context) => {
  const server = app.listen(0);
  context.after(() => {
    server.close();
    fs.rmSync(storageDir, { recursive: true, force: true });
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const health = await fetch(`${baseUrl}/health`);
  assert.deepStrictEqual(await health.json(), { status: 'ok' });

  const missingFile = await fetch(`${baseUrl}/upload`, { method: 'POST' });
  assert.strictEqual(missingFile.status, 400);
  assert.strictEqual((await missingFile.json()).error.code, 'VALIDATION_ERROR');

  const form = new FormData();
  form.append('file', new Blob(['conteudo'], { type: 'text/plain' }), 'documentação.txt');
  form.append('owner', 'maria');
  const upload = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(upload.status, 201);
  const document = await upload.json();
  assert.ok(document.id);
  assert.strictEqual(document.originalName, 'documentação.txt');
  assert.strictEqual(document.mimeType, 'text/plain');
  assert.strictEqual(document.size, 8);
  assert.strictEqual(document.owner, 'maria');
  assert.ok(!Number.isNaN(Date.parse(document.uploadedAt)));
  assert.strictEqual(document.storedName, undefined);
  const storedFiles = fs.readdirSync(storageDir);
  assert.strictEqual(storedFiles.length, 1);

  const list = await fetch(`${baseUrl}/documents?owner=maria`);
  assert.deepStrictEqual((await list.json()).documents, [document]);
  const filtered = await fetch(`${baseUrl}/documents?owner=outra`);
  assert.deepStrictEqual((await filtered.json()).documents, []);

  const invalidForm = new FormData();
  invalidForm.append('file', new Blob(['teste']), 'teste.txt');
  invalidForm.append('owner', 'maria');
  invalidForm.append('owner', 'outra');
  const invalid = await fetch(`${baseUrl}/upload`, { method: 'POST', body: invalidForm });
  assert.strictEqual(invalid.status, 400);
  assert.strictEqual((await invalid.json()).error.code, 'VALIDATION_ERROR');
  assert.deepStrictEqual(fs.readdirSync(storageDir), storedFiles);

  const largeForm = new FormData();
  largeForm.append('file', new Blob(['arquivo muito grande']), 'grande.txt');
  const large = await fetch(`${baseUrl}/upload`, { method: 'POST', body: largeForm });
  assert.strictEqual(large.status, 413);
  assert.strictEqual((await large.json()).error.code, 'UPLOAD_ERROR');
  assert.deepStrictEqual(fs.readdirSync(storageDir), storedFiles);

  const anonymousForm = new FormData();
  anonymousForm.append('file', new Blob(['outro']), 'outro.txt');
  const anonymous = await fetch(`${baseUrl}/upload`, { method: 'POST', body: anonymousForm });
  assert.strictEqual(anonymous.status, 201);
  const anonymousDocument = await anonymous.json();
  assert.strictEqual(anonymousDocument.owner, 'anonymous');
  const allDocuments = await fetch(`${baseUrl}/documents`);
  assert.deepStrictEqual((await allDocuments.json()).documents, [anonymousDocument, document]);

  const download = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(download.status, 200);
  assert.match(download.headers.get('content-type'), /^text\/plain(?:;|$)/);
  assert.match(download.headers.get('content-disposition'), /^attachment/);
  assert.strictEqual(await download.text(), 'conteudo');

  const unknown = await fetch(`${baseUrl}/documents/inexistente/download`);
  assert.strictEqual(unknown.status, 404);
  assert.strictEqual((await unknown.json()).error.code, 'DOCUMENT_NOT_FOUND');

  fs.unlinkSync(path.join(storageDir, storedFiles[0]));
  const missing = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(missing.status, 404);
  assert.strictEqual((await missing.json()).error.code, 'FILE_NOT_FOUND');
});
