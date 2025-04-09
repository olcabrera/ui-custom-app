
var hostname = "172.20.30.1";
var port = 1883;
var clientId = "mqtt";
clientId += new Date().getUTCMilliseconds();;
var username = "";
var password = "";
var topic_subscription = "command_resp/test/snapshot";

mqttClient = new Paho.MQTT.Client(hostname, port, clientId);
mqttClient.onMessageArrived =  MessageArrived;
mqttClient.onConnectionLost = ConnectionLost;
Connect();

function Connect(){
	mqttClient.connect({
		onSuccess: Connected,
		onFailure: ConnectionFailed,
		keepAliveInterval: 10,
		//userName: username,
		useSSL: false,
		//password: password	
	});
}

function Connected() {
  console.log("Connected");
  mqttClient.subscribe(topic_subscription);
}

function ConnectionFailed(res) {
	console.log("Connect failed:" + res.errorMessage);
}

function ConnectionLost(res) {
  if (res.errorCode != 0) {
	console.log("Connection lost:" + res.errorMessage);
	Connect();
  }
}

function MessageArrived(message) {
	var payload= JSON.parse(message.payloadString);
	var img= payload["data"]["image"];

	if(!img.includes('data:image/png;base64')){
		img= "data:image/png;base64,"+img
	}
	document.getElementById("img-test").src=""+img+"";
}



