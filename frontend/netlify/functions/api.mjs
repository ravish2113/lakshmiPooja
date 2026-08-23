import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const MONEY = (v) => Number(v ?? 0);
const ID = (v) => Number(v);
const ALLOWED_ROLES = new Set(["ADMIN", "USER"]);
const ALLOWED_DONATION_STATUS = new Set(["PAID", "UNPAID"]);
const ALLOWED_PAYMENT_MODES = new Set(["UPI", "CASH", "PENDING"]);

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new ApiError(500, `Server environment variable ${name} is not configured.`);
  return value;
}

function connectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const jdbc = process.env.SPRING_DATASOURCE_URL;
  const user = process.env.SPRING_DATASOURCE_USERNAME;
  const pass = process.env.SPRING_DATASOURCE_PASSWORD;
  if (jdbc && user && pass) {
    const raw = jdbc.replace(/^jdbc:/, "");
    const u = new URL(raw);
    u.username = user;
    u.password = pass;
    return u.toString();
  }
  throw new ApiError(500, "DATABASE_URL is not configured.");
}

let pool;
function db() {
  if (!pool) {
    pool = new Pool({
      connectionString: connectionString(),
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 12_000,
      allowExitOnIdle: true
    });
  }
  return pool;
}

let initPromise;
async function ensureInitialized() {
  if (!initPromise) initPromise = initialize().catch((e) => { initPromise = undefined; throw e; });
  return initPromise;
}

async function initialize() {
  const p = db();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(781245991)");

    const { rows: [tables] } = await client.query(`
      SELECT
        to_regclass('public.users') AS users,
        to_regclass('public.pooja_year_ledger') AS years,
        to_regclass('public.donations') AS donations,
        to_regclass('public.expenditures') AS expenditures
    `);

    if (!tables.users || !tables.years || !tables.donations || !tables.expenditures) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          display_name VARCHAR(150) NOT NULL,
          role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','USER')),
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS pooja_year_ledger (
          id BIGSERIAL PRIMARY KEY,
          year INTEGER NOT NULL UNIQUE,
          opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
          closed BOOLEAN NOT NULL DEFAULT FALSE,
          closed_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS donations (
          id BIGSERIAL PRIMARY KEY,
          year_id BIGINT NOT NULL REFERENCES pooja_year_ledger(id),
          donor_name VARCHAR(150) NOT NULL,
          father_mother_name VARCHAR(150),
          amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
          donation_date DATE NOT NULL,
          payment_mode VARCHAR(20) NOT NULL DEFAULT 'UPI' CHECK (payment_mode IN ('UPI','CASH','PENDING')),
          payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID','UNPAID')),
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS expenditures (
          id BIGSERIAL PRIMARY KEY,
          year_id BIGINT NOT NULL REFERENCES pooja_year_ledger(id),
          title VARCHAR(200) NOT NULL,
          category VARCHAR(80) NOT NULL,
          total_cost NUMERIC(14,2) NOT NULL CHECK (total_cost > 0),
          paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0 AND paid_amount <= total_cost),
          expense_date DATE NOT NULL,
          vendor VARCHAR(150),
          receipt_reference VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    const { rows: columnRows } = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name IN ('donations','expenditures')
        AND column_name IN ('flat_details','father_mother_name','payment_status','amount','total_cost','paid_amount')
    `);
    const cols = new Set(columnRows.map(r => `${r.table_name}.${r.column_name}`));

    if (cols.has("donations.flat_details") && !cols.has("donations.father_mother_name")) {
      await client.query("ALTER TABLE donations RENAME COLUMN flat_details TO father_mother_name");
    }
    if (!cols.has("donations.payment_status")) {
      await client.query("ALTER TABLE donations ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID'");
      await client.query("ALTER TABLE donations DROP CONSTRAINT IF EXISTS chk_payment_mode");
      await client.query("ALTER TABLE donations ADD CONSTRAINT chk_payment_mode CHECK (payment_mode IN ('UPI','CASH','PENDING'))");
      await client.query("ALTER TABLE donations ADD CONSTRAINT chk_donation_payment_status CHECK (payment_status IN ('PAID','UNPAID'))");
    }
    if (cols.has("expenditures.amount") && !cols.has("expenditures.total_cost")) {
      await client.query("ALTER TABLE expenditures RENAME COLUMN amount TO total_cost");
    }
    if (!cols.has("expenditures.paid_amount")) {
      await client.query("ALTER TABLE expenditures ADD COLUMN paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0");
      await client.query("UPDATE expenditures SET paid_amount = total_cost");
      await client.query("ALTER TABLE expenditures DROP CONSTRAINT IF EXISTS chk_expenditure_amount");
      await client.query("ALTER TABLE expenditures ADD CONSTRAINT chk_expenditure_total_cost CHECK (total_cost > 0)");
      await client.query("ALTER TABLE expenditures ADD CONSTRAINT chk_expenditure_paid_amount CHECK (paid_amount >= 0 AND paid_amount <= total_cost)");
    }

    await client.query("CREATE INDEX IF NOT EXISTS idx_donations_year ON donations(year_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_expenditures_year ON expenditures(year_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_expenditures_date ON expenditures(expense_date)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON donations(payment_status)");

    const adminUsername = requiredEnv("ADMIN_USERNAME").trim();
    const adminPassword = requiredEnv("ADMIN_PASSWORD");
    const adminDisplayName = (process.env.ADMIN_DISPLAY_NAME || "Administrator").trim();
    if (adminPassword.length < 8) throw new ApiError(500, "ADMIN_PASSWORD must be at least 8 characters.");

    const { rows: [existingAdmin] } = await client.query("SELECT * FROM users WHERE username=$1", [adminUsername]);
    if (!existingAdmin) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await client.query(
        "INSERT INTO users(username,password,display_name,role,active) VALUES($1,$2,$3,'ADMIN',TRUE)",
        [adminUsername, hash, adminDisplayName]
      );
    } else {
      const passwordMatches = await bcrypt.compare(adminPassword, existingAdmin.password);
      if (!passwordMatches || existingAdmin.display_name !== adminDisplayName || existingAdmin.role !== "ADMIN" || !existingAdmin.active) {
        const hash = passwordMatches ? existingAdmin.password : await bcrypt.hash(adminPassword, 10);
        await client.query(
          "UPDATE users SET password=$1,display_name=$2,role='ADMIN',active=TRUE WHERE id=$3",
          [hash, adminDisplayName, existingAdmin.id]
        );
      }
    }

    const currentYear = new Date().getFullYear();
    for (let year = 2024; year <= currentYear; year++) {
      await client.query("INSERT INTO pooja_year_ledger(year, opening_balance) VALUES($1,0) ON CONFLICT(year) DO NOTHING", [year]);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally { client.release(); }
}

function json(data, status = 200, headers = {}) {
  return new Response(data === undefined ? null : JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}

function noContent() { return new Response(null, { status: 204, headers: { "cache-control": "no-store" } }); }
function cleanString(value, max, required = false, field = "Field") {
  const s = value == null ? "" : String(value).trim();
  if (required && !s) throw new ApiError(400, `${field} is required.`);
  if (s.length > max) throw new ApiError(400, `${field} is too long.`);
  return s || null;
}
function positiveMoney(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new ApiError(400, `${field} must be greater than 0.`);
  return Math.round(n * 100) / 100;
}
function nonNegativeMoney(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new ApiError(400, `${field} cannot be negative.`);
  return Math.round(n * 100) / 100;
}
function validDate(value, field) {
  const s = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`))) throw new ApiError(400, `${field} is invalid.`);
  return s;
}
function validYear(value) {
  const y = Number(value);
  if (!Number.isInteger(y) || y < 2000 || y > 2200) throw new ApiError(400, "Invalid year.");
  return y;
}
async function body(req) {
  try { return await req.json(); } catch { throw new ApiError(400, "Invalid JSON request body."); }
}

function signToken(user) {
  const secret = requiredEnv("JWT_SECRET");
  if (Buffer.byteLength(secret, "utf8") < 32) throw new ApiError(500, "JWT_SECRET must be at least 32 bytes.");
  const seconds = Math.max(300, Math.floor(Number(process.env.JWT_EXPIRATION_MS || 86400000) / 1000));
  return jwt.sign({ role: user.role }, secret, { subject: user.username, expiresIn: seconds, algorithm: "HS256" });
}

async function auth(req, requiredRole) {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) throw new ApiError(401, "Authentication required.");
  let decoded;
  try { decoded = jwt.verify(header.slice(7), requiredEnv("JWT_SECRET")); }
  catch { throw new ApiError(401, "Invalid or expired session."); }
  const { rows } = await db().query("SELECT id,username,display_name,role,active,created_at FROM users WHERE username=$1", [decoded.sub]);
  const user = rows[0];
  if (!user || !user.active) throw new ApiError(401, "User account is unavailable.");
  if (requiredRole === "ADMIN" && user.role !== "ADMIN") throw new ApiError(403, "Administrator access required.");
  return user;
}

function yearResponse(r) { return { id: ID(r.id), year: Number(r.year), openingBalance: MONEY(r.opening_balance), closed: r.closed, closedAt: r.closed_at }; }
function donationResponse(r, isPublic = false) {
  const base = { id: ID(r.id), year: Number(r.year), donorName: r.donor_name, amount: MONEY(r.amount), donationDate: r.donation_date, paymentMode: r.payment_mode, paymentStatus: r.payment_status };
  return isPublic ? base : { ...base, fatherMotherName: r.father_mother_name, notes: r.notes };
}
function expenditureResponse(r) { return { id: ID(r.id), year: Number(r.year), title: r.title, category: r.category, totalCost: MONEY(r.total_cost), paidAmount: MONEY(r.paid_amount), leftAmount: MONEY(r.total_cost) - MONEY(r.paid_amount), expenseDate: r.expense_date, vendor: r.vendor, receiptReference: r.receipt_reference, notes: r.notes }; }

async function getYear(year, client = db()) {
  const { rows } = await client.query("SELECT * FROM pooja_year_ledger WHERE year=$1", [year]);
  if (!rows[0]) throw new ApiError(404, `Year ${year} not found.`);
  return rows[0];
}
async function getYears() {
  const { rows } = await db().query("SELECT * FROM pooja_year_ledger ORDER BY year DESC");
  return rows.map(yearResponse);
}
async function dashboard(year) {
  const y = await getYear(year);
  const [{ rows: d }, { rows: e }] = await Promise.all([
    db().query(`SELECT COALESCE(SUM(amount),0) total, COALESCE(SUM(amount) FILTER (WHERE payment_status='PAID'),0) paid, COUNT(*) count FROM donations WHERE year_id=$1`, [y.id]),
    db().query(`SELECT COALESCE(SUM(total_cost),0) total, COALESCE(SUM(paid_amount),0) paid, COUNT(*) count FROM expenditures WHERE year_id=$1`, [y.id])
  ]);
  const totalDonations=MONEY(d[0].total), paidDonations=MONEY(d[0].paid), totalExpenditure=MONEY(e[0].total), paidExpenditure=MONEY(e[0].paid);
  return { year, openingBalance:MONEY(y.opening_balance), totalDonations, paidDonations, unpaidDonations:totalDonations-paidDonations, totalExpenditure, paidExpenditure, unpaidExpenditure:totalExpenditure-paidExpenditure, availableBalance:MONEY(y.opening_balance)+paidDonations-paidExpenditure, donationCount:Number(d[0].count), expenditureCount:Number(e[0].count), closed:y.closed };
}
async function donationsForYear(year, isPublic=false) {
  await getYear(year);
  const { rows } = await db().query(`SELECT d.*, y.year FROM donations d JOIN pooja_year_ledger y ON y.id=d.year_id WHERE y.year=$1 ORDER BY d.donation_date DESC,d.id DESC`, [year]);
  return rows.map(r => donationResponse(r,isPublic));
}
async function expendituresForYear(year) {
  await getYear(year);
  const { rows } = await db().query(`SELECT e.*, y.year FROM expenditures e JOIN pooja_year_ledger y ON y.id=e.year_id WHERE y.year=$1 ORDER BY e.expense_date DESC,e.id DESC`, [year]);
  return rows.map(expenditureResponse);
}
function donationInput(b) {
  const paymentStatus=String(b.paymentStatus||"").toUpperCase();
  if(!ALLOWED_DONATION_STATUS.has(paymentStatus)) throw new ApiError(400,"Payment status must be PAID or UNPAID.");
  let paymentMode=String(b.paymentMode||"").toUpperCase();
  if(paymentStatus==="UNPAID") paymentMode="PENDING";
  if(!ALLOWED_PAYMENT_MODES.has(paymentMode) || (paymentStatus==="PAID" && paymentMode==="PENDING")) throw new ApiError(400,"Invalid payment mode.");
  return { donorName:cleanString(b.donorName,150,true,"Donor name"), fatherMotherName:cleanString(b.fatherMotherName,150), amount:positiveMoney(b.amount,"Amount"), donationDate:validDate(b.donationDate,"Donation date"), paymentMode, paymentStatus, notes:cleanString(b.notes,10000) };
}
function expenditureInput(b) {
  const totalCost=positiveMoney(b.totalCost,"Total cost"), paidAmount=nonNegativeMoney(b.paidAmount,"Paid amount");
  if(paidAmount>totalCost) throw new ApiError(400,"Paid amount cannot be greater than total cost.");
  return { title:cleanString(b.title,200,true,"Item / service"), category:cleanString(b.category,80,true,"Category"), totalCost, paidAmount, expenseDate:validDate(b.expenseDate,"Expense date"), vendor:cleanString(b.vendor,150), receiptReference:cleanString(b.receiptReference,255), notes:cleanString(b.notes,10000) };
}

async function closeYear(year) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT * FROM pooja_year_ledger WHERE year=$1 FOR UPDATE",[year]);
    const current=rows[0];
    if(!current) throw new ApiError(404,`Year ${year} not found.`);
    if(current.closed) throw new ApiError(400,`Year ${year} is already closed.`);
    const { rows:[totals] } = await client.query(`SELECT COALESCE((SELECT SUM(amount) FROM donations WHERE year_id=$1 AND payment_status='UNPAID'),0) unpaid_donations, COALESCE((SELECT SUM(total_cost-paid_amount) FROM expenditures WHERE year_id=$1),0) unpaid_expenditure, COALESCE((SELECT SUM(amount) FROM donations WHERE year_id=$1 AND payment_status='PAID'),0) paid_donations, COALESCE((SELECT SUM(paid_amount) FROM expenditures WHERE year_id=$1),0) paid_expenditure`,[current.id]);
    if(MONEY(totals.unpaid_donations)>0 || MONEY(totals.unpaid_expenditure)>0) throw new ApiError(400,`Cannot close ${year} while payments are pending. Unpaid donations: ₹${MONEY(totals.unpaid_donations).toFixed(2)}, expenditure left to pay: ₹${MONEY(totals.unpaid_expenditure).toFixed(2)}.`);
    const balance=MONEY(current.opening_balance)+MONEY(totals.paid_donations)-MONEY(totals.paid_expenditure);
    if(balance<0) throw new ApiError(400,`Cannot close year because available balance is negative: ₹${balance.toFixed(2)}`);
    const nextYear=year+1;
    const { rows:nextRows } = await client.query("SELECT * FROM pooja_year_ledger WHERE year=$1 FOR UPDATE",[nextYear]);
    if(nextRows[0]) {
      if(nextRows[0].closed) throw new ApiError(400,`Cannot close ${year} because ${nextYear} is already closed.`);
      const {rows:[counts]}=await client.query(`SELECT (SELECT COUNT(*) FROM donations WHERE year_id=$1) donation_count,(SELECT COUNT(*) FROM expenditures WHERE year_id=$1) expenditure_count`,[nextRows[0].id]);
      if(Number(counts.donation_count)>0 || Number(counts.expenditure_count)>0) throw new ApiError(400,`Cannot close ${year} because ${nextYear} already contains transactions. Remove those transactions first or close years in order.`);
      await client.query("UPDATE pooja_year_ledger SET opening_balance=$1 WHERE id=$2",[balance,nextRows[0].id]);
    } else await client.query("INSERT INTO pooja_year_ledger(year,opening_balance) VALUES($1,$2)",[nextYear,balance]);
    const {rows:[updated]}=await client.query("UPDATE pooja_year_ledger SET closed=TRUE,closed_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *",[current.id]);
    await client.query("COMMIT");
    return yearResponse(updated);
  } catch(e) { await client.query("ROLLBACK").catch(()=>{}); throw e; } finally { client.release(); }
}

function safePdfText(v) { return String(v ?? "").replace(/[^\x20-\x7E]/g, "?"); }
function moneyText(v) { return `Rs. ${MONEY(v).toFixed(2)}`; }
function wrap(text, max) { const s=safePdfText(text); const words=s.split(/\s+/); const lines=[]; let line=""; for(const w of words){ if((line+" "+w).trim().length>max){ if(line) lines.push(line); line=w.slice(0,max); } else line=(line+" "+w).trim(); } if(line) lines.push(line); return lines.length?lines:[""]; }
async function reportPdf(kind, year, rows) {
  const pdf=await PDFDocument.create();
  const font=await pdf.embedFont(StandardFonts.Helvetica), bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const landscape=[841.89,595.28];
  const headers=kind==="donations"?["Date","Donor Name","Father / Mother Name","Mode","Status","Amount","Notes"]:["Date","Item / Service","Category","Vendor","Total Cost","Paid","Left","Receipt","Notes"];
  const widths=kind==="donations"?[70,145,125,55,55,75,250]:[58,110,75,88,70,65,65,80,175];
  const getCells=kind==="donations"?(r)=>[r.donationDate,r.donorName,r.fatherMotherName||"",r.paymentMode,r.paymentStatus,moneyText(r.amount),r.notes||""]:(r)=>[r.expenseDate,r.title,r.category,r.vendor||"",moneyText(r.totalCost),moneyText(r.paidAmount),moneyText(r.leftAmount),r.receiptReference||"",r.notes||""];
  let page,y;
  function newPage(){ page=pdf.addPage(landscape); y=landscape[1]-36; page.drawText("Shri Shri Lakshmi Pooja Samiti Mustafapur",{x:28,y,size:15,font:bold}); y-=22; page.drawText(`${kind==="donations"?"Donation":"Expenditure"} Report - ${year}`,{x:28,y,size:11,font:bold}); y-=24; drawRow(headers,true); }
  function drawRow(cells,header=false){ const lineSets=cells.map((c,i)=>wrap(c,Math.max(5,Math.floor(widths[i]/6)))); const lines=Math.max(...lineSets.map(x=>x.length)); const h=Math.max(20,lines*9+8); if(y-h<42&&!header){newPage();return drawRow(cells,false)} let x=28; for(let i=0;i<cells.length;i++){ page.drawRectangle({x,y:y-h,width:widths[i],height:h,borderWidth:.5,borderColor:rgb(.75,.75,.75),color:header?rgb(.93,.93,.93):undefined}); lineSets[i].slice(0,Math.max(1,Math.floor((h-8)/9))).forEach((line,j)=>page.drawText(line,{x:x+3,y:y-11-j*9,size:7,font:header?bold:font})); x+=widths[i]; } y-=h; }
  newPage(); rows.forEach(r=>drawRow(getCells(r)));
  if(y<65)newPage();
  y-=12;
  if(kind==="donations"){const total=rows.reduce((a,r)=>a+MONEY(r.amount),0),paid=rows.filter(r=>r.paymentStatus==="PAID").reduce((a,r)=>a+MONEY(r.amount),0); page.drawText(`Total: ${moneyText(total)}    Paid: ${moneyText(paid)}    Unpaid: ${moneyText(total-paid)}`,{x:28,y,size:10,font:bold});}
  else{const total=rows.reduce((a,r)=>a+MONEY(r.totalCost),0),paid=rows.reduce((a,r)=>a+MONEY(r.paidAmount),0); page.drawText(`Total Cost: ${moneyText(total)}    Paid: ${moneyText(paid)}    Left to Pay: ${moneyText(total-paid)}`,{x:28,y,size:10,font:bold});}
  return pdf.save();
}

async function route(req) {
  await ensureInitialized();
  const url=new URL(req.url), path=url.pathname.replace(/\/+$/,"")||"/", method=req.method.toUpperCase();

  if(method==="POST" && path==="/api/auth/login"){
    const b=await body(req); const username=cleanString(b.username,100,true,"Username"), password=String(b.password||"");
    const {rows}=await db().query("SELECT * FROM users WHERE username=$1",[username]); const user=rows[0];
    if(!user || !user.active || !(await bcrypt.compare(password,user.password))) throw new ApiError(401,"Invalid username or password.");
    return json({token:signToken(user),username:user.username,displayName:user.display_name,role:user.role});
  }
  if(method==="GET" && path==="/api/auth/me"){
    const user=await auth(req); return json({username:user.username,displayName:user.display_name,role:user.role});
  }
  if(method==="GET" && (path==="/api/public/years" || path==="/api/years")){
    if(path==="/api/years") await auth(req); return json(await getYears());
  }
  let m;
  if(method==="GET" && (m=path.match(/^\/api\/(public\/)?years\/(\d+)\/dashboard$/))){ if(!m[1]) await auth(req); return json(await dashboard(validYear(m[2]))); }
  if(method==="GET" && (m=path.match(/^\/api\/(public\/)?years\/(\d+)\/donations$/))){ if(!m[1]) await auth(req); return json(await donationsForYear(validYear(m[2]),!!m[1])); }
  if(method==="GET" && (m=path.match(/^\/api\/(public\/)?years\/(\d+)\/expenditures$/))){ if(!m[1]) await auth(req); return json(await expendituresForYear(validYear(m[2]))); }

  if(method==="POST" && (m=path.match(/^\/api\/years\/(\d+)\/donations$/))){ await auth(req,"ADMIN"); const year=validYear(m[1]), y=await getYear(year); if(y.closed) throw new ApiError(400,`Year ${year} is closed and read-only.`); const b=donationInput(await body(req)); const {rows:[r]}=await db().query(`INSERT INTO donations(year_id,donor_name,father_mother_name,amount,donation_date,payment_mode,payment_status,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *, $9::integer AS year`,[y.id,b.donorName,b.fatherMotherName,b.amount,b.donationDate,b.paymentMode,b.paymentStatus,b.notes,year]); return json(donationResponse(r),201); }
  if(method==="PUT" && (m=path.match(/^\/api\/donations\/(\d+)$/))){ await auth(req,"ADMIN"); const id=ID(m[1]), {rows:[old]}=await db().query(`SELECT d.*,y.year,y.closed FROM donations d JOIN pooja_year_ledger y ON y.id=d.year_id WHERE d.id=$1`,[id]); if(!old) throw new ApiError(404,"Donation not found."); if(old.closed) throw new ApiError(400,`Year ${old.year} is closed and read-only.`); const b=donationInput(await body(req)); const {rows:[r]}=await db().query(`UPDATE donations SET donor_name=$1,father_mother_name=$2,amount=$3,donation_date=$4,payment_mode=$5,payment_status=$6,notes=$7,updated_at=CURRENT_TIMESTAMP WHERE id=$8 RETURNING *, $9::integer AS year`,[b.donorName,b.fatherMotherName,b.amount,b.donationDate,b.paymentMode,b.paymentStatus,b.notes,id,old.year]); return json(donationResponse(r)); }
  if(method==="DELETE" && (m=path.match(/^\/api\/donations\/(\d+)$/))){ await auth(req,"ADMIN"); const id=ID(m[1]), {rows:[old]}=await db().query(`SELECT d.id,y.year,y.closed FROM donations d JOIN pooja_year_ledger y ON y.id=d.year_id WHERE d.id=$1`,[id]); if(!old) throw new ApiError(404,"Donation not found."); if(old.closed) throw new ApiError(400,`Year ${old.year} is closed and read-only.`); await db().query("DELETE FROM donations WHERE id=$1",[id]); return noContent(); }

  if(method==="POST" && (m=path.match(/^\/api\/years\/(\d+)\/expenditures$/))){ await auth(req,"ADMIN"); const year=validYear(m[1]), y=await getYear(year); if(y.closed) throw new ApiError(400,`Year ${year} is closed and read-only.`); const b=expenditureInput(await body(req)); const {rows:[r]}=await db().query(`INSERT INTO expenditures(year_id,title,category,total_cost,paid_amount,expense_date,vendor,receipt_reference,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *, $10::integer AS year`,[y.id,b.title,b.category,b.totalCost,b.paidAmount,b.expenseDate,b.vendor,b.receiptReference,b.notes,year]); return json(expenditureResponse(r),201); }
  if(method==="PUT" && (m=path.match(/^\/api\/expenditures\/(\d+)$/))){ await auth(req,"ADMIN"); const id=ID(m[1]), {rows:[old]}=await db().query(`SELECT e.*,y.year,y.closed FROM expenditures e JOIN pooja_year_ledger y ON y.id=e.year_id WHERE e.id=$1`,[id]); if(!old) throw new ApiError(404,"Expenditure not found."); if(old.closed) throw new ApiError(400,`Year ${old.year} is closed and read-only.`); const b=expenditureInput(await body(req)); const {rows:[r]}=await db().query(`UPDATE expenditures SET title=$1,category=$2,total_cost=$3,paid_amount=$4,expense_date=$5,vendor=$6,receipt_reference=$7,notes=$8,updated_at=CURRENT_TIMESTAMP WHERE id=$9 RETURNING *, $10::integer AS year`,[b.title,b.category,b.totalCost,b.paidAmount,b.expenseDate,b.vendor,b.receiptReference,b.notes,id,old.year]); return json(expenditureResponse(r)); }
  if(method==="DELETE" && (m=path.match(/^\/api\/expenditures\/(\d+)$/))){ await auth(req,"ADMIN"); const id=ID(m[1]), {rows:[old]}=await db().query(`SELECT e.id,y.year,y.closed FROM expenditures e JOIN pooja_year_ledger y ON y.id=e.year_id WHERE e.id=$1`,[id]); if(!old) throw new ApiError(404,"Expenditure not found."); if(old.closed) throw new ApiError(400,`Year ${old.year} is closed and read-only.`); await db().query("DELETE FROM expenditures WHERE id=$1",[id]); return noContent(); }

  if(method==="POST" && (m=path.match(/^\/api\/years\/(\d+)\/close$/))){ await auth(req,"ADMIN"); return json(await closeYear(validYear(m[1]))); }
  if(method==="POST" && path==="/api/years") { await auth(req,"ADMIN"); const year=validYear(url.searchParams.get("year")), opening=nonNegativeMoney(url.searchParams.get("openingBalance")||0,"Opening balance"); try { const {rows:[r]}=await db().query("INSERT INTO pooja_year_ledger(year,opening_balance) VALUES($1,$2) RETURNING *",[year,opening]); return json(yearResponse(r),201); } catch(e){ if(e.code==="23505") throw new ApiError(400,`Year ${year} already exists.`); throw e; } }

  if(method==="GET" && path==="/api/admin/users") { await auth(req,"ADMIN"); const {rows}=await db().query("SELECT id,username,display_name,role,active,created_at FROM users ORDER BY created_at ASC"); return json(rows.map(u=>({id:ID(u.id),username:u.username,displayName:u.display_name,role:u.role,active:u.active,createdAt:u.created_at}))); }
  if(method==="POST" && path==="/api/admin/users") { await auth(req,"ADMIN"); const b=await body(req); const username=cleanString(b.username,100,true,"Username"), password=String(b.password||""), displayName=cleanString(b.displayName,150,true,"Display name"), role=String(b.role||"").toUpperCase(); if(password.length<8||password.length>100) throw new ApiError(400,"Password must contain 8 to 100 characters."); if(!ALLOWED_ROLES.has(role)) throw new ApiError(400,"Role must be ADMIN or USER."); const hash=await bcrypt.hash(password,10); try{const {rows:[u]}=await db().query("INSERT INTO users(username,password,display_name,role,active) VALUES($1,$2,$3,$4,TRUE) RETURNING id,username,display_name,role,active,created_at",[username,hash,displayName,role]); return json({id:ID(u.id),username:u.username,displayName:u.display_name,role:u.role,active:u.active,createdAt:u.created_at},201);}catch(e){if(e.code==="23505") throw new ApiError(400,"Username already exists.");throw e;} }

  if(method==="GET" && (m=path.match(/^\/api\/admin\/reports\/(\d+)\/(donations|expenditures)\.pdf$/))) { await auth(req,"ADMIN"); const year=validYear(m[1]), kind=m[2], rows=kind==="donations"?await donationsForYear(year,false):await expendituresForYear(year); const bytes=await reportPdf(kind,year,rows); return new Response(bytes,{status:200,headers:{"content-type":"application/pdf","content-disposition":`attachment; filename="${kind}-${year}.pdf"`,"cache-control":"no-store"}}); }

  throw new ApiError(404,"API endpoint not found.");
}

export default async function handler(req) {
  try { return await route(req); }
  catch(e) { console.error(e); const status=e instanceof ApiError?e.status:500; const message=e instanceof ApiError?e.message:"Unexpected server error."; return json({message},status); }
}

export const config = { path: "/api/*" };
