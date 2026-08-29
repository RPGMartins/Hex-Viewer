export class HexInfoPanel
{
    constructor(config)
    {
        this.config = config ?? {};
        this.container = document.getElementById("mapaInfo");

        this.exploracaoLabels = {
            desconhecido: "Desconhecido",
            rumor: "Rumor / informação indireta",
            visto: "Visto à distância",
            visitado: "Visitado",
            explorado: "Explorado"
        };

        this.controleLabels = {
            controla: "Controla",
            influencia: "Influência",
            disputa: "Em disputa",
            presente: "Presente",
            nenhum: "Nenhum"
        };

        this.relacaoLabels = {
            aliada: "Aliada",
            amistosa: "Amistosa",
            neutra: "Neutra",
            suspeita: "Suspeita",
            hostil: "Hostil",
            desconhecida: "Desconhecida"
        };

        this.estadoPoiLabels = {
            ativo: "Ativo",
            abandonado: "Abandonado",
            arruinado: "Arruinado",
            ocupado: "Ocupado",
            ameacado: "Ameaçado",
            protegido: "Protegido",
            resolvido: "Resolvido",
            limpo: "Limpo",
            oculto: "Oculto",
            cataclismo: "Cataclismo",
            cercado: "Cercado",
            guardado: "Guardado"
        };

        this.limpar();
    }

    mostrar(hexData, hex)
    {
        if (this.container == null)
        {
            return;
        }

        if (hexData == null)
        {
            this.limpar();
            return;
        }

        this.container.innerHTML = "";

        const titulo = document.createElement("h2");
        titulo.id = "nomeLugar";
        titulo.textContent = this.obterTitulo(hexData, hex);
        this.container.appendChild(titulo);

        const resumo = this.obterTexto(hexData.resumo);
        if (resumo !== "")
        {
            const resumoEl = document.createElement("p");
            resumoEl.classList.add("hex-info-summary");
            resumoEl.textContent = resumo;
            this.container.appendChild(resumoEl);
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

        // Compatibilidade temporária com o JSON antigo.
        this.adicionarTextoLegado("Descrição pública", hexData.publico);
        this.adicionarListaLegada("Estado atual", hexData.estado_atual);
        this.adicionarListaLegada("Histórico", hexData.historico);

        if (this.container.children.length <= 1)
        {
            const vazio = document.createElement("p");
            vazio.classList.add("hex-info-empty");
            vazio.textContent = "Sem informações disponíveis para este hex.";
            this.container.appendChild(vazio);
        }
    }

    limpar()
    {
        if (this.container == null)
        {
            return;
        }

        this.container.innerHTML = "";

        const titulo = document.createElement("h2");
        titulo.id = "nomeLugar";
        titulo.textContent = "Nenhum hex selecionado";

        const texto = document.createElement("p");
        texto.classList.add("hex-info-empty");
        texto.textContent = "Selecione um hex no mapa para ver suas informações.";

        this.container.appendChild(titulo);
        this.container.appendChild(texto);
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

        const tipo = pontoInteresse.tipo ?? pontoInteresse.local;
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
        this.adicionarLinha(bloco, "Controle", this.obterLabelComFallback(faccao.controle, this.controleLabels));
        this.adicionarLinha(bloco, "Relação", this.obterLabelComFallback(faccao.relacao, this.relacaoLabels));
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
            this.container.appendChild(bloco);
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
        if (!this.temConteudo(terreno))
        {
            return "";
        }

        return this.config.terrenos?.[terreno]?.label ?? this.formatarChave(terreno);
    }

    obterLabelPerigo(perigo)
    {
        if (!this.temConteudo(perigo))
        {
            return "";
        }

        return this.config.perigos?.[perigo]?.label ?? this.formatarChave(perigo);
    }

    obterLabelPontoInteresse(tipo)
    {
        if (!this.temConteudo(tipo))
        {
            return "";
        }

        return this.config.pontos_interesse?.[tipo]?.label ?? this.formatarChave(tipo);
    }

    obterLabelExploracao(exploracao)
    {
        return this.obterLabelComFallback(exploracao, this.exploracaoLabels);
    }

    obterLabelEstadoPoi(estado)
    {
        return this.obterLabelComFallback(estado, this.estadoPoiLabels);
    }

    obterLabelComFallback(valor, labels)
    {
        if (!this.temConteudo(valor))
        {
            return "";
        }

        return labels?.[valor] ?? this.formatarChave(valor);
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
}
