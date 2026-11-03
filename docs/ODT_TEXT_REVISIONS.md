# Native ODT text revisions

The next Word/ODT compatibility batch follows the user's continued advanced-feature request. The first comments/canvas batch remains documented in ODT_COMPATIBILITY.md.

## Supported behavior

ODT exports retain pending inline text insertions and deletions as native ODF changed regions, with author, date and change notes. Deleted text is stored in the revision definition and referenced at its original position; it is not added to the final body text. Formatting on supported deleted text is retained.

On import these regions become ordinary editable Slate Forge text suggestions. Accept, reject, bulk decisions, undo/redo, saving and reopening use the existing review model. Replacements and discontinuous ranges exported from Slate Forge retain their shared decision group while generated native IDs and consistent metadata survive. External editors that rename IDs may split a group into independent decisions. Ordinary external ODF IDs import as separate decisions.

The recording on/off preference is independent of pending history and survives the ODT round trip, including a document with recording enabled but no pending changes. Supported comments on inserted text and cursor comments remain separate from revision decisions. Comments attached only to deleted text are omitted from ODT; the export dialog explains this and recommends HTML/workspace backups for the complete history.

## Explicit boundaries

- Support is for inline text changes within individual paragraphs. Native cross-paragraph insertion ranges, overlapping/nested revisions, tracked objects, fields and line breaks, empty/structural deletions and revisions in notes/generated contents are refused before import rather than flattened silently.
- ODT export requires decisions on formatting revisions and existing structural/row/paragraph-boundary revisions. Changed text containing line breaks requires a decision or DOCX/HTML instead. Plain unreviewed content retains its existing export behavior.
- Native formatting revisions referenced by a file must be decided in a compatible editor before import. Unsupported data does not replace the currently open workspace.
- Up to 1,000 native revision ranges are supported, with bounded document complexity and 20 MB expanded revision markup. Missing/duplicate/conflicting IDs, orphan text-change definitions, unbalanced markers and inconsistent group metadata produce explicit errors.
- Deleted-text styles are imported from supported text/paragraph styles; arbitrary office layout and rich revision trees are not promised. Actual Word/LibreOffice resaves and physical devices require separate evidence.

No database version, storage identifier, backup format, origin or private Site identity changes. Existing HTML review marks remain the internal representation.

## Validation

`test/odt-changes.test.mjs` covers native archive structure, sanitized second round trips, metadata, group decisions, inherited deleted-text formatting, undo/redo, recording preference, comments, namespace aliases, invalid/structural changes and amplification limits. It also converts ODT suggestions through native DOCX and back; this is source-converter evidence, not Microsoft Word certification.

The new browser journey downloads an actual ODT, reopens and saves it, reloads, then accepts, undoes and rejects suggestions while checking inserted-text comments. Existing browser gates remain strict about page errors and retries. Actual release outcomes are recorded below; these checks do not certify target-editor resaves.

## PR validation

[PR #13](https://github.com/iiankehn/slate-forge-web/pull/13) passed [CI 41733391610](https://github.com/iiankehn/slate-forge-web/actions/runs/41733391610): 501 Node tests, production/static checks and all 110 browser scenarios without retries, including the downloaded-ODT decision journey in all five configurations. Local focused ODT coverage passed 43 cases. The revision/comment fixture's content.xml and styles.xml passed the official OASIS ODF 1.3 core schema after excluding the LibreOffice resolved-comment extension. This is not a target-editor resave test.

The shell GitHub credential expired during publication preparation. The connected GitHub app published the same files with matching blob hashes and complete tree `a1f18733463603d5724569c0bea4f4381a6460db`; local commit `cfc5820` remains preserved, while remote commit `54b2009` has the same parent and tree. Environment authorization was refreshed before the manual release dispatch. No workflow triggers or hosting identity changed as an authentication workaround.

Pre-publication review then reproduced an identifier edge case: two native-looking group names containing long numeric identifiers normalized to the same fallback review ID and merged independent decisions. The new regression failed before the correction (`1` decision instead of `2`). Follow-up `49d70dd` maps external group keys to bounded, unique internal IDs while retaining legitimate grouping. Local focused ODT coverage now passes 44 cases. Pending main run 41735041263 and Pages run 41735043043 were cancelled; neither is release-success evidence. Corrected source `49d70dd7a7610bd1ce3e28d04f4ceed0a2b3d301` is now published at https://slate-web.iiankehn.com/ . [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41735668694) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41735669867) passed 502 Node tests, production/static checks and all 110 browser scenarios without retries.

## Published verification

The corrected release checked 44 live shell/worker URLs against the local release build. Service-worker code/manifests match and digest `c4e7519fb8ae9992` reconciles with the live platform-specific THIRD-PARTY-NOTICES.txt substituted into the build digest. Other compared files match byte-for-byte. Optional assets used from the build in digest reconciliation were not all individually fetched from production. External Word/LibreOffice resaves and physical-device checks remain open. No storage identifier, database version, backup format, origin or private Site identity changed.
