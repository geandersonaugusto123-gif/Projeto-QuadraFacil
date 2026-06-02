(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";
  const ACCESS_DENIED_KEY = "quadraFacil.adminAccessDenied";
  const ADMIN_EMAIL = "admin@quadras.com.br";
  const ACTIVE_BOOKING_STATUSES = ["PENDENTE", "CONFIRMADO"];

  const state = {
    user: null,
    users: [],
    courts: [],
    bookings: [],
    userMap: new Map(),
    courtMap: new Map()
  };

  const elements = {
    adminName: document.querySelector("#admin-user-name"),
    error: document.querySelector("#admin-error"),
    success: document.querySelector("#admin-success"),
    totalUsers: document.querySelector("#admin-total-users"),
    totalCourts: document.querySelector("#admin-total-courts"),
    pendingBookings: document.querySelector("#admin-pending-bookings"),
    confirmedBookings: document.querySelector("#admin-confirmed-bookings"),
    maintenanceCourts: document.querySelector("#admin-maintenance-courts"),
    statusChart: document.querySelector("#admin-status-chart"),
    courtTypeChart: document.querySelector("#admin-court-type-chart"),
    upcomingBookings: document.querySelector("#admin-upcoming-bookings"),
    usersCount: document.querySelector("#admin-users-count"),
    courtsCount: document.querySelector("#admin-courts-count"),
    bookingsCount: document.querySelector("#admin-bookings-count"),
    usersTable: document.querySelector("#admin-users-table"),
    courtsTable: document.querySelector("#admin-courts-table"),
    bookingsTable: document.querySelector("#admin-bookings-table"),
    logout: document.querySelector("#admin-logout")
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
      sessionStorage.setItem(REDIRECT_KEY, "administracao.html");
      window.location.href = "login.html";
      return null;
    }

    elements.adminName.textContent = user.nome || user.email || "Administrador";

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

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
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

  function formatTime(value) {
    return String(value || "--").slice(0, 5);
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function todayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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

  function countBy(list, property) {
    return list.reduce((map, item) => {
      const key = item[property] || "N/A";
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});
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

  function bookingDateTime(booking) {
    return new Date(`${booking.dataAgendamento}T${formatTime(booking.horaInicio)}:00`);
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

  function clearTable(table, colSpan, text) {
    table.innerHTML = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = colSpan;
    cell.textContent = text;
    row.appendChild(cell);
    table.appendChild(row);
  }

  function renderRestrictedPlaceholders() {
    [elements.statusChart, elements.courtTypeChart, elements.upcomingBookings].forEach((container) => {
      if (!container) {
        return;
      }
      container.innerHTML = "";
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = "Acesso restrito ao administrador.";
      container.appendChild(empty);
    });

    clearTable(elements.usersTable, 5, "Acesso restrito ao administrador.");
    clearTable(elements.courtsTable, 5, "Acesso restrito ao administrador.");
    clearTable(elements.bookingsTable, 7, "Acesso restrito ao administrador.");
  }

  function renderSummary() {
    const pending = state.bookings.filter((booking) => booking.status === "PENDENTE").length;
    const confirmed = state.bookings.filter((booking) => booking.status === "CONFIRMADO").length;
    const maintenance = state.courts.filter((court) => court.status === "MANUTENCAO").length;

    elements.totalUsers.textContent = String(state.users.length);
    elements.totalCourts.textContent = String(state.courts.length);
    elements.pendingBookings.textContent = String(pending);
    elements.confirmedBookings.textContent = String(confirmed);
    elements.maintenanceCourts.textContent = String(maintenance);
  }

  function renderChart(container, rows, total) {
    container.innerHTML = "";

    if (!rows.length || total === 0) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = "Nenhum dado encontrado.";
      container.appendChild(empty);
      return;
    }

    rows.forEach((row) => {
      const percent = total > 0 ? (row.value / total) * 100 : 0;
      const wrapper = document.createElement("div");
      wrapper.className = "admin-chart-row";

      const line = document.createElement("div");
      line.className = "admin-chart-row__line";

      const labelText = document.createElement("span");
      labelText.textContent = row.label;

      const valueText = document.createElement("strong");
      valueText.textContent = String(row.value);

      const track = document.createElement("div");
      track.className = "admin-chart-track";

      const fill = document.createElement("span");
      fill.className = `admin-chart-fill admin-chart-fill--${String(row.key || "default").toLowerCase()}`;
      fill.style.width = `${Math.max(percent, row.value > 0 ? 7 : 0)}%`;

      line.appendChild(labelText);
      line.appendChild(valueText);
      track.appendChild(fill);
      wrapper.appendChild(line);
      wrapper.appendChild(track);
      container.appendChild(wrapper);
    });
  }

  function renderCharts() {
    const statusCounts = countBy(state.bookings, "status");
    const statusRows = ["PENDENTE", "CONFIRMADO", "CANCELADO", "FINALIZADO"].map((status) => ({
      key: status,
      label: label(status),
      value: statusCounts[status] || 0
    }));

    const typeCounts = countBy(state.courts, "tipo");
    const typeRows = ["FUTSAL", "SOCIETY", "BASQUETE", "VOLEI", "TENIS"].map((type) => ({
      key: type,
      label: label(type),
      value: typeCounts[type] || 0
    }));

    renderChart(elements.statusChart, statusRows, state.bookings.length);
    renderChart(elements.courtTypeChart, typeRows, state.courts.length);
  }

  function renderUpcomingBookings() {
    const today = todayString();
    const upcoming = state.bookings
      .filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status))
      .filter((booking) => booking.dataAgendamento >= today)
      .sort((a, b) => bookingDateTime(a) - bookingDateTime(b))
      .slice(0, 5);

    elements.upcomingBookings.innerHTML = "";

    if (upcoming.length === 0) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = "Nenhuma reserva futura encontrada.";
      elements.upcomingBookings.appendChild(empty);
      return;
    }

    upcoming.forEach((booking) => {
      const item = document.createElement("a");
      item.className = "admin-upcoming-item";
      item.href = `detalhes-agendamento.html?id=${encodeURIComponent(booking.id)}`;

      const info = document.createElement("div");
      const title = document.createElement("strong");
      const meta = document.createElement("span");
      title.textContent = courtName(booking.quadraId);
      meta.textContent = `${formatDate(booking.dataAgendamento)} - ${formatTime(booking.horaInicio)} at\u00e9 ${formatTime(booking.horaFim)}`;

      info.appendChild(title);
      info.appendChild(meta);
      item.appendChild(info);
      item.appendChild(createBadge(booking.status));
      elements.upcomingBookings.appendChild(item);
    });
  }

  function renderUsersTable() {
    elements.usersCount.textContent = `${state.users.length} registro${state.users.length === 1 ? "" : "s"}`;
    elements.usersTable.innerHTML = "";

    if (state.users.length === 0) {
      clearTable(elements.usersTable, 5, "Nenhum usuario cadastrado.");
      return;
    }

    state.users.forEach((user) => {
      const row = document.createElement("tr");
      row.appendChild(createTextCell(`#${user.id}`));
      row.appendChild(createTextCell(user.nome || "--"));
      row.appendChild(createTextCell(user.email || "--"));
      row.appendChild(createTextCell(user.telefone || "N\u00e3o informado"));
      row.appendChild(createTextCell(formatDateTime(user.dataCriacao)));
      elements.usersTable.appendChild(row);
    });
  }

  function renderCourtsTable() {
    elements.courtsCount.textContent = `${state.courts.length} registro${state.courts.length === 1 ? "" : "s"}`;
    elements.courtsTable.innerHTML = "";

    if (state.courts.length === 0) {
      clearTable(elements.courtsTable, 5, "Nenhuma quadra cadastrada.");
      return;
    }

    state.courts.forEach((court) => {
      const row = document.createElement("tr");
      const status = document.createElement("td");
      status.appendChild(createBadge(court.status));

      row.appendChild(createTextCell(`#${court.id}`));
      row.appendChild(createTextCell(court.nome || "--"));
      row.appendChild(createTextCell(label(court.tipo)));
      row.appendChild(createTextCell(formatCurrency(court.precoHora)));
      row.appendChild(status);
      elements.courtsTable.appendChild(row);
    });
  }

  function renderBookingsTable() {
    const sorted = [...state.bookings].sort((a, b) => bookingDateTime(b) - bookingDateTime(a));
    elements.bookingsCount.textContent = `${sorted.length} registro${sorted.length === 1 ? "" : "s"}`;
    elements.bookingsTable.innerHTML = "";

    if (sorted.length === 0) {
      clearTable(elements.bookingsTable, 7, "Nenhum agendamento cadastrado.");
      return;
    }

    sorted.slice(0, 12).forEach((booking) => {
      const row = document.createElement("tr");
      const status = document.createElement("td");
      const action = document.createElement("td");
      const link = document.createElement("a");

      status.appendChild(createBadge(booking.status));
      link.className = "admin-table-link";
      link.href = `detalhes-agendamento.html?id=${encodeURIComponent(booking.id)}`;
      link.textContent = "Ver";
      action.appendChild(link);

      row.appendChild(createTextCell(`#${booking.id}`));
      row.appendChild(createTextCell(userName(booking.usuarioId)));
      row.appendChild(createTextCell(courtName(booking.quadraId)));
      row.appendChild(createTextCell(formatDate(booking.dataAgendamento)));
      row.appendChild(createTextCell(`${formatTime(booking.horaInicio)} at\u00e9 ${formatTime(booking.horaFim)}`));
      row.appendChild(status);
      row.appendChild(action);
      elements.bookingsTable.appendChild(row);
    });
  }

  function renderAll() {
    renderSummary();
    renderCharts();
    renderUpcomingBookings();
    renderUsersTable();
    renderCourtsTable();
    renderBookingsTable();
  }

  async function loadAdminData() {
    try {
      hideMessages();
      const [usersResponse, courtsResponse, bookingsResponse] = await Promise.all([
        window.QuadraFacilApi.request("/usuarios"),
        window.QuadraFacilApi.request("/quadras"),
        window.QuadraFacilApi.request("/agendamentos")
      ]);

      state.users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
      state.courts = Array.isArray(courtsResponse?.data) ? courtsResponse.data : [];
      state.bookings = Array.isArray(bookingsResponse?.data) ? bookingsResponse.data : [];
      buildMaps();
      renderAll();
    } catch (error) {
      showMessage("error", "Nao foi possivel carregar os dados administrativos. Verifique se o backend esta em execucao.");
    }
  }

  document.querySelectorAll(".admin-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".admin-menu a").forEach((item) => item.classList.remove("is-active"));
      link.classList.add("is-active");
    });
  });

  elements.logout?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
  });

  state.user = requireAdmin();

  if (state.user) {
    loadAdminData();
  }
})();
