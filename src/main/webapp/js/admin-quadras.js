(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";
  const ACCESS_DENIED_KEY = "quadraFacil.adminAccessDenied";
  const ADMIN_EMAIL = "admin@quadras.com.br";

  const state = {
    user: null,
    courts: [],
    editingId: null,
    pendingDeleteId: null
  };

  const fields = {
    id: document.querySelector("#court-id"),
    name: document.querySelector("#court-name"),
    type: document.querySelector("#court-type"),
    status: document.querySelector("#court-status"),
    price: document.querySelector("#court-price"),
    description: document.querySelector("#court-description")
  };

  const errorIds = {
    name: "court-name-error",
    type: "court-type-error",
    status: "court-status-error",
    price: "court-price-error",
    description: "court-description-error"
  };

  const elements = {
    success: document.querySelector("#admin-courts-success"),
    error: document.querySelector("#admin-courts-error"),
    count: document.querySelector("#admin-courts-list-count"),
    table: document.querySelector("#admin-courts-manager-table"),
    newButton: document.querySelector("#new-court-button"),
    logout: document.querySelector("#admin-courts-logout"),
    formModal: document.querySelector("#court-form-modal"),
    formTitle: document.querySelector("#court-form-title"),
    form: document.querySelector("#court-form"),
    submit: document.querySelector(".admin-court-submit"),
    submitText: document.querySelector(".admin-court-submit .button-text"),
    viewModal: document.querySelector("#court-view-modal"),
    viewContent: document.querySelector("#court-view-content"),
    deleteModal: document.querySelector("#court-delete-modal"),
    confirmDelete: document.querySelector("#confirm-delete-court")
  };

  function getLoggedUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY));
    } catch (error) {
      return null;
    }
  }

  function requireAdmin() {
    const user = getLoggedUser();

    if (!user?.id) {
      sessionStorage.setItem(REDIRECT_KEY, "administracao-quadras.html");
      window.location.href = "login.html";
      return null;
    }

    if (String(user.email || "").toLowerCase() !== ADMIN_EMAIL) {
      sessionStorage.setItem(ACCESS_DENIED_KEY, "Area administrativa disponivel apenas para o administrador.");
      window.location.replace("dashboard.html");
      return null;
    }

    return user;
  }

  function showMessage(type, text) {
    const target = type === "success" ? elements.success : elements.error;
    const other = type === "success" ? elements.error : elements.success;

    if (other) {
      other.hidden = true;
      other.textContent = "";
    }

    if (target) {
      target.hidden = false;
      target.textContent = text;
    }
  }

  function hideMessages() {
    [elements.success, elements.error].forEach((element) => {
      if (element) {
        element.hidden = true;
        element.textContent = "";
      }
    });
  }

  function setFieldError(fieldName, message) {
    const error = document.querySelector(`#${errorIds[fieldName]}`);
    const field = fields[fieldName];

    if (error) {
      error.textContent = message || "";
    }

    if (field) {
      field.classList.toggle("has-error", Boolean(message));
    }
  }

  function clearFieldErrors() {
    Object.keys(errorIds).forEach((fieldName) => setFieldError(fieldName, ""));
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

  function findCourt(id) {
    return state.courts.find((court) => String(court.id) === String(id));
  }

  function setLoading(isLoading) {
    elements.submit.disabled = isLoading;
    elements.submit.classList.toggle("is-loading", isLoading);
    elements.submitText.textContent = isLoading
      ? "Salvando..."
      : (state.editingId ? "Atualizar quadra" : "Cadastrar quadra");
  }

  function setDeleteLoading(isLoading) {
    elements.confirmDelete.disabled = isLoading;
    elements.confirmDelete.textContent = isLoading ? "Excluindo..." : "Excluir quadra";
  }

  function createTextCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
  }

  function createBadge(status) {
    const badge = document.createElement("span");
    badge.className = badgeClass(status);
    badge.textContent = label(status);
    return badge;
  }

  function createActionButton(action, text, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `admin-action-button ${className}`;
    button.dataset.action = action;
    button.textContent = text;
    return button;
  }

  function clearTable(text) {
    elements.table.innerHTML = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = text;
    row.appendChild(cell);
    elements.table.appendChild(row);
  }

  function renderTable() {
    elements.count.textContent = `${state.courts.length} registro${state.courts.length === 1 ? "" : "s"}`;
    elements.table.innerHTML = "";

    if (state.courts.length === 0) {
      clearTable("Nenhuma quadra cadastrada.");
      return;
    }

    state.courts.forEach((court) => {
      const row = document.createElement("tr");
      const statusCell = document.createElement("td");
      const actionsCell = document.createElement("td");
      const actions = document.createElement("div");

      row.dataset.courtId = court.id;
      statusCell.appendChild(createBadge(court.status));

      actions.className = "admin-table-actions";
      actions.appendChild(createActionButton("view", "Ver", "admin-action-button--view"));
      actions.appendChild(createActionButton("edit", "Editar", "admin-action-button--edit"));
      actions.appendChild(createActionButton("delete", "Excluir", "admin-action-button--delete"));
      actionsCell.appendChild(actions);

      row.appendChild(createTextCell(`#${court.id}`));
      row.appendChild(createTextCell(court.nome || "--"));
      row.appendChild(createTextCell(label(court.tipo)));
      row.appendChild(createTextCell(formatCurrency(court.precoHora)));
      row.appendChild(statusCell);
      row.appendChild(actionsCell);
      elements.table.appendChild(row);
    });
  }

  async function loadCourts(options = {}) {
    try {
      if (!options.keepMessages) {
        hideMessages();
      }
      const response = await window.QuadraFacilApi.request("/quadras");
      state.courts = Array.isArray(response?.data) ? response.data : [];
      renderTable();
      maybeOpenFromUrl();
    } catch (error) {
      state.courts = [];
      renderTable();
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar as quadras. Verifique se o backend est\u00e1 em execu\u00e7\u00e3o.");
    }
  }

  function openCreateForm() {
    hideMessages();
    clearFieldErrors();
    state.editingId = null;
    elements.form.reset();
    fields.id.value = "";
    fields.status.value = "DISPONIVEL";
    elements.formTitle.textContent = "Nova quadra";
    elements.submitText.textContent = "Cadastrar quadra";
    elements.formModal.showModal();
  }

  function openEditForm(court) {
    hideMessages();
    clearFieldErrors();
    state.editingId = court.id;
    fields.id.value = court.id;
    fields.name.value = court.nome || "";
    fields.type.value = court.tipo || "";
    fields.status.value = court.status || "DISPONIVEL";
    fields.price.value = court.precoHora ?? "";
    fields.description.value = court.descricao || "";
    elements.formTitle.textContent = `Editar quadra #${court.id}`;
    elements.submitText.textContent = "Atualizar quadra";
    elements.formModal.showModal();
  }

  function detailRow(term, value) {
    const wrapper = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value;
    wrapper.appendChild(dt);
    wrapper.appendChild(dd);
    return wrapper;
  }

  function openViewModal(court) {
    elements.viewContent.innerHTML = "";
    elements.viewContent.appendChild(detailRow("ID", `#${court.id}`));
    elements.viewContent.appendChild(detailRow("Nome", court.nome || "--"));
    elements.viewContent.appendChild(detailRow("Tipo", label(court.tipo)));
    elements.viewContent.appendChild(detailRow("Pre\u00e7o por hora", formatCurrency(court.precoHora)));
    elements.viewContent.appendChild(detailRow("Status", label(court.status)));
    elements.viewContent.appendChild(detailRow("Descri\u00e7\u00e3o", court.descricao || "Sem descri\u00e7\u00e3o cadastrada."));
    elements.viewModal.showModal();
  }

  function openDeleteModal(court) {
    state.pendingDeleteId = court.id;
    elements.deleteModal.showModal();
  }

  function closeDeleteModal() {
    state.pendingDeleteId = null;
    elements.deleteModal.close();
  }

  function valuesFromForm() {
    return {
      nome: fields.name.value.trim(),
      tipo: fields.type.value,
      descricao: fields.description.value.trim(),
      precoHora: Number(fields.price.value),
      status: fields.status.value
    };
  }

  function validateCourt(values) {
    let valid = true;
    clearFieldErrors();

    if (!values.nome) {
      setFieldError("name", "Informe o nome da quadra.");
      valid = false;
    }

    if (!values.tipo) {
      setFieldError("type", "Selecione o tipo da quadra.");
      valid = false;
    }

    if (!values.status) {
      setFieldError("status", "Selecione o status da quadra.");
      valid = false;
    }

    if (!fields.price.value) {
      setFieldError("price", "Informe o pre\u00e7o por hora.");
      valid = false;
    } else if (!Number.isFinite(values.precoHora) || values.precoHora <= 0) {
      setFieldError("price", "Informe um valor maior que zero.");
      valid = false;
    }

    return valid;
  }

  async function submitCourt() {
    hideMessages();
    const values = valuesFromForm();

    if (!validateCourt(values)) {
      return;
    }

    setLoading(true);

    const payload = {
      nome: values.nome,
      tipo: values.tipo,
      descricao: values.descricao || null,
      precoHora: values.precoHora,
      status: values.status
    };

    try {
      const endpoint = state.editingId ? `/quadras/${encodeURIComponent(state.editingId)}` : "/quadras";
      const method = state.editingId ? "PUT" : "POST";

      await window.QuadraFacilApi.request(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      elements.formModal.close();
      await loadCourts({ keepMessages: true });
      showMessage("success", state.editingId ? "Quadra atualizada com sucesso." : "Quadra cadastrada com sucesso.");
    } catch (error) {
      showMessage("error", "N\u00e3o foi poss\u00edvel salvar a quadra. Verifique os dados informados.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCourt() {
    if (!state.pendingDeleteId) {
      return;
    }

    hideMessages();
    setDeleteLoading(true);

    try {
      await window.QuadraFacilApi.request(`/quadras/${encodeURIComponent(state.pendingDeleteId)}`, {
        method: "DELETE"
      });

      closeDeleteModal();
      await loadCourts({ keepMessages: true });
      showMessage("success", "Quadra exclu\u00edda com sucesso.");
    } catch (error) {
      const message = String(error.body?.message || error.message || "").toLowerCase();
      closeDeleteModal();

      if (error.status === 409 || message.includes("agendamento") || message.includes("vinculad")) {
        showMessage("error", "N\u00e3o \u00e9 poss\u00edvel excluir quadra com agendamentos vinculados.");
      } else {
        showMessage("error", "N\u00e3o foi poss\u00edvel excluir a quadra.");
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  function maybeOpenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("acao") || params.get("modal");

    if (action === "nova") {
      openCreateForm();
      window.history.replaceState({}, document.title, "administracao-quadras.html");
    }
  }

  elements.newButton?.addEventListener("click", openCreateForm);

  elements.table?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    const row = event.target.closest("tr[data-court-id]");

    if (!button || !row) {
      return;
    }

    const court = findCourt(row.dataset.courtId);
    if (!court) {
      return;
    }

    if (button.dataset.action === "view") {
      openViewModal(court);
    }

    if (button.dataset.action === "edit") {
      openEditForm(court);
    }

    if (button.dataset.action === "delete") {
      openDeleteModal(court);
    }
  });

  elements.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitCourt();
  });

  document.querySelectorAll("[data-court-form-close]").forEach((button) => {
    button.addEventListener("click", () => elements.formModal.close());
  });

  document.querySelectorAll("[data-court-view-close]").forEach((button) => {
    button.addEventListener("click", () => elements.viewModal.close());
  });

  document.querySelectorAll("[data-court-delete-close]").forEach((button) => {
    button.addEventListener("click", closeDeleteModal);
  });

  elements.confirmDelete?.addEventListener("click", deleteCourt);

  elements.logout?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
  });

  state.user = requireAdmin();

  if (state.user) {
    loadCourts();
  }
})();
