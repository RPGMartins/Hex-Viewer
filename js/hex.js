export class hex
{
    constructor(id, largura, altura)
    {
        this.id = id;
        this.largura = largura;
        this.altura = altura;
    }
    
    receberData(data,x,y,onClick)
    {
        this.data = data;
        this.element = this.criarElemento();
        this.configurarClique(onClick);
        this.posicionar(x,y)
        this.verificarTerreno();

    }
    configurarClique(onClick)
    {
        this.element.addEventListener("click", () =>
        {
            onClick(this.id);
        });
    }
    criarIcone(caminho)
    {
        const image = document.createElementNS("http://www.w3.org/2000/svg","image");
        const tamanho = Math.min(this.largura, this.altura) * 0.4;

        image.setAttribute("href", caminho);
        image.setAttribute("width", tamanho);
        image.setAttribute("height", tamanho);

        // Centraliza o ícone
        image.setAttribute("x",(this.largura - tamanho) / 2);
        image.setAttribute("y",(this.altura - tamanho) / 2);

        image.addEventListener("error", () =>
        {
            console.warn("Imagem faltando: "+caminho);
            image.remove();
        });
        
        return image;
    }

    criarElemento()
    {
        const group = document.createElementNS("http://www.w3.org/2000/svg","g");
        const polygon = this.criarVisual();

        group.appendChild(polygon);

        if (this.data.ponto_interesse)
        {
            const imgName = "./images/" + this.data.ponto_interesse.local + ".svg";
            const icone = this.criarIcone(imgName);

            group.appendChild(icone);
        }

        this.polygon = polygon;
        return group;
    }
    
    criarVisual()
    {
        const polygon = document.createElementNS("http://www.w3.org/2000/svg","polygon");

        const pontos = [
            [this.largura * 0.25, 0],
            [this.largura * 0.75, 0],
            [this.largura, this.altura * 0.5],
            [this.largura * 0.75, this.altura],
            [this.largura * 0.25, this.altura],
            [0, this.altura * 0.5]
        ];

        polygon.setAttribute("points",pontos.map(p => p.join(",")).join(" "));
        polygon.setAttribute("fill", "gray");
        polygon.setAttribute("stroke", "black");

        return polygon;
    }
    
    posicionar(x, y)
    {
        this.element.setAttribute("transform",`translate(${x}, ${y})`);
    }

    pintarHex(cor)
    {
        this.polygon.setAttribute("fill", cor);   
    }
    pintarBorda(cor)
    {
        this.polygon.setAttribute("stroke", cor);
    }
    
    selecionar()
    {
        this.pintarBorda("black");
        this.element.setAttribute("stroke-width", "5");
        this.element.parentNode.appendChild(this.element);
        this.mostrarInfo();
        console.log("HEX: "+this.id)
    }
    desselecionar()
    {
        this.pintarBorda("black");
        this.element.setAttribute("stroke-width", "1");

        this.limparInfo();
    }

    mostrarInfo()
    {
        const tempData = this.data;
        document.getElementById("nomeLugar").textContent = tempData.nome;
        document.getElementById("terreno").textContent = tempData.terreno;
        document.getElementById("perigo").textContent = tempData.perigo;
        document.getElementById("local").textContent = tempData.ponto_interesse?.local;
    }

    limparInfo()
    {
        document.getElementById("nomeLugar").textContent = "";
        document.getElementById("terreno").textContent = "";
        document.getElementById("perigo").textContent = "";
    }

    verificarTerreno()
    {
        this.pintarHex("gray");

        switch (this.data.terreno)
        {
            case "deserto":
                this.pintarHex("#D9C27A");
                break;

            case "artico":
                this.pintarHex("#DDEBF2");
                break;

            case "pantano":
                this.pintarHex("#65734B");
                break;

            case "pradaria":
                this.pintarHex("#A8C66C");
                break;

            case "floresta":
                this.pintarHex("#4F7942");
                break;

            case "selva":
                this.pintarHex("#236B3A");
                break;

            case "rio":
                this.pintarHex("#4A90C2");
                break;

            case "costa":
                this.pintarHex("#D6C58A");
                break;

            case "oceano":
                this.pintarHex("#286090");
                break;

            case "montanha":
                this.pintarHex("#954535");
                break;
        }
    }
}