(function () {
  const form = document.querySelector("#register-form");
  const fields = {
    nome: document.querySelector("#nome"),
    email: document.querySelector("#email"),
    telefone: document.querySelector("#telefone"),
    senha: document.querySelector("#senha"),
    confirmarSenha: document.querySelector("#confirmar-senha")
  };
  const errorIds = {
    nome: "nome-error",
    email: "email-error",
    telefone: "telefone-error",
    senha: "senha-error",
    confirmarSenha: "confirmar-senha-error"
  };
  const messageBox = document.querySelector("#register-message");
  const submitButton = document.querySelector(".register-submit");
  const submitText = submitButton?.querySelector(".button-text");

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
    if (!messageBox) {
      return;
    }

    messageBox.hidden = false;
    messageBox.className = `form-alert form-alert--${type}`;
    messageBox.textContent = text;
  }

  function hideMessage() {
    if (messageBox) {
      messageBox.hidden = true;
      messageBox.textContent = "";
    }
  }

  function setLoading(isLoading) {
    if (submitButton) {
      submitButton.disabled = isLoading;
      submitButton.classList.toggle("is-loading", isLoading);
    }

    if (submitText) {
      submitText.textContent = isLoading ? "Cadastrando..." : "Cadastrar";
    }
  }

  function onlyDigits(value) {
    return value.replace(/\D/g, "");
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

    if (!values.senha) {
      setFieldError("senha", "Informe uma senha.");
      valid = false;
    } else if (values.senha.length < 6) {
      setFieldError("senha", "A senha deve ter pelo menos 6 caracteres.");
      valid = false;
    }

    if (!values.confirmarSenha) {
      setFieldError("confirmarSenha", "Confirme sua senha.");
      valid = false;
    } else if (values.confirmarSenha !== values.senha) {
      setFieldError("confirmarSenha", "As senhas informadas nao conferem.");
      valid = false;
    }

    return valid;
  }

  fields.telefone?.addEventListener("input", () => {
    fields.telefone.value = formatPhone(fields.telefone.value);
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideMessage();

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

    try {
      await window.QuadraFacilApi.request("/usuarios", {
        method: "POST",
        body: JSON.stringify({
          nome: values.nome,
          email: values.email,
          telefone: values.telefone || null,
          senha: values.senha
        })
      });

      showMessage("success", "Usu\u00e1rio cadastrado com sucesso.");
      form.reset();
    } catch (error) {
      const backendMessage = String(error.body?.message || error.message || "").toLowerCase();
      const isEmailConflict = error.status === 409 || backendMessage.includes("email");

      if (isEmailConflict) {
        setFieldError("email", "Este email ja esta em uso.");
        showMessage("error", "Este email j\u00e1 est\u00e1 em uso.");
      } else {
        showMessage("error", "N\u00e3o foi poss\u00edvel cadastrar o usu\u00e1rio. Verifique o backend e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  });
})();
