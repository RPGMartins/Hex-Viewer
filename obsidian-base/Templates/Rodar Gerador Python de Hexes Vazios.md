<%*
/*
Rodar Gerador Python de Hexes Vazios

Este template chama:
tools/criar_hexes_vazios.py

Se você prefere o gerador 100% dentro do Obsidian, use o template:
Gerar Hexes Vazios.md

Este aqui abre uma janela/terminal externo.
*/

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

function existe(p) {
  try {
    return fs.existsSync(p);
  } catch (_err) {
    return false;
  }
}

function encontrarRepoRoot(basePath) {
  let atual = basePath;

  for (let i = 0; i < 6; i++) {
    const temTools = existe(path.join(atual, "tools", "criar_hexes_vazios.py"));
    const temObsidianBase = existe(path.join(atual, "obsidian-base"));

    if (temTools && temObsidianBase) {
      return atual;
    }

    const pai = path.dirname(atual);
    if (pai === atual) break;
    atual = pai;
  }

  return null;
}

const vaultPath = app.vault.adapter.getBasePath();
const repoRoot = encontrarRepoRoot(vaultPath);

if (!repoRoot) {
  new Notice("Não encontrei a raiz do repo Hex-Viewer.");
  tR = "";
  return;
}

const batPath = path.join(repoRoot, "tools", "criar_hexes_vazios_obsidian.bat");

if (!existe(batPath)) {
  new Notice("Não encontrei tools/criar_hexes_vazios_obsidian.bat.");
  tR = "";
  return;
}

const env = Object.assign({}, process.env, {
  HEX_OBSIDIAN_VAULT: vaultPath
});

if (process.platform === "win32") {
  cp.spawn("cmd.exe", ["/c", "start", "Gerar Hexes Vazios", batPath], {
    cwd: repoRoot,
    env,
    detached: true,
    stdio: "ignore"
  }).unref();
} else {
  cp.spawn("python3", [
    path.join(repoRoot, "tools", "criar_hexes_vazios.py"),
    "--vault",
    vaultPath
  ], {
    cwd: repoRoot,
    env,
    detached: true,
    stdio: "ignore"
  }).unref();
}

new Notice("Gerador de hexes vazio aberto.");
tR = "";
%>
