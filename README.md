# Discord custom patch

A small Node.js/TypeScript patcher for Discord Desktop's `*.asar` files on Windows.

The script finds the latest installed Discord app under `%LOCALAPPDATA%\Discord`, backs up the target ASAR, extracts it, applies configured source edits, repacks the ASAR, and removes the temporary extraction folder.

### Features

- Finds the latest installed `app-*` Discord version automatically
- Backs up each target ASAR before modifying it
- Applies multiple edits to the same ASAR in one extract/repack cycle
- Supports appending patch files to Discord source files
- Supports regex-based source replacements when needed
- Cleans up `./temp_unpacked` after a successful patch run

Current included patches:

- `hide-people.js`: adds a Friends page toggle for hiding/showing the People and Active Now panels
- `popout-test.js`: adds a channel header button that requests a separate channel window
- `channel-window-main.js`: creates authenticated native Discord channel windows from the main process

### Prerequisites

- Windows
- Node.js
- npm
- Dependencies installed with `npm install`

The patcher uses `%LOCALAPPDATA%\Discord`, so it is currently Windows-specific.

### Installation

```powershell
npm install
```

### Build

Compile the TypeScript source to JavaScript:

```powershell
npx.cmd tsc
```

This writes the compiled script to `dist/main.js`.

### Usage

Run the compiled patcher:

```powershell
node dist/main.js
```

After patching, fully quit and restart Discord.

The script will:

1. Locate all `app-*` folders under `%LOCALAPPDATA%\Discord`
2. Pick the latest Discord app version
3. Back up each configured ASAR with a timestamped filename
4. Extract the ASAR into `./temp_unpacked`
5. Apply every configured edit for that ASAR
6. Repack the ASAR and overwrite the original
7. Remove `./temp_unpacked`

### Configuration

Patch targets are configured in the `archives` array inside `main.ts`.

Each archive entry points to one ASAR file. Each `edit` modifies one source file inside the extracted ASAR.

```ts
const archives: ArchivePatch[] = [
  {
    name: "Desktop Core",
    asarDir: 'modules/discord_desktop_core-1/discord_desktop_core',
    asarFile: 'core.asar',
    edits: [
      {
        name: "Desktop Core Preload Patches",
        source: 'app/mainScreenPreload.js',
        patches: [
          './patches/hide-people.js',
          './patches/popout-test.js'
        ]
      },
      {
        name: "Channel Window Main",
        source: 'app/mainScreen.js',
        patches: [
          './patches/channel-window-main.js'
        ]
      }
    ]
  }
];
```

Edit fields:

- `name`: label used in console output
- `source`: path to the file inside the extracted ASAR
- `patches`: patch files to append to the source file
- `replacements`: optional regex replacements for in-place source edits

Archive fields:

- `name`: label used in console output
- `asarDir`: folder under the Discord app version containing the ASAR
- `asarFile`: ASAR filename, such as `core.asar`
- `edits`: source edits to apply before repacking this ASAR

### Adding New Patches

Create a new JavaScript file under `./patches`, then add it to the relevant `patches` array in `main.ts`.

Use the same `edit` when multiple patch files should be appended to the same Discord source file. Add a new `edit` when the patch belongs in a different source file.

For example, preload/browser DOM patches usually go into:

```ts
source: 'app/mainScreenPreload.js'
```

Main-process Electron patches usually go into:

```ts
source: 'app/mainScreen.js'
```

### Backups and Unpatching

Before modifying an ASAR, the script creates a timestamped backup next to the original ASAR in the Discord install directory.

There is not currently an automated unpatch command. To revert manually, restore the desired backup over the patched ASAR.

### Generated Files

The patcher uses `./temp_unpacked` while running and deletes it after a successful patch. If a run fails, that folder may remain for debugging and can be deleted manually.

The repository also ignores extracted Discord source folders such as `temp_unpack/`.

### Disclaimer

This project modifies Discord Desktop installation files. Use it at your own risk. Changes may break after Discord updates, and you are responsible for complying with Discord's terms of service and any applicable laws.
