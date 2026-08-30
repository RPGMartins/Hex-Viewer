<%*
/*
Gerar Hexes Vazios

Uso:
1. Abra qualquer nota temporária no Obsidian.
2. Rode: Templater: Open Insert Template modal
3. Escolha este template.
4. Escolha a campanha.
5. Ele cria os hexes faltantes em:
   Campanhas/<Campanha>/Hexes/

Ele lê do _campaign.md:
- largura
- altura
- coluna_inicial
- linha_inicial

Ele NÃO sobrescreve hexes existentes.
*/

function normalizarNumero(valor, padrao) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
}

function letrasParaNumero(letras) {
  let valor = 0;
  const texto = String(letras || "A").toUpperCase();

  for (const ch of texto) {
    if (ch < "A" || ch > "Z") continue;
    valor = valor * 26 + (ch.charCodeAt(0) - 64);
  }

  return valor || 1;
}

function numeroParaLetras(numero) {
  let n = Number(numero);
  let resultado = "";

  while (n > 0) {
    n--;
    resultado = String.fromCharCode(65 + (n % 26)) + resultado;
    n = Math.floor(n / 26);
  }

  return resultado || "A";
}

function parseFrontmatter(texto) {
  const match = texto.match(/^---\s*\n([\s\S]*?)\n---/);
  const data = {};

  if (!match) return data;

  for (const linhaOriginal of match[1].split(/\r?\n/)) {
    const linha = linhaOriginal.trim();

    if (!linha || linha.startsWith("#") || !linha.includes(":")) continue;

    const partes = linha.split(":");
    const chave = partes.shift().trim();
    let valor = partes.join(":").trim();

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    data[chave] = valor;
  }

  return data;
}

function criarConteudoHex(hexId) {
  return `---
fileClass: Hex
hex: ${hexId}
nome: ""

terreno: ""
perigo: ""
exploracao: "[[Desconhecido]]"

feature_estrada: false
feature_rio: false
feature_trilha: false

poi_tipo: ""
poi_nome: ""
poi_estado: ""

faccao_id: ""
faccao_nome: ""
faccao_controle: ""
faccao_relacao: ""
---

## Resumo

`;
}

const campanhasFolder = app.vault.getAbstractFileByPath("Campanhas");

if (!campanhasFolder || !campanhasFolder.children) {
  new Notice("Pasta Campanhas/ não encontrada.");
  return;
}

const campanhas = campanhasFolder.children
  .filter((item) => item.children)
  .filter((folder) => app.vault.getAbstractFileByPath(`${folder.path}/_campaign.md`));

if (!campanhas.length) {
  new Notice("Nenhuma campanha com _campaign.md encontrada.");
  return;
}

const campanhaEscolhida = await tp.system.suggester(
  campanhas.map((folder) => folder.name),
  campanhas
);

if (!campanhaEscolhida) {
  new Notice("Operação cancelada.");
  return;
}

const campaignFile = app.vault.getAbstractFileByPath(`${campanhaEscolhida.path}/_campaign.md`);
const campaignText = await app.vault.read(campaignFile);
const fm = parseFrontmatter(campaignText);

const largura = normalizarNumero(fm.largura, 0);
const altura = normalizarNumero(fm.altura, 0);

if (largura <= 0 || altura <= 0) {
  new Notice("Campanha sem largura/altura válida no _campaign.md.");
  return;
}

const colunaInicial = fm.coluna_inicial || "A";
const linhaInicial = normalizarNumero(fm.linha_inicial, 1);

const colInicialNum = letrasParaNumero(colunaInicial);
const hexesFolderPath = `${campanhaEscolhida.path}/Hexes`;

if (!app.vault.getAbstractFileByPath(hexesFolderPath)) {
  await app.vault.createFolder(hexesFolderPath);
}

let criados = 0;
let existentes = 0;
const falhas = [];

for (let c = 0; c < largura; c++) {
  const coluna = numeroParaLetras(colInicialNum + c);

  for (let l = 0; l < altura; l++) {
    const linha = linhaInicial + l;
    const hexId = `${coluna}${linha}`;
    const path = `${hexesFolderPath}/${hexId}.md`;

    if (app.vault.getAbstractFileByPath(path)) {
      existentes++;
      continue;
    }

    try {
      await app.vault.create(path, criarConteudoHex(hexId));
      criados++;
    } catch (err) {
      falhas.push(`${hexId}: ${err.message || err}`);
    }
  }
}

let mensagem = `Hexes criados: ${criados}. Já existiam: ${existentes}.`;

if (falhas.length) {
  mensagem += ` Falhas: ${falhas.length}. Veja o console.`;
  console.warn("Falhas ao criar hexes:", falhas);
}

new Notice(mensagem, 8000);

// Evita inserir texto na nota temporária.
tR = "";
%>
