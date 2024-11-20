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

interface VehiculeActif {
  nb_semaine: number;
  proportion: number;
}

@Component({
  selector: 'app-home-mois',
  templateUrl: './home-mois.component.html',
  styleUrls: ['./home-mois.component.css']
})
export class HomeMoisComponent implements OnInit {
  public typesData: [number[], [number[], string[]], [number[], string[]], [number[], string[]]] = [[], [[], []], [[], []], [[], []]];

  public vehiculesData: [number[], number[], string[]] = [[], [], []];
  public typesChart: Chart | null = null;
  public vehiculesChart: Chart | null = null;
  public activitesDataDatasets: { label: any; data: number[]; backgroundColor: string[]; hoverBackgroundColor: string[]; hoverBorderColor: string[]; borderColor: string[]; borderWidth: number; }[] = [];
  public activitesDataLabels: any[] = [];
  public activitesChart: Chart | null = null;
  public mois!: string | null; public date
  public dataType = 'perso';
  public _nav_id;
  public _lookingDate;


  private utilisateur;
  public error = "";


  // Poseurs
  public poseursChartLabels: number[] | null = null;
  public poseursChartData: ChartData<'bar'> | null = null;
  public poseursChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public poseursChartType: ChartType = 'bar';

  // Activités
  public activitesChartLabels: string[] | null = null;
  public activitesChartData: ChartData<'bar'> | null = null;
  public activitesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public activitesChartType: ChartType = 'bar';


  // Vehicules
  public vehiculesChartLabels: number[] | null = null;
  public vehiculesChartData: ChartData<'bar'> | null = null;
  public vehiculesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public vehiculesChartType: ChartType = 'bar';


  constructor(private http: HttpClient, private cst: Constants, private jwt: JwtHelperService,
    private toastr: ToastrService, private datePipe: DatePipe) {
    this.utilisateur = this.jwt.decodeToken(localStorage.getItem('token') || '');
    this._nav_id = this.utilisateur.nav_id;

    if (this._nav_id == null)
      this.dataType = 'global';
    var month: number = +(this.datePipe.transform(Date.now(), 'M') || '1');
    var year: number = +(this.datePipe.transform(Date.now(), 'y') || '2024');

    this._lookingDate = localStorage.getItem('_lookingDate');

    if (this._lookingDate === null)
      this.date = new Date(year, month - 1, 1);
    else
      this.date = new Date(this._lookingDate);

    this.loadData();

  }


  ngOnInit() {
    var dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd');
    this.mois = this.datePipe.transform(this.date, 'MMMM');
    this.http.get<Array<VehiculeActif>>(this.cst.apiUrl + 'home-mois/vehicules_actifs/' + dateFormate).subscribe(
      (arr: Array<VehiculeActif>) => {
        if (arr.length === 0) {
          $("#vehicules").html("Aucune donnée");
          $("#vehiculesChart").hide();
        } else {
          $("#vehicules").html("");
          $("#vehiculesChart").show();
          this.vehiculesData = [[], [], []];
          for (let el of arr) {
            this.vehiculesData[0].push(el.nb_semaine);
            this.vehiculesData[1].push(el.proportion * 100);
            this.vehiculesData[2].push("rgb(75, 192, 192)");
          }

          this.vehiculesChartLabels = this.vehiculesData[0];
          this.vehiculesChartData = {
            labels: this.vehiculesData[0],
            datasets: [{
              label: 'Pourcentage des véhicules actifs',
              data: this.vehiculesData[1],
              backgroundColor: this.vehiculesData[2],
              hoverBackgroundColor: this.vehiculesData[2],
              hoverBorderColor: this.vehiculesData[2],
              borderColor: this.vehiculesData[2],
              borderWidth: 1
            }]
          }
        }
      });
    this.http.get<Array<any>>(this.cst.apiUrl + 'home-mois/type/' + this.dataType + '/' + dateFormate).subscribe(
      (arr: Array<any>) => {
        console.log(arr)
        if (arr.length === 0) {
          $("#types").html("Aucune donnée")
          $("#typesChart").hide();
        }
        else {
          $("#types").html("")
          $("#typesChart").show();
          this.typesData = [[], [[], []], [[], []], [[], []]]
          for (let el of arr) {
            if (this.typesData[0].indexOf(el.nb_semaine) === -1) {
              this.typesData[0].push(el.nb_semaine)
              this.typesData[1][0].push(0)
              this.typesData[2][0].push(0)
              this.typesData[3][0].push(0)
              this.typesData[1][1].push("rgb(75, 192, 192)")
              this.typesData[2][1].push("rgb(70,130,180)")
              this.typesData[3][1].push("rgb(135,206,235)")
            }
            var index = this.typesData[0].indexOf(el.nb_semaine)
            if (el.Type === 'SOUS TRAITANT') {
              this.typesData[3][0][index] = (el.nb_types)
            } else if (el.Type === 'SALARIE') {
              this.typesData[2][0][index] = (el.nb_types)
            } else if (el.Type === 'INTERIM') {
              this.typesData[1][0][index] = (el.nb_types)
            }
          }

          this.poseursChartLabels = this.typesData[0];
          this.poseursChartData = {
            labels: this.typesData[0],
            datasets: [{
              label: 'INTERIM',
              data: this.typesData[1][0],
              backgroundColor: this.typesData[1][1],
              hoverBackgroundColor: this.typesData[1][1],
              hoverBorderColor: this.typesData[1][1],
              borderColor: this.typesData[1][1],
              borderWidth: 1
            },
            {
              label: 'SALARIE',
              data: this.typesData[2][0],
              backgroundColor: this.typesData[2][1],
              hoverBackgroundColor: this.typesData[2][1],
              hoverBorderColor: this.typesData[2][1],
              borderColor: this.typesData[2][1],
              borderWidth: 1
            },
            {
              label: 'SOUS TRAITANT',
              data: this.typesData[3][0],
              backgroundColor: this.typesData[3][1],
              hoverBackgroundColor: this.typesData[3][1],
              hoverBorderColor: this.typesData[3][1],
              borderColor: this.typesData[3][1],
              borderWidth: 1
            }]
          }
        }
      });

    this.http.get<Array<any>>(this.cst.apiUrl + 'home-mois/activite/' + this.dataType + '/' + dateFormate).subscribe(
      (arr: Array<any>) => {
        if (arr.length === 0) {
          $("#activites").html("Aucune donnée")
          $("#activitesChart").hide()
        }
        else {
          $("#activites").html("")
          $("#activitesChart").show()

          this.activitesDataLabels = []
          this.activitesDataDatasets = []
          const colorList = [
            { libelle: 'MO Menuiserie', color: '#B0C4DE' },
            { libelle: 'MO Agencement', color: '#ADD8E6' },
            { libelle: 'MO Platrerie - Enduit', color: '#87CEEB' },
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
            { libelle: 'MO Intérimaire reprise anc Nav', color: '#55AAAA' }]
          for (let el of arr) {
            if (this.activitesDataLabels.indexOf(el.nb_semaine) === -1) {
              this.activitesDataLabels.push(el.nb_semaine)
            }
          }
          for (let el of arr) {
            if (this.activitesDataDatasets.map(function (e: { label: any; }) {
              return e.label;
            }).indexOf(el.libelle) === -1) {
              var data = []
              var indexColor = colorList.map(function (e) { return e.libelle; }).indexOf(el.libelle)
              var background = []
              if (indexColor !== -1) {
                for (let semaine of this.activitesDataLabels) {
                  data.push(0)
                  background.push(colorList[indexColor].color)
                }
                this.activitesDataDatasets.push({
                  label: el.libelle,
                  data: data,
                  backgroundColor: background,
                  hoverBackgroundColor: background,
                  hoverBorderColor: background,
                  borderColor: background,
                  borderWidth: 1
                })
              }
            }
            for (let data of this.activitesDataDatasets) {
              var index = this.activitesDataLabels.indexOf(el.nb_semaine)
              if (data.label === el.libelle)
                data.data[index] = (el.nb_activite)
              else if (!data.data[index]) {
                data.data.push(0)
                data.backgroundColor.push(data.backgroundColor[0])
                data.hoverBackgroundColor.push(data.backgroundColor[0])
                data.hoverBorderColor.push(data.backgroundColor[0])
                data.borderColor.push(data.backgroundColor[0])
              }
            }
          }

          this.activitesChartLabels = this.activitesDataLabels;
          this.activitesChartData = {
            labels: this.typesData[0],
            datasets: this.activitesDataDatasets
          }
        }
      });

  }



  public loadData(): void {
  }

  public getRandomColor() {
    var color = Math.floor(0x1000000 * Math.random()).toString(16);
    return '#' + ('000000' + color).slice(-6);
  }
  //Action lors du bouton de semaine suivante , charge les données de la semaine suivante pour les afficher
  public semaineSuivante(): void {
    if (this.activitesChart !== null)
      this.activitesChart.destroy()
    if (this.typesChart !== null)
      this.typesChart.destroy()
    if (this.vehiculesChart !== null)
      this.vehiculesChart.destroy()
    this.date.setMonth(this.date.getMonth() + 1);
    this.loadData();
    this.ngOnInit()
  }

  //Action lors du bouton de semaine précédente , charge les données de la semaine précédente pour les afficher
  public semainePrecedente(): void {
    if (this.activitesChart !== null)
      this.activitesChart.destroy()
    if (this.typesChart !== null)
      this.typesChart.destroy()
    if (this.vehiculesChart !== null)
      this.vehiculesChart.destroy()
    this.date.setMonth(this.date.getMonth() - 1);
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
    if (this.vehiculesChart !== null)
      this.vehiculesChart.destroy()

    this.loadData();
    this.ngOnInit();
  }
}

