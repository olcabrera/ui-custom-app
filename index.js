
const versions_file = "/var/environment/custom_app_manager/custom_apps/versions.txt"
const active_file = "/var/environment/custom_app_manager/conf/custom_app_active.json";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadVersionsFile() {
    // alert("Refreshing Custom apps...");
    
    var table_apps= document.getElementById('table-apps');
    var loader= document.getElementById('loader-1')
    var btn_submit= document.getElementById('apply-button')

    
    table_apps.classList.remove("visible");
    table_apps.classList.add("invisible");
    btn_submit.classList.remove("visible-hidden");
    btn_submit.classList.add("invisible-hidden");
    loader.classList.add("visible");
    loader.classList.remove("invisible");
    
    await sleep(1500)
    
    cockpit.file(versions_file).read()
      .then(content => {
        //content='692a2da45cd861c67a54cde1d0ae00be  ./storeops-custom-application/storeops-custom-application:v2.0.3-beta.21'
        console.log("Contenido leído desde archivo:", content);
        processFile(content);
        alert("Custom Apps recharged succesfully.");
      })
      
      .catch(error => {
        console.error("Error al leer archivo:", error);
        alert("Error while refreshing custom apps.");
      });

      table_apps.classList.remove("invisible");
      table_apps.classList.add("visible");
      btn_submit.classList.remove("invisible-hidden");
      btn_submit.classList.add("visible-hidden");
      loader.classList.remove("visible");
      loader.classList.add("invisible");
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
  
  const container = document.getElementById("app-lista");
  container.innerHTML= ''
  var elements_html=''
  Object.entries(apps).forEach(([nombre, versiones]) => { 

    let appActiva = null;
    versiones.forEach(version => {
     const clave = `${nombre}:${version}`;
     if (estadoActual.includes(clave)) {
          appActiva = version;
               
      }
    });
    if(appActiva!=null){
      elements_html+="<tr><td><input class='input-s' type='checkbox' id='chk-"+nombre+"' checked/>" 
    }
    else{
      elements_html+="<tr><td><input class='input-s' type='checkbox' id='chk-"+nombre+"'/>"      
    }

    
    elements_html+="<label class='label' for='chk-"+nombre+"'></label></td>"

    elements_html+="<td><h3 class='label-switch'>"+nombre+"</h3></td>"

    elements_html+="<td><select class='dropdown' id='ddl-"+nombre+"'>"
                                                                
  
    versiones.forEach(version => {
      if (version === appActiva) {
        elements_html+="<option value='"+version+"' selected>"+version+"</option>"
      }
      else{
        elements_html+="<option value='"+version+"'>"+version+"</option>"
      }
    });

    elements_html+="</select></td></tr>"

    });

    container.innerHTML= elements_html
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
  
function getlistCustomApps(){
  clearlistCustomApps()
  var topic_message= "command/cockpit_ui/custom_manager";
  var mqttMessage = new Paho.MQTT.Message('{"uuid": 1, "command_id": "get_custom_app_manager_status", "destination": "", "version": "1.0", "data": []}');
  mqttMessage.destinationName = topic_message;
  mqttClient.send(mqttMessage);
}


function printStatusApps(payload){
  var container_apps= document.getElementById('app-list-result');
  
  var custom_app= payload["data"][0]["value"].toString().replace("checkpt/","")
  var version_app= payload["data"][1]["value"].toString()
  var status_app= payload["data"][2]["value"].toString()
  var memory= ((parseFloat(payload["data"][3]["value"][0].toString()))/1000000).toFixed(2)
  var cpu= parseFloat(payload["data"][4]["value"].toString()).toFixed(2)
    
  const tbodyRef = document.getElementById('table-custom-apps').getElementsByTagName('tbody')[0];
  const newRow = tbodyRef.insertRow();
  for(a=1; a<=5; a++){

    var textInCell=""
    if(a==1){textInCell=custom_app}
    else if(a==2){textInCell= version_app}
    else if(a==3){textInCell= status_app}
    else if(a==4){textInCell= cpu}
    else if(a==5){textInCell= memory}

    const newCell = newRow.insertCell();
    const cellText = document.createTextNode(textInCell);
    newCell.appendChild(cellText);
  }

  
  container_apps.classList.remove("invisible");
  container_apps.classList.add("visible");

}

function clearlistCustomApps(){
  var container_apps= document.getElementById('app-list-result');
  
  $("#body-custom-apps tr").remove();
  container_apps.classList.remove("visible");
  container_apps.classList.add("invisible"); 
}

function setSaveApplicattions(){
  var topic_message= "command/cockpit_ui/custom_manager";
  var message='{"uuid": 1, "command_id": "set_custom_app_manager_app", "destination": "", "version": "1.0", "data": [{"key": "action", "type": "string", "value": ["set"]}, {"key": "custom_app", "type": "json", "value":['
  var cont_custom_apps=0

  $('#app-lista input,select').each(function () {
    var id_item= this.id
    var name_app= id_item.replace('chk-','')
    if(id_item.includes('chk-')){
      if($(this).is(':checked')){
        var version_app= document.getElementById('ddl-'+name_app).value
        if(cont_custom_apps==0){
          message+='{"name":"'+name_app+'","version":"'+version_app+'"}'
        }
        else{
          message+=',{"name":"'+name_app+'","version":"'+version_app+'"}'
        }
        cont_custom_apps++;
      }
    }
  
    
  })
 
  message+=']}]}'
  alert(message)
  var mqttMessage = new Paho.MQTT.Message(message);
  mqttMessage.destinationName = topic_message;
  mqttClient.send(mqttMessage);
  alert('Apps updated')
  
}



window.addEventListener('DOMContentLoaded', () => {
    loadActiveApps().then(loadVersionsFile);
    connectMQTT()
    document.getElementById('refresh-button').addEventListener('click', loadVersionsFile);
    document.getElementById("download-button").addEventListener("click", downloadConfig);
    document.getElementById("upload-button").addEventListener("click", uploadConfig);
    document.getElementById("list-apps-button").addEventListener("click", getlistCustomApps);
    document.getElementById("clear-apps-button").addEventListener("click", clearlistCustomApps);
    document.getElementById("apply-button").addEventListener("click", setSaveApplicattions);
});


//window.setInterval(getlistCustomApps, 6000)