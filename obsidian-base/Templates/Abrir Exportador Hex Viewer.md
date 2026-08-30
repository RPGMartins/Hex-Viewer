<%*
/*
Abrir Exportador Hex Viewer

Este template abre o exportador Python direto do Obsidian.

Ele procura a raiz do repo a partir do vault atual.
Funciona melhor no Obsidian Desktop no Windows.
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
    const temTools = existe(path.join(atual, "tools", "hex_export_tool.py"));
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

const batPath = path.join(repoRoot, "tools", "executar.bat");

if (!existe(batPath)) {
  new Notice("Não encontrei tools/executar.bat.");
  tR = "";
  return;
}

const env = Object.assign({}, process.env, {
  HEX_OBSIDIAN_VAULT: vaultPath
});

if (process.platform === "win32") {
  cp.spawn("cmd.exe", ["/c", "start", "Hex Export Tool", batPath], {
    cwd: repoRoot,
    env,
    detached: true,
    stdio: "ignore"
  }).unref();
} else {
  cp.spawn("python3", [path.join(repoRoot, "tools", "hex_export_obsidian_launcher.py")], {
    cwd: repoRoot,
    env,
    detached: true,
    stdio: "ignore"
  }).unref();
}

new Notice("Exportador aberto.");
tR = "";
%>
