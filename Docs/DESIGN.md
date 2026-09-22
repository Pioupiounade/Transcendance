# Pioupiounades — Design reference

*"Warm by nature, clear in every detail."* An evolution of Direction B: pill buttons, floating-label fields and the neighbourhood illustration are kept; **forest green becomes the action colour, terracotta brings the warmth.**
Every value below is the one used in `styles.css`. Files: `index.html` · `styles.css` · `script.js`.

---

## 1. Colour palette

### Core

| Token | Hex | Role |
|---|---|---|
| Forest — `--brand` | `#265C4B` | Primary action, trust, active states, markers |
| Forest hover — `--brand-hover` | `#1D493B` | Primary button on hover |
| Forest pressed — `--brand-press` | `#153A2F` | Primary button while pressed |
| Terracotta — `--terra` | `#B65339` | Accent, eyebrows, focus ring, "social" marker |
| Cream — `--surface` | `#F8F5EF` | Page background |
| Warm white — `--ground` | `#FFFEFA` | Cards, header, panels, inputs |
| Sage — `--trust-soft` | `#E5EEDF` | Positive backgrounds, tags, focus halo, notes |
| Ink — `--ink` | `#263F36` | Text, toast background |

### Secondary

| Token | Hex | Role |
|---|---|---|
| Muted text — `--muted` | `#65736B` | Secondary text, metadata, labels |
| Border — `--line` | `#DDDCD2` | Borders, dividers |
| Error — `--danger` | `#B93832` | Error border, error text |
| Error soft — `--danger-soft` | `#FBEDEA` | Error background |
| Culture | `#90681F` | "Culture" category marker |
| Culture tag | bg `#F6EBCA` · text `#78551B` | Category tag |
| Social tag | bg `#F8E3D8` · text `#A04B34` | Category tag |
| Environment tag | bg `#E5EEDF` · text `#265C4B` | Category tag |
| Avatar | bg `#F2D6BC` · text `#62452E` | User initials |
| Map ground | `#E5EACF` · border `#CBD8BC` | Illustrative map |
| Demo bar | bg `#ECEFE6` · text `#536253` | Prototype navigation strip |
| Neighbour note | bg `#EEE8D8` · text `#69715D` | Soft reassurance block |
| Selected card | bg `#F3F6EA` | Action card selected state |

### Contrast (WCAG)

- White on Forest: **7.7:1** · Ink on Cream: **10.5:1** · White on Terracotta: **4.9:1**.
- Categories always combine a colour, an icon and a label — colour alone never carries meaning.

---

## 2. Typography

Font stack: `"Avenir Next", "Nunito Sans", Avenir, system-ui, sans-serif` (no webfont file is loaded; Nunito Sans is the free fallback for Avenir Next).

| Style | Size / line-height | Weight | Letter-spacing | Used for |
|---|---|---|---|---|
| Display / H1 (dashboard) | 32 px / 1.15 | 700 | −1 px | Page title |
| H1 (auth card) | 29 px | 700 | −0.8 px | Sign in / Sign up |
| H1 (profile) | 29 px | 700 | — | Profile name |
| H1 (UI sheet) | 36 px | 700 | −1.2 px | Reference sheet |
| H2 | 22 px | 700 | — | Sections |
| H2 (list, panel) | 19 px | 700 | −0.5 px | "On se retrouve où ?", panels |
| H3 (card) | 17 px / 1.35 | 700 | −0.3 px | Action card title |
| Body | 16 px / 1.5 | 400 | 0 | Running text |
| Lead | 15 px | 400 | — | Intro under titles, muted |
| Nav link | 14 px | 600 | — | Main navigation |
| Small / meta | 12–13 px | 400–600 | — | Metadata, captions, help text |
| Eyebrow | 12 px | 800 | 1.8 px, uppercase | Terracotta label above titles |
| Wordmark | 25 px | 800 | −1.2 px | "pioupiounades" |
| Tag | 11 px | 700 | 0.3 px | Category tags |

Mobile (≤ 760 px): dashboard H1 28 px · auth H1 26 px · UI-sheet H1 30 px · nav hidden.

---

## 3. Spacing, radii, elevation

- **Spacing scale**: 4 · 8 · 12 · 16 · 24 · 32 · 40 · 64 px (`--s1`…`--s6`).
- **Desktop grid**: 38 px page margins · flexible map + 340 px list · 22 px gutter (375 px list above 1500 px).
- **Radii**: fields 12 px · buttons 999 px (pill) · chips 30 px · action card 19 px · panels 22 px · cards/dialogs 24 px · map 25 px · location chip 15 px · tags 7 px · map controls 13 px.
- **Shadow**: `0 8px 30px #263F3610` (`--shadow`). Outline structures, shadow only underlines.
- **Borders**: 1 px `#DDDCD2` everywhere; selected card 1.5 px forest.

---

## 4. Buttons

Base `.btn`: inline-flex, height **44 px**, padding 0 20 px, radius 999 px, 1.5 px transparent border, **14 px / 700**, transition 120 ms. Large `.btn--l`: 52 px, padding 0 24 px, 16 px (auth quick buttons: 46 px). `.btn--block`: full width.

| Variant | Rest | Hover | Pressed | Disabled |
|---|---|---|---|---|
| Primary `.btn--primary` | bg `#265C4B`, white text | `#1D493B` | `#153A2F` | bg `#E2E4DC`, text `#687267` |
| Secondary `.btn--secondary` | bg `#FFFEFA`, border `#DDDCD2`, ink text | bg `#EEEDE4` | bg `#EFEFEC` | — |
| Text `.btn--text` | ink, 14 px / 600, underline offset 4 px | text `#65736B` | — | — |

- **Focus** (all controls): 3 px terracotta outline `#B65339`, 3 px offset.
- Loading: disabled + label "Connexion…".
- Rule: **one primary button per decision zone.**

---

## 5. Form fields

Floating-label field `.field`: input **58 px** high, padding 26 16 8 px, 16 px text, radius 12 px, border 1 px (`#DDDCD2`; `#BCBFB4` on the auth card; `#A8B0A6` on the UI sheet). Label sits at 17/19 px, moves to 9 px top and **13 px / 600** when focused or filled.

| State | Style |
|---|---|
| Default | border `--line`, label muted |
| Focus | border forest `#265C4B`, halo `0 0 0 3px #E5EEDF` (auth) — 2 px border + 3 px sage halo on the sheet |
| Filled | label small, text ink |
| Error | border + inset ring `#B93832`, label red, help line in red with alert icon |
| Disabled | bg cream, muted text, `cursor: not-allowed` |

Grouped fields `.field-group` share borders (−1 px overlap, outer radii only); side-by-side at ≥ 768 px.
Help text `.help`: 13 px / 600 muted, 6 px under the field, linked with `aria-describedby`. Password: "Afficher / Masquer" text toggle inside the field. Consent checkbox 20 px, accent ink.
Rule: always a visible label; errors explain what is wrong and how to fix it; the neighbourhood is editable — no forced geolocation.

---

## 6. Components

- **Top bar**: 86 px, warm white, 1 px bottom border, 38 px side padding; wordmark + pin brandmark 31×35; nav links 14 px / 600 with a 3 px forest underline on the active item; avatar 42 px circle with 3 px warm-white ring. 72 px on mobile, nav hidden.
- **Category chip**: 30 px radius, padding 10 16, 14 px, icon + label; pressed = forest background, white text; hover = forest border.
- **Location chip**: warm white, 15 px radius, padding 10 15, min-width 220, small muted line + 14 px bold.
- **Map**: min-height 570 px (630 above 1500 px, 430 on mobile), 25 px radius, ground `#E5EACF`, illustrative SVG; floating tags (`#FFFEFAF5`, 30 px radius, 13 px / 600, green "live" dot 7 px); recenter control 42 px, radius 13.
- **Map pin**: 49 px, forest (social = terracotta, culture = `#90681F`), 4 px `#FFFEF7` border, teardrop radius `50% 50% 50% 10%` rotated −45°; hover scale 1.1; selected scale 1.12 + 8 px translucent white outline.
- **"You are here"**: 20 px forest dot, 4 px white border, two soft halos (18 px and 45 px).
- **Callout**: warm white, 13 px radius, padding 10 15, max-width 210, 14 px + 12 px muted line.
- **Action card**: warm white, 19 px radius, 17 px padding, 1 px border; selected = 1.5 px forest border + `#F3F6EA`; tag row, 17 px title, 13 px muted lines, footer separated by `#DDE2D4` with 24 px avatar pile and green "places libres" count.
- **Tag**: 11 px / 700, radius 7, padding 4 8, coloured by category (see palette).
- **Neighbour note**: `#EEE8D8`, radius 18, padding 17 19.
- **Auth card**: max-width 490, padding 32 38 (28 23 mobile), radius 24, shadow, border `#E8E2D6`; rides −75 px over the 295 px hero (−35 px over 190 px on mobile). Reassurance block `#F1F5EB`, 13 px.
- **Profile**: cover 160 px (140 mobile) with the illustration at 85 %; head panel radius 0 0 24 24; avatar 90 px overlapping −44 px; two-column body 300 px + flexible (stacked on mobile); panels radius 22, padding 24; stats 27 px / 700; tabs with 2 px forest underline; engagement rows with a date box (58 px, `#F1F3E8`, radius 13).
- **Dialog**: radius 24, padding 30, max-width 460, backdrop `#18372B66`; close button 35 px circle.
- **Toast**: ink background, white 14 px, radius 14, bottom 24 px, 4.5 s.

---

## 7. Responsive

| Range | Behaviour |
|---|---|
| Desktop > 1100 px | Map and list side by side (list 340 px; 375 px above 1500 px). Full navigation. Auth card centred, 490 px. |
| Tablet 761–1100 px | 24 px margins, list 310 px, filters wrap, header actions hidden. |
| Mobile ≤ 760 px | Single column: intro, filters, 430 px map, then list. Profile stacked. Forms full width with 16 px margins. Nav hidden. |

---

## 8. Icons & motion

- Icons: 20 px stroke icons (1.7 px, round caps), inline SVG sprite (`#i-map`, `#i-leaf`, `#i-heart`, `#i-sun`, `#i-pin`, `#i-lock`, `#i-check`, `#i-alert`, `#i-target`, `#i-users`); 16 px in captions, 22 px inside pins.
- Motion: colour transitions 120 ms; card border/background 150 ms; pin scale 150 ms. All transitions disabled under `prefers-reduced-motion`.

---

## 9. React mapping

Components to build: `AppHeader`, `CategoryChip`, `NeighborhoodMap`, `ActionCard`, `AuthCard`, `FloatingField`, `ProfileSummary`, `ParticipationList`, `Button`.
Prototype behaviour to reproduce: filters synchronised between map and list; clickable markers; action detail dialog; local form validation; editable profile.
Scope note: demo data, schematic map (no map service), no real authentication, no native Figma file.
