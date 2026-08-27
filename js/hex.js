export class hex
{
    constructor(id, largura, altura)
    {
        this.id = id;
        this.largura = largura;
        this.altura = altura;

        this.element = this.criarVisual();
    }

    criarVisual()
    {
        const polygon = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polygon"
        );

        const pontos = [
            [this.largura * 0.25, 0],
            [this.largura * 0.75, 0],
            [this.largura, this.altura * 0.5],
            [this.largura * 0.75, this.altura],
            [this.largura * 0.25, this.altura],
            [0, this.altura * 0.5]
        ];

        polygon.setAttribute(
            "points",
            pontos.map(p => p.join(",")).join(" ")
        );

        polygon.setAttribute("fill", "gray");
        polygon.setAttribute("stroke", "black");

        return polygon;
    }

    posicionar(x, y)
    {
        this.element.setAttribute(
            "transform",
            `translate(${x}, ${y})`
        );
    }
}