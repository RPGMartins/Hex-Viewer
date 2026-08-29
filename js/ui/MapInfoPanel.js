export class MapInfoPanel
{
    constructor(mapaData, options = {})
    {
        this.mapaData = mapaData ?? {};
        this.element = options.element ?? document.getElementById("mapInfoPanel");
        this.openButton = options.openButton ?? null;
        this.backdrop = options.backdrop ?? null;
        this.campanha = options.campanha ?? null;
        this.links = options.links ?? {};
        this.onTrocarCampanha = options.onTrocarCampanha ?? null;
        this.configurarEventos();
    }
    configurarEventos()
    {
        if (this.openButton != null) this.openButton.addEventListener("click", () => this.alternar());
    }
    renderizar()
    {
        if (this.element == null) return;
        this.element.innerHTML = "";
        const header = document.createElement("div");
        header.classList.add("side-panel-header");
        const titulo = document.createElement("h2");
        titulo.textContent = "Informações do mapa";
        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.classList.add("panel-close-button");
        closeButton.textContent = "×";
        closeButton.setAttribute("aria-label", "Fechar informações do mapa");
        closeButton.addEventListener("click", () => this.fechar());
        header.appendChild(titulo);
        header.appendChild(closeButton);
        this.element.appendChild(header);
        const bloco = document.createElement("section");
        bloco.classList.add("hex-info-section");
        this.adicionarLinha(bloco, "Campanha", this.campanha?.nome ?? this.campanha?.id);
        this.adicionarLinha(bloco, "Nome", this.mapaData.nome);
        this.adicionarLinha(bloco, "ID", this.mapaData.id);
        this.adicionarLinha(bloco, "Sistema", this.mapaData.sistema);
        this.adicionarLinha(bloco, "Versão", this.mapaData.versao);
        this.adicionarLinha(bloco, "Largura", this.mapaData.largura);
        this.adicionarLinha(bloco, "Altura", this.mapaData.altura);
        this.adicionarLinha(bloco, "Coluna inicial", this.mapaData.coluna_inicial);
        this.adicionarLinha(bloco, "Linha inicial", this.mapaData.linha_inicial);
        this.adicionarLinha(bloco, "Hex inicial", this.mapaData.hex_inicial);
        this.adicionarLinha(bloco, "Escala do hex", this.mapaData.escala_hex ?? this.mapaData.escala);
        this.adicionarLinha(bloco, "Tamanho visual do hex", this.obterTamanhoHex());
        this.adicionarParagrafo(bloco, "Rumor principal", this.mapaData.rumor_principal);
        this.element.appendChild(bloco);
        this.adicionarLinksJogadores();
        this.adicionarAcoes();
        this.fechar();
    }
    adicionarLinksJogadores()
    {
        if (!this.temConteudo(this.links?.jogadoresUrl)) return;

        const bloco = document.createElement("section");
        bloco.classList.add("hex-info-section");

        const titulo = document.createElement("h3");
        titulo.textContent = "Links de mesa";
        bloco.appendChild(titulo);

        this.adicionarLinha(bloco, "Dados atuais", this.links.dataAtual);

        const row = document.createElement("div");
        row.classList.add("hex-info-row");

        const labelEl = document.createElement("span");
        labelEl.classList.add("hex-info-label");
        labelEl.textContent = "Jogadores:";

        const linkEl = document.createElement("a");
        linkEl.classList.add("hex-info-value");
        linkEl.href = this.links.jogadoresUrl;
        linkEl.target = "_blank";
        linkEl.rel = "noopener noreferrer";
        linkEl.textContent = this.links.jogadoresUrl;

        row.appendChild(labelEl);
        row.appendChild(linkEl);
        bloco.appendChild(row);

        const actions = document.createElement("div");
        actions.classList.add("map-info-actions");

        const abrir = document.createElement("button");
        abrir.type = "button";
        abrir.classList.add("map-info-action-button");
        abrir.textContent = "Abrir jogadores";
        abrir.addEventListener("click", () => window.open(this.links.jogadoresUrl, "_blank"));

        const copiar = document.createElement("button");
        copiar.type = "button";
        copiar.classList.add("map-info-action-button");
        copiar.textContent = "Copiar link";
        copiar.addEventListener("click", () => this.copiarLinkJogadores(copiar));

        actions.appendChild(abrir);
        actions.appendChild(copiar);
        bloco.appendChild(actions);

        this.element.appendChild(bloco);
    }
    async copiarLinkJogadores(botao)
    {
        const url = this.links?.jogadoresUrl;
        if (!this.temConteudo(url)) return;

        try
        {
            if (navigator.clipboard?.writeText != null)
            {
                await navigator.clipboard.writeText(url);
                this.mostrarFeedbackBotao(botao, "Copiado");
                return;
            }
        }
        catch (_erro)
        {
            // Em HTTP por IP, alguns navegadores bloqueiam clipboard. Cai no prompt abaixo.
        }

        window.prompt("Copie o link dos jogadores:", url);
    }
    mostrarFeedbackBotao(botao, texto)
    {
        if (botao == null) return;
        const original = botao.textContent;
        botao.textContent = texto;
        setTimeout(() =>
        {
            botao.textContent = original;
        }, 1400);
    }
    adicionarAcoes()
    {
        if (this.onTrocarCampanha == null) return;
        const actions = document.createElement("div");
        actions.classList.add("map-info-actions");
        const botao = document.createElement("button");
        botao.type = "button";
        botao.classList.add("map-info-action-button");
        botao.textContent = "Trocar campanha";
        botao.addEventListener("click", () => this.onTrocarCampanha());
        actions.appendChild(botao);
        this.element.appendChild(actions);
    }
    obterTamanhoHex()
    {
        const largura = this.mapaData.largura_hex;
        const altura = this.mapaData.altura_hex;
        if (!this.temConteudo(largura) && !this.temConteudo(altura)) return "";
        return `${largura ?? "?"} × ${altura ?? "?"}`;
    }
    adicionarLinha(bloco, label, valor)
    {
        if (!this.temConteudo(valor)) return;
        const row = document.createElement("div");
        row.classList.add("hex-info-row");
        const labelEl = document.createElement("span");
        labelEl.classList.add("hex-info-label");
        labelEl.textContent = `${label}:`;
        const valueEl = document.createElement("span");
        valueEl.classList.add("hex-info-value");
        valueEl.textContent = String(valor);
        row.appendChild(labelEl);
        row.appendChild(valueEl);
        bloco.appendChild(row);
    }
    adicionarParagrafo(bloco, label, valor)
    {
        if (!this.temConteudo(valor)) return;
        const labelEl = document.createElement("div");
        labelEl.classList.add("hex-info-label");
        labelEl.textContent = `${label}:`;
        const p = document.createElement("p");
        p.classList.add("hex-info-text");
        p.textContent = String(valor);
        bloco.appendChild(labelEl);
        bloco.appendChild(p);
    }
    temConteudo(valor)
    {
        if (valor == null) return false;
        if (typeof valor === "string" && valor.trim() === "") return false;
        return true;
    }

    alternar()
    {
        if (this.estaAberto()) this.fechar();
        else this.abrir();
    }

    abrir()
    {
        if (this.element == null) return;
        this.element.classList.add("is-open");
        this.element.setAttribute("aria-hidden", "false");
        this.ativarBackdrop();
    }
    fechar()
    {
        if (this.element == null) return;
        this.element.classList.remove("is-open");
        this.element.setAttribute("aria-hidden", "true");
        this.desativarBackdrop();
    }

    estaAberto()
    {
        return this.element?.classList.contains("is-open") === true;
    }
    ativarBackdrop()
    {
        if (this.backdrop == null) return;
        this.backdrop.hidden = false;
        this.backdrop.classList.add("is-active");
        this.backdrop.onclick = () => this.fechar();
    }

    desativarBackdrop()
    {
        if (this.backdrop == null) return;
        this.backdrop.classList.remove("is-active");
        this.backdrop.hidden = true;
        this.backdrop.onclick = null;
    }
}
