<%*
const campanhaPadrao = "Campanhas/Vale dos Sinos";
const campanha = await tp.system.prompt("Pasta da campanha", campanhaPadrao);
const hexId = await tp.system.prompt("Hex", "A1");
const nome = await tp.system.prompt("Nome do hex", "");

function obterPasta(path)
{
    const pasta = app.vault.getAbstractFileByPath(path);

    if (pasta == null || pasta.children == null)
    {
        new Notice(`Pasta não encontrada: ${path}`);
        return [];
    }

    return pasta.children
        .filter(file => file.extension === "md")
        .sort((a, b) => a.basename.localeCompare(b.basename, "pt-BR"))
        .map(file => ({
            label: file.basename,
            link: `[[${file.basename}]]`,
            file
        }));
}

async function escolherNota(titulo, pasta, incluirNenhum = true)
{
    const notas = obterPasta(pasta);
    const labels = incluirNenhum ? ["nenhum", ...notas.map(n => n.label)] : notas.map(n => n.label);
    const valores = incluirNenhum ? ["", ...notas.map(n => n.link)] : notas.map(n => n.link);

    if (labels.length === 0)
    {
        new Notice(`Sem opções em ${pasta}`);
        return "";
    }

    return await tp.system.suggester(labels, valores, false, titulo);
}

function frontmatter(file)
{
    return app.metadataCache.getFileCache(file)?.frontmatter ?? {};
}

function idDaNota(file)
{
    const fm = frontmatter(file);
    return fm.id ?? normalizar(file.basename);
}

function normalizar(texto)
{
    return String(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function yaml(valor)
{
    if (valor == null || valor === "")
    {
        return "";
    }

    return JSON.stringify(String(valor));
}

const terreno = await escolherNota("Terreno", "Catalogos/Terrenos", true);
const perigo = await escolherNota("Perigo", "Catalogos/Perigos", true);
const exploracao = await escolherNota("Exploração", "Catalogos/Exploracoes", true);

const poiTipo = await escolherNota("Ponto de interesse", "Catalogos/Pontos de Interesse", true);
let poiNome = "";
let poiEstado = "";

if (poiTipo !== "")
{
    poiNome = await tp.system.prompt("Nome do ponto de interesse", "");
    poiEstado = await escolherNota("Estado do ponto de interesse", "Catalogos/Estados de POI", true);
}

let featureLines = "";
const conexoes = obterPasta("Catalogos/Conexoes");

for (const conexao of conexoes)
{
    const usar = await tp.system.suggester(["não", "sim"], [false, true], false, `Tem ${conexao.label}?`);
    featureLines += `feature_${idDaNota(conexao.file)}: ${usar}\n`;
}

const faccaoNome = await tp.system.prompt("Facção controladora/influente (opcional)", "");
let faccaoId = "";
let faccaoControle = "";
let faccaoRelacao = "";

if (faccaoNome !== "")
{
    faccaoId = normalizar(faccaoNome);
    faccaoControle = await escolherNota("Tipo de controle", "Catalogos/Controles de Faccao", true);
    faccaoRelacao = await escolherNota("Relação", "Catalogos/Relacoes de Faccao", true);
}

await tp.file.move(`${campanha}/Hexes/${hexId}`);

tR += `---
fileClass: Hex
hex: ${hexId}
nome: ${nome}

terreno: ${yaml(terreno)}
perigo: ${yaml(perigo)}
exploracao: ${yaml(exploracao)}

${featureLines}
poi_tipo: ${yaml(poiTipo)}
poi_nome: ${poiNome}
poi_estado: ${yaml(poiEstado)}

faccao_id: ${faccaoId}
faccao_nome: ${faccaoNome}
faccao_controle: ${yaml(faccaoControle)}
faccao_relacao: ${yaml(faccaoRelacao)}
---

## Resumo

## Ponto de interesse - descrição

## Notas

`;
%>
