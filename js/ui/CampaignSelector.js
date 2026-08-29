export class CampaignSelector
{
    escolher(campanhas, options = {})
    {
        const campanhasDisponiveis = campanhas ?? [];
        return new Promise((resolve) =>
        {
            const overlay = this.criarOverlay();
            const modal = this.criarModal();
            const titulo = document.createElement("h2");
            titulo.textContent = options.titulo ?? "Escolha uma campanha";
            const texto = document.createElement("p");
            texto.classList.add("campaign-selector-description");
            texto.textContent = options.descricao ?? "Selecione qual conjunto de dados o mapa deve carregar.";
            const lista = document.createElement("div");
            lista.classList.add("campaign-selector-list");
            let selecionada = null;
            const botaoConfirmar = document.createElement("button");

            for (const campanha of campanhasDisponiveis)
            {
                const item = this.criarItemCampanha(campanha);
                if (campanha.id === options.selectedId)
                {
                    item.classList.add("is-selected");
                    selecionada = campanha;
                }
                item.addEventListener("click", () =>
                {
                    selecionada = campanha;
                    for (const outro of lista.querySelectorAll(".campaign-selector-item")) outro.classList.remove("is-selected");
                    item.classList.add("is-selected");
                    botaoConfirmar.disabled = false;
                });
                lista.appendChild(item);
            }

            if (campanhasDisponiveis.length === 0)
            {
                const vazio = document.createElement("p");
                vazio.classList.add("campaign-selector-empty");
                vazio.textContent = "Nenhuma campanha foi encontrada em data/campaigns.json.";
                lista.appendChild(vazio);
            }

            const actions = document.createElement("div");
            actions.classList.add("campaign-selector-actions");
            botaoConfirmar.type = "button";
            botaoConfirmar.classList.add("campaign-selector-button", "campaign-selector-button-primary");
            botaoConfirmar.textContent = "Carregar";
            botaoConfirmar.disabled = selecionada == null;
            botaoConfirmar.addEventListener("click", () =>
            {
                this.removerOverlay(overlay);
                resolve(selecionada);
            });
            actions.appendChild(botaoConfirmar);

            if (options.allowCancel === true)
            {
                const botaoCancelar = document.createElement("button");
                botaoCancelar.type = "button";
                botaoCancelar.classList.add("campaign-selector-button");
                botaoCancelar.textContent = "Cancelar";
                botaoCancelar.addEventListener("click", () =>
                {
                    this.removerOverlay(overlay);
                    resolve(null);
                });
                actions.appendChild(botaoCancelar);
            }

            modal.appendChild(titulo);
            modal.appendChild(texto);
            modal.appendChild(lista);
            modal.appendChild(actions);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        });
    }

    criarOverlay()
    {
        const overlay = document.createElement("div");
        overlay.classList.add("campaign-selector-backdrop");
        return overlay;
    }

    criarModal()
    {
        const modal = document.createElement("div");
        modal.classList.add("campaign-selector-modal");
        return modal;
    }

    criarItemCampanha(campanha)
    {
        const item = document.createElement("button");
        item.type = "button";
        item.classList.add("campaign-selector-item");
        const nome = document.createElement("span");
        nome.classList.add("campaign-selector-item-name");
        nome.textContent = campanha.nome ?? campanha.id ?? "Campanha sem nome";
        const descricao = document.createElement("span");
        descricao.classList.add("campaign-selector-item-description");
        descricao.textContent = campanha.descricao ?? "";
        const meta = document.createElement("span");
        meta.classList.add("campaign-selector-item-meta");
        meta.textContent = [campanha.tipo, campanha.id].filter(x => x != null && x !== "").join(" · ");
        item.appendChild(nome);
        if (descricao.textContent !== "") item.appendChild(descricao);
        if (meta.textContent !== "") item.appendChild(meta);
        return item;
    }

    removerOverlay(overlay)
    {
        overlay.remove();
    }
}
