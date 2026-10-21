# Spectris: Astral Odyssey

## Run locally

Install Node.js 22, then run these commands from this folder in Command Prompt:

```cmd
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173/`). To
create and test the production build locally:

```cmd
npm run build
npm run preview
```

## Publish with GitHub Desktop and GitHub Pages

1. Run `npm run build` and confirm it completes before publishing.
2. Open GitHub Desktop and sign in to the GitHub account that should own the
   repository.
3. Choose **File > Add Local Repository...** and select this `Spectris` project
   folder. Since it is not a Git repository yet, use the prompt to create a
   repository in this folder. Name it `Spectris` and use `main` as its initial
   branch. Do not choose a different folder: this folder already contains the
   game.
4. In GitHub Desktop's **Changes** tab, enter an initial commit summary such as
   `Prepare Spectris for GitHub Pages` and choose **Commit to main**.
5. Choose **Publish repository**. Choose the correct owner and repository name.
   GitHub Pages is available for public repositories on GitHub Free, so make it
   **Public** if you want to use a free account. Publishing the source makes
   the game code and assets publicly viewable.
6. On GitHub, open the repository's **Settings > Pages**. Under **Build and
   deployment**, set **Source** to **GitHub Actions**. The included workflow
   builds the Vite app and deploys `dist` whenever you push to `main`.
7. On the repository's **Actions** tab, wait for **Deploy to GitHub Pages** to
   finish successfully. The first deployment provides a temporary GitHub Pages
   URL to test.

The Vite config uses relative asset paths and the Pages workflow is already
included, so no build folder or `node_modules` needs to be committed.

## Connect `spectris.spectralgarden.net`

1. In Cloudflare, open the `spectralgarden.net` zone and go to **DNS >
   Records**. Add a `CNAME` record:
   - **Name:** `spectris`
   - **Target:** `<your GitHub account or organization>.github.io` (for the
     `spectralgarden` owner, use `spectralgarden.github.io`; do not include the
     repository name or a path)
   - **Proxy status:** **DNS only** (gray cloud) while GitHub verifies the
     domain and issues its TLS certificate.
2. In the GitHub repository, open **Settings > Pages**. Under **Custom domain**,
   enter `spectris.spectralgarden.net` and save. The `assets/CNAME` file is
   copied to the published site root to preserve this setting on deployments.
3. Wait for the DNS check and certificate provisioning to complete, then turn
   on **Enforce HTTPS** in the Pages settings.
4. Test `https://spectris.spectralgarden.net`. If GitHub reports a DNS error,
   confirm the CNAME target matches the account or organization that owns the
   repository and that the record is DNS-only.

After the first setup, future changes are published by committing to `main`
and choosing **Push origin** in GitHub Desktop. The Actions workflow deploys
the update automatically.
