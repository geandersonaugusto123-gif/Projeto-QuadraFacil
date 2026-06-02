(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";

  const state = {
    user: null,
    profile: null
  };

  const fields = {
    nome: document.querySelector("#profile-nome"),
    email: document.querySelector("#profile-email"),
    telefone: document.querySelector("#profile-telefone"),
    senha: document.querySelector("#profile-senha"),
    confirmarSenha: document.querySelector("#profile-confirmar-senha")
  };

  const errorIds = {
    nome: "profile-nome-error",
    email: "profile-email-error",
    telefone: "profile-telefone-error",
    senha: "profile-senha-error",
    confirmarSenha: "profile-confirmar-senha-error"
  };

  const elements = {
    authAction: document.querySelector("#profile-auth-action"),
    success: document.querySelector("#profile-success"),
    error: document.querySelector("#profile-error"),
    avatar: document.querySelector("#profile-avatar"),
    cardName: document.querySelector("#profile-card-name"),
    cardEmail: document.querySelector("#profile-card-email"),
    viewName: document.querySelector("#profile-view-name"),
    viewEmail: document.querySelector("#profile-view-email"),
    viewPhone: document.querySelector("#profile-view-phone"),
    viewCreated: document.querySelector("#profile-view-created"),
    form: document.querySelector("#profile-form"),
    submit: document.querySelector(".profile-submit"),
    submitText: document.querySelector(".profile-submit .button-text"),
    deleteButton: document.querySelector("#delete-profile-button"),
    deleteModal: document.querySelector("#delete-profile-modal"),
    confirmDelete: document.querySelector("#confirm-delete-profile")
  };

  function getLoggedUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY));
    } catch (error) {
      return null;
    }
  }

  function requireUser() {
    const user = getLoggedUser();

    if (!user?.id) {
      sessionStorage.setItem(REDIRECT_KEY, "perfil.html");
      window.location.href = "login.html";
      return null;
    }

    return user;
  }

  function setFieldError(fieldName, message) {
    const errorElement = document.querySelector(`#${errorIds[fieldName]}`);
    const input = fields[fieldName];

    if (errorElement) {
      errorElement.textContent = message || "";
    }

    if (input) {
      input.classList.toggle("has-error", Boolean(message));
    }
  }

  function clearFieldErrors() {
    Object.keys(fields).forEach((fieldName) => setFieldError(fieldName, ""));
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

  function formatCreatedDate(value) {
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

  function initials(name) {
    const parts = String(name || "Quadra Facil").trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  }

  function setLoading(isLoading) {
    if (elements.submit) {
      elements.submit.disabled = isLoading;
      elements.submit.classList.toggle("is-loading", isLoading);
    }

    if (elements.submitText) {
      elements.submitText.textContent = isLoading ? "Salvando..." : "Salvar altera\u00e7\u00f5es";
    }
  }

  function setDeleteLoading(isLoading) {
    if (elements.confirmDelete) {
      elements.confirmDelete.disabled = isLoading;
      elements.confirmDelete.textContent = isLoading ? "Excluindo..." : "Excluir conta";
    }
  }

  function saveLocalUser(user) {
    const previous = getLoggedUser() || {};
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({
      ...previous,
      ...user
    }));
    state.user = getLoggedUser();
  }

  function renderProfile(user) {
    state.profile = user;

    const nome = user?.nome || "Usu\u00e1rio QuadraF\u00e1cil";
    const email = user?.email || "--";
    const telefone = user?.telefone || "";

    elements.avatar.textContent = initials(nome);
    elements.cardName.textContent = nome;
    elements.cardEmail.textContent = email;
    elements.viewName.textContent = nome;
    elements.viewEmail.textContent = email;
    elements.viewPhone.textContent = telefone || "N\u00e3o informado";
    elements.viewCreated.textContent = formatCreatedDate(user?.dataCriacao);

    fields.nome.value = nome;
    fields.email.value = email === "--" ? "" : email;
    fields.telefone.value = formatPhone(telefone);
  }

  async function loadProfile() {
    try {
      hideMessages();
      const response = await window.QuadraFacilApi.request(`/usuarios/${encodeURIComponent(state.user.id)}`);
      const profile = response?.data;

      if (!profile) {
        throw new Error("Perfil nao encontrado.");
      }

      saveLocalUser(profile);
      renderProfile(profile);
    } catch (error) {
      renderProfile(state.user);
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar os dados atualizados do perfil.");
    }
  }

  function validateForm(values) {
    let valid = true;
    clearFieldErrors();

    if (!values.nome) {
      setFieldError("nome", "Informe seu nome completo.");
      valid = false;
    }

    if (!values.email) {
      setFieldError("email", "Informe seu email.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setFieldError("email", "Informe um email valido.");
      valid = false;
    }

    if (values.senha && values.senha.length < 6) {
      setFieldError("senha", "A nova senha deve ter pelo menos 6 caracteres.");
      valid = false;
    }

    if (values.confirmarSenha && !values.senha) {
      setFieldError("senha", "Informe a nova senha antes de confirmar.");
      valid = false;
    }

    if (values.senha && values.confirmarSenha !== values.senha) {
      setFieldError("confirmarSenha", "As senhas informadas nao conferem.");
      valid = false;
    }

    return valid;
  }

  async function submitProfile() {
    hideMessages();

    const values = {
      nome: fields.nome.value.trim(),
      email: fields.email.value.trim().toLowerCase(),
      telefone: fields.telefone.value.trim(),
      senha: fields.senha.value,
      confirmarSenha: fields.confirmarSenha.value
    };

    if (!validateForm(values)) {
      return;
    }

    setLoading(true);

    const body = {
      nome: values.nome,
      email: values.email,
      telefone: values.telefone || null
    };

    if (values.senha) {
      body.senha = values.senha;
    }

    try {
      const response = await window.QuadraFacilApi.request(`/usuarios/${encodeURIComponent(state.user.id)}`, {
        method: "PUT",
        body: JSON.stringify(body)
      });

      const profile = response?.data || body;
      saveLocalUser(profile);
      renderProfile(profile);
      fields.senha.value = "";
      fields.confirmarSenha.value = "";
      showMessage("success", "Perfil atualizado com sucesso.");
    } catch (error) {
      const backendMessage = String(error.body?.message || error.message || "").toLowerCase();
      const isEmailConflict = error.status === 409 || backendMessage.includes("email");

      if (isEmailConflict) {
        setFieldError("email", "Email ja esta em uso.");
        showMessage("error", "Email j\u00e1 est\u00e1 em uso.");
      } else {
        showMessage("error", "N\u00e3o foi poss\u00edvel atualizar o perfil.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function hasLinkedBookings() {
    try {
      const response = await window.QuadraFacilApi.request(`/agendamentos?usuarioId=${encodeURIComponent(state.user.id)}`);
      return Array.isArray(response?.data) && response.data.length > 0;
    } catch (error) {
      return false;
    }
  }

  async function deleteProfile() {
    hideMessages();
    setDeleteLoading(true);

    try {
      if (await hasLinkedBookings()) {
        elements.deleteModal.close();
        showMessage("error", "Essa conta possui agendamentos vinculados e n\u00e3o pode ser exclu\u00edda.");
        return;
      }

      await window.QuadraFacilApi.request(`/usuarios/${encodeURIComponent(state.user.id)}`, {
        method: "DELETE"
      });

      elements.deleteModal.close();
      localStorage.removeItem(AUTH_USER_KEY);
      showMessage("success", "Conta exclu\u00edda com sucesso.");

      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 850);
    } catch (error) {
      const backendMessage = String(error.body?.message || error.message || "").toLowerCase();

      if (elements.deleteModal.open) {
        elements.deleteModal.close();
      }

      if (error.status === 409 || backendMessage.includes("agendamento") || backendMessage.includes("vinculado")) {
        showMessage("error", "Essa conta possui agendamentos vinculados e n\u00e3o pode ser exclu\u00edda.");
      } else {
        showMessage("error", "N\u00e3o foi poss\u00edvel excluir sua conta.");
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  fields.telefone?.addEventListener("input", () => {
    fields.telefone.value = formatPhone(fields.telefone.value);
  });

  elements.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitProfile();
  });

  elements.deleteButton?.addEventListener("click", () => {
    elements.deleteModal.showModal();
  });

  document.querySelectorAll("[data-delete-profile-close]").forEach((button) => {
    button.addEventListener("click", () => elements.deleteModal.close());
  });

  elements.confirmDelete?.addEventListener("click", deleteProfile);

  elements.authAction?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
  });

  state.user = requireUser();

  if (state.user) {
    renderProfile(state.user);
    loadProfile();
  }
})();
