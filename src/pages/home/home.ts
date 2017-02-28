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
				})
		});
	}
}
