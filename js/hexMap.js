import { hex } from "./hex.js";

export class hexMap
{
    constructor(quantidadeLinhas,quantidadeColunas,colunaInicial,linhaInicial,larguraHex,alturaHex)
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

        this.criarHexes();
    }

    criarElemento()
    {
        return document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
    }

    criarHexes()
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
                const y =linha * espacamentoY + (coluna % 2) * (this.alturaHex * 0.5);

                tempHex.posicionar(x, y);
                this.hexes.set(id, tempHex);
                this.element.appendChild(tempHex.element);
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