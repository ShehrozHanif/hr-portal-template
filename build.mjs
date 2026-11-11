/* Builds index.html (the template) and preview.html (a look at it with a sample company).

   Run:  npm install   (once)
         npm run build

   src/engine.html is the portal itself, written around one sample organisation ("Solvane Group").
   src/setup.html is the setup screen, and src/custom.html is the Customise panel. This script
   1. swaps the fixed roster, companies and viewers in the engine for ones built from the setup (window.TPL),
   2. wraps every string in the engine's script that names a sample person, company, code or currency in RC(),
      which rewrites it at run time with the names from the setup,
   3. adds the setup screen and the Customise panel in front of the portal. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const load = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const NM = process.env.ACORN_PATH || path.join(dir, "node_modules");
const acorn = load(path.join(NM, "acorn"));
const walk = load(path.join(NM, "acorn-walk"));

let s = fs.readFileSync(path.join(dir, "src", "engine.html"), "utf8");
const must = (a) => { if (!s.includes(a)) throw new Error("missing in src/engine.html: " + a.slice(0, 80)); };
const R = (a, b) => { must(a); s = s.split(a).join(b); };
const R1 = (a, b) => { must(a); s = s.replace(a, () => b); };

/* The sample organisation the engine is written around: name, short name (or null), part in the story. */
const PEOPLE = [
  ["Ayaan Lodhi", "Ayaan", "focus"], ["Saad Chaudhry", "Saad", "hr1"], ["Hina Qureshi", "Hina", "hr2"], ["Farhan Malik", null, "owner"],
  ["Imran Sheikh", "Imran", "manager"], ["Zara Hashmi", null, "manager"], ["Adeel Farooqi", null, "manager"], ["Hassan Naqvi", null, "manager"],
  ["Nadeem Baig", null, "staff"], ["Rashid Mirza", null, "staff"], ["Kamil", null, "staff"], ["Junaid Abbasi", null, "staff"], ["Faisal Rana", null, "staff"], ["Waqas", null, "staff"], ["Danish", null, "staff"],
  ["Shakeel", null, "former"], ["Omar Siddiqi", null, "former"]
];
/* Its companies: name, key, and whose company it is in the story. */
const COS = [["Solvane Group", "solvane", "hr"], ["Brightloom Studio", "brightloom", ""], ["Kestrel Trading", "kestrel", ""], ["Pixelharbor Labs", "pixelharbor", "focus"], ["Lumora Energy", "lumora", ""]];

/* ---------- 2. Roster, companies and viewers come from the setup ---------- */
R1(`(function () {\n  "use strict";\n  var MOTION`, `(function () {\n  "use strict";\n  if (!window.TPL) return;\n  var TPL = window.TPL, RC = TPL.rc, RCG = TPL.rcg;\n  var MOTION`);
{
  const a = s.indexOf("  var CO_NAME = {"), b = s.indexOf("\n", a);
  if (a < 0) throw new Error("CO_NAME"); s = s.slice(0, a) + "  var CO_NAME = TPL.coNames;" + s.slice(b);
  const v = s.indexOf("  var VIEWERS = {"), v2 = s.indexOf("\n", v);
  if (v < 0) throw new Error("VIEWERS"); s = s.slice(0, v) + "  var VIEWERS = TPL.viewers;" + s.slice(v2);
}
R1(`    return R.map(function (r) { return { code: r[0],`, `    return TPL.roster(R.map(function (r) { return { code: r[0],`);
R1(`login: r[12] === "active" && noLogin.indexOf(r[0]) < 0, log: [] }; });\n  }`, `login: r[12] === "active" && noLogin.indexOf(r[0]) < 0, log: [] }; }));\n  }`);
{
  const a = s.indexOf("  var COS = ["), b = s.indexOf("\n  ];", a);
  if (a < 0 || b < 0) throw new Error("COS"); s = s.slice(0, a) + "  var COS = TPL.cos([" + s.slice(a + "  var COS = [".length, b) + "\n  ]);" + s.slice(b + "\n  ];".length);
}
R1(`  var KEY = "edge-portal-demo-v11";`, `  var KEY = TPL.dataKey;`);
R1(`    if (!ROUTES[r]) r = "my-week";`, `    if (!ROUTES[r] || TPL.off[r]) r = isHR() ? "hr" : "my-week";`);
R1(`    return q.sort(function (a, b) { if (!!b.overdue`, `    return q.filter(TPL.kindOn).sort(function (a, b) { if (!!b.overdue`);
/* A seed line about a colleague who may not have a part of their own in a small organisation */
R1(`    m["2026-10"].lines["BL-02"].absent = 1;`, `    (m["2026-10"].lines["BL-02"] || {}).absent = 1;`);
/* Payroll covers everyone from the setup, with example pay */
R1(`  function staffList() { return [`, `  function staffList() { return TPL.staff([`);
R1(`  ]; }
  var STAFF = staffList();`, `  ]); }
  var STAFF = staffList();`);
/* Today: everyone from the setup who works in the office has an example punch */
R1(`    return { silent: false, punches: {`, `    return TPL.today({ silent: false, punches: {`);
R1(`leave: {}, newPunches: 0 };`, `leave: {}, newPunches: 0 });`);
/* Customise: page names, and weeks that can be skipped, named or added (src/custom.html) */
R1(`    $("#top-title").textContent = ROUTES[r];`, `    $("#top-title").textContent = TPL.pageName(r, ROUTES[r]);`);
R1(`WEEKS.concat([NOW_W]).map(function (w, k) {`, `WEEKS.concat([NOW_W]).concat(TPL.wkUp()).map(function (w, k) {`);
R1(`        else out.push({ cls: "c-late", text: "", sr: "Week " + (k + 1) + ": late" });\n      }\n    }\n    return out;`, `        else out.push({ cls: "c-late", text: "", sr: "Week " + (k + 1) + ": late" });\n      }\n    }\n    return out.concat(TPL.wkCells());`);
R1(`if (t.kind === "kpi") t.hist.forEach(function (v) { all++; if (!miss(t, v)) met++; }); });`, `if (t.kind === "kpi") t.hist.forEach(function (v, wk) { if (TPL.wkSkipped(wk + 1)) return; all++; if (!miss(t, v)) met++; }); });`);
R1(`    if (n < 1 || n > CUR) return;\n    openSheet("Week " + n`, `    if (n < 1 || n > CUR + TPL.wkExtra()) return;\n    openSheet("Week " + n`);
R1(`      var v = n < CUR ? t.hist[n - 1] : t.w46;\n`, `      var v = n < CUR ? t.hist[n - 1] : t.w46;\n      if (n > CUR) return '<li><span><span class="v">' + esc(t.name) + '</span><span class="m"> Plan ' + planText(t) + '</span></span><span class="wv"><span class="badge b-mute">Not started</span></span></li>';\n`);
R1(`(now ? "This week" : "Closed, checked") + '</span><button type="button" class="btn small" data-week="' + (n + 1) + '"' + (n >= CUR ? " disabled" : "")`, `TPL.wkState(n, now) + '</span><button type="button" class="btn small" data-week="' + (n + 1) + '"' + (n >= CUR + TPL.wkExtra() ? " disabled" : "")`);
R1(`  window.addEventListener("resize", placePills);`, `  TPL.redraw = function () { renderAll(false); };\n  TPL.eng = { S: function () { return S; }, commit: commit, save: save, toast: toast, LTYPES: LTYPES, addTarget: sheetTAdd };\n  TPL.startCustom();\n  window.addEventListener("resize", placePills);`);
R1(`    $("#l-bals").innerHTML = ["casual", "annual", "sick"].map(function (t) {`, `    $("#l-bals").innerHTML = Object.keys(ENT).map(function (t) {`);
/* Customise, rules: extra days off (Sunday is always off in the example week) */
R1(`    if (dow === 0 || HOLI[iso] || (r && (r.s === "holiday" || r.s === "off"))) return r;`, `    if (TPL.offDay(dow)) return { s: "off" };\n    if (dow === 0 || HOLI[iso] || (r && (r.s === "holiday" || r.s === "off"))) return r;`);
R1(`var dow = new Date(iso + "T00:00:00Z").getUTCDay(), hol = HOLI[iso], lp = dow !== 0 && !hol ? leaveOn`, `var dow = new Date(iso + "T00:00:00Z").getUTCDay(); if (TPL.offDay(dow)) dow = 0; var hol = HOLI[iso], lp = dow !== 0 && !hol ? leaveOn`);
R1(`if (w !== 0 && !HOLI[d]) n++;`, `if (w !== 0 && !TPL.offDay(w) && !HOLI[d]) n++;`);
R1(`      if (r && r.s === "leave") { st = "Leave"; col = "var(--dye)"; tm = esc(r.note); }\n      else if (!r || d > TODAY)`, `      if (r && r.s === "off") { st = "Off"; col = ""; tm = "Day off"; }\n      else if (r && r.s === "leave") { st = "Leave"; col = "var(--dye)"; tm = esc(r.note); }\n      else if (!r || d > TODAY)`);
/* Customise, closing the gaps: every leave type on HR's pages, skipped weeks marked, example attendance follows days off */
R1(`<th scope="col">Casual, left of ' + ENT.casual + '</th><th scope="col">Annual, left of ' + ENT.annual + '</th><th scope="col">Sick, left of ' + ENT.sick + '</th>`, `' + Object.keys(ENT).map(function (t) { return '<th scope="col">' + esc(LTYPES[t]) + ", left of " + ENT[t] + "</th>"; }).join("") + '`);
{
  const a = s.indexOf("      var row = p.code === ME ? [b.casual.left, b.annual.left, b.sick.left] : hb ?"), b = s.indexOf("\n", a);
  if (a < 0) throw new Error("leave table row");
  s = s.slice(0, a) + "      var row = Object.keys(ENT).map(function (t, k) { return p.code === ME ? b[t].left : hb ? hb[t].left : ENT[t] - ((EXBAL[p.code] || [])[k] || 0); });" + s.slice(b);
}
R1(`id="person-leave"><div><b>' + b.casual.left + "</b><span>Casual left of 10</span></div><div><b>" + b.annual.left + "</b><span>Annual left of 14</span></div><div><b>" + b.sick.left + "</b><span>Sick left of 8</span></div><div><b>" + S.leave.filter`, `id="person-leave">' + Object.keys(ENT).map(function (t) { return "<div><b>" + b[t].left + "</b><span>" + esc(LTYPES[t]) + " left of " + ENT[t] + "</span></div>"; }).join("") + "<div><b>" + S.leave.filter`);
R1(`    var nums = vals.filter(function (v) { return v != null; }).concat([t.plan]), lo, hi;`, `    if (!t.weeks) { var keepW = labels.map(function (w, k) { return !TPL.wkSkipped(k + 1); }); labels = labels.filter(function (w, k) { return keepW[k]; }); vals = vals.filter(function (v, k) { return keepW[k]; }); states = states.filter(function (v, k) { return keepW[k]; }); }\n    var nums = vals.filter(function (v) { return v != null; }).concat([t.plan]), lo, hi;`);
R1(`return { w: (t.weeks || WEEKS)[k], v: v, st: "Checked" }; }).reverse();`, `return { w: (t.weeks || WEEKS)[k], v: v, st: !t.weeks && TPL.wkSkipped(k + 1) ? "Skipped, not counted" : "Checked" }; }).reverse();`);
R1(`'">Wk ' + n + "</button>" : '<span class="wkb off"`, `'">Wk ' + n + (TPL.wkSkipped(n) ? '<small class="wkskip">Skipped</small>' : "") + "</button>" : '<span class="wkb off"`);
R1(`: EXATT[laMonth][p.code];`, `: TPL.exAtt(EXATT[laMonth][p.code], laMonth);`);
/* Rules from the setup */
R1(`  function seedSet() { return { grace: 15, halfMin: 270,`, `  function seedSet() { return { grace: TPL.cfg.rules.grace, halfMin: TPL.cfg.rules.halfMin,`);
R1(`ent: { casual: 10, annual: 14, sick: 8 }, holidays: { "2026-11-09": "Iqbal Day", "2026-12-25": "Quaid-e-Azam Day" }, log: [] }; }`, `ent: JSON.parse(JSON.stringify(TPL.cfg.rules.ent)), holidays: JSON.parse(JSON.stringify(TPL.cfg.rules.holidays)), log: [] }; }`);
/* Viewer labels: the owner can stand in as the second HR person */
R(`"<b>" + esc(me.name) + "</b><small>" + me.role + "</small>"`, `"<b>" + esc(me.name) + "</b><small>" + (me.label || me.role) + "</small>"`);

/* ---------- 3. Wrap the strings that name the sample organisation ---------- */
const TOKENS = [...PEOPLE.map((p) => p[0]), ...PEOPLE.map((p) => p[1]).filter(Boolean), ...COS.map((c) => c[0]), ...COS.map((c) => c[1]), "Platform Engineer", "HR Consultant", "HR & Admin Executive", "PKR", "Iqbal Day", "Quaid-e-Azam Day"];
const sStart = s.lastIndexOf("<script>") + "<script>".length, sEnd = s.lastIndexOf("</script>");
let js = s.slice(sStart, sEnd);
const ast = acorn.parse(js, { ecmaVersion: 2022, sourceType: "script" });
/* Person codes of the sample roster, read from the roster itself. */
const rosterCodes = [];
walk.simple(ast, { FunctionDeclaration(n) { if (n.id.name !== "seedPeople") return; walk.simple(n, { ArrayExpression(a) { const f = a.elements[0]; if (a.elements.length === 16 && f && f.type === "Literal") rosterCodes.push({ code: f.value, name: a.elements[1].value, status: a.elements[12].value }); } }); } });
if (rosterCodes.length !== 21) throw new Error("roster rows: " + rosterCodes.length);
const castCodes = rosterCodes.filter((r) => r.status !== "to_hire");
castCodes.forEach((r) => { if (!PEOPLE.some((p) => p[0] === r.name)) throw new Error("roster person without a part: " + r.name); TOKENS.push(r.code); });
const TOK = new RegExp("(?<![A-Za-z0-9])(" + TOKENS.slice().sort((a, b) => b.length - a.length).map((t) => t.replace(/[.*+?^${}()|[\]\\\/-]/g, "\\$&")).join("|") + ")(?![A-Za-z0-9])");
const KEYS = COS.map((c) => c[1]);
const edits = [];
/* Tables of example rows (top-level literals and the seed functions) keep only rows about a person's own part:
   their strings go through RCG, which marks the parts that had to share a person, and TPL.prune drops those rows. */
const top = ast.body[0].expression.callee.body;
const wrapped = new Set();
const inTable = (anc) => anc.some((a, i) => wrapped.has(a) || (a.type === "VariableDeclarator" && anc[i - 2] === top && a.init && /^(Array|Object)Expression$/.test(a.init.type)) || (a.type === "FunctionDeclaration" && /^seed/.test(a.id.name) && a.id.name !== "seedPeople"));

const pruneWrap = (node) => { if (!node || wrapped.has(node)) return; wrapped.add(node); edits.push([node.start, node.start, "TPL.prune("]); edits.push([node.end, node.end, ")"]); };
walk.ancestor(ast, {
  VariableDeclarator(n, anc) { if (anc[anc.length - 3] === top && n.init && /^(Array|Object)Expression$/.test(n.init.type) && TOK.test(js.slice(n.init.start, n.init.end))) pruneWrap(n.init); },
  /* Any list of rows (objects or tuples) that names someone, wherever it is written. The roster itself is left whole. */
  ArrayExpression(n, anc) { if (n.elements.length && n.elements.every((e) => e && /^(Array|Object)Expression$/.test(e.type)) && !anc.some((a) => a.type === "FunctionDeclaration" && a.id.name === "seedPeople") && TOK.test(js.slice(n.start, n.end))) pruneWrap(n); },
  ReturnStatement(n, anc) { const fn = anc.slice().reverse().find((a) => /^Function/.test(a.type)); if (fn && fn.type === "FunctionDeclaration" && /^seed/.test(fn.id.name) && fn.id.name !== "seedPeople" && n.argument) pruneWrap(n.argument); }
});
walk.ancestor(ast, {
  Literal(n, anc) {
    if (n.regex) { if (TOK.test(n.regex.pattern)) throw new Error("a regular expression names the sample organisation: " + n.raw); return; }
    if (typeof n.value !== "string" || !TOK.test(n.value)) return;
    edits.push([n.start, n.end, (inTable(anc) ? "RCG(" : "RC(") + n.raw + ")"]);
  },
  Property(n) { if (!n.computed && !n.shorthand && n.key.type === "Identifier" && KEYS.indexOf(n.key.name) >= 0) edits.push([n.key.start, n.key.end, '[RC("' + n.key.name + '")]']); },
  /* acorn-walk does not visit plain property keys, so quoted keys are wrapped here. */
  ObjectExpression(n, anc) { n.properties.forEach((p) => { if (p.type === "Property" && !p.computed && p.key.type === "Literal" && typeof p.key.value === "string" && TOK.test(p.key.value)) edits.push([p.key.start, p.key.end, "[" + (inTable(anc) ? "RCG(" : "RC(") + p.key.raw + ")]"]); }); },
  TemplateLiteral(n) { if (n.quasis.some((q) => TOK.test(q.value.raw))) throw new Error("a template string names the sample organisation"); },
  MemberExpression(n) { if (!n.computed && KEYS.indexOf(n.property.name) >= 0) throw new Error("a company key is used as ." + n.property.name); }
});
edits.sort((a, b) => b[0] - a[0] || (b[1] - b[0]) - (a[1] - a[0])).forEach(([a, b, t]) => { js = js.slice(0, a) + t + js.slice(b); });
acorn.parse(js, { ecmaVersion: 2022, sourceType: "script" });

/* ---------- 4. The setup screen ---------- */
const setup = fs.readFileSync(path.join(dir, "src", "setup.html"), "utf8");
const part = (a, b) => { const i = setup.indexOf(a) + a.length, j = b ? setup.indexOf(b) : setup.length; if (i < a.length || j < 0) throw new Error("src/setup.html part " + a); return setup.slice(i, j).trim(); };
const custom = fs.readFileSync(path.join(dir, "src", "custom.html"), "utf8");
const cpart = (a, b) => { const i = custom.indexOf(a) + a.length, j = b ? custom.indexOf(b) : custom.length; if (i < a.length || j < 0) throw new Error("src/custom.html part " + a); return custom.slice(i, j).trim(); };
const css = part("<!--CSS-->", "<!--HTML-->") + "\n" + cpart("<!--CSS-->", "<!--HTML-->"), html = part("<!--HTML-->", "<!--JS-->") + "\n" + cpart("<!--HTML-->", "<!--JS-->");
let sjs = part("<!--JS-->", null);
const cls = (name) => PEOPLE.find((p) => p[0] === name)[2];
const DEMO = {
  people: castCodes.map((r) => { const p = PEOPLE.find((x) => x[0] === r.name); return { code: r.code, name: r.name, short: p[1] || null, cls: p[2] }; }),
  rosterCodes: rosterCodes.map((r) => r.code),
  cos: COS.map((c) => ({ key: c[1], name: c[0], cls: c[2] })), cosFocusIdx: 3,
  titles: { focus: "Platform Engineer", hr1: "HR Consultant", hr2: "HR & Admin Executive" }, cur: "PKR",
  hol: { "2026-11-09": "Iqbal Day", "2026-12-25": "Quaid-e-Azam Day" }, ent: { casual: 10, annual: 14, sick: 8 }
};
/* The sample company is the sample roster itself, so "Try a sample company" shows the portal exactly as designed. */
const rows = [];
walk.simple(ast, { FunctionDeclaration(n) { if (n.id.name !== "seedPeople") return; walk.simple(n, { ArrayExpression(a) { if (a.elements.length === 16 && a.elements[0].type === "Literal") rows.push(a.elements.map((e) => e.value)); } }); } });
const roleOf = (r) => (r[3] === "owner" ? "owner" : r[3] === "hr" ? "hr" : cls(r[1]) === "manager" ? "manager" : "employee");
const SAMPLE = {
  v: 1, org: { kind: "group", name: "Solvane Group", companies: COS.map((c) => ({ key: c[1], name: c[0] })) },
  rules: { grace: 15, halfMin: 270, currency: "PKR", ent: DEMO.ent, holidays: DEMO.hol },
  people: rows.filter((r) => r[12] === "active").map((r) => ({ code: r[0], name: r[1], title: r[2], co: r[4], dept: r[5], mgr: r[6], role: roleOf(r), joining: r[8], work: r[9] })),
  focus: castCodes.find((r) => cls(r.name) === "focus").code, hr1: castCodes.find((r) => cls(r.name) === "hr1").code, modules: { recruit: true, payroll: true, friday: true, perf: true }
};
sjs = sjs.replace("/*__DEMO__*/null", () => JSON.stringify(DEMO)).replace("/*__SAMPLE__*/null", () => JSON.stringify(SAMPLE));
if (sjs.includes("__DEMO__") || sjs.includes("__SAMPLE__")) throw new Error("setup placeholders");

const extraCss = `
/* Template: modules that are switched off, and single-company portals */
${["recruit", "payroll", "payslips", "friday", "perf"].map((r) => `.off-${r} [data-route="${r}"], .off-${r} a[href="#${r}"]`).join(", ")} { display: none !important; }
.one-co .field:has(#ppl-co), .one-co .field:has(#la-co), .one-co .field:has(#ht-co) { display: none !important; }
`;
let out = s.slice(0, sStart - "<script>".length);
const styleEnd = out.lastIndexOf("</style>");
out = out.slice(0, styleEnd) + css + "\n" + extraCss + out.slice(styleEnd);
out = out + html + "\n" + sjs + "\n" + cpart("<!--JS-->", null) + "\n<script>" + js + "</script>" + s.slice(sEnd + "</script>".length);
fs.writeFileSync(path.join(dir, "index.html"), out);
/* The preview: the same file, opening on the sample company (see PREVIEW in src/setup.html). */
if (!out.includes("/*__PREVIEW__*/false") || !out.includes("<title>HR Portal Template</title>")) throw new Error("preview markers");
fs.writeFileSync(path.join(dir, "preview.html"), out.replace("/*__PREVIEW__*/false", "true").replace("<title>HR Portal Template</title>", "<title>HR Portal Preview</title>"));
console.log("built index.html and preview.html: " + edits.length + " strings wrapped, " + castCodes.length + " parts, " + Math.round(out.length / 1024) + " KB");
