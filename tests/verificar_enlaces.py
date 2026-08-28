"""Revisión estática: enlaces, recursos locales e identidad del HTML (sin navegador)."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Pagina(HTMLParser):
    def __init__(self):
        super().__init__()
        self.referencias = []
        self.ids = set()
        self.duplicados = []
        self.estructura = []
        self.pila = []
        self.padres_secciones = {}
        self.nodos = []

    def handle_starttag(self, tag, attrs):
        atributos = dict(attrs)
        self.nodos.append((tag, atributos, tuple(self.pila)))
        if tag == 'section' and atributos.get('id'):
            self.padres_secciones[atributos['id']] = self.pila[-1] if self.pila else None
        if tag not in {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}:
            self.pila.append(tag)
        for atributo in ("href", "src"):
            if atributo in atributos:
                self.referencias.append((tag, atributo, atributos[atributo], atributos))
        identificador = atributos.get("id")
        if identificador:
            if identificador in self.ids:
                self.duplicados.append(identificador)
            self.ids.add(identificador)
        # Añadir scripts o una hoja ya existente no reestructura el contenido.
        if tag not in ("script", "link"):
            self.estructura.append((tag, atributos.get("class", ""), atributos.get("style", "")))

    def handle_endtag(self, tag):
        # Detecta cierres sobrantes que sacan una sección de su contenedor.
        if tag in self.pila:
            indice = len(self.pila) - 1 - self.pila[::-1].index(tag)
            self.pila = self.pila[:indice]


def leer(path):
    pagina = Pagina()
    pagina.feed(path.read_text())
    return pagina


def verificar(original=None):
    archivos = sorted(ROOT.glob("frontend/pages*/*.html"))
    paginas = {path.resolve(): leer(path) for path in archivos}
    componentes = set().union(*(leer(ROOT / "frontend/pages" / nombre).ids for nombre in
                               ("navbar.html", "footer.html", "despliegueCarrito.html")))
    errores = []
    referencias = 0
    for path, pagina in paginas.items():
        for tag, atributo, valor, atributos in pagina.referencias:
            url = urlsplit(valor)
            if url.scheme or url.netloc:
                continue
            if tag == "a" and valor in ("", "#") and not atributos.get("data-bs-toggle"):
                errores.append(f"{path.name}: enlace vacío sin acción")
            if not url.path:
                if url.fragment and unquote(url.fragment) not in pagina.ids | componentes:
                    errores.append(f"{path.name}: ancla inexistente #{url.fragment}")
                continue
            referencias += 1
            destino = (ROOT / unquote(url.path).lstrip("/") if url.path.startswith("/")
                       else path.parent / unquote(url.path)).resolve()
            if not destino.exists():
                errores.append(f"{path.name}: {atributo}={valor} no existe")
            elif url.fragment and destino in paginas and unquote(url.fragment) not in paginas[destino].ids:
                errores.append(f"{path.name}: ancla #{url.fragment} no existe en {destino.name}")
        if path.name == 'homeAdmin.html':
            for seccion in ('dashboard', 'productos', 'pedidos', 'clientes', 'configuracion'):
                if pagina.padres_secciones.get(seccion) != 'main':
                    errores.append(f'{path.name}: {seccion} debe estar dentro del main administrativo')
            # Restaurar una sección no debe duplicar el menú ni sacar las
            # columnas del mismo row. Se comprueba la estructura real del HTML.
            laterales = [n for n in pagina.nodos if n[0] == 'aside']
            principales = [n for n in pagina.nodos if n[0] == 'main']
            if len(laterales) != 1 or len(principales) != 1 or laterales[0][2] != principales[0][2]:
                errores.append(f'{path.name}: sidebar y main deben compartir su contenedor original')
            for clase in ('botonesMenu', 'botonProducto'):
                bloques = [n for n in pagina.nodos if clase in n[1].get('class', '').split()]
                if len(bloques) != 1 or bloques[0][2][-1:] != ('aside',):
                    errores.append(f'{path.name}: debe existir un solo bloque {clase} dentro del sidebar')
        if pagina.duplicados:
            errores.append(f"{path.name}: IDs duplicados {pagina.duplicados}")
        if path.name in ('perfil.html', 'resumenPedido.html', 'producto.html'):
            for tag, atributos, padres in pagina.nodos:
                if tag == 'form' and 'form' in padres:
                    errores.append(f'{path.name}: formulario anidado')
                if tag == 'button' and atributos.get('type') not in ('button', 'submit', 'reset'):
                    errores.append(f'{path.name}: botón sin tipo explícito')
        if original:
            anterior = original / path.relative_to(ROOT)
            if pagina.estructura != leer(anterior).estructura:
                errores.append(f"{path.name}: cambiaron contenedores, clases o estilos en línea")
    if original:
        estilos = sorted(ROOT.glob("frontend/css*/*.css"))
        for path in estilos:
            if path.read_bytes() != (original / path.relative_to(ROOT)).read_bytes():
                errores.append(f"{path.name}: CSS modificado")
        print(f"Identidad revisada contra la copia inicial: {len(archivos)} HTML y {len(estilos)} CSS.")
    if errores:
        raise SystemExit("\n".join(errores))
    print(f"Correcto: {len(archivos)} páginas/componentes y {referencias} referencias locales sin destinos faltantes.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--original-root", type=Path, help="Copia previa opcional para comparar estructura y estilos")
    verificar(parser.parse_args().original_root)
