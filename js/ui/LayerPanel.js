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
            this.criarLabelsPorConfig(this.config.terrenos)
        ));

        this.element.appendChild(this.criarSecaoComAtivo(
            "Perigo",
            this.visualizacao.perigo,
            this.criarLabelsPorConfig(this.config.perigos)
        ));

        this.element.appendChild(this.criarSecaoComAtivo(
            "Ícones",
            this.visualizacao.icones,
            this.criarLabelsPorConfig(this.config.pontos_interesse)
        ));

        this.element.appendChild(this.criarSecaoSimples(
            "Conexões",
            this.visualizacao.conexoes,
            this.criarLabelsPorConfig(this.config.conexoes)
        ));
    }

    criarLabelsPorConfig(config)
    {
        const labels = {};

        for (const chave of Object.keys(config ?? {}))
        {
            labels[chave] = config[chave].label ?? chave;
        }

        return labels;
    }

    criarSecaoComAtivo(titulo, grupo, labels)
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
            }
        );

        geral.classList.add("layer-main-toggle");
        details.appendChild(geral);

        const lista = document.createElement("div");
        lista.classList.add("layer-sublist");

        for (const chave of Object.keys(grupo.tipos))
        {
            const label = labels[chave] ?? chave;

            lista.appendChild(this.criarCheckbox(
                label,
                grupo.tipos[chave],
                (valor) =>
                {
                    grupo.tipos[chave] = valor;
                    this.dispararMudanca();
                }
            ));
        }

        details.appendChild(lista);

        return details;
    }

    criarSecaoSimples(titulo, grupo, labels)
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

            lista.appendChild(this.criarCheckbox(
                label,
                grupo[chave],
                (valor) =>
                {
                    grupo[chave] = valor;
                    this.dispararMudanca();
                }
            ));
        }

        details.appendChild(lista);

        return details;
    }

    criarCheckbox(texto, marcado, onChange)
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
