import { hexMap } from "./js/hexMap.js";

const publicHexesPath = "./data/hexes-public.json";
const hexConfigPath = "./data/hex-config.json";

iniciar();

async function iniciar()
{
    const [hexData, hexConfig] = await Promise.all([carregarJson(publicHexesPath),carregarJson(hexConfigPath)]);

    const hexTemp = new hexMap(hexData.mapa.altura,hexData.mapa.largura,"A",1,100,86,hexData.hexes,hexConfig);

    document.getElementById("mapa").appendChild(hexTemp.element);

    const visualizacao = criarEstadoVisualizacao(hexData, hexConfig);

    criarPainelCamadas(hexData, hexConfig, visualizacao, () =>
    {
        hexTemp.aplicarVisualizacao(visualizacao);
    });

    hexTemp.aplicarVisualizacao(visualizacao);
}

async function carregarJson(caminho)
{
    const resposta = await fetch(caminho);

    if (resposta.ok == false)
    {
        throw new Error(`Erro ao carregar JSON: ${resposta.status}`);
    }

    return await resposta.json();
}

function criarEstadoVisualizacao(hexData, hexConfig)
{
    return {
        terreno: {
            ativo: true,
            tipos: criarMapaBooleanoPorConfig(hexConfig.terrenos)
        },
        perigo: {
            ativo: true,
            tipos: criarMapaBooleanoPorConfig(hexConfig.perigos)
        },
        icones: {
            ativo: true,
            tipos: criarMapaBooleanoPorConfig(hexConfig.pontos_interesse)
        },
        conexoes: criarMapaBooleanoPorConfig(hexConfig.conexoes)
    };
}

function criarMapaBooleanoPorConfig(config)
{
    const mapa = {};

    for (const chave of Object.keys(config ?? {}))
    {
        mapa[chave] = config[chave].visivel_padrao !== false;
    }

    return mapa;
}

function obterTiposPorLegendaOuHexes(hexData, chaveLegenda, chaveHex)
{
    const legenda = hexData.legenda?.[chaveLegenda];

    if (legenda != null)
    {
        return Object.keys(legenda);
    }

    return [...new Set(
        hexData.hexes
            .map(hex => hex[chaveHex])
            .filter(valor => valor != null && valor !== "")
    )];
}

function obterTiposDeIcones(hexData)
{
    return [...new Set(
        hexData.hexes
            .map(hex => hex.ponto_interesse?.local)
            .filter(valor => valor != null && valor !== "")
    )].sort();
}

function criarMapaBooleano(valores, valorInicial)
{
    const mapa = {};

    for (const valor of valores)
    {
        mapa[valor] = valorInicial;
    }

    return mapa;
}

function criarPainelCamadas(hexData, hexConfig, visualizacao, onChange)
{
    const painel = document.getElementById("layerPanel");
    painel.innerHTML = "";

    const titulo = document.createElement("h2");
    titulo.textContent = "Camadas";
    painel.appendChild(titulo);

    painel.appendChild(criarSecaoComAtivo(
        "Terreno",
        visualizacao.terreno,
        criarLabelsPorConfig(hexConfig.terrenos),
        onChange
    ));

    painel.appendChild(criarSecaoComAtivo(
        "Perigo",
        visualizacao.perigo,
        criarLabelsPorConfig(hexConfig.perigos),
        onChange
    ));

    painel.appendChild(criarSecaoComAtivo(
        "Ícones",
        visualizacao.icones,
        criarLabelsPorConfig(hexConfig.pontos_interesse),
        onChange
    ));

    painel.appendChild(criarSecaoSimples(
        "Conexões",
        visualizacao.conexoes,
        criarLabelsPorConfig(hexConfig.conexoes),
        onChange
    ));
}

function criarLabelsPorConfig(config)
{
    const labels = {};

    for (const chave of Object.keys(config ?? {}))
    {
        labels[chave] = config[chave].label ?? chave;
    }

    return labels;
}

function criarSecaoComAtivo(titulo, grupo, labels, onChange)
{
    const details = document.createElement("details");
    details.open = true;

    const summary = document.createElement("summary");
    summary.textContent = titulo;
    details.appendChild(summary);

    const geral = criarCheckbox(
        `Mostrar ${titulo.toLowerCase()}`,
        grupo.ativo,
        (valor) =>
        {
            grupo.ativo = valor;
            onChange();
        }
    );

    geral.classList.add("layer-main-toggle");
    details.appendChild(geral);

    const lista = document.createElement("div");
    lista.classList.add("layer-sublist");

    for (const chave of Object.keys(grupo.tipos))
    {
        const label = labels[chave] ?? chave;

        lista.appendChild(criarCheckbox(
            label,
            grupo.tipos[chave],
            (valor) =>
            {
                grupo.tipos[chave] = valor;
                onChange();
            }
        ));
    }

    details.appendChild(lista);

    return details;
}

function criarSecaoSimples(titulo, grupo, labels, onChange)
{
    const details = document.createElement("details");
    details.open = true;

    const summary = document.createElement("summary");
    summary.textContent = titulo;
    details.appendChild(summary);

    const lista = document.createElement("div");
    lista.classList.add("layer-sublist");

    for (const chave of Object.keys(grupo))
    {
        const label = labels[chave] ?? chave;

        lista.appendChild(criarCheckbox(
            label,
            grupo[chave],
            (valor) =>
            {
                grupo[chave] = valor;
                onChange();
            }
        ));
    }

    details.appendChild(lista);

    return details;
}

function criarCheckbox(texto, marcado, onChange)
{
    const label = document.createElement("label");
    label.classList.add("layer-checkbox");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = marcado;

    input.addEventListener("change", () =>
    {
        onChange(input.checked);
    });

    const span = document.createElement("span");
    span.textContent = texto;

    label.appendChild(input);
    label.appendChild(span);

    return label;
}