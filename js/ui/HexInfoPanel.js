export class HexInfoPanel
{
    constructor(config, options = {})
    {
        this.config = config ?? {};
        this.element = options.element ?? document.getElementById("mapaInfo");
        this.backdrop = options.backdrop ?? null;

        this.limpar();
        this.fechar();
    }

    mostrar(hexData, hex)
    {
        if (this.element == null)
        {
            return;
        }

        if (hexData == null)
        {
            this.limpar();
            this.fechar();
            return;
        }

        this.renderizar(hexData, hex);
        this.abrir();
    }

    renderizar(hexData, hex)
    {
        this.element.innerHTML = "";

        const header = document.createElement("div");
        header.classList.add("side-panel-header");

        const titulo = document.createElement("h2");
        titulo.id = "nomeLugar";
        titulo.textContent = this.obterTitulo(hexData, hex);

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.classList.add("panel-close-button");
        closeButton.textContent = "×";
        closeButton.setAttribute("aria-label", "Fechar informações do hex");
        closeButton.addEventListener("click", () => this.fechar());

        header.appendChild(titulo);
        header.appendChild(closeButton);
        this.element.appendChild(header);

        const resumo = this.obterTexto(hexData.resumo);

        if (resumo !== "")
        {
            const resumoEl = document.createElement("p");
            resumoEl.classList.add("hex-info-summary");
            resumoEl.textContent = resumo;
            this.element.appendChild(resumoEl);
        }

        const blocoBase = this.criarBloco("Base");
        this.adicionarLinha(blocoBase, "Hex", hexData.hex ?? hex?.id);
        this.adicionarLinha(blocoBase, "Terreno", this.obterLabelTerreno(hexData.terreno));
        this.adicionarLinha(blocoBase, "Perigo", this.obterLabelPerigo(hexData.perigo));
        this.adicionarLinha(blocoBase, "Exploração", this.obterLabelExploracao(hexData.exploracao));
        this.adicionarFeatures(blocoBase, hexData.features);
        this.adicionarBlocoSeTemConteudo(blocoBase);

        this.adicionarPontoInteresse(hexData.ponto_interesse);
        this.adicionarFaccao(hexData.faccao);
        this.adicionarNotas(hexData.notas);

        this.adicionarTextoLegado("Descrição pública", hexData.publico);
        this.adicionarListaLegada("Estado atual", hexData.estado_atual);
        this.adicionarListaLegada("Histórico", hexData.historico);

        if (this.element.children.length <= 1)
        {
            const vazio = document.createElement("p");
            vazio.classList.add("hex-info-empty");
            vazio.textContent = "Sem informações disponíveis para este hex.";
            this.element.appendChild(vazio);
        }
    }

    limpar()
    {
        if (this.element == null)
        {
            return;
        }

        this.element.innerHTML = "";
    }

    abrir()
    {
        if (this.element == null)
        {
            return;
        }

        this.element.classList.add("is-open");
        this.element.setAttribute("aria-hidden", "false");
    }

    fechar()
    {
        if (this.element == null)
        {
            return;
        }

        this.element.classList.remove("is-open");
        this.element.setAttribute("aria-hidden", "true");
    }

    obterTitulo(hexData, hex)
    {
        const nome = this.obterTexto(hexData.nome);

        if (nome !== "")
        {
            return `${hexData.hex ?? hex?.id ?? ""} — ${nome}`;
        }

        return hexData.hex ?? hex?.id ?? "Hex";
    }

    adicionarPontoInteresse(pontoInteresse)
    {
        if (pontoInteresse == null)
        {
            return;
        }

        const bloco = this.criarBloco("Ponto de interesse");

        const tipo = this.obterTipoPontoInteresse(pontoInteresse);
        const labelTipo = this.obterLabelPontoInteresse(tipo);

        this.adicionarLinha(bloco, "Tipo", labelTipo);
        this.adicionarLinha(bloco, "Nome", pontoInteresse.nome);
        this.adicionarLinha(bloco, "Estado", this.obterLabelEstadoPoi(pontoInteresse.estado));
        this.adicionarLinha(bloco, "Desenvolvimento", pontoInteresse.desenvolvimento);
        this.adicionarParagrafo(bloco, "Descrição", pontoInteresse.descricao);

        this.adicionarBlocoSeTemConteudo(bloco);
    }

    adicionarFaccao(faccao)
    {
        if (faccao == null)
        {
            return;
        }

        const bloco = this.criarBloco("Facção");

        if (typeof faccao === "string")
        {
            this.adicionarLinha(bloco, "Nome", faccao);
            this.adicionarBlocoSeTemConteudo(bloco);
            return;
        }

        this.adicionarLinha(bloco, "Nome", faccao.nome ?? faccao.id);
        this.adicionarLinha(bloco, "Controle", this.obterLabelControleFaccao(faccao.controle));
        this.adicionarLinha(bloco, "Relação", this.obterLabelRelacaoFaccao(faccao.relacao));
        this.adicionarParagrafo(bloco, "Descrição", faccao.descricao);

        this.adicionarBlocoSeTemConteudo(bloco);
    }

    adicionarNotas(notas)
    {
        if (!this.temConteudo(notas))
        {
            return;
        }

        const bloco = this.criarBloco("Notas");

        if (Array.isArray(notas))
        {
            this.adicionarLista(bloco, notas);
        }
        else
        {
            this.adicionarParagrafo(bloco, null, notas);
        }

        this.adicionarBlocoSeTemConteudo(bloco);
    }

    adicionarTextoLegado(titulo, texto)
    {
        if (!this.temConteudo(texto))
        {
            return;
        }

        const bloco = this.criarBloco(titulo);
        this.adicionarParagrafo(bloco, null, texto);
        this.adicionarBlocoSeTemConteudo(bloco);
    }

    adicionarListaLegada(titulo, lista)
    {
        if (!this.temConteudo(lista))
        {
            return;
        }

        const bloco = this.criarBloco(titulo);
        this.adicionarLista(bloco, lista);
        this.adicionarBlocoSeTemConteudo(bloco);
    }

    adicionarFeatures(bloco, features)
    {
        if (features == null || typeof features !== "object")
        {
            return;
        }

        const ativas = Object.keys(features)
            .filter(chave => features[chave] === true)
            .map(chave => this.config.conexoes?.[chave]?.label ?? this.formatarChave(chave));

        if (ativas.length > 0)
        {
            this.adicionarLinha(bloco, "Conexões/features", ativas.join(", "));
        }
    }

    criarBloco(titulo)
    {
        const section = document.createElement("section");
        section.classList.add("hex-info-section");
        section.dataset.hasContent = "false";

        const h3 = document.createElement("h3");
        h3.textContent = titulo;
        section.appendChild(h3);

        return section;
    }

    adicionarBlocoSeTemConteudo(bloco)
    {
        if (bloco.dataset.hasContent === "true")
        {
            this.element.appendChild(bloco);
        }
    }

    adicionarLinha(bloco, label, valor)
    {
        if (!this.temConteudo(valor))
        {
            return;
        }

        const row = document.createElement("div");
        row.classList.add("hex-info-row");

        const labelEl = document.createElement("span");
        labelEl.classList.add("hex-info-label");
        labelEl.textContent = `${label}:`;

        const valueEl = document.createElement("span");
        valueEl.classList.add("hex-info-value");
        valueEl.textContent = this.obterTexto(valor);

        row.appendChild(labelEl);
        row.appendChild(valueEl);

        bloco.appendChild(row);
        bloco.dataset.hasContent = "true";
    }

    adicionarParagrafo(bloco, label, valor)
    {
        if (!this.temConteudo(valor))
        {
            return;
        }

        if (label != null)
        {
            const labelEl = document.createElement("div");
            labelEl.classList.add("hex-info-label");
            labelEl.textContent = `${label}:`;
            bloco.appendChild(labelEl);
        }

        const p = document.createElement("p");
        p.classList.add("hex-info-text");
        p.textContent = this.obterTexto(valor);

        bloco.appendChild(p);
        bloco.dataset.hasContent = "true";
    }

    adicionarLista(bloco, valores)
    {
        if (!this.temConteudo(valores))
        {
            return;
        }

        if (!Array.isArray(valores))
        {
            this.adicionarParagrafo(bloco, null, valores);
            return;
        }

        const ul = document.createElement("ul");
        ul.classList.add("hex-info-list");

        for (const valor of valores)
        {
            if (!this.temConteudo(valor))
            {
                continue;
            }

            const li = document.createElement("li");
            li.textContent = this.obterTexto(valor);
            ul.appendChild(li);
        }

        if (ul.children.length > 0)
        {
            bloco.appendChild(ul);
            bloco.dataset.hasContent = "true";
        }
    }

    obterLabelTerreno(terreno)
    {
        return this.obterLabelPorConfig(this.config.terrenos, terreno);
    }

    obterLabelPerigo(perigo)
    {
        return this.obterLabelPorConfig(this.config.perigos, perigo);
    }

    obterLabelPontoInteresse(tipo)
    {
        return this.obterLabelPorConfig(this.config.pontos_interesse, tipo);
    }

    obterLabelExploracao(exploracao)
    {
        return this.obterLabelPorConfig(this.config.exploracoes, exploracao);
    }

    obterLabelEstadoPoi(estado)
    {
        return this.obterLabelPorConfig(this.config.estados_ponto_interesse, estado);
    }

    obterLabelControleFaccao(controle)
    {
        return this.obterLabelPorConfig(this.config.faccoes?.controles, controle);
    }

    obterLabelRelacaoFaccao(relacao)
    {
        return this.obterLabelPorConfig(this.config.faccoes?.relacoes, relacao);
    }

    obterLabelPorConfig(config, chave)
    {
        if (!this.temConteudo(chave))
        {
            return "";
        }

        return config?.[chave]?.label ?? this.formatarChave(chave);
    }

    obterTipoPontoInteresse(pontoInteresse)
    {
        const direto =
            pontoInteresse?.tipo ??
            pontoInteresse?.icone ??
            pontoInteresse?.local ??
            null;

        if (direto == null)
        {
            return null;
        }

        if (this.config.pontos_interesse?.[direto] != null)
        {
            return direto;
        }

        const normalizado = this.normalizarChave(direto);

        if (this.config.pontos_interesse?.[normalizado] != null)
        {
            return normalizado;
        }

        return direto;
    }

    temConteudo(valor)
    {
        if (valor == null)
        {
            return false;
        }

        if (typeof valor === "string" && valor.trim() === "")
        {
            return false;
        }

        if (Array.isArray(valor) && valor.length === 0)
        {
            return false;
        }

        return true;
    }

    obterTexto(valor)
    {
        if (valor == null)
        {
            return "";
        }

        if (typeof valor === "string")
        {
            return valor;
        }

        if (typeof valor === "number" || typeof valor === "boolean")
        {
            return String(valor);
        }

        return JSON.stringify(valor);
    }

    formatarChave(chave)
    {
        if (!this.temConteudo(chave))
        {
            return "";
        }

        return String(chave)
            .replaceAll("_", " ")
            .replace(/\b\w/g, letra => letra.toUpperCase());
    }

    normalizarChave(valor)
    {
        return String(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    }
}
