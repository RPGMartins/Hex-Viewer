import { hexMap } from "./js/hexMap.js";
import { LayerPanel } from "./js/ui/LayerPanel.js";
import { HexInfoPanel } from "./js/ui/HexInfoPanel.js";
import { MapInfoPanel } from "./js/ui/MapInfoPanel.js";

const hexesPath = "./data/hexes-public.json";
const hexConfigPath = "./data/hex-config.json";

iniciar();

async function iniciar()
{
    const [hexData, hexConfig] = await Promise.all([
        carregarJson(hexesPath),
        carregarJson(hexConfigPath)
    ]);

    const mapaData = hexData.mapa ?? {};
    const backdrop = document.getElementById("panelBackdrop");

    const infoPanel = new HexInfoPanel(hexConfig, {
        element: document.getElementById("mapaInfo"),
        backdrop: backdrop
    });

    const mapa = new hexMap(
        mapaData.altura ?? 5,
        mapaData.largura ?? 5,
        mapaData.coluna_inicial ?? "A",
        mapaData.linha_inicial ?? 1,
        mapaData.largura_hex ?? 150,
        mapaData.altura_hex ?? 136,
        hexData.hexes ?? [],
        hexConfig,
        (hexDataSelecionado, hexSelecionado) =>
        {
            infoPanel.mostrar(hexDataSelecionado, hexSelecionado);
        }
    );

    document.getElementById("mapa").appendChild(mapa.element);
    prepararMapaResponsivo(mapa, document.getElementById("mapa"));

    const layerPanel = new LayerPanel(
        document.getElementById("layerPanel"),
        hexConfig,
        () =>
        {
            mapa.aplicarVisualizacao(layerPanel.visualizacao);
        },
        {
            openButton: document.getElementById("openLayerPanelBtn"),
            backdrop: backdrop
        }
    );

    layerPanel.renderizar();
    mapa.aplicarVisualizacao(layerPanel.visualizacao);

    criarMapInfoPanelSeExistir(mapaData, backdrop);
}

function criarMapInfoPanelSeExistir(mapaData, backdrop)
{
    const element = document.getElementById("mapInfoPanel");
    const openButton = document.getElementById("openMapInfoBtn");

    if (element == null || openButton == null)
    {
        return;
    }

    const mapInfoPanel = new MapInfoPanel(mapaData, {
        element: element,
        openButton: openButton,
        backdrop: backdrop
    });

    mapInfoPanel.renderizar();
}

async function carregarJson(caminho)
{
    const resposta = await fetch(caminho);

    if (resposta.ok == false)
    {
        throw new Error(`Erro ao carregar JSON: ${resposta.status} em ${caminho}`);
    }

    return await resposta.json();
}

function prepararMapaResponsivo(mapa, container)
{
    ajustarTamanhoMapa(mapa, container);

    const resizeObserver = new ResizeObserver(() =>
    {
        ajustarTamanhoMapa(mapa, container);
    });

    resizeObserver.observe(container);

    window.addEventListener("orientationchange", () =>
    {
        setTimeout(() =>
        {
            ajustarTamanhoMapa(mapa, container);
        }, 150);
    });
}

function ajustarTamanhoMapa(mapa, container)
{
    if (mapa == null || mapa.element == null || container == null)
    {
        return;
    }

    const larguraMapa = mapa.larguraMapa ?? Number(mapa.element.getAttribute("width"));
    const alturaMapa = mapa.alturaMapa ?? Number(mapa.element.getAttribute("height"));

    if (!larguraMapa || !alturaMapa)
    {
        return;
    }

    const margem = 32;
    const larguraDisponivel = Math.max(container.clientWidth - margem, 1);
    const alturaDisponivel = Math.max(container.clientHeight - margem, 1);

    const ocupacaoDaTela = 0.86;
    const escalaMaxima = 1.35;
    const escalaMinima = 0.35;

    let escala = Math.min(
        (larguraDisponivel * ocupacaoDaTela) / larguraMapa,
        (alturaDisponivel * ocupacaoDaTela) / alturaMapa
    );

    escala = Math.min(escala, escalaMaxima);
    escala = Math.max(escala, escalaMinima);

    const larguraFinal = Math.round(larguraMapa * escala);
    const alturaFinal = Math.round(alturaMapa * escala);

    mapa.element.style.width = `${larguraFinal}px`;
    mapa.element.style.height = `${alturaFinal}px`;
}
