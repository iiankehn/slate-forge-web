# GitHub Pages hosting

Slate Forge is a static browser application. Node 24 and npm build the JavaScript, OCR/PDF assets and service worker; visitors need only a supported browser. Pages needs no application server, database, API keys or paid document service.

## Repository setup

1. Merge the verified release changes into `main`. The pull-request Release checks workflow builds, runs Node and browser checks and uploads a reviewable static artifact.
2. In repository Settings → Pages, select **GitHub Actions** as the build/deployment source. Public repositories can use Pages on GitHub Free; private-repository Pages requires an eligible plan. Changing repository visibility exposes its source/history and is separate from Pages deployment.
3. From Actions, run **Publish GitHub Pages** on `main`. This manual workflow repeats release checks, uploads `dist/` and deploys it to the `github-pages` environment. Any repository environment protection rules still apply.
4. Open the deployment URL reported by the successful workflow. For the default project address this is `https://iiankehn.github.io/slate-forge-web/`. Verify opening, saving, downloading/restoring a backup and offline preparation there before announcing it.

The app manifest, shortcuts and file handlers use relative URLs; the build check validates project-path assets. The offline cache is scoped by installation path, so an update does not remove a sibling project's caches. Do not upload unbuilt source in place of `dist/`. `.nojekyll` is included.

Current setup: the repository is public, Pages uses GitHub Actions and the custom domain is https://slate-web.iiankehn.com/ . Deployment and Actions access work. The connected integration still cannot write Pages administration settings (HTTP 403), so domain/source administration uses repository Settings. The original private Site is unchanged.

## Existing documents and host changes

The existing private Site remains at `https://document-studio-iian.iiankehn.chatgpt.site`. Its device documents do not move with the code. Export a complete ZIP (or encrypted backup) there, open the new Pages URL and import it. Keep the downloaded copy until restoration is checked. Recovery codes unlock browser-local recovery and do not transfer that browser database between origins.

GitHub project sites share the `https://iiankehn.github.io` origin. Local storage and IndexedDB are origin-scoped, not project-path scoped. Slate Forge preserves legacy `document-studio` storage names for compatibility: multiple Slate Forge copies under that same origin may see the same local workspaces. Do not describe project paths as storage isolation.

Publishing on Pages does not update or change the audience of the existing Site. Offline availability requires a successful initial online visit and preparation of the optional components on each browser/device. Clearing site data removes local work.
