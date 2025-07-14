# Discord custom patch

A simple Node.js/TypeScript script to apply custom patches to Discord's *.asar file in the desktop application.

### Features
- Automatically finds the latest installed Discord app version
- Creates a backup of the original ASAR archive
- Unpacks, applies custom patches, and repacks the ASAR
- Cleans up temporary files

### Prerequisites
- Node.js (v22.12.0 or above)
- npm
- TypeScript installed
- Windows environment (uses %LOCALAPPDATA% for Discord path)

### Installation
1. Clone this repository:
```
git clone <repo-url>
cd <repo-directory>
```
2. Install dependencies:
```
npm install
```

### Build
Compile the TypeScript source to JavaScript:
```
npx tsc
```
By default, this generates a dist folder containing `main.js`.

### Configuration
Define your custom patches in the customs array inside `main.ts`:
```
const customs = [
  {
    name: "Hide People",
    patch: './patches/hide-people.js',
    asarDir: 'modules/discord_desktop_core-1/discord_desktop_core',
    asarFile: 'core.asar',
    source: 'app/mainScreenPreload.js'
  }
];
```
Place your patch files under `./patches`.

### Usage
After building, run the compiled script:
```
node dist/main.js
```
The script will:
1. Locate all `app-*` folders under `%LOCALAPPDATA%\Discord`
2. Determine the latest version
3. Back up asarFile with a timestamped filename
4. Extract the ASAR into `./temp_unpacked`
5. Append your patch code to the target source file
6. Repack the ASAR and overwrite the original
7. Remove temporary unpacked files

### Adding New Patches
1. Create a patch file in `./patches`, exporting the code snippet you want to inject.
2. Add an entry to the customs array with:
- name: descriptive name for logging
- patch: relative path to your patch file
- asarDir: path inside Discord folder to the folder containing core.asar
- asarFile: name of the ASAR archive (e.g., core.asar)
- source: path inside the unpacked ASAR to the file you want to patch

### Disclaimer
This script and accompanying code are provided "as-is", without warranty of any kind, express or implied. Use it at your own risk. The author and contributors are not liable for any damages, data loss, or issues arising from its use. You are responsible for ensuring compliance with Discord’s terms of service and any applicable laws.