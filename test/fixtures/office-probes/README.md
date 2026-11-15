# Office probe fixtures

`manifest.json` lists accepted, repeatable native ODT exchange probes. GitHub Actions records the installed LibreOffice version and checks native reimport, declared page/text geometry, input schema and render expectations. Add a committed case when a feature needs new exchange evidence; do not replace failed representations with passing labels.

`OpenDocument-v1.3-schema.rng` is the unmodified OASIS OpenDocument 1.3 Standard schema (27 April 2021), from https://docs.oasis-open.org/office/OpenDocument/v1.3/os/schemas/OpenDocument-v1.3-schema.rng. Its upstream copyright/source comments are retained. Source whitespace checks exempt this exact vendored file; generated input XML must still pass the schema.
