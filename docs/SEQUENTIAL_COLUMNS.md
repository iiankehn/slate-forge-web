# Sequential page columns

This development batch adds an explicit sequential flow mode to two- and three-column writing sections. Each column fills from top to bottom before the next column begins. Balanced sections keep their existing behavior. In continuous editing, sequential sections show one readable column; Page preview supplies the measured paper layout.

Use Layout → Section tools → Column flow. Sequential sections start on a new page, except an imported section at the beginning of a document. The initial implementation supports top-level text, headings and lists. Nested sections, tables, pictures, notes and other block objects refuse sequential output instead of silently changing the layout. Existing originals and editable storage remain intact.

Native ODT exports `text:dont-balance-text-columns="true"` on section properties. Native import reads that current declaration, including external changes back to balancing. Compatible top-level page-master columns become sequential sections, retaining the existing paper, furniture, numbering and complexity guards. Mixed paper/furniture, page-number restarts, nested assignments and arbitrary layout remain outside this projection.

Editable HTML, ordinary saving, workspace backups and editable sharing preserve the new optional `columnFlow` attribute. Backup envelope versions, database identifiers and origins do not change. Older app builds may ignore the attribute and rebalance the columns; use this version or newer when reopening these documents. Native DOCX export is explicitly unavailable for sequential mode until a faithful representation is implemented. ODT and editable HTML remain available. External HTML printing is not an exact-layout guarantee.

## GitHub acceptance evidence

Verification is pending. No local test, build, browser or Office conversion was run. The GitHub suite adds model, sanitized editor, backup, sharing and refusal regressions, plus a browser scenario in each of five profiles covering measured flow, long paragraph splitting, saved reopening and export controls.

A fifth actual Office probe reconstructs the committed raw 2 → 3 → 2 column corpus through the sanitized editor model, generates fresh native ODT, validates ODF 1.3 XML, converts it and independently resaves it in LibreOffice. Original, directly normalized and resaved PDFs must retain page text/geometry and identical 144-DPI pixels. The old failed balanced normalization remains a failed historical fixture; it is not passing evidence for this feature. GitHub retains the fresh generated ODT, resave, PDFs and report for review.
