
const versions_file = "/var/environment/custom_app_manager/custom_apps/versions.txt"
const active_file = "/var/environment/custom_app_manager/conf/custom_app_selected.json";
custom_apps_download=[]
custom_apps_status=[]

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
        // alert("Custom Apps recharged succesfully.");
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


function loadActiveAppsAndRefresh() {
  return cockpit.file(active_file).read()
    .then(content => {
      estadoActual = JSON.parse(content);
      console.log("Estado actual cargado:", estadoActual);
      loadVersionsFile()
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


  async function downloadConfig() {
    const downloadButton = document.getElementById('download-button');
  
    downloadButton.disabled = true;
    downloadButton.innerText = "Creando ZIP...";
  
    try {
      await cockpit.spawn(["bash", "-c", `
        cd /var/environment && \
        zip -r /var/tmp/environment.zip . -x "custom_app_manager/conf/custom_app_active.json" && \
        chmod 644 /var/tmp/environment.zip
      `], { superuser: "try" });
  
      console.log("Zip created");
  
      const file = cockpit.file("/var/tmp/environment.zip", { superuser: "try", binary: true });
      const fileContent = await file.read();
  
      const uint8Array = new Uint8Array(fileContent);
  
      const blob = new Blob([uint8Array], { type: "application/zip" });
      saveAs(blob, "environment.zip");
  
      await cockpit.spawn(['rm', '-f', '/var/tmp/environment.zip'], { superuser: "try" });
  
      console.log("Zip downloaded");
  
      //cockpit.spawn(["rm", "-f", "/var/tmp/environment.zip"], { superuser: "try" });
      console.log("Deleted zip in tmp directory");
  
      downloadButton.innerText = "Download";
      downloadButton.disabled = false;
  
    } catch (error) {
      console.error("Error in downloading zip file:", error);
      alert("Error in downloading zip file");
      downloadButton.innerText = "Download";
      downloadButton.disabled = false;
    }
  }

  async function uploadZIP(event) {
    const file = event.target.files[0];
    if (!file) {
      alert('Select a zip config file.');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const remoteFile = cockpit.file('/var/tmp/uploaded_environment.zip', { superuser: 'try', binary: true });
      await remoteFile.replace(uint8Array);
      console.log('Config file zip charged.');

      await cockpit.spawn(['unzip', '-o', '/var/tmp/uploaded_environment.zip', '-d', '/var/environment'], { 
        superuser: 'try', 
        err: 'message',
        output: (line) => console.log('unzip output:', line) });
      console.log('unzipped file on /var/environment.');

      await cockpit.spawn(['rm', '-f', '/var/tmp/uploaded_environment.zip'], { superuser: 'try' });
      console.log('zip file deleted');
      alert('Config file uploaded successfully')
 
      var topic_message= "command/request/custom/custom-app-manager/refresh-environment";
      var mqttMessage = new Paho.MQTT.Message('{}');
      mqttMessage.destinationName = topic_message;
      mqttClient.send(mqttMessage);
      console.log("mqtt restar sended")
      loadActiveAppsAndRefresh()

    } catch (error) {
      console.error('Error while charging config file zip: ', error);
      alert('Error while charging config file zip.');
    }
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
  var data= payload["data"]
  if(data!=null){
    var custom_app= payload["data"][0]["value"].toString().replace("checkpt/","")
    var version_app= payload["data"][1]["value"].toString()
    var status_app= payload["data"][2]["value"].toString()
    var memory= ((parseFloat(payload["data"][3]["value"][0].toString()))/1000000).toFixed(2)
    var cpu= parseFloat(payload["data"][4]["value"].toString()).toFixed(2)
    
    if(!custom_apps_status.includes(custom_app)){
      custom_apps_status.push(custom_app)
      
      const tbodyRef = document.getElementById('table-custom-apps').getElementsByTagName('tbody')[0];
      const newRow = tbodyRef.insertRow();


      
      for(a=1; a<=5; a++){

        var textInCell=""
        if(a==1){textInCell=custom_app}
        else if(a==2){textInCell= version_app}
        else if(a==3){textInCell= status_app}
        else if(a==4){textInCell= cpu}
        else if(a==5){textInCell= memory}

        var new_row= "<td id='status-name-"+custom_app+"'>"+custom_app+"</td>"
        new_row+= "<td id='status-version-"+custom_app+"'>"+version_app+"</td>"
        new_row+= "<td id='status-status-"+custom_app+"'>"+status_app+"</td>"
        new_row+= "<td id='status-cpu-"+custom_app+"'>"+cpu+"</td>"
        new_row+= "<td id='status-memory-"+custom_app+"'>"+memory+"</td>"
        newRow.innerHTML = new_row;
        
      }
    }
    else{
      var status_name_app= document.getElementById("status-name-"+custom_app+"")
      var status_version_app= document.getElementById("status-version-"+custom_app+"")
      var status_status_app= document.getElementById("status-status-"+custom_app+"")
      var status_cpu_app= document.getElementById("status-cpu-"+custom_app+"")
      var status_memory_app= document.getElementById("status-memory-"+custom_app+"")
      


      status_name_app.innerText= custom_app
      status_version_app.innerText= version_app
      status_status_app.innerText= status_app
      status_cpu_app.innerText= cpu
      status_memory_app.innerText= memory

    }

    
    container_apps.classList.remove("invisible");
    container_apps.classList.add("visible");
  
  }
}

function clearlistCustomApps(){
  custom_apps_status= []
  var container_apps= document.getElementById('app-list-result');
  
  $("#body-custom-apps tr").remove();
  container_apps.classList.remove("visible");
  container_apps.classList.add("invisible"); 
}

function setSaveApplicattions(){
  
  var container_dowload= document.getElementById('download-loader');
  var error_message_ui= document.getElementById('error-message-ui');
  var table_dowload= document.getElementById('table-download-apps');
  
  
  table_dowload.classList.add("invisible")
  error_message_ui.classList.add("invisible")
  container_dowload.classList.remove("invisible")
  $("#body-download-apps tr").remove();
  custom_apps_download= []

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


function printStatusDownload(payload){
  var container_dowload= document.getElementById('download-loader');
  var table_dowload= document.getElementById('table-download-apps');
  var error_message_ui= document.getElementById('error-message-ui');

  container_dowload.classList.add("invisible")
  table_dowload.classList.remove("invisible")
  error_message_ui.classList.add("invisible")

  var custom_app= payload["custom_app"]
  var version_app= payload["version"]
  var percent= parseInt(payload["percent"])
  var status= payload["status"]

  if(!custom_apps_download.includes(custom_app)){
    custom_apps_download.push(custom_app)

    const tbodyRef = document.getElementById('table-download-apps').getElementsByTagName('tbody')[0];
    const newRow = tbodyRef.insertRow();
    var new_row= ""
    if(percent>0){
      new_row+="<td>"+custom_app+"</td><td>"+version_app+"</td><td class='cell-progress'><progress class='progress-bar' id='progress-"+custom_app+"' value='"+percent+"' max='100'></progress><h5 class='progress-title' id='progress-title-"+custom_app+"'>"+percent+" %</h5></td>";
    }
    else{
      new_row+="<td>"+custom_app+"</td><td>"+version_app+"</td><td class='cell-progress'><progress class='progress-bar invisible' id='progress-"+custom_app+"' value='"+percent+"' max='100'></progress><h5 class='progress-title progress-title-error' id='progress-title-"+custom_app+"'>"+status+"</h5></td>";
    }
    
    
    newRow.innerHTML = new_row 
  }
  else{
    var progress_custom_app= document.getElementById("progress-"+custom_app+"")
    var progress_title_app= document.getElementById("progress-title-"+custom_app+"")

    if(percent>0){
      progress_custom_app.value= percent
      progress_title_app.innerText= percent+ "%"
      progress_custom_app.classList.remove("invisible")
      progress_title_app.classList.remove("progress-title-error")
    }
    else{
      progress_custom_app.classList.add("invisible")
      progress_title_app.classList.add("progress-title-error")
      progress_title_app.innerText= status +", trying later"
    }
  }
}


function printBackEndError(payload){
  var error = payload["error"]
  
  var container_dowload= document.getElementById('download-loader');
  var table_dowload= document.getElementById('table-download-apps');
  var error_message_ui= document.getElementById('error-message-ui');
  var back_end_error= document.getElementById('back_end_error');

  
  
  container_dowload.classList.add("invisible")
  table_dowload.classList.add("invisible")
  error_message_ui.classList.remove("invisible")
  back_end_error.innerText= error
}


window.addEventListener('DOMContentLoaded', () => {
    loadActiveApps(false).then(loadVersionsFile);
    connectMQTT()

    const uploadButton = document.getElementById('upload-button');
    const uploadInput = document.getElementById('uploadInput');

    if (uploadInput) {
      uploadInput.style.display = 'none';
    }
    if (uploadButton && uploadInput) {
      uploadButton.onclick = () => {
        uploadInput.value = '';
        uploadInput.click(); 
      };
      uploadInput.onchange = uploadZIP;
    }

    document.getElementById('refresh-button').addEventListener('click', loadActiveAppsAndRefresh);
    document.getElementById("download-button").addEventListener("click", downloadConfig);
    document.getElementById("list-apps-button").addEventListener("click", getlistCustomApps);
    document.getElementById("clear-apps-button").addEventListener("click", clearlistCustomApps);
    document.getElementById("apply-button").addEventListener("click", setSaveApplicattions);
});


//window.setInterval(getlistCustomApps, 6000)