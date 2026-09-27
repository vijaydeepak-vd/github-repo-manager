# GitHub Repo Manager

A small set of Node.js scripts for bulk-managing repositories owned by a GitHub user. The scripts can:

- Export the names of all repositories you own.
- Prepare selected repositories and transfer them to an organization.
- Change selected repositories between private and public visibility.
- Permanently delete selected repositories.
- Archive or unarchive selected repositories.

> [!WARNING]
> The transfer, visibility, and deletion scripts modify live GitHub repositories. Repository deletion is permanent. Review every list file before running a script and test with a non-critical repository first.

## Requirements

- Node.js 20 or later
- A GitHub personal access token with permission to perform the requested operations
- Owner or administrator access to the affected repositories
- Permission to create or transfer repositories into the target organization, when using the transfer script

For a classic personal access token, private repository management generally requires the `repo` scope, while deletion also requires `delete_repo`. If your organization uses SAML SSO, authorize the token for that organization. Fine-grained token permissions depend on the operations and repositories selected.

## Installation

```bash
npm install
```

Create a `.env` file in the project root:

```dotenv
GITHUB_TOKEN=github_pat_your_token
GITHUB_USER=your_github_username
TARGET_ORG=your_target_organization
```

Do not commit `.env` or expose your token in logs or screenshots.

## List Files

Each operation reads repository names from a plain-text file. Add one repository name per line; blank lines are ignored.

```text
repository-one
repository-two
repository-three
```

Use names only, without the owner or GitHub URL.

| File | Used by | Purpose |
| --- | --- | --- |
| `all_repos.txt` | `1-fetch-repos.js` | Generated inventory of repositories owned by the authenticated user |
| `move.txt` | `2-transfer-repos.js` | Repositories to unarchive if needed, make private, and transfer |
| `visibility.txt` | `3-change-visibility.js` | Repositories whose visibility should change while preserving archived status |
| `delete.txt` | `4-delete-repos.js` | Repositories to permanently delete after a cancellation window |
| `archive.txt` | `5-change-archive-status.js` | Repositories to archive or unarchive |

## Usage

The numbered filenames suggest a workflow, but each script can be run independently.

### 1. Fetch Owned Repositories

```bash
node 1-fetch-repos.js
```

This fetches every repository where the authenticated account is the owner and writes the repository names to `all_repos.txt`. Copy the repositories you want to process into the appropriate list file.

### 2. Transfer Repositories

Add repository names to `move.txt`, verify `GITHUB_USER` and `TARGET_ORG`, then run:

```bash
node 2-transfer-repos.js
```

For each listed repository, the script checks its current state, unarchives it if necessary, makes it private if necessary, and then requests a transfer from `GITHUB_USER` to `TARGET_ORG`. Brief pauses allow GitHub to process state changes before the next operation. GitHub may require the target organization to accept the transfer, depending on its settings.

Transferred repositories are not automatically archived again in the target organization.

### 3. Change Visibility

Add repository names to `visibility.txt`, then run:

```bash
node 3-change-visibility.js
```

By default, the script makes repositories private. To make them public, change this line in `3-change-visibility.js` before running it:

```js
const makePrivate = false;
```

For each repository, the script checks whether it is archived. Archived repositories are temporarily unarchived, updated, and archived again. Brief pauses allow each state change to propagate.

Changing visibility can affect forks, GitHub Pages, Actions, security settings, and access. Review GitHub's visibility-change warnings before proceeding.

### 4. Delete Repositories

Add repository names to `delete.txt`, confirm the owner selected by `targetOwner` in `4-delete-repos.js`, then run:

```bash
node 4-delete-repos.js
```

The script currently deletes from `GITHUB_USER`. To delete repositories from `TARGET_ORG`, update the owner assignment in `4-delete-repos.js`:

```js
const targetOwner = process.env.TARGET_ORG;
```

> [!CAUTION]
> There is no confirmation prompt or dry-run mode. After displaying the target owner and repository count, the script waits five seconds before deletion begins. Press Ctrl+C during this window to abort. Otherwise, every non-empty line in `delete.txt` is submitted to GitHub for permanent deletion.

The script pauses briefly after each successful deletion to reduce the risk of hitting GitHub's secondary rate limits.

### 5. Archive or Unarchive Repositories

Add repository names to `archive.txt`, then run:

```bash
node 5-change-archive-status.js
```

By default, the script archives repositories. To unarchive them, change this line in `5-change-archive-status.js` before running it:

```js
const archiveRepos = false;
```

The script checks each repository's current status and skips repositories already in the requested state. After each update, it pauses briefly to allow the change to propagate.

## Behavior and Limitations

- Repositories are processed sequentially.
- A failure is logged and processing continues with the next repository.
- List entries are interpreted relative to the configured owner; `owner/repository` values are not supported.
- The scripts do not retry failed API requests or poll transfer status.
- The transfer script may remove GitHub's archived status because archived repositories must be unarchived before transfer. It does not restore that status after transfer.
- The visibility script restores archived status only after a successful visibility update. An API failure after unarchiving may leave a repository unarchived.
- Archived repositories are read-only until they are unarchived.

## Recommended Safety Checks

1. Confirm the authenticated account and configured owners.
2. Keep only the intended repository names in the relevant list file.
3. Test the operation with one non-critical repository.
4. Preserve a clone or backup before changing visibility, transferring, or deleting repositories.
5. Revoke or rotate the personal access token when the work is complete.
