import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';

import 'fullpage.js';
import * as $ from 'jquery';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {

  constructor(public navCtrl: NavController) {

  }

  ionViewDidLoad() {
  	$('#fullpage').fullpage();
  }


}
