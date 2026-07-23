# Mideas MCP Server

Servidor MCP local integrado con la instancia React de Mideas. El proceso MCP se ejecuta separado de Vite y abre un puente HTTP autenticado solo en `127.0.0.1`. La app publica una copia acotada de su estado y consume una cola de acciones permitidas.

No expone acceso al sistema de archivos, borrado, subida de ficheros ni ejecución de comandos.

## Herramientas

- `get_app_state`: conectividad y estado general de la interfaz.
- `get_project`: proyecto activo; omite los datos pesados de assets por defecto.
- `get_asset`: asset completo por ID exacto.
- `list_worlds`: mundos y enlaces a pantallas.
- `list_screens`: pantallas SCREEN 2/4/5 y número de entidades.
- `list_entities`: plantillas e instancias colocadas.
- `list_components`: definiciones ECS y plantillas que las usan.
- `get_configuration`: configuración del proyecto y del IDE.
- `execute_action`: solo admite `focus_asset`, `open_configuration` y `set_status_message`.

## Instalación

Desde la raíz de Mideas:

```powershell
Copy-Item .env.example .env
# Edita MIDEAS_MCP_TOKEN y usa un valor local largo y aleatorio.
npm run mcp:install
```

El token nunca se entrega al navegador. Vite lo añade al reenviar `/mcp-api` hacia el puente local.

## Ejecución

Inicia primero el MCP y después reinicia Vite para que lea `.env`:

```powershell
npm run mcp:start
npm run dev
```

El puente usa por defecto `127.0.0.1:3333`. La aplicación sigue funcionando con normalidad si el MCP está apagado.

## Configuración de un cliente MCP

El cliente debe iniciar el servidor desde la raíz del repositorio para que `--env-file-if-exists=.env` encuentre la configuración:

```json
{
  "mcpServers": {
    "mideas": {
      "command": "node",
      "args": [
        "--env-file-if-exists=C:\\Users\\salam\\Documents\\Programacion\\Mideas\\.env",
        "C:\\Users\\salam\\Documents\\Programacion\\Mideas\\mcp\\src\\index.js"
      ]
    }
  }
}
```

Para un despliegue de producción, configura el servidor web para reenviar `/mcp-api` al puente e inyectar `X-Mideas-MCP-Token`; no incluyas el token en el bundle React.

## Pruebas

```powershell
npm run mcp:test
npm run build
```

Las pruebas cubren autenticación, límites de origen y cuerpo, sincronización del estado, consultas estructuradas, cola de acciones y negociación MCP por `stdio`.
