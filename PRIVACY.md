# Privacy

scrollmark collects no data and makes no network request. Everything it keeps
stays in Safari's extension storage on your device.

## What the extension reads

The content script runs on `https://x.com/*` and `https://twitter.com/*` only.
It reads the address of the page, the profile handle, the label of the selected
profile tab, the position of each visible post on screen, and the post
identifier in each post's status link. It does not read post text, media,
account details or any page outside those two hosts.

## What it stores

For each profile and tab it stores one record in `browser.storage.local` under
the key `bookmark.<handle>.<tab>`. The record holds two fields: `tweetId`, the
identifier of the last post seen, and `seenAt`, the time that post was seen.
Records for the home timeline are removed on the next page load. Each page load
on `x.com` or `twitter.com` also deletes records last seen more than 90 days
ago and, beyond the newest 200 records, the oldest.

## What it does not do

- It sends no request to any server, including its authors.
- It collects no analytics, crash reports or identifiers.
- It has no account and no sync. Records do not leave the device.
- The companion app reads and writes no user data. It runs in the macOS App
  Sandbox with no other entitlement, and its privacy manifest declares no
  tracking, no collected data types and no accessed API types.

## What a page can detect

The extension sets no attribute on the page and logs nothing. The `jump to
bookmark` button it inserts on a profile page is part of that page, so scripts
on the page can see it and can tell that the extension is active.

## Why each permission exists

- `storage` keeps the records above.
- `https://x.com/*` and `https://twitter.com/*` let the content script read the
  timeline and insert the `jump to bookmark` button.

## Removing the data

The toolbar button opens a popup that shows how many records are saved and
clears all of them. Removing the extension deletes its storage. Disabling it in
Safari settings keeps the records.

## Contact

Raise questions in the issue tracker at
<https://github.com/openbunny/scrollmark/issues>. Report a security problem
privately, following [SECURITY.md](SECURITY.md).
