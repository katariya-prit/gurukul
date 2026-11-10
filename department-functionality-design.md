# Gurukul: Department Functionality System Design

Status: Draft v1 (discussion stage, no code yet)
Date: 10 Nov 2026

---

## 1. Goal

Gurukul ma ghana departments chhe (Music, Dancing, Computer and Technology, Editing, Accounting, etc.) ane darek nu behaviour alag chhe. Darek department ne potani **functionality** joiye, jem ke Music ma instrument wise marking.

Core platform (sections, students, levels, growth, progress, notifications) badha department mate common rahe. Department-specific functionality ene upar **plug** thay, ane navi functionality add karva mate code badalvo na pade.

## 2. Key Insight

**"Instrumental Marking" ek functionality chhe, Music department nu feature nahi.** Ene ek vaar banavo, pachi ghana departments ma assign kari shakay.

| Department | Functionality | Items (Skill Items) |
|---|---|---|
| Music | Instrumental Marking | Tabla, Piano, Harmonium, Flute |
| Dancing | Instrumental Marking | Kathak, Garba, Bharatnatyam |
| Computer and Technology | Instrumental Marking | Python, Web Design, Networking |
| Accounting | Instrumental Marking | Tally, Ledger, GST |

Etle UI ma "Instrument" shabd fix na rakho. Darek department potano **label** rakhe (Music: "Instrument", Dancing: "Dance Form", Computer: "Skill").

## 3. Glossary

```
Department      (Music)
  |-- Functionality   (Instrumental Marking)        super admin banave ane department ne assign kare
        |-- Item      (Tabla, Piano, Harmonium)     super admin add/update kare
              |-- Lesson / Submission / Marking   head lesson aape, student upload kare
```

- **Functionality**: reusable feature (e.g. Instrumental Marking).
- **Item**: functionality ni andar nu skill/instrument (Tabla, Piano).
- **Rubric**: item mate marking criteria (taal, laya, accuracy) ane weights.
- **Level**: student no item-wise level (Beginner, Intermediate, Advanced) ane level-up rule.
- **Widget**: dashboard ma dekhato card.

## 4. Design Principles

1. **Hybrid dynamic**: config thi 80% kaam (items, rubrics, levels, widgets). Khaas kaam (e.g. audio AI evaluation) mate `functionality_key` par alag handler.
2. **Engine pehla, functionalities pachi**: pehla ek majboot generic engine, pachi ek ek functionality plug.
3. **Disable != delete**: functionality band karo to data rahe, fakt menu mathi jai.
4. **Backward compatible**: atyar na lessons `functionality_id = null` sathe "general lesson" tarike chalu rahe.
5. **Access functionality thi nakki thay, role JSON thi nahi**: darek navi functionality mate darek role no permissions JSON edit karvo na pade.
6. **Rubric versioning**: submission vakhte rubric nu snapshot save thay, jethi juna marks na badlay.

## 5. Roles and Access

| Role | Functionality Manager | Items | Lesson aapvu | Submit | Marking joi shake |
|---|---|---|---|---|---|
| SUPER_ADMIN | Full (create, edit, assign to departments) | Add/update badha | Badhi item | No | Badhu |
| HEAD100 (Department Head) | No | Fakt potana department na enabled items | Potana department na sections/students ne | No | Potana department nu |
| SECHEAD101 (Section Head) | No | Fakt potana section ne allowed items | Potana section na students ne | No | Potana section nu |
| STUDENT | No | Fakt potana assigned items | No | Haa | Potanu |

Rules:
- Department head ne **fakt tena department ni enabled functionalities** na modules dekhay.
- Lesson aapti vakhte pehla puchhvu: **"kayo item?"**. List ma fakt e items j dekhay je e user ne allowed chhe.
- Item permission `item_permissions` table thi nakki thay.

## 6. Data Model (rough)

```
functionalities
  id, key (e.g. instrumental_marking), name, icon,
  theme (colors), evaluator_type (ai | teacher | both), is_active

department_functionalities
  department_id, functionality_id, item_label (e.g. "Instrument"), is_enabled

functionality_items
  id, functionality_id, department_id, name (Tabla), icon, is_active

item_rubrics
  id, item_id, version, criteria (JSON: key, label, weight, max_points), max_points

item_levels
  id, item_id, level_no, name, min_points, promote_mode (auto | manual)

item_permissions
  id, item_id, role_code | user_suid, scope (department | section | user)

student_items
  student_suid, item_id, current_level, total_points, started_at

student_item_progress
  id, student_suid, item_id, points, level_at_time, recorded_at

dashboard_widgets
  id, functionality_id, item_id (nullable), widget_type, config (JSON), roles (JSON)

lessons (existing table ma add)
  functionality_id (nullable), item_id (nullable), rubric_version
```

Existing `lesson_submissions` ma pan `item_id` ane `rubric_snapshot` add thase. Atyar nu AI evaluation (audio) Music handler tarike reuse thase.

## 7. Main Flows

### A. Super admin: functionality banavvu
1. **Functionality Manager** kholo (navi navbar, department drill-in jevi).
2. Functionality select/create (Instrumental Marking).
3. Items add (Tabla, Piano), darek ni rubric ane levels set karo.
4. Department ma assign karo (Music, Dancing, ...).
5. Item permissions set karo (kayo head/section head kayo item aapi shake).

### B. Department create/edit
1. Name ane description pachi navu step: **Functionalities checklist** (enable/disable).
2. Je enable karo te department head ni navbar ma dekhay.

### C. Head lesson aape
1. Head lesson create kare, section select kare (e.g. Ridham).
2. Jo department ma functionality on hoy to pehla puchhe: **"Kayo item?"** (allowed items j).
3. Lesson item sathe save thay, rubric version snapshot thay.

### D. Student submit kare ane marking
1. Student assigned item no lesson submit kare (audio/video/etc.).
2. Marking: AI (jya support hoy) ane/ke teacher, rubric mujab.
3. Final points item-wise progress ma save thay, level-up rule check thay.
4. Growth ane progress page item-wise update thay.

### E. Dashboard
- User na item/functionality mujab widgets bhegi thay.
- Tabla student ne tabla na cards (level badge, progress, recent marks). Piano student ne piano na.
- Student ek thi vadhu item shikhto hoy to tabs.

## 8. UI Plan

1. **Functionality Manager** (super admin): functionality list, items, rubrics, levels, permissions, department assignment.
2. **Department create/edit**: description pachi Functionalities checklist step.
3. **Dynamic Navbar**: backend `GET /me/navigation` aape, user na role, department ane enabled functionalities mujab. Atyar nu `hasAccess` hardcode ni jagya e e vaparay.
4. **Lesson create**: item selector (functionality on hoy tyare j).
5. **Marking screen**: rubric mujab (marking nu form functionality/item mujab alag dekhay).
6. **Dashboard widgets**: widget registry, darek functionality potana widgets declare kare.
7. **Progress/Growth**: item-wise level ane growth chart.

## 9. Backend APIs (draft)

- `GET/POST/PUT /functionalities`
- `GET/POST/PUT/DELETE /functionalities/:id/items`
- `PUT /items/:id/rubric` (navi version banave)
- `PUT /items/:id/levels`
- `PUT /departments/:id/functionalities` (enable/disable)
- `PUT /items/:id/permissions`
- `GET /me/navigation`
- `GET /me/items` (user ne allowed items)
- `GET /dashboard/widgets`
- Existing lessons/progress APIs ma `item_id` support

## 10. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Badhu ek sathe dynamic banavva jata project atkay | Pehla 2 functionality j banavo, engine majboot karo |
| Marking rules badlay to juna marks bagde | Rubric versioning ane submission snapshot |
| Permissions JSON ma bahu fatfat thay | Access functionality tables thi, role JSON thi nahi |
| Navbar/dashboard slow | Navigation ane dashboard config cache karo |
| Atyar na lessons tute | `functionality_id` nullable, generic lesson chalu |
| Alag departments nu marking alag hoy | Rubric-based criteria JSON, evaluator per item |

## 11. Roadmap

1. Nirnay ane glossary (aa doc)
2. Data model finalize
3. UI design (Functionality Manager, department step, navbar, dashboard)
4. Backend: functionality, items, permissions APIs
5. Frontend binding: manager, department checklist, dynamic navigation
6. Lesson ma item select ane rubric marking
7. Item-wise progress ane level/growth
8. Dashboard widgets
9. Navi functionalities ek ek ne add (Instrumental Marking pachi biji)

## 12. Open Questions (nirnay baki)

1. **Ek student ek thi vadhu item shikhi shake?** Item kon assign kare (head ke student pote)?
2. **Level up automatic (points threshold) ke head manual promote kare?** Mari salah: item-wise setting.
3. **Rubric kon banave?** Fakt super admin ke head pan?
4. **Marking form kevu alag?** Fakt rang/icon, ke criteria pan alag (tabla: taal, laya; piano: notes, speed)? Mari salah: criteria alag (rubric JSON).
5. **Evaluator**: AI kayi items ma (atyare audio j), baki ma teacher manual?
6. **Ek functionality ek thi vadhu departments ma**: haa (many-to-many), upar ni table mujab.
7. **Biji functionality pehli pachi kai?** (Instrumental Marking pachi)

## 13. Decisions So Far

- Instrumental Marking reusable functionality chhe, ghana departments ma assign thay.
- "Item" generic shabd, department ne potano label.
- Hybrid dynamic: config + functionality-specific handler.
- Functionality Manager super admin mate, department drill-in navbar pattern jevu.
- Department head ne fakt enabled functionalities dekhay.
- Lesson aapti vakhte item select (jya functionality on hoy).
- Rubric versioning, disable != delete, backward compatible lessons.