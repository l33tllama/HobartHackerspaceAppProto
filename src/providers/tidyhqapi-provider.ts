import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

declare var window:any;

export interface ITidyHQOptions {
	client_id?: string;
	client_secret?: string;
	redirect_url?: string;
	is_native?:boolean;
}

@Injectable()
export class TidyHQAPIProvider {

	data:any;
	access_token:string;
	auth_login_url:string;
	is_native:boolean = false;

	constructor(private http:Http, private platform:Platform){
		this.http = http;
		this.data = null;
		this.access_token = null;
		this.auth_login_url = 'https://accounts.tidyhq.com/oauth/authorize';
	}

	public setAccessToken(apikey:string){
		this.access_token = apikey;
	}

	public connectToAPI(options:ITidyHQOptions):Promise<any>{
		var that = this;

		return new Promise(function(resolve, reject) {
			console.log("Returing promise??");
			
			if(!options.client_id && 
				!options.client_secret &&
			 	!options.redirect_url) {
				reject("Incomplete options set.");
			}

			var apiURL:string = that.auth_login_url + "?client_id=" + 
				options.client_id + "&redirect_uri=" + options.redirect_url + "&response_type=token";

			if(options.is_native) {
				var browserRef = window.cordova.InAppBrowser.open(apiURL, "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
				browserRef.addEventListener("loadstart", function(event) {
					console.log("Loading..");
					console.log(event.url);

					if ((event.url).indexOf(options.redirect_url) === 0) {
		                browserRef.removeEventListener("exit", (event) => {});
		                browserRef.close();

		                var responseParameters = ((event.url).split("#")[1]).split("&");
		                console.log(event.url);
		                var parsedResponse = {};
		                
		                for (var i = 0; i < responseParameters.length; i++) {
		                    parsedResponse[responseParameters[i].split("=")[0]] = responseParameters[i].split("=")[1];
		                }

		                if (parsedResponse["access_token"] !== undefined && parsedResponse["access_token"] !== null) {
		                	console.log(parsedResponse);
		                    resolve(parsedResponse);
		                } else {
		                    reject("Problem authenticating with TidyHQ");
		                }
	           	 	} else {
	           	 		console.log("Event url does not match redirect url: " + event.url + " " + options.redirect_url);
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
