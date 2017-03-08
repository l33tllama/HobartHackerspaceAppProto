import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Http } from '@angular/http';
import { Storage } from '@ionic/storage';
import 'rxjs/add/operator/map';

declare var window:any;

export interface ITidyHQOptions {
	client_id?: string;
	client_secret?: string;
	redirect_url?: string;
	is_native?:boolean;
}

export interface IUserData {
	first_name?: string;
	active_membership?:boolean;
	has_rfid_tag?:boolean;
	profile_image_url?:string;
	expiry_date?:string;
}

@Injectable()
export class TidyHQAPIProvider {

	private data:any;
	private access_token:string;
	private data_filename:string = 'assets/testdata.json';
	private auth_login_url:string = 'https://accounts.tidyhq.com/oauth/authorize';
	private storage_available:boolean = false;
	private is_native:boolean = false;
	private user_logged_in:boolean = false;
	private access_token_saved:boolean = false;
	private config_loaded:boolean = false;
	private onready_callback:Function;
	private tidyhqOptions:ITidyHQOptions;
	private userData:IUserData;

	constructor(private http:Http, private platform:Platform,
		private storage:Storage){
		this.storage = storage;
		this.http = http;
		this.data = null;
		this.access_token = null;
		this.ReadConfig();

		this.is_native = this.checkIfMobilePlatform();

		var that = this;

		this.storage.ready().then(() => {
			this.storage.get('access_token').then((val) => {
				if(val != null) {
					console.log('Access token: ' + val);
					that.access_token = val;
					that.user_logged_in = true;
				}
			});
		});
	}

	public onTidyHQLoad():Promise<any>{
		return this.ReadConfig().then((success) =>{
			return this.onStorageLoad()
		});
	}

	public onStorageLoad():Promise<any>{

		var that = this;
		return new Promise(function(resolve, reject){
			// Check for saved access token and log in automatically if it's saved
			that.storage.ready().then(() => {
				console.log("Storage is now available.");
				that.storage_available = true;

				that.storage.get('access_token').then((val) => {

					if(val == null){
						console.log("No access_token in storage!");
						that.access_token_saved = false;

						resolve(false);
					} else {
						console.log("Access token read! " + val);
						that.access_token_saved = true;
						that.user_logged_in = true;
						console.log("User has been logged in!" + that.user_logged_in);
						that.setAccessToken(val);
						resolve(true);
					}
				}, (err) => {
					console.log("Access token not saved: " + err);
					that.access_token_saved = false;
					reject(err);
				});
			});	
		})
	}

	private loadConfigFile():Promise<any>{
		if (this.data) {
      		return Promise.resolve(this.data);
		}
 
	    return new Promise(resolve => {
	      this.http.get(this.data_filename)
	        .map(res => res.json())
	        .subscribe(data => {
	          this.data = data;
	          resolve(this.data);
	        });
	    });
	}

	private checkIfMobilePlatform():boolean{
		let isMobApp:boolean = false;

		if (this.platform.platforms().includes('mobileweb') &&
			!this.platform.platforms().includes('cordova')){
			isMobApp = false;
		}

		if(this.platform.platforms().includes('cordova')){
			isMobApp = true;
		}

		if(this.platform.platforms().includes('core')){
			return false;
		}
		
		return isMobApp;
	}

	private OnConfigLoad(options: ITidyHQOptions) {
		this.tidyhqOptions = options;
	}

	private ReadConfig():Promise<any>{
		var that = this;

		return new Promise(function(resolve, reject){
			var client_id:string;
			var client_secret:string;
			var redirect_url:string;

			// load api client id and secret from json file
			that.loadConfigFile().then((res) => {

				if(that.is_native){
					if(res.hasOwnProperty('native_client_id') &&
						res.hasOwnProperty('native_client_secret') && 
						res.hasOwnProperty('native_redirect_url')){
							client_id = res.native_client_id;
							client_secret = res.native_client_secret;
							redirect_url = res.native_redirect_url;
							that.config_loaded = true;
						} else {
							console.log("native config load error");
						}
				} else {
					if(res.hasOwnProperty('dev_client_id') &&
						res.hasOwnProperty('dev_client_secret') && 
						res.hasOwnProperty('dev_redirect_url')){
							client_id = res.dev_client_id;
							client_secret = res.dev_client_secret;
							redirect_url = res.dev_redirect_url;
							that.config_loaded = true;
					} else {
						console.log("dev config load error");
					}
				}
				if(that.config_loaded){
					console.log("Config load successful.")
					console.log("Client ID: " + client_id + 
								" client secret: " + client_secret);
					that.OnConfigLoad({
						client_id: client_id, client_secret:client_secret, 
						redirect_url:redirect_url, is_native:that.is_native});
					resolve(true);
				} else {
					reject(false);
				}
			});
		});
	}

	// save the access token to local storage
	public saveAccessToken(access_token:string) {
		if(this.storage_available) {
			this.storage.set('access_token', access_token);
			this.access_token_saved = true;
			console.log("Access token saved!");
		} else {
			console.log("Storage is not available yet! Retrying..");
			this.storage.ready().then(() => {
				this.storage.set('access_token', access_token);
				this.storage_available = true;
			})
		}
	}

	public setNative(is_native:boolean){
		this.tidyhqOptions.is_native = is_native;
	}

	public setAccessToken(apikey:string){
		this.access_token = apikey;
	}

	public isLoggedIn():boolean{
		return this.user_logged_in;
	}

	public setLoggedIn(logged_in:boolean){
		this.user_logged_in = logged_in;
	}

	public connectToAPI():Promise<any>{
		var that = this;
		var options = this.tidyhqOptions;

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

					if ((event.url).indexOf(options.redirect_url) === 0) {
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

			// particular error to check for to get the user to log in again
			if(!that.user_logged_in){
				reject("not_logged_in");
			}
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
