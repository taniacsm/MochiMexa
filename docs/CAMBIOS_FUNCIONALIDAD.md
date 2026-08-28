# MochiMexa: funciones y ajustes de interfaz

## Alcance

Los cambios están únicamente en archivos locales. No se ejecutaron `git add`, commits, push ni cambios de rama. Se conservaron los cambios previos del proyecto; el backend y los archivos SQL no se modificaron. `.DS_Store` ya estaba modificado y no se editó.

Esta guía describe el estado actual, incluidas la recuperación en Iniciar sesión, la edición de productos, la unificación de precios y los ajustes visuales solicitados después de la primera integración. La revisión administrativa **restauró Dashboard como entrada del panel**, hizo dinámica la tabla de Pedidos y afinó los espacios de Inicio y Contacto. Los CSS modificados corresponden a Inicio, Iniciar sesión, Contacto y Administración; se conserva la paleta y se reutilizan los componentes existentes.

Posteriormente se añadieron las tres páginas solicitadas con capturas: **Resumen de pedido, Mi perfil y Detalle de producto**. Su explicación detallada está en [PAGINAS_USUARIO.md](PAGINAS_USUARIO.md), incluido el modo de pago de prueba y las limitaciones de los datos locales. Estas páginas usan una hoja nueva, `frontend/css/tienda.css`.

La última revisión incorpora el **navbar compartido en el resumen**, un contador de unidades sobre el carrito, botones +/− en las filas y la eliminación de **Editar carrito**. El formulario de tarjeta admite editar datos ficticios, y Configuración controla los métodos disponibles, incluido PayPal. Se documentan los archivos, la sincronización y los límites de pago en [PAGINAS_USUARIO.md](PAGINAS_USUARIO.md). Se conservan los espacios aprobados de Inicio y Contacto y la distribución del Dashboard.

## 1. Recuperar contraseña dentro de Iniciar sesión

Archivos: `frontend/pages/iniciaSesion.html`, `frontend/js/inicioSesion1.js`, `frontend/css/inicioSesion.css` y configuración en `frontend/js/mochi.js`.

- “¿Olvidaste tu clave?” abre una sección dentro de la misma tarjeta. Ya no saca al visitante a Contacto para mostrar el formulario de recuperación.
- La sección contiene correo, botón **Solicitar enlace**, estado de la solicitud, enlace de ayuda y regreso al login. Son formularios independientes: no se anidaron formularios.
- El correo escrito en el login se reutiliza si el campo de recuperación está vacío. También se puede entrar directamente con `iniciaSesion.html#recuperar-clave`.
- Se conserva el diseño de los inputs, bordes redondeados, botón verde y fondo claro.
- El formulario valida el correo, bloquea envíos duplicados y restaura el botón tras un fallo. Una solicitud configurada tiene un límite de espera de diez segundos.

### Límite del servicio

**Todavía no hay un servicio de recuperación de contraseñas implementado.** `Mochi.config.recuperacion` permanece vacío. En ese estado se muestra un aviso explícito: no se envió ningún correo ni se cambió la contraseña. “Necesito ayuda” abre el formulario de contacto en otra pestaña.

La interfaz está preparada para enviar `POST` con JSON `{ "email": "..." }` al endpoint que se configure en el futuro. Solo una respuesta exitosa produce el mensaje neutral “Si existe una cuenta…”. No se consulta la lista local para revelar qué correos están registrados.

El backend deberá generar enlaces con tokens de un solo uso, verificar su vigencia y actualizar la credencial. Registro y login todavía son una demostración de LocalStorage; también deben migrarse al mismo backend. Configurar únicamente el endpoint de recuperación no convierte esas cuentas locales en cuentas reales.

## 2. Catálogo administrativo: Editar producto

Archivos: `frontend/pagesAdmin/homeAdmin.html`, `frontend/jsAdmin/scriptAdmin1.js`, `frontend/pages/adminProd.html` y `frontend/js/adminProd.js`.

- Se agregó la columna **Acciones** y un enlace **Editar** en cada fila del catálogo administrativo.
- El enlace abre el formulario existente como `adminProd.html?editar=ID`. No se creó otra maquetación para duplicar el editor.
- Al editar se muestran **Editar Producto** y **Guardar cambios**. Nombre, descripción, categoría, precio, stock e imagen se precargan con el artículo seleccionado.
- Guardar conserva el ID; no crea una copia del producto. Los cambios aparecen en el catálogo público, el panel y la tarjeta de Inicio si ese producto ya estaba destacado.
- **Resetear** vuelve a lo último guardado para ese producto. En un alta nueva sigue limpiando la vista previa.
- Un ID inexistente muestra un error y desactiva Guardar; no se interpreta como un alta nueva.
- Se validan nombre y descripción, precio positivo con un máximo de dos decimales y stock entero no negativo.
- Las imágenes aceptadas son PNG, JPG, WebP o GIF de hasta 2 MB. No se puede guardar mientras se lee una imagen. Una lectura anterior al reset o a otra selección no puede reemplazar después la imagen vigente.
- Un error de almacenamiento no se anuncia como guardado exitoso.

La edición pertenece al catálogo administrativo. No se colocaron controles de administración en las tarjetas de compra del catálogo público. El panel sigue siendo una demostración local sin autorización de servidor: debe protegerse en el backend antes de publicarse para uso real.

## 3. Fuente única de productos y precios

Archivo nuevo: `frontend/js/productos.js`. Lo consumen Inicio, catálogo, carrito y administración.

Antes cada pantalla declaraba productos y precios por separado. Ahora se consultan IDs estables como `mochi-fresa` o `ramune-natural`; el nombre comercial o la posición de la tarjeta ya no determinan qué artículo se modifica.

Se tomaron **los precios del catálogo público como referencia** para los productos que ya estaban en ambas páginas:

| Producto | Precio unificado |
| --- | ---: |
| Mochi Matcha | $45.00 |
| Poky/Pocky Fresa | $35.00 |
| Ramune Natural / Original | $85.00 |
| Mochi Fresa | $45.00 |
| Pokys Oreo / Cookies & Cream | $85.00 |

Los productos que solo estaban en Inicio conservaron sus importes: KitKat Sake $62, Ramune Uva $55, Mochi Lychee $45, Pokis Matcha $38 y Ramune Melón $55. Ahora también están disponibles en el catálogo y en el editor: hay 15 productos base, además de las altas locales.

- Los precios escritos en el HTML inicial de Inicio se actualizaron; no es necesario esperar al JavaScript para que coincidan los importes base.
- Las ediciones posteriores se aplican al cargar, volver a la página o recibir un cambio de almacenamiento desde otra pestaña. El rango de precios se amplía si un artículo supera el máximo anterior, para que no desaparezca de la vista inicial; un límite elegido manualmente sigue filtrando.
- El carrito reconoce los productos guardados con el formato anterior, conserva sus cantidades y consulta el precio actual del producto conocido. Ya no conserva un importe contradictorio de otra pantalla.
- Los productos locales con foto propia o sin foto mantienen su ID aunque cambie la imagen.
- Las altas anteriores de `catalogoProductos` siguen disponibles. Se conservan también altas distintas guardadas en `mochimexa_productos`; sus copias de los productos base no vuelven a introducir precios de demostración contradictorios.
- Los productos base sin un inventario definido muestran **Por definir** en el panel. El editor exige establecer un stock válido al guardar. No se inventó un inventario real.
- Stock cero desactiva Agregar y muestra Agotado. La disponibilidad final todavía debe verificarse en un servidor.

### Almacenamiento

| Clave | Uso |
| --- | --- |
| `catalogoProductos` | Altas locales, con ID persistente |
| `mochiProductosEditados` | Cambios guardados por ID, sin modificar las semillas |
| `mochimexa_productos` | Compatibilidad de lectura con altas anteriores del panel |
| `mochiCart` | Productos y cantidades del carrito |
| `usuariosRegistrados`, `usuarioSesion` | Registro y sesión de demostración |
| `mochimexa_pedidos` | Pedidos compartidos con Administración y el perfil |
| `mochiResenas` | Opiniones locales por producto y cuenta |
| `mochimexa_configuracion` | Preferencias locales del administrador |

Estos datos pertenecen a ese navegador y origen. No son una base de datos compartida entre dispositivos.

## 4. Administración: Dashboard, Pedidos y Configuración

Archivos: `frontend/pagesAdmin/homeAdmin.html`, `frontend/jsAdmin/scriptAdmin1.js` y `frontend/cssAdmin/homeAdmin.css`.

### Dashboard restaurado

- Se recuperó **Dashboard** en el menú y como vista inicial al entrar al panel sin un ancla. El logo también dirige a `#dashboard`; un ancla desconocida vuelve a esa sección. Los enlaces directos a otras secciones siguen funcionando.
- Se reutilizó la estructura original: saludo **¡Hola, Admin!**, cuatro tarjetas, gráfica a la izquierda y tabla de pedidos recientes a la derecha. No se sustituyó por otro diseño.
- Las tarjetas consultan los datos locales: importe de pedidos sin cancelados, cantidad pendiente, productos con stock definido y número de clientes. Ya no muestran porcentajes de crecimiento inventados.
- La gráfica usa **Pedidos por estado**, calculados desde la misma lista que la tabla. Las fechas de demostración no permiten calcular una semana real de ventas; por eso no se presentan cifras semanales ficticias.
- Al cambiar un estado, las tarjetas, la gráfica y los pedidos recientes se actualizan después de guardar correctamente.
- Se restauró la dependencia de Chart.js que ya utilizaba el proyecto. Si no se puede cargar desde el CDN, el panel sigue funcionando y muestra los datos de la gráfica en texto.
- **Ajustes Generales** permanece en Configuración. Solo se muestra la sección seleccionada; no se mezcla con Dashboard.

### Color del menú

Todos los botones, incluido **Configuración**, comparten fondo blanco y el mismo color de texto. La opción activa se distingue por el peso del texto y un indicador verde interior, sin cambiar el fondo. El hover verde es común a todas las opciones; no hay un estilo especial para Configuración.

### Pedidos dinámica, como Productos

- Se quitaron las tres filas fijas y el contador ficticio “3 de 45” del HTML. Las filas se generan desde `mochimexa_pedidos` o desde los cuatro pedidos de demostración cuando todavía no hay datos guardados.
- Ahora se muestran **tres pedidos por página**, igual que Productos. Los números se desplazan para acceder a páginas posteriores a la tercera, las flechas respetan los límites y el contador refleja los resultados filtrados.
- Se mantienen las seis columnas, sus estilos, la búsqueda del navbar y el botón Filtrar. Búsqueda y estado se combinan, el filtro conserva su valor al reabrirse y aplicarlo vuelve a la primera página.
- El estado con la flecha y el botón de tres puntos abren la edición del pedido. Son controles accesibles con teclado y tienen etiquetas que identifican el pedido.
- Solo se permiten Pendiente, En camino, Entregado y Cancelado. Se conserva el ID, no se duplican pedidos y no se anuncia éxito si falla el guardado.
- Cancelado tiene su propio estilo gris de la paleta existente; antes terminaba usando el verde de Entregado.
- Exportar descarga todos los pedidos del filtro actual, aunque estén en varias páginas. Si no hay resultados se muestra un aviso y no se descarga un archivo vacío.
- La tabla se refresca al volver a la página y al recibir cambios de otra pestaña, conservando el filtro. Un resultado vacío muestra su mensaje y desactiva las flechas.

Se mantiene la corrección del `</div>` sobrante al terminar Clientes. La revisión de HTML comprueba ahora que las cinco secciones estén dentro del `main`, que sidebar y main compartan su contenedor y que no se dupliquen el menú o Nuevo producto.

### Tamaño y estilo de tablas

- Productos, Pedidos y Clientes comparten superficies blancas, borde suave, radio de 20 px, encabezado beige y espaciado de celdas consistente.
- Los nombres y SKU largos pueden ocupar más de una línea, sin invadir la columna siguiente.
- Productos distribuye su ancho entre siete columnas, incluida Editar. Su tabla tiene un mínimo de 760 px para mantener legibilidad.
- En pantallas pequeñas las tablas tienen desplazamiento horizontal dentro de su contenedor; no necesitan ensanchar todo el panel.
- Configuración usa un ancho máximo de 1200 px y los mismos bordes y radios que las tablas. En pantallas pequeñas sus tarjetas se apilan y los controles de envío pueden pasar a otra línea.
- El menú, buscador, acciones y paginación pueden distribuirse en varias líneas en móvil.

Se conservaron los filtros, la búsqueda, la selección para exportación de productos y la paginación. Los datos de clientes y pedidos continúan siendo datos locales de demostración: no se ha conectado un servicio real de pedidos ni cobros.

## 5. Inicio y Contacto: navbar y separación del contenido

Archivos: `frontend/css/index.css`, `frontend/pages/index.html`, `frontend/css/contactanos.css`, `frontend/pages/contactanos.html` y medición del navbar en `frontend/js/script.js`.

### Fondo al recargar

El fondo verde provenía de `--color-bg-light: #BACAA9` en `index.css`. Se aplicaba antes de que el footer, cargado con `fetch`, introdujera el fondo claro. Se definió el beige `#F9F6EE` desde la carga inicial y para el documento de Inicio. No se ocultó toda la página esperando al JavaScript.

### Espacio del encabezado

Se mantuvo el navbar **fijo en la parte superior**, como estaba, y se reservó su espacio:

- El contenedor existente `#mochiNav` reserva 5 rem mientras carga el componente.
- Después se mide la altura real del navbar y se guarda en `--mochi-navbar-height`. Esta medida sustituye la reserva inicial; ya no se fuerza un mínimo extra si el navbar es más pequeño.
- `ResizeObserver`, los cambios de tamaño y los eventos de apertura/cierre del menú móvil actualizan esa reserva.
- **Inicio:** el margen adicional bajó de 20–32 px a **4 px** (`.25rem`). El banner queda cerca del navbar sin eliminar el espacio que ocupa el menú fijo.
- **Contacto:** se reutiliza la misma medición y se deja **16 px** (`1rem`) antes de la primera sección, con margen para la imagen que mantiene su giro original. Se retiró la suma anterior de padding del body y margin de la sección. También se completó el cierre del contenedor existente, sin agregar ni mover columnas.
- Contacto carga el CSS del navbar desde el `head`, igual que Inicio, para que sus medidas no dependan del estilo que llega con el componente.
- Se eliminó el antiguo padding superior de Inicio para no sumar separaciones arbitrarias.
- El hero conserva sus imágenes, carrusel, overlay, colores y columnas. Tiene un alto mínimo de 480 px y puede crecer si el texto necesita más espacio en móvil.

El navbar sigue **fijo al hacer scroll**, tal como se conservó en la revisión anterior. Las medidas en píxeles indicadas corresponden al tamaño raíz habitual de 16 px; se usan rem para respetar el tamaño de texto del navegador.

## 6. Funciones anteriores que se mantienen

- Enlaces relativos a páginas existentes; categorías y buscadores conectados al catálogo.
- Un solo carrito con agregar, cantidades, eliminar y persistencia.
- Registro y login locales coherentes; validación de campos y contraseñas derivadas con PBKDF2, sin guardar la contraseña original.
- Compartir, marcar la página como favorita local y preparar consultas desde el footer.
- Validación de contacto y control de envíos duplicados al endpoint de Formspree que ya estaba en el proyecto.
- CSV con comillas escapadas y protección contra texto que podría interpretarse como una fórmula.

**Pagar sigue sin cobrar:** ahora abre `resumenPedido.html`. Allí se pueden revisar productos, seleccionar dirección y guardar explícitamente un pedido de prueba sin cobro ni envío, visible en Mi perfil y Administración. Unirse no crea una suscripción automática. Faltan el WhatsApp y correo oficiales, documentos de privacidad y términos, pasarela de pagos y servicio de newsletter. No se inventaron esos destinos.

## 7. Verificación

Desde la raíz del proyecto:

```bash
node --test tests/frontend.test.cjs
python3 tests/verificar_enlaces.py
```

Resultado de esta revisión:

- **79 pruebas de lógica aprobadas.** Incluyen las funciones anteriores, perfil, direcciones, contraseña, resumen, detalle, reseñas, retorno después del login y prevención de pedidos duplicados; además del contador, los ajustes de cantidad, la conservación del foco y la configuración/formulario de pagos de prueba.
- **15 páginas/componentes y 187 referencias locales** sin destinos faltantes.
- Comprobación de las cinco secciones administrativas dentro de `main` y de los contenedores originales del sidebar.
- Sintaxis de todos los JavaScript comprobada y `git diff --check` sin errores.

Las pruebas ejecutan los scripts reales con almacenamiento y elementos mínimos simulados; no controlan un navegador ni envían correos reales. El endpoint de recuperación, Formspree y Chart.js se simulan en las pruebas: se comprueban los datos de la gráfica, no su dibujo real.

**La revisión visual en navegador sigue pendiente:** la herramienta bloqueó la apertura de la URL local por política de seguridad. No se afirma que el aspecto o todos los tamaños de pantalla se hayan comprobado visualmente.

## 8. Revisión manual sugerida

Usar Live Server o ejecutar desde la raíz:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

1. Abrir `http://127.0.0.1:8765/frontend/pages/index.html`, recargar y revisar fondo claro y separación de 4 px antes del hero.
2. Abrir Contacto y revisar su separación pequeña; reducir el ancho en ambas páginas, abrir/cerrar el menú y comprobar que el contenido conserve espacio suficiente. Probar también el scroll.
3. Abrir Iniciar sesión, pulsar “¿Olvidaste tu clave?” y regresar. Mientras no exista servicio, Solicitar enlace debe informar que no envió correos.
4. Abrir `frontend/pagesAdmin/homeAdmin.html` sin ancla: debe aparecer Dashboard con saludo, tarjetas, gráfica y pedidos recientes. Configuración debe abrir únicamente Ajustes Generales y compartir el color de los demás botones.
5. Entrar a Productos → Editar, modificar un precio y guardar. Revisar el mismo producto en Inicio, Catálogo y carrito.
6. Probar Resetear antes y después de guardar, stock cero, campos inválidos y una imagen de más de 2 MB.
7. En Pedidos, pasar a la segunda página, filtrar por estado, buscar y exportar. Cambiar un estado y volver al Dashboard: su resumen debe coincidir. Recargar y comprobar que el cambio permanezca.
8. Revisar las tablas en móvil, sus filtros, la búsqueda, las columnas y la exportación.

Usar cuentas y datos de prueba: la autenticación y la administración todavía necesitan un backend antes de usarse con público real.
