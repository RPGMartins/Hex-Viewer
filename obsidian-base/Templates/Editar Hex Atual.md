<%*
const arquivo = app.workspace.getActiveFile();

if (arquivo == null)
{
    new Notice("Abra um arquivo de hex antes de rodar este template.");
    return;
}

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

async function escolherNota(titulo, pasta, atual)
{
    const notas = obterPasta(pasta);

    const labels = [
        `manter atual (${atual ?? "vazio"})`,
        "limpar",
        ...notas.map(n => n.label)
    ];

    const valores = [
        "__MANTER__",
        "",
        ...notas.map(n => n.link)
    ];

    return await tp.system.suggester(labels, valores, false, titulo);
}

async function escolherBoolean(titulo, atual)
{
    const atualTexto = atual === true ? "sim" : atual === false ? "não" : "vazio";

    return await tp.system.suggester(
        [`manter atual (${atualTexto})`, "não", "sim"],
        ["__MANTER__", false, true],
        false,
        titulo
    );
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

function aplicarCampo(fm, campo, valor)
{
    if (valor === "__MANTER__")
    {
        return;
    }

    if (valor === "")
    {
        delete fm[campo];
        return;
    }

    fm[campo] = valor;
}

const atual = frontmatter(arquivo);

const terreno = await escolherNota("Terreno", "Catalogos/Terrenos", atual.terreno);
const perigo = await escolherNota("Perigo", "Catalogos/Perigos", atual.perigo);
const exploracao = await escolherNota("Exploração", "Catalogos/Exploracoes", atual.exploracao);
const poiTipo = await escolherNota("Ponto de interesse", "Catalogos/Pontos de Interesse", atual.poi_tipo);
const poiEstado = await escolherNota("Estado do ponto de interesse", "Catalogos/Estados de POI", atual.poi_estado);
const faccaoControle = await escolherNota("Controle da facção", "Catalogos/Controles de Faccao", atual.faccao_controle);
const faccaoRelacao = await escolherNota("Relação da facção", "Catalogos/Relacoes de Faccao", atual.faccao_relacao);

const conexoes = obterPasta("Catalogos/Conexoes");
const features = [];

for (const conexao of conexoes)
{
    const campo = `feature_${idDaNota(conexao.file)}`;
    const valor = await escolherBoolean(`Feature: ${conexao.label}`, atual[campo]);
    features.push({ campo, valor });
}

await app.fileManager.processFrontMatter(arquivo, fm =>
{
    aplicarCampo(fm, "terreno", terreno);
    aplicarCampo(fm, "perigo", perigo);
    aplicarCampo(fm, "exploracao", exploracao);
    aplicarCampo(fm, "poi_tipo", poiTipo);
    aplicarCampo(fm, "poi_estado", poiEstado);
    aplicarCampo(fm, "faccao_controle", faccaoControle);
    aplicarCampo(fm, "faccao_relacao", faccaoRelacao);

    for (const feature of features)
    {
        if (feature.valor !== "__MANTER__")
        {
            fm[feature.campo] = feature.valor;
        }
    }
});

new Notice("Campos do hex atualizados.");
tR = "";
%>
