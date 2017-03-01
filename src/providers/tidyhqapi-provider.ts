import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

declare var window:any;

@Injectable()
export class TidyHQAPIProvider {

	data:any;
	access_token:string;
	auth_login_url:string;

	constructor(private http:Http, private platform:Platform){
		this.http = http;
		this.data = null;
		this.access_token = null;
		this.auth_login_url = 'https://accounts.tidyhq.com/oauth/authorize';
	}

	private checkIfMobilePlatform():boolean{
		let isWebApp:boolean = false;
		if (this.platform.platforms().includes('ios') ||
			this.platform.platforms().includes('android')){
			isWebApp = true;
		}
		
		return !isWebApp;
	}

	public setAPIKey(apikey:string){
		this.access_token = apikey;
	}

	public connectToAPI(client_id:string, client_secret:string, iframe_id:string):Promise<any>{
		var that = this;

		return new Promise(function(resolve, reject) {
			console.log("Returing promise??");
			
			if(!client_id && !client_secret){
				reject("No clientid and/or client secret");
			}

			var isMobApp = that.checkIfMobilePlatform();
			var apiURL:string = that.auth_login_url + "?client_id=" + 
				client_id + "&redirect_uri=http://localhost:8100&response_type=token"

			if(isMobApp) {

				var browserRef = window.cordova.InAppBrowser.open(apiURL, "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
				browserRef.addEventListener("load", function(event) {

					console.log("Loading..");

					if ((event.url).indexOf("https://tidyhq.com") === 0) {
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
			} else {
				console.log("Not mobile app..");
				location.replace(apiURL);
				resolve("Window URL change.");
			}
			console.log(browserRef);
	    });
	}

	private APIgetRequest(req:string):Promise<any>{
		var that = this;
		return new Promise(function(resolve, reject){
			//var header:any = { 'Authorization' : 'Bearer ' + that.access_token};
			
			that.http.get('https://api.tidyhq.com/v1/' + req + "?access_token=" + that.access_token)
				.subscribe(data => {
					resolve(data);
				}, error => {
					reject(JSON.stringify(error.json()));
				}
			);
		});
	}

	public getContacts():Promise<any>{
		return this.APIgetRequest("contacts");
	}

	public getMyDetails():Promise<any>{
		return this.APIgetRequest("contacts/me");
	}
}
