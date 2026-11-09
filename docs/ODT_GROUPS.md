# Bounded native ODF stroke groups

This batch supports one-level groups of adjacent opaque native lines/arrows, with absolute child geometry and no group transform or paint effects. Group membership and child order survive reopening and native ODT re-export. Hidden objects remain omitted; locking and original group names are not transferred.

The existing actual LibreOffice one-level grouped-stroke probe is the exchange corpus. Focused checks compare geometry and order through import/export/import. The prior actual-editor resave establishes the corpus geometry; this batch does not claim a new LibreOffice execution or Word certification.

Non-stroke grouped objects, group opacity/paint, clipping, transformed groups, deeper nesting, separated grouped layers and raw matrices remain explicit preview cases. Existing primitive paint bounds and stroke representability limits remain enforced. No document storage or backup format changes.

Implementation is awaiting complete CI and publication. The next compatibility work is additional group paint/geometry and matrix cases with actual-editor evidence.
