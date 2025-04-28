var topic_subscription_resp = "command/cockpit_ui/resp";
var topic_subscription_download = "command/cockpit_ui/download";
var topic_subscription_errors = "command/cockpit_ui/error";


function connectMQTT(){
	//var hostname = window.location.hostname;
	var hostname='ckp-ae4915f292de.checkpoint-device.com'
	var port = 9001;
	var clientId = "mqtt";
  
	clientId += new Date().getUTCMilliseconds();
	mqttClient = new Paho.MQTT.Client(hostname, port, clientId);
	mqttClient.onMessageArrived =  MessageArrived;
	mqttClient.onConnectionLost = ConnectionLost;
	Connect();
  }
  
function Connect(){
	mqttClient.connect({
		onSuccess: Connected,
		onFailure: ConnectionFailed,
		keepAliveInterval: 20,
		useSSL: true,	
	});
}
  
function Connected() {
	
	alert("MQTT Connected");
	mqttClient.subscribe(topic_subscription_resp);
	mqttClient.subscribe(topic_subscription_download);
	mqttClient.subscribe(topic_subscription_errors);
}
  
function ConnectionFailed(res) {
	alert("Connect failed:" + res.errorMessage);
}
  
function ConnectionLost(res) {
	if (res.errorCode != 0) {
		console.log("Connection lost reconnect now:" + res.errorMessage);
		Connect();
	}
}
  
function MessageArrived(message) {
	const topic = message.destinationName;
	var payload= JSON.parse(message.payloadString);
	console.log("payload:" +payload +"from topic:" +topic)
	if(topic == topic_subscription_resp){
		printStatusApps(payload)
	}
	else if(topic == topic_subscription_download){
		printStatusDownload(payload)
	}
	else if(topic == topic_subscription_errors){
		printBackEndError(payload)
	}
}