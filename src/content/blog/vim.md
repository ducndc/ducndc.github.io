---
title: 'Vi & Vim: A Practical Guide'
description: 'A comprehensive reference for editing text efficiently with vi and Vim'
pubDate: 'July 07 2025'
heroImage: '../../assets/vim_image.jpeg'
---

`vi` is a terminal text editor available on virtually every Unix system. When you open a file, vi copies it into a buffer, lets you edit it, and writes it back on save. Vim (Vi IMproved) extends vi with syntax highlighting, plugins, GUI support, and much more.

---

## The two modes

Vi operates in two modes:

- **Command mode** — every keystroke is a command. This is where you start when you open a file.
- **Insert mode** — keystrokes produce text, like a normal editor.

Switch to insert mode with `i`, `I`, `a`, `A`, or similar commands. Return to command mode with `ESC`.

---

## Opening files

```
vi filename          # open an existing or new file
vi -p file1 file2   # open files in separate tabs
vi -o file1 file2   # open files in horizontal splits
vi -O file1 file2   # open files in vertical splits
```

When a file opens, tildes (`~`) on the left indicate empty lines. The status line at the bottom shows the filename and file info.

---

## Saving and quitting

| Command | Action |
|---------|--------|
| `ZZ` | Save and quit |
| `:wq` or `:x` | Save and quit (ex command) |
| `:q!` | Quit without saving |
| `:w` | Save without quitting |

---

## Basic editing

### Inserting text

| Command | Action |
|---------|--------|
| `i` | Insert before cursor |
| `I` | Insert at beginning of line |
| `a` | Append after cursor |
| `A` | Append at end of line |

### Changing text

| Command | Action |
|---------|--------|
| `r` | Replace one character (stays in command mode) |
| `~` | Toggle case of character under cursor |
| `cw` | Change word |
| `cc` / `C` | Change line / rest of line |
| `s` | Substitute character at cursor |
| `S` | Substitute entire line |

### Deleting text

| Command | Action |
|---------|--------|
| `dw` | Delete word |
| `dd` | Delete line |
| `dl` or `x` | Delete one character |
| `D` | Delete to end of line |

### Repeat and undo

| Command | Action |
|---------|--------|
| `.` | Repeat the last command |
| `u` | Undo last change |
| `U` | Undo all changes on current line |
| `J` | Join current line with the line below |

> **Tip:** Most commands accept a count prefix. `2dd` deletes two lines, `5dw` deletes five words, and `20i hi, there! ESC` inserts the phrase 20 times.

---

## Movement

### Basic cursor movement

| Command | Action |
|---------|--------|
| `h` `j` `k` `l` | Left, down, up, right |
| `e` / `b` | Forward / backward one word |
| `+` / `-` | First character of next / previous line |

### Line navigation

| Command | Action |
|---------|--------|
| `0` or `^` | Beginning of line |
| `$` | End of line |

### File navigation

| Command | Action |
|---------|--------|
| `#G` | Go to line number `#` |
| `G` | Go to last line |
| ` `` ` | Return to previous position |
| `H` / `M` / `L` | Top / middle / last line on screen |

### Scrolling

| Command | Action |
|---------|--------|
| `^F` / `^B` | Scroll forward / backward one full screen |
| `^D` / `^U` | Scroll down / up half a screen |

> **Tip:** Show line numbers with `:set nu` or `:set number`. Hide them with `:set nonu`.

---

## Searching

### Pattern search

| Command | Action |
|---------|--------|
| `/pattern` | Search forward for pattern |
| `?pattern` | Search backward for pattern |
| `n` / `N` | Repeat search forward / backward |

Search patterns support regular expressions — `.`, `*`, `[]`, and more.

### Character search (within a line)

| Command | Action |
|---------|--------|
| `fx` | Find character `x` forward on current line |
| `Fx` | Find character `x` backward on current line |
| `;` / `,` | Repeat character search forward / backward |

---

## Cutting, copying, and pasting

Deleted text is saved to a buffer automatically and can be pasted with `p`.

### Yank (copy) and put (paste)

| Command | Action |
|---------|--------|
| `yy` or `Y` | Yank (copy) current line |
| `yw` | Yank word |
| `y$` | Yank to end of line |
| `p` | Paste after cursor |
| `P` | Paste before cursor |

### Unnamed buffers

Vi saves your last nine deletions in numbered buffers. Paste the second-to-last deletion with `"2p`.

### Named buffers (a–z)

Use named buffers to save specific yanks or deletions:

| Command | Action |
|---------|--------|
| `"zdw` | Delete into buffer `z` |
| `"zyy` | Yank into buffer `z` |
| `"zp` | Paste from buffer `z` |

Using a capital letter (e.g. `"Zyy`) appends to the named buffer rather than replacing it.

---

## Ex commands

Every time you type `:` in vi, you invoke the `ex` line editor — vi's underlying engine. Ex commands are powerful because they can operate on ranges of lines at once.

### Line addressing

| Address | Meaning |
|---------|---------|
| `3` | Line 3 |
| `.` | Current line |
| `$` | Last line |
| `%` | Every line in the file |
| `/pattern/` | Next line matching pattern |

Examples:
- `:3,18d` — delete lines 3 through 18
- `:.,$ d` — delete from current line to end of file
- `:%d` — delete all lines
- `:/pattern/d` — delete the next line matching pattern

### Global search and replace

```
:s/old/new/          # replace first match on current line
:s/old/new/g         # replace all matches on current line
:%s/old/new/g        # replace all matches in the whole file
:%s/old/new/gc       # replace all matches, with confirmation
```

Combine with the global command to restrict replacements to matching lines:

```
:g/pattern/s/old/new/g
```

### Working with multiple files

```
:e filename          # edit another file (save current first with :w)
:n                   # move to next file in the argument list
:r filename          # read another file's contents into current file
:args                # list all files currently being edited
```

### Search and replace across multiple buffers

```vim
:bufdo %s/pattern/replace/ge | update   " replace in all open buffers
:argdo %s/pattern/replace/ge | update   " replace in all argument files
```

The `e` flag suppresses errors when a pattern isn't found. `update` only writes files that were changed.

---

## Vim (Vi IMproved)

Vim adds a substantial layer of features on top of vi:

### Syntax and indentation

```vim
:syntax on        " enable syntax highlighting
:set autoindent   " enable automatic indentation
:set number       " show line numbers
```

### Session persistence

Vim stores session history in `~/.viminfo`, allowing it to remember your position, yank history, and command history between sessions — even across different files.

### Transparent editing

Vim can open compressed or archived files directly (e.g. `myfile.tar.gz`) and lets you browse and edit directory listings using standard navigation commands.

### Meta-information registers

Vim exposes several read-only registers for inserting metadata:

| Register | Contents |
|----------|----------|
| `%` | Current filename |
| `#` | Alternate filename |
| `:` | Last ex command executed |
| `.` | Last inserted text |

### Plugins and configuration

Vim supports a rich ecosystem of plugins, configurable through `~/.vimrc`. Options worth setting early:

```vim
:set hidden          " allow unsaved buffers in the background
:set autowriteall    " auto-save when switching buffers
```

Popular plugin managers include [vim-plug](https://github.com/junegunn/vim-plug) and [Pathogen](https://github.com/tpope/vim-pathogen). Plugins can add IDE-like features including file trees, fuzzy finding, git integration, and language server support.