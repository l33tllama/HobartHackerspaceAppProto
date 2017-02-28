import { Component } from '@angular/core';

import { NavController, Platform } from 'ionic-angular';

import { ConfigProvider } from '../../providers/config-provider';

import { TidyHQAPIProvider } from '../../providers/tidyhqapi-provider';

declare var window:any;

@Component(
{  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [ConfigProvider, TidyHQAPIProvider]
})

export class HomePage {

	apiURL:string = 'https://accounts.tidyhq.com/oauth/authorize';
	debugtext:string;
	configLoaded:boolean = false;

	//TODO: move to temp variables..
	client_id:string;
	client_secret:string;

	constructor(public navCtrl: NavController, 
		private platform:Platform, private config:ConfigProvider,
		private tidyhq:TidyHQAPIProvider) {
		this.platform = platform;
		this.tidyhq = tidyhq;
		this.config = config;
	}

	ionViewDidLoad() {
		alert("LOADED!");
		this.debugtext = "HELLO!!";
		var configLoaded:boolean = false;
		var that = this;

		this.config.load().then((res) => {
			if(res.hasOwnProperty('client_id') &&
				res.hasOwnProperty('client_secret')){
					console.log("Client ID: " + res.client_id + 
						" client secret: " + res.client_secret);
					that.client_id = res.client_id;
					that.client_secret = res.client_secret;
					that.configLoaded = true;
				}
			}
		);

		var query:string = window.location.hash;
		var codeIndex:number;
		codeIndex = query.indexOf("#access_token=");

		if(codeIndex == 0){
			console.log("API key found on load");
			var apikey:string = query.substring(14);
			alert(query);
			this.tidyhq.setAPIKey(apikey);
			this.tidyhq.getContacts(function(data){
				console.log(data);
				//alert(data);
			});
		} else {
			console.log("No access token? " + query);
		}

		console.log(query);

		
	}

	// called when button is clicked/tapped
	public login(){
		console.log("Click!!");
		this.platform.ready().then(() => {
			console.log("Connecting to tidyhq..");
			this.tidyhq.connectToAPI(this.client_id, this.client_secret, "iframe-container").then(
				success => function(val){
					console.log("Success?");
					console.log(val);
				}, error => function (err) {
					console.log("Error!");
					console.log(err);
				})
		});
	}

	private checkIfMobilePlatform():boolean{
		let isWebApp:boolean = false;
		if (this.platform.platforms().includes('ios') ||
			this.platform.platforms().includes('android')){
			isWebApp = true;
		}
		
		return !isWebApp;
	}

	public tidyhqLogin(): Promise<any> {
		var pt = this.platform;
		var apiURL = this.apiURL;
		var debugtext = this.debugtext;
		var that = this;

		return new Promise(function(resolve, reject){	

			var browserRef:any;
			apiURL += "?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&response_type=code";
			
			var isMobApp:boolean = that.checkIfMobilePlatform();

			if(isMobApp){
				browserRef = window.cordova.InAppBrowser.open(apiURL);
			} else {
				browserRef = window.open(apiURL);
			}

			that.debugtext = "update?";

			browserRef.addEventListener("loadstart", (event) => {
	            if ((event.url).indexOf("http://localhost/callback") === 0) {
	                browserRef.removeEventListener("exit", (event) => {});
	                browserRef.close();
	                var responseParameters = ((event.url).split("#")[1]).split("&");
	                var parsedResponse = {};
	                for (var i = 0; i < responseParameters.length; i++) {
	                    parsedResponse[responseParameters[i].split("=")[0]] = responseParameters[i].split("=")[1];
	                }
	                if (parsedResponse["access_token"] !== undefined && parsedResponse["access_token"] !== null) {
	                    resolve(parsedResponse);
	                } else {
	                    reject("Problem authenticating with TidyHQ");
	                }
            	}
       		});

	        browserRef.addEventListener("exit", function(event) {
	            reject("The Facebook sign in flow was canceled");
	        });
		})
	}
}
