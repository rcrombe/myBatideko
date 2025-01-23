import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import get = Reflect.get;
import { Observable } from 'rxjs';
import { Modal } from 'bootstrap';


@Component({
  selector: 'app-historique-chantiers',
  templateUrl: './historique-chantiers.component.html',
  styleUrls: ['./historique-chantiers.component.css']
})
export class HistoriqueChantiersComponent implements OnInit {

  private utilisateur;
  public date;
  public _lookingDate;
  public chantiers: any[] = [];

  public totalTime: number = 0;

  public historique: any[] = [];

  constructor(private route: ActivatedRoute, private http: HttpClient, private cst: Constants,
    private jwt: JwtHelperService, private toastr: ToastrService, private datePipe: DatePipe) {
    this.utilisateur = this.jwt.decodeToken(
      localStorage.getItem('token') ?? ''
    );

    this._lookingDate = localStorage.getItem('_lookingDate');

    if (this._lookingDate === null)
      this.date = new Date(Date.now());
    else
      this.date = new Date(this._lookingDate);
    this.loadData();
  }

  ngOnInit(): void {
  }

  public loadData() {
    this.http.get<Array<any>>(this.cst.apiUrl + 'planning/noms_chantiers').subscribe(
      (chantiers: Array<any>) => {
        this.chantiers = chantiers;
      });
  }

  public loadChantier() {
    this.totalTime = 0;

    var input = $("#newchantier").val();
    if (typeof input !== 'string') {
      console.error("La valeur de l'input n'est pas une chaîne valide :", input);
      return;
    }
    var code_chantier = input.split('/')[0].trim();

    console.log("loadChantier : " + code_chantier);

    this.http.get<any[]>(this.cst.apiUrl + 'historique-chantiers/' + code_chantier)
      .subscribe(
        (historique: any[]) => {
          this.historique = historique;

          console.log(historique);

          this.historique.forEach((el) => {
            this.totalTime += el.duree;
          });

          for (var idx = 0; idx < this.historique.length; idx++) {
            if (this.totalTime > 0)
              this.historique[idx].result = ((this.historique[idx].duree / this.totalTime) * 100).toFixed(2);
            else
              this.historique[idx].result = 0;
          }
        });
  }

  public toHHMMSS(secs: number): string {
    var sec_num = Math.floor(secs); // Utilisation directe du nombre
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num % 3600) / 60);
    var seconds = sec_num % 60;

    return [hours, minutes, seconds]
      .map(v => (v < 10 ? "0" + v : v)) // Ajoute un 0 devant si < 10
      .join(":"); // Combine les éléments avec ":"
  }
}
