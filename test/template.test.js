// Click test for index.html and preview.html: the setup screen, the portal built from its answers, and Customise.
//   npm install, npm run build, then npm test.   Exit code 0 means every check passed.
// It runs the page in jsdom, a browser without a screen. A full run takes a few minutes.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const load = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let JSDOM;
try { ({ JSDOM } = load(process.env.JSDOM_PATH || "jsdom")); }
catch { console.error("jsdom not found. Set JSDOM_PATH (see the top of this file)."); process.exit(2); }

const SKEY = "hr-template-setup-v1", DKEY = "hr-template-data-v1";
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
let errors = [];
function boot(store) {
  const d = new JSDOM("<!doctype html><html><head></head><body>" + html + "</body></html>", {
    url: "https://demo.test/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) { w.scrollTo = () => {}; Object.keys(store || {}).forEach((k) => w.localStorage.setItem(k, store[k])); w.addEventListener("error", (e) => errors.push(e.message)); },
  });
  d.virtualConsole.removeAllListeners("jsdomError");
  return d;
}
let dom, window, doc;
const open = (store) => { dom = boot(store); window = dom.window; doc = window.document; };
const $ = (s) => doc.querySelector(s);
const $$ = (s) => [...doc.querySelectorAll(s)];
const txt = (s) => ($(s) ? $(s).textContent.replace(/\s+/g, " ").trim() : "");
const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
const set = (s, v) => { const el = typeof s === "string" ? $(s) : s; el.value = v; el.dispatchEvent(new window.Event("input", { bubbles: true })); el.dispatchEvent(new window.Event("change", { bubbles: true })); };
const next = () => $("#su-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
const stepNo = () => Number((txt("#su-step-l").match(/Step (\d)/) || [])[1]);
const err = () => ($("#su-err") && !$("#su-err").hidden ? txt("#su-err") : "");
const stored = (k) => JSON.parse(window.localStorage.getItem(k) || "null");
const page = (r) => $(`.page[data-page="${r}"]`);
const viewAs = (v) => { $("#viewas").value = v; $("#viewas").dispatchEvent(new window.Event("change", { bubbles: true })); };
const go = (r) => click($(`.nav [data-route="${r}"]`));
const pf = (i, f) => $(`[data-pi="${i}"][data-pf="${f}"]`);
let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log("  ok   " + name); } else { fail++; console.log("  FAIL " + name); } }
// What a person can read: everything in the page except scripts, styles and the setup screen.
const shown = () => [...doc.body.children].filter((el) => !/^(SCRIPT|STYLE)$/.test(el.nodeName) && el.id !== "setup").map((el) => el.textContent).join(" ");
// Every page of every viewer: returns pages that are hidden or empty, and all the text seen.
function tour() {
  const empty = []; let seen = "";
  $$("#viewas option").map((o) => o.value).forEach((v) => {
    viewAs(v);
    const routes = [...new Set($$(".nav .ng:not([hidden]) [data-route]").map((a) => a.getAttribute("data-route")))].filter((r) => !doc.body.classList.contains("off-" + r));
    routes.forEach((r) => { go(r); if (page(r).hidden || page(r).textContent.trim().length < 80) empty.push(v + ":" + r); seen += " " + shown(); });
  });
  return { empty, seen };
}
const SAMPLE_NAMES = /Ayaan|Lodhi|Saad|Chaudhry|Hina|Qureshi|Farhan|Malik|Imran|Sheikh|Zara|Hashmi|Adeel|Farooqi|Hassan|Naqvi|Nadeem|Rashid|Kamil|Junaid|Abbasi|Faisal|Waqas|Danish|Shakeel|Siddiqi|Solvane|Brightloom|Kestrel|Pixelharbor|Lumora|\bPKR\b|Iqbal Day|Quaid/;
const dupes = (list) => list.filter((x, i) => list.indexOf(x) !== i);

// ---------- The file itself ----------
check("1. the file is the template, and it carries only the made-up sample organisation", /<title>HR Portal Template<\/title>/.test(html) && /Solvane Group/.test(html));

// ---------- A fresh browser: the setup screen ----------
open();
check("2. with nothing saved, the setup screen opens and the portal does not start", !$("#setup").hidden && doc.body.classList.contains("su-on") && !window.TPL && stepNo() === 1 && doc.activeElement === $("#su-body h2"));
check("3. it says that everything stays in this browser and asks for no ID, bank, phone or address", /stays in this browser/.test(txt("#setup")) && /ID numbers, bank accounts, phone numbers or home addresses/.test(txt("#setup")) && $("#su-back").hidden);
next();
check("4. the organisation needs a name", stepNo() === 1 && err().startsWith("Give your organisation a name") && $("#su-org").getAttribute("aria-invalid") === "true" && doc.activeElement === $("#su-org"));
set("#su-org", "Acme <b>Works</b>"); next();
check("5. a group needs its companies named", stepNo() === 1 && /Give company 1 a name/.test(err()));
click($('[name="su-kind"][value="single"]')); $('[name="su-kind"][value="single"]').checked = true; $('[name="su-kind"][value="single"]').dispatchEvent(new window.Event("change", { bubbles: true }));
check("6. One company hides the company list and keeps the typed name, without markup", !$("#su-cos") && $("#su-org").value === "Acme b Works /b" && txt('label[for="su-org"]') === "Company name");
set("#su-org", "Acme Works"); next();
check("7. step 2 asks for the working rules", stepNo() === 2 && !!$("#su-grace") && !!$("#su-half") && $("#su-cur").value === "PKR" && $$("[data-hol]").length === 2);
set("#su-grace", "10"); set("#su-half", "240"); set("#su-cur", "us dollars"); next();
check("8. the currency must be 2 to 4 letters", stepNo() === 2 && /2 to 4 letters/.test(err()));
set("#su-cur", "usd"); set('[data-hol="2026-11-09"]', "Founders day"); set('[data-hol="2026-12-25"]', "Winter break");
set("#su-nhd", "2026-12-25"); set("#su-nhn", "Again"); click($("#su-addhol"));
check("9. a holiday on a date that is taken is refused, by name", /already Winter break/.test(err()));
set("#su-nhd", "2026-12-31"); set("#su-nhn", "Year end"); click($("#su-addhol"));
check("10. a new holiday is added and can be removed", $$("[data-hol]").length === 3 && !!$('[data-delhol="2026-12-31"]') && !$('[data-delhol="2026-11-09"]'));
next();
check("11. step 3 asks for leave days and keeps the rules", stepNo() === 3 && $("#su-ent-casual").value === "10");
set("#su-ent-casual", "5"); set("#su-ent-annual", "two weeks"); next();
check("12. leave days must be whole numbers", stepNo() === 3 && /whole days from 0 to 60 for annual/.test(err()));
set("#su-ent-annual", "20"); set("#su-ent-sick", "6"); next();
check("13. step 4 starts with three people: owner, HR, employee, and no company field for one company", stepNo() === 4 && $$(".su-person").length === 3 && pf(0, "role").value === "owner" && pf(1, "role").value === "hr" && !pf(0, "co"));
next();
check("14. each person needs a name", stepNo() === 4 && /Person 1 needs a name/.test(err()));
[["Olive Stone", "a-1", "Founder", "Lead"], ["Perry Wood", "A-2", "People lead", "People"], ["Quinn Vale", "A-2", "Designer", "Studio"]].forEach((p, i) => { set(pf(i, "name"), p[0]); set(pf(i, "code"), p[1]); set(pf(i, "title"), p[2]); set(pf(i, "dept"), p[3]); });
next();
check("15. two people can't share a code", stepNo() === 4 && /The code A-2 is used twice/.test(err()));
set(pf(2, "code"), "A-3"); set(pf(1, "role"), "employee"); next();
check("16. someone must be HR", stepNo() === 4 && /at least one person the HR role/.test(err()));
set(pf(1, "role"), "hr");
pf(2, "mgr").dispatchEvent(new window.FocusEvent("focusin", { bubbles: true }));
check("17. the line manager list offers the other people by name", [...pf(2, "mgr").options].map((o) => o.textContent).join("|") === "No one|Olive Stone|Perry Wood" && txt('.su-person[data-person="2"] legend') === "Quinn Vale");
set(pf(2, "mgr"), "A-1");
set("#su-csv", "name, code, title\nRiley Park, A-4, Engineer, Acme Works, Studio, A-1, manager, 2024-05-01, field\n, A-9, Nobody"); click($("#su-csvadd"));
check("18. a pasted list adds people, skips its header and reports the line it could not use", $$(".su-person").length === 4 && pf(3, "name").value === "Riley Park" && pf(3, "role").value === "manager" && pf(3, "work").value === "field" && /1 person added\. Line 3 was skipped/.test(txt(".su-ok")));
click($('[data-delp="3"]'));
check("19. a person can be removed", $$(".su-person").length === 3 && txt("#su-pcount") === "3 people");
next();
check("20. step 5 offers only employees as the example employee", stepNo() === 5 && [...$("#su-focus").options].map((o) => o.value).join() === "A-3");
next();
check("21. step 6 lists the four modules, all on", stepNo() === 6 && $$("[data-mod]").length === 4 && $$("[data-mod]").every((n) => n.checked));
next();
check("22. Review shows the answers", stepNo() === 7 && /Acme Works, one company/.test(txt(".su-sum")) && /10:10 AM \(10 minutes grace\)/.test(txt(".su-sum")) && /Casual 5, annual 20, sick 6/.test(txt(".su-sum")) && /Olive Stone/.test(txt(".su-sum")) && txt("#su-next") === "Create my portal");
click($("#su-back")); click($("#su-back"));
check("23. Back keeps every answer", stepNo() === 5 && $("#su-focus").value === "A-3");
next(); next();
const savedText = $("#su-json").value;
next();
const tiny = stored(SKEY);
check("24. Create my portal saves the setup in this browser and reloads", !!tiny && tiny.org.name === "Acme Works" && tiny.people.length === 3 && tiny.focus === "A-3" && tiny.rules.currency === "USD" && window.__tplReload === 1 && errors.length === 0);

// ---------- The portal for a single company of three ----------
open({ [SKEY]: JSON.stringify(tiny) });
check("25. with a setup saved, the portal opens instead of the setup screen", $("#setup").hidden && !doc.body.classList.contains("su-on") && doc.title === "Acme Works HR portal" && !page("my-week").hidden && errors.length === 0);
check("26. View as lists the example employee, the owner (standing in as second HR) and HR", $$("#viewas option").map((o) => o.textContent).join("|") === "Quinn Vale (employee)|Olive (owner)|Perry Wood (HR)");
check("27. the employee side is Quinn's: name, job title and company", /Quinn Vale/.test(txt(".me .who")) && txt(".me .avatar") === "QV" && txt(".bind-desig") === "Designer" && /Acme Works/.test(txt('.page[data-page="my-week"] .phead')));
go("attendance");
check("28. the rules from the setup are used: late after 10:10 AM, and the holiday has its own name", $$(".bind-late").every((n) => n.textContent === "10:10 AM") && /Founders day/.test(page("attendance").textContent + page("my-week").textContent));
go("leave");
check("29. leave days come from the setup", /of 5/.test(txt('.bal[data-bal="casual"]')) && /of 20/.test(txt('.bal[data-bal="annual"]')));
go("payslips");
check("30. money shows in the setup's currency", /USD/.test(page("payslips").textContent) && !/PKR/.test(page("payslips").textContent));
let t = tour();
check("31. every page of every viewer opens with content, and no script error", t.empty.length === 0 && errors.length === 0);
check("32. no sample name, company or currency appears on any page", !SAMPLE_NAMES.test(t.seen));
viewAs("A-2"); go("people");
const ppl = $$("#ppl-list tbody tr").map((tr) => tr.textContent);
check("33. People lists exactly the three people from the setup", /3 active/.test(txt("#ppl-sub")) && ppl.length === 3 && ["Olive Stone", "Perry Wood", "Quinn Vale"].every((n) => ppl.some((r) => r.includes(n))));
go("payroll");
const payNames = $$("#pr-body table tbody tr th").map((n) => n.textContent.replace(/\s+/g, " ").trim());
check("34. nobody is listed twice in payroll", payNames.length > 0 && dupes(payNames).length === 0);
check("35. a single company has no company filters", doc.body.classList.contains("one-co"));
go("hr");
const leaveRow = $$("#hrq li").find((li) => /Quinn Vale/.test(li.textContent) && /Annual leave/.test(li.textContent));
click(leaveRow.querySelector('[data-qact="ok"]')); $("#sheet-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
viewAs("A-3"); go("leave");
check("36. HR approves Quinn's leave and Quinn's own page shows it, with a notification", /Approved/.test(txt("#lreqs li")) && /Perry Wood/.test(txt("#lreqs")) && /unread/.test($("#bell").getAttribute("aria-label")) && !!stored(DKEY));
click($("#tpl-edit"));
check("37. Edit setup opens the setup screen with the saved answers", !$("#setup").hidden && $("#su-org").value === "Acme Works" && !$("#su-cancel").hidden);
next(); next(); next(); next();
check("37b. inside Edit setup the steps still work beside the open portal: people are listed and kept", stepNo() === 5 && errors.length === 0);
click($("#su-back")); click($("#su-back")); click($("#su-back")); click($("#su-back"));
click($("#su-cancel"));
check("37c. Back to the portal closes the setup screen and changes nothing", $("#setup").hidden && !doc.body.classList.contains("su-on") && stored(SKEY).people.length === 3);
click($("#tpl-again"));
check("38. Start again asks first", /Erase this portal\? Yes/.test(txt("#tpl-again")) && !!stored(SKEY));
click($("#tpl-again"));
check("39. the second click erases the setup and the data", !stored(SKEY) && !stored(DKEY) && window.__tplReload === 1);

// ---------- A group of two companies with six people, loaded from saved text ----------
const group = { v: 1, org: { kind: "group", name: "Marlow Mills", companies: [{ key: "x", name: "North Mill" }, { key: "y", name: "South Mill" }] }, rules: { grace: 20, halfMin: 300, currency: "AED", ent: { casual: 8, annual: 21, sick: 10 }, holidays: { "2026-11-09": "Mill day", "2026-12-25": "Year end" } },
  people: [["M1", "Ava Marlow", "Owner", "x", "", "owner"], ["M2", "Ben Hale", "HR officer", "x", "M1", "hr"], ["M3", "Cleo Dunn", "HR officer", "y", "M1", "hr"], ["M4", "Dev Okoro", "Mill manager", "y", "M1", "manager"], ["M5", "Elif Kaya", "Operator", "y", "M4", "employee"], ["M6", "Finn Rios", "Driver", "x", "M4", "employee"]]
    .map((p) => ({ code: p[0], name: p[1], title: p[2], co: p[3], dept: "Mill", mgr: p[4], role: p[5], joining: "2023-02-01", work: p[0] === "M6" ? "field" : "office" })),
  focus: "M5", modules: { recruit: false, payroll: true, friday: true, perf: true } };
open();
set("#su-load", "not a setup"); click($("#su-loadbtn"));
check("40. text that is not a saved setup is refused in plain words", /not a saved setup/.test(txt("#su-load-e")) && stepNo() === 1);
set("#su-load", JSON.stringify(group)); click($("#su-loadbtn"));
check("41. a saved setup loads and goes to Review", stepNo() === 7 && /Marlow Mills, a group of 2 companies/.test(txt(".su-sum")) && /North Mill, South Mill/.test(txt(".su-sum")) && /6 in all/.test(txt(".su-sum")));
next();
const grp = stored(SKEY);
open({ [SKEY]: JSON.stringify(grp) });
check("42. the group portal opens for Elif, with both HR people in View as", doc.title === "Marlow Mills HR portal" && $$("#viewas option").map((o) => o.textContent).join("|") === "Elif Kaya (employee)|Cleo (HR)|Ben Hale (HR)" && errors.length === 0);
t = tour();
check("43. every page of every viewer opens, and only the group's own names show", t.empty.length === 0 && errors.length === 0 && !SAMPLE_NAMES.test(t.seen));
viewAs("M2"); go("people");
check("44. People has the six people and a filter with the two companies", /6 active/.test(txt("#ppl-sub")) && [...$("#ppl-co").options].map((o) => o.textContent).filter((x) => /Mill/.test(x)).join("|") === "North Mill|South Mill" && !doc.body.classList.contains("one-co"));
check("45. Recruitment is switched off: no menu link, no route, no hiring items in the queue", doc.body.classList.contains("off-recruit") && (go("recruit"), page("recruit").hidden) && !/Requisition|Offer:/.test((go("hr"), txt("#hrq"))));
go("today");
const inNames = $$("#tdy-groups .who, #tdy-groups b").map((n) => n.textContent);
check("46. Today counts the group's office people and leaves the field driver out of Not yet in", /Finn Rios/.test(txt("#tdy-groups")) && dupes(inNames.filter((n) => /Kaya|Hale|Dunn|Okoro|Rios/.test(n))).length === 0);
go("hr");
const entry = $$("#hrq li").find((li) => /Elif Kaya/.test(li.textContent) && li.querySelector('[data-qact="no"]') && /Leave/.test(li.textContent));
click(entry.querySelector('[data-qact="no"]')); set("#f-qnote", "Busy week at the mill"); $("#sheet-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
viewAs("M5"); go("leave");
check("47. HR rejects Elif's leave with a reason and Elif sees the reason", /Rejected/.test(txt("#lreqs")) && /Busy week at the mill/.test(txt("#lreqs")));

// ---------- The sample company, and saved text from the first run ----------
open();
click($("#su-sample"));
check("48. Try a sample company fills the setup and goes to Review", stepNo() === 7 && /Solvane Group, a group of 5 companies/.test(txt(".su-sum")) && /Sample company loaded/.test(txt(".su-ok")));
next();
open({ [SKEY]: JSON.stringify(stored(SKEY)) });
t = tour();
check("49. the sample portal opens on every page for every viewer", doc.title === "Solvane Group HR portal" && t.empty.length === 0 && errors.length === 0);
open();
set("#su-load", savedText); click($("#su-loadbtn"));
check("50. the text copied from Review on one computer loads the same setup on another", stepNo() === 7 && /Acme Works, one company/.test(txt(".su-sum")) && /Founders day/.test(txt(".su-sum")));

// ---------- Customise: pages, sections and weeks ----------
const CKEY = "hr-template-custom-v1";
const settle = () => new Promise((r) => setTimeout(r, 0));
const cz = (s) => $("#cz-body " + s);
const tick = (el, on) => { el.focus(); el.checked = on; el.dispatchEvent(new window.Event("change", { bubbles: true })); };
const type = (el, v) => { el.value = v; el.dispatchEvent(new window.Event("input", { bubbles: true })); };
const czTab = (k) => click($(`[data-cztab="${k}"]`));
const secOrder = (r) => $$(`.page[data-page="${r}"] section[aria-labelledby]`).map((x) => x.getAttribute("aria-labelledby"));
const weekCols = () => $$("#mx thead th").filter((th) => th.querySelector("[data-week]") && window.getComputedStyle(th).display !== "none").length;
errors = [];
open({ [SKEY]: JSON.stringify(tiny) });
check("53. the employee has no Customise button; HR and the owner do", $("#cz-btn").hidden && (viewAs("A-2"), !$("#cz-btn").hidden) && (viewAs("A-1"), !$("#cz-btn").hidden));
viewAs("A-2"); click($("#cz-btn"));
check("54. Customise opens a dialog that lists the employee pages and the HR pages", !$("#cz").hidden && doc.activeElement === $("#cz-h") && /Employee pages/.test(txt("#cz-body")) && /HR pages/.test(txt("#cz-body")) && !!cz('[data-czshow="page"][data-id="targets"]') && !!cz('[data-czshow="page"][data-id="today"]'));
check("55. the two home pages can't be hidden", cz('[data-czshow="page"][data-id="my-week"]').disabled && cz('[data-czshow="page"][data-id="hr"]').disabled);
tick(cz('[data-czshow="page"][data-id="people"]'), false);
check("56. unticking People hides it from the menu and says how many things are hidden", $('.nav [data-route="people"]').classList.contains("cz-off") && txt("#cz-count") === "1 thing is hidden or skipped" && doc.activeElement === cz('[data-czshow="page"][data-id="people"]'));
type(cz('[data-czname="page"][data-id="today"]'), "Who is in");
click($("#cz-done"));
check("57. Done closes the dialog and puts focus back on the Customise button", $("#cz").hidden && doc.activeElement === $("#cz-btn"));
go("people"); await settle();
check("58. a hidden page can't be opened: HR lands on the action queue", page("people").hidden && !page("hr").hidden);
go("today"); await settle();
check("59. the renamed page has its new name in the menu, the heading and the top bar", /Who is in/.test(txt('.nav [data-route="today"]')) && txt('.page[data-page="today"] h1') === "Who is in" && txt("#top-title") === "Who is in");
click($("#cz-btn"));
tick(cz('[data-czshow="sec"][data-id="tasks-h"]'), false);
type(cz('[data-czname="sec"][data-id="todo-h"]'), "To do <now>");
const before = secOrder("my-week");
cz('[data-czmove="-1"][data-id="t-h"]').focus(); click(cz('[data-czmove="-1"][data-id="t-h"]'));
check("60. a section moves up its page, and the arrow keeps focus", secOrder("my-week").indexOf("t-h") === before.indexOf("t-h") - 1 && doc.activeElement && doc.activeElement.getAttribute("data-id") === "t-h");
click($("#cz-x"));
viewAs("A-3"); await settle();
check("61. the employee sees it: Tasks is hidden, What needs you is renamed without markup, Targets moved up", $("#tasks-h").closest("section").classList.contains("cz-off") && txt("#todo-h") === "To do now" && secOrder("my-week").indexOf("t-h") < secOrder("my-week").indexOf("todo-h") && errors.length === 0);
const savedCustom = window.localStorage.getItem(CKEY);
open({ [SKEY]: JSON.stringify(tiny), [CKEY]: savedCustom }); await settle();
check("62. the changes are still there after the page is loaded again", $("#tasks-h").closest("section").classList.contains("cz-off") && txt("#todo-h") === "To do now" && $('.nav [data-route="people"]').classList.contains("cz-off"));
// Weeks
go("targets"); await settle();
const readings = Number((txt("#s-met-l").match(/of (\d+) readings/) || [])[1]);
viewAs("A-2"); click($("#cz-btn")); czTab("weeks");
check("63. the Weeks tab lists weeks 1 to 7; this week can't be skipped and there is nothing to delete yet", $$("#cz-body .cz-wk").length === 7 && !cz('[data-czwkcount="7"]') && !!cz('[data-czwkcount="6"]') && !cz("[data-czwkdel]") && /Checked/.test(txt('#cz-body [data-czwk="3"]')));
type($("#cz-word"), "Sprint"); type(cz('[data-czwkname="3"]'), "Launch week");
tick(cz('[data-czwkcount="2"]'), false);
click($("#cz-addwk"));
check("64. a week is added: week 8 is Upcoming and can be deleted", $$("#cz-body .cz-wk").length === 8 && /Upcoming/.test(txt('#cz-body [data-czwk="8"]')) && !!cz('[data-czwkdel="8"]') && /Skipped/.test(txt('#cz-body [data-czwk="2"]')));
click($("#cz-done"));
viewAs("A-3"); go("targets"); await settle();
const heads = $$("#mx thead th [data-week]").map((b) => b.textContent.replace(/\s+/g, " ").trim());
check("65. the board calls weeks Sprint, uses week 3's own name, and has a column for week 8", /^Sprint 1/.test(heads[0]) && /^Launch week/.test(heads[2]) && heads.length === 8 && /^Sprint 8/.test(heads[7]) && /Launch week/.test($$("#mx thead th [data-week]")[2].getAttribute("aria-label")));
check("66. the skipped week's column is gone and its readings are not counted", weekCols() === 7 && Number((txt("#s-met-l").match(/of (\d+) readings/) || [])[1]) < readings);
go("my-week"); await settle();
check("67. My week says Sprint 7 of Q4", /Sprint 7 of Q4/.test(txt('.page[data-page="my-week"] .phead')));
go("targets"); click($$("#mx thead th [data-week]")[7]); await settle();
check("68. the added week opens as Upcoming, with nothing to add and no later week", /Upcoming, not started/.test(txt("#sheet-body .wkstate")) && /Not started/.test(txt("#sheet-body")) && !$('#sheet-body [data-act="reading"]') && $('#sheet-body [data-week="9"]').disabled && /Sprint 8/.test(txt("#sheet-h")));
click($('#sheet-body [data-week="7"]')); click($('#sheet-body [data-week="6"]')); click($('#sheet-body [data-week="5"]')); click($('#sheet-body [data-week="4"]')); click($('#sheet-body [data-week="3"]')); click($('#sheet-body [data-week="2"]')); await settle();
check("69. the skipped week still opens and says it is not counted", /Skipped, not counted/.test(txt("#sheet-body .wkstate")));
click($("#sheet [data-close]"));
viewAs("A-2"); click($("#cz-btn")); czTab("weeks");
click(cz('[data-czwkdel="8"]'));
const afterDelete = doc.activeElement === $("#cz-addwk");
tick(cz('[data-czwkcount="2"]'), true);
check("70. the added week is deleted (focus goes to Add a week) and week 2 is counted again", $$("#cz-body .cz-wk").length === 7 && afterDelete && /Checked/.test(txt('#cz-body [data-czwk="2"]')));
$("#cz").dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
check("71. Escape closes the dialog", $("#cz").hidden && doc.activeElement === $("#cz-btn"));
viewAs("A-3"); go("targets"); await settle();
check("72. the board is back to 7 weeks with every reading counted", weekCols() === 7 && $$("#mx thead th [data-week]").length === 7 && Number((txt("#s-met-l").match(/of (\d+) readings/) || [])[1]) === readings);
viewAs("A-2"); click($("#cz-btn")); click($("#cz-reset"));
check("73. Undo all changes asks first", /Undo everything\? Yes/.test(txt("#cz-reset")) && !!JSON.parse(window.localStorage.getItem(CKEY)).weeks.word);
click($("#cz-reset")); click($("#cz-done")); viewAs("A-3"); go("targets"); await settle();
check("74. then every page, section and week is as it was", !$('.nav [data-route="people"]').classList.contains("cz-off") && txt("#todo-h") === "What needs you" && !$("#tasks-h").closest("section").classList.contains("cz-off") && /^Wk 1/.test($$("#mx thead th [data-week]")[0].textContent.trim()) && secOrder("my-week").join() === before.join());
viewAs("A-2"); click($("#cz-btn")); czTab("pages"); tick(cz('[data-czshow="page"][data-id="today"]'), false); click($("#cz-done"));
click($("#tpl-again")); click($("#tpl-again"));
check("75. Start again also clears the customisation", !window.localStorage.getItem(CKEY) && !stored(SKEY) && errors.length === 0);

// ---------- Customise: Lists (companies, people, targets, leave types) ----------
const carry = () => { const o = {}; for (let i = 0; i < window.localStorage.length; i++) { const k = window.localStorage.key(i); o[k] = window.localStorage.getItem(k); } return o; };
const again = async () => { open(carry()); await settle(); };
const lists = () => { click($("#cz-btn")); czTab("lists"); };
const change = (el, v) => { el.focus(); el.value = v; el.dispatchEvent(new window.Event("change", { bubbles: true })); };
const submitSheet = () => $("#sheet-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
errors = [];
open({ [SKEY]: JSON.stringify(grp) }); viewAs("M2"); lists();
check("76. Lists shows the companies, the people, the example employee's targets and the leave types", ["#cz-co-h", "#cz-pe-h", "#cz-tg-h", "#cz-lv-h"].every((s) => !!$(s)) && $$("#cz-body [data-czco]").length === 2 && $$("#cz-body [data-czpdel]").length === 6 && $$("#cz-body [data-cztg]").length === 5 && $$("#cz-body [data-czlv]").length === 3);
check("77. the owner, HR in View as and the example employee can't be deleted, with the reason", ["M1", "M2", "M3", "M5"].every((c) => cz(`[data-czpdel="${c}"]`).disabled) && !cz('[data-czpdel="M4"]').disabled && /Example employee: can't be deleted here/.test(txt("#cz-body")));
click($("#cz-co-add"));
check("78. a new company needs a name", /Type the new company's name first/.test(txt("#cz-body .su-err")) && doc.activeElement === $("#cz-co-new"));
$("#cz-co-new").value = "north mill"; click($("#cz-co-add"));
check("79. two companies can't share a name", /already a company called north mill/.test(txt("#cz-body .su-err")));
$("#cz-co-new").value = "East Mill"; click($("#cz-co-add"));
check("80. Add company saves the setup and loads the portal again", stored(SKEY).org.companies.map((c) => c.name).join() === "North Mill,South Mill,East Mill" && window.__tplReload === 1);
await again();
check("81. after loading, Customise is open on Lists as the same HR person, and the company is in every filter", !$("#cz").hidden && $("#viewas").value === "M2" && $$("#cz-body [data-czco]").length === 3 && /East Mill added/.test(txt("#cz-count")) && [...$("#ppl-co").options].some((o) => o.textContent === "East Mill") && errors.length === 0);
const southKey = stored(SKEY).org.companies[1].key, eastKey = stored(SKEY).org.companies[2].key;
click(cz(`[data-czcodel="${southKey}"]`));
check("82. a company that is still used can't be deleted, and it says by what", /South Mill is still used by \d+ (person or seat|people and seats)/.test(txt("#cz-body .su-err")) && stored(SKEY).org.companies.length === 3);
change(cz(`[data-czco="${southKey}"]`), "Southside Mill");
await again();
go("people"); await settle();
check("83. renaming a company changes it in the setup and on the pages", stored(SKEY).org.companies[1].name === "Southside Mill" && /Southside Mill/.test(txt("#ppl-list")) && !/South Mill/.test(txt("#ppl-list")) && errors.length === 0);
czTab("lists"); click(cz(`[data-czcodel="${eastKey}"]`));
await again();
check("84. an unused company is deleted, and Undo is offered", stored(SKEY).org.companies.length === 2 && !!$("#cz-undo") && /East Mill deleted/.test(txt("#cz-body .su-ok")));
click($("#cz-undo")); await again();
check("85. Undo puts the company back", stored(SKEY).org.companies.length === 3 && stored(SKEY).org.companies[2].name === "East Mill" && !$("#cz-undo"));
click(cz('[data-czpdel="M6"]')); await again();
go("people"); await settle();
check("86. a person is deleted from the setup and from People", !stored(SKEY).people.some((p) => p.code === "M6") && !/Finn Rios/.test(txt("#ppl-list")) && /5 active/.test(txt("#ppl-sub")) && errors.length === 0);
click($("#cz-undo")); await again();
check("87. Undo brings the person back", stored(SKEY).people.some((p) => p.code === "M6") && $$("#cz-body [data-czpdel]").length === 6);
click($("#cz-done"));
check("88. closing the panel ends the chance to undo", !window.localStorage.getItem("hr-template-undo-v1"));
// A change on the People page reaches the setup and every page
go("people"); click($('#ppl-list [data-person="M5"]')); click($('[data-pedit2="M5"]'));
$("#f-pname").value = "Elif Demir"; submitSheet(); await settle(); await settle();
check("89. renaming the example employee on the People page updates the setup", stored(SKEY).people.find((p) => p.code === "M5").name === "Elif Demir" && window.__tplReload === 1);
await again();
check("90. after loading, her new name is in View as, in the action queue and on her own pages", $$("#viewas option")[0].textContent === "Elif Demir (employee)" && /Elif Demir/.test((go("hr"), txt("#hrq"))) && !/Elif Kaya/.test(txt("#hrq")) && (viewAs("M5"), /Elif Demir/.test(txt(".me .who"))) && $("#cz").hidden && errors.length === 0);
// Targets
viewAs("M2"); lists();
const tg0 = cz("[data-cztg]").getAttribute("data-cztg"), tgName = cz("[data-cztg]").value;
change(cz(`[data-cztg="${tg0}"]`), "Ship the new loom");
click(cz(`[data-cztgdel="${$$("#cz-body [data-cztg]")[1].getAttribute("data-cztg")}"]`));
check("91. a target is renamed, another is deleted with Undo offered, and it is listed to bring back", $$("#cz-body [data-cztg]").length === 4 && !!$("#cz-undo") && $$("#cz-body [data-cztgback]").length === 1 && doc.activeElement === $("#cz-undo"));
click($("#cz-done")); viewAs("M5"); go("my-week"); await settle();
check("92. the employee sees the new name and four targets", /Ship the new loom/.test(txt("#ledger")) && !txt("#ledger").includes(tgName) && $$("#ledger .ttoggle").length === 4);
viewAs("M2"); lists(); click(cz("[data-cztgback]"));
check("93. Bring back restores the deleted target", $$("#cz-body [data-cztg]").length === 5 && !cz("[data-cztgback]"));
click($("#cz-tg-add"));
check("94. Add a target closes the panel and opens the portal's own Add target form", $("#cz").hidden && $("#sheet").classList.contains("on") && /target/i.test(txt("#sheet-h")));
click($("#sheet [data-close]") || $("#scrim"));
// Leave types
lists();
change(cz('[data-czlv="casual"]'), "Personal");
$("#cz-lv-new").value = "Study"; $("#cz-lv-days").value = "lots"; click($("#cz-lv-add"));
check("95. a new leave type needs whole days", /Give Study leave whole days from 0 to 60/.test(txt("#cz-body .su-err")) && !cz("[data-czlvx]"));
$("#cz-lv-new").value = "Study"; $("#cz-lv-days").value = "5"; click($("#cz-lv-add"));
check("96. the leave type is added", $$("#cz-body [data-czlvx]").length === 1 && cz("[data-czlvd]").value === "5");
click($("#cz-done")); viewAs("M5"); go("leave"); await settle();
check("97. the employee's Leave page has four balances, with Personal instead of Casual and Study at 5 days", $$("#l-bals .bal").length === 4 && /Personal/.test(txt('.bal[data-bal="casual"]')) && !/Casual/.test(txt("#l-bals")) && /Study/.test(txt("#l-bals")) && /of 5/.test($$("#l-bals .bal")[3].textContent));
click($('.page[data-page="leave"] [data-open="leave"], .page[data-page="leave"] [data-lreq], .page[data-page="leave"] .phead .btn'));
check("98. Request leave offers the new type", $("#sheet").classList.contains("on") && [...$("#f-ltype").options].some((o) => /^Study/.test(o.textContent)) && [...$("#f-ltype").options].some((o) => /^Personal/.test(o.textContent)));
$("#f-ltype").value = [...$("#f-ltype").options].find((o) => /^Study/.test(o.textContent)).value; $("#f-from").value = "2026-11-18"; $("#f-to").value = "2026-11-18"; $("#f-lreason").value = "Exam"; submitSheet();
viewAs("M2"); lists(); click(cz("[data-czlvdel]"));
check("99. a leave type with a request can't be deleted", /Study leave has 1 request/.test(txt("#cz-body .su-err")) && $$("#cz-body [data-czlvx]").length === 1);
click($("#cz-reset")); click($("#cz-reset")); click($("#cz-done")); viewAs("M5"); go("leave"); await settle();
check("100. Undo all changes gives Casual its name back, and keeps Study because it has a request", /Casual/.test(txt('.bal[data-bal="casual"]')) && $$("#l-bals .bal").length === 4 && /Study/.test(txt("#l-bals")) && errors.length === 0);

// ---------- Customise: Rules (shift start and working days) ----------
const rules = () => { click($("#cz-btn")); czTab("rules"); };
const mwDayT = (n) => $$("#mw-days .day")[n].textContent.replace(/\s+/g, " ");
errors = [];
open({ [SKEY]: JSON.stringify(grp) });
go("attendance"); await settle();
const inBefore = txt(".page[data-page=\"attendance\"] .hero").match(/\d{1,2}:\d{2} [AP]M/)[0];
viewAs("M2"); rules();
check("101. Rules shows a 10:00 AM start and Monday to Saturday as working days; Tuesday and Sunday are fixed", $("#cz-shift").value === "600" && [1, 3, 4, 5, 6].every((d) => cz(`[data-czoff="${d}"]`).checked && !cz(`[data-czoff="${d}"]`).disabled) && cz('[data-czoff="2"]').disabled && cz('[data-czoff="2"]').checked && cz('[data-czoff="0"]').disabled && !cz('[data-czoff="0"]').checked);
change($("#cz-shift"), "540");
check("102. choosing 9:00 AM shows the new shift and the new late time, and keeps focus on the list", /Shift 9:00 AM to 6:00 PM, 9 hours\. Late after 9:20 AM/.test(txt("#cz-shift-sum")) && doc.activeElement === $("#cz-shift"));
click($("#cz-done")); viewAs("M5"); go("attendance"); await settle();
const attText = page("attendance").textContent + page("my-week").textContent;
check("103. every clock time on the employee's pages moves an hour earlier", /9:00 AM/.test(attText) && /6:00 PM/.test(attText) && !/10:00 AM/.test(attText) && !/7:00 PM/.test(attText) && $$(".bind-late").every((n) => n.textContent === "9:20 AM") && !page("attendance").textContent.includes(inBefore));
click($("[data-fixday]")); await settle();
$("#f-time").value = "09:05"; $("#f-why").value = "The machine was busy"; submitSheet(); await settle();
const corr = stored(DKEY).corr[stored(DKEY).corr.length - 1];
check("104. a time typed in a form is on the new clock: 9:05 is kept as 10:05 in the record and shown as 9:05 AM", corr.time === "10:05" && /9:05 AM/.test(page("attendance").textContent) && !/10:05 AM/.test(page("attendance").textContent) && errors.length === 0);
go("my-week"); await settle();
const satBefore = mwDayT(5);
go("leave"); click($('.page[data-page="leave"] .phead .btn')); $("#f-from").value = "2026-11-20"; $("#f-to").value = "2026-11-23"; $("#f-to").dispatchEvent(new window.Event("change", { bubbles: true }));
const sumBefore = txt("#l-sum");
click($("#sheet [data-close]") || $("#scrim"));
viewAs("M2"); rules(); tick(cz('[data-czoff="6"]'), false);
check("105. Saturday can be made a day off", !cz('[data-czoff="6"]').checked && doc.activeElement === cz('[data-czoff="6"]') && JSON.parse(window.localStorage.getItem(CKEY)).rules.off.join() === "6");
click($("#cz-done")); viewAs("M5"); go("my-week"); await settle();
check("106. the employee's week shows Saturday as Off", /Off/.test(mwDayT(5)) && /Day off/.test(mwDayT(5)) && !/Off/.test(satBefore));
go("leave"); click($('.page[data-page="leave"] .phead .btn')); $("#f-from").value = "2026-11-20"; $("#f-to").value = "2026-11-23"; $("#f-to").dispatchEvent(new window.Event("change", { bubbles: true }));
check("107. leave from Friday to Monday now takes 2 days, not 3", /^3 days/.test(sumBefore) && /^2 days/.test(txt("#l-sum")));
click($("#sheet [data-close]") || $("#scrim"));
await again(); viewAs("M5"); go("attendance"); await settle();
check("108. the rules are still there after the page is loaded again", /9:00 AM/.test(page("attendance").textContent) && !/10:00 AM/.test(page("attendance").textContent) && errors.length === 0);
viewAs("M2"); rules(); click($("#cz-reset")); click($("#cz-reset"));
check("109. Undo all changes puts the 10:00 AM shift and the working Saturday back", $("#cz-shift").value === "600" && cz('[data-czoff="6"]').checked);
click($("#cz-done")); viewAs("M5"); go("attendance"); await settle();
check("110. and the pages show 10:00 AM again", /10:00 AM/.test(page("attendance").textContent) && page("attendance").textContent.includes(inBefore) && errors.length === 0);

// ---------- Customise reaches HR's pages too ----------
errors = [];
open({ [SKEY]: JSON.stringify(grp) }); viewAs("M2");
go("hr-la"); await settle();
const leaveCols = $$("#la-bal thead th").length;
click($('[data-latab="att"]') || $$("#la-seg button")[1]); await settle();
const presentBefore = Number($$('tr[data-laatt="M4"] td')[0].textContent);
lists(); $("#cz-lv-new").value = "Study"; $("#cz-lv-days").value = "5"; click($("#cz-lv-add"));
czTab("weeks"); tick(cz('[data-czwkcount="2"]'), false);
czTab("rules"); tick(cz('[data-czoff="6"]'), false);
click($("#cz-done")); await settle();
check("111. HR's Days by person follows the day off: one Saturday less in November for a colleague", Number($$('tr[data-laatt="M4"] td')[0].textContent) === presentBefore - 1);
click($('[data-latab="leave"]') || $$("#la-seg button")[0]); await settle();
check("112. HR's leave table has a column for the added type, with every person's days", $$("#la-bal thead th").length === leaveCols + 1 && /Study, left of 5/.test(txt("#la-bal thead")) && $$('#la-bal tr[data-labal="M4"] td').length === 4 && $$('#la-bal tr[data-labal="M4"] td')[3].textContent === "5" && $$('#la-bal tr[data-labal="M5"] td')[3].textContent === "5");
go("people"); click($('#ppl-list [data-person="M5"]')); await settle();
check("113. the person's profile lists the added type too, and takes its days from the rules", /Study left of 5/.test(txt("#person-leave")) && /Casual left of 8/.test(txt("#person-leave")));
go("settings"); await settle();
check("114. Settings says which leave types were added and where to change them", /Added in Customise: Study, 5 days/.test(txt("#cz-set-extra")));
viewAs("M5"); go("targets"); await settle();
const kpi = $$(".tcard[data-sel]").map((c) => c.getAttribute("data-sel")).find((id) => { click($(`.tcard[data-sel="${id}"]`)); return !!$(".chart"); });
check("115. a weekly number's chart leaves the skipped week out, and its readings say Skipped", !!kpi && $$(".chart .plot .b").length === 6 && $$(".chart .xlab span").map((x) => x.textContent).join("|") === "Wk 1|Wk 3|Wk 4|Wk 5|Wk 6|Wk 7" && /Skipped, not counted/.test(shown()));
go("attendance"); click($('[data-month="2026-10"]')); await settle();
check("116. the attendance calendar marks the skipped week", $$("#cal .wkcol").filter((th) => /Skipped/.test(th.textContent)).length === 1 && /Wk 2/.test($$("#cal .wkcol").find((th) => /Skipped/.test(th.textContent)).textContent) && errors.length === 0);
viewAs("M2"); click($("#cz-btn")); click($("#cz-reset")); click($("#cz-reset")); click($("#cz-done")); go("settings"); await settle();
check("117. Undo all changes clears the note in Settings", !$("#cz-set-extra") && errors.length === 0);

// ---------- The preview build: for showing the template to people ----------
const previewHtml = fs.readFileSync(path.join(__dirname, "..", "preview.html"), "utf8");
const openPreview = (store) => {
  dom = new JSDOM("<!doctype html><html><head></head><body>" + previewHtml + "</body></html>", { url: "https://preview.test/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) { w.scrollTo = () => {}; Object.keys(store || {}).forEach((k) => w.localStorage.setItem(k, store[k])); w.addEventListener("error", (e) => errors.push(e.message)); } });
  dom.virtualConsole.removeAllListeners("jsdomError"); window = dom.window; doc = window.document;
};
errors = [];
openPreview();
check("118. the preview opens straight on the sample company, with no setup screen", $("#setup").hidden && !doc.body.classList.contains("su-on") && !!window.TPL && /Solvane Group/.test(shown()) && !page("my-week").hidden && errors.length === 0);
check("119. it says it is a preview and how to get the template, and has no Edit setup", txt(".ribbon b") === "Preview" && /preview of the HR portal template/.test(txt(".ribbon")) && /Ask us for the template/.test(txt(".ribbon")) && !$("#tpl-edit") && txt("#tpl-again") === "Reset the preview" && /<title>HR Portal Preview<\/title>/.test(previewHtml));
t = tour();
check("120. every page of every viewer opens in the preview", t.empty.length === 0 && errors.length === 0);
viewAs($$("#viewas option")[2].value); click($("#cz-btn")); czTab("weeks"); type($("#cz-word"), "Sprint"); click($("#cz-done"));
check("121. Customise works in the preview and keeps its changes apart from the real template's", !!window.localStorage.getItem("hr-template-preview-custom-v1") && !window.localStorage.getItem(CKEY) && !window.localStorage.getItem(SKEY) && !!window.localStorage.getItem("hr-template-preview-setup-v1"));
click($("#tpl-again")); click($("#tpl-again"));
check("122. Reset the preview asks first, then clears it back to the sample", !window.localStorage.getItem("hr-template-preview-custom-v1") && !window.localStorage.getItem("hr-template-preview-setup-v1") && window.__tplReload === 1 && errors.length === 0);
check("123. the preview is the same template with the preview switch on", /var PREVIEW = true;/.test(previewHtml) && /var PREVIEW = \/\*__PREVIEW__\*\/false;/.test(html));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
