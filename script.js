import { CampaignLoader } from "./js/CampaignLoader.js";
import { hexMap } from "./js/hexMap.js";
import { LayerPanel } from "./js/ui/LayerPanel.js";
import { HexInfoPanel } from "./js/ui/HexInfoPanel.js";
import { MapInfoPanel } from "./js/ui/MapInfoPanel.js";
import { CampaignSelector } from "./js/ui/CampaignSelector.js";

const campaignsManifestPath = "./data/campaigns.json";
const campaignLoader = new CampaignLoader(campaignsManifestPath);
const campaignSelector = new CampaignSelector();

iniciar();

async function iniciar()
{
    try
    {
        const manifesto = await campaignLoader.carregarManifesto();
        const campanha = await obterCampanhaInicial(manifesto);
        if (campanha == null)
        {
            console.warn("Nenhuma campanha selecionada.");
            return;
        }
        await carregarCampanha(manifesto, campanha);
    }
    catch (erro)
    {
        console.error(erro);
        mostrarErroInicial(erro);
    }
}

async function obterCampanhaInicial(manifesto)
{
    const campanhaSalva = campaignLoader.obterCampanhaSalva(manifesto);
    if (campanhaSalva != null) return campanhaSalva;
    const campanhaEscolhida = await campaignSelector.escolher(manifesto.campanhas, {
        titulo: "Escolha uma campanha",
        descricao: "Selecione qual mapa deve ser carregado.",
        allowCancel: false
    });
    if (campanhaEscolhida != null) campaignLoader.salvarCampanha(campanhaEscolhida);
    return campanhaEscolhida;
}

async function carregarCampanha(manifesto, campanha)
{
    const { hexData, hexConfig } = await campaignLoader.carregarDadosCampanha(campanha);
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
        (hexDataSelecionado, hexSelecionado) => infoPanel.mostrar(hexDataSelecionado, hexSelecionado)
    );
    const mapaElement = document.getElementById("mapa");
    mapaElement.innerHTML = "";
    mapaElement.appendChild(mapa.element);
    prepararMapaResponsivo(mapa, mapaElement);
    const layerPanel = new LayerPanel(
        document.getElementById("layerPanel"),
        hexConfig,
        () => mapa.aplicarVisualizacao(layerPanel.visualizacao),
        { openButton: document.getElementById("openLayerPanelBtn"), backdrop: backdrop }
    );
    layerPanel.renderizar();
    mapa.aplicarVisualizacao(layerPanel.visualizacao);
    criarMapInfoPanelSeExistir(mapaData, campanha, manifesto, backdrop);
}

function criarMapInfoPanelSeExistir(mapaData, campanhaAtual, manifesto, backdrop)
{
    const element = document.getElementById("mapInfoPanel");
    const openButton = document.getElementById("openMapInfoBtn");
    if (element == null || openButton == null) return;
    const mapInfoPanel = new MapInfoPanel(mapaData, {
        element: element,
        openButton: openButton,
        backdrop: backdrop,
        campanha: campanhaAtual,
        onTrocarCampanha: async () =>
        {
            const novaCampanha = await campaignSelector.escolher(manifesto.campanhas, {
                titulo: "Trocar campanha",
                descricao: "Escolha outro conjunto de dados para carregar.",
                selectedId: campanhaAtual.id,
                allowCancel: true
            });
            if (novaCampanha == null) return;
            campaignLoader.salvarCampanha(novaCampanha);
            window.location.reload();
        }
    });
    mapInfoPanel.renderizar();
}

function mostrarErroInicial(erro)
{
    const mapaElement = document.getElementById("mapa");
    if (mapaElement == null) return;
    mapaElement.innerHTML = "";
    const erroEl = document.createElement("div");
    erroEl.classList.add("initial-error");
    const titulo = document.createElement("h2");
    titulo.textContent = "Erro ao carregar o mapa";
    const mensagem = document.createElement("p");
    mensagem.textContent = erro?.message ?? String(erro);
    erroEl.appendChild(titulo);
    erroEl.appendChild(mensagem);
    mapaElement.appendChild(erroEl);
}

function prepararMapaResponsivo(mapa, container)
{
    ajustarTamanhoMapa(mapa, container);
    const resizeObserver = new ResizeObserver(() => ajustarTamanhoMapa(mapa, container));
    resizeObserver.observe(container);
    window.addEventListener("orientationchange", () => setTimeout(() => ajustarTamanhoMapa(mapa, container), 150));
}

function ajustarTamanhoMapa(mapa, container)
{
    if (mapa == null || mapa.element == null || container == null) return;
    const larguraMapa = mapa.larguraMapa ?? Number(mapa.element.getAttribute("width"));
    const alturaMapa = mapa.alturaMapa ?? Number(mapa.element.getAttribute("height"));
    if (!larguraMapa || !alturaMapa) return;
    const margem = 32;
    const larguraDisponivel = Math.max(container.clientWidth - margem, 1);
    const alturaDisponivel = Math.max(container.clientHeight - margem, 1);
    const mobileHorizontal = window.matchMedia("(orientation: landscape) and (max-height: 520px)").matches;
    let escala;
    if (mobileHorizontal)
    {
        escala = (larguraDisponivel * 0.92) / larguraMapa;
        escala = Math.min(escala, 1.10);
        escala = Math.max(escala, 0.50);
    }
    else
    {
        escala = Math.min((larguraDisponivel * 0.86) / larguraMapa, (alturaDisponivel * 0.86) / alturaMapa);
        escala = Math.min(escala, 1.35);
        escala = Math.max(escala, 0.35);
    }
    const larguraFinal = Math.round(larguraMapa * escala);
    const alturaFinal = Math.round(alturaMapa * escala);
    mapa.element.style.width = `${larguraFinal}px`;
    mapa.element.style.height = `${alturaFinal}px`;
    container.classList.toggle("mapa-scroll-x", larguraFinal > container.clientWidth);
    container.classList.toggle("mapa-scroll-y", alturaFinal > container.clientHeight);
}
