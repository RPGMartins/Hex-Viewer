import { hexMap } from "./js/hexMap.js";

const publicHexesPath = "./data/hexes-public.json";

iniciar();

async function iniciar()
{
    const hexData = await carregarJson(publicHexesPath);

    console.log(hexData);

    const hexTemp = new hexMap(hexData.mapa.altura,hexData.mapa.largura,"A",1,100,86,hexData.hexes);

    document.getElementById("mapa").appendChild(hexTemp.element);

    const visualizacao = criarEstadoVisualizacao(hexData);

    criarPainelCamadas(hexData, visualizacao, () =>
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

function criarEstadoVisualizacao(hexData)
{
    const terrenos = obterTiposPorLegendaOuHexes(hexData, "terrenos", "terreno");
    const perigos = obterTiposPorLegendaOuHexes(hexData, "perigos", "perigo");
    const icones = obterTiposDeIcones(hexData);

    return {
        terreno: {
            ativo: true,
            tipos: criarMapaBooleano(terrenos, true)
        },
        perigo: {
            ativo: true,
            tipos: criarMapaBooleano(perigos, true)
        },
        icones: {
            ativo: true,
            tipos: criarMapaBooleano(icones, true)
        },
        conexoes: {
            rio: true,
            estrada: true
        }
    };
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

function criarPainelCamadas(hexData, visualizacao, onChange)
{
    const painel = document.getElementById("layerPanel");
    painel.innerHTML = "";

    const titulo = document.createElement("h2");
    titulo.textContent = "Camadas";
    painel.appendChild(titulo);

    painel.appendChild(criarSecaoComAtivo(
        "Terreno",
        visualizacao.terreno,
        hexData.legenda?.terrenos ?? {},
        onChange
    ));

    painel.appendChild(criarSecaoComAtivo(
        "Perigo",
        visualizacao.perigo,
        hexData.legenda?.perigos ?? {},
        onChange
    ));

    painel.appendChild(criarSecaoComAtivo(
        "Ícones",
        visualizacao.icones,
        {},
        onChange
    ));

    painel.appendChild(criarSecaoSimples(
        "Conexões",
        visualizacao.conexoes,
        {
            rio: "Rio",
            estrada: "Estrada"
        },
        onChange
    ));
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