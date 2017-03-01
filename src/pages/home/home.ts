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
	loginshow:boolean = true;
	user_has_image:boolean = false;
	user:Object = {
		'first_name' : null, 
		'active_membership' : false,
		'has_rfid_tag' : false,
		'profile_image' : null,
		'expiry_date' : null
	};

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
		var configLoaded:boolean = false;
		var that = this;

		// load api client id and secret from json file
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

		// Check for tidyhq access_token after login redirect
		var query:string = window.location.hash;

		if(query.indexOf("#access_token=") == 0) {
			
			console.log("API key found on load");
			var apikey:string = query.substring(14);
			console.log("Super secret token: " + apikey);

			this.tidyhq.setAPIKey(apikey);
			var that = this;
			this.tidyhq.getMyDetails().then(
				(res) => {
					that.loginshow = false;

					console.log("Got user details..");
					console.log(res.json());
					var userData:Object = res.json();
					console.log(userData['first_name']);
					if (userData != null){

						that.user['first_name'] = userData['first_name'];
						if(userData['profile_image'] != null){
							that.user_has_image = true;
							that.user['profile_image'] = userData['profile_image'];
						}
					}
					
					console.log(userData);
				}
			).catch((err) => {
				console.log(err);
			});
		} else {
			console.log("No access token? " + query);
		}
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
				}
			)
		});
	}
}
