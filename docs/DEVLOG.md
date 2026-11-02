# Dev log

Newest entry first. Each entry: what was done, what was learned, what's next. Keep it short.

---

## 2026-11-03 · Visual design with Taste Skill
- **Done:** Ran the skill's app-screen run. Dealt *true-black-flat* (seed 1898414268), chose gilt as the face and the
  canto strip as the signature element, and built `design/prototype/` (library, book graph, entity) with real Doré, Botticelli, Michelino
  and mosaic images from Commons (credits in `assets/credits.json`) and verified sources. Three inspector rounds took it to 0 FAIL at
  1440/768/390, with one defended WARN (the serif greeting). Logged D-011 and D-012, and rewrote DESIGN.md.
- **Learned:** Cytoscape hides labels under `min-zoomed-font-size` once a map is fitted to a large panel, so don't set it.
  Opening a map pre-dimmed around a selection makes it look dead.
- **Next:** Phase 1 (scaffold, schema, validator), then port the prototype's tokens and components in Phases 3–4.

## 2026-11-02 · Phase 0: framework
- **Done:** Clarified intent with the owner. Claude Code generates the graphs, the tool is a local web app, spoiler protection
  follows reading progress, and the content language is chosen per book. Wrote CLAUDE.md and the docs/ framework, and logged decisions D-001 to D-009.
- **Learned:** The defining constraint is the depth-2 limit. It shapes the schema, the validator, the generation budget and the visuals.
- **Also:** Moved Taste Skill (`design-taste-frontend` v2.1.5) into `.claude/skills/` and gitignored it (D-010).
- **Next:** Phase 1. Scaffold the app, write the Zod schemas and the validator, and build a hand-written *Divine Comedy* fixture (Inferno I–V).
