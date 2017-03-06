var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { ConfigProvider } from '../../providers/config-provider';
import { TidyHQAPIProvider } from '../../providers/tidyhqapi-provider';
import { Storage } from '@ionic/storage';
var HomePage = (function () {
    function HomePage(navCtrl, platform, config, tidyhq, storage) {
        this.navCtrl = navCtrl;
        this.platform = platform;
        this.config = config;
        this.tidyhq = tidyhq;
        this.configLoaded = false;
        this.loginshow = true;
        this.user_has_image = false;
        this.access_token_saved = false;
        this.storage_available = false;
        this.user = {
            'first_name': null,
            'active_membership': false,
            'has_rfid_tag': false,
            'profile_image': null,
            'expiry_date': null
        };
        this.platform = platform;
        this.tidyhq = tidyhq;
        this.config = config;
        this.storage = storage;
    }
    HomePage.prototype.checkIfMobilePlatform = function () {
        var isMobApp = false;
        if (this.platform.platforms().includes('mobileweb') &&
            !this.platform.platforms().includes('cordova')) {
            isMobApp = false;
        }
        if (this.platform.platforms().includes('cordova')) {
            isMobApp = true;
        }
        if (this.platform.platforms().includes('core')) {
            return false;
        }
        return isMobApp;
    };
    HomePage.prototype.OnConfigLoad = function (options) {
        this.tidyhqOptions = options;
    };
    HomePage.prototype.LoginAndShowInfo = function () {
        var that = this;
        this.tidyhq.getMyDetails().then(function (res) {
            that.loginshow = false;
            var userData = res.json();
            console.log(userData['first_name']);
            if (userData != null) {
                that.user['first_name'] = userData['first_name'];
                if (userData['profile_image'] != null) {
                    that.user_has_image = true;
                    that.user['profile_image'] = userData['profile_image'];
                    if (userData['status'] == "active") {
                        that.user['active_membership'] = true;
                    }
                }
            }
            console.log(userData);
        }).catch(function (err) {
            console.log(err);
        });
    };
    HomePage.prototype.readConfig = function () {
        var that = this;
        var client_id;
        var client_secret;
        var redirect_url;
        // load api client id and secret from json file
        this.config.load().then(function (res) {
            if (that.is_native) {
                if (res.hasOwnProperty('native_client_id') &&
                    res.hasOwnProperty('native_client_secret') &&
                    res.hasOwnProperty('native_redirect_url')) {
                    client_id = res.native_client_id;
                    client_secret = res.native_client_secret;
                    redirect_url = res.native_redirect_url;
                    that.configLoaded = true;
                }
                else {
                    console.log("native config laod error");
                }
            }
            else {
                if (res.hasOwnProperty('dev_client_id') &&
                    res.hasOwnProperty('dev_client_secret') &&
                    res.hasOwnProperty('dev_redirect_url')) {
                    client_id = res.dev_client_id;
                    client_secret = res.dev_client_secret;
                    redirect_url = res.dev_redirect_url;
                    that.configLoaded = true;
                }
                else {
                    console.log("dev config laod error");
                }
            }
            if (that.configLoaded) {
                console.log("Config load successful.");
                console.log("Client ID: " + client_id +
                    " client secret: " + client_secret);
                that.OnConfigLoad({
                    client_id: client_id, client_secret: client_secret,
                    redirect_url: redirect_url, is_native: that.is_native
                });
            }
            else {
                console.log("Config not loaded!!");
            }
        });
    };
    HomePage.prototype.mobileWebHashCheck = function () {
        // Check for MOBILE WEB reload - when Oauth redirects back to localhost server
        this.page_url = window.location.href;
        // Check for tidyhq access_token after login redirect
        var query = window.location.hash;
        if (query.indexOf("#access_token=") == 0) {
            console.log("Access token found on load (# - URL hash)");
            var access_token = query.substring(14);
            console.log("Super secret token: " + access_token);
            this.temp_access_token = access_token;
            this.tidyhq.setAccessToken(access_token);
            this.LoginAndShowInfo();
        }
        else {
            console.log("No access token? " + query);
        }
    };
    HomePage.prototype.ionViewDidLoad = function () {
        var _this = this;
        // important!!
        var st = this.storage;
        var that = this;
        this.is_native = this.checkIfMobilePlatform();
        that.mobileWebHashCheck();
        if (this.temp_access_token != null) {
            this.tidyhq.setAccessToken(this.temp_access_token);
            this.saveAccessToken(this.temp_access_token);
            return;
        }
        // Check for saved access token
        st.ready().then(function () {
            console.log("Storage is now available.");
            that.storage_available = true;
            st.get('access_token').then(function (val) {
                if (val == null) {
                    that.access_token_saved = false;
                    that.readConfig();
                }
                else {
                    console.log("Access token read! " + val);
                    that.access_token_saved = true;
                    that.tidyhq.setAccessToken(val);
                    _this.login();
                }
            }, function (err) {
                console.log("Access token not saved: " + err);
                that.access_token_saved = false;
                that.readConfig();
            });
        });
    };
    HomePage.prototype.saveAccessToken = function (access_token) {
        var _this = this;
        if (this.storage_available) {
            this.storage.set('access_token', access_token);
            this.access_token_saved = true;
            console.log("Access token saved!");
        }
        else {
            console.log("Storage is not available yet! Retrying..");
            this.storage.ready().then(function () {
                _this.storage.set('access_token', access_token);
                _this.storage_available = true;
            });
        }
    };
    // called when button is clicked/tapped
    HomePage.prototype.login = function () {
        var _this = this;
        console.log("Click!!");
        var that = this;
        this.platform.ready().then(function () {
            console.log("Connecting to tidyhq..");
            if (_this.access_token_saved) {
                _this.LoginAndShowInfo();
            }
            else {
                if (!_this.configLoaded) {
                    console.log("Config load error!");
                    return;
                }
                _this.tidyhq.connectToAPI(_this.tidyhqOptions).then(function (success) {
                    console.log("Success?");
                    console.log(success);
                    that.saveAccessToken(success.access_token);
                    that.tidyhq.setAccessToken(success.access_token);
                    that.LoginAndShowInfo();
                }, function (error) {
                    console.log("Error!");
                    console.log(error);
                });
            }
        });
    };
    return HomePage;
}());
HomePage = __decorate([
    Component({
        selector: 'page-home',
        templateUrl: 'home.html',
        providers: [ConfigProvider, TidyHQAPIProvider]
    }),
    __metadata("design:paramtypes", [NavController,
        Platform, ConfigProvider,
        TidyHQAPIProvider, Storage])
], HomePage);
export { HomePage };
//# sourceMappingURL=home.js.map