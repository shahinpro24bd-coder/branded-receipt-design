/* Printable invoice / quotation in the QMEP brand (logo, navy + blue, Teko + Open Sans).
   Pure string builders so the layout can be previewed and tested without a browser popup. */
import { amountInWords, docTotals, lineAmount, type LineItem } from "@/lib/business";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

export type PrintSettings = {
  legalName: string; trn: string; address: string; phone: string; email: string;
  bankName: string; accountName: string; iban: string; accountNo: string; swift: string;
  invoiceTerms: string; quoteTerms: string;
};

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const t = Date.parse(d);
  return Number.isNaN(t) ? esc(d) : new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};

/* Brand palette taken from the site (template.css) and the QMEP logo. */
const css = `
@page{size:A4;margin:9mm 10mm}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
:root{--navy:#0B2F7A;--blue:#1E63D6;--sky:#1E9BE8;--ink:#1C2533;--muted:#5D6B82;--line:#DCE5F3;--tint:#F3F7FD}
html,body{margin:0;background:#E9EEF6}
body{font-family:"Open Sans",Arial,sans-serif;color:var(--ink);font-size:12.5px;line-height:1.5}
.sheet{position:relative;max-width:820px;margin:28px auto;background:#fff;padding:40px 44px 28px;box-shadow:0 10px 40px -12px rgba(11,47,122,.25);overflow:hidden}
.sheet::before{content:"";position:absolute;inset:0 0 auto 0;height:8px;background:linear-gradient(90deg,var(--navy) 0 50%,var(--blue) 50% 82%,var(--sky) 82%)}
.head{display:flex;justify-content:space-between;align-items:center;gap:24px}
.logo{height:62px;width:auto;display:block}
.co{text-align:right;font-size:11px;color:var(--muted);line-height:1.65}
.co .nm{font-family:Teko,sans-serif;font-size:22px;line-height:1;color:var(--navy);font-weight:600;letter-spacing:.5px;margin-bottom:4px}
.co .trn{display:inline-block;margin-top:4px;padding:2px 8px;background:var(--tint);border:1px solid var(--line);border-radius:4px;color:var(--navy);font-weight:600}
.speed{margin:18px 0 0;display:grid;gap:3px}
.speed i{display:block;height:2px;background:linear-gradient(90deg,var(--blue),transparent)}
.speed i:nth-child(2){width:70%;background:linear-gradient(90deg,var(--sky),transparent)}
.titlebar{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin:22px 0 20px}
.doc-title{font-family:Teko,sans-serif;font-size:50px;line-height:.85;color:var(--navy);font-weight:600;letter-spacing:2px;margin:0}
.doc-no{margin-top:8px;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:var(--blue);font-weight:600}
.meta{min-width:270px;background:var(--tint);border:1px solid var(--line);border-top:3px solid var(--blue);border-radius:0 0 8px 8px;padding:10px 16px}
.meta div{display:flex;justify-content:space-between;gap:20px;padding:3px 0}
.meta div+div{border-top:1px dashed var(--line)}
.meta span{color:var(--muted);font-size:10px;letter-spacing:1.2px;text-transform:uppercase;padding-top:2px}
.meta b{color:var(--navy);font-weight:600}
.parties{display:flex;gap:16px;margin-bottom:20px}
.card{flex:1;border:1px solid var(--line);border-left:4px solid var(--blue);border-radius:0 8px 8px 0;padding:12px 16px}
.label{font-size:9.5px;letter-spacing:1.8px;text-transform:uppercase;color:var(--blue);font-weight:600;margin-bottom:4px}
.card .nm{font-weight:600;font-size:14px;color:var(--navy)}
.card .sub{color:var(--muted);font-size:11.5px}
.card.due{flex:0 0 260px;background:var(--navy);border-color:var(--navy);border-left-color:var(--sky);color:#fff}
.card.due .label{color:var(--sky)}.card.due .sub{color:rgba(255,255,255,.75)}
.card .big{font-family:Teko,sans-serif;font-size:32px;line-height:1;font-weight:600;letter-spacing:.5px;margin-top:2px}
.subject{margin:-6px 0 18px;padding:8px 14px;background:var(--tint);border-radius:6px}
table{border-collapse:collapse;width:100%}
.items th{background:var(--navy);color:#fff;font-weight:600;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;padding:10px;text-align:left;white-space:nowrap}
.items th:first-child{border-radius:6px 0 0 0}.items th:last-child{border-radius:0 6px 0 0}
.items td{padding:10px;border-bottom:1px solid var(--line);vertical-align:top}
.items tbody tr:nth-child(even) td{background:#F8FAFE}
.items .n{color:var(--blue);font-weight:600;width:34px}
.items .amt{font-weight:600;color:var(--navy)}
.r{text-align:right}
.summary{display:flex;gap:28px;align-items:flex-start;margin-top:20px}
.summary .left{flex:1;display:grid;gap:12px}
.box{border:1px solid var(--line);border-radius:8px;padding:10px 14px}
.box.tint{background:var(--tint);border-color:transparent}
.box .v{color:var(--navy);font-weight:600}
.bank{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;font-size:11.5px}
.bank span{color:var(--muted)}
.tot{width:310px;border:1px solid var(--line);border-radius:8px;overflow:hidden;border-collapse:separate;border-spacing:0}
.tot td{padding:8px 14px}
.tot tr+tr td{border-top:1px solid var(--line)}
.tot .g td{background:var(--blue);color:#fff;font-weight:700;font-size:15px;border-top:0}
.tot .bal td{background:var(--navy);color:#fff;font-weight:700;font-size:14px;border-top:0}
.tot .paid td{color:#1E7A46}
.notes{margin-top:16px;font-size:12px}
.terms{margin-top:16px;padding-top:10px;border-top:1px dashed var(--line);font-size:10.5px;color:var(--muted)}
.sign{display:flex;justify-content:space-between;gap:40px;margin-top:56px}
.sign div{flex:0 0 240px;border-top:1.5px solid var(--navy);padding-top:6px;text-align:center;font-size:11px;color:var(--muted)}
.sign b{display:block;color:var(--navy);font-weight:600}
.foot{margin:28px -44px -28px;padding:14px 44px;background:var(--navy);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:20px;font-size:10.5px}
.foot .tag{font-family:Teko,sans-serif;font-size:20px;letter-spacing:.5px;line-height:1}
.foot .tag em{font-style:normal;color:var(--sky)}
.foot .ct{opacity:.85;text-align:right}
.titlebar{position:relative}
.stamp{position:absolute;top:2px;left:46%;transform:rotate(-14deg);border:3px solid #1E7A46;color:#1E7A46;border-radius:8px;padding:2px 16px;font-family:Teko,sans-serif;font-size:40px;letter-spacing:4px;line-height:1.1;opacity:.75}
@media print{html,body{background:#fff}.sheet{margin:0;max-width:none;box-shadow:none;padding:22px 26px 16px}.sheet::before{height:6px}.foot{margin:20px -26px -16px;padding:12px 26px}.sign{margin-top:34px}.items td{padding:7px 10px}.items th{padding:8px 10px}.logo{height:48px}.co{line-height:1.5}.box{padding:8px 12px}.speed{margin-top:12px}.titlebar{margin:14px 0 14px}.doc-title{font-size:42px}.meta{padding:6px 14px}.parties{margin-bottom:14px}.summary{margin-top:14px}.tot td{padding:6px 12px}.notes,.terms{margin-top:12px}tr,.box,.card,.sign,.foot{break-inside:avoid}}
`;

export function docBody(kind: "invoice" | "quotation", d: Row, s: PrintSettings, received = 0) {
  const items: LineItem[] = d.items?.length ? d.items : [{ description: d.description ?? "", qty: 1, rate: d.amount ?? 0 }];
  const t = docTotals(items, d.discount, d.vat_percent);
  const isQ = kind === "quotation";
  const title = isQ ? "QUOTATION" : s.trn ? "TAX INVOICE" : "INVOICE";
  const no = isQ ? d.quote_no : d.invoice_no;
  const balance = Math.max(0, Math.round((t.total - received) * 100) / 100);
  const paidInFull = !isQ && received > 0 && balance === 0;
  const hasBank = !isQ && (s.iban || s.accountNo);

  const metaRows = [
    [isQ ? "Quotation no" : "Invoice no", esc(no)],
    ["Date", fmtDate(d.issue_date)],
    isQ ? ["Valid until", fmtDate(d.valid_until)] : ["Due date", fmtDate(d.due_date)],
    ...(!isQ && d.lpo_no ? [["LPO / Ref", esc(d.lpo_no)]] : []),
  ];

  return `
  <div class="titlebar">${paidInFull ? `<div class="stamp">PAID</div>` : ""}
    <div><h1 class="doc-title">${title}</h1><div class="doc-no">No. ${esc(no)}</div></div>
    <div class="meta">${metaRows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>
  </div>
  <div class="parties">
    <div class="card"><div class="label">${isQ ? "Prepared for" : "Bill to"}</div>
      <div class="nm">${esc(d.customer_name)}</div>
      ${d.customer_address ? `<div class="sub">${esc(d.customer_address)}</div>` : ""}
      ${d.customer_trn ? `<div class="sub">TRN: <b>${esc(d.customer_trn)}</b></div>` : ""}</div>
    <div class="card due"><div class="label">${isQ ? "Quotation total" : paidInFull ? "Payment status" : "Amount due"}</div>
      <div class="big">${paidInFull ? "Paid in full" : `AED ${money(isQ ? t.total : balance)}`}</div>
      <div class="sub">${isQ ? `Valid until ${fmtDate(d.valid_until)}` : paidInFull ? `Total AED ${money(t.total)} received` : `Due by ${fmtDate(d.due_date)}`}</div></div>
  </div>
  ${d.subject ? `<div class="subject"><span class="label">Subject</span><br><b>${esc(d.subject)}</b></div>` : ""}
  <table class="items">
    <thead><tr><th>#</th><th>Description</th><th class="r">Qty</th><th>Unit</th><th class="r">Rate (AED)</th><th class="r">Amount (AED)</th></tr></thead>
    <tbody>${items.map((l, i) => `<tr><td class="n">${String(i + 1).padStart(2, "0")}</td><td>${esc(l.description)}</td><td class="r">${esc(l.qty)}</td><td>${esc(l.unit ?? "")}</td><td class="r">${money(Number(l.rate) || 0)}</td><td class="r amt">${money(lineAmount(l))}</td></tr>`).join("")}</tbody>
  </table>
  <div class="summary">
    <div class="left">
      <div class="box tint"><div class="label">Amount in words</div><div class="v">${esc(amountInWords(t.total))}</div></div>
      ${hasBank ? `<div class="box"><div class="label">Bank details</div><div class="bank">
        ${s.bankName ? `<span>Bank</span><b>${esc(s.bankName)}</b>` : ""}
        ${s.accountName ? `<span>Account name</span><b>${esc(s.accountName)}</b>` : ""}
        ${s.accountNo ? `<span>Account no</span><b>${esc(s.accountNo)}</b>` : ""}
        ${s.iban ? `<span>IBAN</span><b>${esc(s.iban)}</b>` : ""}
        ${s.swift ? `<span>SWIFT</span><b>${esc(s.swift)}</b>` : ""}</div></div>` : ""}
    </div>
    <table class="tot">
      <tr><td>Subtotal</td><td class="r">${money(t.subtotal)}</td></tr>
      ${t.discount ? `<tr><td>Discount</td><td class="r">- ${money(t.discount)}</td></tr><tr><td>Taxable amount</td><td class="r">${money(t.taxable)}</td></tr>` : ""}
      <tr><td>VAT ${esc(d.vat_percent)}%</td><td class="r">${money(t.vat)}</td></tr>
      <tr class="g"><td>Total (AED)</td><td class="r">${money(t.total)}</td></tr>
      ${!isQ && received > 0 ? `<tr class="paid"><td>Paid</td><td class="r">- ${money(received)}</td></tr><tr class="bal"><td>Balance due</td><td class="r">${money(balance)}</td></tr>` : ""}
    </table>
  </div>
  ${d.notes ? `<div class="notes"><span class="label">Notes</span><br>${esc(d.notes)}</div>` : ""}
  <div class="terms"><span class="label">Terms</span><br>${esc(isQ ? s.quoteTerms : s.invoiceTerms)}</div>
  <div class="sign"><div><b>For ${esc(s.legalName)}</b>Authorised signature &amp; stamp</div><div><b>${isQ ? "Customer acceptance" : "Received by"}</b>Name, signature &amp; date</div></div>`;
}

/** Full printable HTML page: brand header, document body, brand footer. */
export function docHtml(title: string, s: PrintSettings, body: string, logoUrl: string, autoPrint = true) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Teko:wght@400;500;600&display=swap">
  <style>${css}</style></head><body><div class="sheet">
  <div class="head">
    <img class="logo" src="${esc(logoUrl)}" alt="${esc(s.legalName)}">
    <div class="co"><div class="nm">${esc(s.legalName)}</div>${esc(s.address)}<br>Tel: ${esc(s.phone)}${s.email ? " · " + esc(s.email) : ""}${s.trn ? `<br><span class="trn">TRN ${esc(s.trn)}</span>` : ""}</div>
  </div>
  <div class="speed"><i></i><i></i></div>
  ${body}
  <div class="foot"><div class="tag">Where <em>Quality</em> Meets <em>Speed.</em></div><div class="ct">${esc(s.phone)}${s.email ? " · " + esc(s.email) : ""}<br>Thank you for your business</div></div>
  </div>${autoPrint ? `<script>window.onload=function(){(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){setTimeout(function(){window.print()},150)})}</script>` : ""}</body></html>`;
}
