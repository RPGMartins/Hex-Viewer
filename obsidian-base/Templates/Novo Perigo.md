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

const nome = await tp.system.prompt("Nome do perigo", "Perigoso");
const id = await tp.system.prompt("ID do perigo", normalizar(nome));
const cor = await tp.system.prompt("Cor hexadecimal", "#D87939");
const caveiras = await tp.system.suggester(["0", "1", "2", "3"], [0, 1, 2, 3], false, "Quantidade de caveiras");
const tracejado = await tp.system.suggester(["não", "sim"], [false, true], false, "Usa tracejado?");

await tp.file.move(`Catalogos/Perigos/${nome}`);

tR += `---
fileClass: Perigo
id: ${id}
label: ${nome}
cor: "${cor}"
caveiras: ${caveiras}
tracejado: ${tracejado}
visivel_padrao: true
---

# ${nome}

## Descrição

`;
%>
