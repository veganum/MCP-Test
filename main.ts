import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

//? 1. Crear el servidor
//Es la interfaz principal con el protocolo MCP.Maneja la comunicacion entre el cliente y el servidor.

const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

//? 2. Definir las herramientas
//Las herramientas le permite al LLM realizar acciones a traves de tu servidor.
server.tool(
  "fetch-weather", // Nombre de la herramienta
  "Herramienta para obtener el clima de una ciudad", // Descripcion de la herramienta
  {
    city: z.string().describe("Nombre de la ciudad"), // Definicion de los parametros de la herramienta
    user: z.string().default("Usuario").describe("Nombre del usuario"),
  },
  async ({ city, user }) => {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=es&format=json`
    );
    const data = await response.json();

    if (data.lenght === 0) {
      return {
        content: [
          {
            type: "text",
            text: `Lo siento ${user}, no pude encontrar la ciudad ${city}`,
          },
        ],
      };
    }

    const { latitude, longitude } = data.results[0];

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,precipitation,is_day,rain`
    );

    const weatherData = await weatherResponse.json();

    return {
      content: [
        {
          type: "text",
          //   text: `Buenos días ${user}, El clima de ${city} es soleado`,
          text: JSON.stringify(weatherData, null, 2),
        },
      ],
    };
  }
);

//? 3. Escuchar las conexiones del cliente
const transport = new StdioServerTransport();
await server.connect(transport); // Conectar el servidor al transporte
