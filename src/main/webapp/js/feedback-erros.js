(function () {
  const CREATOR_EMAIL = "admin@quadras.com.br";
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const DEFAULT_MESSAGES = {
    success: "Opera\u00e7\u00e3o realizada com sucesso.",
    error: "N\u00e3o foi poss\u00edvel concluir a opera\u00e7\u00e3o.",
    warning: "Confirme os dados antes de continuar.",
    info: "Informa\u00e7\u00e3o do sistema."
  };

  const fields = {
    name: document.querySelector("#feedback-name"),
    email: document.querySelector("#feedback-email"),
    type: document.querySelector("#feedback-type"),
    rating: document.querySelector("#feedback-rating"),
    message: document.querySelector("#feedback-message")
  };

  const errorIds = {
    name: "feedback-name-error",
    email: "feedback-email-error",
    type: "feedback-type-error",
    rating: "feedback-rating-error",
    message: "feedback-message-error"
  };

  const elements = {
    form: document.querySelector("#feedback-form"),
    success: document.querySelector("#feedback-success"),
    error: document.querySelector("#feedback-error"),
    submitText: document.querySelector(".feedback-submit .button-text"),
    toastRegion: document.querySelector("#feedback-toast-region"),
    confirmationModal: document.querySelector("#feedback-confirmation-modal"),
    confirmAction: document.querySelector("#feedback-confirm-action")
  };

  let pendingConfirmation = null;

  function getLoggedUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY));
    } catch (error) {
      return null;
    }
  }

  function normalizeErrors(errors) {
    if (!errors) {
      return [];
    }

    if (Array.isArray(errors)) {
      return errors.flatMap((item) => normalizeErrors(item)).filter(Boolean);
    }

    if (typeof errors === "object") {
      return Object.entries(errors).flatMap(([field, value]) => {
        const values = normalizeErrors(value);
        return values.length > 0
          ? values.map((message) => `${field}: ${message}`)
          : [`${field}: ${String(value)}`];
      });
    }

    return [String(errors)];
  }

  function feedbackFromPayload(payload, fallbackType) {
    if (typeof payload === "string") {
      const type = fallbackType || "info";
      return {
        type,
        message: payload || DEFAULT_MESSAGES[type] || DEFAULT_MESSAGES.info,
        errors: []
      };
    }

    const body = payload?.body || payload || {};
    const isError = fallbackType === "error" || body.success === false || payload instanceof Error;
    const type = isError ? "error" : (fallbackType || "success");
    const fallbackMessage = DEFAULT_MESSAGES[type] || DEFAULT_MESSAGES.info;

    return {
      type,
      message: body.message || payload?.message || fallbackMessage,
      errors: normalizeErrors(body.errors)
    };
  }

  function typeTitle(type) {
    const titles = {
      success: "Sucesso",
      error: "Erro",
      warning: "Alerta",
      info: "Informa\u00e7\u00e3o"
    };

    return titles[type] || titles.info;
  }

  function createErrorsList(errors) {
    if (!errors.length) {
      return null;
    }

    const list = document.createElement("ul");
    list.className = "feedback-message-errors";
    errors.forEach((message) => {
      const item = document.createElement("li");
      item.textContent = message;
      list.appendChild(item);
    });
    return list;
  }

  function showToast(type, payload) {
    if (!elements.toastRegion) {
      return null;
    }

    const feedback = feedbackFromPayload(payload, type);
    const toast = document.createElement("article");
    const content = document.createElement("div");
    const title = document.createElement("strong");
    const message = document.createElement("p");
    const close = document.createElement("button");

    toast.className = `feedback-toast feedback-toast--${feedback.type}`;
    toast.setAttribute("role", feedback.type === "error" ? "alert" : "status");

    title.textContent = typeTitle(feedback.type);
    message.textContent = feedback.message;

    close.type = "button";
    close.className = "feedback-toast__close";
    close.setAttribute("aria-label", "Fechar mensagem");
    close.textContent = "\u00d7";
    close.addEventListener("click", () => toast.remove());

    content.appendChild(title);
    content.appendChild(message);

    const errorsList = createErrorsList(feedback.errors);
    if (errorsList) {
      content.appendChild(errorsList);
    }

    toast.appendChild(content);
    toast.appendChild(close);
    elements.toastRegion.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("is-hiding");
      window.setTimeout(() => toast.remove(), 220);
    }, 5200);

    return toast;
  }

  function showPageMessage(type, payload) {
    const feedback = feedbackFromPayload(payload, type);
    const target = feedback.type === "error" ? elements.error : elements.success;
    const other = feedback.type === "error" ? elements.success : elements.error;

    if (other) {
      other.hidden = true;
      other.textContent = "";
    }

    if (!target) {
      return;
    }

    target.hidden = false;
    target.textContent = feedback.errors.length
      ? `${feedback.message} ${feedback.errors.join(" ")}`
      : feedback.message;
  }

  function hidePageMessages() {
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

  function valuesFromForm() {
    return {
      name: fields.name.value.trim(),
      email: fields.email.value.trim().toLowerCase(),
      type: fields.type.value,
      rating: fields.rating.value,
      message: fields.message.value.trim()
    };
  }

  function validateFeedback(values) {
    let valid = true;
    clearFieldErrors();

    if (!values.name) {
      setFieldError("name", "Informe seu nome.");
      valid = false;
    }

    if (!values.email) {
      setFieldError("email", "Informe seu email.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setFieldError("email", "Informe um email v\u00e1lido.");
      valid = false;
    }

    if (!values.type) {
      setFieldError("type", "Selecione o tipo de feedback.");
      valid = false;
    }

    if (!values.rating) {
      setFieldError("rating", "Selecione uma avalia\u00e7\u00e3o.");
      valid = false;
    }

    if (!values.message) {
      setFieldError("message", "Escreva sua mensagem.");
      valid = false;
    } else if (values.message.length < 10) {
      setFieldError("message", "Escreva pelo menos 10 caracteres.");
      valid = false;
    }

    return valid;
  }

  function fillLoggedUser() {
    const user = getLoggedUser();

    if (!user?.id) {
      return;
    }

    if (fields.name && !fields.name.value) {
      fields.name.value = user.nome || "";
    }

    if (fields.email && !fields.email.value) {
      fields.email.value = user.email || "";
    }
  }

  function closeConfirmation(result) {
    if (elements.confirmationModal?.open) {
      elements.confirmationModal.close();
    }

    if (pendingConfirmation) {
      pendingConfirmation(result);
      pendingConfirmation = null;
    }
  }

  function confirmAction() {
    elements.confirmationModal.showModal();
    return new Promise((resolve) => {
      pendingConfirmation = resolve;
    });
  }

  function buildMailto(values) {
    const subject = `Feedback QuadraFacil - ${values.type}`;
    const body = [
      "Feedback recebido pelo sistema QuadraFacil",
      "",
      `Nome: ${values.name}`,
      `Email: ${values.email}`,
      `Tipo: ${values.type}`,
      `Avaliacao: ${values.rating}/5`,
      "",
      "Mensagem:",
      values.message
    ].join("\n");

    return `mailto:${CREATOR_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function setLoading(isLoading) {
    const submit = document.querySelector(".feedback-submit");

    if (submit) {
      submit.disabled = isLoading;
    }

    if (elements.submitText) {
      elements.submitText.textContent = isLoading ? "Preparando..." : "Enviar feedback";
    }
  }

  async function submitFeedback() {
    hidePageMessages();
    const values = valuesFromForm();

    if (!validateFeedback(values)) {
      const response = {
        success: false,
        message: "N\u00e3o foi poss\u00edvel concluir a opera\u00e7\u00e3o.",
        errors: {
          formulario: "Revise os campos destacados."
        }
      };
      showPageMessage("error", response);
      showToast("error", response);
      return;
    }

    const confirmed = await confirmAction();
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      window.location.href = buildMailto(values);
      showPageMessage("success", "Feedback preparado para envio ao criador do sistema.");
      showToast("success", "Feedback preparado para envio ao criador do sistema.");
      elements.form.reset();
      fillLoggedUser();
    } catch (error) {
      showPageMessage("error", {
        success: false,
        message: "N\u00e3o foi poss\u00edvel concluir a opera\u00e7\u00e3o.",
        errors: normalizeErrors(error.message)
      });
      showToast("error", error);
    } finally {
      setLoading(false);
    }
  }

  elements.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitFeedback();
  });

  elements.form?.addEventListener("reset", () => {
    window.setTimeout(() => {
      hidePageMessages();
      clearFieldErrors();
      fillLoggedUser();
    }, 0);
  });

  elements.confirmAction?.addEventListener("click", () => {
    closeConfirmation(true);
  });

  document.querySelectorAll("[data-feedback-confirm-close], [data-feedback-confirm-cancel]").forEach((button) => {
    button.addEventListener("click", () => closeConfirmation(false));
  });

  elements.confirmationModal?.addEventListener("cancel", () => {
    closeConfirmation(false);
  });

  fillLoggedUser();

  window.QuadraFacilFeedback = {
    confirmAction,
    feedbackFromPayload,
    normalizeErrors,
    showToast
  };
})();
