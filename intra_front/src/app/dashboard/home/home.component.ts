import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ChartConfiguration, ChartData, ChartEvent, ChartType, Color, Chart } from 'chart.js';

declare var $: (arg0: string) => { (): any; new(): any; html: { (arg0: string): void; new(): any; }; hide: { (): void; new(): any; }; show: { (): void; new(): any; }; };

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  public typesData: [string[], number[], string[]] = [[], [], []];
  public typesChart: Chart | null = null;
  public activitesData: [string[], number[], string[]] = [[], [], []];
  public activitesChart: Chart | null = null;
  public date; public semaine: string | null | undefined
  public pointages: any; public vehicules: any
  public dataType = 'perso';
  public _nav_id;



  // Poseurs
  public poseursChartLabels: string[] = [];
  public poseursChartData: ChartData<"doughnut", number[], unknown> = { datasets: [], labels: [] };
  public poseursChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public poseursChartType: ChartType = 'doughnut';

  // Activités
  public activitesChartLabels: string[] = [];
  public activitesChartData: ChartData<'doughnut', number[], unknown> = { datasets: [], labels: [] };
  public activitesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public activitesChartType: ChartType = 'doughnut';

  public _lookingDate;

  private utilisateur;
  public error = "";


  constructor(private http: HttpClient, private cst: Constants, private jwt: JwtHelperService,
    private toastr: ToastrService, private datePipe: DatePipe) {
    this.utilisateur = this.jwt.decodeToken(localStorage.getItem('token') ?? '');

    this._nav_id = this.utilisateur.nav_id;

    if (this._nav_id == null)
      this.dataType = 'global';

    this._lookingDate = localStorage.getItem('_lookingDate');

    if (this._lookingDate === null)
      this.date = new Date(Date.now());
    else
      this.date = new Date(this._lookingDate);

    this.loadData();
  }
  /*
  var dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd');
          localStorage.setItem('_lookingDate', dateFormate);
   */
  ngOnInit() {

  }



  public loadData(): void {

    var dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd');
    this.semaine = this.datePipe.transform(this.date, 'w');
    this.http.get<Array<any>>(this.cst.apiUrl + 'home/vehicules_actifs/' + dateFormate).subscribe(
      (arr: Array<any>) => {
        if (arr[0].veh_actifs === 0)
          $("#divVehicules").html('Aucune donnée')
        else
          $("#divVehicules").html((arr[0].veh_actifs * 100).toFixed(1) + '%')

      });

    this.http.get<Array<any>>(this.cst.apiUrl + 'home/type/' + this.dataType + '/' + dateFormate).subscribe(
      (arr: Array<any>) => {
        if (arr.length === 0) {
          $("#types").html("Aucune donnée")
          $("#typesChart").hide();
        }
        else {
          $("#types").html("")
          $("#typesChart").show();
          this.typesData = [[], [], []]
          for (let el of arr) {
            this.typesData[0].push(el.Type)
            this.typesData[1].push(el.nb_types)
            this.typesData[2].push("blue")
          }

          var _doughnutChartLabels: string[] = this.typesData[0].map(item => item.toString());
          var _doughnutChartData: ChartData<'doughnut'> = {
            labels: _doughnutChartLabels,
            datasets: [
              {
                data: this.typesData[1],
                backgroundColor: [
                  '#00AAAA',
                  '#87CEFA',
                  '#4169E1'
                ],
                hoverBackgroundColor: [
                  '#00AAAA',
                  '#87CEFA',
                  '#4169E1'
                ],
                hoverBorderColor: [
                  '#00AAAA',
                  '#87CEFA',
                  '#4169E1'
                ],
              },
            ],
          };

          this.poseursChartLabels = _doughnutChartLabels;
          this.poseursChartData = _doughnutChartData;
        }
      });

    this.http.get<Array<any>>(this.cst.apiUrl + 'home/activite/' + this.dataType + '/' + dateFormate).subscribe(
      (arr: Array<any>) => {
        if (arr.length === 0) {
          $("#activites").html("Aucune donnée")
          $("#activitesChart").hide()
        }
        else {
          $("#activites").html("")
          $("#activitesChart").show()
          this.activitesData = [[], [], []]
          for (let el of arr) {
            this.activitesData[0].push(el.libelle)
            this.activitesData[1].push(el.nb_activite)
            this.activitesData[2].push("blue")
          }
          const colorList = [
            { libelle: 'MO Menuiserie', color: '#B0C4DE' },
            { libelle: 'MO Agencement', color: '#ADD8E6' },
            { libelle: 'MO Platrerie - Enduit', color: '#87CEBB' },
            { libelle: 'MO Cloison', color: '#87CEFA' },
            { libelle: 'MO Faux-plafond', color: '#1E90FF' },
            { libelle: 'MO Peinture', color: '#4169E1' },
            { libelle: 'MO Sol', color: '#00008B' },
            { libelle: 'MO Electricité', color: '#000055' },
            { libelle: 'MO Plomberie', color: '#0000CD' },
            { libelle: 'MO Manutention', color: '#00AAAA' },
            { libelle: 'MO Multilots', color: '#5555FF' },
            { libelle: 'MO Atelier', color: '#55AAFF' },
            { libelle: 'MO Livraison', color: '#0000FF' },
            { libelle: 'Intérimaire MO Menuiserie', color: '#00BFFF' },
            { libelle: 'Intérimaire MO Agencement', color: '#6495ED' },
            { libelle: 'Intérimaire MO Platrerie - Enduit', color: '#4682B4' },
            { libelle: 'Intérimaire MO Cloison', color: '#000080' },
            { libelle: 'Intérimaire MO Faux-plafond', color: '#0055FF' },
            { libelle: 'Intérimaire MO Peinture', color: '#057b6c' },
            { libelle: 'Intérimaire MO Sol', color: '#9999CC' },
            { libelle: 'Intérimaire MO Electricité - Plomberie', color: '#66CCCC' },
            { libelle: 'Intérimaire MO Manutention', color: '#6699CC' },
            { libelle: 'Intérimaire MO Multilots', color: '#33FFFF' },
            { libelle: 'MO études et travaux', color: '#003399' },
            { libelle: 'MO Chantier reprise anc Nav', color: '#AAAAFF' },
            { libelle: 'MO Atelier reprise anc Nav', color: '#5500AA' },
            { libelle: 'MO Intérimaire reprise anc Nav', color: '#55AAAA' }];
          var backgroundColor = [];
          for (let color of colorList)
            backgroundColor.push(color.color)

          var _doughnutChartLabels: string[] = this.activitesData[0];
          var _doughnutChartData: ChartData<'doughnut'> = {
            labels: _doughnutChartLabels,
            datasets: [
              {
                data: this.activitesData[1],
                backgroundColor: backgroundColor,
                hoverBackgroundColor: backgroundColor,
                hoverBorderColor: backgroundColor,
              },
            ],
          };

          console.log(_doughnutChartData);

          this.activitesChartLabels = _doughnutChartLabels;
          this.activitesChartData = _doughnutChartData;
        }
      });


  }

  //Action lors du bouton de semaine suivante , charge les données de la semaine suivante pour les afficher
  public semaineSuivante(): void {
    if (this.activitesChart !== null)
      this.activitesChart.destroy()
    if (this.typesChart !== null)
      this.typesChart.destroy()
    this.date.setDate(this.date.getDate() + 7);


    var dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd');
    localStorage.setItem('_lookingDate', dateFormate ?? '');

    this.loadData();
    this.ngOnInit()
  }

  //Action lors du bouton de semaine précédente , charge les données de la semaine précédente pour les afficher
  public semainePrecedente(): void {
    if (this.activitesChart !== null)
      this.activitesChart.destroy()
    if (this.typesChart !== null)
      this.typesChart.destroy()
    this.date.setDate(this.date.getDate() - 7);


    var dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd');
    localStorage.setItem('_lookingDate', dateFormate ?? '');

    this.loadData();
    this.ngOnInit()
  }

  public switchDataType(): void {
    if (this.dataType == 'perso')
      this.dataType = 'global';
    else
      this.dataType = 'perso';


    if (this.activitesChart !== null)
      this.activitesChart.destroy()
    if (this.typesChart !== null)
      this.typesChart.destroy()

    this.loadData();
  }
}
