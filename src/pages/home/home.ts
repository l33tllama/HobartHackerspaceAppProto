import { Component } from '@angular/core';

import { NavController, Platform } from 'ionic-angular';

import { TestProvider } from '../../providers/test-provider';

declare var window:any;

@Component(
{  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [TestProvider]
})

export class HomePage {

	apiURL:string = 'https://accounts.tidyhq.com/oauth/authorize';
	debugtext:string;

	constructor(public navCtrl: NavController, 
		private platform:Platform, private testProvider:TestProvider) {
		this.platform = platform;
		this.testProvider = testProvider;
	}

	ionViewDidLoad() {
		this.debugtext = "HELLO!!";
		this.testProvider.load().then((res) =>{
				console.log(res);
			}
		);
	}

	public login(){

		console.log("Click!!");
		console.log(this.platform.platforms());

		var ima:boolean = this.checkIfMobilePlatform();
		
		if(ima == true){
			this.debugtext = "web app";
		} else {
			this.debugtext = "mobile app";
		}
		
		this.platform.ready().then(() => {
	        this.tidyhqLogin().then(success => {
	            alert(success.access_token);
	        }, (error) => {
	            alert(error);
	        });
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

	public tidyhqLogin(): Promise<any>{
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
