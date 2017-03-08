import { Component } from '@angular/core';

import { NavController, Platform } from 'ionic-angular';

import { TidyHQAPIProvider, ITidyHQOptions, IUserData } from '../../providers/tidyhqapi-provider';

import { AlertController } from 'ionic-angular';

declare var window:any;

@Component({ 
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [TidyHQAPIProvider]
})

export class HomePage {

	alertCtrl:AlertController;
	
	platforms:Array<string>;
	/* angular html content variables */
	loginshow:boolean = true;
	has_rfid_tag:boolean = false;
	logged_in:boolean = false;
	user_has_image:boolean = false;	
	is_native:boolean = false;
	page_url:string;
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

	constructor(public navCtrl: NavController, 
		private platform:Platform,
		private tidyhq:TidyHQAPIProvider, alertCtrl: AlertController) {
		this.platform = platform;
		this.tidyhq = tidyhq;
		this.alertCtrl = alertCtrl;
		this.tidyhq.onTidyHQLoad().then((val)=>{
			console.log("Storage ready?? " + val);
			if(val == true){
				this.LoginAndShowInfo();	
			}
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

	LoginAndShowInfo(){
		var that = this;

		this.tidyhq.getMyDetails().then(
			(res) => {
				that.loginshow = false;
				that.logged_in = true;

				var userData:Object = res.json();

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
							}
						}
					}
				}
			}
		).catch((err) => {
			console.log("Couldn't show user info!");
			console.log(err);
		});
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

	// When page reloads for mobile web version
	mobileWebHashCheck(){

		console.log("Checking for access token..");
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

	ionViewDidLoad() {
		var that = this;

		this.is_native = this.checkIfMobilePlatform();
		// TODO: copy function to provider class?
		this.tidyhq.setNative(this.is_native);

		if(this.is_native){
			this.facebook_link = "fb://hobarthackerspace";
			this.twitter_link = "twitter://user?user_id=hobhackerspace";
		}

		// MOBILE WEB access token from hash var 
		// check for mobile web-only oauth redirect hash code
		that.mobileWebHashCheck();

		// save the hasj token to local storage if it finds it
		if(this.temp_access_token != null){
			this.tidyhq.setAccessToken(this.temp_access_token);
			this.tidyhq.saveAccessToken(this.temp_access_token);
			return;
		}
	}

	// called when button is clicked/tapped
	public login(){
		var that = this;

		this.platform.ready().then(() => {
			/*if(!this.tidyhq.configLoaded){
				let alert = this.alertCtrl.create({
					title: 'Error!',
					subTitle: 'There was an internal config read error. Sorry!',
					buttons: ['OK']
				});
				alert.present();
				return;
			}*/

			this.tidyhq.connectToAPI().then(
				(success) => {
					that.tidyhq.saveAccessToken(success.access_token);
					that.tidyhq.setAccessToken(success.access_token);
					that.logged_in = true;
					that.LoginAndShowInfo();
				}, (error) => {
					let alert = this.alertCtrl.create({
						title:'Login error!',
						subTitle: 'There was a problem logging into TidyHQ. ' + error,
						buttons: ["OK"]
					})
					alert.present();
					console.log(error);
				}
			);
		});
	}
}