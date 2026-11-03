# Post-release limitations review

Subsequent direction: the user reopened advanced work and selected Word/ODT compatibility. See [ODT_COMPATIBILITY.md](ODT_COMPATIBILITY.md). This review retains the preceding focused-product assessment and evidence.

Reviewed 2026-11-03 against checkout `fb83294`, source/tests and the successful [release CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41646799702) for runtime `1407181d5c04a21fabc3fa12066b6173da23b2aa`. The user reaffirmed the focused product scope; advanced-feature expansion is not required.

## Already implemented or verified automatically

| Old limitation claim | Current evidence and boundary |
| --- | --- |
| Completed downloads and restoration | Browser journeys download and restore the exact HTML, ZIP/PDF and encrypted-backup files. Native share sheets and target-device pickers remain manual. |
| Offline tools and updates | Browser journeys cover offline OCR and two-tab A→B silent upgrades with retained writing and offline reopening. OS installation, eviction and physical-device suspension remain manual. |
| Split page-bottom notes | `test/page-bottom-notes.test.mjs` and the long-note browser journey cover continuation without text loss. Physical print, IME and complex-layout fidelity remain unverified. |
| Additional PDF signatures and timestamps | `test/pdf-signing.test.mjs` covers incremental signing, certification/field locks and RFC3161 request/response validation. A browser journey downloads an additionally signed PDF preserving the first revision. Real TSA interoperability and recipient trust remain manual; revocation/LTV remain outside scope. |
| Comparison after text changes | `test/document-comparison.test.mjs` covers shared-text formatting and unique moves across containers. General ambiguous/semantic matching remains bounded. |
| Accessibility | Released browser checks cover keyboard/focus and axe across palettes. Real screen readers and virtual keyboards remain manual. |

The released CI passed 477 Node tests and 100 browser scenarios; its handoff records no retries. These are historical release results, not physical QA. See `e2e/release.spec.mjs` for exact fixtures. This review independently reran `npm test`: 477 passed, zero failures, skips or cancellations. Environment startup also passed production build and static packaging checks on unchanged runtime inputs. Browser checks were not rerun for these documentation-only changes.

## Remaining work and acceptance evidence

| Priority | Check | Evidence needed to close it |
| --- | --- | --- |
| 1 | Physical iPhone/iPad Safari and Android Chrome: typing, selection, rotation, file round trip, offline relaunch, save after suspension | Device/browser/OS versions, sample identifiers and actual results in DEVICE_QA; inspect the exact exported/restored files. |
| 1 | VoiceOver/TalkBack and desktop screen reader; keyboard-only navigation | Reader/browser versions; complete setup, writing, save warnings, dialogs and recovery without inaccessible controls or trapped focus. |
| 1 | Actual browser-produced PDF | Browser/version and print settings; inspect page sizes, full text/table rows, notes, furniture and landscape output. DOM preview alone does not close this. |
| 2 | Disposable-profile quota/eviction, persistence outcomes and competing/suspended tabs | Verify preservation of the prior committed copy, unsaved-work warnings and emergency backup. Never test against real user documents. |
| 2 | Representative Word/LibreOffice exchange | Open/resave/reimport exact downloaded files; record supported-content retention and simplification warnings. Universal fidelity is not required. |

These checks need the named hardware, assistive technology or external application. Missing physical evidence is not an unimplemented feature. Fix demonstrated defects with focused regressions. No runtime defect was established by this documentation review; that does not prove the absence of defects.

## Scope and release decision

General PDF reflow, arbitrary nested wrapping, universal office interchange, general XFA execution, deeper native review parity and archival signature infrastructure remain bounded/frozen by PRODUCT_FOCUS. Preserve storage identifiers, backup formats, existing fonts, public origin and private Site identity.

The supported product remains ready for public beta within these verification limits. Further work is target-device validation and resulting reproducible corrections. Documentation reconciliation alone does not require a runtime deployment.
