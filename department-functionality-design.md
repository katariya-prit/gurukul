# Gurukul: Department Functionality System Design

Status: v2 (Frontend UI bani gayu mock data sathe, Backend connect baki, UI fixes baki)
Date: 13 Nov 2026
Frontend: `C:\Users\Public\gurukul` (React 19, TypeScript strict, Vite, Tailwind v4)
Backend: `C:\Users\Public\gurukul-backend-app` (AdonisJS 6, Lucid, VineJS, PostgreSQL)
Frontend module: `src/pages/FunctionalityManager`

---

## 0. Current Status (atyar ni sthiti)

| Area | Status | Note |
|---|---|---|
| Frontend Functionality Manager pages (8 pages) | Banyu chhe | Mock data par chale chhe |
| Sidebar entry "Functionality Manager" (Logout ni upar) ane drill-in view | Thayu | Click kare to navi sidebar view khule |
| Rubrics / Levels / Permissions alag home pages | Thayu | Item picker + cards + editor |
| Backend routes, DB tables, models | **Baki** | Etle page par "Cannot GET:/functionalities", mock chale chhe |
| "MOCK DATA (BACKEND NOT CONNECTED)" badge | **Baki** | Backend connect thay tyare j jashe, plus badge logic fix |
| Breadcrumb kadhvu | **Baki** | Sab pages ma |
| Modal ma sidebar + header blur | **Baki** | Atyar fakt page blur thay chhe |
| Search box alignment (Items, Rubrics, Levels, Permissions) | **Baki** | Shared FilterBar |
| Phone size (360 to 412px) | **Baki** | Header title "F." thai jay, card overflow, Active toggle chipki jay |
| Department create/edit ma Functionalities checklist | Baki | Pachi |
| Dynamic Navbar (`/me/navigation`) | Baki | Pachi |
| Lesson create ma item select, marking UI, progress, dashboard widgets | Baki | Pachi |

Kaam no order: **UI fixes (Phase 1, 2) -> Backend (Phase 3 to 6) -> Verification (Phase 7) -> pachi Department checklist, lesson, marking, progress, dashboard.**

---

## 1. Goal

Gurukul ma ghana departments chhe (Music, Dancing, Computer and Technology, Editing, Accounting, G-ART, etc.) ane darek nu behaviour alag chhe. Darek department ne potani **functionality** joiye, jem ke Music ma instrument wise marking.

Core platform (sections, students, levels, growth, progress, notifications) badha department mate common rahe. Department-specific functionality ene upar **plug** thay, ane navi functionality add karva mate code badalvo na pade.

Sathe aakhi system (Frontend ane Backend) **phone size** ma pan barabar chalvi joie.

## 2. Key Insight

**"Instrumental Marking" ek functionality chhe, Music department nu feature nahi.** Ene ek vaar banavo, pachi ghana departments ma assign kari shakay.

| Department | Functionality | Items | Item Label |
|---|---|---|---|
| Music | Instrumental Marking | Tabla, Piano, Vocal | Instrument |
| Dancing | Instrumental Marking | Kathak, Garba, Contemporary | Dance Form |
| Computer and Technology | Instrumental Marking | Python, Web Design, Networking | Skill |
| Accounting | Instrumental Marking | Tally, Ledger, GST | Skill |

UI ma "Instrument" shabd kyay hardcode na karvo. Darek department potano **itemLabel** rakhe, ane UI e hamesha e j vaparvo.

## 3. Glossary

```
Department      (Music)
  |-- Functionality   (Instrumental Marking)        super admin banave ane department ne assign kare
        |-- Item      (Tabla, Piano, Vocal)         super admin add/update kare
              |-- Rubric / Levels / Permissions     item mujab, super admin set kare
              |-- Lesson / Submission / Marking     head lesson aape, student upload kare
```

- **Functionality**: reusable feature (e.g. Instrumental Marking).
- **Item**: functionality ni andar nu skill/instrument (Tabla, Piano).
- **Item Label**: department no potano shabd item mate (Instrument, Dance Form, Skill).
- **Rubric**: item mate marking criteria (taal, laya, clarity), weights, maxPoints. Versioned.
- **Level**: student no item-wise level (Beginner, Intermediate, Advanced, Expert) ane promote rule (auto | manual).
- **Permission**: kayo role / section / user kayo item vapri shake.
- **Enrollment**: student ne item sathe jodvo.
- **Widget**: dashboard ma dekhato card.

## 4. Design Principles

1. **Hybrid dynamic**: config thi 80% kaam (items, rubrics, levels, widgets). Khaas kaam (e.g. audio AI evaluation) mate `functionality_key` par alag handler.
2. **Engine pehla, functionalities pachi**: pehla majboot generic engine, pachi ek ek functionality plug.
3. **Disable != delete**: deactivate karo to `is_active=false`, data rahe, fakt menu mathi jai.
4. **Backward compatible**: atyar na lessons `functionality_id = null` sathe "general lesson" tarike chalu rahe. Nava columns badha nullable.
5. **Access functionality tables thi nakki thay, role JSON thi nahi**.
6. **Rubric versioning**: darek save navi version banave, juni version read-only. Submission vakhte rubric nu snapshot save thay.
7. **Frontend files source of truth**: Backend e frontend na `types/index.ts` ane `functionalityManagerService.ts` na exact shapes return karvi.
8. **Mock fallback fakt dev mate**: real backend chale to mock kyarey na dekhay.
9. **Mobile first**: darek page 360px par pan barabar, no horizontal scroll.

## 5. Roles and Access

| Role | Functionality Manager | Items | Lesson aapvu | Submit | Marking joi shake |
|---|---|---|---|---|---|
| SUPER_ADMIN | Full (create, edit, assign, rubric, levels, permissions, widgets, enrollment) | Badha | Badhi item | No | Badhu |
| HEAD100 | No | Fakt potana department na enabled items | Potana department na sections/students ne | No | Potana department nu |
| SECHEAD101 | No | Fakt potana section ne allowed items | Potana section na students ne | No | Potana section nu |
| STUDENT | No | Fakt potana enrolled items | No | Haa | Potanu |

Rules:
- Badha management endpoints **SUPER_ADMIN only**. Permission module `Functionality` (view, create, edit, delete), SUPER_ADMIN hamesha pass.
- Department head ne fakt tena department ni enabled functionalities dekhay.
- Lesson aapti vakhte pehla puchhvu: **"Kayo {itemLabel}?"**, list ma fakt allowed items.
- Enrollment scope: HEAD100 potana department, SECHEAD101 potana section na permitted items, SUPER_ADMIN badhu.

---

## 6. Data Model (final)

Existing tables (badlavta nathi): `users` (PK suid bigint), `departments` (PK department_id), `roles` (PK role_code string), `sections` (PK section_id), `lessons` (PK lesson_id), `lesson_submissions` (PK submission_id).

```
functionalities
  id, key (unique 100), name (150), description (text, null), icon (50, null),
  theme_color (20, null), evaluator_type (ai | teacher | both, default teacher),
  is_active (default true), timestamps

department_functionalities
  id, department_id FK CASCADE, functionality_id FK CASCADE,
  item_label (50, default 'Item'), is_enabled (default true), timestamps
  UNIQUE (department_id, functionality_id)

functionality_items
  id, functionality_id FK, department_id FK, name (150), icon (50, null),
  is_active (default true), timestamps
  UNIQUE (department_id, functionality_id, name)

item_rubrics
  id, item_id FK CASCADE, version int, criteria jsonb [{ key, label, weight, maxPoints }],
  max_points int, is_current bool, created_by bigint FK users.suid SET NULL (null), timestamps
  UNIQUE (item_id, version)

item_levels
  id, item_id FK CASCADE, level_no int, name (100), min_points int,
  promote_mode (auto | manual, default auto), timestamps
  UNIQUE (item_id, level_no)

item_permissions
  id, item_id FK CASCADE, role_code (null FK roles), section_id (null FK sections),
  user_suid (null FK users), timestamps
  CHECK: ochha ma ochha ek (role_code, section_id, user_suid) null na hoy

student_items
  id, student_suid FK users.suid CASCADE, item_id FK CASCADE,
  current_level_no (default 1), total_points decimal(10,2) default 0,
  assigned_by bigint (null), started_at, timestamps
  UNIQUE (student_suid, item_id)

student_item_progress
  id, student_suid, item_id, submission_id (null FK lesson_submissions SET NULL),
  points decimal(10,2), level_no_at_time int, recorded_at (default now)
  INDEX (student_suid, item_id, recorded_at)

dashboard_widgets
  id, functionality_id FK CASCADE, item_id (null FK CASCADE),
  widget_type (levelBadge | progressRing | recentMarks | growthChart | itemStats),
  title (150), config jsonb default {}, roles jsonb default [],
  sort_order int default 0, is_active default true, timestamps

lessons (ALTER, badha nullable)
  functionality_id, item_id, rubric_version

lesson_submissions (ALTER, badha nullable)
  item_id, rubric_snapshot jsonb, criteria_scores jsonb
```

Indexes: darek FK par, `is_active` par, `(department_id, functionality_id)` par.

Seeder (idempotent, be vaar chalave to pan safe): 4 functionalities (Instrumental Marking, Choreography Review, Coding Assessment, Accounting Practice), existing departments name thi assign (Music "Instrument", Dancing "Dance Form", Computer and Technology "Skill", Accounting "Skill"; bija departments jem G-ART ne kai nahi), 2 thi 3 items per department, 3-criteria rubric (weights sum 100), 4 levels (Beginner 0, Intermediate 100, Advanced 300, Expert 600), role permissions HEAD100 ane SECHEAD101, 3 widgets.

## 7. Validation Rules

- Rubric: weights no sum **exactly 100**, criterion keys unique, maxPoints >= 0. Darek save = navi version (transaction ma pehli `is_current=false`).
- Levels: pehla level no minPoints = 0, minPoints strictly increasing, levelNo unique, name required. Je level par koi student hoy e level delete na thay (422 clear message sathe).
- Items: item add karva mate department ma e functionality enabled hovi joie, nahito 422.
- Widget config object j hovo joie.
- Deactivate = soft only.
- Writes idempotent (enroll, permissions, levels, assignments), jethi phone na kharab network par retry safe.

---

## 8. Frontend Structure

```
src/pages/FunctionalityManager/
  index.ts
  FunctionalityManagerLayout.tsx
  FunctionalityManagerGuard.tsx        (SUPER_ADMIN only, bija ne /dashboard par redirect)
  routes.tsx / routeConfig.tsx
  pages/
    FunctionalitiesPage.tsx
    FunctionalityDepartmentsPage.tsx
    ItemsPage.tsx                      (fakt items CRUD, ?tab= behaviour kadhi nakhyu)
    RubricsHomePage.tsx   + RubricPage.tsx
    LevelsHomePage.tsx    + LevelsPage.tsx
    PermissionsHomePage.tsx + PermissionsPage.tsx
    WidgetsPage.tsx
    EnrollmentPage.tsx
  components/   (Modal, FilterBar, FunctionalityCard, ItemSummaryCard, RubricBuilder,
                 LevelsEditor, PermissionsEditor, DepartmentAssignPanel, ItemsTable,
                 CopyFromItemDialog, DefaultLevelsButton, WeightIndicator, ActiveToggle,
                 EmptyState, ErrorState, SkeletonList, PageHeader, ...)
  hooks/        (useFunctionalities, useItems, useItemSummaries, useRubric, useLevels,
                 useItemPermissions, useWidgets, useEnrollment, ...)
  services/     (functionalityManagerService.ts, mockData.ts)
  types/index.ts
  utils/        (slugify, validators, constants)
```

## 9. Routes (base: `/dashboard/functionality-manager`)

| Path | Page |
|---|---|
| `/functionalities` | Functionalities list + create/edit |
| `/functionalities/:id/departments` | Department assign (itemLabel sathe) |
| `/items` | Items CRUD (filters, add/edit/deactivate). Row actions: Rubric, Levels, Permissions |
| `/rubrics` and `/rubrics/:itemId` | Rubrics home (item cards) ane editor |
| `/levels` and `/levels/:itemId` | Levels home ane editor |
| `/permissions` and `/permissions/:itemId` | Permissions home ane editor |
| `/widgets` | Dashboard widgets |
| `/enrollment` | Student enrollment |

Aliases: `/items/:itemId/rubric|levels|permissions` redirect thay nava paths par. Index route `/functionalities` par redirect.

## 10. Sidebar

- Normal sidebar ma **Departments Pipeline** list pachi, **Logout ni thik upar** ek item "Functionality Manager" (SUPER_ADMIN only), jaman bajune chevron-right, uper thin divider.
- Click: `SidebarViewContext.activeModule = 'functionality-manager'` (activeDepartmentId clear thay) ane `/dashboard/functionality-manager/functionalities` par navigate.
- Navi sidebar view (department drill-in jevu): **Back**, Functionalities, Items, Rubrics, Levels, Permissions, Dashboard Widgets, Enrollment.
- Active highlight exact route mujab (`/rubrics/:itemId` ma Rubrics highlight).
- Header title "Functionality Manager". Refresh ke direct link par URL thi view restore thay.
- Collapsed sidebar (icon only + tooltip) ane mobile drawer chalu rahe, navigate pachi drawer band.
- Aa entry hardcoded rahe, `/me/navigation` fail thay to pan chale.

---

## 11. UI Rules (aa badha apply karvana)

### 11.1 Breadcrumb kadhi nakhvu
Badha pages mathi "Dashboard / Functionality Manager / ..." line **puri rite kadhi nakhvi** (PageHeader, Layout, breadcrumb component/util/imports). Page header = nano eyebrow "FUNCTIONALITY MANAGER", title, subtitle, jaman bajune primary button (phone ma title ni niche).

### 11.2 Modal: sidebar ane header pan blur
- Ek j shared `Modal.tsx`, badha dialogs (Add Functionality, Add item, Add widget, confirm deactivate, copy-from, bija) e j vapre. Koi dialog potano overlay na banave.
- `ReactDOM.createPortal` thi `document.body` ma render (layout container na stacking context ma na fase).
- Overlay: `fixed inset-0`, z-index sidebar ane header karta vadhu (e.g. `z-[9999]`), light: `bg-black/40 backdrop-blur-sm`, dark: `bg-black/60 backdrop-blur-md`. Sidebar, header, page badhu sathe blur thay.
- Backdrop click ane Esc thi band, focus trap, body scroll lock (close par restore), `role="dialog" aria-modal`.
- Asli karan: stacking context / transform / overflow / backdrop-filter ma modal fasayo hoy. Karan fix karvu, fakt symptom nahi.
- Animation: framer-motion fade + scale/slide 150 thi 200 ms.
- Phone (<640px): bottom sheet (rounded top, max-h 92dvh, sticky footer Cancel/Save, scrollable body, safe-area bottom padding, swipe-down ke backdrop tap thi band).

### 11.3 Filter bar ane search alignment
- Ek shared `FilterBar.tsx`: Items, Rubrics, Levels, Permissions chaar pages ma same.
- Grid: phone 1 column, tablet 2, desktop 4 (Functionality, Department, Item, Search). Darek cell ma upar nano label (Search ne pan "Search" label), control height `h-11` (44px), same `rounded-xl`, border, padding, font (phone ma 16px).
- Search: left search icon, right clear (x), debounce 300 ms. Badha controls ek j row ane same bottom edge par.
- Item label hamesha department na itemLabel mujab.

### 11.4 Phone layout (320, 360, 390, 412, 768, 1024+)
- Top header: title "F." thai na jay. Full title truncate (ellipsis, `min-w-0 flex-1`), date chip nano screen ma chhupavvi, hamburger + theme toggle + avatar overlap na kare. Header outside module hoy to saulthi nano fix ane exact lines list.
- Container: koi horizontal scroll nahi (`min-w-0`, fixed width nahi), `px-4` phone / `px-6` md / `px-8` lg, `100dvh`, safe-area insets.
- Card grids: 1 column <640, 2 >=640, 3 >=1024. Card screen karta bahar na jay.
- **FunctionalityCard footer phone par**: pehla Active toggle ni alag row (label dabe, switch jamne, full width), pachi Departments / Items / Edit 3 equal-width buttons (min height 44px). Aa j rule item, level, permission, widget cards ne.
- ItemsTable: <768px ma stacked cards + "more" actions bottom sheet. Real table fakt md+.
- RubricBuilder: criteria rows vertical (label full width, weight + maxPoints sathe), drag sathe Up/Down buttons. LevelsEditor rows cards. PermissionsEditor full-width dropdowns, wrapped chips. DepartmentAssignPanel: be columns -> Available / Enabled tabs. WeightIndicator + Save sticky bottom bar.
- Tap targets >= 44x44, input font >= 16px, hover-only action nahi.
- Pages `React.lazy` + `Suspense` skeleton, searches 300 ms debounce, bundle per-page chunk.
- Dark = blue accent, light = red accent (`useTheme()`, `theme === true` dark).

### 11.5 Mock badge
- Badge fakt tyare j dekhay jyare mock sachche serve thatu hoy (`isMockMode()` reactive).
- Mock fallback fakt: network error, HTTP 404/501, non-JSON/HTML response, "Cannot GET/POST/PUT/PATCH/DELETE" message, **ane fakt jyare `VITE_USE_MOCK !== "false"`**. `VITE_USE_MOCK=false` hoy to kyarey mock nahi, real error + Retry.
- Successful real response aave tyare `mockActive` reset thay, badge aapo aap jaay.
- Hardcoded "Mock data" text kyay na rakhvo.

---

## 12. Backend API Contract

Badhu auth (`middleware.auth({ guards: ['api'] })`) hethal. Management = SUPER_ADMIN. Response hamesha camelCase:

```
{ success: boolean, message?: string, data?: T, meta?: { page, limit, total, totalPages } }
```
Errors 400/401/403/404/422 `success:false` ane nani human message. Kyarey HTML / "Cannot GET" nahi, unknown API route par JSON 404.
List endpoints: `page` (default 1), `limit` (default 20, max 100), `search`, `isActive`. Dropdown lookups par `all=true`.

**Functionalities**
- `GET /functionalities` (id, key, name, description, icon, themeColor, evaluatorType, isActive, departmentCount, itemCount)
- `POST /functionalities`, `GET /functionalities/:id`, `PUT /functionalities/:id`
- `PATCH /functionalities/:id/active` `{ isActive }`, `DELETE /functionalities/:id` (soft)
- `GET /functionalities/:id/departments` -> `[{ departmentId, departmentName, isEnabled, itemLabel }]`
- `PUT /functionalities/:id/departments` `{ departments: [{ departmentId, isEnabled, itemLabel }] }` (kadhelu hoy te isEnabled false, delete nahi)
- `GET/PUT /departments/:departmentId/functionalities` `{ functionalities: [{ functionalityId, isEnabled, itemLabel }] }` (Department form mate)

**Items**
- `GET /items?functionalityId=&departmentId=&search=&isActive=&page=&limit=` (id, name, icon, functionalityId, functionalityName, departmentId, departmentName, itemLabel, isActive, currentRubricVersion, levelCount)
- `GET /functionalities/:id/items?departmentId=`
- `POST /functionalities/:id/items` `{ departmentId, name, icon }`
- `PUT /items/:itemId`, `PATCH /items/:itemId/active`, `DELETE /items/:itemId` (soft)
- `GET /items/summaries?...` -> per item: item fields + `rubric { version, criteriaCount, maxPoints } | null` + `levels { count, firstName, lastName, promoteSummary: auto|manual|mixed }` + `permissions { roleCount, sectionCount, userCount }`. Joins / grouped sub-queries, **N+1 nahi**. Rubrics, Levels, Permissions home pages ek j request ma.

**Rubric**
- `GET /items/:itemId/rubric` (current; na hoy to `data: null`, `success: true`)
- `GET /items/:itemId/rubric/versions` -> `[{ version, maxPoints, criteria, isCurrent, createdAt, createdByName }]`
- `PUT /items/:itemId/rubric` `{ criteria, maxPoints }` -> hamesha navi version

**Levels**
- `GET/PUT /items/:itemId/levels` `{ levels: [{ levelNo, name, minPoints, promoteMode }] }` (transaction ma set replace)

**Permissions**
- `GET /items/:itemId/permissions` -> `{ roleCodes, sectionIds, userSuids, roles:[{roleCode,name}], sections:[{sectionId,name}], users:[{suid,name}] }` ("Who can use this item" panel mate extra call na joie)
- `PUT /items/:itemId/permissions` `{ roleCodes, sectionIds, userSuids }`

**Enrollment**
- `GET /items/:itemId/enrollments` (studentSuid, name, sectionName, currentLevelNo, currentLevelName, totalPoints, startedAt)
- `GET /items/:itemId/eligible-students?search=&sectionId=`
- `POST /items/:itemId/enroll` `{ studentSuids }` -> `{ enrolled, skipped }` (idempotent)
- `DELETE /items/:itemId/enroll/:studentSuid`

**Widgets / Me**
- `GET /dashboard/widgets/manage`, `POST /dashboard/widgets`, `PUT/PATCH(active)/DELETE(soft) /dashboard/widgets/:id`
- `GET /dashboard/widgets` (current user mate, computed data sathe)
- `GET /me/navigation`, `GET /me/items`

**Lookups** (existing endpoints frontend vapre chhe to e reuse): departments, sections?departmentId=, roles, users?search=&limit=

**Health**: `GET /health` -> `{ success: true }`

Cache: navigation ane widget config mate 60 s in-memory, koi pan related change par invalidate.

## 13. Backend Hardening ane Phone Performance

- CORS: `http://localhost:5173` + env `CORS_ORIGINS` (phone testing mate LAN origin), headers Authorization + Content-Type, methods GET POST PUT PATCH DELETE OPTIONS.
- Backend `.env`: `HOST=0.0.0.0`.
- gzip/brotli JSON, ETag + `Cache-Control: private, max-age=30` rarely-changing lists par, user-specific mutable data par `no-store`.
- N+1 nahi, filter columns par index, slow query (>300 ms) dev ma log.
- JSON body limit 1 MB, writes par halku rate limit.
- Pagination badhe, dropdown lookups ma minimal fields.

## 14. Environment

Frontend `.env`:
```
VITE_API_URL=http://localhost:3333
VITE_USE_MOCK=false
```
Phone test mate `VITE_API_URL=http://<PC-LAN-IP>:3333` (localhost phone par kaam nahi kare). `.env.example` ma `VITE_USE_MOCK=false`.

Phone testing steps: backend `HOST=0.0.0.0` -> `ipconfig` thi LAN IP -> Windows Firewall ma port 3333 ane 5173 allow -> PC ane phone ek j Wi-Fi -> phone par `http://<LAN-IP>:5173`.

---

## 15. Main Flows

### A. Super admin: functionality banavvu
1. Sidebar ma **Functionality Manager** khologo, Functionalities page.
2. Functionality create (name, key, description, icon, color, evaluator AI / Teacher / Both).
3. Departments page par assign, darek department no itemLabel set.
4. Items add (Tabla, Piano), darek ni Rubric, Levels, Permissions set.
5. Students ne Enrollment page thi item ma jodvana.
6. Widgets set.

### B. Department create/edit (pachi)
Description pachi **Functionalities checklist** (enable/disable + itemLabel). Je enable te department head ni navbar ma dekhay.

### C. Head lesson aape (pachi)
Lesson create vakhte "Kayo {itemLabel}?" (allowed items j). Lesson item sathe save, rubric version snapshot.

### D. Student submit ane marking (pachi)
Submit -> AI (audio, jya support) ane/ke teacher rubric mujab criteriaScores -> final points item progress ma -> level auto/manual -> notification.

### E. Dashboard (pachi)
User na item/functionality mujab widgets, ek thi vadhu item hoy to tabs.

---

## 16. Roadmap (navo order)

1. **Phase 1: Frontend UI fixes**: breadcrumb remove, shared Modal (portal + blur sab par), shared FilterBar, phone layout, FunctionalityCard footer.
2. **Phase 2: Mock badge fix**: `VITE_USE_MOCK=false`, badge reactive, fallback rules.
3. **Phase 3: Backend audit**: routes, middleware, CORS, frontend vs backend mismatches.
4. **Phase 4: DB**: migrations, models, seeder.
5. **Phase 5: Validators, services, controllers, routes** (section 12).
6. **Phase 6: Connect + phone-fast**: CORS, compression, caching, Japa tests, README mobile testing.
7. **Phase 7: Final verification** (section 17).
8. Pachi: Department form checklist, Dynamic Navbar, lesson item select, rubric marking UI, item-wise progress, dashboard widgets, navi functionalities.

Darek phase pachi `git commit`.

## 17. Test Checklist

1. `node ace migration:run`, seeder, `node ace list:routes` ma badha functionality routes.
2. `VITE_USE_MOCK=false` par Functionalities page real data batave, **mock badge nahi**. Backend band karo to real error + Retry (mock nahi).
3. Koi pan page par breadcrumb nathi.
4. Add Functionality / Add item / Add widget / confirm: **sidebar ane header pan blur** (desktop ane phone bottom sheet).
5. Items, Rubrics, Levels, Permissions: Functionality, Department, Item, Search ek row, ek height, 1280 / 768 / 360px par.
6. 360x800 ane 412x915 par 8 pages ma horizontal scroll nahi, header title "F." nahi, Active toggle alag row.
7. Functionality create/edit/deactivate/reactivate, deactivated data database ma rahe.
8. Be departments ma alag itemLabel: Music "Instrument", Dancing "Dance Form".
9. Rubric be vaar save -> v2 current, v1 history. Weights != 100 UI ane API banne reject.
10. Levels default apply, non-increasing reject. Permissions save + resolved names panel.
11. Same student be vaar enroll -> duplicate nahi. Widgets CRUD + config JSON validation.
12. Non-super-admin token management endpoints par 403.
13. Junu lesson (item vagar) pehla jevu j chale. Existing department drill-in, navbar, progress na tute.

## 18. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Badhu ek sathe dynamic banavva jata project atkay | Pehla Instrumental Marking j, engine majboot karo |
| Marking rules badlay to juna marks bagde | Rubric versioning + submission snapshot |
| Frontend ane backend shapes match na thay (Cannot GET) | Frontend types source of truth, Phase 3 audit, mismatch list |
| Modal sidebar blur na kare | Portal + z-index + stacking context fix |
| Phone par overflow | min-w-0, responsive grids, 360px par verify |
| Navbar/dashboard slow | 60 s cache + invalidate |
| Atyar na lessons tute | `functionality_id` nullable |
| Mock data real data ne chupavi de | `VITE_USE_MOCK=false`, badge reactive |

## 19. Decisions So Far

- Instrumental Marking reusable functionality, ghana departments ma assign.
- "Item" generic shabd, department ne potano itemLabel, UI ma kyay "Instrument" hardcode nahi.
- Hybrid dynamic: config + functionality-specific handler.
- Functionality Manager SUPER_ADMIN mate, sidebar entry Logout ni upar, department drill-in pattern.
- Rubrics, Levels, Permissions alag home pages (item picker + cards + editor). Items page fakt CRUD.
- Breadcrumb nahi.
- Modal overlay sidebar + header sahit blur kare, shared portal Modal.
- Shared FilterBar (aligned search).
- Mobile first (360px verified), phone par tables cards ban, modals bottom sheet.
- Mock fallback fakt dev mate, real backend chale to badge nahi.
- Department head ne fakt enabled functionalities dekhay.
- Lesson aapti vakhte item select (jya functionality on hoy).
- Rubric versioning, disable != delete, backward compatible lessons, idempotent writes.

## 20. Open Questions (nirnay baki, defaults sathe)

1. Student ek thi vadhu item shikhi shake? **Default: haa**, item head/section head/super admin assign kare.
2. Level up auto ke manual? **Default: item-wise setting, default auto.**
3. Rubric kon banave? **Default: fakt SUPER_ADMIN.**
4. Marking form alag? **Default: criteria alag (rubric JSON).**
5. Evaluator: **Default: AI fakt audio lessons, baki teacher manual.**
6. Ek functionality ek thi vadhu departments ma: **haa (many-to-many).**
7. Biji functionality pehli pachi kai: Instrumental Marking pachi nakki karvanu.