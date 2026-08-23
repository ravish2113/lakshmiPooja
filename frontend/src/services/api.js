const API = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

async function apiRequest(path, options = {}) {
  const { auth = true, ...fetchOptions } = options;
  const headers = {
    ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
    ...(fetchOptions.headers || {})
  };

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API}${path}`, { ...fetchOptions, headers });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!response.ok) {
    const message = data && typeof data === "object" && data.message
      ? data.message
      : typeof data === "string" && data
        ? data
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function requireYear(year) {
  const y = Number(year);
  if (!Number.isInteger(y) || y <= 0) throw new Error("Invalid year selected.");
  return y;
}

export const login = (username, password) => apiRequest("/auth/login", {
  method: "POST", auth: false, body: JSON.stringify({ username, password })
});
export const validateSession = () => apiRequest("/auth/me");
export const getYears = () => apiRequest("/years");
export const getDashboard = year => apiRequest(`/years/${requireYear(year)}/dashboard`);
export const getDonations = year => apiRequest(`/years/${requireYear(year)}/donations`);
export const getExpenditures = year => apiRequest(`/years/${requireYear(year)}/expenditures`);
export const getPublicYears = () => apiRequest("/public/years", { auth: false });
export const getPublicDashboard = year => apiRequest(`/public/years/${requireYear(year)}/dashboard`, { auth: false });
export const getPublicDonations = year => apiRequest(`/public/years/${requireYear(year)}/donations`, { auth: false });
export const getPublicExpenditures = year => apiRequest(`/public/years/${requireYear(year)}/expenditures`, { auth: false });
export const addDonation = (year, data) => apiRequest(`/years/${requireYear(year)}/donations`, { method: "POST", body: JSON.stringify(data) });
export const updateDonation = (year, id, data) => { requireYear(year); return apiRequest(`/donations/${id}`, { method: "PUT", body: JSON.stringify(data) }); };
export const deleteDonation = (year, id) => { requireYear(year); return apiRequest(`/donations/${id}`, { method: "DELETE" }); };
export const addExpenditure = (year, data) => apiRequest(`/years/${requireYear(year)}/expenditures`, { method: "POST", body: JSON.stringify(data) });
export const updateExpenditure = (year, id, data) => { requireYear(year); return apiRequest(`/expenditures/${id}`, { method: "PUT", body: JSON.stringify(data) }); };
export const deleteExpenditure = (year, id) => { requireYear(year); return apiRequest(`/expenditures/${id}`, { method: "DELETE" }); };
export const closeYear = year => apiRequest(`/years/${requireYear(year)}/close`, { method: "POST" });
export const getUsers = () => apiRequest("/admin/users");
export const createUser = data => apiRequest("/admin/users", { method: "POST", body: JSON.stringify(data) });

export async function downloadAdminReport(year, type) {
  const y = requireYear(year);
  if (!["donations", "expenditures"].includes(type)) throw new Error("Invalid report type.");
  const token = localStorage.getItem("token");
  const response = await fetch(`${API}/admin/reports/${y}/${type}.pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    const text = await response.text();
    let message = `Report download failed (${response.status})`;
    try { message = JSON.parse(text)?.message || message; } catch { if (text) message = text; }
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${type}-${y}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
