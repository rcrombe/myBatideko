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
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-planning-atelier',
  templateUrl: './planning-atelier.component.html',
  styleUrls: ['./planning-atelier.component.css']
})
export class PlanningAtelierComponent implements OnInit {

  private MODULE_ID = null;

  private utilisateur;

  public mois;
  public selectMonth: Date[] = [];
  public dateFormate!: string | null;
  public listDates: {
    jour: any;
    semaine: any; date: string
  }[] = [];
  public listeSemaines: { id: any; }[] = [];
  public dateEnd: any;
  public dateStart!: string;
  public idSemaine: any;
  public statuts: any[] = [];
  public assignations_atelier: any;

  public showEditModal = false;
  public showRemoveModal = false;
  // x: any;

  constructor(private route: ActivatedRoute, private http: HttpClient, private cst: Constants,
    private jwt: JwtHelperService, private toastr: ToastrService, private datePipe: DatePipe) {
    this.utilisateur = this.jwt.decodeToken(
      localStorage.getItem('token') ?? ''
    );
    this.MODULE_ID = route.snapshot.data['module_id'];
    this.mois = new Date(Date.now());
    this.loadData();
  }

  ngOnInit(): void {
  }

  ngAfterViewChecked() {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public canRead(module: string | null) {
    return this.cst.canAccess_Read(this.utilisateur, (module == null ? this.MODULE_ID : module));
  }
  public canWrite(module: null) {
    return this.cst.canAccess_Write(this.utilisateur, (module == null ? this.MODULE_ID : module));
  }
  public canSpecial(module: null) {
    return this.cst.canAccess_Special(this.utilisateur, (module == null ? this.MODULE_ID : module));
  }

  public loadData() {
    this.showEditModal = false;
    this.showRemoveModal = false;

    var statuts = [];
    var assignations_atelier = [];
    this.dateFormate = this.datePipe.transform(this.mois, 'yyyy' + '-' + 'MM');

    this.http.get(this.cst.apiUrl + 'planning_atelier/temps/' + this.dateFormate).subscribe(
      (obj: any) => {
        var res = JSON.parse(obj);
        console.log(res)

        if (res.statuts != null)
          this.statuts = res.statuts;

        var listDates = res.listDates;
        for (let el of listDates) {
          el.date = this.datePipe.transform(el.date, 'dd' + '/' + 'MM')
        }
        this.listDates = listDates;
        console.log(listDates)

        this.dateStart = res.listDates[0].dateStart;
        this.dateEnd = res.listDates[0].dateEnd;
        var body = {
          listMonth: JSON.stringify(res.listMonth),
          results: JSON.stringify(res.results),
          statuts: JSON.stringify(this.statuts),
        }
        this.listeSemaines = res.results;

        this.http.post(this.cst.apiUrl + 'planning_atelier/assignations', body).subscribe(
          (arr: any) => {
            console.log(arr);
            this.assignations_atelier = JSON.parse(arr);

            console.log(this.assignations_atelier)
          });
      });

    var i = -6;
    var selectMonth = [];
    var mois = new Date(this.mois);
    mois.setMonth(mois.getMonth() - 6)
    for (let i = 0; i < 12; i++) {
      selectMonth.push(new Date(mois.setMonth(mois.getMonth() + 1)));
    }
    this.selectMonth = selectMonth;
  }

  public dayChecked(semaine: string, id_chantier_ouvrage: string, jour: string | number, particule: string) {
    if (!$("#" + particule + id_chantier_ouvrage + '_' + semaine + '_' + jour).prop('checked') && jour != 5) {
      $("#" + particule + id_chantier_ouvrage + '_' + semaine + '_5').prop('checked', false);
    }
    else if (!$("#" + particule + id_chantier_ouvrage + '_' + semaine + '_5').prop('checked') && jour == 5) {
      var allChecked = true;

      for (var i = 0; i < 5; i++) {
        if (!$("#" + particule + id_chantier_ouvrage + '_' + semaine + '_' + i).prop('checked'))
          allChecked = false;
      }

      console.log("AllChecked : " + allChecked)
      if (allChecked)
        for (var i = 0; i < 5; i++) {
          $("#" + particule + id_chantier_ouvrage + '_' + semaine + '_' + i).prop('checked', false);
        }
    }
    else if ($("#" + particule + id_chantier_ouvrage + '_' + semaine + '_5').prop('checked')) {
      for (var i = 0; i < 5; i++) {
        $("#" + particule + id_chantier_ouvrage + '_' + semaine + '_' + i).prop('checked', true);
      }
    }
  };

  public initAttributionStatuts() {
    $("#statut").val('');
    $("#inputModif").val('');

    if (this.showEditModal)
      this.resetTable('tableModifs');

    this.showEditModal = true;

    for (let res of this.assignations_atelier) {
      for (let sem = 0; sem < 6; sem++) {
        for (let jour = 0; jour < 6; jour++) {
          $("#" + res.id_chantier_ouvrage + '_' + sem + '_' + jour).prop('checked', false)
        }
      }
    }
    //this.resetTable('tableModifs');
  }

  public initSuppressionAttributions() {
    this.showRemoveModal = true;

    for (let res of this.assignations_atelier) {
      for (let sem = 0; sem < 6; sem++) {
        for (let jour = 0; jour < 6; jour++) {
          $("#suppr" + res.id_chantier_ouvrage + '_' + sem + '_' + jour).prop('checked', false)
        }
      }
    }
  }

  public resetTable(myTable: string): void {
    // Declare variables
    var input, filter, table, tr, td, i, txtValue;
    table = document.getElementById(myTable);

    if (!table) {
      console.error(`Table with ID '${myTable}' not found.`);
      return;
    }

    tr = table.getElementsByTagName("tr");

    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[0];
      if (td) {
        tr[i].style.display = "";
      }
    }
  }


  public attribuerStatuts() {
    var indexStatut = this.statuts.map(function (e: { libelle: any; }) { return e.libelle; }).indexOf($("#statut").val())

    if (indexStatut === -1) {
      this.toastr.error('Champ statut requis !', this.cst.toastrTitle);
      return;
    }

    var datas = new Array();

    for (let res of this.assignations_atelier) {
      var id_chantier_ouvrage = res.id_chantier_ouvrage;
      for (let sem = 0; sem < 6; sem++) {
        for (let jour = 0; jour < 5; jour++) {
          if ($("#" + id_chantier_ouvrage + '_' + sem + '_' + jour).prop('checked')) {
            datas.push({
              id_chantier_ouvrage: id_chantier_ouvrage,
              statut: this.statuts[indexStatut].id,
              jour: jour,
              semaine: this.listeSemaines[sem].id
            });
          }
        }
      }
    }
    if (datas.length !== 0) {
      const body = {
        listAttributions: JSON.stringify(datas)
      }
      this.http.post(this.cst.apiUrl + 'planning_atelier/attribution_statut', body).subscribe(
        prop => {
          if (!prop) {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          } else {
            this.loadData()
            $('#attributionStatut').modal('hide');
          }
        });
    }
  }
  public supprimerAttributions() {

    var datas = new Array();
    var datasUpdate = new Array();

    for (let res of this.assignations_atelier) {
      var id_chantier_ouvrage = res.id_chantier_ouvrage
      for (let sem = 0; sem < 6; sem++) {
        for (let jour = 0; jour < 6; jour++) {
          if ($("#suppr" + id_chantier_ouvrage + '_' + sem + '_' + jour).prop('checked')) {
            datas.push({
              id_chantier_ouvrage: id_chantier_ouvrage,
              jour: jour,
              semaine: this.listeSemaines[sem].id
            });
          }
        }
      }
    }
    if (datas.length !== 0) {
      const body = {
        listDelete: JSON.stringify(datas)
      }
      this.http.post(this.cst.apiUrl + 'planning_atelier/supression_assignation', body).subscribe(
        remove => {
          if (!remove) {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
          else {
            this.loadData()
            $('#suppressionAttributions').modal('hide');
          }
        });
    }

  }
  //Action lors du bouton de semaine suivante , charge les données de la semaine suivante pour les afficher
  public semaineSuivante(): void {

    var m = this.mois.getMonth();


    console.log("From : " + m);

    this.mois.setDate(15);
    this.mois.setMonth(m + 1);

    console.log("To : " + this.mois.getMonth());

    this.loadData();
  }

  //Action lors du bouton de semaine précédente , charge les données de la semaine précédente pour les afficher
  public semainePrecedente(): void {
    if (this.dateStart !== '04/01/2021') {

      this.mois.setDate(15);
      this.mois.setMonth(this.mois.getMonth() - 1);
      this.loadData();
    }
  }

  public toHHMM(secs: string) {
    var sec_num = parseInt(secs, 10)
    var hours = Math.floor(sec_num / 3600)
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60

    return [hours, minutes]
      .map(v => v < 10 ? "0" + v : v)
      //.filter((v,i) => v !== "00" || i > 0)
      .join(":")
  }

  public filtrerMois(): void {
    const selectedMonthValue = $("#selectedMonth").val();

    if (typeof selectedMonthValue !== 'string') {
      console.error("La valeur de #selectedMonth est invalide ou n'a pas été sélectionnée.");
      this.toastr.error("Date non valide !", this.cst.toastrTitle);
      return;
    }

    const year = Number(selectedMonthValue.substr(3, 4));
    const month = Number(selectedMonthValue.substr(0, 2)) - 1;
    const date = new Date(year, month);

    if (!isNaN(date.getTime()) && date.getFullYear() >= 2020 && date.getFullYear() <= 2050) {
      this.mois = new Date(date);
      this.loadData();
    } else {
      this.toastr.error("Date non valide !", this.cst.toastrTitle);
    }
  }

  public myFunction(myInput: string, myTable: string): void {
    // Declare variables
    var input = document.getElementById(myInput) as HTMLInputElement | null;
    var table, tr, td, i, txtValue, filter;

    if (!input) {
      console.error(`Element with ID '${myInput}' not found.`);
      return;
    }

    filter = input.value.toUpperCase();

    table = document.getElementById(myTable);
    if (!table) {
      console.error(`Table with ID '${myTable}' not found.`);
      return;
    }

    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[0];
      if (td) {
        txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }
  }

}
