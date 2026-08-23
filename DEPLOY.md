# Deployment

The site auto-deploys to GitHub Pages on every push to `main` via
`.github/workflows/deploy.yml`. Public URL lives at
`https://uipen.dev` (via CNAME file + custom-domain DNS).

## One-time setup (already done)

- [x] Public repo created at https://github.com/HousamKak/uipen-website
- [x] Pages enabled via `gh api --method POST repos/HousamKak/uipen-website/pages -f build_type=workflow`
- [x] `deploy.yml` workflow wired to Pages
- [x] `validate.yml` runs HTML / JS / CSS sanity on PRs
- [x] `CNAME` file at repo root: `uipen.dev`

## DNS — ACTION ITEMS on your domain registrar

You own `uipen.dev` (or will). Add these DNS records where the domain is
managed (Namecheap, Cloudflare, Porkbun, etc.):

### Apex (`uipen.dev`) — four A records

```
Type  Name  Value             TTL
----  ----  ----------------  ---
A     @     185.199.108.153   3600
A     @     185.199.109.153   3600
A     @     185.199.110.153   3600
A     @     185.199.111.153   3600
```

(These are the four GitHub Pages apex IPs — pinned by GitHub, stable.)

### `www` subdomain (optional but recommended)

```
Type   Name  Value                     TTL
-----  ----  ------------------------  ---
CNAME  www   housamkak.github.io       3600
```

So `www.uipen.dev` redirects to `uipen.dev`.

## Verify + enable HTTPS

1. Wait 5–60 minutes for DNS to propagate (varies by registrar).
2. GitHub will auto-detect the custom domain from the `CNAME` file.
3. In https://github.com/HousamKak/uipen-website/settings/pages,
   under **Custom domain**:
   - You should see `uipen.dev` detected.
   - Click **Save**.
   - Check **Enforce HTTPS** once Let's Encrypt issues a cert
     (~5–30 min after DNS points correctly).

## Optional: GitHub-verified domain

Prevents someone else from claiming `uipen.dev` on a different GitHub
account. In GitHub → Profile → Settings → Pages → Add domain → follow
the TXT record instructions. Adds a `_github-pages-challenge-<user>`
TXT record to the domain's DNS.

## Publishing a new version of the site

Just push to `main`:

```sh
cd D:/dev/uipen-website
# edit index.html / styles.css / script.js
git commit -am "copy: <what changed>"
git push
```

The `deploy.yml` workflow runs, Pages updates, uipen.dev serves the new
version within ~30 seconds of the workflow finishing.

## Rolling back

```sh
git revert HEAD
git push
```

The next workflow run re-publishes the previous content. No hosting UI
involved.

## When to migrate off Pages

Consider moving to Cloudflare Pages or Netlify if any of these:

- You want the repo **private** (Pages on a free plan requires public).
- The site grows a build step (static site generator, bundler, etc.)
  and the Actions minutes start mattering.
- You need edge redirects / A/B tests / geographic routing.

For now, GitHub Pages + a CNAME is the minimum-overhead option.

## Publishing `latest.json` for the CLI auto-updater

The `uipen` binary hits
`https://uipen.dev/releases/latest.json` on startup to check for
updates. When the UIpen CLI's release workflow produces a `latest.json`,
copy it into this repo as `releases/latest.json` and push:

```sh
# After a UIpen release at https://github.com/HousamKak/uipen/releases
cd D:/dev/uipen-website
mkdir -p releases
# paste the latest.json contents from that release:
# (or: gh release view v1.0.0 --repo HousamKak/uipen --json assets ...)
vim releases/latest.json
git add releases/latest.json
git commit -m "release: publish latest.json for v1.0.0"
git push
```

Automation candidate: a second workflow in the UIpen repo that pushes
`latest.json` to this repo via a fine-grained PAT. Deferred until the
release cadence is frequent enough to matter.
