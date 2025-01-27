import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { Papa } from 'ngx-papaparse';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import get = Reflect.get;
import { Modal } from 'bootstrap';

interface ListDate {
  jour: number; // Par exemple : le jour de la semaine (0-6)
  date: string; // La date sous forme de chaîne
  semaine: number;
}

function encodeUTF8toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

@Component({
  selector: 'app-absences',
  templateUrl: './absences.component.html',
  styleUrls: ['./absences.component.css']
})
export class AbsencesComponent implements OnInit {
  private MODULE_ID = null;

  private utilisateur;
  public mois;
  public selectMonth: Date[] = [];
  public dateFormate!: string | null;
  public listDates: ListDate[] = [];
  public listeSemaines: { id: any; }[] = [];
  public dateEnd: any;
  public dateStart!: string;
  public idSemaine: any;
  public absences: any[] = [];
  public assignations_absences: any;

  public showEditModal = false;
  public showRemoveModal = false;


  constructor(private route: ActivatedRoute, private http: HttpClient, private cst: Constants,
    private jwt: JwtHelperService, private toastr: ToastrService, private datePipe: DatePipe, private papa: Papa) {

    this.MODULE_ID = route.snapshot.data['module_id'];

    this.utilisateur = this.jwt.decodeToken(
      localStorage.getItem('token') ?? ''
    );
    this.mois = new Date(Date.now());
    this.loadData();
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

  ngOnInit() {
  }

  public loadData() {
    this.showEditModal = false;
    this.showRemoveModal = false;

    var absences = [];
    var assignations_absences = [];
    this.dateFormate = this.datePipe.transform(this.mois, 'yyyy' + '-' + 'MM');

    this.http.get(this.cst.apiUrl + 'absences/temps/' + this.dateFormate).subscribe(
      (obj: any) => {
        var res = JSON.parse(obj);
        if (res.absences != null)
          this.absences = res.absences;

        var listDates = res.listDates;
        for (let el of listDates) {
          console.log(el);
          el.date = this.datePipe.transform(el.date, 'dd' + '/' + 'MM')
        }
        this.listDates = listDates;

        console.log(this.listDates);

        this.dateStart = res.listDates[0].dateStart;
        this.dateEnd = res.listDates[0].dateEnd;
        var body = {
          listMonth: JSON.stringify(res.listMonth),
          results: JSON.stringify(res.results),
          absences: JSON.stringify(this.absences),
        }
        this.listeSemaines = res.results;

        this.http.post(this.cst.apiUrl + 'absences/assignations', body).subscribe(
          (arr: any) => {
            // console.log(arr);
            this.assignations_absences = JSON.parse(arr);
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

  public dayChecked(semaine: number, matricule_resource: string, jour: number, particule: string, demi_jour: number) {
    if (!$("#" + particule + matricule_resource + '_' + semaine + '_' + jour + '_' + demi_jour).prop('checked')) {
      $("#" + particule + matricule_resource + '_' + semaine + '_5').prop('checked', false);
    }
  };

  public exportAbs() {
    this.http.get(this.cst.apiUrl + 'absences/export/' + this.mois.getFullYear()).subscribe(
      (arr: any) => {
        console.log('Réponse brute de l\'API :', arr);
        if (!arr || arr.length === 0) {
          console.error('La réponse est vide ou mal formatée.');
          return;
        }

        const months = ['Matricule', 'Nom', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

        const FILE = [];
        FILE.push(months);

        for (const el of arr) {
          const _tmp = [];
          _tmp.push(`${el.matricule_resource}`); // Matricule avec zéros préservés
          _tmp.push(el.nom); // Nom
          for (let i = 0; i < 12; i++) {
            _tmp.push(el.months[i] !== undefined ? el.months[i] : 0); // Remplir avec 0 si absent
          }
          FILE.push(_tmp);
        }

        console.log('Generated CSV Data:', FILE);

        const csvData = this.papa.unparse(FILE, { delimiter: ';' });
        const fname = `ABS-${this.mois.getFullYear()}.csv`;

        console.log('CSV Content:', csvData);

        // Appel de Download.save avec le CSV généré
        this.Download.save(csvData, fname);
      },
      (error) => {
        console.error('API Error:', error);
      }
    );
  }


  public filtrerMois(): void {
    const selectedMonthValue = $("#selectedMonth").val();
    console.log("Valeur de selectedMonth : " + selectedMonthValue + " Type de selectedMonth : " + typeof selectedMonthValue);

    if (typeof selectedMonthValue !== 'string') {
      console.error("La valeur de #selectedMonth est invalide ou n'a pas été sélectionnée.");
      this.toastr.error("Type de date invalide !", this.cst.toastrTitle);
      return;
    }

    const year = Number(selectedMonthValue.substring(3, 7)); // Capture "2024"
    const month = Number(selectedMonthValue.substring(0, 2)) - 1; // Capture "12" et ajuste pour 0-indexé
    const date = new Date(year, month);

    console.log(date);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 2020 && date.getFullYear() <= 2050) {
      this.mois = new Date(date);
      this.loadData();
    } else {
      this.toastr.error("Date non valide !", this.cst.toastrTitle);
    }
  }

  public weekChecked(week: string, matricule: string, particule: string) {
    var check = true
    var jour = 0
    while (check && jour < 5) {
      if (!$("#" + particule + matricule + '_' + week + '_' + jour + '_0').prop('checked')) {
        check = false
        jour += 1
      }
      else if (!$("#" + particule + matricule + '_' + week + '_' + jour + '_1').prop('checked')) {
        check = false
        jour += 1
      }
      else
        jour += 1
    }
    if (check) {
      for (let i = 0; i < 5; i++) {
        $("#" + particule + matricule + '_' + week + '_' + i + '_0').prop('checked', false);
        $("#" + particule + matricule + '_' + week + '_' + i + '_1').prop('checked', false);
      }
      $("#" + particule + matricule + '_' + week + '_' + 5).prop('checked', false)
    }
    else {
      for (let i = 0; i < 5; i++) {
        $("#" + particule + matricule + '_' + week + '_' + i + '_0').prop('checked', true);
        $("#" + particule + matricule + '_' + week + '_' + i + '_1').prop('checked', true);
      }
      $("#" + particule + matricule + '_' + week + '_' + 5).prop('checked', true)
    }

  }

  public myFunction(myInput: string, myTable: string): void {
    // Declare variables
    var input = document.getElementById(myInput) as HTMLInputElement | null;
    var table, tr, td, i, txtValue, filter;

    // Vérifier si l'input existe
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


  public initSuppressionAbsences() {
    this.showRemoveModal = true;

    for (let res of this.assignations_absences) {
      for (let sem = 0; sem < 6; sem++) {
        for (let jour = 0; jour < 7; jour++) {
          $("#suppr" + res.matricule_resource + '_' + sem + '_' + jour + '_0').prop('checked', false)
          $("#suppr" + res.matricule_resource + '_' + sem + '_' + jour + '_1').prop('checked', false)
        }
      }
    }
  }

  public initAttributionAbsences() {
    $("#absence").val('');
    $("#inputModif").val('');

    if (this.showEditModal)
      this.resetTable('tableModifs');

    this.showEditModal = true;

    for (let res of this.assignations_absences) {
      for (let sem = 0; sem < 6; sem++) {
        for (let jour = 0; jour < 7; jour++) {
          $("#" + res.matricule_resource + '_' + sem + '_' + jour + '_0').prop('checked', false)
          $("#" + res.matricule_resource + '_' + sem + '_' + jour + '_1').prop('checked', false)
        }
      }
    }
    //this.resetTable('tableModifs');
  }

  public attribuerFeries() {
    console.log(this.listDates);

    var year = this.datePipe.transform(this.mois, 'yyyy');


    this.http.get<Array<any>>('https://calendrier.api.gouv.fr/jours-feries/metropole/' + year + '.json').subscribe(
      (obj: Array<any>) => {
        console.log(obj);

        var feries = Object.keys(obj);

        this.listDates.forEach((el) => {
          if (el.jour < 5) {
            var str = el.date.split('/');
            var s = year + '-' + str[1] + '-' + str[0];

            if (feries.includes(s)) {
              console.log("FERIE ! : " + s);
              //C'est parti, code : FERIE
              var datas = new Array();
              for (let res of this.assignations_absences) {
                var matricule = res.matricule_resource

                console.log(res);
                var absMalade = false;

                if (res.mois[el.semaine][el.jour][0] !== undefined && res.mois[el.semaine][el.jour][0].code_absence == 'ABSMAL')
                  absMalade = true;
                if (res.mois[el.semaine][el.jour][1] !== undefined && res.mois[el.semaine][el.jour][1].code_absence == 'ABSMAL')
                  absMalade = true;

                if (!absMalade) {
                  datas.push({
                    matricule: matricule,
                    code_absence: 'FERIE',
                    jour: el.jour,
                    semaine: this.listeSemaines[el.semaine].id,
                    journee: 0
                  });
                }
              }
              if (datas.length > 0) {
                const body = {
                  listAttributions: JSON.stringify(datas)
                }
                this.http.post(this.cst.apiUrl + 'absences/attribution_absence', body).subscribe(
                  prop => {
                    if (!prop) {
                      this.toastr.error('Erreur !', this.cst.toastrTitle);
                    } else {
                      this.loadData()
                    }
                  });
              }

            }
          }
        });
      });
  }

  public resetTable(myTable: string): void {
    // Declare variables
    var input, filter, table, tr, td, i, txtValue;
    table = document.getElementById(myTable);

    // Vérifie si la table existe
    if (!table) {
      console.error(`Table with ID '${myTable}' not found.`);
      return;
    }

    tr = table.getElementsByTagName("tr");

    // Parcourir toutes les lignes et les afficher
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[0];
      if (td) {
        tr[i].style.display = ""; // Affiche la ligne
      }
    }
  }

  public attribuerAbsences() {
    var indexAbs = this.absences.map(function (e: { description: any; }) { return e.description; }).indexOf($("#absence").val())

    if (indexAbs === -1) {
      this.toastr.error('Champs absence requis !', this.cst.toastrTitle);
      return;
    }

    var datas = new Array();

    for (let res of this.assignations_absences) {
      var matricule = res.matricule_resource
      for (let sem = 0; sem < 6; sem++) {
        for (let jour = 0; jour < 7; jour++) {

          if ($("#" + matricule + '_' + sem + '_' + jour + '_0').prop('checked')
            && $("#" + matricule + '_' + sem + '_' + jour + '_1').prop('checked')) {
            datas.push({
              matricule: matricule,
              code_absence: this.absences[indexAbs].code_absence,
              jour: jour,
              semaine: this.listeSemaines[sem].id,
              journee: 0
            });
          }
          else if ($("#" + matricule + '_' + sem + '_' + jour + '_0').prop('checked')) {
            datas.push({
              matricule: matricule,
              code_absence: this.absences[indexAbs].code_absence,
              jour: jour,
              semaine: this.listeSemaines[sem].id,
              journee: 1
            });
          }
          else if ($("#" + matricule + '_' + sem + '_' + jour + '_1').prop('checked')) {
            datas.push({
              matricule: matricule,
              code_absence: this.absences[indexAbs].code_absence,
              jour: jour,
              semaine: this.listeSemaines[sem].id,
              journee: 2
            });
          }
        }
      }
    }
    if (datas.length !== 0) {
      const body = {
        listAttributions: JSON.stringify(datas)
      }
      this.http.post(this.cst.apiUrl + 'absences/attribution_absence', body).subscribe(
        prop => {
          if (!prop) {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          } else {
            window.location.reload();
            $('#attributionAbsences').modal('hide');
          }
        });
    }
  }

  public supprimerAbsences() {

    var datas = new Array();
    var datasUpdate = new Array();

    for (let res of this.assignations_absences) {
      var matricule = res.matricule_resource
      for (let sem = 0; sem < 6; sem++) {
        for (let jour = 0; jour < 7; jour++) {
          if ($("#suppr" + matricule + '_' + sem + '_' + jour + '_0').prop('checked')
            && $("#suppr" + matricule + '_' + sem + '_' + jour + '_1').prop('checked')) {
            datas.push({
              matricule: matricule,
              jour: jour,
              semaine: this.listeSemaines[sem].id,
              journee: 0
            });
          }
          //attention si 0 alors suprimer 1 et ajouter 2
          else if ($("#suppr" + matricule + '_' + sem + '_' + jour + '_0').prop('checked')) {
            if (res.mois[sem][jour][1].code_absence === undefined) {
              datas.push({
                matricule: matricule,
                jour: jour,
                semaine: this.listeSemaines[sem].id,
                journee: 1
              });
            }
            else {
              datasUpdate.push({
                matricule: matricule,
                jour: jour,
                semaine: this.listeSemaines[sem].id,
                old_journee: 0,
                journee: 2
              });
            }
          }
          else if ($("#suppr" + matricule + '_' + sem + '_' + jour + '_1').prop('checked')) {
            if (res.mois[sem][jour][0].code_absence === undefined) {
              datas.push({
                matricule: matricule,
                jour: jour,
                semaine: this.listeSemaines[sem].id,
                journee: 2
              });
            }
            else {
              datasUpdate.push({
                matricule: matricule,
                jour: jour,
                semaine: this.listeSemaines[sem].id,
                old_journee: 0,
                journee: 1
              });
            }
          }
        }
      }
    }
    if (datas.length !== 0) {
      const body = {
        listDelete: JSON.stringify(datas)
      }
      this.http.post(this.cst.apiUrl + 'absences/supression_assignation', body).subscribe(
        remove => {
          if (!remove) {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
          else {
            window.location.reload();
            $('#suppressionAbsences').modal('hide');
          }
        });
    }
    if (datasUpdate.length !== 0) {
      const bodyUpdate = {
        listUpdate: JSON.stringify(datasUpdate)
      }
      this.http.put(this.cst.apiUrl + 'absences/modif_assignation', bodyUpdate).subscribe(
        remove => {
          if (!remove) {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
          else {
            window.location.reload();
            $('#suppressionAbsences').modal('hide');
          }
        });
    }

  }

  public modalAbsence(abs: { couleur: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); code_absence: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); description: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); type: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); }) {
    $("#modifColor").val(abs.couleur);
    $("#modifCode").val(abs.code_absence)
    $("#modifDescription").val(abs.description)
    $("#modifAssociation").val(abs.type)
  }


  public formatDate(el: string | number | Date) {
    var date_start = new Date(el);
    var year = date_start.getFullYear();
    var month = (date_start.getMonth() + 1) >= 10 ? (date_start.getMonth() + 1) : ("0" + (date_start.getMonth() + 1));
    var day = date_start.getDate() >= 10 ? date_start.getDate() : ("0" + date_start.getDate());

    return year + "-" + month + "-" + day;
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

  public Download = {
    click: function (node: HTMLElement) {
      const ev = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      return node.dispatchEvent(ev);
    },
    encode: function (data: string) {
      // Supprimez l'encodage Base64 et utilisez des données brutes UTF-8
      return 'data:text/csv;charset=utf-8,\ufeff' + data;
    },
    link: function (data: string, name: string) {
      const a = document.createElement('a');
      a.download = name || self.location.pathname.slice(self.location.pathname.lastIndexOf('/') + 1);
      a.href = data || self.location.href;
      return a;
    },
    save: function (data: string, name: string) {
      this.click(
        this.link(this.encode(data), name)
      );
    }
  };
}
