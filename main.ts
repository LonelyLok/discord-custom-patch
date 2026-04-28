import path from 'path';
import { readdir, readFile, writeFile, rm } from "fs/promises";
import fs from 'fs';
import asar from '@electron/asar';

const base = process.env.LOCALAPPDATA;
const discordPath = path.join(base as string, 'Discord');

type SourceEdit = {
  name: string;
  source: string;
  patches?: string[];
  replacements?: Array<{
    from: RegExp;
    to: string;
  }>;
};

type ArchivePatch = {
  name: string;
  asarDir: string;
  asarFile: string;
  edits: SourceEdit[];
};

function getLatestDiscordApp(versions: string[]): string {
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
    return latest;
  });
}

async function listFolders(dirPath: string) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries
      .filter(ent => ent.isDirectory())
      .map(ent => ent.name);
  } catch (err) {
    console.error("Error reading directory:", err);
    return [];
  }
}

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

async function applyEdit(outDir: string, edit: SourceEdit) {
  const sourcePath = path.join(outDir, edit.source);
  let patchedCode = await readFile(sourcePath, "utf-8");

  if (edit.replacements?.length) {
    for (const replacement of edit.replacements) {
      if (!replacement.from.test(patchedCode)) {
        throw new Error(`Replacement target not found for ${edit.name}`);
      }
      patchedCode = patchedCode.replace(replacement.from, replacement.to);
    }
  }

  if (edit.patches?.length) {
    const patchBlocks = await Promise.all(
      edit.patches.map(async (patchPath) => {
        const patchCode = await readFile(patchPath, "utf-8");
        return [
          "",
          "",
          "// CUSTOM PATCH START",
          patchCode,
          "// CUSTOM PATCH END"
        ].join("\n");
      })
    );

    patchedCode += patchBlocks.join("");
  }

  await writeFile(sourcePath, patchedCode, "utf-8");
}

(async () => {
  try {
    const folders = (await listFolders(discordPath)).filter(folder => folder.startsWith("app-"));
    const latest = getLatestDiscordApp(folders);
    console.log("Latest Discord App Version:", latest);

    for (const archive of archives) {
      const archivePath = path.join(discordPath, latest, archive.asarDir, archive.asarFile);

      if (!fs.existsSync(archivePath)) {
        console.error(`Archive not found: ${archivePath}`);
        continue;
      }

      const fileName = path.basename(archivePath);
      const backupName = `${Date.now()}_${fileName}`;
      const backupPath = path.join(discordPath, latest, archive.asarDir, backupName);
      const outDir = './temp_unpacked';

      fs.copyFileSync(archivePath, backupPath);
      await asar.extractAll(archivePath, outDir);

      for (const edit of archive.edits) {
        await applyEdit(outDir, edit);
        console.log(`Applied ${edit.name} in ${latest}`);
      }

      await asar.createPackage(outDir, archivePath);
      console.log(`Patched ${archive.name} in ${latest}`);

      await rm(outDir, { recursive: true, force: true });
      console.log(`Cleaned up temporary files for ${archive.name}`);
    }
  } catch (err) {
    console.error(err);
  }
})();
