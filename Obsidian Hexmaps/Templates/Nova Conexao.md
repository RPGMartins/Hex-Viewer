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

const nome = await tp.system.prompt("Nome da conexão/feature", "Estrada");
const id = await tp.system.prompt("ID", normalizar(nome));
const cor = await tp.system.prompt("Cor hexadecimal", "#F5D742");
const espessura = await tp.system.prompt("Espessura", "5");
const tracejado = await tp.system.suggester(["não", "sim"], [false, true], false, "Usa tracejado?");
let tracejadoValor = "";

if (tracejado)
{
    tracejadoValor = await tp.system.prompt("Valor do tracejado", "10 6");
}

await tp.file.move(`Catalogos/Conexoes/${nome}`);

tR += `---
fileClass: Conexao
id: ${id}
label: ${nome}
cor: "${cor}"
espessura: ${espessura}
tracejado: ${tracejado}
tracejado_valor: "${tracejadoValor}"
visivel_padrao: true
---

# ${nome}

## Descrição

`;
%>
