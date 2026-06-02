(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";

  const state = {
    courts: [],
    search: "",
    type: "",
    status: ""
  };

  const elements = {
    grid: document.querySelector("#courts-grid"),
    count: document.querySelector("#courts-count"),
    error: document.querySelector("#courts-error"),
    search: document.querySelector("#court-search"),
    type: document.querySelector("#court-type"),
    status: document.querySelector("#court-status"),
    clear: document.querySelector("#clear-court-filters"),
    authAction: document.querySelector("#courts-auth-action")
  };

  function getLoggedUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY));
    } catch (error) {
      return null;
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function label(value) {
    const labels = {
      FUTSAL: "Futsal",
      SOCIETY: "Society",
      BASQUETE: "Basquete",
      VOLEI: "V\u00f4lei",
      TENIS: "T\u00eanis",
      DISPONIVEL: "DISPON\u00cdVEL",
      INDISPONIVEL: "INDISPON\u00cdVEL",
      MANUTENCAO: "MANUTEN\u00c7\u00c3O"
    };

    return labels[value] || value || "N/A";
  }

  function badgeClass(status) {
    return `badge badge--${String(status || "muted").toLowerCase()}`;
  }

  function iconText(type) {
    const values = {
      FUTSAL: "FS",
      SOCIETY: "SC",
      BASQUETE: "BQ",
      VOLEI: "VL",
      TENIS: "TN"
    };

    return values[type] || "QD";
  }

  function showError(text) {
    if (!elements.error) {
      return;
    }

    elements.error.hidden = false;
    elements.error.textContent = text;
  }

  function hideError() {
    if (elements.error) {
      elements.error.hidden = true;
      elements.error.textContent = "";
    }
  }

  function updateAuthAction() {
    const user = getLoggedUser();

    if (!elements.authAction) {
      return;
    }

    if (user?.id) {
      elements.authAction.textContent = "Sair";
      elements.authAction.dataset.mode = "logout";
    } else {
      elements.authAction.textContent = "Entrar";
      elements.authAction.dataset.mode = "login";
    }
  }

  function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    element.textContent = text;
    return element;
  }

  function createCourtCard(court) {
    const card = document.createElement("article");
    card.className = "court-list-card";

    const visual = document.createElement("div");
    visual.className = `court-type-visual court-type-visual--${String(court.tipo || "").toLowerCase()}`;
    visual.appendChild(createTextElement("span", "", iconText(court.tipo)));
    visual.appendChild(createTextElement("small", "", label(court.tipo)));

    const content = document.createElement("div");
    content.className = "court-list-card__content";

    const header = document.createElement("div");
    header.className = "court-list-card__header";
    header.appendChild(createTextElement("span", "court-type-label", label(court.tipo)));

    const status = createTextElement("span", badgeClass(court.status), label(court.status));
    header.appendChild(status);

    const title = createTextElement("h2", "", court.nome || "Quadra");
    const description = createTextElement("p", "", court.descricao || "Quadra esportiva cadastrada no sistema.");

    const meta = document.createElement("div");
    meta.className = "court-list-card__meta";
    meta.appendChild(createTextElement("span", "", "Pre\u00e7o por hora"));
    meta.appendChild(createTextElement("strong", "", formatCurrency(court.precoHora)));

    const actions = document.createElement("div");
    actions.className = "court-list-card__actions";

    const detailsLink = document.createElement("a");
    detailsLink.className = "button button--dark";
    detailsLink.href = `detalhes-quadra.html?id=${encodeURIComponent(court.id)}`;
    detailsLink.textContent = "Ver detalhes";

    const scheduleLink = document.createElement("a");
    scheduleLink.className = "button button--primary";
    scheduleLink.href = `agendar.html?quadraId=${encodeURIComponent(court.id)}`;
    scheduleLink.textContent = "Agendar";
    scheduleLink.dataset.requiresLogin = "true";

    if (court.status !== "DISPONIVEL") {
      scheduleLink.classList.add("is-disabled");
      scheduleLink.setAttribute("aria-disabled", "true");
      scheduleLink.tabIndex = -1;
    }

    actions.appendChild(detailsLink);
    actions.appendChild(scheduleLink);

    content.appendChild(header);
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(meta);
    content.appendChild(actions);
    card.appendChild(visual);
    card.appendChild(content);

    return card;
  }

  function getFilteredCourts() {
    const search = normalizeText(state.search);

    return state.courts.filter((court) => {
      const matchesSearch = !search || normalizeText(court.nome).includes(search);
      const matchesType = !state.type || court.tipo === state.type;
      const matchesStatus = !state.status || court.status === state.status;

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  function updateCount(total) {
    const text = total === 1 ? "1 quadra encontrada" : `${total} quadras encontradas`;
    elements.count.textContent = text;
  }

  function renderCourts() {
    const filtered = getFilteredCourts();
    elements.grid.innerHTML = "";

    updateCount(filtered.length);

    if (filtered.length === 0) {
      const empty = document.createElement("article");
      empty.className = "court-empty";
      empty.appendChild(createTextElement("strong", "", "Nenhuma quadra encontrada."));
      empty.appendChild(createTextElement("p", "", "Ajuste os filtros para consultar outras op\u00e7\u00f5es cadastradas."));
      elements.grid.appendChild(empty);
      return;
    }

    filtered.forEach((court) => {
      elements.grid.appendChild(createCourtCard(court));
    });
  }

  async function loadCourts() {
    try {
      hideError();
      const response = await window.QuadraFacilApi.request("/quadras");
      state.courts = Array.isArray(response?.data) ? response.data : [];
      renderCourts();
    } catch (error) {
      state.courts = [];
      renderCourts();
      showError("N\u00e3o foi poss\u00edvel carregar as quadras. Verifique se o backend est\u00e1 em execu\u00e7\u00e3o.");
    }
  }

  elements.search?.addEventListener("input", () => {
    state.search = elements.search.value;
    renderCourts();
  });

  elements.type?.addEventListener("change", () => {
    state.type = elements.type.value;
    renderCourts();
  });

  elements.status?.addEventListener("change", () => {
    state.status = elements.status.value;
    renderCourts();
  });

  elements.clear?.addEventListener("click", () => {
    state.search = "";
    state.type = "";
    state.status = "";
    elements.search.value = "";
    elements.type.value = "";
    elements.status.value = "";
    renderCourts();
  });

  elements.grid?.addEventListener("click", (event) => {
    const scheduleLink = event.target.closest("[data-requires-login='true']");

    if (!scheduleLink) {
      return;
    }

    if (scheduleLink.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return;
    }

    if (!getLoggedUser()?.id) {
      event.preventDefault();
      sessionStorage.setItem(REDIRECT_KEY, scheduleLink.getAttribute("href"));
      window.location.href = "login.html";
    }
  });

  elements.authAction?.addEventListener("click", () => {
    if (elements.authAction.dataset.mode === "logout") {
      localStorage.removeItem(AUTH_USER_KEY);
      updateAuthAction();
      return;
    }

    window.location.href = "login.html";
  });

  updateAuthAction();
  loadCourts();
})();
