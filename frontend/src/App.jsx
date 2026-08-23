import React, { useEffect, useState } from "react";
import {
  login, validateSession, getYears, getDashboard, getDonations, getExpenditures,
  getPublicYears, getPublicDashboard, getPublicDonations, getPublicExpenditures,
  addDonation, addExpenditure, updateDonation, deleteDonation, updateExpenditure,
  deleteExpenditure, closeYear, getUsers, createUser, downloadAdminReport
} from "./services/api";
import {
  LayoutDashboard, Heart, Receipt, CalendarClock, Users, LogOut, UserCircle,
  Wallet, ShoppingCart, IndianRupee, Plus, LockKeyhole, X, FileText,
  Download, BadgeIndianRupee
} from "lucide-react";

const money = n => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);
const statusClass = status => String(status || "").toLowerCase();

function Login({ onLogin, onHome }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await login(username, password);
      localStorage.setItem("token", r.token);
      localStorage.setItem("user", JSON.stringify(r));
      onLogin(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="login-page">
    <form className="login-card" onSubmit={submit}>
      <div className="login-diya">🪔</div>
      <h1>श्री श्री लक्ष्मी पूजा समिति मुस्तफापुर</h1>
      <p>Secure Admin / Member Login</p>
      {error && <div className="error">{error}</div>}
      <label>Username</label>
      <input required value={username} onChange={e => setUsername(e.target.value)} />
      <label>Password</label>
      <input required type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="login-button">{busy ? "Signing in..." : "Sign In"}</button>
      <button type="button" className="secondary" onClick={onHome}>← Public Home</button>
    </form>
  </div>;
}

function PaymentSummary({ dash }) {
  return <div className="payment-summary-grid">
    <section className="payment-summary-card donation-summary">
      <div className="payment-summary-title"><Heart size={20}/> Donation Collection</div>
      <div className="payment-lines">
        <div><span>Total promised</span><b>{money(dash.totalDonations)}</b></div>
        <div><span>Paid / received</span><b className="paid-text">{money(dash.paidDonations)}</b></div>
        <div><span>Unpaid / pending</span><b className="pending-text">{money(dash.unpaidDonations)}</b></div>
      </div>
    </section>
    <section className="payment-summary-card expenditure-summary">
      <div className="payment-summary-title"><Receipt size={20}/> Expenditure Payment</div>
      <div className="payment-lines">
        <div><span>Total committed cost</span><b>{money(dash.totalExpenditure)}</b></div>
        <div><span>Paid so far</span><b className="paid-text">{money(dash.paidExpenditure)}</b></div>
        <div><span>Still to pay</span><b className="pending-text">{money(dash.unpaidExpenditure)}</b></div>
      </div>
    </section>
  </div>;
}

function PublicHome({ onLogin }) {
  const [years, setYears] = useState([]);
  const [year, setYear] = useState(2026);
  const [dash, setDash] = useState(null);
  const [don, setDon] = useState([]);
  const [exp, setExp] = useState([]);
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    getPublicYears().then(y => {
      setYears(y);
      if (y.length) setYear(Number(y[0].year));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!year) return;
    (async () => {
      try {
        const [d, a, b] = await Promise.all([
          getPublicDashboard(year), getPublicDonations(year), getPublicExpenditures(year)
        ]);
        setDash(d); setDon(a); setExp(b);
      } catch (e) { console.error(e); }
    })();
  }, [year]);

  return <div className="public-page">
    <header className="public-header">
      <div className="public-brand"><div className="public-logo">🪔</div><div>
        <h2>श्री श्री लक्ष्मी पूजा समिति मुस्तफापुर</h2>
        <p>Community Contribution & Expenditure Ledger</p>
      </div></div>
      <div className="public-actions">
        <div className="year-picker"><b>Year:</b><select value={year} onChange={e => setYear(Number(e.target.value))}>{years.map(y => <option key={y.year}>{y.year}</option>)}</select></div>
        <button className="public-login" onClick={onLogin}>Admin Login</button>
      </div>
    </header>
    <main className="public-content">
      {view === "dashboard" && dash && <>
        <section className="community-hero">
          <div className="community-photo-wrap"><img src="/community-photo.jpeg" alt="श्री श्री लक्ष्मी पूजा समिति मुस्तफापुर community members" className="community-photo"/></div>
          <div className="community-copy">
            <div className="hero-kicker">COMMUNITY • TRANSPARENCY • CELEBRATION</div>
            <h1>श्री श्री लक्ष्मी पूजा समिति मुस्तफापुर</h1>
            <p>हमारे समुदाय के चंदा संग्रह और खर्च का पारदर्शी, वर्षवार सार्वजनिक लेखा-जोखा।</p>
            <p className="hero-english">A transparent public record of community contributions and expenditures, maintained year by year.</p>
            <div className="hero-year">Pooja Year {year}</div>
          </div>
        </section>
        <div className="stats">
          <Stat title="OPENING BALANCE" amount={dash.openingBalance} icon={<Wallet/>} type="blue"/>
          <Stat title="TOTAL DONATIONS" amount={dash.totalDonations} icon={<Heart/>} type="green" link="View Donations" onClick={() => setView("donations")}/>
          <Stat title="TOTAL EXPENDITURE" amount={dash.totalExpenditure} icon={<ShoppingCart/>} type="red" link="View Expenditures" onClick={() => setView("expenditures")}/>
          <Stat title="AVAILABLE CASH" amount={dash.availableBalance} icon={<IndianRupee/>} type="yellow"/>
        </div>
        <PaymentSummary dash={dash}/>
        <div className="public-panels">
          <div className="table-card public-summary-card"><h2>Donation Records</h2><p><strong>{don.length}</strong> donation records for {year}</p><button onClick={() => setView("donations")}>View all donations →</button></div>
          <div className="table-card public-summary-card"><h2>Expenditure Records</h2><p><strong>{exp.length}</strong> expenditure records for {year}</p><button onClick={() => setView("expenditures")}>View all expenditures →</button></div>
        </div>
        <div className="public-footer">श्री श्री लक्ष्मी पूजा समिति मुस्तफापुर • Community Transparency Ledger</div>
      </>}
      {view === "donations" && <PublicTable title={`All Donations — ${year}`} rows={don} type="donation" back={() => setView("dashboard")}/>} 
      {view === "expenditures" && <PublicTable title={`All Expenditures — ${year}`} rows={exp} type="expense" back={() => setView("dashboard")}/>} 
    </main>
  </div>;
}

function Stat({ title, amount, icon, type, link, onClick }) {
  return <div className={`stat ${type} ${link ? "clickable" : ""}`} onClick={onClick}>
    <div className="stat-top"><div className="stat-icon">{icon}</div><div className="stat-title">{title}</div></div>
    <div className="stat-amount">{money(amount)}</div>
    {link && <div className="stat-link">{link} →</div>}
  </div>;
}

function StatusBadge({ value }) {
  return <span className={`status-badge ${statusClass(value)}`}>{value}</span>;
}

function PublicTable({ title, rows, type, back }) {
  const donation = type === "donation";
  return <section className="table-card">
    <div className="table-head"><h2>{title}</h2><button onClick={back}>← Back</button></div>
    <div className="table-scroll"><table>
      <thead><tr>{donation ? <><th>Date</th><th>Donor</th><th>Status</th><th>Mode</th><th>Amount</th></> : <><th>Date</th><th>Item / Service</th><th>Category</th><th>Total Cost</th><th>Paid</th><th>Left</th></>}</tr></thead>
      <tbody>
        {rows.map(r => donation ? <tr key={r.id}><td>{r.donationDate}</td><td>{r.donorName}</td><td><StatusBadge value={r.paymentStatus}/></td><td>{r.paymentMode}</td><td className="right">{money(r.amount)}</td></tr>
          : <tr key={r.id}><td>{r.expenseDate}</td><td>{r.title}</td><td>{r.category}</td><td className="right">{money(r.totalCost)}</td><td className="right paid-text">{money(r.paidAmount)}</td><td className="right pending-text">{money(r.leftAmount)}</td></tr>)}
        {!rows.length && <tr><td colSpan={donation ? 5 : 6}>No records.</td></tr>}
      </tbody>
    </table></div>
  </section>;
}

function Sidebar({ page, setPage, role }) {
  const items = [
    ["dashboard", <LayoutDashboard size={20}/>, "Dashboard"],
    ["donations", <Heart size={20}/>, "Donations"],
    ["expenditures", <Receipt size={20}/>, "Expenditures"],
    ["year", <CalendarClock size={20}/>, "Year Closure"],
    ...(role === "ADMIN" ? [
      ["reports", <FileText size={20}/>, "Reports"],
      ["users", <Users size={20}/>, "Users"]
    ] : [])
  ];
  return <aside className="sidebar">
    <div className="sidebar-logo"><div className="diya">🪔</div><div><h2>लक्ष्मी पूजा समिति</h2><span>मुस्तफापुर</span></div></div>
    <nav>{items.map(([k, i, l]) => <button key={k} className={`sidebar-item ${page === k ? "active" : ""}`} onClick={() => setPage(k)}>{i}<span>{l}</span></button>)}</nav>
  </aside>;
}

function Topbar({ year, setYear, years, user, onLogout }) {
  return <header className="topbar">
    <div className="brand"><div className="brand-icon">🪔</div><div><h2>श्री श्री लक्ष्मी पूजा समिति मुस्तफापुर</h2><p>Authenticated Financial Dashboard</p></div></div>
    <div className="topbar-actions">
      <div className="year-picker"><b>Year:</b><select value={year ?? ""} onChange={e => setYear(Number(e.target.value))}>{years.map(y => <option key={y.year} value={y.year}>{y.year}</option>)}</select></div>
      <span className="role">{user.role}</span>
      <UserCircle className="topbar-user-icon" size={30}/>
      <button className="logout-button" onClick={onLogout}><LogOut size={18}/><span>Logout</span></button>
    </div>
  </header>;
}

function Editor({ type, initial, onClose, onSaved, year }) {
  const donation = type === "donation";
  const defaultDonation = { donorName: "", fatherMotherName: "", amount: "", donationDate: today(), paymentMode: "UPI", paymentStatus: "PAID", notes: "" };
  const defaultExpense = { title: "", category: "Decoration", totalCost: "", paidAmount: "0", expenseDate: today(), vendor: "", receiptReference: "", notes: "" };
  const [f, setF] = useState(initial || (donation ? defaultDonation : defaultExpense));
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const leftAmount = donation ? 0 : Math.max(0, Number(f.totalCost || 0) - Number(f.paidAmount || 0));

  function changeDonationStatus(value) {
    setF(prev => ({
      ...prev,
      paymentStatus: value,
      paymentMode: value === "UNPAID" ? "PENDING" : (prev.paymentMode === "PENDING" ? "UPI" : prev.paymentMode)
    }));
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (donation) {
        const payload = {
          donorName: f.donorName,
          fatherMotherName: f.fatherMotherName,
          amount: Number(f.amount),
          donationDate: f.donationDate,
          paymentMode: f.paymentStatus === "UNPAID" ? "PENDING" : f.paymentMode,
          paymentStatus: f.paymentStatus,
          notes: f.notes
        };
        if (f.id) await updateDonation(Number(year), f.id, payload);
        else await addDonation(Number(year), payload);
      } else {
        const totalCost = Number(f.totalCost);
        const paidAmount = Number(f.paidAmount || 0);
        if (paidAmount > totalCost) throw new Error("Paid amount cannot be greater than total cost.");
        const payload = {
          title: f.title,
          category: f.category,
          totalCost,
          paidAmount,
          expenseDate: f.expenseDate,
          vendor: f.vendor,
          receiptReference: f.receiptReference,
          notes: f.notes
        };
        if (f.id) await updateExpenditure(Number(year), f.id, payload);
        else await addExpenditure(Number(year), payload);
      }
      onSaved();
    } catch (e) { alert(e.message); }
  }

  return <Modal title={f.id ? (donation ? "Edit Donation" : "Edit Expenditure") : (donation ? "Add Donation" : "Add Expenditure")} onClose={onClose}>
    <form className="form-grid" onSubmit={save}>
      {donation ? <>
        <input required placeholder="Donor name" value={f.donorName} onChange={e => set("donorName", e.target.value)}/>
        <input placeholder="Father / Mother Name" value={f.fatherMotherName || ""} onChange={e => set("fatherMotherName", e.target.value)}/>
        <input required type="number" step="0.01" min="0.01" placeholder="Amount" value={f.amount} onChange={e => set("amount", e.target.value)}/>
        <input required type="date" value={f.donationDate} onChange={e => set("donationDate", e.target.value)}/>
        <label className="field-label">Payment Status<select value={f.paymentStatus || "PAID"} onChange={e => changeDonationStatus(e.target.value)}><option value="PAID">PAID</option><option value="UNPAID">UNPAID</option></select></label>
        <label className="field-label">Payment Mode<select disabled={f.paymentStatus === "UNPAID"} value={f.paymentStatus === "UNPAID" ? "PENDING" : f.paymentMode} onChange={e => set("paymentMode", e.target.value)}><option value="UPI">UPI</option><option value="CASH">CASH</option>{f.paymentStatus === "UNPAID" && <option value="PENDING">PENDING</option>}</select></label>
        <input className="full-field" placeholder="Notes" value={f.notes || ""} onChange={e => set("notes", e.target.value)}/>
      </> : <>
        <input required placeholder="Expense title" value={f.title} onChange={e => set("title", e.target.value)}/>
        <select value={f.category} onChange={e => set("category", e.target.value)}><option>Tent</option><option>Murti</option><option>Food / Prasad</option><option>Decoration</option><option>Sound</option><option>Other</option></select>
        <label className="field-label">Total Cost<input required type="number" step="0.01" min="0.01" value={f.totalCost} onChange={e => set("totalCost", e.target.value)}/></label>
        <label className="field-label">Paid Amount<input required type="number" step="0.01" min="0" value={f.paidAmount} onChange={e => set("paidAmount", e.target.value)}/></label>
        <div className="calculated-field"><span>Left to Pay</span><strong>{money(leftAmount)}</strong></div>
        <input required type="date" value={f.expenseDate} onChange={e => set("expenseDate", e.target.value)}/>
        <input placeholder="Vendor" value={f.vendor || ""} onChange={e => set("vendor", e.target.value)}/>
        <input placeholder="Receipt reference" value={f.receiptReference || ""} onChange={e => set("receiptReference", e.target.value)}/>
        <input className="full-field" placeholder="Notes" value={f.notes || ""} onChange={e => set("notes", e.target.value)}/>
      </>}
      <button className="submit">Save</button>
    </form>
  </Modal>;
}

function Modal({ title, onClose, children }) {
  return <div className="overlay"><div className="modal"><div className="modal-head"><h2>{title}</h2><button onClick={onClose}><X/></button></div>{children}</div></div>;
}

function AdminTable({ rows, type, role, year, reload }) {
  const [edit, setEdit] = useState(null);
  const donation = type === "donation";
  async function del(id) {
    if (!confirm(`Delete this ${donation ? "donation" : "expenditure"}?`)) return;
    try {
      if (donation) await deleteDonation(Number(year), id); else await deleteExpenditure(Number(year), id);
      reload();
    } catch (e) { alert(e.message); }
  }
  return <section className="table-card">
    <div className="table-head"><h2>{donation ? "Donation Ledger" : "Expenditure Ledger"}</h2>{role === "ADMIN" && <button className="small-add" onClick={() => setEdit({})}><Plus size={15}/> Add</button>}</div>
    <div className="table-scroll"><table>
      <thead><tr>{donation ? <><th>Date</th><th>Donor / Father-Mother Name</th><th>Status</th><th>Mode</th><th>Amount</th></> : <><th>Date</th><th>Item / Service</th><th>Category</th><th>Vendor / Receipt</th><th>Total Cost</th><th>Paid</th><th>Left</th></>}<th>Actions</th></tr></thead>
      <tbody>
        {rows.map(r => <tr key={r.id}>{donation ? <>
          <td>{r.donationDate}</td><td>{r.donorName}{r.fatherMotherName && ` (${r.fatherMotherName})`}</td><td><StatusBadge value={r.paymentStatus}/></td><td>{r.paymentMode}</td><td className="right">{money(r.amount)}</td>
        </> : <>
          <td>{r.expenseDate}</td><td>{r.title}</td><td>{r.category}</td><td>{r.vendor || r.receiptReference || "—"}</td><td className="right">{money(r.totalCost)}</td><td className="right paid-text">{money(r.paidAmount)}</td><td className="right pending-text">{money(r.leftAmount)}</td>
        </>}<td>{role === "ADMIN" && <><button className="action edit" onClick={() => setEdit(r)}>Edit</button><button className="action delete" onClick={() => del(r.id)}>Delete</button></>}</td></tr>)}
        {!rows.length && <tr><td colSpan={donation ? 6 : 8}>No records.</td></tr>}
      </tbody>
    </table></div>
    {edit && <Editor type={type} initial={edit.id ? edit : undefined} year={year} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }}/>} 
  </section>;
}

function ReportsPage({ year }) {
  const [busy, setBusy] = useState("");
  async function download(type) {
    setBusy(type);
    try { await downloadAdminReport(year, type); }
    catch (e) { alert(e.message); }
    finally { setBusy(""); }
  }
  return <div className="reports-page">
    <div className="page-heading"><h1>PDF Reports</h1><p>Admin-only yearly reports for {year}. Each PDF contains the complete ledger and totals.</p></div>
    <div className="reports-grid">
      <section className="report-card"><div className="report-icon"><Heart/></div><h2>Donation Report</h2><p>Name, father/mother name, date, amount, paid/unpaid status, payment mode and notes.</p><button disabled={!!busy} onClick={() => download("donations")}><Download size={18}/>{busy === "donations" ? "Generating…" : `Download Donations PDF (${year})`}</button></section>
      <section className="report-card"><div className="report-icon"><Receipt/></div><h2>Expenditure Report</h2><p>Item, vendor, total cost, paid amount, amount left, date, receipt reference and notes.</p><button disabled={!!busy} onClick={() => download("expenditures")}><Download size={18}/>{busy === "expenditures" ? "Generating…" : `Download Expenditure PDF (${year})`}</button></section>
    </div>
  </div>;
}

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", displayName: "", role: "USER" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = () => getUsers().then(setUsers).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm({ ...form, [k]: v });
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try { await createUser(form); setForm({ username: "", password: "", displayName: "", role: "USER" }); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <div className="users-page"><div className="page-heading"><h1>Users</h1><p>Create login accounts for committee members. Passwords are stored as BCrypt hashes.</p></div>{error && <div className="error">{error}</div>}<div className="users-grid"><section className="table-card"><h2>Create User</h2><form className="form-grid" onSubmit={submit}><input required placeholder="Username" value={form.username} onChange={e => set("username", e.target.value)}/><input required placeholder="Display name" value={form.displayName} onChange={e => set("displayName", e.target.value)}/><input required minLength={8} type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={e => set("password", e.target.value)}/><select value={form.role} onChange={e => set("role", e.target.value)}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select><button className="submit" disabled={busy}>{busy ? "Creating…" : "Create User"}</button></form></section><section className="table-card"><h2>Existing Users</h2><div className="table-scroll"><table><thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Status</th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td>{u.username}</td><td>{u.displayName}</td><td>{u.role}</td><td>{u.active ? "Active" : "Inactive"}</td></tr>)}{!users.length && <tr><td colSpan={4}>No users found.</td></tr>}</tbody></table></div></section></div></div>;
}

function Authenticated({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [years, setYears] = useState([]);
  const [year, setYear] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [don, setDon] = useState([]);
  const [exp, setExp] = useState([]);

  async function load(y = year) {
    const ys = await getYears();
    setYears(ys);
    const selected = ys.length ? (ys.some(x => Number(x.year) === Number(y)) ? Number(y) : Number(ys[0].year)) : null;
    setYear(selected);
    if (selected === null) { setDashboard(null); setDon([]); setExp([]); return; }
    const [d, a, b] = await Promise.all([getDashboard(selected), getDonations(selected), getExpenditures(selected)]);
    setDashboard(d); setDon(a); setExp(b);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (year) load(year); }, [year]);

  async function close() {
    if (!Number.isInteger(Number(year)) || Number(year) <= 0) { alert("Please select a valid year."); return; }
    if (!confirm(`Close ${year}? All donations must be paid and all expenditure dues cleared.`)) return;
    try { await closeYear(year); await load(year); alert(`${year} closed successfully.`); }
    catch (e) { alert(e.message); }
  }

  const admin = user.role === "ADMIN";
  return <div className="app">
    <Sidebar page={page} setPage={setPage} role={user.role}/>
    <div className="main">
      <Topbar year={year} setYear={setYear} years={years} user={user} onLogout={onLogout}/>
      <main className="content">
        {page === "dashboard" && dashboard && <>
          <div className="page-heading"><h1>Dashboard</h1><p>Financial overview for {year}</p></div>
          <div className="stats">
            <Stat title="OPENING BALANCE" amount={dashboard.openingBalance} icon={<Wallet/>} type="blue"/>
            <Stat title="TOTAL DONATIONS" amount={dashboard.totalDonations} icon={<Heart/>} type="green" link="View Donations" onClick={() => setPage("donations")}/>
            <Stat title="TOTAL EXPENDITURE" amount={dashboard.totalExpenditure} icon={<ShoppingCart/>} type="red" link="View Expenditures" onClick={() => setPage("expenditures")}/>
            <Stat title="AVAILABLE CASH" amount={dashboard.availableBalance} icon={<IndianRupee/>} type="yellow"/>
          </div>
          <PaymentSummary dash={dashboard}/>
        </>}
        {page === "donations" && <AdminTable rows={don} type="donation" role={user.role} year={year} reload={() => load(year)}/>} 
        {page === "expenditures" && <AdminTable rows={exp} type="expense" role={user.role} year={year} reload={() => load(year)}/>} 
        {page === "reports" && admin && <ReportsPage year={year}/>} 
        {page === "users" && admin && <UsersPage/>} 
        {page === "year" && <div className="year-page"><h1>Year Closure</h1><p>Close {year} and carry its actual cash balance into {year + 1}. Pending donations and unpaid expenditure must be cleared first.</p><div className="close-box"><div className="closure-summary"><b>Available cash: {money(dashboard?.availableBalance)}</b><span>Unpaid donations: {money(dashboard?.unpaidDonations)}</span><span>Expenditure left: {money(dashboard?.unpaidExpenditure)}</span></div><button disabled={!admin || dashboard?.closed} onClick={close}><LockKeyhole size={17}/> {dashboard?.closed ? "Year Closed" : "Close Year"}</button></div></div>}
      </main>
    </div>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loginPage, setLoginPage] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("token")) {
      validateSession().then(u => setUser({ ...JSON.parse(localStorage.getItem("user") || "{}"), ...u }))
        .catch(() => localStorage.clear()).finally(() => setChecking(false));
    } else setChecking(false);
  }, []);
  if (checking) return <div className="login-page"><div className="login-card"><div className="login-diya">🪔</div><h1>Loading…</h1></div></div>;
  if (loginPage && !user) return <Login onLogin={setUser} onHome={() => setLoginPage(false)}/>;
  if (!user) return <PublicHome onLogin={() => setLoginPage(true)}/>;
  return <Authenticated user={user} onLogout={() => { localStorage.clear(); setUser(null); }}/>;
}
