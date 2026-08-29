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

    const backdrop = document.getElementById("panelBackdrop");

    const infoPanel = new HexInfoPanel(hexConfig, {
        element: document.getElementById("mapaInfo"),
        backdrop: backdrop
    });

    const mapa = new hexMap(
        hexData.mapa.altura,
        hexData.mapa.largura,
        "A",
        1,
        100,
        86,
        hexData.hexes,
        hexConfig,
        (hexDataSelecionado, hexSelecionado) =>
        {
            infoPanel.mostrar(hexDataSelecionado, hexSelecionado);
        }
    );

    document.getElementById("mapa").appendChild(mapa.element);

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

    criarMapInfoPanelSeExistir(hexData.mapa, backdrop);
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
