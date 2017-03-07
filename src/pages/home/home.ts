import { Component } from '@angular/core';

import { NavController, Platform } from 'ionic-angular';

import { ConfigProvider } from '../../providers/config-provider';

import { TidyHQAPIProvider, ITidyHQOptions } from '../../providers/tidyhqapi-provider';

import { Storage } from '@ionic/storage';

declare var window:any;

@Component({ 
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [ConfigProvider, TidyHQAPIProvider]
})

export class HomePage {

	storage:Storage;
	tidyhqOptions:ITidyHQOptions;
	platforms:Array<string>;
	configLoaded:boolean = false;
	loginshow:boolean = true;
	user_has_image:boolean = false;
	access_token_saved:boolean = false;
	storage_available:boolean = false;
	has_rfid_tag:boolean = false;
	logged_in:boolean = false;
	debugtext:string;
	user_info:string;
	temp_access_token:string;	
	facebook_link:string = "https://www.facebook.com/hobarthackerspace";
	twitter_link:string = "https://www.twitter.com/hobhackerspace";

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
		private tidyhq:TidyHQAPIProvider, storage:Storage) {
		this.platform = platform;
		this.tidyhq = tidyhq;
		this.config = config;
		this.storage = storage;	
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

	OnConfigLoad(options: ITidyHQOptions) {
		this.tidyhqOptions = options;
	}

	UpdateUserInfo(){
		if(this.logged_in) { 
			if(this.user['active_membership']){
				this.user_info = "Your membership is active.";
			}
		}
	}

	LoginAndShowInfo(){
		var that = this;

		this.tidyhq.getMyDetails().then(
			(res) => {
				that.loginshow = false;
				that.logged_in = true;
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
					var custom_fields = userData['custom_fields'];

					if(custom_fields.length > 0){
						for(let field of custom_fields){
							if(field['title'] == 'RFID Tag'){
								that.user['has_rfid_tag'] = true;
								console.log('tag' + field['value']);
							}
						}
					}
					
				}
				this.UpdateUserInfo();
				console.log(userData);
			}
		).catch((err) => {
			console.log(err);
		});
	}

	ReadConfig(){
		var that = this;

		var client_id:string;
		var client_secret:string;
		var redirect_url:string;

		// load api client id and secret from json file
		this.config.load().then((res) => {

			if(that.is_native){
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
					redirect_url:redirect_url, is_native:that.is_native});
			} else {
				console.log("Config not loaded!!");
			}
		});
	}

	mobileWebHashCheck(){
		// Check for MOBILE WEB reload - when Oauth redirects back to localhost server
		this.page_url = window.location.href;

		// Check for tidyhq access_token after login redirect
		var query:string = window.location.hash;

		if(query.indexOf("#access_token=") == 0) {
			console.log("Access token found on load (# - URL hash)");
			var access_token:string = query.substring(14);
			console.log("Super secret token: " + access_token);
			this.temp_access_token = access_token;

			this.tidyhq.setAccessToken(access_token);
			this.LoginAndShowInfo();
		} else {
			console.log("No access token? " + query);
		}
	}

	OpenFacebook(){
		if(this.is_native){
			window.open(this.facebook_link, '_system');
		} else {
			window.open(this.facebook_link);
		}
		
	}

	OpenTwitter(){
		if(this.is_native){
			window.open(this.twitter_link, '_system');
		} else {
			window.open(this.twitter_link);
		}
	}

	ionViewDidLoad() {

		this.UpdateUserInfo();
		// important!!
		var st = this.storage;
		var that = this;
		this.is_native = this.checkIfMobilePlatform();

		if(this.is_native){
			this.facebook_link = "fb://hobarthackerspace";
			this.twitter_link = "twitter://user?user_id=hobhackerspace";
		}

		that.mobileWebHashCheck();

		if(this.temp_access_token != null){
			this.tidyhq.setAccessToken(this.temp_access_token);
			this.saveAccessToken(this.temp_access_token);
			return;
		}

		// Check for saved access token
		st.ready().then(() => {
			console.log("Storage is now available.");
			that.storage_available = true;

			st.get('access_token').then((val) => {

				if(val == null){
					that.access_token_saved = false;
					that.ReadConfig();
				} else {
					console.log("Access token read! " + val);
					that.access_token_saved = true;
					that.tidyhq.setAccessToken(val);
					this.login();
				}
			}, (err) => {
				console.log("Access token not saved: " + err);
				that.access_token_saved = false;
				that.ReadConfig();
			});

		});	
	}

	saveAccessToken(access_token:string){
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

	// called when button is clicked/tapped
	public login(){
		console.log("Click!!");
		var that = this;
		this.platform.ready().then(() => {
			console.log("Connecting to tidyhq..");

			if(this.access_token_saved){
				this.LoginAndShowInfo();
			} else {
				if(!this.configLoaded){
					console.log("Config load error!");
					return;
				}

				this.tidyhq.connectToAPI(this.tidyhqOptions).then(
					(success) => {
						console.log("Success?");
						console.log(success);
						that.saveAccessToken(success.access_token);
						that.tidyhq.setAccessToken(success.access_token);
						that.logged_in = true;
						that.LoginAndShowInfo();
					}, (error) => {
						console.log("Error!");
						console.log(error);
					}
				);
			}
		});
	}
}