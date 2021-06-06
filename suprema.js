"use strict"
//Websocket Suprema
var WebSocketClient = require('websocket').client;
var request = require('request')
var xurl = 'wss://*****.biostar2.com:443/wsapi' 
var client = new WebSocketClient();

//Xrping/ILP
var accessToken = ''
const { PaymentRequest, IlpClient, PaymentResponse } = require("xpring-js")
const bigInt = require("big-integer")
const grpcUrl = 'prod.grpcng.wallet.xpring.io:443' // Testnet ILP Wallet URL
const ilpClient = new IlpClient(grpcUrl)
var payment;


 async function pay(){
	const paymentRequest = new PaymentRequest({
	    amount: bigInt(100),
	    destinationPaymentPointer: "$xpring.money/demo_receiver",
	    senderAccountId: ""
	  })

	  payment = await ilpClient.sendPayment(paymentRequest, accessToken);
	  console.log(payment)
}
	 
function connect(){


	var options = {
		method: 'POST',
		url: 'https://*****.biostar2.com:443/api/login',
		headers: {'content-type': 'application/json'},
		body:  {
			'User':{
				'login_id': 'admin',
				'password': ''
			}						
		},
	json: true
  };
		request(options, function (error, response, body) {
			if (error) throw new Error(error);
			
			
			var bsSessionId = response.headers['bs-session-id'];
			console.log('bsSessionId: ' + bsSessionId)
			
			client.on('connectFailed', function(error) {
				console.log('Connect Error: ' + error.toString());
			});
			 
			 client.on('connect', function(connection) {
				setTimeout(function(){postBioStar2()}, 1000)
				connection.send('bs-session-id' + "=" + response.headers['bs-session-id']);
				
			function postBioStar2(){
				var options = {
					method: 'POST',
					url: 'https://*****.biostar2.com:443/api/events/start',
					headers: {'content-type': 'application/json', 'bs-session-id': bsSessionId}								
					
				
			}
			
				request(options, function (error, response, body) {
					if (error) throw new Error(error);
					//var jsonBody = JSON.stringify(body)
					console.log("Post Event Start: "+body)
				});
	
				console.log('\x1b[31m%s\x1b[0m','Connected to Suprema Websocket');
				connection.on('error', function(error) {
					console.log('\x1b[31m%s\x1b[0m',"Suprema Connection Error: " + error.toString());
			 	});
				connection.on('close', function() {
					console.log('\x1b[31m%s\x1b[0m','Suprema echo-protocol Connection Closed');
				});
			
			}
			
			  
			connection.on('message', async function(message) {
				
				if (message.type === 'utf8') {
					//console.log('\x1b[31m%s\x1b[0m',"Suprema Received: '" + message.utf8Data + "'");
					
					var msg = JSON.parse(message.utf8Data);

						var data = await msg.Event;
						
									if(data.tna_key == '1'){
									//pay() 
									console.log('\x1b[34m%s\x1b[0m',"Suprema Starting Payment To: " + data.user_id.name)
									var options = {
										method: 'get',
										url: 'https://*****.biostar2.com:443/api/users/'+data.user_id.user_id,
										headers: {'accept': 'application/json', 'bs-session-id': bsSessionId}								
										
									
								}
								
									request(options, async function (error, response, body) {
										if (error) throw new Error(error);
										var jsonBody = JSON.parse(body)

										//console.log("User Data: "+jsonBody)
										// New Field required in the DB for users PaymentPointers.
										//var PaymentPoiner = jsonBody.User.PaymentPoiner
										var PaymentPointer = await jsonBody.User.email; //was going to use email but $xpring.money/demo_receiver not a vaild email address.
										console.log(PaymentPointer)
										const paymentRequest = new PaymentRequest({
											amount: bigInt(100),
											destinationPaymentPointer: "$xpring.money/demo_receiver", //PaymentPoiner
											senderAccountId: ""
										  })
									
										  payment = await ilpClient.sendPayment(paymentRequest, accessToken);
										  console.log(payment)

									});
									}else if(data.tna_key == '2'){
										console.log(data.user_id.name+' Has Clocked out')
									}
									
				}
			}); 
			
				function sendNumber() {
					if (connection.connected) {
						var number = Math.round(Math.random() * 0xFFFFFF);
						connection.sendUTF(number.toString());
						setTimeout(sendNumber, 1000);
					}
				}
				sendNumber();
			});
			 
		
			client.connect(xurl); 
			
		  });
}
connect()


