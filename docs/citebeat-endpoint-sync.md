# CiteBeat generic endpoint sync

CiteBeat is a citation-data producer. Its generic endpoint transport sends a platform-neutral snapshot to a user-configured HTTPS endpoint and does not know how the receiver stores or publishes the data. GitHub repositories, branches, file paths, commits, Pages, and Cloudflare must not appear in the core snapshot builder or generic endpoint transport; platform-specific transports may be separate optional adapters.

## Responsibilities

CiteBeat:

- fetches citation data from the selected academic source;
- creates a versioned snapshot;
- periodically sends it to an optional endpoint;
- records delivery status without affecting local citation tracking.

The receiver:

- authenticates and validates requests if desired;
- deduplicates events;
- transforms and stores data;
- updates a website, database, repository, or another downstream system.

## Extension settings

Add generic defaults to `DEFAULT_SETTINGS`:

```js
endpointEnabled: false,
endpointUrl: '',
endpointIntervalDays: 7,
endpointAuthType: 'none'
```

Store an optional Bearer secret separately as `endpointSecret` in `chrome.storage.local`. Do not put it in `settings` or the existing backup export.

The options page should contain:

- Enable endpoint delivery
- Endpoint URL
- Delivery interval in days
- Authentication: None / Bearer token
- Bearer token input, shown only when selected
- Test endpoint
- Send now
- Last successful delivery time
- Last delivery error

No endpoint, account, repository, or platform may be preconfigured. Placeholders may use neutral values such as `https://example.com/citebeat`.

## Runtime host permission

Do not add GitHub or a fixed receiver to `host_permissions`. Declare only optional origins:

```json
"optional_host_permissions": [
  "https://*/*",
  "http://localhost/*",
  "http://127.0.0.1/*"
]
```

When the user saves or tests an endpoint, validate the URL and request permission for that exact origin from the options-page click handler:

```js
const url = new URL(endpointUrl);
if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
  throw new Error('Endpoint 必须使用 HTTPS');
}

const granted = await chrome.permissions.request({
  origins: [`${url.origin}/*`]
});
if (!granted) throw new Error('未授予该 Endpoint 的访问权限');
```

This keeps the installed extension free from broad permanent host access.

## Snapshot protocol

Send `Content-Type: application/json` with this versioned shape:

```json
{
  "schemaVersion": 1,
  "eventType": "citation.snapshot",
  "eventId": "stable identifier for this snapshot",
  "observedAt": "2026-08-08T08:00:00.000Z",
  "source": {
    "provider": "google-scholar",
    "authorId": "author identifier"
  },
  "metrics": {
    "totalCitations": 660,
    "hIndex": 8,
    "i10Index": 7
  },
  "papers": [
    {
      "id": "source paper identifier",
      "title": "Paper title",
      "citations": 21,
      "url": "https://scholar.google.com/..."
    }
  ],
  "producer": {
    "name": "CiteBeat",
    "version": "0.3.0"
  }
}
```

Requirements:

- `eventId` must be stable for identical citation content so receivers can deduplicate retries. Calculate it from provider, author ID, metrics, and sorted paper IDs/counts; do not include `observedAt` in the digest.
- `papers` must be sorted deterministically.
- all citation metrics must be non-negative integers;
- refuse to send an empty or suspiciously incomplete paper list;
- use `schemaVersion` for future compatibility instead of silently changing the payload.

## Sender behavior

Use a normal POST request:

```js
async function postCitationSnapshot(settings, snapshot, secret) {
  const headers = {
    'Content-Type': 'application/json',
    'X-CiteBeat-Event': 'citation.snapshot',
    'X-CiteBeat-Event-Id': snapshot.eventId,
    'X-CiteBeat-Version': chrome.runtime.getManifest().version
  };

  if (settings.endpointAuthType === 'bearer' && secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  const response = await fetch(settings.endpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(snapshot),
    signal: AbortSignal.timeout(20_000)
  });

  if (!response.ok) {
    throw new Error(`Endpoint HTTP ${response.status}`);
  }
}
```

Delivery rules:

- disabled by default;
- background delivery follows `endpointIntervalDays`;
- the first successful source refresh after enabling may send immediately;
- manual “Send now” bypasses the interval;
- “Test endpoint” sends a small `endpoint.test` event, not fake citation data;
- retry network errors, HTTP 408, 429, and 5xx at most twice with short exponential backoff;
- do not automatically retry other 4xx responses;
- repeated delivery uses the same `eventId`;
- record `endpointLastSuccessAt`, `endpointLastEventId`, and `endpointLastError`;
- delivery failure must not change the badge to a Scholar-fetch error or discard local data.

The endpoint response body is optional. Any 2xx status means accepted.

## Scholar metrics

`fetchScholar()` currently parses only total citations. Parse the all-time values from the Scholar metric cells:

```js
const metrics = [...firstHtml.matchAll(
  /<td[^>]*class="[^"]*\bgsc_rsb_std\b[^"]*"[^>]*>([\s\S]*?)<\/td>/gi
)].map(match => {
  const digits = stripTags(match[1]).replace(/[^0-9]/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
});

if (metrics.length < 5) throw new Error('Google Scholar 指标不完整');

const total = metrics[0];
const hIndex = metrics[2];
const i10Index = metrics[4];
```

Return `{ total, hIndex, i10Index, papers }` and construct the snapshot only after the existing incomplete-result checks pass.

## Integration points

Change `updateCitations()` to accept an option such as `{ forceEndpoint = false }`. After local state has been saved successfully, call the endpoint sender in a separate `try/catch`.

- alarm/startup refresh: normal interval rules;
- existing manual Scholar refresh: refreshes the source, then may call the endpoint according to normal rules;
- explicit “Send now”: sends the latest complete local snapshot immediately without requiring another Scholar fetch;
- endpoint-setting changes must not reset the user's citation baseline.

## Documentation and tests

Update `PRIVACY.md` and store-submission text to explain that endpoint delivery is disabled by default and sends public citation data only to the URL configured by the user.

Acceptance tests must cover:

- no network request while disabled;
- no personal domain, GitHub URL, repository, or receiver in defaults;
- exact-origin permission request;
- invalid URL and denied permission;
- JSON schema and deterministic `eventId`;
- Unicode titles;
- None and Bearer authentication;
- timeout, retryable errors, non-retryable 4xx, and 2xx success;
- interval throttling and manual send;
- incomplete Scholar results are never delivered;
- endpoint failures do not affect local citation tracking, trends, baselines, or badges.

## Optional transports

The same snapshot may also be sent through independent transports. This homepage uses the optional GitHub adapter documented in `citebeat-github-adapter.md`, which commits the raw snapshot without changing its fields. The generic endpoint remains available for databases, serverless receivers, or other downstream systems.
