export class hex
{
    constructor(id, largura, altura)
    {
        this.id = id;
        this.largura = largura;
        this.altura = altura;
    }

    receberData(data, x, y, onClick)
    {
        this.corPerigo = "#777777";
        this.corTerreno = "gray";
        this.selecionado = false;
        this.visualizacaoAtual = null;
        
        this.data = data;

        this.element = this.criarElemento();
        this.iconElement = this.criarIconElement();

        this.configurarClique(onClick);
        this.posicionar(x, y);

        this.verificarTerreno();
        this.verificarPerigo();

        this.desselecionar();
    }
    
    receberVizinhos(vizinhos)
    {
        this.vizinhos = vizinhos;
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
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const polygon = this.criarVisual();

        group.appendChild(polygon);

        this.polygon = polygon;

        return group;
    }

    criarIconElement()
    {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

        this.poiIconGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.dangerIconGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        this.poiIconGroup.dataset.iconType = this.data.ponto_interesse?.local ?? "";

        if (this.data.ponto_interesse)
        {
            const imgName = "./images/" + this.data.ponto_interesse.local + ".svg";
            const icone = this.criarIcone(imgName);

            this.poiIconGroup.appendChild(icone);
        }

        group.appendChild(this.poiIconGroup);
        group.appendChild(this.dangerIconGroup);

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
        this.x = x;
        this.y = y;

        this.centroX = x + this.largura / 2;
        this.centroY = y + this.altura / 2;

        this.element.setAttribute("transform", `translate(${x}, ${y})`);

        if (this.iconElement != null)
        {
            this.iconElement.setAttribute("transform", `translate(${x}, ${y})`);
        }
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
        this.selecionado = true;
        this.mostrarInfo();
        console.log("HEX: " + this.id);
    }

    desselecionar()
    {
        this.selecionado = false;
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
        this.corTerreno = "gray";
        this.pintarHex(this.corTerreno);

        switch (this.data.terreno)
        {
            case "deserto":
                this.corTerreno = "#D9C27A";
                break;

            case "artico":
                this.corTerreno = "#DDEBF2";
                break;

            case "pantano":
                this.corTerreno = "#65734B";
                break;

            case "pradaria":
                this.corTerreno = "#A8C66C";
                break;

            case "floresta":
                this.corTerreno = "#4F7942";
                break;

            case "selva":
                this.corTerreno = "#236B3A";
                break;

            case "rio":
                this.corTerreno = "#4A90C2";
                break;

            case "costa":
                this.corTerreno = "#D6C58A";
                break;

            case "oceano":
                this.corTerreno = "#286090";
                break;

            case "montanha":
                this.corTerreno = "#954535";
                break;
        }

        this.pintarHex(this.corTerreno);
    }

    verificarPerigo()
    {
        switch (this.data.perigo)
        {
            case "seguro":
                this.corPerigo = "green";
                this.polygon.setAttribute("stroke-dasharray", "none");
                break;

            case "inseguro":
                this.corPerigo = "#E0B52F";
                this.criarCaveiras(1);
                break;

            case "arriscado":
                this.corPerigo = "#E87518";
                this.criarCaveiras(2);
                break;

            case "mortal":
                this.corPerigo = "#D9362B";
                this.criarCaveiras(3);
                break;
        }

        
        this.pintarBorda(this.corPerigo);

        if (this.data.perigo !== "seguro")
        {
            this.polygon.setAttribute("stroke-dasharray","6 3");
        }
    }

    criarCaveiras(quantidade)
    {
        const tamanho = Math.min(this.largura,this.altura) * 0.16;
        const espacamento = tamanho * 0.15;
        const larguraTotal = quantidade * tamanho + (quantidade - 1) * espacamento;
        const inicioX = (this.largura - larguraTotal) / 2;
        const y = this.altura * 0.02;

        for (let i = 0; i < quantidade; i++)
        {
            const caveira = document.createElementNS("http://www.w3.org/2000/svg","image");

            caveira.setAttribute("href", "./images/caveira.svg");
            caveira.setAttribute("width", tamanho);
            caveira.setAttribute("height", tamanho);
            caveira.setAttribute("x",inicioX + i * (tamanho + espacamento));
            caveira.setAttribute("y", y);

            this.dangerIconGroup.appendChild(caveira);
        }
    }

    temFeature(tipo)
    {
        if (this.data == null)
        {
            return false;
        }

        if (this.data.features?.[tipo] === true)
        {
            return true;
        }
        
        if (tipo === "rio" && this.data.terreno === "rio")
        {
            return true;
        }

        return false;
    }

    aplicarVisualizacao(visualizacao)
    {
        this.visualizacaoAtual = visualizacao;

        this.aplicarVisualizacaoTerreno(visualizacao);
        this.aplicarVisualizacaoPerigo(visualizacao);
        this.aplicarVisualizacaoIcone(visualizacao);
    }

    aplicarVisualizacaoTerreno(visualizacao)
    {
        const terreno = this.data.terreno;

        const mostrarTerreno =
            visualizacao.terreno?.ativo === true &&
            visualizacao.terreno?.tipos?.[terreno] !== false;

        if (mostrarTerreno)
        {
            this.pintarHex(this.corTerreno);
            return;
        }

        this.pintarHex("#B8B8B8");
    }

    aplicarVisualizacaoPerigo(visualizacao)
    {
        const perigo = this.data.perigo;

        const mostrarPerigo =
            visualizacao.perigo?.ativo === true &&
            visualizacao.perigo?.tipos?.[perigo] !== false;

        if (this.selecionado)
        {
            this.pintarBorda("black");
            this.polygon.setAttribute("stroke-width", "5");
        }
        else if (mostrarPerigo)
        {
            this.pintarBorda(this.corPerigo);
            this.polygon.setAttribute("stroke-width", "3");
        }
        else
        {
            this.pintarBorda("#555555");
            this.polygon.setAttribute("stroke-width", "2");
        }

        if (mostrarPerigo && perigo !== "seguro")
        {
            this.polygon.setAttribute("stroke-dasharray", "6 3");
        }
        else
        {
            this.polygon.setAttribute("stroke-dasharray", "none");
        }

        if (this.dangerIconGroup != null)
        {
            this.dangerIconGroup.style.display = mostrarPerigo ? "" : "none";
        }
    }

    aplicarVisualizacaoIcone(visualizacao)
    {
        if (this.poiIconGroup == null)
        {
            return;
        }

        const tipoIcone = this.data.ponto_interesse?.local;

        if (tipoIcone == null)
        {
            this.poiIconGroup.style.display = "none";
            return;
        }

        const mostrarIcone =
            visualizacao.icones?.ativo === true &&
            visualizacao.icones?.tipos?.[tipoIcone] !== false;

        this.poiIconGroup.style.display = mostrarIcone ? "" : "none";
    }
}