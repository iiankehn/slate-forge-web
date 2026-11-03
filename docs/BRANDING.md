# Slate Forge app branding

The app uses the user-supplied SlateForge-BrandKit-v1.2-review package, supplied for integration on 2026-11-03. This is the Fold + Forge identity: blue folded ribbon, violet return and orange nib. The package labels its geometry/typography a review candidate; using it here follows the user’s integration request and does not relabel the upstream package as a finalized master.

SVGs and favicon PNGs in dist/brand are copied unchanged from the kit. The full symbol is used for launcher art; the dedicated small symbol is used at small UI sizes and for favicons. Header/Workspace wordmarks use the supplied outlined light/dark variants rather than rebuilding the lettering with a UI font. The source font permission notice is retained in dist/brand/FONT-LICENSE.txt; no font binary is needed at runtime.

icon-512.png is the supplied 512px transparent symbol. icon-192.png is its proportional Lanczos export. Apple touch (180px) and maskable (512px) platform images use a flat Canvas #F5F7FA background with the complete symbol centered at 144px and 384px respectively. No outline, rounded tile, shadow or color change is added to the mark. The maskable silhouette stays inside the central safe circle. favicon.ico contains the kit’s original 16/32/48px PNG exports.

The manifest ID, start URL, scope, shortcuts, document storage and existing private Site identity stay unchanged. Brand files and install icons are included in the service-worker shell so the identity remains available offline. Existing OS installations may refresh their displayed icon on the platform’s own schedule; app-code updates remain automatic.
