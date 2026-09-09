// ============================================================
// ui.js — small shared UI helpers (toasts, confirm modal, tabs)
// ============================================================

let confirmCallback = null;

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function openConfirmModal(message, onConfirm) {
  document.getElementById("confirm-message").textContent = message;
  confirmCallback = onConfirm;
  document.getElementById("confirm-modal").classList.add("open");
}

function closeConfirmModal() {
  document.getElementById("confirm-modal").classList.remove("open");
  confirmCallback = null;
}

async function runConfirmedAction() {
  if (confirmCallback) {
    await confirmCallback();
  }
  closeConfirmModal();
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.getElementById(`tab-${tabName}`).classList.add("active");
  document.getElementById(`btn-${tabName}`).classList.add("active");
}
