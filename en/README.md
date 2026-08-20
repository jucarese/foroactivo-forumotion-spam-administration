# Forumotion Spam Administration

Version 1.1.6 of the English administrative extension.

## New in version 1.1.6

- Walks every page of the post search.
- Separately finds every topic started by the user.
- Checks that each topic's first post really belongs to the user before including it.
- Prevents partial Forumotion pagination from limiting the scan to the first results.

## Features

- Finds topics and replies posted by a specified user.
- Collects the username, numeric ID, profile, posts, and external URLs.
- Requires a pre-deletion report before deletion can be enabled.
- Deletes topics started by the user and their replies in other topics.
- Verifies each operation and produces a final log.
- Uses only actions permitted by the current administrator session.

It does not ban or delete the account and does not automatically submit spam reports to Forumotion.

## Installation

### Temporary Firefox installation

1. Download and extract the English ZIP from `releases`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on**.
4. Select `manifest.json`.

Version 1.1.6 must be signed by Mozilla for permanent installation. Until that update is published, the signed listing may continue to offer an earlier version.

### Chrome or Edge

1. Extract the ZIP.
2. Open the browser's extensions page.
3. Enable developer mode.
4. Select **Load unpacked**.
5. Choose the extracted directory.

## Safe use

1. Sign in as an administrator or moderator and open a forum page.
2. Open the extension, enter the exact username, and scan the posts.
3. Review and download the required pre-deletion report.
4. Type the requested confirmation and start deletion.
5. Keep the final log and sign out when finished.

Deletion is irreversible. Perform a controlled test on a test forum first.

Designed for phpBB2, phpBB3, PunBB, Invision, ModernBB, and AwesomeBB. Heavily customized templates may hide native actions; in that case the extension records the error.
