import { hexMap } from "./js/hexMap.js";
import { LayerPanel } from "./js/ui/LayerPanel.js";
import { HexInfoPanel } from "./js/ui/HexInfoPanel.js";

const hexesPath = "./data/hexes-public.json";
const hexConfigPath = "./data/hex-config.json";

iniciar();

async function iniciar()
{
    const [hexData, hexConfig] = await Promise.all([
        carregarJson(hexesPath),
        carregarJson(hexConfigPath)
    ]);

    const infoPanel = new HexInfoPanel(hexConfig);

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
        }
    );

    layerPanel.renderizar();
    mapa.aplicarVisualizacao(layerPanel.visualizacao);
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
