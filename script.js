import { hexMap } from "./js/hexMap.js";


console.log("JavaScript carregado!");
const publicHexesPath = "./data/hexes-public.json";

iniciar();
async function iniciar()
{
    const hexData = await carregarJson(publicHexesPath);

    console.log(hexData);
    
    const hexTemp = new hexMap(5,5,"A",1,100,86,hexData.hexes);
    document.getElementById("mapa").appendChild(hexTemp.element);
}


async function carregarJson(caminho) 
{
    const resposta = await fetch(caminho);

    if (resposta.ok == false)
    {
        throw new Error(`Erro ao carregar JSON: ${resposta.status}`);
    }

    return await resposta.json();
}
