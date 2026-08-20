# Administración de spam para Foroactivo

Versión 1.1.5 de la extensión administrativa en español.

## Funciones

- Localiza los temas y respuestas publicados por un usuario.
- Recopila nombre, ID numérica, perfil, publicaciones y URL externas.
- Obliga a descargar un informe previo antes de habilitar el borrado.
- Elimina los temas iniciados por el usuario y sus respuestas en temas ajenos.
- Comprueba cada operación y genera un registro final.
- Utiliza únicamente las acciones permitidas por la sesión administrativa abierta.

No bloquea ni elimina la cuenta y no envía automáticamente denuncias a Foroactivo.

## Instalación

### Firefox temporal

1. Descomprime el ZIP de `releases`.
2. Abre `about:debugging#/runtime/this-firefox`.
3. Pulsa **Cargar complemento temporal**.
4. Selecciona `manifest.json`.

Para una instalación permanente se necesita una versión firmada por Mozilla.

### Chrome o Edge

1. Descomprime el ZIP.
2. Abre la página de extensiones del navegador.
3. Activa el modo de desarrollador.
4. Selecciona **Cargar descomprimida** o **Cargar desempaquetada**.
5. Elige la carpeta descomprimida.

## Uso seguro

1. Inicia sesión como administrador o moderador y abre una página del foro.
2. Abre la extensión, introduce el nombre exacto y analiza los mensajes.
3. Revisa y descarga el informe previo obligatorio.
4. Escribe la confirmación solicitada y comienza el borrado.
5. Conserva el registro final y cierra la sesión al terminar.

El borrado es irreversible. Realiza primero una prueba controlada en un foro de pruebas.

Compatibilidad prevista: phpBB2, phpBB3, PunBB, Invision, ModernBB y AwesomeBB. Las plantillas muy modificadas pueden ocultar acciones nativas; en ese caso la extensión registra el error.

