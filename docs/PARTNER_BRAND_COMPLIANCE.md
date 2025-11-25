Partner & Brand Compliance

Status: Strict Opt‑In (Disabled by default)

- Display of any partner names or logos is disabled unless BOTH are true:
  - NEXT_PUBLIC_SHOW_PARTNERS=true at build time.
  - The curated partner arrays contain only vetted entries with written approval.

- Where
  - Gating: app/partners/page.tsx enforces NEXT_PUBLIC_SHOW_PARTNERS and empty arrays by default.
  - Navigation: components/dashboard/sidebar.tsx hides the Partners link unless the flag is enabled.

- Operator checklist before enabling
  - Written permission for each logo/name, with usage scope.
  - Store asset source, license/permission, and attribution (if any).
  - Verify high‑resolution, background‑transparent SVG/PNG.
  - Add entries to a partners data source only after legal review.

- How to enable (after approvals)
  1) Set Vercel env var for all environments:
     NEXT_PUBLIC_SHOW_PARTNERS=true
  2) Rebuild and deploy.
  3) Populate the approved partner arrays (or a data file) with final name, description, services, and logo path.

- Notes
  - A compliance notice is shown when partners are not enabled.
  - All names/logos remain property of their owners.

