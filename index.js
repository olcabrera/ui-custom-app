
const versions_file = "/var/environment/custom_app_manager/custom_apps/versions.txt"
const active_file = "/var/environment/custom_app_manager/conf/custom_app_active.json";


function loadVersionsFile() {
    alert("Refreshing Custom apps...");
    cockpit.file(versions_file).read()
      .then(content => {
        console.log("Contenido leído desde archivo:", content);
        processFile(content);
        alert("Custom Apps recharged succesfully.");
      })
      
      .catch(error => {
        console.error("Error al leer archivo:", error);
        alert("Error while refreshing custom apps.");
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

    estadoActual.forEach(entry => {
        const [nombre, version] = entry.split(":");
        if (!apps[nombre]) {
          apps[nombre] = [version];
        } else if (!apps[nombre].includes(version)) {
          apps[nombre].push(version);
        }
      });

    renderizarAplicaciones(apps);
}

function loadActiveApps() {
    return cockpit.file(active_file).read()
      .then(content => {
        estadoActual = JSON.parse(content);
        console.log("Estado actual cargado:", estadoActual);
      })
      .catch(err => {
        console.error("No se pudo cargar el estado actual:", err);
        estadoActual = [];
      });
  }
  
  

function renderizarAplicaciones(apps) {
    console.log("Renderizando apps:", apps);
    const contenedor = document.getElementById('app-lista');
    contenedor.innerHTML = '';
  
    Object.entries(apps).forEach(([nombre, versiones]) => {
      const item = document.createElement('div');
      item.className = 'item';
      item.style.marginBottom = '15px';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '12px';

      const switchWrapper = document.createElement('label');
      switchWrapper.className = 'label-switch';
  
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `chk-${nombre}`;

      const slider = document.createElement('span');
      slider.className = 'slider';

      switchWrapper.appendChild(checkbox);
      switchWrapper.appendChild(slider);
  

      const appLabel = document.createElement('label');
      appLabel.textContent = nombre;
      appLabel.style.marginRight = '20px';
      appLabel.style.fontSize = '15px';
      appLabel.className = 'app-name';

      

      const select = document.createElement('select');
      select.className = 'dropdown';

      let appActiva = null;
      versiones.forEach(version => {
        const clave = `${nombre}:${version}`;
        if (estadoActual.includes(clave)) {
            appActiva = version;
        }
      });


    //   versiones.forEach(version => {
    //     const clave = `${nombre}:${version}`;
    //     if (estadoActual.includes(clave)) {
    //       appActiva = version;
    //     }
    //   });

      checkbox.checked = !!appActiva;
  
      versiones.forEach(version => {
        const option = document.createElement('option');
        option.value = version;
        option.textContent = version;
        if (version === appActiva) {
            option.selected = true;
          }
        select.appendChild(option);
      });
  
      item.appendChild(switchWrapper);
      item.appendChild(appLabel);
      item.appendChild(select);
      contenedor.appendChild(item);
    });
  }


function downloadConfig() {
  alert("Downloading config file...");

  cockpit.spawn(["curl", "-X", "POST", "http://localhost:8005/download-zip-config"])
    .done(function (output) {
      console.log("Response:", output);
      alert("Config file uploaded successfully");
    })
    .fail(function (error) {
      console.error("Error downloading config file:", error);
      alert("Error in downloading config file");
    });
}

function uploadConfig() {
  alert("Uploading config file");

  cockpit.spawn(["curl", "-X", "POST", "http://localhost:8005/run-zip-upload"])
    .done(function (output) {
      console.log("Response:", output);
      alert("Config file uploaded successfully");
    })
    .fail(function (error) {
      console.error("Error uploading config file:", error);
      alert("Error uploading config file");
    });

}
  
  

// window.addEventListener('DOMContentLoaded', loadVersionsFile);
window.addEventListener('DOMContentLoaded', () => {
    loadActiveApps().then(loadVersionsFile);
    document.getElementById('refresh-button').addEventListener('click', loadVersionsFile);
    document.getElementById("download-button").addEventListener("click", downloadConfig);
    document.getElementById("upload-button").addEventListener("click", uploadConfig);
  });
