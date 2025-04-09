
const versions_file = "/var/environment/custom_app_manager/custom_apps/versions.txt"

// function cargarAplicaciones() {
//     console.log("Iniciando carga...");
//     fetch('/usr/share/cockpit/ui-custom-app/versions.txt')
//         .then(response => {
//             if (!response.ok) {
//             console.error("Error al cargar archivo:", response.status);
//             return;
//             }
//             return response.text();
//         })
//        //   .then(response => response.text())
//       .then(texto => {
//         const lineas = texto.trim().split('\n');
//         const apps = {};
  
//         lineas.forEach(linea => {
//           const parts = linea.trim().split(/\s+/);
//           if (parts.length < 2) return;
  
//           const rutaCompleta = parts[1];
//           const match = rutaCompleta.match(/\/([^\/:]+):(.+)$/);
//           if (!match) return;
  
//           const nombre = match[1];
//           const version = match[2];
  
//           if (!apps[nombre]) {
//             apps[nombre] = new Set();
//           }
//           apps[nombre].add(version);
//         });
  
//         renderizarAplicaciones(apps);
//       })
//       .catch(error => {
//         console.error('Error al cargar apps:', error);
//         document.getElementById('app-lista').innerHTML = '<p>Error al obtener datos.</p>';
//       });
//   }

function loadVersionsFile() {
    cockpit.file(versions_file).read()
      .then(content => {
        console.log("Contenido leído desde archivo:", content);
        processFile(content);
      })
      .catch(error => {
        console.error("Error al leer archivo:", error);
      });
  }
  
function processFile(texto) {
    const lineas = texto.trim().split('\n');
    const apps = {};

    lineas.forEach(linea => {
        const match = linea.match(/\/([^\/:]+):(.+)$/);
        if (!match) return;

        const nombre = match[1];
        const version = match[2];

        if (!apps[nombre]) apps[nombre] = [];
        apps[nombre].push(version);
    });

    renderizarAplicaciones(apps);
}
  
function renderizarAplicaciones(apps) {
    const contenedor = document.getElementById('app-lista');
    contenedor.innerHTML = '';

    Object.entries(apps).forEach(([nombre, versiones]) => {
        const item = document.createElement('div');
        item.className = 'item';
        item.style.marginBottom = '15px';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '10px';

        const switchWrapper = document.createElement('label');
        switchWrapper.className = 'pf-c-switch';
        switchWrapper.setAttribute('for', `chk-${nombre}`);

        // const checkbox = document.createElement('input');
        // checkbox.type = 'checkbox';
        // checkbox.className = 'pf-c-switch__input';
        // checkbox.id = `chk-${nombre}`;

        const toggle = document.createElement('span');
        toggle.className = 'pf-c-switch__toggle';

        switchWrapper.appendChild(checkbox);
        switchWrapper.appendChild(toggle); 

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'toggle';
        checkbox.id = `chk-${nombre}`;

        // Label-switch
        const appLabel = document.createElement('label');
        appLabel.textContent = nombre;
        appLabel.className = 'label-switch';

        // Label
        const label = document.createElement('label');
        label.setAttribute('for', checkbox.id);
        label.textContent = nombre;
        label.style.marginLeft = '10px';
        label.style.marginRight = '15px';

        // Dropdown
        const select = document.createElement('select');
        select.className = 'dropdown';

        Array.from(versiones).forEach(v => {
        const option = document.createElement('option');
        option.value = v;
        option.textContent = v;
        select.appendChild(option);
        });

        item.appendChild(checkbox);
        item.appendChild(label);
        item.appendChild(select);
        contenedor.appendChild(item);
    });
}

function guardarSeleccion() {
    const items = document.querySelectorAll('#app-lista .item');
    const seleccion = [];

    items.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const label = item.querySelector('label').textContent;
        const select = item.querySelector('select');

        if (checkbox.checked) {
        seleccion.push({
            app: label,
            version: select.value
        });
    }
});

console.log('Apps seleccionadas:', seleccion);

// Aquí podrías enviar los datos a tu backend si deseas
fetch('/guardar-seleccion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seleccion)
})
.then(res => res.json())
.then(resp => alert('Selección guardada con éxito'))
.catch(err => console.error('Error al guardar:', err));
}

// Cargar automáticamente al iniciar
window.addEventListener('DOMContentLoaded', loadVersionsFile);

document.getElementById('refresh-button').addEventListener('click', loadVersionsFile);
