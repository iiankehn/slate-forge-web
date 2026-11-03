# Word/ODT compatibility follow-on

Requested 2026-11-03 after the completed focused release. The user explicitly reopened advanced work and selected Word/ODT compatibility as the lead area.

## Behavior in this batch

- Export native ODF annotations for text comments, including overlapping ranges across paragraphs, cursor anchors, author/date, multiline literal bodies and resolved state. Resolved state uses LibreOffice's `loext:resolved` extension; other applications may ignore it.
- Import native annotations into editable Slate Forge comments, including namespace aliases. Ambiguous duplicate/reversed ranges are ignored with a warning; annotation bodies never become document prose. Import/export allow up to 300 comments. Expanded comment markup is limited to 20 MB.
- Comments inside notes, generated contents and stored revision data are omitted with a warning. Notes retain their prose without annotation metadata. Comment bodies import as plain text; threaded discussions are not reconstructed.
- Export design canvases as page/column-fitted PNG previews instead of refusing the document. Previews retain aspect ratio and description and reopen as ordinary images. They omit editable scene data and hidden objects. Keep HTML/workspace backups for original editable canvases. The DOCX canvas settings remain DOCX-specific.
- Refuse missing or oversized canvas previews rather than silently omitting them. The existing 1.5 MB ODT image import ceiling also bounds exported canvas previews.
- Preserve external ODF namespace aliases for headings, links, image relationships/geometry and table spans/repeats instead of depending on literal XML prefixes.
- Keep image descriptions in image alternative text instead of duplicating them as body prose on ODT import.

ODT still exports final inline review text and requires decisions on structural groups. This batch adds comments, not native ODF tracked changes. Native text boxes/shapes, exact external layout and round-trip preservation of arbitrary ODF features remain future compatibility work.

## Verification

Regression tests in `test/odt-comments.test.mjs` reconstruct exported archives and pass imported HTML through the sanitizer and editor schema, then export/import again. They cover overlapping/cursor comments, metadata and literal hostile text, malformed ranges, count limits, deleted review text, namespace aliases, preview bytes/geometry and missing/oversized previews. Existing ODT style/section/table tests remain applicable.

The browser suite adds a real downloaded ODT round trip covering comment metadata, a cursor anchor, rendered canvas preview and hidden-data omission across the existing five configurations. Record actual CI results before claiming browser success. These checks do not certify physical devices or external Word/LibreOffice resaves.

No storage identifiers, database versions, workspace backup formats, origins or private Site configuration change.

## Validation record

[PR #12](https://github.com/iiankehn/slate-forge-web/pull/12) merged the compatibility batch. [PR CI 41721144435](https://github.com/iiankehn/slate-forge-web/actions/runs/41721144435) passed 487 Node tests, production/static checks and 105 browser scenarios without retries. All five new ODT download/reopen journeys passed. Local focused coverage passed 31 ODT cases. A comment/canvas fixture's content.xml and styles.xml passed the official OASIS ODF 1.3 Relax NG schema after excluding the LibreOffice resolved-comment extension; this is core-schema validation, not an external-editor resave test.

The first main run [41722707407](https://github.com/iiankehn/slate-forge-web/actions/runs/41722707407) exposed a static test-server race during update-fixture cleanup: the file disappeared between stat and stream open, an unhandled ENOENT stopped the server, and the next browser's navigation failed on both attempts. That run passed 21 browser scenarios, failed one and skipped 83; it was not a successful release. Pending Pages run 41722739609 was cancelled before publication.

Follow-up `6a0af3e` handles stream errors, sends 404 before headers, destroys interrupted responses after headers and closes the browser context before fixture removal. A deterministic reproduction crashes the old handler with ENOENT; two new Node HTTP regressions pass with the fix. These are server tests, not local browser automation. Corrected source `6a0af3ea285a49ba125c8a0bbfc2c86efa227578` is published at https://slate-web.iiankehn.com/ . [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41723609890) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41723610425) passed 489 Node tests, production/static checks and all 105 browser scenarios without retries.

Live verification checked 44 shell/worker URLs against the release build. Service-worker code/manifests match and cache digest `947fff62bf658ba9` reconciles after substituting the live platform-specific THIRD-PARTY-NOTICES.txt. GitHub artifact download returned Forbidden; verification used the permitted public app origin and local build, not a downloaded deployment archive. Optional asset bytes were included from the build when reconciling the digest, not all individually fetched from production. Physical devices and actual Word/LibreOffice resaves remain unverified for this batch.
