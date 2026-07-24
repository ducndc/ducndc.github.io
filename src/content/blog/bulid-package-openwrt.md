---
title: 'Build Package in OpenWrt'
description: 'Build Package in OpenWrt'
pubDate: 'Jun 30 2026'
heroImage: '../../assets/AP_Sys.png'
---

## Adding and Building Packages/Feeds in OpenWrt

When working with OpenWrt, one of the most common tasks is **integrating an external feed** into the build tree, then building it into `.ipk` packages or embedding it directly into firmware. This post summarizes the full workflow based on real-world experience integrating a feed containing several sub-packages (libraries, background services, command-line tools) into an OpenWrt-based SDK tree.

### What a feed is, and why "update" + "install" are both needed

In OpenWrt, packages don't live permanently inside the `package/` tree — they're organized into **feeds**: collections of packages that can come from a separate Git repo, or from a local directory. The `feeds.conf` file (or `feeds.conf.default`) declares these feeds, for example:

```
src-link my_custom_feed /path/to/sdk/feeds/my_custom_feed
```

`src-link` is used for **local** feeds (a symlink, no network needed), while `src-git` is used when the feed lives in an external Git repo that needs to be cloned.

Once declared, two steps are always required:

```bash
./scripts/feeds update my_custom_feed         # sync the feed's metadata
./scripts/feeds install -a -p my_custom_feed  # symlink packages into the main package tree
```

The `install` step is mandatory — without it, `make menuconfig` **won't show** the feed's packages as selectable options.

### Structure of a package Makefile

A minimal OpenWrt package needs to declare its source (`PKG_SOURCE_URL`), version, and a hash for integrity checking. There are two common patterns:

**Tarball style (downloaded directly from a release archive page):**
```make
PKG_VERSION:=v1.2.3
PKG_SOURCE:=mylib-v1.2.3.tar.gz
PKG_SOURCE_URL:=https://example.com/mylib/archive/v1.2.3
PKG_HASH:=<sha256 of the tarball>
```

**Direct Git style** (used when a package tracks a specific commit rather than a release tag):
```make
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://example.com/myproject.git
PKG_SOURCE_VERSION:=<specific commit hash>
PKG_MIRROR_HASH:=<sha256 of the mirror tarball OpenWrt generates>
```

The key difference for offline builds: the tarball style only requires downloading a single `.tar.gz` file, while the Git style requires `git clone` + checking out the exact commit, then manually repackaging it — there's no ready-made tarball to grab directly.

### Building offline: preparing the `dl/` directory

When the build machine has no internet access, every source that the Makefiles need must be **downloaded in advance on a machine with network access**, then copied into the `dl/` directory at the root of the SDK tree. OpenWrt checks: if the file already exists in `dl/` **and** its hash matches `PKG_HASH`/`PKG_MIRROR_HASH`, it skips the network fetch and uses the local file directly.

The real-world workflow for a multi-package feed typically splits into two groups:
- Packages downloaded as direct tarballs — just `curl`/`wget` the right URL, then verify the SHA256.
- Packages that require `git clone` + manual repackaging — clone the repo, check out the exact commit, then compress it into a tarball following OpenWrt's naming convention (`<name>-<version>-<first 8 chars of commit>.tar.gz`).

A simple bash script can automate this entire process for both groups of packages.

**Important note**: for git-based packages you repackage yourself, `PKG_MIRROR_HASH` is the hash of OpenWrt's official mirrored copy — it won't necessarily match the tarball you create yourself. If the build reports a hash mismatch, the safe fix is to update `PKG_MIRROR_HASH` in the Makefile to the actual hash of the tarball you just created.

### Fetching source via the `repo` tool (when working with an AOSP-style workspace)

Some systems distribute source through Google's **`repo`** tool instead of plain Git — common in large projects with many sub-projects that need to be synced together against a shared manifest. A successfully initialized `repo` workspace creates a `.repo/` structure containing:
- `manifest.xml`: declares exactly which project, which path, and which commit/revision needs to be synced
- `project-objects/`: a shared Git object store used across projects
- `projects/`: where the actual working copies live (once `repo sync` has run)

An interesting detail: if `project-objects/` already contains a complete pack file (because a sync happened at some point), you can **check out the source entirely offline** using plain git commands, without calling `repo sync` again:

```bash
git --git-dir="<path>/project-objects/.../<project>.git" \
    --work-tree="<destination-path>" \
    checkout <commit-hash> -- .
```

This is useful when you receive a workspace that's already been synced (for example, packaged up into a zip file for handoff) but the destination machine has no network access.

### An easy-to-miss detail: feed directory structure can change between versions

The same feed, at two different points in time, can have a completely different structure — for example, a package that used to sit at the feed's root directory might get reorganized into a subdirectory grouped by function (services, tools, libraries, etc.) in a newer version, and new packages may be added along the way.

If you upgrade to a newer feed version without revisiting `feeds.conf`, build scripts, or `make package/<feed>/<path>/compile` commands, the build will fail with "package not found" errors even though the source is perfectly valid — simply because the path has changed.

### Full workflow summary

1. Declare the feed in `feeds.conf` (`src-link` for local, `src-git` for remote)
2. `./scripts/feeds update <feed name>`
3. `./scripts/feeds install -a -p <feed name>`
4. (For offline builds) Pre-download all source referenced by each Makefile's `PKG_SOURCE_URL`/`PKG_SOURCE_PROTO`, and place it in `dl/`
5. `make menuconfig` → select the packages to build
6. `make package/<feed>/<package-path>/compile V=s`
7. Check the output: `.ipk` files land in `bin/targets/.../packages/`, or get embedded into the image if building a full firmware

### Conclusion

Integrating an external feed into OpenWrt isn't mechanically difficult (it's just `feeds update` + `feeds install` + build), but two things commonly trip people up: **managing source for offline builds** (which requires understanding whether a Makefile's `PKG_SOURCE_URL` is tarball-style or git-style) and **tracking directory structure changes** across feed versions over time. Preparing a source-download script in advance, and always double-checking package paths before building, are two habits that help avoid most of the common errors in this workflow.