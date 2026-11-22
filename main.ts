// Ember Court — hand-in program (Node 22, standard library only).
//
// What this does, in plain terms: it takes the game in this repo's game/
// folder and the screenshots in screenshots/, copies them into the output
// directory the grader provides, and writes dossier.json there — the
// summary the judge reads — using the vendored make.fun library.
//
// Where the output goes:
//   * Inside the grader: /output (the platform default).
//   * Anywhere else: the MAKEFUN_OUTPUT_DIR environment variable, e.g.
//       mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program runs twice in grading and both runs must produce identical
// bytes, so it does nothing time- or randomness-dependent: it only copies
// files and asks buildDossier to summarise them. The caps passed to
// buildDossier mirror the scorer's own limits (at most 4 screenshots of
// 256 KiB, at most 993 game files / 48 MiB, dossier text capped at 160 KiB).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Directory this file lives in — game/ and screenshots/ sit beside it.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// Grader default is /output; a local run overrides it with the env var.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// 1. Make sure the output directory exists, then copy the game in whole.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

// 2. Copy the screenshots (the first by name is the cover image).
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// 3. Write the dossier the judge reads, from exactly those copied files.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
