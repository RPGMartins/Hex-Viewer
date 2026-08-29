export class LayerPanel
{
    constructor(element, config, onChange, options = {})
    {
        this.element = element;
        this.config = config ?? {};
        this.onChange = onChange;

        this.openButton = options.openButton ?? null;
        this.backdrop = options.backdrop ?? null;

        this.visualizacao = this.criarEstadoVisualizacao();

        this.configurarEventosExternos();
    }

    criarEstadoVisualizacao()
    {
        return {
            terreno: {
                ativo: true,
                tipos: this.criarMapaBooleanoPorConfig(this.config.terrenos)
            },
            perigo: {
                ativo: true,
                tipos: this.criarMapaBooleanoPorConfig(this.config.perigos)
            },
            exploracao: {
                ativo: true,
                tipos: this.criarMapaBooleanoPorConfig(this.config.exploracoes)
            },
            icones: {
                ativo: true,
                tipos: this.criarMapaBooleanoPorConfig(this.config.pontos_interesse)
            },
            conexoes: this.criarMapaBooleanoPorConfig(this.config.conexoes)
        };
    }

    criarMapaBooleanoPorConfig(config)
    {
        const mapa = {};

        for (const chave of Object.keys(config ?? {}))
        {
            mapa[chave] = config[chave].visivel_padrao !== false;
        }

        return mapa;
    }

    configurarEventosExternos()
    {
        if (this.openButton != null)
        {
            this.openButton.addEventListener("click", () =>
            {
                this.alternar();
            });
        }
    }

    renderizar()
    {
        if (this.element == null)
        {
            return;
        }

        this.element.innerHTML = "";

        const header = document.createElement("div");
        header.classList.add("side-panel-header");

        const titulo = document.createElement("h2");
        titulo.textContent = "Camadas";

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.classList.add("panel-close-button");
        closeButton.textContent = "×";
        closeButton.setAttribute("aria-label", "Fechar painel de camadas");
        closeButton.addEventListener("click", () => this.fechar());

        header.appendChild(titulo);
        header.appendChild(closeButton);
        this.element.appendChild(header);

        this.element.appendChild(this.criarSecaoComAtivo(
            "Terreno",
            this.visualizacao.terreno,
            this.config.terrenos,
            "terreno"
        ));

        this.element.appendChild(this.criarSecaoComAtivo(
            "Perigo",
            this.visualizacao.perigo,
            this.config.perigos,
            "perigo"
        ));

        this.element.appendChild(this.criarSecaoComAtivo(
            "Exploração",
            this.visualizacao.exploracao,
            this.config.exploracoes,
            "exploracao"
        ));

        this.element.appendChild(this.criarSecaoComAtivo(
            "Ícones",
            this.visualizacao.icones,
            this.config.pontos_interesse,
            "icone"
        ));

        this.element.appendChild(this.criarSecaoSimples(
            "Conexões",
            this.visualizacao.conexoes,
            this.config.conexoes,
            "conexao"
        ));
    }

    criarSecaoComAtivo(titulo, grupo, configGrupo, tipoVisual)
    {
        const details = document.createElement("details");
        details.open = true;

        const summary = document.createElement("summary");
        summary.textContent = titulo;
        details.appendChild(summary);

        const geral = this.criarCheckbox(
            `Mostrar ${titulo.toLowerCase()}`,
            grupo.ativo,
            (valor) =>
            {
                grupo.ativo = valor;
                this.dispararMudanca();
            },
            null,
            "geral"
        );

        geral.classList.add("layer-main-toggle");
        details.appendChild(geral);

        const lista = document.createElement("div");
        lista.classList.add("layer-sublist");

        for (const chave of Object.keys(grupo.tipos))
        {
            const configItem = configGrupo?.[chave] ?? {};
            const label = configItem.label ?? chave;

            lista.appendChild(this.criarCheckbox(
                label,
                grupo.tipos[chave],
                (valor) =>
                {
                    grupo.tipos[chave] = valor;
                    this.dispararMudanca();
                },
                configItem,
                tipoVisual
            ));
        }

        details.appendChild(lista);

        return details;
    }

    criarSecaoSimples(titulo, grupo, configGrupo, tipoVisual)
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
            const configItem = configGrupo?.[chave] ?? {};
            const label = configItem.label ?? chave;

            lista.appendChild(this.criarCheckbox(
                label,
                grupo[chave],
                (valor) =>
                {
                    grupo[chave] = valor;
                    this.dispararMudanca();
                },
                configItem,
                tipoVisual
            ));
        }

        details.appendChild(lista);

        return details;
    }

    criarCheckbox(texto, marcado, onChange, configItem = null, tipoVisual = null)
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

        const preview = this.criarPreview(configItem, tipoVisual);

        const span = document.createElement("span");
        span.textContent = texto;

        label.appendChild(input);

        if (preview != null)
        {
            label.appendChild(preview);
        }

        label.appendChild(span);

        return label;
    }

    criarPreview(configItem, tipoVisual)
    {
        if (tipoVisual == null || tipoVisual === "geral" || configItem == null)
        {
            return null;
        }

        if (tipoVisual === "terreno")
        {
            return this.criarPreviewTerreno(configItem);
        }

        if (tipoVisual === "perigo")
        {
            return this.criarPreviewPerigo(configItem);
        }

        if (tipoVisual === "icone")
        {
            return this.criarPreviewIcone(configItem);
        }

        if (tipoVisual === "conexao")
        {
            return this.criarPreviewConexao(configItem);
        }

        if (tipoVisual === "exploracao")
        {
            return this.criarPreviewExploracao(configItem);
        }

        return null;
    }

    criarPreviewTerreno(configItem)
    {
        const preview = document.createElement("span");
        preview.classList.add("layer-preview", "layer-preview-terrain");
        preview.style.backgroundColor = configItem.cor ?? "#999999";

        return preview;
    }

    criarPreviewPerigo(configItem)
    {
        const preview = document.createElement("span");
        preview.classList.add("layer-preview", "layer-preview-danger");

        const caveiras = configItem.caveiras ?? 0;

        if (caveiras <= 0)
        {
            const seguro = document.createElement("span");
            seguro.classList.add("layer-preview-danger-safe");
            seguro.style.borderColor = configItem.cor ?? "#4CAF50";
            preview.appendChild(seguro);
            return preview;
        }

        for (let i = 0; i < caveiras; i++)
        {
            const img = document.createElement("img");
            img.src = "./images/caveira.svg";
            img.alt = "";
            preview.appendChild(img);
        }

        return preview;
    }

    criarPreviewIcone(configItem)
    {
        const preview = document.createElement("span");
        preview.classList.add("layer-preview", "layer-preview-icon");

        if (configItem.icone != null)
        {
            const img = document.createElement("img");
            img.src = configItem.icone;
            img.alt = "";
            preview.appendChild(img);
        }

        return preview;
    }

    criarPreviewConexao(configItem)
    {
        const preview = document.createElement("span");
        preview.classList.add("layer-preview", "layer-preview-connection");

        const line = document.createElement("span");
        line.classList.add("layer-preview-connection-line");
        line.style.borderTopColor = configItem.cor ?? "#ffffff";
        line.style.borderTopWidth = `${Math.max(2, Math.min(configItem.espessura ?? 4, 6))}px`;

        if (configItem.tracejado === true)
        {
            line.style.borderTopStyle = "dashed";
        }

        preview.appendChild(line);

        return preview;
    }

    criarPreviewExploracao(configItem)
    {
        const preview = document.createElement("span");
        preview.classList.add("layer-preview", "layer-preview-exploration");
        preview.textContent = configItem.simbolo ?? "?";
        preview.style.backgroundColor = configItem.cor ?? "#666666";
        preview.style.color = configItem.cor_texto ?? "#ffffff";
        preview.style.borderColor = configItem.cor_borda ?? "#111111";

        return preview;
    }

    dispararMudanca()
    {
        if (this.onChange != null)
        {
            this.onChange(this.visualizacao);
        }
    }

    alternar()
    {
        if (this.estaAberto())
        {
            this.fechar();
            return;
        }

        this.abrir();
    }

    abrir()
    {
        if (this.element == null)
        {
            return;
        }

        this.element.classList.add("is-open");
        this.element.setAttribute("aria-hidden", "false");
        this.ativarBackdrop();
    }

    fechar()
    {
        if (this.element == null)
        {
            return;
        }

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
        if (this.backdrop == null)
        {
            return;
        }

        this.backdrop.hidden = false;
        this.backdrop.classList.add("is-active");

        this.backdrop.onclick = () =>
        {
            this.fechar();
        };
    }

    desativarBackdrop()
    {
        if (this.backdrop == null)
        {
            return;
        }

        this.backdrop.classList.remove("is-active");
        this.backdrop.hidden = true;
        this.backdrop.onclick = null;
    }
}
