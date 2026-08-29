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

        this.hexes = new Map();
        this.element = this.criarElemento();

        this.hexSelecionado = null;
        this.visualizacaoAtual = null;

        this.criarHexes((id) => this.selecionarHex(id), this.hexData);

        this.definirVizinhos();

        this.desenharConexoes("rio");
        this.desenharConexoes("estrada");
    }

    criarElemento()
    {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        this.hexLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.connectionLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.iconLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");

        this.hexLayer.setAttribute("id", "hex-layer");
        this.connectionLayer.setAttribute("id", "connection-layer");
        this.iconLayer.setAttribute("id", "icon-layer");

        this.iconLayer.setAttribute("pointer-events", "none");

        svg.appendChild(this.hexLayer);
        svg.appendChild(this.connectionLayer);
        svg.appendChild(this.iconLayer);

        return svg;
    }

    criarHexes(onClick, hexData)
    {
        const espacamentoX = this.larguraHex * 0.75;
        const espacamentoY = this.alturaHex;

        for (let linha = 0; linha < this.quantidadeLinhas; linha++)
        {
            for (let coluna = 0; coluna < this.quantidadeColunas; coluna++)
            {
                const letraColuna = String.fromCharCode(this.colunaInicial.charCodeAt(0) + coluna);
                const numeroLinha = this.linhaInicial + linha;
                const id = `${letraColuna}${numeroLinha}`;

                const tempHex = new hex(id, this.larguraHex, this.alturaHex);

                const x = coluna * espacamentoX;
                const y = linha * espacamentoY + (coluna % 2) * (this.alturaHex * 0.5);

                this.hexes.set(id, tempHex);

                const dadosHex = hexData.find(hexDataItem => hexDataItem.hex === id);

                if (!dadosHex)
                {
                    console.warn(`Hex ${id} não encontrado no JSON`);
                    continue;
                }

                tempHex.receberData(dadosHex, x, y, onClick, this.config);

                this.hexLayer.appendChild(tempHex.element);

                if (tempHex.iconElement != null)
                {
                    this.iconLayer.appendChild(tempHex.iconElement);
                }
            }
        }

        const larguraMapa = this.larguraHex + (this.quantidadeColunas - 1) * espacamentoX;
        const alturaMapa = this.alturaHex * this.quantidadeLinhas + this.alturaHex * 0.5;

        this.element.setAttribute("width", larguraMapa);
        this.element.setAttribute("height", alturaMapa);
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
        const indiceColuna = letra.charCodeAt(0) - this.colunaInicial.charCodeAt(0);

        const letraAnterior = String.fromCharCode(letra.charCodeAt(0) - 1);
        const letraProxima = String.fromCharCode(letra.charCodeAt(0) + 1);

        const colunaPar = indiceColuna % 2 === 0;

        if (colunaPar)
        {
            return [
                `${letraAnterior}${numero - 1}`,
                `${letraAnterior}${numero}`,
                `${letra}${numero - 1}`,
                `${letra}${numero + 1}`,
                `${letraProxima}${numero - 1}`,
                `${letraProxima}${numero}`
            ];
        }

        return [
            `${letraAnterior}${numero}`,
            `${letraAnterior}${numero + 1}`,
            `${letra}${numero - 1}`,
            `${letra}${numero + 1}`,
            `${letraProxima}${numero}`,
            `${letraProxima}${numero + 1}`
        ];
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

        for (let i = 0; i < letras.length; i++)
        {
            numero *= 26;
            numero += letras.charCodeAt(i) - 64;
        }

        return numero - 1;
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