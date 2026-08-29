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

const nome = await tp.system.prompt("Nome do estado de exploração", "Investigado");
const id = await tp.system.prompt("ID", normalizar(nome));
const simbolo = await tp.system.prompt("Símbolo", "?");
const cor = await tp.system.prompt("Cor do marcador", "#5D6570");

await tp.file.move(`Catalogos/Exploracoes/${nome}`);

tR += `---
fileClass: Exploracao
id: ${id}
label: ${nome}
simbolo: "${simbolo}"
cor: "${cor}"
cor_borda: "#111111"
cor_texto: "#FFFFFF"
visivel_padrao: true
---

# ${nome}

## Descrição

`;
%>
