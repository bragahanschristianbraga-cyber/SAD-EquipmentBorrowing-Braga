// ============================================================
// equipment.js — Equipment CRUD, Search, Filter (BR-01, BR-02, BR-07, BR-08)
// ============================================================

let allEquipment = [];       // cache of the last fetched equipment rows
let editingEquipmentId = null;

// ---------- FETCH ----------
async function fetchEquipment() {
  const { data, error } = await supabaseClient
    .from("equipment")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showToast("Failed to load equipment: " + error.message, "error");
    return [];
  }
  allEquipment = data;
  return data;
}

// ---------- RENDER ----------
function renderEquipmentTable(rows) {
  const tbody = document.getElementById("equipment-table-body");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No equipment records found.</td></tr>`;
    return;
  }

  rows.forEach((eq) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(eq.asset_code)}</td>
      <td class="link-cell" onclick="showEquipmentHistory(${eq.id}, '${escapeHtml(eq.equipment_name).replace(/'/g, "\\'")}')" title="View borrowing history">${escapeHtml(eq.equipment_name)}</td>
      <td>${escapeHtml(eq.category)}</td>
      <td>${escapeHtml(eq.condition)}</td>
      <td><span class="badge ${eq.availability === "Available" ? "badge-green" : "badge-orange"}">${eq.availability}</span></td>
      <td class="actions-cell">
        <button class="btn btn-small" onclick="openEditEquipmentModal(${eq.id})">Edit</button>
        <button class="btn btn-small btn-danger" onclick="confirmDeleteEquipment(${eq.id}, '${escapeHtml(eq.equipment_name)}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Populate the equipment <select> in the borrowing form — only Available items (Section XIX note)
function populateEquipmentDropdown(rows) {
  const select = document.getElementById("txn-equipment");
  if (!select) return;
  const available = rows.filter((eq) => eq.availability === "Available");
  select.innerHTML = available.length
    ? available.map((eq) => `<option value="${eq.id}">${escapeHtml(eq.equipment_name)} (${escapeHtml(eq.asset_code)})</option>`).join("")
    : `<option value="">No available equipment</option>`;
}

// ---------- CREATE / UPDATE ----------
async function handleEquipmentFormSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("eq-name").value.trim();
  const category = document.getElementById("eq-category").value.trim();
  const assetCode = document.getElementById("eq-code").value.trim();
  const condition = document.getElementById("eq-condition").value;

  // BR-01: Equipment name cannot be empty
  if (!name) {
    showToast("Equipment name cannot be empty.", "error");
    return;
  }
  if (!assetCode) {
    showToast("Asset code is required.", "error");
    return;
  }

  // BR-02: Asset code must be unique (check client-side against cache, DB unique constraint enforces it too)
  const duplicate = allEquipment.find(
    (eq) => eq.asset_code.toLowerCase() === assetCode.toLowerCase() && eq.id !== editingEquipmentId
  );
  if (duplicate) {
    showToast("Asset code must be unique. This code already exists.", "error");
    return;
  }

  if (editingEquipmentId) {
    const { error } = await supabaseClient
      .from("equipment")
      .update({
        equipment_name: name,
        category,
        asset_code: assetCode,
        condition,
      })
      .eq("id", editingEquipmentId);

    if (error) {
      showToast("Update failed: " + error.message, "error");
      return;
    }
    showToast("Equipment updated successfully.", "success");
  } else {
    const { error } = await supabaseClient.from("equipment").insert({
      equipment_name: name,
      category,
      asset_code: assetCode,
      condition,
      availability: "Available",
    });

    if (error) {
      showToast("Failed to add equipment: " + error.message, "error");
      return;
    }
    showToast("Equipment added successfully.", "success");
  }

  closeEquipmentModal();
  await refreshEquipmentView();
  await refreshDashboard();
}

// ---------- DELETE ----------
function confirmDeleteEquipment(id, name) {
  // BR-10: Deletion requires user confirmation
  openConfirmModal(`Delete "${name}"? This cannot be undone.`, async () => {
    const { error } = await supabaseClient.from("equipment").delete().eq("id", id);
    if (error) {
      showToast("Delete failed: " + error.message, "error");
      return;
    }
    showToast("Equipment deleted.", "success");
    await refreshEquipmentView();
    await refreshDashboard();
  });
}

// ---------- MODAL HELPERS ----------
function openAddEquipmentModal() {
  editingEquipmentId = null;
  document.getElementById("equipment-modal-title").textContent = "Add Equipment";
  document.getElementById("equipment-form").reset();
  document.getElementById("equipment-modal").classList.add("open");
}

function openEditEquipmentModal(id) {
  const eq = allEquipment.find((e) => e.id === id);
  if (!eq) return;
  editingEquipmentId = id;
  document.getElementById("equipment-modal-title").textContent = "Edit Equipment";
  document.getElementById("eq-name").value = eq.equipment_name;
  document.getElementById("eq-category").value = eq.category;
  document.getElementById("eq-code").value = eq.asset_code;
  document.getElementById("eq-condition").value = eq.condition;
  document.getElementById("equipment-modal").classList.add("open");
}

function closeEquipmentModal() {
  document.getElementById("equipment-modal").classList.remove("open");
  editingEquipmentId = null;
}

// ---------- SEARCH & FILTER ----------
function applyEquipmentFilters() {
  const query = (document.getElementById("equipment-search")?.value || "").toLowerCase();
  const availabilityFilter = document.getElementById("equipment-availability-filter")?.value || "All";

  let rows = allEquipment;

  if (query) {
    rows = rows.filter(
      (eq) =>
        eq.equipment_name.toLowerCase().includes(query) ||
        eq.asset_code.toLowerCase().includes(query)
    );
  }

  if (availabilityFilter !== "All") {
    rows = rows.filter((eq) => eq.availability === availabilityFilter);
  }

  renderEquipmentTable(rows);
}

// ---------- ORCHESTRATION ----------
async function refreshEquipmentView() {
  const rows = await fetchEquipment();
  applyEquipmentFilters();
  populateEquipmentDropdown(rows);
  return rows;
}

// ---------- UTIL ----------
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
