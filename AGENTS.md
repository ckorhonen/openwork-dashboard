# Openwork dashboard guide

`src/App.tsx` contains the dashboard data presentation and interactions, with `src/App.css` and the Vite/TypeScript configuration supporting it. Use the existing React/Tremor/Lucide patterns. Treat returned agent/job/activity and token-balance data as external state, not facts proven by rendering a fixture.

Use Node 20 as in `.github/workflows/deploy.yml`, then `npm ci`. Root commands are `npm run dev`, `npm run lint`, `npm run build` (`tsc -b` then Vite), and `npm run preview`. No automated test script is declared. Build output is `dist/`; it is tracked here, so don't include incidental regenerated files unless the requested change requires them. CI builds with `BASE_URL=/openwork-dashboard/` and publishes Pages on main.

For UI/data changes, inspect loading, empty, error, search, table/chart, and responsive behavior with bounded fixtures or authorized reads. A build alone does not prove live API freshness or wallet correctness. Publishing main triggers a deployment; keep that action within existing authorization and don't perform job or wallet mutations to test this read-oriented dashboard.

## Completing work

Carry the authorized change through the relevant checks and repair failures it causes. Make routine, reversible implementation choices using existing patterns; ask only when missing information, a material product decision, or an authorization boundary prevents the next step. Existing authorization remains valid within its scope. If blocked, name the exact action and missing prerequisite, retain concise evidence, and continue independent work.

Choose verification proportional to the change. For instructions or prose, inspect changed paths, links, and local instruction precedence and run `git diff --check -- <changed-paths>`; don't install dependencies or run the application solely for a prose edit. For behavior changes, exercise the affected behavior and applicable checks below, then broaden only for failures or unresolved risk. Report files changed, checks actually run and their results, commands only inspected, and remaining limitations. A build or source inspection alone does not prove runtime behavior. Continue through already-authorized follow-through; stop at explicit review checkpoints or boundaries requiring new authorization.
