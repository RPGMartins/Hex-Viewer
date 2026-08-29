export class CampaignLoader
{
    constructor(manifestPath = "./data/campaigns.json", storageKey = "hexViewer.selectedCampaignId")
    {
        this.manifestPath = manifestPath;
        this.storageKey = storageKey;
    }

    async carregarManifesto()
    {
        const manifesto = await this.carregarJson(this.manifestPath);
        manifesto.campanhas = manifesto.campanhas ?? [];
        return manifesto;
    }

    obterCampanhaSalva(manifesto)
    {
        const campanhaSalvaId = localStorage.getItem(this.storageKey);
        if (campanhaSalvaId == null || campanhaSalvaId === "") return null;
        return this.obterCampanhaPorId(manifesto, campanhaSalvaId);
    }

    obterCampanhaPorId(manifesto, id)
    {
        return manifesto.campanhas.find(campanha => campanha.id === id) ?? null;
    }

    salvarCampanha(campanha)
    {
        if (campanha?.id == null) return;
        localStorage.setItem(this.storageKey, campanha.id);
    }

    limparCampanhaSalva()
    {
        localStorage.removeItem(this.storageKey);
    }

    async carregarDadosCampanha(campanha)
    {
        if (campanha == null) throw new Error("Nenhuma campanha foi informada.");
        if (campanha.hexes == null || campanha.config == null) throw new Error(`Campanha inválida: ${campanha.id ?? "sem id"}`);
        const [hexData, hexConfig] = await Promise.all([
            this.carregarJson(campanha.hexes),
            this.carregarJson(campanha.config)
        ]);
        return { campanha, hexData, hexConfig };
    }

    async carregarJson(caminho)
    {
        const resposta = await fetch(caminho);
        if (resposta.ok == false) throw new Error(`Erro ao carregar JSON: ${resposta.status} em ${caminho}`);
        return await resposta.json();
    }
}
