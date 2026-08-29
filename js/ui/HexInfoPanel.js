export class HexInfoPanel
{
    constructor(config)
    {
        this.config = config ?? {};

        this.nomeLugar = document.getElementById("nomeLugar");
        this.terreno = document.getElementById("terreno");
        this.perigo = document.getElementById("perigo");
        this.local = document.getElementById("local");
    }

    mostrar(hexData, hex)
    {
        if (hexData == null)
        {
            this.limpar();
            return;
        }

        this.nomeLugar.textContent = hexData.nome ?? hex?.id ?? "";
        this.terreno.textContent = this.obterLabelTerreno(hexData.terreno);
        this.perigo.textContent = this.obterLabelPerigo(hexData.perigo);
        this.local.textContent = this.obterTextoPontoInteresse(hexData.ponto_interesse);
    }

    limpar()
    {
        this.nomeLugar.textContent = "";
        this.terreno.textContent = "";
        this.perigo.textContent = "";
        this.local.textContent = "";
    }

    obterLabelTerreno(terreno)
    {
        if (terreno == null || terreno === "")
        {
            return "";
        }

        return this.config.terrenos?.[terreno]?.label ?? terreno;
    }

    obterLabelPerigo(perigo)
    {
        if (perigo == null || perigo === "")
        {
            return "";
        }

        return this.config.perigos?.[perigo]?.label ?? perigo;
    }

    obterTextoPontoInteresse(pontoInteresse)
    {
        if (pontoInteresse == null)
        {
            return "";
        }

        const tipo = pontoInteresse.tipo ?? pontoInteresse.local;
        const labelTipo = this.config.pontos_interesse?.[tipo]?.label ?? tipo ?? "";

        if (pontoInteresse.nome != null && pontoInteresse.nome !== "")
        {
            return pontoInteresse.nome;
        }

        if (pontoInteresse.local != null && pontoInteresse.local !== "")
        {
            return pontoInteresse.local;
        }

        return labelTipo;
    }
}