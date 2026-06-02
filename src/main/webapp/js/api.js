(function () {
  const API_STORAGE_KEY = "quadraFacil.apiBaseUrl";
  const DEFAULT_API_BASE_URL = "http://localhost:8080/AgendamentoQuadrasBackend/api";

  function normalizeBaseUrl(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function resolveApiBaseUrl() {
    const configured = localStorage.getItem(API_STORAGE_KEY);

    if (configured) {
      return normalizeBaseUrl(configured);
    }

    if (window.location.protocol.startsWith("http") && window.location.pathname.includes("/AgendamentoQuadrasBackend/")) {
      return `${window.location.origin}/AgendamentoQuadrasBackend/api`;
    }

    return DEFAULT_API_BASE_URL;
  }

  async function request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const response = await fetch(`${resolveApiBaseUrl()}${endpoint}`, {
      ...options,
      headers
    });

    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok || (body && body.success === false)) {
      const message = body?.message || "Nao foi possivel concluir a operacao.";
      const error = new Error(message);
      error.status = response.status;
      error.body = body;
      throw error;
    }

    return body;
  }

  window.QuadraFacilApi = {
    API_STORAGE_KEY,
    resolveApiBaseUrl,
    request
  };
})();
