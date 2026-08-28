# Resumen de pedido, perfil y detalle de producto

## Qué se creó

Las tres páginas toman la composición de las capturas: fondos crema, tarjetas blancas, bordes suaves, verde de marca, naranja para finalizar y ciruela para comprar. Se reutilizan las imágenes del catálogo, el navbar y el carrito existentes. No se copiaron el marco morado, los títulos del editor ni las etiquetas que rodeaban las capturas.

| Página | Entrada | Archivos principales |
| --- | --- | --- |
| Resumen de pedido | Carrito → Pagar; detalle → Comprar ahora | `frontend/pages/resumenPedido.html`, `frontend/js/resumenPedido.js` |
| Mi perfil | Después del registro/login; menú de cuenta → Mi perfil | `frontend/pages/perfil.html`, `frontend/js/perfil.js` |
| Detalle de producto | Imagen o nombre en Inicio, Catálogo y relacionados | `frontend/pages/producto.html?id=ID`, `frontend/js/producto.js` |

Los estilos nuevos están aislados en `frontend/css/tienda.css`, bajo `.pagina-tienda`. Los datos compartidos viven en `frontend/js/tienda.js`. No se cambiaron los espacios de Inicio y Contacto aprobados en la revisión anterior, ni los contenedores administrativos.

## 1. Resumen de tu pedido

- **Pagar ahora abre esta página.** Entrar al resumen no crea un pedido ni vacía el carrito.
- El resumen carga el **mismo navbar** que Inicio, Catálogo, Perfil y Producto: enlaces, búsqueda, cuenta e icono del carrito. Se reserva su altura real para evitar que tape el contenido, también al desplegar el menú móvil.
- La lista muestra las imágenes, nombres, cantidades e importes del carrito. Los enlaces abren el artículo correspondiente. Cada fila incorpora **− / cantidad / +**: sumar aumenta una unidad, restar disminuye una y restar cuando queda una elimina el producto.
- Se retiró **Editar carrito**. El paso **Carrito** de la cabecera lleva a la lista dentro del resumen; no abre el panel lateral. El icono del navbar conserva su acceso al carrito habitual.
- Las cantidades, el subtotal, el descuento, el envío y el total se recalculan tras cada cambio. Al vaciar el carrito, el envío y el total pasan a cero y Finalizar queda deshabilitado. El botón + respeta el stock conocido y el límite de 999 unidades por artículo.
- Un error de stock o un cupón que deja de cumplir su mínimo no borra las filas: se mantienen los controles para corregir el pedido. El cupón se puede retirar dejando vacío el campo y pulsando Aplicar. El foco del teclado se recupera después de reconstruir una fila.
- Los importes se consultan en la fuente compartida de productos. No se copian los precios ilustrativos de las capturas ni se acepta como precio definitivo un valor antiguo del carrito.
- El total se calcula con centavos enteros para evitar errores de redondeo. Se vuelve a validar al confirmar, incluyendo cantidades, stock conocido, cambios de precio y dirección.
- Se puede seleccionar una dirección del perfil o guardar una nueva aquí. Se valida estado, código postal y datos de dirección. La dirección permanece disponible después en Mi perfil.
- El envío usa las tarifas locales de Configuración: por defecto $80 para Ciudad de México y $150 para el interior. Se presenta como estimación; sin dirección aparece **Por calcular**.
- El formulario de cupón valida códigos configurados, importe mínimo y vigencia. **No hay cupones activos inventados**: `Mochi.config.cupones` está vacío. Se puede retirar un código dejando el campo vacío y pulsando Aplicar.
- Los métodos disponibles cambian su panel de información. Se recuerda únicamente la opción seleccionada durante la sesión de la pestaña, incluso tras recargar. Los valores escritos en los campos no se guardan.

### Contador del carrito en todas las páginas

El icono del navbar muestra la **suma de unidades**, no la cantidad de productos diferentes: dos mochis y un Pocky muestran **3**. El contador se oculta cuando no hay artículos. Su fondo usa el marrón `--badge-brown` ya definido en el diseño y se superpone al icono sin mover los elementos del menú.

Se actualiza al agregar desde Inicio, Catálogo o Producto, al cambiar cantidades o eliminar, al finalizar un pedido, al recargar, al volver con Atrás/Adelante y al recibir cambios desde otra pestaña. La actualización funciona aunque el panel lateral todavía no haya cargado. También se actualizan el nombre accesible del enlace y una región de estado para lectores de pantalla.

### Modificar los métodos de pago

En **Administración → Configuración → Métodos de Pago**, los interruptores de Tarjeta, SPEI, OXXO y PayPal determinan qué opciones ofrece el resumen. PayPal se añadió dentro del grupo existente; no se movieron las columnas de ajustes ni se alteró el Dashboard.

Los valores guardados anteriormente se conservan. Sin una configuración previa, Tarjeta, PayPal y SPEI están activos; OXXO conserva el valor desactivado que tenía Administración. Para ofrecer OXXO, activar su interruptor y guardar los ajustes. No se configura un proveedor de cobro ni se almacenan claves privadas.

Si se desactiva el método elegido mientras el resumen está abierto, se informa y se selecciona una opción disponible. Si todos se desactivan, se muestra un aviso y se bloquea Finalizar. El servicio vuelve a validar el método al confirmar: modificar el DOM o recibir tarde el evento de otra pestaña no permite registrar una opción desactivada.

### Pago y confirmación: límites explícitos

**No existe una pasarela conectada en este proyecto.** La pantalla identifica el flujo como una prueba local y exige aceptar que no habrá cobro ni envío. Ahora el formulario de tarjeta **sí se puede editar**, usando exclusivamente datos ficticios:

- Número permitido: **4242 4242 4242 4242**; CVC permitido: **123**. Son valores de la demostración local, no una conexión con el entorno de pruebas de un proveedor.
- Vencimiento con formato MM/AA y nombre ficticio de al menos dos caracteres. Se valida el formato; no se consulta ni verifica una tarjeta.
- **Restablecer datos de prueba** recupera los valores iniciales. Al cambiar a otro método se desactiva la validación de los campos de tarjeta ocultos; al regresar se conserva la edición dentro de esa visita.
- Los campos no tienen atributo `name`, no se serializan en el pedido y no se escriben en LocalStorage ni SessionStorage. Su contenido solo se comprueba en memoria; al salir de la página, cambiar de cuenta o confirmar, se restablecen los valores ficticios.

Para cobrar de verdad, esos campos deberán sustituirse por los campos seguros del proveedor y el cobro deberá verificarse desde un backend. No se generan referencias OXXO, instrucciones SPEI ni una redirección a PayPal en esta demostración.

**Finalizar pedido de prueba** guarda un pedido local con estado Pendiente, `estadoPago: "Sin cobrar"` y `modo: "demostracion"`. Después se muestra su referencia, se vacía el carrito y se ofrecen enlaces a Mis pedidos y al catálogo. Es necesario iniciar sesión antes de finalizar.

Se conserva un identificador de intento para evitar duplicados por doble clic o por reintentar cuando falla el almacenamiento. Si el pedido se guardó pero no se pudo vaciar el carrito, se informa de ambas cosas. Tras completar correctamente un pedido, se puede iniciar otro idéntico como una operación nueva.

Los pedidos usan la misma clave que Administración. Sus cuatro ejemplos previos se conservan; nunca se asignan a una cuenta del usuario. Cambiar el estado en Administración se refleja en Mis pedidos. No se descuentan existencias reales ni se promete un envío desde esta demostración.

## 2. Mi perfil

- La información empieza **oculta** y solo se muestra cuando existe una cuenta correspondiente a la sesión. Acceder directamente sin sesión lleva a Iniciar sesión.
- El menú de cuenta muestra **Mi perfil / Cerrar sesión** solamente con sesión válida. Como visitante muestra **Iniciar sesión / Registrarse**.
- Se puede editar nombre, correo y teléfono. Se rechazan correos duplicados y teléfonos que no tengan diez dígitos.
- Cambiar foto admite PNG, JPG o WebP de hasta 2 MB. Primero muestra una vista previa; **Guardar cambios** la conserva. **Quitar foto** también necesita guardar para persistir.
- Una lectura de imagen anterior no reemplaza una elección posterior. Si el almacenamiento falla, no se anuncia un guardado exitoso.
- Mis direcciones permite agregar, editar y eliminar. Se mantiene una dirección principal y se puede elegir otra al editarla. Al eliminar la principal se asigna otra si queda alguna.
- Mis pedidos muestra únicamente los registros asociados al ID de la cuenta. Los detalles se expanden para ver artículos, cantidades, envío y método de prueba. **Ver todos** amplía los tres recientes cuando hay más.
- Configuración permite cambiar la contraseña comprobando la actual y cerrar sesión. Se conserva la derivación PBKDF2; la contraseña original no se guarda en texto.

### Identidad y acceso

Cada cuenta tiene un ID estable. Las cuentas anteriores reciben uno al volver a iniciar sesión o abrir el perfil. Así se pueden cambiar nombre y correo sin perder direcciones, pedidos o reseñas.

Se revalida la sesión al guardar, al volver con Atrás y al recibir cambios de otra pestaña. Si cambia la cuenta, se oculta el contenido antes de redirigir. Los enlaces de regreso desde login solo admiten páginas propias permitidas, evitando redirecciones externas.

**Esto no es autorización de servidor.** LocalStorage puede inspeccionarse o modificarse desde el navegador. Antes de usar datos reales, las cuentas, direcciones, fotos y permisos deben migrar a una API autenticada. Por ahora se deben usar datos de prueba.

## 3. Detalle de producto y reseñas

- Una sola plantilla carga el artículo por `?id=...`: nombre, descripción, foto, categoría, precio y stock provienen del catálogo compartido.
- El nombre y la imagen de las diez tarjetas de Inicio, y de todas las tarjetas de Catálogo, dirigen al ID correcto. Los botones de agregar conservan su función.
- La imagen se puede ampliar en un diálogo. La galería muestra solo fotos del artículo real; no se usan imágenes de otros sabores como supuestos ángulos del mismo producto. Los datos admiten imágenes adicionales si se incorporan después.
- El selector de cantidad respeta stock conocido y el límite de 999 unidades. **Comprar ahora** agrega esa cantidad y abre el resumen; **Agregar al carrito y seguir viendo** permite permanecer en el detalle.
- Los relacionados priorizan la misma categoría, excluyen el artículo actual y tienen navegación con flechas y enlaces individuales.
- Un ID inexistente muestra un estado claro y un enlace al catálogo. Un producto agotado no se puede comprar.
- Las reseñas comienzan vacías. No se copiaron los nombres, comentarios, promedio ni las 124 reseñas ilustrativas de la captura.
- Para escribir se requiere sesión. Se valida una calificación de 1 a 5 y un comentario de 10 a 1000 caracteres. Cada cuenta tiene una reseña por producto y puede editarla o eliminarla sin afectar las de otra cuenta.
- La media y la cantidad se calculan desde las opiniones locales. Los textos se escapan al renderizarlos y no se muestran como compras verificadas.

## 4. Adaptación a pantallas

En escritorio se mantienen las composiciones de las referencias: compra en dos columnas; perfil con lateral y tarjetas; producto con galería, información, relacionados y reseñas. En móvil se apilan las columnas y los campos; el menú del perfil pasa a una cuadrícula y las tarjetas reducen sus columnas.

Se usan anchos flexibles, `minmax(0, 1fr)`, límites de imagen y diálogos con desplazamiento vertical. Los botones tienen tipo explícito, nombres accesibles, foco visible y estados deshabilitados. Los mensajes de resultado usan regiones de estado. El navbar de las nuevas páginas reserva su altura real, incluyendo el menú móvil.

**La adaptación está implementada en CSS, pero la revisión visual en navegador está pendiente:** la herramienta bloqueó la URL local por política de seguridad. No se afirma haber comprobado capturas del resultado o todos los tamaños de pantalla.

## 5. Almacenamiento y archivos compartidos

| Clave | Contenido |
| --- | --- |
| `usuariosRegistrados` | Cuenta, ID, credencial derivada, foto y direcciones |
| `usuarioSesion` | Identidad de la sesión, sin contraseña ni hash |
| `mochiCart` | Artículos y cantidades del carrito |
| `mochimexa_pedidos` | Pedidos del panel y pedidos de prueba asociados a cada cuenta |
| `mochiResenas` | Reseñas por producto y cuenta |
| `mochiIntentoPedido` en SessionStorage | Intento del resumen para evitar duplicados al reintentar |
| `mochiMetodoPago` en SessionStorage | Solo el identificador del método seleccionado, sin datos de tarjeta |
| `mochimexa_configuracion` | Tarifas de envío y métodos habilitados desde Administración |

También se ajustaron `mochi.js`, `script.js`, `catalogo.js`, `registroUsu.js`, `inicioSesion1.js`, las tarjetas de `index.html` y la lectura de pedidos del panel. Los comentarios explican por qué se comparten IDs, se recalculan precios y se limita el formulario a datos ficticios.

En la revisión del resumen se modificaron estos archivos:

| Archivos | Cambio y motivo |
| --- | --- |
| `frontend/pages/resumenPedido.html` | Navbar compartido, eliminación de Editar carrito, mensajes de cantidades y campos de demostración editables |
| `frontend/js/resumenPedido.js` | Filas con +/−, recálculo, conservación del foco, selección de método y validación en memoria |
| `frontend/pages/navbar.html`, `frontend/css/navbar.css` | Insignia y anuncio accesible sin redistribuir el navbar |
| `frontend/js/script.js` | Contador de unidades sincronizado con el carrito; recarga al volver con Atrás |
| `frontend/css/tienda.css` | Controles de cantidad dentro de las filas originales y margen de desplazamiento bajo el navbar |
| `frontend/js/tienda.js` | Lectura común de métodos disponibles y comprobación al crear el pedido |
| `frontend/pagesAdmin/homeAdmin.html`, `frontend/jsAdmin/scriptAdmin1.js` | Interruptor PayPal y vínculo de los cuatro métodos con el resumen |
| `tests/frontend.test.cjs` | Casos de contador, edición de cantidades, stock/cupón, foco, configuración y formulario de prueba |

## 6. Verificación y recorrido manual

```bash
node --test tests/frontend.test.cjs
python3 tests/verificar_enlaces.py
```

Resultado: **79 pruebas aprobadas**, **15 páginas/componentes y 187 referencias locales válidas**, sintaxis JavaScript correcta y `git diff --check` sin errores. Las pruebas ejecutan los scripts reales con elementos y almacenamiento simulados; no son pruebas visuales ni pagos reales.

Para revisar con Live Server o un servidor local:

1. Registrarse con datos de prueba. Debe abrir Mi perfil; editar datos y foto, guardar y recargar.
2. Agregar dos direcciones, cambiar la principal, editar y eliminar una.
3. Abrir un producto desde Inicio y luego desde Catálogo. Comparar precio, ampliar la foto y recorrer relacionados.
4. Escribir una reseña, editarla y comprobarla después de recargar. Cerrar sesión y comprobar que escribirla exige acceso.
5. Agregar dos unidades de un producto y una de otro: el contador debe mostrar 3. Pulsar Pagar y comprobar el mismo navbar. Usar +/− en el resumen; comprobar importes, quitar la última unidad y volver a agregar. No debe abrirse el panel al ajustar las filas.
6. Seleccionar dirección, editar los campos ficticios de tarjeta, probar Restablecer y cambiar de método. Recargar: debe recordarse el método, pero no los campos editados. Confirmar y revisar el pedido en Mi perfil y Administración; el contador debe vaciarse.
7. Cambiar su estado en Administración y recargar Mi perfil. Probar una segunda cuenta: no debe mostrar pedidos de la primera.
8. Revisar las tres páginas en móvil y escritorio, abrir/cerrar el menú, probar campos inválidos y el carrito vacío.
9. En Configuración activar OXXO o desactivar un método, guardar y revisar el resumen en otra pestaña. Desactivar todos debe impedir finalizar, sin borrar artículos. Rehabilitar al menos uno antes de seguir probando.

No se ejecutaron `git add`, commits, push ni despliegues. Los cambios previos del proyecto se conservaron.
