/**
 * NyucyGo - Core Logic JavaScript
 * Terintegrasi dengan Backend MySQL
 */

const API_BASE = "http://localhost:3000/api";

// --- UTILITIES ---
function formatIDR(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const options = { day: "numeric", month: "long", year: "numeric" };
  return new Date(dateString).toLocaleDateString("id-ID", options);
}

function formatDateTime(dateString) {
  if (!dateString) return "-";
  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("id-ID", options);
}

function getStatusClass(status) {
  switch (status) {
    case "Diterima":
      return "bg-info text-dark";
    case "Diproses":
      return "bg-warning text-dark";
    case "Selesai":
      return "bg-primary";
    case "Diambil":
      return "bg-success";
    default:
      return "bg-secondary";
  }
}

// --- SESSION MANAGEMENT ---
function getSession() {
  const data = localStorage.getItem("nyucygo_session");
  return data ? JSON.parse(data) : null;
}

function setSession(session) {
  localStorage.setItem("nyucygo_session", JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem("nyucygo_session");
}

function checkAuth() {
  const session = getSession();
  const currentPage = window.location.pathname.split("/").pop();

  // Halaman yang tidak butuh auth
  const publicPages = ["login.html", "index.html"];

  if (!session && !publicPages.includes(currentPage)) {
    window.location.href = "login.html";
    return false;
  }

  if (session && currentPage === "login.html") {
    if (session.role === "admin") window.location.href = "dashboard.html";
    else if (session.role === "customer")
      window.location.href = "tracking.html";
    return false;
  }

  return true;
}

// --- TRANSACTION FUNCTIONS ---
async function getTransactions() {
  try {
    const response = await fetch(`${API_BASE}/transaksi`);
    if (!response.ok) throw new Error("Gagal mengambil data");
    return await response.json();
  } catch (error) {
    console.error("Error getTransactions:", error);
    return [];
  }
}

async function saveTransaction(transaction) {
  try {
    const response = await fetch(`${API_BASE}/transaksi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });
    return await response.json();
  } catch (error) {
    console.error("Error saveTransaction:", error);
    return { success: false, error: error.message };
  }
}

async function updateStatus(id, status) {
  try {
    const response = await fetch(`${API_BASE}/transaksi/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updateStatus:", error);
    return { success: false, error: error.message };
  }
}

async function deleteTransaction(id) {
  try {
    const response = await fetch(`${API_BASE}/transaksi/${id}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleteTransaction:", error);
    return { success: false, error: error.message };
  }
}

async function getTracking(invoice) {
  try {
    const response = await fetch(`${API_BASE}/tracking/${invoice}`);
    if (!response.ok) throw new Error("Transaksi tidak ditemukan");
    return await response.json();
  } catch (error) {
    console.error("Error getTracking:", error);
    return null;
  }
}

// --- PRICING CONFIGURATION ---
const PRICING = {
  "Cuci Kering": 7000,
  "Cuci Setrika": 10000,
  "Setrika Saja": 6000,
  "Bedcover / Selimut": 25000,
};

function calculateEstimation(weight) {
  let baseDays = 1;
  if (weight > 5) baseDays += 1;

  const days = Math.ceil(baseDays);
  const date = new Date();
  date.setDate(date.getDate() + days);

  return { days, date: date.toISOString() };
}

function generateInvoiceId() {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `INV-${yy}${mm}${dd}${random}`;
}

// --- UI RENDER FUNCTIONS ---
async function renderDashboard() {
  const txs = await getTransactions();

  document.getElementById("totalTx").innerText = txs.length;
  document.getElementById("diproses").innerText = txs.filter(
    (t) => t.status === "Diproses",
  ).length;
  document.getElementById("selesai").innerText = txs.filter(
    (t) => t.status === "Selesai" || t.status === "Diambil",
  ).length;

  const recentBody = document.getElementById("recentTableBody");
  if (!recentBody) return;

  const recent = txs.slice(0, 5);
  recentBody.innerHTML =
    recent
      .map(
        (t) => `
        <tr>
            <td><span class="font-monospace fw-bold text-primary">${t.id}</span></td>
            <td>${t.nama}</td>
            <td><span class="badge ${getStatusClass(t.status)} px-3 rounded-pill" style="font-size: 0.75rem;">${t.status}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-light border-0 rounded-pill px-3" onclick="window.printReceipt('${t.id}')">
                    <i class="bi bi-printer text-primary"></i>
                </button>
            </td>
        </tr>
    `,
      )
      .join("") ||
    '<tr><td colspan="4" class="text-center text-muted py-4">Belum ada transaksi</td></tr>';
}

async function renderDaftar() {
  const txs = await getTransactions();
  const body = document.getElementById("daftarTableBody");
  if (!body) return;

  body.innerHTML =
    txs
      .map(
        (t) => `
        <tr>
            <td>
                <div class="fw-bold text-primary mb-0">${t.id}</div>
                <small class="text-muted small">${formatDate(t.createdAt)}</small>
            </td>
            <td>
                <div class="fw-bold text-dark">${t.nama}</div>
                <div class="small text-muted"><i class="bi bi-whatsapp"></i> ${t.hp}</div>
            </td>
            <td>
                <div class="fw-bold text-dark">${t.layanan}</div>
                <span class="badge bg-light text-muted border fw-normal">${t.berat} ${t.layanan.includes("Bedcover") ? "Pcs" : "Kg"}</span>
            </td>
            <td class="text-end fw-bold text-primary">${formatIDR(t.harga)}</td>
            <td>
                <span class="badge ${getStatusClass(t.status)} px-3 py-2 rounded-pill font-semibold">${t.status}</span>
            </td>
            <td>
                <div class="btn-group shadow-sm rounded-pill overflow-hidden">
                    ${
                      t.status !== "Diambil"
                        ? `
                        <button class="btn btn-sm btn-white border-end" onclick="window.nextStatus('${t.id}')" title="Update Status">
                            <i class="bi bi-arrow-repeat text-primary fs-6"></i>
                        </button>
                    `
                        : `
                        <div class="px-3 py-1 bg-light border-end d-flex align-items-center" title="Selesai">
                            <i class="bi bi-check-circle-fill text-success"></i>
                        </div>
                    `
                    }
                    <button class="btn btn-sm btn-white border-end" onclick="window.printReceipt('${t.id}')" title="Cetak Struk">
                        <i class="bi bi-printer text-secondary fs-6"></i>
                    </button>
                    <button class="btn btn-sm btn-white" onclick="window.deleteTransactionById('${t.id}')" title="Hapus">
                        <i class="bi bi-trash text-danger fs-6"></i>
                    </button>
                </div>
            </td>
        </tr>
    `,
      )
      .join("") ||
    '<tr><td colspan="6" class="text-center py-5 text-muted">Belum ada transaksi</td></tr>';
}

async function renderTracking() {
  const session = getSession();
  if (!session || session.role !== "customer") return;

  const t = await getTracking(session.id);
  if (!t) return;

  document.getElementById("trackId").innerText = t.id;
  const statusBadge = document.getElementById("trackStatus");
  statusBadge.innerText = t.status;
  statusBadge.className =
    "badge py-2 px-4 fs-6 rounded-pill " + getStatusClass(t.status);

  const descMap = {
    Diterima:
      "Cucian Anda telah masuk ke sistem kami dan sedang mengantri untuk diproses.",
    Diproses: "Cucian sedang dalam tahap pencucian dan pengeringan higienis.",
    Selesai: "Cucian Anda sudah bersih, rapi, dan harum. Siap dijemput!",
    Diambil: "Terima kasih telah menggunakan jasa kami. Sampai jumpa kembali!",
  };

  document.getElementById("trackStatusProgress").innerHTML = `
        <div class="alert bg-soft-blue border-0 rounded-4 text-primary d-flex align-items-center gap-2">
            <i class="bi bi-info-circle-fill"></i>
            <span>${descMap[t.status] || "Sedang diproses..."}</span>
        </div>
    `;

  const STATUS_FLOW = ["Diterima", "Diproses", "Selesai", "Diambil"];
  const currentIdx = STATUS_FLOW.indexOf(t.status);
  const timeline = document.getElementById("trackingTimeline");

  const icons = {
    Diterima: "bi-receipt",
    Diproses: "bi-droplet-half",
    Selesai: "bi-stars",
    Diambil: "bi-bag-check",
  };

  timeline.innerHTML = STATUS_FLOW.map((s, i) => {
    let stateClass = "";
    if (i < currentIdx) stateClass = "step-completed";
    else if (i === currentIdx) stateClass = "step-active";

    return `
            <div class="step-item ${stateClass}">
                <div class="step-dot"></div>
                <div class="d-flex align-items-center gap-4">
                    <div class="stat-icon ${i <= currentIdx ? "bg-primary text-white active-pulse" : "bg-light text-muted"}">
                        <i class="bi ${icons[s]}"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 fw-bold">${s}</h6>
                        <small class="text-muted">${i < currentIdx ? "Telah Selesai" : i === currentIdx ? "Sedang Berlangsung" : "Tahap Berikutnya"}</small>
                    </div>
                </div>
            </div>
        `;
  }).join("");
}

// --- GLOBAL FUNCTIONS ---
window.printReceipt = async function (id) {
  const txs = await getTransactions();
  const t = txs.find((x) => x.id === id);
  if (!t) return;

  const printArea = document.getElementById("printArea");
  if (!printArea) return;

  printArea.innerHTML = `
        <div class="printable-receipt p-4 bg-white" style="display: block;">
            <div class="text-center border-bottom pb-3 mb-3">
                <h4 class="fw-bold mb-0">NYUCYGO LAUNDRY</h4>
                <p class="small text-muted mb-0">Nyuci cepat, tanpa ribet</p>
                <p class="small text-muted">Jl. Premium Wash No. 123, Jakarta</p>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between small"><span>Invoice:</span> <strong>${t.id}</strong></div>
                <div class="d-flex justify-content-between small"><span>Tanggal:</span> <span>${formatDateTime(t.createdAt)}</span></div>
                <div class="d-flex justify-content-between small"><span>Estimasi Selesai:</span> <span>${formatDate(t.estimasi)}</span></div>
                <div class="d-flex justify-content-between small"><span>Pelanggan:</span> <strong>${t.nama}</strong></div>
            </div>
            <table class="table table-sm table-borderless small mb-3">
                <tr class="border-bottom"><th>Deskripsi</th><th class="text-end">Harga</th></tr>
                <tr><td>${t.layanan} (${t.berat} ${t.layanan.includes("Bedcover") ? "Pcs" : "Kg"})</td>
                <td class="text-end">${formatIDR(t.harga)}</td></tr>
            </table>
            <div class="border-top pt-2 mb-4">
                <div class="d-flex justify-content-between fw-bold">
                    <span>GRAND TOTAL</span>
                    <span>${formatIDR(t.harga)}</span>
                </div>
            </div>
            <div class="text-center small">
                <p class="mt-4 mb-0 fw-bold">SIMPAN STRUK INI</p>
                <p class="text-muted">Terima kasih telah menggunakan jasa kami</p>
            </div>
        </div>
    `;
  window.print();
  setTimeout(() => {
    printArea.innerHTML = "";
  }, 1000);
};

window.printReport = async function () {
  const txs = await getTransactions();
  const totalRevenue = txs.reduce((acc, t) => acc + t.harga, 0);
  const activeTx = txs.filter((t) => t.status !== "Diambil").length;

  const printArea = document.getElementById("printArea");
  if (!printArea) return;

  printArea.innerHTML = `
        <div class="p-5 bg-white" style="display: block;">
            <div class="text-center mb-5">
                <h2 class="fw-bold">LAPORAN NYUCYGO LAUNDRY</h2>
                <p class="text-muted">Laporan dicetak pada: ${new Date().toLocaleString("id-ID")}</p>
            </div>
            <div class="row mb-5 text-center">
                <div class="col-4"><h5>Total Transaksi</h5><h3>${txs.length}</h3></div>
                <div class="col-4"><h5>Total Omzet</h5><h3>${formatIDR(totalRevenue)}</h3></div>
                <div class="col-4"><h5>Antrian Aktif</h5><h3>${activeTx}</h3></div>
            </div>
            <table class="table table-bordered">
                <thead class="table-light"><tr><th>ID</th><th>Pelanggan</th><th>Layanan</th><th>Biaya</th><th>Status</th></tr></thead>
                <tbody>
                    ${txs
                      .map(
                        (t) => `
                        <tr><td>${t.id}</td><td>${t.nama}</td><td>${t.layanan}</td><td>${formatIDR(t.harga)}</td><td>${t.status}</td></tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    `;
  window.print();
  setTimeout(() => {
    printArea.innerHTML = "";
  }, 1000);
};

window.deleteTransactionById = async function (id) {
  if (confirm("Yakin ingin menghapus transaksi ini?")) {
    const result = await deleteTransaction(id);
    if (result.success) {
      alert("Transaksi berhasil dihapus");
      if (window.location.pathname.includes("daftar")) await renderDaftar();
      if (window.location.pathname.includes("dashboard"))
        await renderDashboard();
    } else {
      alert("Gagal menghapus transaksi: " + result.error);
    }
  }
};

window.nextStatus = async function (id) {
  const txs = await getTransactions();
  const t = txs.find((x) => x.id === id);
  if (!t) return;

  const STATUS_FLOW = ["Diterima", "Diproses", "Selesai", "Diambil"];
  const currentIdx = STATUS_FLOW.indexOf(t.status);

  if (currentIdx < STATUS_FLOW.length - 1) {
    const newStatus = STATUS_FLOW[currentIdx + 1];
    const result = await updateStatus(id, newStatus);
    if (result.success) {
      await renderDaftar();
    } else {
      alert("Gagal update status: " + result.error);
    }
  }
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  // Create print area if not exists
  if (!document.getElementById("printArea")) {
    const pa = document.createElement("div");
    pa.id = "printArea";
    document.body.appendChild(pa);
  }

  const path = window.location.pathname;
  const isDashboard = path.includes("dashboard");
  const isTransaksi = path.includes("transaksi");
  const isDaftar = path.includes("daftar");
  const isTracking = path.includes("tracking");
  const isLogin =
    path.includes("login") || path.endsWith("/") || path.endsWith("index.html");

  // Check authentication
  if (!checkAuth()) return;

  // Initialize page content
  if (isDashboard) {
    await renderDashboard();
  }

  if (isDaftar) {
    await renderDaftar();
  }

  if (isTracking) {
    await renderTracking();
  }

  // LOGIN LOGIC
  if (isLogin) {
    const adminForm = document.getElementById("formAdminLogin");
    const customerForm = document.getElementById("formCustomerLogin");

    if (adminForm) {
      adminForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("adminUser").value;
        const password = document.getElementById("adminPass").value;

        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const data = await response.json();

          if (data.success) {
            setSession({ role: data.role, id: data.id });
            window.location.href = "dashboard.html";
          } else {
            alert(data.message);
          }
        } catch (error) {
          alert("Gagal terhubung ke server. Pastikan server berjalan.");
        }
      });
    }

    if (customerForm) {
      customerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const invoice = document.getElementById("custInvoice").value;

        try {
          const response = await fetch(`${API_BASE}/auth/cek-transaksi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invoice }),
          });
          const data = await response.json();

          if (data.success) {
            setSession({ role: data.role, id: data.id });
            window.location.href = "tracking.html";
          } else {
            alert(data.message);
          }
        } catch (error) {
          alert("Gagal terhubung ke server. Pastikan server berjalan.");
        }
      });
    }
  }

  // TRANSACTION FORM LOGIC
  if (isTransaksi) {
    const form = document.getElementById("formTransaksi");
    const inputLayanan = document.getElementById("layanan");
    const inputBerat = document.getElementById("berat");
    const displayHargaPerKg = document.getElementById("displayHargaPerKg");
    const displayTotal = document.getElementById("displayTotal");
    const displayEstimasi = document.getElementById("displayEstimasi");

    function updatePrice() {
      if (!inputLayanan || !inputBerat) return;
      const service = inputLayanan.value;
      const weight = parseFloat(inputBerat.value) || 0;
      const pricePerUnit = PRICING[service] || 0;

      const isPerItem = service === "Bedcover / Selimut";
      const total = weight * pricePerUnit;

      if (displayHargaPerKg)
        displayHargaPerKg.innerText =
          formatIDR(pricePerUnit) + (isPerItem ? "" : " /Kg");
      if (displayTotal) displayTotal.innerText = formatIDR(total);

      const est = calculateEstimation(weight);
      if (displayEstimasi) displayEstimasi.innerText = est.days + " Hari Kerja";
    }

    if (inputLayanan && inputBerat) {
      inputLayanan.addEventListener("change", updatePrice);
      inputBerat.addEventListener("input", updatePrice);
      updatePrice();
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nama = document.getElementById("nama").value;
        const hp = document.getElementById("hp").value;
        const layanan = inputLayanan.value;
        const berat = parseFloat(inputBerat.value) || 0;
        const pricePerUnit = PRICING[layanan];
        const total = berat * pricePerUnit;
        const est = calculateEstimation(berat);
        const invoiceId = generateInvoiceId();

        const newTx = {
          id: invoiceId,
          nama: nama,
          hp: hp,
          layanan: layanan,
          berat: berat,
          harga: total,
          estimasi: est.date,
        };

        const result = await saveTransaction(newTx);

        if (result.success) {
          alert(`Transaksi Berhasil Disimpan!\nKode Invoice: ${invoiceId}`);
          if (confirm("Cetak Struk Sekarang?")) {
            await window.printReceipt(invoiceId);
          }
          window.location.href = "daftar.html";
        } else {
          alert("Gagal menyimpan transaksi: " + result.error);
        }
      });
    }
  }

  // LOGOUT BUTTON
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = "index.html";
    });
  }

  // SIDEBAR TOGGLE FOR MOBILE
  const sbToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("mainSidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (sbToggle && sidebar && overlay) {
    sbToggle.addEventListener("click", () => {
      sidebar.classList.toggle("show");
      overlay.classList.toggle("show");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("show");
      overlay.classList.remove("show");
    });
  }
});
