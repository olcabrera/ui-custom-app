
function connectMQTT(){
	var hostname = window.location.hostname;
	//var hostname='ckp-ae4915f292de.checkpoint-device.com'
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
	var topic_subscription = "command/cockpit_ui/resp";
	alert("MQTT Connected");
	mqttClient.subscribe(topic_subscription);
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
	if(topic == "command/cockpit_ui/resp"){
		printStatusApps(payload)
	}
}