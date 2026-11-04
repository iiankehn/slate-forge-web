# Target-device release checks

Record browser/OS/version and actual results. A responsive iframe or API stub does not close a physical-device gate.

Status reconciled 2026-11-03: the matrix below records physical/manual evidence. Released CI separately passed 100 browser scenarios across five configurations, including exact downloaded-file restoration, offline OCR, silent updates and accessibility checks. See [POST_RELEASE_REVIEW.md](POST_RELEASE_REVIEW.md). Historical procedures below are test prompts, not an active feature backlog. Record pass/fail, sample, settings and evidence for each actual target run.

| Target | Editing / keyboard | Files / complete backup | Install / offline / update | Print / layout | Accessibility |
|---|---|---|---|---|---|
| iPhone Safari | Open | Open | Open | Open | VoiceOver open |
| iPad Safari + hardware keyboard | Open | Open | Open | Open | VoiceOver open |
| Android 12+ Chrome | Open | Open | Open | Open | TalkBack open |
| Desktop Chrome | Local browser editing checks passed; physical keyboard still open | Automated exact-file downloads/restoration passed; native device picker/share flow open | HTTPS installed workflow open | Measured preview passed; printed file open | Menu keyboard checks passed; reader open |
| Desktop Firefox | Open | Open | Supported install fallback / offline open | Open | Open |
| Desktop Safari | Open | Open | Supported install / offline open | Open | Open |
| Microsoft Word | N/A | DOCX round trip open | N/A | Open | Review/comments open |
| Installed LibreOffice development build | N/A | Generated DOCX round trip passed | N/A | Fixture PDF render checked | Native comments/revisions retained |

## Run once on each target

1. Create a document, type with the virtual/hardware keyboard, format text, undo/redo, select across paragraphs and tables, and use the hamburger/desktop menus without losing the selection. Rotate mobile/tablet devices and test safe areas.
2. Insert/describe/wrap an image and change its gap. Draw/resize/select/erase on a canvas; test stylus input where available. Confirm keyboard alternatives work.
3. Create/fill/resize a PDF form field. Export a complete workspace ZIP containing text and the PDF. Save it through the native download/share UI. Reimport that exact file and verify text, history, snippets, PDF values and editable geometry. Keep an independent original backup.
4. Close/reopen and confirm saved work and appearance. Request persistent storage and record grant/denial/fallback. Force a quota failure in a disposable test profile; verify warnings and emergency backup without losing the prior good copy.
5. Install where supported, launch online, use OCR and PDFs once, then disconnect and reopen. Test both app shell and tools. Reconnect and install an available app update only after all saves finish. Unsupported install/file-handler paths should explain the browser fallback.
6. Preview the generated compatibility fixture or a representative long document. Export PDF with 100% scale and browser-added headers/footers off. Inspect page sizes, repeated furniture, all table rows, page numbers, image colors, endnotes and landscape sections. Compare with DOCX in Word and LibreOffice; record layout differences.
7. Use keyboard-only navigation and a screen reader. Check Skip to document, menu names/expanded states, modal containment, Escape/focus restoration, toolbar labels, preview page names, save warnings and PDF field labels.
8. Test a disposable shared-device workspace: end session, reopen, and confirm its ordinary text/PDF files do not return. Separate encrypted text recovery should remain locked. Test duplicated/suspended tabs without overwriting the last good saved copy.

Do not clear real user storage to test eviction. These checks need a disposable profile and sample documents.

Fit-width checks: in Paged editing, use View → Fit page width (or the footer Fit button), rotate the device, open/close the design panel, and reopen the app. Check that sheets fit without horizontal scrolling, manual Zoom in/Actual size exit Fit, and Continuous editing remains comfortable to type in. Repeat with the virtual keyboard visible.

## Consolidated reliability batch checks

- Prepare PDF/OCR offline, cancel midway, resume, then launch installed and exercise both tools with the network disabled. Verify the app shell and components survive reopening; test storage denial/quota failure.
- Type while saving, use Ctrl/Cmd+S, switch workspaces and suspend/restore the app; verify the latest text and enabled recovery copies.
- Track replacements across paragraphs, accept/reject and undo. Clear formatting on commented/revised text and verify annotations remain. Confirm the explicit code-block limits.
- Exercise Whole words and Selected text replacement with formatted text, Unicode and undo on physical keyboards and virtual keyboards.

## Navigation and writing batch checks

- Open command search from Edit and Ctrl/Cmd+K. Search by command, menu category and alias; check disabled actions, arrow/Home/End navigation, Enter, Escape and screen-reader announcements. Confirm IME confirmation does not execute a command.
- While a design/PDF tool is open, confirm Ctrl/Cmd+K and Ctrl/Cmd+P do not replace it.
- Search the text-document library by body/title/tag, test scopes and each sort, then reopen the app to check remembered scope/sort. Queries should not persist. Check narrow layouts and long titles/tags.
- Filter outline titles/depth, jump to a heading, edit and undo, and confirm the outline updates with correct positions.
- With tracked insertions/deletions, compare body/selection word counts and goal progress before and after accepting changes. Generated contents, notes and canvas text are excluded from these counts.

Source integration and model tests pass; these physical-browser checks have not been completed for this batch.

## Widow/orphan pagination checks

- In paged editing, place a three-line paragraph near a page bottom and check that it moves intact. Check four-line and longer paragraphs leave at least two lines above/below each break. Repeat with headings/keep-next chains, inline font sizes, scripts, Unicode, hard breaks and IME.
- Repeat ordinary single-column cases in File → Print / Save as PDF; inspect the actual generated PDF. Check no duplicated/dropped text or extra blank pages. Lists, columns, wrapped groups and complex typography still require separate parity work.
- Toggle Paragraph → Prevent isolated first or last lines, Undo, reopen, and DOCX export/reimport. Verify the opt-out survives and explicit page breaks/Keep together remain independent. Test unusually large fonts and visible fallback/warnings.

These are pending physical-browser checks; source fixtures alone do not complete them.

## ODT design round-trip checks

- Download ODT with inherited/direct fonts/colors, highlighting, paragraph rules, nested lists and a non-default start. Open/save in target LibreOffice versions and reimport the actual saved file. Compare text, formatting, list types, paragraph controls and Undo.
- Check A4/Letter portrait/landscape, supported margins and simple header/footer/page numbers. Try custom/unequal margins and multiple masters, and verify simplification warnings.
- Confirm imported colored highlights remain editable, toolbar highlighting still toggles normally, and HTML/ODT preserves color. Inspect supported DOCX highlight mapping in the exported file; do not infer universal color fidelity.

One local LibreOffice development-build fixture passed; these actual browser/download/target-editor checks remain open.

## Review, code and comparison batch

- Enable tracking, change inline styles and paragraph alignment/spacing/keep rules, edit a pending suggestion again, then accept/reject individually and in bulk. Check Cancel, one-step Undo/Redo, comments/text revisions and reopening from device storage and HTML/backup. Verify stale confirmations cannot resolve a changed document/workspace.
- Exercise code creation from Format and the style selector, native typing/deletion/newlines/tabs, Find/Replace, comments and decisions. Verify rich-format controls are disabled in code, pending formatting blocks code conversion, and IME/hardware/virtual keyboards retain cursor positions. Grouped structural/object review is implemented; inspect accept/reject and Undo separately.
- Download DOCX with run/paragraph property revisions and reviewed code, open/save in target editors and reimport that exact saved file. Inspect original formatting, revision decisions and newlines/tabs. LibreOffice's development build dropped some earlier Latin run properties in one fixture; do not assume cross-editor fidelity.
- Compare identical text with different styles, paragraph design, objects and page settings; compare inserted/deleted/moved blocks. Check bounded reports, screen-reader announcements, Unicode and literal markup. Shared-text formatting and bounded move matching are implemented; ambiguous/general semantic matching remains bounded.

Source/DOM checks do not complete these physical-browser and actual-download checks.

## Large-workspace and quota checks

- Create/import up to 200 documents, load every library batch with keyboard/touch, search by body/title/tag, change content and sort, then reopen from installed/browser sessions. Check no missing documents, stable focus and fresh search results. Verify restore/import capacity failures preserve documents/trash.
- Fill the tab cache with a realistic text/image/history workload while IndexedDB remains writable. Reopen after a committed save and verify the device pointer resolves the full workspace. Suspend/close during a pending save; the reduced cache cannot guarantee uncommitted changes.
- Exercise actual IndexedDB quota denial and storage eviction, verify the prior committed record survives, export current in-memory work, free space and retry. Test competing/suspended tabs and End session.
- Compare capacity estimates against platform settings; test absent estimate/persistence APIs. Estimates cover the whole site, including offline components, and do not guarantee remaining space. Measure mobile responsiveness/memory for image/history-heavy workspaces; source fixtures are not device performance certification.

Synthetic quota and multi-megabyte regression cases passed; physical-browser/OS quota and eviction checks remain open.

## Editable canvas DOCX checks

- Export canvases containing text, shapes, cropped/flipped images, grouped/locked/hidden layers and pressure strokes; download and reopen that exact DOCX in Slate Forge. Open the design editor, change objects, Undo, save/reopen and export again.
- Turn off Keep design canvases editable and verify an image-only DOCX contains no editable scene/hidden-layer data. Check the explanation is readable on phones and accessible by keyboard/screen reader.
- Open/resave in target Word/LibreOffice versions; verify unchanged previews can still restore where metadata is retained. Edit/duplicate/delete/crop/rotate/resize previews and confirm stale scenes are not restored. Metadata may be removed or rewritten by external editors.
- Import 5–20 MB DOCX through picker and installed OS launch; verify large raster images resize on-device, errors preserve the open workspace, and no file processing is uploaded. Test real HEIF/unsupported sources and memory pressure independently of the synthetic source adapters.

One LibreOffice development-build metadata fixture passed. Physical-browser/download/visual-quality and broad target-editor checks remain open.

## Latest local PDF/OCR/review work

- Prepare all ten OCR models offline, restart installed apps without a connection, and recognize camera/PDF scans in each selected language with and without English. Check restored language/page-range settings. Node WASM French/Russian fixtures do not certify camera accuracy or target-device memory.
- Download/reopen password-protected PDFs in target readers; test wrong/correct passwords and explicit unlocked-copy consent. Confirm passwords and certificates are absent from device records/backups. Test quota failures while retaining an export path.
- Test international PDF annotations and new/existing form values with representative local TTF/OTF fonts. Verify selected fonts' glyph coverage, complex-script/bidirectional layout and recipient-reader appearances. Current fixtures cover Latin/Greek/Cyrillic, not all scripts.
- Sign a final PDF with a real local RSA PKCS#12 identity and verify in recipient readers. Check trust/expiry messaging; incremental additional signatures and RFC3161 timestamps are implemented within documented policy limits. Verify recipient trust and real TSA interoperability; revocation/LTV remain outside scope. Verify importing/exporting signed sources preserves exact bytes and blocks edits.
- Exercise overlapping and cursor comments with keyboards/screen readers and Word round trips, including empty ranges. Cursor anchors are omitted from final print text.
- Verify long top-level wrapped paragraphs on successive pages after the float ends. Check caret navigation, Undo, IME and scaling; active-float splits and nested wraps still require further implementation.

- For grouped structural review, test table/canvas/image changes, block moves, rich paragraph/code conversions, protected deleted copies and edits inside inserted copies. Check caret/IME behavior around isolating wrappers, ordinary editor-generated trailing paragraphs, Undo/Redo, bulk stale-context guards and quota/backup recovery. Reopen HTML/JSON only with a build that supports blockRevision. Decide structural groups before Word/ODT export; native structural revision interop is not implemented.

- With Page design → Note placement set to Bottom of reference page, inspect actual body/note boundaries, note numbering/navigation and the same downloaded/printed PDF across target browsers. Include multiple notes near a page break, wrapped paragraphs, keep rules and tables; test note changes, fonts, rotation/Fit and IME. Check keyboard access to original note controls and cleanup when returning to Continuous editing. Endnote defaults must remain unchanged for old documents. Split-note continuation is implemented and has source/browser coverage. Inspect actual printed continuation; complex-section fidelity remains bounded.

## ODT compatibility follow-on — target-editor checks

The released five-configuration browser journey downloads/reopens overlapping/ranged/cursor comments and a rendered canvas preview. The corrected release passed 489 Node tests and 105 browser scenarios without retries. This is separate from the manual matrix above.

- Open the exact exported ODT in target Word/LibreOffice versions. Inspect overlap boundaries, cross-paragraph ranges, cursor anchors, literal multiline comment bodies, authors and dates. LibreOffice resolved state uses an extension; record whether each recipient retains it.
- Resave and reopen that exact file in Slate Forge. Verify body text, comment coverage and preview images; record simplification warnings. Comments inside notes, generated contents or stored revision data are intentionally omitted with warnings.
- Confirm ODT canvases are image previews with descriptions and expected page/column size; original objects remain editable in the original document or HTML/workspace backup. Hidden objects and editable scene data must not appear in ODT previews.

Actual external-editor resaves remain unverified for this batch. Native ODF tracked changes and editable ODF shapes are not implemented by it.

## Native ODT text-revision follow-on — target-editor checks

The published compatibility batch adds native inline insertion/deletion decisions; see ODT_TEXT_REVISIONS.md for supported ranges and validation evidence. The first-batch limitation above is historical for inline text changes. Formatting and structural revisions remain bounded.

- Export a paragraph replacement containing styled deleted text and a comment on inserted text. Open the exact ODT in each target Word/LibreOffice version; inspect original/deleted text, new text, author/date and comment coverage. Record editor/version and actual results.
- Accept and reject copies in the external editor, resave each, then reopen the exact files in Slate Forge. Compare final text and formatting. Keep the original pending-review file independently.
- Resave a still-pending copy and check Slate Forge's individual/bulk decisions and Undo/Redo. If the external editor renames generated native IDs, replacement groups may become independent decisions; record that distinction rather than claiming shared-group fidelity.
- Test recording enabled and disabled separately, including a document with no pending changes. Confirm subsequent typing follows the imported setting.
- Try native formatting, cross-paragraph, overlapping, object and line-break revisions in disposable files. Unsupported structures must produce an explicit import/export error and preserve the open workspace; do not silently accept a flattened copy as full review fidelity.

Source converters and browser download/reopen tests are separate from these actual external-editor resaves. Native editable ODF canvases and full native formatting/structural revision interchange remain outside this text-revision batch.

Published text-revision evidence: [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41735668694) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41735669867) passed 502 Node tests, production/static checks and all 110 browser scenarios without retries. These runs do not close the manual Word/LibreOffice/device rows above.

## Reported mobile header clipping — 2026-11-04 correction

The user supplied physical iPhone evidence of the document header covered by the system top area. The safe-area correction is published as `95fc8402f0b879dd59457222647a5222e279175a`; [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41772922302) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41772922806) passed 502 Node tests, production/static checks and all 115 browser scenarios without retries. Portrait, shorter, landscape-cutout, 320 px and zero-inset geometry checks pass in all five configurations. Reviewed captures are in MOBILE_SAFE_AREAS.md. These checks do not close the physical iPhone row.

After saving, reopen the affected app online and verify title, save indicator and menu below the system status area. Check rotation, keyboard show/dismiss, Workspace scrolling and its tour control. Record installed-vs-browser mode, OS/browser version and actual outcome. No post-release physical-device result has been supplied.
