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
- Up to 1,000 native revision ranges are supported, with bounded document complexity and 20 MB expanded revision markup. Missing/duplicate/conflicting IDs, orphan definitions, unbalanced markers and inconsistent group metadata produce explicit errors.
- Deleted-text styles are imported from supported text/paragraph styles; arbitrary office layout and rich revision trees are not promised. Actual Word/LibreOffice resaves and physical devices require separate evidence.

No database version, storage identifier, backup format, origin or private Site identity changes. Existing HTML review marks remain the internal representation.

## Validation

`test/odt-changes.test.mjs` covers native archive structure, sanitized second round trips, metadata, group decisions, inherited deleted-text formatting, undo/redo, recording preference, comments, namespace aliases, invalid/structural changes and amplification limits. It also converts ODT suggestions through native DOCX and back; this is source-converter evidence, not Microsoft Word certification.

The new browser journey downloads an actual ODT, reopens and saves it, reloads, then accepts, undoes and rejects suggestions while checking inserted-text comments. Existing browser gates remain strict about page errors and retries. Record actual CI/Pages outcomes before claiming browser success or publication.
