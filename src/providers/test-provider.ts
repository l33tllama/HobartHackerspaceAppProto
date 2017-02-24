import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the TestProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class TestProvider {

  data: any;
 
  constructor(private http: Http) {
    this.data = null;
  }
 
  load() {
    if (this.data) {
      return Promise.resolve(this.data);
    }
 
    return new Promise(resolve => {
      this.http.get('assets/testdata.json')
        .map(res => res.json())
        .subscribe(data => {
          this.data = data;
          resolve(this.data);
        });
    });
  }

}
