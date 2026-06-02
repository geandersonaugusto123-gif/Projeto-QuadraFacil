(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";
  const ACCESS_DENIED_KEY = "quadraFacil.adminAccessDenied";
  const ADMIN_EMAIL = "admin@quadras.com.br";

  const state = {
    user: null,
    users: [],
    editingId: null,
    pendingDeleteId: null,
    filters: {
      search: "",
      createdAt: ""
    }
  };

  const fields = {
    id: document.querySelector("#user-id"),
    name: document.querySelector("#user-name"),
    email: document.querySelector("#user-email"),
    phone: document.querySelector("#user-phone"),
    password: document.querySelector("#user-password")
  };

  const errorIds = {
    name: "user-name-error",
    email: "user-email-error",
    phone: "user-phone-error",
    password: "user-password-error"
  };

  const elements = {
    success: document.querySelector("#admin-users-success"),
    error: document.querySelector("#admin-users-error"),
    count: document.querySelector("#admin-users-list-count"),
    table: document.querySelector("#admin-users-manager-table"),
    search: document.querySelector("#user-search"),
    createdFilter: document.querySelector("#user-created-filter"),
    clearFilters: document.querySelector("#clear-user-filters"),
    newButton: document.querySelector("#new-user-button"),
    logout: document.querySelector("#admin-users-logout"),
    formModal: document.querySelector("#user-form-modal"),
    formTitle: document.querySelector("#user-form-title"),
    form: document.querySelector("#user-form"),
    passwordLabel: document.querySelector("#user-password-label"),
    submit: document.querySelector(".admin-user-submit"),
    submitText: document.querySelector(".admin-user-submit .button-text"),
    viewModal: document.querySelector("#user-view-modal"),
    viewContent: document.querySelector("#user-view-content"),
    deleteModal: document.querySelector("#user-delete-modal"),
    confirmDelete: document.querySelector("#confirm-delete-user")
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
      sessionStorage.setItem(REDIRECT_KEY, "administracao-usuarios.html");
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

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatPhone(value) {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function creationDateKey(value) {
    return String(value || "").slice(0, 10);
  }

  function formatDateTime(value) {
    if (!value) {
      return "--";
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return String(value).replace("T", " ");
    }

    return parsed.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function findUser(id) {
    return state.users.find((user) => String(user.id) === String(id));
  }

  function filteredUsers() {
    const search = normalizeText(state.filters.search);

    return state.users
      .filter((user) => {
        if (!search) {
          return true;
        }

        return normalizeText(`${user.nome || ""} ${user.email || ""}`).includes(search);
      })
      .filter((user) => !state.filters.createdAt || creationDateKey(user.dataCriacao) === state.filters.createdAt)
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
  }

  function setLoading(isLoading) {
    elements.submit.disabled = isLoading;
    elements.submit.classList.toggle("is-loading", isLoading);
    elements.submitText.textContent = isLoading
      ? "Salvando..."
      : (state.editingId ? "Atualizar usu\u00e1rio" : "Cadastrar usu\u00e1rio");
  }

  function setDeleteLoading(isLoading) {
    elements.confirmDelete.disabled = isLoading;
    elements.confirmDelete.textContent = isLoading ? "Excluindo..." : "Excluir usu\u00e1rio";
  }

  function createTextCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
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
    const list = filteredUsers();
    elements.count.textContent = `${list.length} de ${state.users.length} registro${state.users.length === 1 ? "" : "s"}`;
    elements.table.innerHTML = "";

    if (list.length === 0) {
      clearTable("Nenhum usu\u00e1rio encontrado.");
      return;
    }

    list.forEach((user) => {
      const row = document.createElement("tr");
      const actionsCell = document.createElement("td");
      const actions = document.createElement("div");

      row.dataset.userId = user.id;
      actions.className = "admin-table-actions";
      actions.appendChild(createActionButton("view", "Ver", "admin-action-button--view"));
      actions.appendChild(createActionButton("edit", "Editar", "admin-action-button--edit"));
      actions.appendChild(createActionButton("delete", "Excluir", "admin-action-button--delete"));
      actionsCell.appendChild(actions);

      row.appendChild(createTextCell(`#${user.id}`));
      row.appendChild(createTextCell(user.nome || "--"));
      row.appendChild(createTextCell(user.email || "--"));
      row.appendChild(createTextCell(user.telefone || "N\u00e3o informado"));
      row.appendChild(createTextCell(formatDateTime(user.dataCriacao)));
      row.appendChild(actionsCell);
      elements.table.appendChild(row);
    });
  }

  async function loadUsers(options = {}) {
    try {
      if (!options.keepMessages) {
        hideMessages();
      }

      const response = await window.QuadraFacilApi.request("/usuarios");
      state.users = Array.isArray(response?.data) ? response.data : [];
      renderTable();
      maybeOpenFromUrl();
    } catch (error) {
      state.users = [];
      renderTable();
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar os usu\u00e1rios. Verifique se o backend est\u00e1 em execu\u00e7\u00e3o.");
    }
  }

  async function fetchUser(id) {
    const response = await window.QuadraFacilApi.request(`/usuarios/${encodeURIComponent(id)}`);
    return response?.data || findUser(id);
  }

  function openCreateForm() {
    hideMessages();
    clearFieldErrors();
    state.editingId = null;
    elements.form.reset();
    fields.id.value = "";
    elements.formTitle.textContent = "Novo usu\u00e1rio";
    elements.passwordLabel.textContent = "Senha";
    fields.password.placeholder = "M\u00ednimo de 6 caracteres";
    elements.submitText.textContent = "Cadastrar usu\u00e1rio";
    elements.formModal.showModal();
  }

  async function openEditForm(user) {
    hideMessages();
    clearFieldErrors();

    try {
      const freshUser = await fetchUser(user.id);
      state.editingId = freshUser.id;
      fields.id.value = freshUser.id;
      fields.name.value = freshUser.nome || "";
      fields.email.value = freshUser.email || "";
      fields.phone.value = formatPhone(freshUser.telefone || "");
      fields.password.value = "";
      elements.formTitle.textContent = `Editar usu\u00e1rio #${freshUser.id}`;
      elements.passwordLabel.textContent = "Senha nova, opcional";
      fields.password.placeholder = "Preencha apenas para alterar";
      elements.submitText.textContent = "Atualizar usu\u00e1rio";
      elements.formModal.showModal();
    } catch (error) {
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar este usu\u00e1rio para edi\u00e7\u00e3o.");
    }
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

  async function openViewModal(user) {
    try {
      const freshUser = await fetchUser(user.id);
      elements.viewContent.innerHTML = "";
      elements.viewContent.appendChild(detailRow("ID", `#${freshUser.id}`));
      elements.viewContent.appendChild(detailRow("Nome", freshUser.nome || "--"));
      elements.viewContent.appendChild(detailRow("Email", freshUser.email || "--"));
      elements.viewContent.appendChild(detailRow("Telefone", freshUser.telefone || "N\u00e3o informado"));
      elements.viewContent.appendChild(detailRow("Data de cria\u00e7\u00e3o", formatDateTime(freshUser.dataCriacao)));
      elements.viewModal.showModal();
    } catch (error) {
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar os detalhes deste usu\u00e1rio.");
    }
  }

  function openDeleteModal(user) {
    state.pendingDeleteId = user.id;
    elements.deleteModal.showModal();
  }

  function closeDeleteModal() {
    state.pendingDeleteId = null;
    elements.deleteModal.close();
  }

  function valuesFromForm() {
    return {
      nome: fields.name.value.trim(),
      email: fields.email.value.trim().toLowerCase(),
      telefone: fields.phone.value.trim(),
      senha: fields.password.value
    };
  }

  function validateUser(values) {
    let valid = true;
    clearFieldErrors();

    if (!values.nome) {
      setFieldError("name", "Informe o nome do usu\u00e1rio.");
      valid = false;
    }

    if (!values.email) {
      setFieldError("email", "Informe o email.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setFieldError("email", "Informe um email v\u00e1lido.");
      valid = false;
    }

    if (!state.editingId && !values.senha) {
      setFieldError("password", "Informe a senha do novo usu\u00e1rio.");
      valid = false;
    } else if (values.senha && values.senha.length < 6) {
      setFieldError("password", "A senha deve ter pelo menos 6 caracteres.");
      valid = false;
    }

    return valid;
  }

  function saveLocalUserIfNeeded(user) {
    const logged = getLoggedUser();

    if (logged?.id && String(logged.id) === String(user.id)) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify({
        ...logged,
        ...user
      }));
    }
  }

  async function submitUser() {
    hideMessages();
    const values = valuesFromForm();

    if (!validateUser(values)) {
      return;
    }

    setLoading(true);

    const payload = {
      nome: values.nome,
      email: values.email,
      telefone: values.telefone || null
    };

    if (values.senha) {
      payload.senha = values.senha;
    }

    try {
      const endpoint = state.editingId ? `/usuarios/${encodeURIComponent(state.editingId)}` : "/usuarios";
      const method = state.editingId ? "PUT" : "POST";
      const response = await window.QuadraFacilApi.request(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      if (response?.data) {
        saveLocalUserIfNeeded(response.data);
      }

      elements.formModal.close();
      await loadUsers({ keepMessages: true });
      showMessage("success", state.editingId ? "Usu\u00e1rio atualizado com sucesso." : "Usu\u00e1rio cadastrado com sucesso.");
    } catch (error) {
      const message = String(error.body?.message || error.message || "").toLowerCase();

      if (error.status === 409 || message.includes("email")) {
        setFieldError("email", "Email j\u00e1 est\u00e1 em uso.");
        showMessage("error", "Email j\u00e1 est\u00e1 em uso.");
      } else {
        showMessage("error", "N\u00e3o foi poss\u00edvel salvar o usu\u00e1rio. Verifique os dados informados.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser() {
    if (!state.pendingDeleteId) {
      return;
    }

    hideMessages();
    setDeleteLoading(true);

    try {
      await window.QuadraFacilApi.request(`/usuarios/${encodeURIComponent(state.pendingDeleteId)}`, {
        method: "DELETE"
      });

      if (String(state.pendingDeleteId) === String(state.user.id)) {
        localStorage.removeItem(AUTH_USER_KEY);
      }

      closeDeleteModal();
      await loadUsers({ keepMessages: true });
      showMessage("success", "Usu\u00e1rio exclu\u00eddo com sucesso.");
    } catch (error) {
      const message = String(error.body?.message || error.message || "").toLowerCase();
      closeDeleteModal();

      if (error.status === 409 || message.includes("agendamento") || message.includes("vinculad")) {
        showMessage("error", "N\u00e3o \u00e9 poss\u00edvel excluir usu\u00e1rio com agendamentos vinculados.");
      } else {
        showMessage("error", "N\u00e3o foi poss\u00edvel excluir o usu\u00e1rio.");
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  function maybeOpenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("acao") || params.get("modal");

    if (action === "novo") {
      openCreateForm();
      window.history.replaceState({}, document.title, "administracao-usuarios.html");
    }
  }

  fields.phone?.addEventListener("input", () => {
    fields.phone.value = formatPhone(fields.phone.value);
  });

  elements.search?.addEventListener("input", () => {
    state.filters.search = elements.search.value;
    renderTable();
  });

  elements.createdFilter?.addEventListener("change", () => {
    state.filters.createdAt = elements.createdFilter.value;
    renderTable();
  });

  elements.clearFilters?.addEventListener("click", () => {
    state.filters.search = "";
    state.filters.createdAt = "";
    elements.search.value = "";
    elements.createdFilter.value = "";
    renderTable();
  });

  elements.newButton?.addEventListener("click", openCreateForm);

  elements.table?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    const row = event.target.closest("tr[data-user-id]");

    if (!button || !row) {
      return;
    }

    const user = findUser(row.dataset.userId);
    if (!user) {
      return;
    }

    if (button.dataset.action === "view") {
      openViewModal(user);
    }

    if (button.dataset.action === "edit") {
      openEditForm(user);
    }

    if (button.dataset.action === "delete") {
      openDeleteModal(user);
    }
  });

  elements.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitUser();
  });

  document.querySelectorAll("[data-user-form-close]").forEach((button) => {
    button.addEventListener("click", () => elements.formModal.close());
  });

  document.querySelectorAll("[data-user-view-close]").forEach((button) => {
    button.addEventListener("click", () => elements.viewModal.close());
  });

  document.querySelectorAll("[data-user-delete-close]").forEach((button) => {
    button.addEventListener("click", closeDeleteModal);
  });

  elements.confirmDelete?.addEventListener("click", deleteUser);

  elements.logout?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
  });

  state.user = requireAdmin();

  if (state.user) {
    loadUsers();
  }
})();
