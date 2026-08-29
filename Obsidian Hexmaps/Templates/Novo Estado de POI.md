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

const nome = await tp.system.prompt("Nome do estado de POI", "Ativo");
const id = await tp.system.prompt("ID", normalizar(nome));

await tp.file.move(`Catalogos/Estados de POI/${nome}`);

tR += `---
fileClass: EstadoPOI
id: ${id}
label: ${nome}
---

# ${nome}
`;
%>
