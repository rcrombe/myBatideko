import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../constants';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ToastrService } from 'ngx-toastr';
import { DatePipe } from '@angular/common';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Chart, registerables, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

Chart.register(...registerables);
Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

@Component({
  selector: 'app-home-annee',
  templateUrl: './home-annee.component.html',
  styleUrls: ['./home-annee.component.css']
})
export class HomeAnneeComponent implements OnInit {
  // Data structures
  public typesData: [string[], number[], number[], number[], string[], string[], string[]] = [[], [], [], [], [], [], []];
  public vehiculesData: [string[], number[], string[]] = [[], [], []];
  public chantiersData: [string[], number[]] = [["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"], Array(12).fill(0)];
  public activitesDataLabels: string[] = [];
  public activitesDataDatasets: Array<{ label: string, data: number[], backgroundColor: string[], hoverBackgroundColor: string[], hoverBorderColor: string[], borderColor: string[], borderWidth: number }> = [];

  // Chart configurations
  public poseursChartData: ChartData<'bar'> | null = null;

  public poseursChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false }, title: { display: true, text: 'Mois' } },
      y: { grid: { display: true }, title: { display: true, text: 'Nombre de poseurs' }, suggestedMin: 0 },
    },
  };

  public poseursChartType: ChartType = 'bar';

  public activitesChartData: ChartData<'bar'> | null = null;
  public activitesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };
  public activitesChartType: ChartType = 'bar';

  public vehiculesChartData: ChartData<'bar'> | null = null;
  public vehiculesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };
  public vehiculesChartType: ChartType = 'bar';

  public chantiersChartData: ChartData<'line'> | null = null;
  public chantiersChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
      },
    },
  };
  public chantiersChartType: ChartType = 'line';

  // Variables
  public date = new Date();
  public annee!: string | null;
  public dataType: 'perso' | 'global' = 'perso';
  private utilisateur: any;
  public _nav_id: any;

  constructor(
    private http: HttpClient,
    private cst: Constants,
    private jwt: JwtHelperService,
    private toastr: ToastrService,
    private datePipe: DatePipe
  ) {
    const token = localStorage.getItem('token') || '';
    this.utilisateur = this.jwt.decodeToken(token);
    this._nav_id = this.utilisateur?.nav_id;
    if (!this._nav_id) this.dataType = 'global';
  }

  ngOnInit(): void {
    this.annee = this.datePipe.transform(this.date, 'yyyy');
    const dateFormate = this.datePipe.transform(this.date, 'yyyy-MM-dd');
    this.loadVehiculesData(dateFormate!);
    this.loadPoseursData(dateFormate!);
    this.loadActivitesData(dateFormate!);
    this.loadChantiersData(dateFormate!);
  }

  public semaineSuivante(): void {
    this.date.setFullYear(this.date.getFullYear() + 1); // Ajoute une année
    this.annee = this.datePipe.transform(this.date, 'yyyy'); // Met à jour l'année affichée
    this.ngOnInit(); // Recharge les données
  }

  public semainePrecedente(): void {
    this.date.setFullYear(this.date.getFullYear() - 1); // Soustrait une année
    this.annee = this.datePipe.transform(this.date, 'yyyy'); // Met à jour l'année affichée
    this.ngOnInit(); // Recharge les données
  }

  public switchDataType(): void {
    this.dataType = this.dataType === 'perso' ? 'global' : 'perso'; // Change le type de données
    this.ngOnInit(); // Recharge les données avec le nouveau type
  }

  private loadVehiculesData(date: string): void {
    // Charger les données des véhicules
    this.http.get<any[]>(`${this.cst.apiUrl}home-annee/vehicules_actifs/${date}`).subscribe((data) => {
      if (data.length === 0) {
        this.vehiculesChartData = null;
      } else {
        this.vehiculesData = [[], [], []];
        data.forEach((el) => {
          this.vehiculesData[0].push(el.nb_mois);
          this.vehiculesData[1].push(el.proportion * 100);
          this.vehiculesData[2].push("rgb(75, 192, 192)");
        });
        this.vehiculesChartData = {
          labels: this.vehiculesData[0],
          datasets: [
            {
              label: 'Pourcentage des véhicules actifs',
              data: this.vehiculesData[1],
              backgroundColor: this.vehiculesData[2],
              hoverBackgroundColor: this.vehiculesData[2],
              borderColor: this.vehiculesData[2],
              borderWidth: 1,
            },
          ],
        };
      }
    });
  }

  private loadPoseursData(date: string): void {
    this.http.get<any[]>(`${this.cst.apiUrl}home-annee/type/${this.dataType}/${date}`).subscribe((data) => {
      if (data.length === 0) {
        this.poseursChartData = null;
      } else {
        this.typesData = [[], [], [], [], [], [], []];
        data.forEach((el) => {
          if (!this.typesData[0].includes(el.nb_mois)) {
            this.typesData[0].push(el.nb_mois);
            this.typesData[1].push(0);
            this.typesData[2].push(0);
            this.typesData[3].push(0);
          }
          const index = this.typesData[0].indexOf(el.nb_mois);
          if (el.Type === 'SOUS TRAITANT') this.typesData[3][index] = el.nb_types;
          if (el.Type === 'SALARIE') this.typesData[2][index] = el.nb_types;
          if (el.Type === 'INTERIM') this.typesData[1][index] = el.nb_types;
        });

        this.poseursChartData = {
          labels: this.typesData[0],
          datasets: [
            { label: 'INTERIM', data: this.typesData[1], backgroundColor: "blue" },
            { label: 'SALARIE', data: this.typesData[2], backgroundColor: "rgb(17,131,173)" },
            { label: 'SOUS TRAITANT', data: this.typesData[3], backgroundColor: "rgb(75, 192, 192)" },
          ],
        };
      }
    });
  }

  private loadActivitesData(date: string): void {
    this.http.get<any[]>(`${this.cst.apiUrl}home-annee/activite/${this.dataType}/${date}`).subscribe((data) => {
      if (data.length === 0) {
        this.activitesChartData = null;
      } else {
        this.activitesDataLabels = [];
        this.activitesDataDatasets = [];

        const colorList = [
          { libelle: 'MO Menuiserie', color: '#B0C4DE' },
          { libelle: 'MO Agencement', color: '#ADD8E6' },
        ];

        data.forEach((el) => {
          if (!this.activitesDataLabels.includes(el.mois)) {
            this.activitesDataLabels.push(el.mois);
          }
        });

        data.forEach((el) => {
          let dataset = this.activitesDataDatasets.find((d) => d.label === el.libelle);
          if (!dataset) {
            const color = colorList.find((c) => c.libelle === el.libelle)?.color || '#CCCCCC';
            dataset = {
              label: el.libelle,
              data: new Array(this.activitesDataLabels.length).fill(0),
              backgroundColor: new Array(this.activitesDataLabels.length).fill(color),
              hoverBackgroundColor: new Array(this.activitesDataLabels.length).fill(color),
              hoverBorderColor: new Array(this.activitesDataLabels.length).fill(color),
              borderColor: new Array(this.activitesDataLabels.length).fill(color),
              borderWidth: 1,
            };
            this.activitesDataDatasets.push(dataset);
          }
          const index = this.activitesDataLabels.indexOf(el.mois);
          if (index !== -1) dataset.data[index] = el.nb_activite;
        });

        this.activitesChartData = {
          labels: this.activitesDataLabels,
          datasets: this.activitesDataDatasets,
        };
      }
    });
  }

  private loadChantiersData(date: string): void {
    this.http.get<any[]>(`${this.cst.apiUrl}home-annee/chantiers/${this.dataType}/${date}`).subscribe((data) => {
      if (data.length === 0) {
        this.chantiersChartData = null;
      } else {
        this.chantiersData[1] = Array(12).fill(0);
        data.forEach((el) => {
          if (el.nb_mois >= 1 && el.nb_mois <= 12) {
            this.chantiersData[1][el.nb_mois - 1] = el.nb_chantiers;
          }
        });

        this.chantiersChartData = {
          labels: this.chantiersData[0],
          datasets: [
            {
              label: 'Chantiers en cours',
              data: this.chantiersData[1],
              backgroundColor: 'rgb(75, 192, 192)',
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1.5,
              tension: 0.5,
            },
          ],
        };
      }
    });
  }
}
