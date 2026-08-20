FORUMOTION SPAM ADMINISTRATION
==============================

VERSION 1.1.5 · ENGLISH EDITION

Purpose
-------
This administrative browser extension works locally with an already-open
Forumotion administrator session.

1. Finds topics and replies posted by a specified user.
2. Collects the username, numeric user ID, canonical profile address, visible
   profile data, links to the user's posts, and external URLs found in them.
3. Requires a pre-deletion report to be downloaded before deletion is enabled.
4. Deletes complete topics started by the user, including other members'
   replies within those topics.
5. Deletes the user's replies from topics started by other members.
6. Checks each operation to confirm that the content is no longer present.
7. Downloads a final log listing each confirmed deletion and each error.

The extension does not ban or delete the user account.

Using the Forumotion anti-spam tool
-----------------------------------
The report preserves the external URLs posted by the spammer and links to the
posts before they disappear. These details can be copied into Forumotion's
official anti-spam reporting tool.

The extension does not submit a spam report automatically. Content deletion
uses only native actions allowed by the current administrator session.

Security
--------
- No usernames, passwords, cookies, or session keys are stored.
- No information is sent to an external server.
- Reports are generated and downloaded locally in the browser.
- Closing the Forumotion session removes the extension's ability to delete.
- Deletion requires downloading the report and typing the exact confirmation.
- Cancellation stops the process after the current operation finishes.

IMPORTANT
---------
Deletion cannot be undone. Test first with a temporary user and deliberately
created posts on a test forum. Do not use it on a real user until the report and
deletion have both been verified.

Chrome installation
-------------------
1. Extract the ZIP file.
2. Open chrome://extensions
3. Enable Developer mode.
4. Select Load unpacked.
5. Select the forumotion-spam-administration folder.

Edge installation
-----------------
1. Extract the ZIP file.
2. Open edge://extensions
3. Enable Developer mode.
4. Select Load unpacked.
5. Select the forumotion-spam-administration folder.

Temporary Firefox installation
------------------------------
1. Extract the ZIP file.
2. Open about:debugging#/runtime/this-firefox
3. Select Load Temporary Add-on.
4. Select manifest.json.

Firefox removes temporary add-ons when the browser closes. Permanent
installation requires Mozilla signing.

Use
---
1. Sign in to Forumotion as an administrator.
2. Open a page on the forum.
3. Select the extension icon, then select Open tool.
4. Enter the exact username and select Scan posts.
5. Review the results.
6. Download and keep the required pre-deletion report.
7. Type the requested confirmation and start deletion.
8. Keep the downloaded final log.
9. Sign out of Forumotion completely.

User identification
-------------------
The primary identifier is the full canonical profile address, for example:

https://example.forumotion.com/u123

This identifies both the forum and the numeric user ID. Icons placed inside a
username are ignored when matching the profile link.

Compatibility
-------------
Designed for phpBB2, phpBB3, PunBB, Invision, ModernBB, and AwesomeBB.
Heavily customized templates may hide native actions. In that case the
extension records the error and does not bypass server permissions.
