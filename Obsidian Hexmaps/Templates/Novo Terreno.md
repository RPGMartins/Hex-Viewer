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

const nome = await tp.system.prompt("Nome do terreno", "Cerrado");
const id = await tp.system.prompt("ID do terreno", normalizar(nome));
const cor = await tp.system.prompt("Cor hexadecimal", "#B7A85C");

await tp.file.move(`Catalogos/Terrenos/${nome}`);

tR += `---
fileClass: Terreno
id: ${id}
label: ${nome}
cor: "${cor}"
visivel_padrao: true
---

# ${nome}

## Descrição

`;
%>
