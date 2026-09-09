// ============================================================
// transactions.js — Borrowing, Return, Overdue Logic, Dashboard
// (BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09, BR-12)
// ============================================================

let allTransactions = [];

// ---------- FETCH ----------
async function fetchTransactions() {
  const { data, error } = await supabaseClient
    .from("borrow_transactions")
    .select("*, equipment:equipment_id(equipment_name, asset_code)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showToast("Failed to load transactions: " + error.message, "error");
    return [];
  }

  // Apply client-side overdue detection (Section X) on every load
  const today = new Date().toISOString().slice(0, 10);
  const withOverdue = data.map((t) => {
    if (t.status === "Borrowed" && t.due_date < today) {
      return { ...t, status: "Overdue" };
    }
    return t;
  });

  allTransactions = withOverdue;
  return withOverdue;
}

// ---------- RENDER ----------
function renderTransactionsTable(rows) {
  const tbody = document.getElementById("transactions-table-body");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row">No transactions found.</td></tr>`;
    return;
  }

  rows.forEach((t) => {
    const statusClass =
      t.status === "Returned" ? "badge-green" : t.status === "Overdue" ? "badge-red" : "badge-orange";

    const equipmentLabel = t.equipment
      ? `${escapeHtml(t.equipment.equipment_name)} (${escapeHtml(t.equipment.asset_code)})`
      : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${equipmentLabel}</td>
      <td>${escapeHtml(t.borrower_name)}</td>
      <td>${escapeHtml(t.borrower_type)}</td>
      <td>${escapeHtml(t.department)}</td>
      <td>${t.date_borrowed}</td>
      <td>${t.due_date}</td>
      <td><span class="badge ${statusClass}">${t.status}</span></td>
      <td class="actions-cell">
        ${
          t.status !== "Returned"
            ? `<button class="btn btn-small btn-primary" onclick="confirmReturnEquipment(${t.id})">Return</button>`
            : `<span class="muted">Returned ${t.date_returned || ""}</span>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------- CREATE BORROWING TRANSACTION ----------
async function handleTransactionFormSubmit(event) {
  event.preventDefault();

  const equipmentId = document.getElementById("txn-equipment").value;
  const borrowerName = document.getElementById("txn-borrower-name").value.trim();
  const borrowerType = document.getElementById("txn-borrower-type").value;
  const department = document.getElementById("txn-department").value.trim();
  const dateBorrowed = document.getElementById("txn-date-borrowed").value;
  const dueDate = document.getElementById("txn-due-date").value;

  // BR-04: Borrower name must be provided
  if (!borrowerName) {
    showToast("Borrower name is required.", "error");
    return;
  }
  if (!equipmentId) {
    showToast("Please select an equipment item.", "error");
    return;
  }
  if (!department) {
    showToast("Department/Office is required.", "error");
    return;
  }
  // BR-05: Due date cannot be earlier than the borrowing date
  if (dueDate < dateBorrowed) {
    showToast("Due date cannot be earlier than the borrowing date.", "error");
    return;
  }

  // BR-03: Only available equipment may be borrowed (re-verify against latest data)
  const equipment = allEquipment.find((eq) => eq.id === Number(equipmentId));
  if (!equipment || equipment.availability !== "Available") {
    showToast("Selected equipment is no longer available.", "error");
    await refreshEquipmentView();
    return;
  }

  const { data: { user } } = await supabaseClient.auth.getUser();

  // BR-06: Newly borrowed equipment receives Borrowed status
  const { error: insertError } = await supabaseClient.from("borrow_transactions").insert({
    equipment_id: Number(equipmentId),
    borrower_name: borrowerName,
    borrower_type: borrowerType,
    department,
    date_borrowed: dateBorrowed,
    due_date: dueDate,
    status: "Borrowed",
    user_id: user ? user.id : null,
  });

  if (insertError) {
    showToast("Failed to record borrowing: " + insertError.message, "error");
    return;
  }

  // BR-07: Borrowed equipment becomes unavailable
  const { error: updateError } = await supabaseClient
    .from("equipment")
    .update({ availability: "Borrowed" })
    .eq("id", Number(equipmentId));

  if (updateError) {
    showToast("Transaction saved, but failed to update equipment status: " + updateError.message, "error");
  } else {
    showToast("Borrowing transaction recorded.", "success");
  }

  closeTransactionModal();
  await refreshEquipmentView();
  await refreshTransactionsView();
  await refreshDashboard();
}

// ---------- RETURN EQUIPMENT ----------
function confirmReturnEquipment(transactionId) {
  const txn = allTransactions.find((t) => t.id === transactionId);
  if (!txn) return;

  // BR-12: A returned transaction cannot be returned a second time
  if (txn.status === "Returned") {
    showToast("This transaction has already been returned.", "error");
    return;
  }

  openConfirmModal(`Mark this transaction as returned for "${txn.borrower_name}"?`, async () => {
    const today = new Date().toISOString().slice(0, 10);

    const { error: txnError } = await supabaseClient
      .from("borrow_transactions")
      .update({ status: "Returned", date_returned: today })
      .eq("id", transactionId);

    if (txnError) {
      showToast("Return failed: " + txnError.message, "error");
      return;
    }

    // BR-08: Returned equipment becomes available again
    const { error: eqError } = await supabaseClient
      .from("equipment")
      .update({ availability: "Available" })
      .eq("id", txn.equipment_id);

    if (eqError) {
      showToast("Transaction returned, but failed to update equipment: " + eqError.message, "error");
    } else {
      showToast("Equipment returned successfully.", "success");
    }

    await refreshEquipmentView();
    await refreshTransactionsView();
    await refreshDashboard();
  });
}

// ---------- SEARCH & FILTER ----------
function applyTransactionFilters() {
  const query = (document.getElementById("transaction-search")?.value || "").toLowerCase();
  const statusFilter = document.getElementById("transaction-status-filter")?.value || "All";

  let rows = allTransactions;

  if (query) {
    rows = rows.filter(
      (t) =>
        t.borrower_name.toLowerCase().includes(query) ||
        (t.equipment && t.equipment.equipment_name.toLowerCase().includes(query)) ||
        (t.equipment && t.equipment.asset_code.toLowerCase().includes(query))
    );
  }

  if (statusFilter !== "All") {
    rows = rows.filter((t) => t.status === statusFilter);
  }

  renderTransactionsTable(rows);
}

// ---------- MODAL HELPERS ----------
function openAddTransactionModal() {
  document.getElementById("transaction-form").reset();
  document.getElementById("txn-date-borrowed").value = new Date().toISOString().slice(0, 10);
  populateEquipmentDropdown(allEquipment);
  document.getElementById("transaction-modal").classList.add("open");
}

function closeTransactionModal() {
  document.getElementById("transaction-modal").classList.remove("open");
}

// ---------- DASHBOARD ----------
async function refreshDashboard() {
  const equipment = allEquipment.length ? allEquipment : await fetchEquipment();
  const transactions = allTransactions.length ? allTransactions : await fetchTransactions();

  const total = equipment.length;
  const available = equipment.filter((e) => e.availability === "Available").length;
  const borrowed = equipment.filter((e) => e.availability === "Borrowed").length;
  const returned = transactions.filter((t) => t.status === "Returned").length;
  const overdue = transactions.filter((t) => t.status === "Overdue").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-available").textContent = available;
  document.getElementById("stat-borrowed").textContent = borrowed;
  document.getElementById("stat-returned").textContent = returned;
  document.getElementById("stat-overdue").textContent = overdue;
}

// ---------- ORCHESTRATION ----------
async function refreshTransactionsView() {
  await fetchTransactions();
  applyTransactionFilters();
}

// ---------- OPTIONAL CHALLENGE: Equipment Borrowing History ----------
async function showEquipmentHistory(equipmentId, equipmentLabel) {
  const { data, error } = await supabaseClient
    .from("borrow_transactions")
    .select("*")
    .eq("equipment_id", equipmentId)
    .order("date_borrowed", { ascending: false });

  if (error) {
    showToast("Failed to load history: " + error.message, "error");
    return;
  }

  const list = document.getElementById("history-list");
  document.getElementById("history-title").textContent = `Borrowing History — ${equipmentLabel}`;

  list.innerHTML = data.length
    ? data
        .map(
          (t) => `
        <li>
          <strong>${escapeHtml(t.borrower_name)}</strong> (${escapeHtml(t.borrower_type)})<br>
          Borrowed: ${t.date_borrowed} &nbsp;|&nbsp; ${
            t.date_returned ? `Returned: ${t.date_returned}` : `Status: ${t.status}`
          }
        </li>`
        )
        .join("")
    : "<li>No borrowing history for this item yet.</li>";

  document.getElementById("history-modal").classList.add("open");
}

function closeHistoryModal() {
  document.getElementById("history-modal").classList.remove("open");
}
