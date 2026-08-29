export class LayerPanel
{
    constructor(element, config, onChange)
    {
        this.element = element;
        this.config = config ?? {};
        this.onChange = onChange;

        this.visualizacao = this.criarEstadoVisualizacao();
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

    renderizar()
    {
        this.element.innerHTML = "";

        const titulo = document.createElement("h2");
        titulo.textContent = "Camadas";
        this.element.appendChild(titulo);

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
}
