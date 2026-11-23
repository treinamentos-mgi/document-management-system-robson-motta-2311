const API_PREFIX = "/api";

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, options);
  } catch {
    throw new Error("Não foi possível conectar ao servidor.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error?.message || "Não foi possível concluir a operação.",
    );
  }
  return response;
}

export async function listDocuments(owner) {
  const query = owner ? `?${new URLSearchParams({ owner })}` : "";
  const response = await request(`/documents${query}`);
  return (await response.json()).documents;
}

export async function uploadDocument(file, owner) {
  const form = new FormData();
  form.append("file", file);
  if (owner) form.append("owner", owner);
  const response = await request("/upload", { method: "POST", body: form });
  return response.json();
}

export async function downloadDocument(id) {
  const response = await request(
    `/documents/${encodeURIComponent(id)}/download`,
  );
  return response.blob();
}
