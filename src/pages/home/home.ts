import { Component } from '@angular/core';

import { NavController, Platform } from 'ionic-angular';

import { ConfigProvider } from '../../providers/config-provider';

import { TidyHQAPIProvider } from '../../providers/tidyhqapi-provider';

import { ITidyHQOptions } from '../../providers/tidyhqapi-provider';

declare var window:any;

@Component(
{  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [ConfigProvider, TidyHQAPIProvider]
})

export class HomePage {

	debugtext:string;
	configLoaded:boolean = false;
	loginshow:boolean = true;
	user_has_image:boolean = false;
	platforms:Array<string>;

	tidyhqOptions:ITidyHQOptions;

	user:Object = {
		'first_name' : null, 
		'active_membership' : false,
		'has_rfid_tag' : false,
		'profile_image' : null,
		'expiry_date' : null
	};


	page_url:string;
	is_native:boolean;

	constructor(public navCtrl: NavController, 
		private platform:Platform, private config:ConfigProvider,
		private tidyhq:TidyHQAPIProvider) {
		this.platform = platform;
		this.tidyhq = tidyhq;
		this.config = config;
	}

	private checkIfMobilePlatform():boolean{
		let isWebApp:boolean = false;

		if (this.platform.platforms().includes('mobileweb') &&
			!this.platform.platforms().includes('cordova')){
			isWebApp = true;
		}

		if(this.platform.platforms().includes('cordova')){
			return true;
		}
		
		return !isWebApp;
	}

	OnConfigLoad(options: ITidyHQOptions) {
		this.tidyhqOptions = options;
	}

	LoginAndShowInfo(){
		var that = this;

		this.tidyhq.getMyDetails().then(
			(res) => {
				that.loginshow = false;
				var userData:Object = res.json();
				console.log(userData['first_name']);

				if (userData != null){
					that.user['first_name'] = userData['first_name'];
					if(userData['profile_image'] != null){
						that.user_has_image = true;
						that.user['profile_image'] = userData['profile_image'];
						if(userData['status'] == "active"){
							that.user['active_membership'] = true;
						}
					}
				}				
				console.log(userData);
			}
		).catch((err) => {
			console.log(err);
		});
	}

	ionViewDidLoad() {
		var configLoaded:boolean = false;
		var that = this;
		var is_native = this.checkIfMobilePlatform();
		// important!!

		var client_id:string;
		var client_secret:string;
		var redirect_url:string;
		this.platforms = this.platform.platforms();

		// load api client id and secret from json file
		this.config.load().then((res) => {

			if(is_native){
				if(res.hasOwnProperty('native_client_id') &&
					res.hasOwnProperty('native_client_secret') && 
					res.hasOwnProperty('native_redirect_url')){

						client_id = res.native_client_id;
						client_secret = res.native_client_secret;
						redirect_url = res.native_redirect_url;
						that.configLoaded = true;
					} else {
						console.log("native config laod error");
					}
			} else {
				if(res.hasOwnProperty('dev_client_id') &&
					res.hasOwnProperty('dev_client_secret') && 
					res.hasOwnProperty('dev_redirect_url')){
						client_id = res.dev_client_id;
						client_secret = res.dev_client_secret;
						redirect_url = res.dev_redirect_url;
						that.configLoaded = true;
				} else {
					console.log("dev config laod error");
				}
			}
			if(that.configLoaded){
				console.log("Config load successful.")
				console.log("Client ID: " + client_id + 
							" client secret: " + client_secret);
				that.OnConfigLoad({
					client_id: client_id, client_secret:client_secret, 
					redirect_url:redirect_url, is_native:is_native});
			} else {
				console.log("Config not loaded!!");
			}
		});

		this.is_native = is_native;

		this.page_url = window.location.href;

		// Check for tidyhq access_token after login redirect
		var query:string = window.location.hash;

		if(query.indexOf("#access_token=") == 0) {
			
			console.log("API key found on load");
			var apikey:string = query.substring(14);
			console.log("Super secret token: " + apikey);

			this.tidyhq.setAccessToken(apikey);
			this.LoginAndShowInfo();
		} else {
			console.log("No access token? " + query);
		}
	}

	// called when button is clicked/tapped
	public login(){
		console.log("Click!!");
		var that = this;
		this.platform.ready().then(() => {
			console.log("Connecting to tidyhq..");
			if(!this.configLoaded){
				console.log("Config load error!");
				return;
			}
			this.tidyhq.connectToAPI(this.tidyhqOptions).then(
				(success) => {
					console.log("Success?");
					console.log(success);
					that.tidyhq.setAccessToken(success.access_token);
					that.LoginAndShowInfo();
				}, (error) =>  {
					console.log("Error!");
					console.log(error);
				}
			)
		});
	}
}
