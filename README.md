<img src="assets/icon.svg" width="64" height="64" alt="">

# Metronome

A metronome for the browser: tempo 30–252 BPM, tap tempo, up to 8 beats with
subdivisions, muted beats and four click sounds.

It is a web port of [Metronome](https://github.com/Kr0oked/Metronome) for
Android by Philipp Bobek (Kr0oked), whose click sounds it uses unchanged.

## Development

Requires the Node version in `.node-version` and pnpm.

```sh
pnpm install
pnpm exec playwright install chromium   # once, for pnpm test:e2e
pnpm dev
```

The scripts in `package.json` cover building, linting, type checking, unit
tests and end-to-end tests. Builds take their version from `APP_VERSION`, or
from `git describe`.

## Releasing

Push a SemVer tag on a commit that is already on `main`:

```sh
git switch main && git pull --ff-only
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

The [release workflow](.github/workflows/release.yml) runs every check,
deploys to Cloudflare Workers through the `production` environment, and then
publishes a GitHub Release with generated notes and the deployed URL. A tag
with a pre-release suffix, such as `v1.3.0-rc.1`, creates a GitHub pre-release
and does not deploy.

Deploys use two repository secrets: `CLOUDFLARE_ACCOUNT_ID`, and a
`CLOUDFLARE_API_TOKEN` with the Workers Scripts Edit and Account Settings Read
account permissions plus the User Details Read and Memberships Read user
permissions.

## License

[GPL-3.0-only](LICENSE).
