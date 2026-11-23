# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web mínima para envio, listagem e download de documentos em armazenamento local.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem dos documentos enviados
- Download de documentos pelo identificador
- Gestão simples por usuário por meio de um identificador `owner`
- Interface React mínima para selecionar, enviar, listar e baixar documentos

### Fora do escopo

- Armazenamento externo ou em nuvem
- Banco de dados ou persistência permanente dos metadados
- Autenticação e autorização completas
- Versionamento de documentos
- Exclusão, edição ou compartilhamento de documentos
- Busca avançada e auditoria

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um documento por `multipart/form-data`, no campo `file` |
| RF-02 | O sistema gera um identificador único para cada documento enviado |
| RF-03 | O sistema preserva o nome original e registra tamanho, tipo MIME, data e proprietário |
| RF-04 | O usuário pode listar os metadados dos documentos enviados |
| RF-05 | A listagem pode ser filtrada pelo identificador `owner` |
| RF-06 | O usuário pode baixar um documento existente pelo identificador |
| RF-07 | O sistema informa uma resposta adequada quando o arquivo não é enviado, não existe ou não pode ser lido |
| RF-08 | O frontend permite selecionar um arquivo, enviá-lo, listar documentos e iniciar downloads |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Backend em Node.js, Express 5 e CommonJS |
| RNF-02 | Arquivos gravados no filesystem local em `backend/storage` com Multer e `diskStorage` |
| RNF-03 | Metadados mantidos em memória durante a execução do backend |
| RNF-04 | Configuração via variáveis de ambiente, seguindo princípios de 12-Factor App |
| RNF-05 | Backend organizado em `routes`, `controllers`, `services` e `repositories` |
| RNF-06 | Frontend React em JavaScript puro, com Vite e comunicação por `fetch` |
| RNF-07 | Backend testado com o runner nativo `node:test` |
| RNF-08 | Nomes de símbolos em inglês e mensagens ao usuário em português |
| RNF-09 | Respostas de API não devem expor caminhos físicos internos |

## 5. Modelo de dados

A única entidade desta fase é o metadado de documento.

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único do documento |
| `originalName` | string | Sim | Nome original enviado pelo cliente |
| `storedName` | string | Interno | Nome seguro usado no filesystem; não deve ser retornado pela API |
| `mimeType` | string | Sim | Tipo MIME informado pelo Multer |
| `size` | number | Sim | Tamanho em bytes |
| `uploadedAt` | string | Sim | Data/hora UTC em formato ISO 8601 |
| `owner` | string | Sim | Identificador do proprietário |

Exemplo de metadado público:

```json
{
  "id": "doc-123",
  "originalName": "contrato.pdf",
  "mimeType": "application/pdf",
  "size": 102400,
  "uploadedAt": "2026-11-23T12:00:00.000Z",
  "owner": "anonymous"
}
```

## 6. Contratos de API

A API responde em JSON, exceto o endpoint de download.

### Formato de erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensagem em português",
    "details": {}
  }
}
```

Códigos previstos: `VALIDATION_ERROR`, `DOCUMENT_NOT_FOUND`, `FILE_NOT_FOUND`, `UPLOAD_ERROR` e `INTERNAL_ERROR`.

### GET /health

Resposta `200 OK`:

```json
{
  "status": "ok"
}
```

### POST /upload

Entrada:

- `Content-Type: multipart/form-data`
- Campo obrigatório `file`
- Campo opcional `owner`, com valor padrão `anonymous`

Resposta `201 Created`:

```json
{
  "id": "doc-123",
  "originalName": "contrato.pdf",
  "mimeType": "application/pdf",
  "size": 102400,
  "uploadedAt": "2026-11-23T12:00:00.000Z",
  "owner": "anonymous"
}
```

Erros:

- `400 Bad Request`: arquivo ausente ou dados inválidos
- `413 Payload Too Large`: arquivo acima do limite configurado
- `500 Internal Server Error`: falha de armazenamento ou processamento

### GET /documents

Entrada opcional: parâmetro de consulta `owner`.

Resposta `200 OK`:

```json
{
  "documents": []
}
```

A lista deve ser ordenada pela data de envio, da mais recente para a mais antiga. Sem filtro, a implementação inicial pode retornar todos os metadados disponíveis.

Erros:

- `500 Internal Server Error`: falha interna

### GET /documents/:id/download

Entrada:

- `id` obrigatório na URL

Resposta `200 OK`:

- Conteúdo binário do documento
- `Content-Type` com o MIME registrado
- `Content-Disposition: attachment`
- `Content-Length` quando disponível

Erros:

- `400 Bad Request`: identificador vazio ou inválido
- `404 Not Found`: metadado ou arquivo físico não encontrado
- `500 Internal Server Error`: falha de leitura do arquivo

## 7. Decisões arquiteturais

### Backend

- `routes/`: registra os endpoints e delega aos controllers
- `controllers/`: valida entrada HTTP e traduz exceções em respostas HTTP
- `services/`: concentra regras de criação, listagem e localização de documentos
- `repositories/`: mantém metadados em memória e usa o filesystem local
- Multer deve usar `diskStorage` e gravar exclusivamente em `backend/storage`
- A pasta pode ser definida por variável de ambiente, mantendo `backend/storage` como padrão
- `STORAGE_DIR` define a pasta de armazenamento; `MAX_FILE_SIZE_BYTES` define opcionalmente o tamanho máximo do arquivo em bytes

Fluxo de dependência: `routes -> controllers -> services -> repositories`.

### Frontend

- `components/`: controles reutilizáveis da interface
- `pages/`: composição das páginas e estado da operação
- `services/`: comunicação HTTP com o backend
- O proxy do Vite encaminha `/api` para `http://localhost:3000`
- O frontend não deve usar URLs físicas dos arquivos; usa o endpoint de download por `id`

## 8. Plano de execução

1. Preparar testes backend para health, upload válido e inválido, listagem e download.
2. Implementar o repositório de metadados em memória e o armazenamento físico por Multer.
3. Implementar os services de upload, listagem e download.
4. Implementar controllers e routes dos contratos definidos.
5. Integrar Express, configuração e pasta local de armazenamento.
6. Executar os testes backend e corrigir falhas pelo ciclo Red-Green-Refactor.
7. Implementar o serviço HTTP do frontend em `services/`.
8. Implementar componentes e páginas React para upload, listagem e download.
9. Validar a integração no proxy `/api` e os estados de sucesso e erro.
10. Executar testes backend e build frontend e revisar os critérios de aceitação.

## 9. Critérios de aceitação

- `POST /upload` sem arquivo retorna `400`
- Upload válido retorna `201` com metadados públicos
- O arquivo enviado existe em `backend/storage`
- `GET /documents` retorna `200` e contém o documento enviado
- Download válido retorna `200` com o conteúdo correto
- Identificador inexistente retorna `404`
- Reiniciar o backend limpa os metadados em memória
- Frontend permite enviar, listar e baixar documentos
- Os testes backend passam e o build frontend conclui sem erros
