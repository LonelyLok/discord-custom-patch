import path from 'path';
import { readdir, readFile, writeFile, rm } from "fs/promises";
import fs from 'fs';
const base = process.env.LOCALAPPDATA;
import asar from '@electron/asar';

const discordPath = path.join(base as string, 'Discord');

function getLatestDiscordApp(versions: string[]): string {
  // Helper to turn "app-1.0.9199" → [1,0,9199]
  const toNums = (v: string) =>
    v
      .replace(/^app-/, "")
      .split(".")
      .map((n) => parseInt(n, 10));

  return versions.reduce((latest, curr) => {
    const a = toNums(latest);
    const b = toNums(curr);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const na = a[i] ?? 0;
      const nb = b[i] ?? 0;
      if (nb > na) return curr;
      if (nb < na) return latest;
    }
    return latest; // they’re equal
  });
}

async function listFolders(dirPath: string) {
  try {
    // withFileTypes: gives you Dirent objects you can query
    const entries = await readdir(dirPath, { withFileTypes: true });
    const folders = entries
      .filter(ent => ent.isDirectory())
      .map(ent => ent.name);
    return folders;
  } catch (err) {
    console.error("Error reading directory:", err);
    return [];
  }
}

const customs = [
  {
    name: "Hide People",
    patch: './patches/hide-people.js',
    asarDir: 'modules/discord_desktop_core-1/discord_desktop_core',
    asarFile: 'core.asar',
    source: 'app/mainScreenPreload.js'
  }
];

(async () => {
  try {
    const folders = (await listFolders(discordPath)).filter(folder => folder.startsWith("app-"));
    const latest = getLatestDiscordApp(folders);
    console.log("Latest Discord App Version:", latest);

    for (const custom of customs) {
      const { asarDir, asarFile } = custom;
      const archivePath = path.join(discordPath, latest, asarDir, asarFile);

      const isFileExist = fs.existsSync(archivePath)

      if (!isFileExist) {
        console.error(`Archive not found: ${archivePath}`);
        continue
      }

      const fileName = path.basename(archivePath);


      const backupName = `${Date.now()}_${fileName}`; // e.g. "core_2025-07-13T15-24-30Z.asar"
      const backupPath = path.join(discordPath, latest, asarDir, backupName);

      // 5) Copy synchronously (or use fs.copyFile for async)
      fs.copyFileSync(archivePath, backupPath);

      const outDir = './temp_unpacked';
      await asar.extractAll(archivePath, outDir);

      const sourcePath = path.join(outDir, custom.source);
      const sourceCode = await readFile(sourcePath, "utf-8");

      const patchCode = await readFile(custom.patch, "utf-8");

      const patchedCode = sourceCode + "\n\n// ── CUSTOM PATCH START ──\n"
        + patchCode
        + "\n// ── CUSTOM PATCH END ──\n";

      await writeFile(sourcePath, patchedCode, "utf-8");

      await asar.createPackage(outDir, archivePath);

      console.log(`Patched ${custom.name} in ${latest}`);

      await rm(outDir, { recursive: true, force: true });
      console.log(`Cleaned up temporary files for ${custom.name}`);
    }
  } catch (err) {
    console.error(err);
  }
})();