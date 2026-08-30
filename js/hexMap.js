import { hex } from "./hex.js";

export class hexMap
{
    constructor(
        quantidadeLinhas,
        quantidadeColunas,
        colunaInicial,
        linhaInicial,
        larguraHex,
        alturaHex,
        hexData,
        config = {},
        onHexSelecionado = null
    )
    {
        this.quantidadeLinhas = quantidadeLinhas;
        this.quantidadeColunas = quantidadeColunas;

        this.colunaInicial = colunaInicial;
        this.linhaInicial = linhaInicial;
        this.larguraHex = larguraHex;
        this.alturaHex = alturaHex;

        this.hexData = hexData ?? [];
        this.config = config ?? {};
        this.onHexSelecionado = onHexSelecionado;

        this.margemRotulos = {
            topo: 34,
            esquerda: 42,
            direita: 12,
            baixo: 12
        };

        this.hexes = new Map();
        this.element = this.criarElemento();

        this.hexSelecionado = null;
        this.visualizacaoAtual = null;

        this.criarHexes((id) => this.selecionarHex(id), this.hexData);

        this.definirVizinhos();
        this.desenharTodasConexoes();
    }

    criarElemento()
    {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        this.hexLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.connectionLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.iconLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.coordinateLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");

        this.hexLayer.setAttribute("id", "hex-layer");
        this.connectionLayer.setAttribute("id", "connection-layer");
        this.iconLayer.setAttribute("id", "icon-layer");
        this.coordinateLayer.setAttribute("id", "coordinate-layer");

        this.iconLayer.setAttribute("pointer-events", "none");
        this.coordinateLayer.setAttribute("pointer-events", "none");

        svg.appendChild(this.hexLayer);
        svg.appendChild(this.connectionLayer);
        svg.appendChild(this.iconLayer);
        svg.appendChild(this.coordinateLayer);

        return svg;
    }

    criarHexes(onClick, hexData)
    {
        const espacamentoX = this.larguraHex * 0.75;
        const espacamentoY = this.alturaHex;
        const colunaInicialNumero = this.converterLetrasParaNumero(this.colunaInicial);

        const hexDataPorId = new Map(
            (hexData ?? [])
                .filter(item => item?.hex != null)
                .map(item => [item.hex, item])
        );

        for (let linha = 0; linha < this.quantidadeLinhas; linha++)
        {
            for (let coluna = 0; coluna < this.quantidadeColunas; coluna++)
            {
                const letraColuna = this.converterNumeroParaLetras(colunaInicialNumero + coluna);
                const numeroLinha = this.linhaInicial + linha;
                const id = `${letraColuna}${numeroLinha}`;

                const tempHex = new hex(id, this.larguraHex, this.alturaHex);
                const x = coluna * espacamentoX;
                const y = linha * espacamentoY + (coluna % 2) * (this.alturaHex * 0.5);

                this.hexes.set(id, tempHex);

                const dadosHex = hexDataPorId.get(id) ?? this.criarDadosHexDesconhecido(id);

                tempHex.receberData(dadosHex, x, y, onClick, this.config);

                this.hexLayer.appendChild(tempHex.element);
                if (tempHex.iconElement != null)
                {
                    this.iconLayer.appendChild(tempHex.iconElement);
                }
            }
        }

        const larguraMapaSemRotulos = this.larguraHex + (this.quantidadeColunas - 1) * espacamentoX;
        const alturaMapaSemRotulos = this.alturaHex * this.quantidadeLinhas + this.alturaHex * 0.5;

        this.larguraMapaSemRotulos = larguraMapaSemRotulos;
        this.alturaMapaSemRotulos = alturaMapaSemRotulos;

        this.larguraMapa = larguraMapaSemRotulos + this.margemRotulos.esquerda + this.margemRotulos.direita;
        this.alturaMapa = alturaMapaSemRotulos + this.margemRotulos.topo + this.margemRotulos.baixo;

        this.element.setAttribute("width", this.larguraMapa);
        this.element.setAttribute("height", this.alturaMapa);
        this.element.setAttribute(
            "viewBox",
            `${-this.margemRotulos.esquerda} ${-this.margemRotulos.topo} ${this.larguraMapa} ${this.alturaMapa}`
        );
        this.element.setAttribute("preserveAspectRatio", "xMidYMid meet");
        this.element.classList.add("hex-map-svg");

        this.desenharRotulosCoordenadas(espacamentoX, espacamentoY);
    }

    desenharRotulosCoordenadas(espacamentoX, espacamentoY)
    {
        this.coordinateLayer.innerHTML = "";

        const colunaInicialNumero = this.converterLetrasParaNumero(this.colunaInicial);
        const tamanhoFonte = Math.max(14, Math.round(Math.min(this.larguraHex, this.alturaHex) * 0.12));

        for (let coluna = 0; coluna < this.quantidadeColunas; coluna++)
        {
            const letraColuna = this.converterNumeroParaLetras(colunaInicialNumero + coluna);
            const x = coluna * espacamentoX + this.larguraHex * 0.5;
            const y = -this.margemRotulos.topo * 0.48;

            this.coordinateLayer.appendChild(
                this.criarRotuloCoordenada(letraColuna, x, y, tamanhoFonte)
            );
        }

        for (let linha = 0; linha < this.quantidadeLinhas; linha++)
        {
            const numeroLinha = this.linhaInicial + linha;
            const x = -this.margemRotulos.esquerda * 0.48;
            const y = linha * espacamentoY + this.alturaHex * 0.5;

            this.coordinateLayer.appendChild(
                this.criarRotuloCoordenada(String(numeroLinha), x, y, tamanhoFonte)
            );
        }
    }

    criarRotuloCoordenada(texto, x, y, tamanhoFonte)
    {
        const rotulo = document.createElementNS("http://www.w3.org/2000/svg", "text");

        rotulo.textContent = texto;
        rotulo.setAttribute("x", x);
        rotulo.setAttribute("y", y);
        rotulo.setAttribute("text-anchor", "middle");
        rotulo.setAttribute("dominant-baseline", "middle");
        rotulo.setAttribute("font-family", "Arial, sans-serif");
        rotulo.setAttribute("font-size", tamanhoFonte);
        rotulo.setAttribute("font-weight", "700");
        rotulo.setAttribute("fill", "#f0d78c");
        rotulo.setAttribute("stroke", "#000000");
        rotulo.setAttribute("stroke-width", "4");
        rotulo.setAttribute("paint-order", "stroke");
        rotulo.classList.add("coordinate-label");

        return rotulo;
    }

    criarDadosHexDesconhecido(id)
    {
        return {
            hex: id,
            nome: "",
            exploracao: "desconhecido",
            features: {}
        };
    }

    selecionarHex(id)
    {
        const novoHex = this.hexes.get(id);

        if (novoHex == null || novoHex.data == null)
        {
            return;
        }

        if (this.hexSelecionado === novoHex)
        {
            this.desselecionarHex();
            return;
        }

        if (this.hexSelecionado != null)
        {
            this.hexSelecionado.desselecionar();
            if (this.visualizacaoAtual != null)
            {
                this.hexSelecionado.aplicarVisualizacao(this.visualizacaoAtual);
            }
        }

        this.hexSelecionado = novoHex;
        this.hexSelecionado.selecionar();

        if (this.visualizacaoAtual != null)
        {
            this.hexSelecionado.aplicarVisualizacao(this.visualizacaoAtual);
        }

        if (this.onHexSelecionado != null)
        {
            this.onHexSelecionado(this.hexSelecionado.data, this.hexSelecionado);
        }
    }

    desselecionarHex()
    {
        if (this.hexSelecionado == null)
        {
            return;
        }

        this.hexSelecionado.desselecionar();

        if (this.visualizacaoAtual != null)
        {
            this.hexSelecionado.aplicarVisualizacao(this.visualizacaoAtual);
        }

        this.hexSelecionado = null;
        if (this.onHexSelecionado != null)
        {
            this.onHexSelecionado(null, null);
        }
    }

    obterHex(id)
    {
        return this.hexes.get(id);
    }

    definirVizinhos()
    {
        for (const hexItem of this.hexes.values())
        {
            const idsVizinhos = this.obterIdsVizinhos(hexItem.id);

            const vizinhos = idsVizinhos
                .map(id => this.hexes.get(id))
                .filter(vizinho => vizinho != null);

            hexItem.receberVizinhos(vizinhos);
        }
    }

    obterIdsVizinhos(id)
    {
        const partes = id.match(/^([A-Z]+)(\d+)$/);

        if (partes == null)
        {
            return [];
        }

        const letra = partes[1];
        const numero = Number(partes[2]);
        const colunaAbsoluta = this.converterLetrasParaNumero(letra);
        const colunaInicialAbsoluta = this.converterLetrasParaNumero(this.colunaInicial);
        const indiceColuna = colunaAbsoluta - colunaInicialAbsoluta;

        const letraAnterior = colunaAbsoluta > 0
            ? this.converterNumeroParaLetras(colunaAbsoluta - 1)
            : null;

        const letraProxima = this.converterNumeroParaLetras(colunaAbsoluta + 1);

        const idDaColuna = (coluna, linha) =>
        {
            if (coluna == null)
            {
                return null;
            }

            return `${coluna}${linha}`;
        };

        const colunaPar = indiceColuna % 2 === 0;
        const ids = colunaPar
            ? [
                idDaColuna(letraAnterior, numero - 1),
                idDaColuna(letraAnterior, numero),
                `${letra}${numero - 1}`,
                `${letra}${numero + 1}`,
                idDaColuna(letraProxima, numero - 1),
                idDaColuna(letraProxima, numero)
            ]
            : [
                idDaColuna(letraAnterior, numero),
                idDaColuna(letraAnterior, numero + 1),
                `${letra}${numero - 1}`,
                `${letra}${numero + 1}`,
                idDaColuna(letraProxima, numero),
                idDaColuna(letraProxima, numero + 1)
            ];

        return ids.filter(item => item != null);
    }

    desenharTodasConexoes()
    {
        const tiposConexao = Object.keys(this.config?.conexoes ?? {});

        if (tiposConexao.length === 0)
        {
            return;
        }

        for (const tipo of tiposConexao)
        {
            this.desenharConexoes(tipo);
        }
    }

    desenharConexoes(tipo)
    {
        const arestas = this.obterArestasPossiveis(tipo);
        const pais = new Map();

        for (const hexItem of this.hexes.values())
        {
            pais.set(hexItem.id, hexItem.id);
        }

        for (const aresta of arestas)
        {
            const raizA = this.encontrarRaiz(pais, aresta.hexA.id);
            const raizB = this.encontrarRaiz(pais, aresta.hexB.id);

            if (raizA === raizB)
            {
                continue;
            }

            pais.set(raizB, raizA);
            this.desenharLinhaEntre(aresta.hexA, aresta.hexB, tipo);
        }
    }

    obterArestasPossiveis(tipo)
    {
        const chaves = new Set();
        const arestas = [];

        for (const hexItem of this.hexes.values())
        {
            if (!hexItem.temFeature(tipo))
            {
                continue;
            }

            for (const vizinho of hexItem.vizinhos ?? [])
            {
                if (!vizinho.temFeature(tipo))
                {
                    continue;
                }

                const chave = [hexItem.id, vizinho.id].sort().join("-");

                if (chaves.has(chave))
                {
                    continue;
                }

                chaves.add(chave);

                const ordenados = this.ordenarHexesPorPrioridade(hexItem, vizinho);

                arestas.push({
                    hexA: ordenados[0],
                    hexB: ordenados[1],
                    chave: chave
                });
            }
        }

        arestas.sort((a, b) =>
        {
            const comparaA = this.compararIdsHex(a.hexA.id, b.hexA.id);

            if (comparaA !== 0)
            {
                return comparaA;
            }

            return this.compararIdsHex(a.hexB.id, b.hexB.id);
        });

        return arestas;
    }

    desenharLinhaEntre(hexA, hexB, tipo)
    {
        const configConexao = this.config?.conexoes?.[tipo];

        const linha = document.createElementNS("http://www.w3.org/2000/svg", "line");
        linha.setAttribute("x1", hexA.centroX);
        linha.setAttribute("y1", hexA.centroY);
        linha.setAttribute("x2", hexB.centroX);
        linha.setAttribute("y2", hexB.centroY);

        linha.setAttribute("stroke", configConexao?.cor ?? "#ffffff");
        linha.setAttribute("stroke-width", configConexao?.espessura ?? 4);
        linha.setAttribute("stroke-linecap", "round");
        linha.setAttribute("pointer-events", "none");
        linha.dataset.feature = tipo;
        linha.classList.add("connection-line");
        linha.classList.add(`connection-${tipo}`);

        if (configConexao?.tracejado === true)
        {
            linha.setAttribute("stroke-dasharray", configConexao.tracejado_valor ?? "10 6");
        }

        this.connectionLayer.appendChild(linha);
    }

    ordenarHexesPorPrioridade(hexA, hexB)
    {
        if (this.compararIdsHex(hexA.id, hexB.id) <= 0)
        {
            return [hexA, hexB];
        }

        return [hexB, hexA];
    }

    compararIdsHex(idA, idB)
    {
        const a = this.obterOrdemHex(idA);
        const b = this.obterOrdemHex(idB);

        if (a.linha !== b.linha)
        {
            return a.linha - b.linha;
        }

        return a.coluna - b.coluna;
    }

    obterOrdemHex(id)
    {
        const partes = id.match(/^([A-Z]+)(\d+)$/);

        if (partes == null)
        {
            return {
                coluna: 9999,
                linha: 9999
            };
        }

        return {
            coluna: this.converterLetrasParaNumero(partes[1]),
            linha: Number(partes[2])
        };
    }

    converterLetrasParaNumero(letras)
    {
        let numero = 0;
        const texto = String(letras ?? "").toUpperCase();

        for (let i = 0; i < texto.length; i++)
        {
            const codigo = texto.charCodeAt(i);

            if (codigo < 65 || codigo > 90)
            {
                continue;
            }

            numero *= 26;
            numero += codigo - 64;
        }

        return Math.max(numero - 1, 0);
    }

    converterNumeroParaLetras(numero)
    {
        let valor = Number(numero) + 1;
        let letras = "";

        while (valor > 0)
        {
            valor--;
            letras = String.fromCharCode(65 + (valor % 26)) + letras;
            valor = Math.floor(valor / 26);
        }

        return letras || "A";
    }

    encontrarRaiz(pais, id)
    {
        const pai = pais.get(id);

        if (pai === id)
        {
            return id;
        }

        const raiz = this.encontrarRaiz(pais, pai);
        pais.set(id, raiz);

        return raiz;
    }

    aplicarVisualizacao(visualizacao)
    {
        this.visualizacaoAtual = visualizacao;

        for (const hexItem of this.hexes.values())
        {
            if (hexItem.data == null)
            {
                continue;
            }

            hexItem.aplicarVisualizacao(visualizacao);
        }

        for (const linha of this.connectionLayer.querySelectorAll("[data-feature]"))
        {
            const tipo = linha.dataset.feature;
            const visivel = visualizacao.conexoes?.[tipo] === true;

            linha.style.display = visivel ? "" : "none";
        }
    }
}
