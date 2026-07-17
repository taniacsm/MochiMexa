# MochiMexa

## Estructura del proyecto
Arquitectura por capas: patrón de diseño donde se organiza el código en capaz horizontales independientes, cada una con una responsabilidad específica.

MochiMexa/
    |-backend/
        |-src/
            |-main/java/com/mochimexa/
                |-config/
                    Aquí va la configuración global de spring
                |-controllers/
                    Recibe peticiones HTTP del frontend
                |-models/
                    Aquí van las clases que representan los datos
                |-repositories/
                    Este es el puente entre Java y la base de datos
                |-services/
                    Aquí va la lógica de negocio
        |-resources/
            Aquí la configuración de la BD
    |-frontend/
        |-pages/
        |-css/
        |-js/
        |-assets/
            -imagenes
            -videos
    |-docs/