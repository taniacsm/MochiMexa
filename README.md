# MochiMexa 🌟

Plataforma de comercio electrónico diseñada para la difusión y venta de productos enfocados en la cultura oriental. Este proyecto proporciona a los comerciantes una infraestructura digital completa para dar el salto al mercado en línea de manera accesible y sin barreras técnicas.

---

## 🚀 Sobre el Proyecto

### Problemática que resuelve
"MochiMexa" busca proveer herramientas web integradas a un modelo de negocio digital para optimizar la exhibición y distribución de productos orientales (como dulces típicos y coleccionables), abriendo canales de venta tanto B2C como B2B.

### Público Objetivo
Público en general interesado en consumir, conocer y distribuir productos de la cultura oriental.

### Identidad Organizacional
* **Misión:** Ofrecer servicios web requeridos a clientes que buscan dar el siguiente paso en la venta en línea, fomentando la creatividad y brindando la mejor atención.
* **Visión:** Hacer que el comercio electrónico sea accesible para cualquier persona, permitiendo que los emprendedores construyan su propio futuro.
* **Valores:** Dedicación, esfuerzo, búsqueda del bien común y crecimiento mutuo profesional.

---

## 💼 Modelo de Negocios

El sitio opera bajo un modelo **Híbrido: Software as a Service (SaaS) + Comisión**. Los ingresos se distribuyen en tres fuentes clave:
1. **Setup (Pago único):** Tarifa inicial por configuración y arranque de la tienda.
2. **SaaS (Suscripción mensual):** Cuota fija que cubre soporte, mantenimiento e infraestructura en la nube.
3. **Take Rate (Comisión por venta):** Un pequeño porcentaje por cada transacción exitosa.

*Nota: Se implementa además un sistema de anuncios (Ads) de baja intrusión para la monetización del tráfico sin conflictos de interés.*

---

## 🛠️ Stack Tecnológico

La plataforma está construida utilizando las siguientes tecnologías:
* **Frontend:** HTML5 (maquetación estructural) y CSS3 (diseño modular con Flexbox, tipografías personalizadas y fondos adaptativos).
* **Lógica del Cliente:** JavaScript nativo para la programación lógica e importación modular de componentes comunes (como el *Navbar* y *Footer*) mediante el uso de la API `fetch`.
* **Herramientas de Diseño y Control:** Figma para el Mockup interactivo y Git/GitHub para el control de versiones.

---

## 🗺️ Arquitectura de la Plataforma (Mapa de Navegación)

El sitio cuenta con una arquitectura jerárquica diseñada para optimizar la experiencia del visitante, compuesta por las siguientes secciones principales:

1. **Página Principal (Home):** Incluye componentes modulares (encabezado y pie de página), un carrusel de próximos eventos y cartas dinámicas de productos destacados.
2. **Lista de Productos / Publicaciones:** Catálogo completo para los sectores minorista y mayorista.
3. **Mi Perfil:** Panel privado del usuario con menú desplegable para:
   * Configuración de la cuenta (edición de registro).
   * Historial de pedidos.
   * Métodos y formas de pago.
4. **Página de Formulario**
5. **Login (Autenticación)**
6. **Acerca de Nosotros**
7. **Contáctenos**

---

## 📈 Metodología y Gestión de Trabajo (Scrum)

El desarrollo del proyecto se gestiona mediante el marco de trabajo **Scrum**, utilizando **Trello** como tablero de seguimiento de tareas y organizando el trabajo en iteraciones estructuradas. 

*Nota: Con el fin de maximizar el aprendizaje técnico y de gestión de todos los integrantes, los roles se trabajan de forma rotativa a lo largo del ciclo del proyecto.*

### 🗓️ Estado de los Sprints
* **Primer Sprint (3 de Julio - 10 de Octubre):** Fase de entregables teóricos, diseño del Mockup en Figma, estructuración en Trello, configuración del repositorio en GitHub, y documentación técnica/planeación.

### 👥 Integrantes del Equipo ("MochiTim")
* **Product Owner:** Maribel Serrano Valdez
* **Scrum Master:** Tania Cristal Serrano Molina
* **Equipo de Desarrollo (Developers & QA):**
  * Andrea Elizabeth Gómez Sánchez (Q&A)
  * Avril Nallely Ponce Mendoza
  * Frida Pilar Luna Barón (Tester)
  * Jorge Santiago Jiménez López
  * Luis Antonio Velázquez Catalán
  * Mario Alberto Valero Mayorga
  * Missael Eduardo Manjarrez Tellez

---

## 🔧 Instalación y Desarrollo Local

Para levantar y explorar el entorno del proyecto de forma local, sigue estos pasos:

```bash
# 1. Clonar el repositorio
git clone [https://github.com/tu-usuario/mochimexa.git](https://github.com/tu-usuario/mochimexa.git)

# 2. Navegar al directorio del proyecto
cd mochimexa

# 3. Puedes abrir el archivo index.html directamente en tu navegador o usar una extensión como Live Server en VS Code.
## Estructura del proyecto
Arquitectura por capas: patrón de diseño donde se organiza el código en capaz horizontales independientes, cada una con una responsabilidad específica.

