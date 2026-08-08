# CiteBeat GitHub adapter for this homepage

CiteBeat's core and its existing HTTP endpoint remain platform-neutral. The optional GitHub adapter is a transport: it writes the exact `citation.snapshot/1` returned by `buildSnapshot()` to a user-configured repository file. It must not contain homepage-specific field conversion.

## Adapter settings

The adapter should be disabled by default and expose user-configured fields:

```js
githubEnabled: false,
githubOwner: '',
githubRepository: '',
githubBranch: 'main',
githubPath: '',
githubIntervalDays: 7
```

Store `githubToken` separately in `chrome.storage.local`, outside `settings` and outside CiteBeat backups. Add `https://api.github.com/*` as an optional host permission and request it only when the user enables or tests the adapter.

## Write algorithm

1. Call the existing `buildSnapshot()`; do not reshape its output.
2. GET `https://api.github.com/repos/{owner}/{repository}/contents/{path}?ref={branch}`.
3. If the file exists, decode its Base64 content and compare `source.fetchedAt`. If the existing value is newer or equal, report success without committing.
4. PUT the UTF-8 JSON snapshot to the same Contents API URL with:
   - `message: "chore: sync Google Scholar citations from CiteBeat"`
   - `content`: Base64 of `JSON.stringify(snapshot, null, 2) + "\n"`
   - `branch`
   - the current `sha` when updating an existing file.
5. If PUT returns 409, repeat GET and retry PUT once with the new SHA.
6. Treat HTTP 200 or 201 as success and store the last commit SHA/time. A GitHub failure must not affect CiteBeat's local citation refresh.

Use these headers:

```http
Accept: application/vnd.github+json
Authorization: Bearer <fine-grained token>
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
```

The adapter must support Unicode JSON when converting to Base64.

## Settings for this site

These are installation-time values, not CiteBeat defaults:

```text
Owner: sci-m-wang
Repository: sci-m-wang.github.io
Branch: main
Path: src/data/citations.json
Interval: 7 days
```

The fine-grained token needs access only to `sci-m-wang.github.io` with Repository permissions → Contents: Read and write. A commit made with the personal token triggers `.github/workflows/deploy.yml` on `main`.

## Homepage contract

The homepage imports `src/data/citations.json` at build time and accepts:

- CiteBeat's raw `citation.snapshot/1`; or
- the older manual fallback shape emitted by `scripts/update-citations.mjs`.

For a CiteBeat snapshot it reads:

- `source.provider` and `source.authorId` for source validation;
- `source.fetchedAt` for the displayed update date;
- `metrics.citations`, `metrics.hIndex`, and `metrics.i10Index`;
- `papers[].title` and `papers[].citations` for normalized-title matching.

No receiver service, Worker, KV store, or additional GitHub Action is required.
