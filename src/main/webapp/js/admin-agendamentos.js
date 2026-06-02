(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";
  const ACCESS_DENIED_KEY = "quadraFacil.adminAccessDenied";
  const ADMIN_EMAIL = "admin@quadras.com.br";
  const STATUSES = ["PENDENTE", "CONFIRMADO", "CANCELADO", "FINALIZADO"];

  const state = {
    user: null,
    users: [],
    courts: [],
    bookings: [],
    userMap: new Map(),
    courtMap: new Map(),
    pendingStatusId: null,
    pendingDeleteId: null,
    filters: {
      usuarioId: "",
      quadraId: "",
      data: "",
      status: ""
    }
  };

  const fields = {
    user: document.querySelector("#booking-edit-user"),
    court: document.querySelector("#booking-edit-court"),
    date: document.querySelector("#booking-edit-date"),
    status: document.querySelector("#booking-edit-status"),
    start: document.querySelector("#booking-edit-start"),
    end: document.querySelector("#booking-edit-end"),
    notes: document.querySelector("#booking-edit-notes")
  };

  const errorIds = {
    user: "booking-edit-user-error",
    court: "booking-edit-court-error",
    date: "booking-edit-date-error",
    status: "booking-edit-status-error",
    start: "booking-edit-start-error",
    end: "booking-edit-end-error"
  };

  const elements = {
    success: document.querySelector("#admin-bookings-success"),
    error: document.querySelector("#admin-bookings-error"),
    count: document.querySelector("#admin-bookings-list-count"),
    table: document.querySelector("#admin-bookings-manager-table"),
    filterForm: document.querySelector("#admin-bookings-filters"),
    userFilter: document.querySelector("#booking-user-filter"),
    courtFilter: document.querySelector("#booking-court-filter"),
    dateFilter: document.querySelector("#booking-admin-date-filter"),
    statusFilter: document.querySelector("#booking-admin-status-filter"),
    clearFilters: document.querySelector("#clear-admin-booking-filters"),
    logout: document.querySelector("#admin-bookings-logout"),
    detailsModal: document.querySelector("#admin-booking-details-modal"),
    detailsContent: document.querySelector("#admin-booking-details-content"),
    statusModal: document.querySelector("#booking-status-modal"),
    statusForm: document.querySelector("#booking-status-form"),
    statusSelect: document.querySelector("#booking-status-select"),
    confirmStatus: document.querySelector("#confirm-booking-status"),
    editModal: document.querySelector("#booking-edit-modal"),
    editTitle: document.querySelector("#booking-edit-title"),
    editForm: document.querySelector("#booking-edit-form"),
    editId: document.querySelector("#booking-edit-id"),
    saveEdit: document.querySelector("#save-booking-edit"),
    deleteModal: document.querySelector("#booking-delete-modal"),
    confirmDelete: document.querySelector("#confirm-booking-delete")
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
      sessionStorage.setItem(REDIRECT_KEY, "administracao-agendamentos.html");
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

  function disableManager() {
    elements.filterForm?.querySelectorAll("input, select, button").forEach((control) => {
      control.disabled = true;
    });
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
    const statusError = document.querySelector("#booking-status-select-error");
    if (statusError) {
      statusError.textContent = "";
    }
    elements.statusSelect?.classList.remove("has-error");
  }

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function formatTime(value) {
    return String(value || "--").slice(0, 5);
  }

  function timeToMinutes(value) {
    const [hour, minute] = formatTime(value).split(":").map(Number);
    return hour * 60 + minute;
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
      MANUTENCAO: "MANUTEN\u00c7\u00c3O",
      PENDENTE: "PENDENTE",
      CONFIRMADO: "CONFIRMADO",
      CANCELADO: "CANCELADO",
      FINALIZADO: "FINALIZADO"
    };

    return labels[value] || value || "N/A";
  }

  function badgeClass(status) {
    return `badge badge--${String(status || "muted").toLowerCase()}`;
  }

  function bookingDateTime(booking) {
    return new Date(`${booking.dataAgendamento}T${formatTime(booking.horaInicio)}:00`);
  }

  function buildMaps() {
    state.userMap = state.users.reduce((map, user) => {
      map.set(Number(user.id), user);
      return map;
    }, new Map());

    state.courtMap = state.courts.reduce((map, court) => {
      map.set(Number(court.id), court);
      return map;
    }, new Map());
  }

  function userName(userId) {
    const user = state.userMap.get(Number(userId));
    return user?.nome || `Usu\u00e1rio #${userId}`;
  }

  function courtName(courtId) {
    const court = state.courtMap.get(Number(courtId));
    return court?.nome || `Quadra #${courtId}`;
  }

  function findBooking(id) {
    return state.bookings.find((booking) => String(booking.id) === String(id));
  }

  function createTextCell(text, className) {
    const cell = document.createElement("td");
    cell.textContent = text;
    if (className) {
      cell.className = className;
    }
    return cell;
  }

  function createBadge(status) {
    const badge = document.createElement("span");
    badge.className = badgeClass(status);
    badge.textContent = label(status);
    return badge;
  }

  function createActionButton(action, text, className, disabled) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `admin-action-button ${className}`;
    button.dataset.action = action;
    button.textContent = text;
    button.disabled = Boolean(disabled);
    return button;
  }

  function clearTable(text) {
    elements.table.innerHTML = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 9;
    cell.textContent = text;
    row.appendChild(cell);
    elements.table.appendChild(row);
  }

  function filteredBookings() {
    return state.bookings
      .filter((booking) => !state.filters.status || booking.status === state.filters.status)
      .sort((a, b) => bookingDateTime(b) - bookingDateTime(a));
  }

  function renderTable() {
    const list = filteredBookings();
    elements.count.textContent = `${list.length} de ${state.bookings.length} registro${state.bookings.length === 1 ? "" : "s"}`;
    elements.table.innerHTML = "";

    if (list.length === 0) {
      clearTable("Nenhum agendamento encontrado.");
      return;
    }

    list.forEach((booking) => {
      const row = document.createElement("tr");
      const statusCell = document.createElement("td");
      const actionsCell = document.createElement("td");
      const actions = document.createElement("div");

      row.dataset.bookingId = booking.id;
      statusCell.appendChild(createBadge(booking.status));

      actions.className = "admin-table-actions admin-booking-actions";
      actions.appendChild(createActionButton("view", "Ver detalhes", "admin-action-button--view"));
      actions.appendChild(createActionButton("confirm", "Confirmar", "admin-action-button--confirm", booking.status === "CONFIRMADO"));
      actions.appendChild(createActionButton("cancel", "Cancelar", "admin-action-button--cancel", booking.status === "CANCELADO"));
      actions.appendChild(createActionButton("finish", "Finalizar", "admin-action-button--finish", booking.status === "FINALIZADO"));
      actions.appendChild(createActionButton("edit", "Editar", "admin-action-button--edit"));
      actions.appendChild(createActionButton("delete", "Excluir", "admin-action-button--delete"));
      actionsCell.appendChild(actions);

      row.appendChild(createTextCell(`#${booking.id}`));
      row.appendChild(createTextCell(userName(booking.usuarioId)));
      row.appendChild(createTextCell(courtName(booking.quadraId)));
      row.appendChild(createTextCell(formatDate(booking.dataAgendamento)));
      row.appendChild(createTextCell(formatTime(booking.horaInicio)));
      row.appendChild(createTextCell(formatTime(booking.horaFim)));
      row.appendChild(statusCell);
      row.appendChild(createTextCell(booking.observacoes || "Sem observa\u00e7\u00f5es.", "admin-booking-notes"));
      row.appendChild(actionsCell);
      elements.table.appendChild(row);
    });
  }

  function fillSelect(select, options, placeholder, selectedValue) {
    if (!select) {
      return;
    }

    select.innerHTML = "";
    if (placeholder) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = placeholder;
      select.appendChild(empty);
    }

    options.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });

    if (selectedValue !== undefined && selectedValue !== null) {
      select.value = String(selectedValue);
    }
  }

  function fillReferenceSelects() {
    const userOptions = state.users
      .slice()
      .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"))
      .map((user) => ({
        value: user.id,
        label: `${user.nome || `Usu\u00e1rio #${user.id}`} - ${user.email || "sem email"}`
      }));

    const courtOptions = state.courts
      .slice()
      .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"))
      .map((court) => ({
        value: court.id,
        label: `${court.nome || `Quadra #${court.id}`} - ${label(court.status)}`
      }));

    fillSelect(elements.userFilter, userOptions, "Todos os usu\u00e1rios", state.filters.usuarioId);
    fillSelect(elements.courtFilter, courtOptions, "Todas as quadras", state.filters.quadraId);
    fillSelect(fields.user, userOptions, "Selecione um usu\u00e1rio");
    fillSelect(fields.court, courtOptions, "Selecione uma quadra");
  }

  function readFilters() {
    state.filters.usuarioId = elements.userFilter.value;
    state.filters.quadraId = elements.courtFilter.value;
    state.filters.data = elements.dateFilter.value;
    state.filters.status = elements.statusFilter.value;
  }

  function buildBookingsEndpoint() {
    const params = new URLSearchParams();

    if (state.filters.usuarioId) {
      params.set("usuarioId", state.filters.usuarioId);
    }

    if (state.filters.quadraId) {
      params.set("quadraId", state.filters.quadraId);
    }

    if (state.filters.data) {
      params.set("data", state.filters.data);
    }

    const query = params.toString();
    return query ? `/agendamentos?${query}` : "/agendamentos";
  }

  async function loadBookings(options = {}) {
    try {
      if (!options.keepMessages) {
        hideMessages();
      }

      const response = await window.QuadraFacilApi.request(buildBookingsEndpoint());
      state.bookings = Array.isArray(response?.data) ? response.data : [];
      renderTable();
    } catch (error) {
      state.bookings = [];
      renderTable();
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar os agendamentos. Verifique se o backend est\u00e1 em execu\u00e7\u00e3o.");
    }
  }

  async function loadReferenceData() {
    try {
      hideMessages();
      const [usersResponse, courtsResponse] = await Promise.all([
        window.QuadraFacilApi.request("/usuarios"),
        window.QuadraFacilApi.request("/quadras")
      ]);

      state.users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
      state.courts = Array.isArray(courtsResponse?.data) ? courtsResponse.data : [];
      buildMaps();
      fillReferenceSelects();
      await loadBookings({ keepMessages: true });
    } catch (error) {
      state.users = [];
      state.courts = [];
      state.bookings = [];
      buildMaps();
      fillReferenceSelects();
      renderTable();
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar usu\u00e1rios, quadras ou agendamentos.");
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

  function openDetailsModal(booking) {
    elements.detailsContent.innerHTML = "";
    elements.detailsContent.appendChild(detailRow("ID", `#${booking.id}`));
    elements.detailsContent.appendChild(detailRow("Usu\u00e1rio", userName(booking.usuarioId)));
    elements.detailsContent.appendChild(detailRow("Quadra", courtName(booking.quadraId)));
    elements.detailsContent.appendChild(detailRow("Data", formatDate(booking.dataAgendamento)));
    elements.detailsContent.appendChild(detailRow("Hora in\u00edcio", formatTime(booking.horaInicio)));
    elements.detailsContent.appendChild(detailRow("Hora fim", formatTime(booking.horaFim)));
    elements.detailsContent.appendChild(detailRow("Status", label(booking.status)));
    elements.detailsContent.appendChild(detailRow("Observa\u00e7\u00f5es", booking.observacoes || "Sem observa\u00e7\u00f5es cadastradas."));
    elements.detailsModal.showModal();
  }

  function openStatusModal(booking, status) {
    hideMessages();
    clearFieldErrors();
    state.pendingStatusId = booking.id;
    elements.statusSelect.value = status || booking.status || "PENDENTE";
    elements.confirmStatus.textContent = elements.statusSelect.value === "CANCELADO" ? "Cancelar agendamento" : "Atualizar status";
    elements.statusModal.showModal();
  }

  function closeStatusModal() {
    state.pendingStatusId = null;
    elements.statusModal.close();
  }

  function setStatusLoading(isLoading) {
    elements.confirmStatus.disabled = isLoading;
    elements.confirmStatus.textContent = isLoading
      ? "Atualizando..."
      : (elements.statusSelect.value === "CANCELADO" ? "Cancelar agendamento" : "Atualizar status");
  }

  function setStatusSelectError(message) {
    const error = document.querySelector("#booking-status-select-error");
    if (error) {
      error.textContent = message || "";
    }
    elements.statusSelect.classList.toggle("has-error", Boolean(message));
  }

  function messageFromError(error, fallback) {
    const message = String(error.body?.message || error.message || "").toLowerCase();

    if (error.status === 404 || message.includes("nao encontrado") || message.includes("n\u00e3o encontrado")) {
      return "Agendamento n\u00e3o encontrado.";
    }

    if (error.status === 409
        || message.includes("conflito")
        || message.includes("horario")
        || message.includes("hor\u00e1rio")
        || message.includes("quadra")) {
      return "Hor\u00e1rio indispon\u00edvel para esta quadra.";
    }

    return fallback;
  }

  async function cancelBookingById(bookingId) {
    await window.QuadraFacilApi.request(`/agendamentos/${encodeURIComponent(bookingId)}/cancelar`, {
      method: "PUT"
    });
  }

  async function submitStatus() {
    const bookingId = state.pendingStatusId;
    const status = elements.statusSelect.value;

    if (!bookingId) {
      return;
    }

    if (!STATUSES.includes(status)) {
      setStatusSelectError("Selecione um status v\u00e1lido.");
      return;
    }

    hideMessages();
    setStatusLoading(true);

    try {
      if (status === "CANCELADO") {
        await cancelBookingById(bookingId);
        closeStatusModal();
        await loadBookings({ keepMessages: true });
        showMessage("success", "Agendamento cancelado com sucesso.");
        return;
      }

      await window.QuadraFacilApi.request(`/agendamentos/${encodeURIComponent(bookingId)}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });

      closeStatusModal();
      await loadBookings({ keepMessages: true });
      showMessage("success", "Status atualizado com sucesso.");
    } catch (error) {
      showMessage("error", messageFromError(error, "N\u00e3o foi poss\u00edvel atualizar o status do agendamento."));
    } finally {
      setStatusLoading(false);
    }
  }

  function openEditModal(booking) {
    hideMessages();
    clearFieldErrors();
    elements.editId.value = booking.id;
    elements.editTitle.textContent = `Editar agendamento #${booking.id}`;
    fields.user.value = String(booking.usuarioId || "");
    fields.court.value = String(booking.quadraId || "");
    fields.date.value = booking.dataAgendamento || "";
    fields.status.value = booking.status || "PENDENTE";
    fields.start.value = formatTime(booking.horaInicio);
    fields.end.value = formatTime(booking.horaFim);
    fields.notes.value = booking.observacoes || "";
    elements.editModal.showModal();
  }

  function validateEditForm() {
    let valid = true;
    clearFieldErrors();

    if (!fields.user.value) {
      setFieldError("user", "Selecione um usu\u00e1rio.");
      valid = false;
    }

    if (!fields.court.value) {
      setFieldError("court", "Selecione uma quadra.");
      valid = false;
    }

    if (!fields.date.value) {
      setFieldError("date", "Informe a data.");
      valid = false;
    }

    if (!fields.status.value) {
      setFieldError("status", "Selecione o status.");
      valid = false;
    }

    if (!fields.start.value) {
      setFieldError("start", "Informe a hora inicial.");
      valid = false;
    }

    if (!fields.end.value) {
      setFieldError("end", "Informe a hora final.");
      valid = false;
    }

    if (fields.start.value && fields.end.value && timeToMinutes(fields.end.value) <= timeToMinutes(fields.start.value)) {
      setFieldError("end", "Hora final deve ser maior que hora inicial.");
      valid = false;
    }

    return valid;
  }

  function setEditLoading(isLoading) {
    elements.saveEdit.disabled = isLoading;
    elements.saveEdit.textContent = isLoading ? "Salvando..." : "Salvar altera\u00e7\u00f5es";
  }

  async function submitEdit() {
    if (!validateEditForm()) {
      return;
    }

    const bookingId = elements.editId.value;
    const payload = {
      usuarioId: Number(fields.user.value),
      quadraId: Number(fields.court.value),
      dataAgendamento: fields.date.value,
      horaInicio: formatTime(fields.start.value),
      horaFim: formatTime(fields.end.value),
      status: fields.status.value,
      observacoes: fields.notes.value.trim() || null
    };

    hideMessages();
    setEditLoading(true);

    try {
      await window.QuadraFacilApi.request(`/agendamentos/${encodeURIComponent(bookingId)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      elements.editModal.close();
      await loadBookings({ keepMessages: true });
      showMessage("success", "Agendamento atualizado com sucesso.");
    } catch (error) {
      showMessage("error", messageFromError(error, "N\u00e3o foi poss\u00edvel salvar este agendamento."));
    } finally {
      setEditLoading(false);
    }
  }

  function openDeleteModal(booking) {
    hideMessages();
    state.pendingDeleteId = booking.id;
    elements.deleteModal.showModal();
  }

  function closeDeleteModal() {
    state.pendingDeleteId = null;
    elements.deleteModal.close();
  }

  function setDeleteLoading(isLoading) {
    elements.confirmDelete.disabled = isLoading;
    elements.confirmDelete.textContent = isLoading ? "Excluindo..." : "Excluir agendamento";
  }

  async function deleteBooking() {
    if (!state.pendingDeleteId) {
      return;
    }

    hideMessages();
    setDeleteLoading(true);

    try {
      await window.QuadraFacilApi.request(`/agendamentos/${encodeURIComponent(state.pendingDeleteId)}`, {
        method: "DELETE"
      });

      closeDeleteModal();
      await loadBookings({ keepMessages: true });
      showMessage("success", "Agendamento cancelado com sucesso.");
    } catch (error) {
      showMessage("error", messageFromError(error, "N\u00e3o foi poss\u00edvel excluir este agendamento."));
    } finally {
      setDeleteLoading(false);
    }
  }

  elements.filterForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    readFilters();
    loadBookings();
  });

  elements.clearFilters?.addEventListener("click", () => {
    state.filters.usuarioId = "";
    state.filters.quadraId = "";
    state.filters.data = "";
    state.filters.status = "";
    elements.userFilter.value = "";
    elements.courtFilter.value = "";
    elements.dateFilter.value = "";
    elements.statusFilter.value = "";
    loadBookings();
  });

  elements.table?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    const row = event.target.closest("tr[data-booking-id]");

    if (!button || !row || button.disabled) {
      return;
    }

    const booking = findBooking(row.dataset.bookingId);
    if (!booking) {
      showMessage("error", "Agendamento n\u00e3o encontrado.");
      return;
    }

    if (button.dataset.action === "view") {
      openDetailsModal(booking);
    }

    if (button.dataset.action === "confirm") {
      openStatusModal(booking, "CONFIRMADO");
    }

    if (button.dataset.action === "cancel") {
      openStatusModal(booking, "CANCELADO");
    }

    if (button.dataset.action === "finish") {
      openStatusModal(booking, "FINALIZADO");
    }

    if (button.dataset.action === "edit") {
      openEditModal(booking);
    }

    if (button.dataset.action === "delete") {
      openDeleteModal(booking);
    }
  });

  elements.statusSelect?.addEventListener("change", () => {
    setStatusSelectError("");
    elements.confirmStatus.textContent = elements.statusSelect.value === "CANCELADO" ? "Cancelar agendamento" : "Atualizar status";
  });

  elements.statusForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitStatus();
  });

  elements.editForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitEdit();
  });

  document.querySelectorAll("[data-booking-details-close]").forEach((button) => {
    button.addEventListener("click", () => elements.detailsModal.close());
  });

  document.querySelectorAll("[data-booking-status-close]").forEach((button) => {
    button.addEventListener("click", closeStatusModal);
  });

  document.querySelectorAll("[data-booking-edit-close]").forEach((button) => {
    button.addEventListener("click", () => elements.editModal.close());
  });

  document.querySelectorAll("[data-booking-delete-close]").forEach((button) => {
    button.addEventListener("click", closeDeleteModal);
  });

  elements.confirmDelete?.addEventListener("click", deleteBooking);

  elements.logout?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
  });

  state.user = requireAdmin();

  if (state.user) {
    loadReferenceData();
  }
})();
