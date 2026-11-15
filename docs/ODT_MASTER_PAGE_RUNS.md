# ODT master-page orientation runs

Ordinary ODT page changes can bind a new master page to a body paragraph, heading or table without using `text:section`. Import now preserves compatible single-column portrait/landscape runs in the existing editable section model. Following lists and paragraphs stay in their current run, and an explicit return to the document design becomes a new run. Native export uses ordinary text sections and master pages; no original-file cache, private page state or storage migration is added.

The projection requires common paper, margins, sequential numbering, header and footer. Explicit page-number restarts retain a warning and the existing fallback. It is bounded to 100 top-level runs. Existing text sections and native review histories keep their existing import paths; nested page assignments retain their explicit fallback. Unsupported paper/furniture changes warn and use document defaults. Leading metadata and whitespace do not invent a blank opening page. Current master-page edits are read directly, and literal text remains escaped.

## Heading margin correction

Writer can reset inherited sibling margins when direct paragraph spacing overrides one side. The first normalized heading lost its 12-point top margin. Native heading export now repeats both existing defaults (12 points above, 6 below) explicitly; a supported custom bottom margin still takes precedence. This repairs the demonstrated shift without a new model field. The failed heading input/resave/PDF remains retained. Custom foreign paragraph spacing outside the existing model remains a separate layout limit.

## Accepted editor evidence

LibreOfficeDev 26.8.0.0.alpha0, build `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, opened/resaved/rendered a raw three-page master-switch document, an independent native-section control and the app-normalized export. Each conversion used a fresh isolated profile. All three have portrait → landscape → portrait pages with the same body text, heading, list, common furniture and page numbers. Reopening raw and normalized resaves retains both editable orientation boundaries.

All three-page 144-DPI renders are pixel-identical after the heading fix. Six accepted generated content/styles XML parts validate against core ODF 1.3; mimetype is first and uncompressed. This is a concrete headless Writer corpus, not general page-layout or Microsoft Word certification. Source, inputs, resaves, PDFs and comparison metrics are retained under `docs/fixtures/odt-master-page-runs/` and `test/fixtures/odt-master-page-runs/`.

## Retained column-flow failure

A separate page-level 2 → 3 → 2 column probe retained text and page orientations but did not preserve rendered flow when converted to text sections. The existing balanced-section model does not provide a faithful sequential page-column representation. The failed normalized input/resave/PDF is named `columns-failed-normalized-*`; raw/control evidence remains alongside it. Its XML is schema-valid, which does not make the rendering pass. Automatic page-run projection refuses these cases and gives a specific fallback warning. Existing page-column import behavior remains available with its disclosed limitations; no column fidelity claim is made by this release.

## Verification and release state

Eight new Node cases cover ordinary and renamed master bindings, repeated sanitized editor reconstruction/export, real resaves, current layout edits, literal markup, table-first runs, furniture/margin/nested/review fallbacks, columns and run limits. The browser case checks native download, three measured portrait/landscape pages, a real new-document import, saved reload and HTML section reconstruction across five profiles. Local browser execution remains policy-blocked; CI is the browser execution environment.

Implemented on `feat/odt-master-page-runs`; all 722 local Node cases, production/static packaging and source whitespace checks pass. Required PR/main/browser/publication gates (250 browser scenarios) remain pending. PR #35 remains live. Continue solo with focused security guidance, preserving originals, backups, storage/origins/private Site, fonts and mobile safe areas. No physical-device gate or background watcher.
