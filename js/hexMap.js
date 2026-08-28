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

        // Dicionário de hexes
        this.hexes = new Map();

        // SVG que vai conter todos os hexes
        this.element = this.criarElemento();

        this.hexSelecionado;
        
        this.criarHexes((id) => this.selecionarHex(id),hexData);
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
        return document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
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

                if (dadosHex == false)
                {
                    console.warn(`Hex ${id} não encontrado no JSON`);
                    continue;
                }
                else 
                {
                    tempHex.receberData(dadosHex,x,y,onClick);
                    this.element.appendChild(tempHex.element);
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
}