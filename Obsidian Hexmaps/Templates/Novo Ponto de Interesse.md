<%*
function normalizar(texto)
{
    return String(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

const nome = await tp.system.prompt("Nome do tipo de ponto de interesse", "Ruína");
const id = await tp.system.prompt("ID", normalizar(nome));
const icone = await tp.system.prompt("Caminho do ícone", `./images/${id}.svg`);

await tp.file.move(`Catalogos/Pontos de Interesse/${nome}`);

tR += `---
fileClass: PontoInteresse
id: ${id}
label: ${nome}
icone: "${icone}"
visivel_padrao: true
---

# ${nome}

## Descrição

`;
%>
