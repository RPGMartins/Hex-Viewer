import { hex } from "./hex.js";

export class hexMap
{
    constructor(quantidadeLinhas,quantidadeColunas,colunaInicial,linhaInicial,larguraHex,alturaHex,hexData)
    {
        this.quantidadeLinhas = quantidadeLinhas;
        this.quantidadeColunas = quantidadeColunas;

        this.colunaInicial = colunaInicial;
        this.linhaInicial = linhaInicial;

        this.larguraHex = larguraHex;
        this.alturaHex = alturaHex;

        this.hexes = new Map();
        this.element = this.criarElemento();
        this.hexSelecionado;
        
        this.criarHexes((id) => this.selecionarHex(id),hexData);

        this.definirVizinhos();
        this.desenharConexoes("rio");
        this.desenharConexoes("estrada");
    }

    selecionarHex(id)
    {
        const hex = this.obterHex(id);

        if (hex == null) 
        {
            return;
        }
        
        this.pintarHexSelecionado(hex)
    }
    
    pintarHexSelecionado(hex)
    {
        if(this.hexSelecionado == null)
        {
            this.selecionarNovoHex(hex);
            return;
        }
        
        if(hex != this.hexSelecionado)
        {
            this.desselecionarHex();
            this.selecionarNovoHex(hex);
            return;
        }

        this.desselecionarHex();

    }

    selecionarNovoHex(hex)
    {
        this.hexSelecionado = hex;
        this.hexSelecionado.selecionar();
    }

    desselecionarHex()
    {
        this.hexSelecionado.desselecionar();
        this.hexSelecionado = null;
    }

    criarElemento()
    {
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

        this.hexLayer = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        this.connectionLayer = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        this.iconLayer = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        this.hexLayer.setAttribute("id", "hex-layer");
        this.connectionLayer.setAttribute("id", "connection-layer");
        this.iconLayer.setAttribute("id", "icon-layer");

        // Ícones não bloqueiam clique no hex
        this.iconLayer.setAttribute("pointer-events", "none");

        svg.appendChild(this.hexLayer);
        svg.appendChild(this.connectionLayer);
        svg.appendChild(this.iconLayer);

        return svg;
    }

    criarHexes(onClick,hexData)
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
                const tempHex = new hex(id,this.larguraHex,this.alturaHex);
                const x = coluna * espacamentoX;
                const y = linha * espacamentoY + (coluna % 2) * (this.alturaHex * 0.5);
                
                this.hexes.set(id, tempHex);
                const dadosHex = hexData.find(hex => hex.hex === id);

                if (!dadosHex)
                {
                    console.warn(`Hex ${id} não encontrado no JSON`);
                    continue;
                }
                else 
                {
                    tempHex.receberData(dadosHex,x,y,onClick);
                    this.hexLayer.appendChild(tempHex.element);

                    if (tempHex.iconElement != null)
                    {
                        this.iconLayer.appendChild(tempHex.iconElement);
                    }
                }
            }
        }

        const larguraMapa = this.larguraHex + (this.quantidadeColunas - 1) * espacamentoX;

        const alturaMapa = this.alturaHex * this.quantidadeLinhas + this.alturaHex * 0.5;

        this.element.setAttribute("width", larguraMapa);
        this.element.setAttribute("height", alturaMapa);
    }

    obterHex(id)
    {
        return this.hexes.get(id);
    }

    obterHexPorCoordenada(x, y)
    {
        return this.hexesPorCoordenada.get(`${x},${y}`);
    }

    definirVizinhos()
    {
        for (const hex of this.hexes.values())
        {
            const idsVizinhos = this.obterIdsVizinhos(hex.id);

            const vizinhos = idsVizinhos
                .map(id => this.hexes.get(id))
                .filter(vizinho => vizinho != null);

            hex.receberVizinhos(vizinhos);
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
        const desenhadas = new Set();

        for (const hex of this.hexes.values())
        {
            if (!hex.temFeature(tipo))
            {
                continue;
            }

            for (const vizinho of hex.vizinhos)
            {
                if (!vizinho.temFeature(tipo))
                {
                    continue;
                }

                const chave = [hex.id, vizinho.id].sort().join("-");

                if (desenhadas.has(chave))
                {
                    continue;
                }

                this.desenharLinhaEntre(hex, vizinho, tipo);
                desenhadas.add(chave);
            }
        }
    }

    desenharLinhaEntre(hexA, hexB, tipo)
    {
        const linha = document.createElementNS("http://www.w3.org/2000/svg", "line");

        linha.setAttribute("x1", hexA.centroX);
        linha.setAttribute("y1", hexA.centroY);
        linha.setAttribute("x2", hexB.centroX);
        linha.setAttribute("y2", hexB.centroY);

        linha.setAttribute("stroke", tipo === "rio" ? "#22B8F0" : "#F5D742");
        linha.setAttribute("stroke-width", tipo === "rio" ? "6" : "5");
        linha.setAttribute("stroke-linecap", "round");
        linha.setAttribute("pointer-events", "none");

        if (tipo === "estrada")
        {
            linha.setAttribute("stroke-dasharray", "10 6");
        }

        this.connectionLayer.appendChild(linha);
    }
}