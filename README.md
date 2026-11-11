# HR portal template

A fill-in HR portal in one HTML file. Answer seven setup steps about your organisation and you get the whole portal, with your own companies, people and rules: attendance, leave, targets, payslips, policies, the Friday pack, and the HR side (action queue, people, recruitment, payroll, performance, settings).

It runs in the browser. There is no server and no account, and nothing you type leaves your computer.

**Try it online:** [set up your portal](https://shehrozhanif.github.io/hr-portal-template/) · [see the sample company](https://shehrozhanif.github.io/hr-portal-template/preview.html)

## See it first

Open `preview.html` ([online](https://shehrozhanif.github.io/hr-portal-template/preview.html)). It shows the portal with a made-up sample company, so you can look around before you set anything up. Use **View as** at the top to switch between an employee and the HR people.

## Use it

1. Download this folder (the green **Code** button on GitHub, then **Download ZIP**), or clone it.
2. Open `index.html` in a browser, or use the [online copy](https://shehrozhanif.github.io/hr-portal-template/).
3. Go through the seven steps:
   1. **Organisation.** One company or a group of companies, and their names.
   2. **Working rules.** Grace minutes, the half-day limit, your currency and public holidays.
   3. **Leave.** Days each year for casual, annual and sick leave.
   4. **People.** Name, employee code, job title, company, department, line manager, role, joining date, and office or field. Type them in, or paste a list as CSV. You need one owner, at least one HR person and at least one employee.
   5. **Example employee.** The person whose week the employee pages show.
   6. **Modules.** Switch Recruitment, Payroll, the Friday pack or Performance on or off.
   7. **Review.** Check the answers, then choose **Create my portal**.

To try it without typing, open "Try a sample, or load a setup you saved" on step 1 and choose **Try a sample company**.

### Put it online

`index.html` is a single file, so any static host works. On GitHub: **Settings**, **Pages**, deploy from the `main` branch, root folder. The portal is then at `https://<your-name>.github.io/<repository>/`.

Each visitor's setup and data stay in their own browser. This is a showcase to explore and adapt, not a shared system: two people opening the same link do not see each other's changes.

## Change it after setup

HR and the owner get a pencil button in the top bar, **Customise**, with four tabs:

- **Pages and sections.** Hide, rename, or move any page or section. Untick to hide; clear a name to get the original back.
- **Weeks.** Call a week something else ("Sprint"), give a week its own name, skip a past week (its readings stay, but are not counted), add the weeks ahead, or delete an added week.
- **Lists.** Add, rename and delete companies; delete people; rename, delete and add the example employee's targets; add, rename and delete leave types. A delete can be undone until you close the panel.
- **Rules.** When the shift starts, and which days are worked.

**Undo all changes** puts everything back. **Edit setup** in the ribbon reopens the seven steps, and **Start again** erases the portal after asking.

To move a setup to another computer, open the last step, **Review**, copy the text under "Save this setup", and paste it on step 1 of the other computer.

## What to know

- **It opens on an example week,** Tuesday 10 November 2026, with example activity for your people, so every page has something to show. All figures are made up.
- **The employee side shows one person.** The HR side shows everyone you entered.
- **The shift is 9 hours long.** Its start time can move. Tuesday stays a working day because it is the example day, and Sunday is always a day off.
- **The three built-in leave types can be renamed but not deleted.**
- **Do not enter ID numbers, bank account numbers, phone numbers or home addresses.** The portal does not ask for them and does not need them.

## Work on it

You need [Node.js](https://nodejs.org) 20 or later.

```bash
npm install
```

```bash
npm run build
```

```bash
npm test
```

```bash
npm start
```

- `npm run build` writes `index.html` and `preview.html` from the files in `src/`. Never edit those two by hand.
- `npm test` runs the click test: 123 checks in a browser without a screen. It takes a few minutes.
- `npm start` serves the folder at http://localhost:4174/.

| Path | What it is |
|---|---|
| `index.html` | The template, built. This is the file people open. |
| `preview.html` | The same template, opening straight on the sample company. |
| `src/engine.html` | The portal itself, written around one sample organisation. |
| `src/setup.html` | The setup screen, and the code that fits the portal to a setup. |
| `src/custom.html` | The Customise panel. |
| `build.mjs` | Puts the three together. |
| `test/template.test.js` | The click test. |
| `serve.mjs` | A small local server with no dependencies. |

### How the build works

The engine tells one connected story on one example week: an employee, two HR people, the owner and their colleagues. The build wraps every string in the engine that names someone or some company from the sample, so that at run time it is rewritten with the names from your setup. Each part in the story is given to one of your people. In a small organisation several parts would land on the same person, so example rows about a shared part are dropped and nobody is listed twice.

## Licence

MIT. The template is free: use it, change it and share it, for yourself or for your company. Keep the copyright notice from the `LICENSE` file in your copy.
