import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { DatePipe } from '@angular/common';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import get = Reflect.get;
import { Modal } from 'bootstrap';


@Component({
  selector: 'app-planning-par-chantier',
  templateUrl: './planning-par-chantier.component.html',
  styleUrls: ['./planning-par-chantier.component.css']
})
export class PlanningParChantierComponent implements OnInit {
  private utilisateur;
  public error = "";
  public resources: any;
  public chantiers: any[] = [];
  public assignations: any;
  public id: any;
  public semaine: any;
  public idSemaine!: number;
  public dateFormate!: string | null;
  public dateStart!: string | null;
  public dateEnd!: string | null;
  public date;
  public samedi = false;
  public salarieCuppens = true;
  public interims = true;
  public sous_traitant = true;
  private _lookingDate;

  constructor(private http: HttpClient, private cst: Constants, private jwt: JwtHelperService,
    private toastr: ToastrService, private datePipe: DatePipe) {
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

  ngOnInit() {
  }

  public loadData() {
    var chantiers: {
      code_chantier: any;
      nom_chantier: any;
      conducteur: any;
      semaine: { matricule_resource: any; nom: any; chef_chantier: string; }[][];
    }[] = [];
    this.samedi = false;
    this.dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd');

    this.http.get<Array<any>>(this.cst.apiUrl + 'assignations' + '/' + this.dateFormate).subscribe(
      (arr: Array<any>) => {
        this.semaine = arr[0].nb_semaine;
        this.idSemaine = arr[0].id;
        this.dateStart = this.datePipe.transform(arr[0].date_start, 'dd' + '/' + 'MM' + '/' + 'yyyy')
        this.dateEnd = this.datePipe.transform(arr[0].date_end, 'dd' + '/' + 'MM' + '/' + 'yyyy')
        for (let el of arr) {
          if (el.Type === 'SALARIE' && this.salarieCuppens && el.type_assignation === 'chantier') {
            if (el.jour === 5) this.samedi = true
            var bodyS = {
              matricule_resource: el.matricule_resource,
              nom: el.Nom,
              chef_chantier: el.chef_chantier
            }
            var indexChantier = chantiers.map(function (e) {
              return e.code_chantier;
            }).indexOf(el.code_chantier)
            if (indexChantier !== -1) {
              if (chantiers[indexChantier].semaine[el.jour].map(function (e: { matricule_resource: any; }) {
                return e.matricule_resource;
              }).indexOf(el.matricule_resource) === -1)
                chantiers[indexChantier].semaine[el.jour].push(bodyS)
            }
            else {
              chantiers.push({
                code_chantier: el.code_chantier,
                nom_chantier: el.nom_chantier,
                conducteur: el.Conducteur,
                semaine: [[], [], [], [], [], []]
              });
              if (chantiers[chantiers.length - 1].semaine[el.jour].map(function (e: { matricule_resource: any; }) {
                return e.matricule_resource;
              }).indexOf(el.matricule_resource) === -1)
                chantiers[chantiers.length - 1].semaine[el.jour].push(bodyS)
            }
          }
          if ((el.Type === 'INTERIM' || el.Type === 'STAGIAIRE') && this.interims && el.type_assignation === 'chantier') {
            if (el.jour === 5) this.samedi = true
            var bodyI = {
              matricule_resource: el.matricule_resource,
              nom: el.Nom,
              chef_chantier: el.chef_chantier
            }
            var indexChantier = chantiers.map(function (e) {
              return e.code_chantier;
            }).indexOf(el.code_chantier)
            if (indexChantier !== -1) {
              if (chantiers[indexChantier].semaine[el.jour].map(function (e: { matricule_resource: any; }) {
                return e.matricule_resource;
              }).indexOf(el.matricule_resource) === -1)
                chantiers[indexChantier].semaine[el.jour].push(bodyI)
            }
            else {
              chantiers.push({
                code_chantier: el.code_chantier,
                nom_chantier: el.nom_chantier,
                conducteur: el.Conducteur,
                semaine: [[], [], [], [], [], []]
              });
              if (chantiers[chantiers.length - 1].semaine[el.jour].map(function (e: { matricule_resource: any; }) {
                return e.matricule_resource;
              }).indexOf(el.matricule_resource) === -1)
                chantiers[chantiers.length - 1].semaine[el.jour].push(bodyI)
            }
          }
          if (el.type_assignation === 'fantome') {
            if (el.jour === 5) this.samedi = true
            var bodyF = {
              matricule_resource: el.matricule_resource,
              nom: el.Nom,
              chef_chantier: 'FANTOME'
            }
            var indexChantier = chantiers.map(function (e) {
              return e.code_chantier;
            }).indexOf(el.code_chantier)
            if (indexChantier !== -1) {
              if (chantiers[indexChantier].semaine[el.jour].map(function (e: { matricule_resource: any; }) {
                return e.matricule_resource;
              }).indexOf(el.matricule_resource) === -1)
                chantiers[indexChantier].semaine[el.jour].push(bodyF)
            }
            else {
              chantiers.push({
                code_chantier: el.code_chantier,
                nom_chantier: el.nom_chantier,
                conducteur: el.Conducteur,
                semaine: [[], [], [], [], [], []]
              });
              if (chantiers[chantiers.length - 1].semaine[el.jour].map(function (e: { matricule_resource: any; }) {
                return e.matricule_resource;
              }).indexOf(el.matricule_resource) === -1)
                chantiers[chantiers.length - 1].semaine[el.jour].push(bodyF)
            }
          }
        }


        var sortedArray = chantiers.sort((n1, n2) => {
          return this.naturalCompare(n1.code_chantier, n2.code_chantier)
        })
        console.log(sortedArray);
      },
      error => this.error = error // error path
    );
    if (this.sous_traitant) {
      this.http.get<Array<any>>(this.cst.apiUrl + 'planning_st/assignations_st/impression' + '/' + this.dateFormate).subscribe(
        (arr: Array<any>) => {
          for (let el of arr) {
            if (el.jour === 5)
              this.samedi = true
            var bodyST = {
              matricule_resource: el.matricule_resource,
              nom: el.Nom,
              chef_chantier: 'ST'
            }
            //console.log(el);

            /*if(bodyST.nom == 'PCT')
              console.log(bodyST);*/

            var indexChantier = chantiers.map(function (e) {
              return e.code_chantier;
            }).indexOf(el.code_chantier)

            /*if(bodyST.nom == 'PCT'){
                console.log("index chantier : " + indexChantier);
                console.log(chantiers[indexChantier].semaine[el.jour].map(function(e) {
                    return e.matricule_resource; }).indexOf(el.matricule_resource))
            }*/

            if (indexChantier !== -1) {
              if (chantiers[indexChantier].semaine[el.jour].map(function (e: { matricule_resource: any; }) {
                return e.matricule_resource;
              }).indexOf(el.matricule_resource) === -1)
                chantiers[indexChantier].semaine[el.jour].push(bodyST)
            }
            else {
              chantiers.push({
                code_chantier: el.code_chantier,
                nom_chantier: el.nom_chantier,
                conducteur: el.Conducteur,
                semaine: [[], [], [], [], [], []]
              });
              if (chantiers[chantiers.length - 1].semaine[el.jour].map(function (e: { matricule_resource: any; }) {
                return e.matricule_resource;
              }).indexOf(el.matricule_resource) === -1)
                chantiers[chantiers.length - 1].semaine[el.jour].push(bodyST)
            }
          }
        },
        error => this.error = error // error path
      );
    }

    this.chantiers = chantiers;
  }

  private naturalCompare(a: { replace: (arg0: RegExp, arg1: (_: any, $1: any, $2: any) => void) => void; }, b: { replace: (arg0: RegExp, arg1: (_: any, $1: any, $2: any) => void) => void; }) {
    var ax: any[][] = [], bx: any[][] = [];

    a.replace(/(\d+)|(\D+)/g, function (_: any, $1: any, $2: any) { ax.push([$1 || Infinity, $2 || ""]) });
    b.replace(/(\d+)|(\D+)/g, function (_: any, $1: any, $2: any) { bx.push([$1 || Infinity, $2 || ""]) });

    while (ax.length && bx.length) {
      var an = ax.shift();
      var bn = bx.shift();

      if (an === undefined || bn === undefined) {
        break; // Arrêter la boucle si une valeur est indéfinie
      }
      var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
      if (nn) return nn;
    }

    return ax.length - bx.length;

    return ax.length - bx.length;
  }

  public imprimer() {
    var doc = new jsPDF('p', 'mm', 'a3');

    doc.setFontSize(18);
    doc.text(
      'Planning par chantier ' + ($('#date_planning').html()?.toLowerCase() || ''),
      80,
      8
    );
    doc.setFontSize(11);
    doc.setTextColor(100);

    (doc as any).autoTable({
      html: '#TableImprimer',
      theme: 'grid',
      styles: { halign: 'center' },
      didParseCell: function (data: {
        cell: { styles: any };
        row: { cells: { [key: string]: { content?: string; styles: { fontStyle: string } } } };
      }) {
        // Parcourir toutes les cellules de la ligne
        for (const key in data.row.cells) {
          if (data.row.cells.hasOwnProperty(key)) {
            const cell = data.row.cells[key];

            const regEx = /\d+/g;

            // Vérifiez si 'content' ou 'text' existe dans la cellule
            const cellText = cell.content || (cell as any).text || '';
            if (typeof cellText === 'string' && cellText.match(regEx)) {
              cell.styles.fontStyle = 'bold'; // Appliquer un style si le contenu correspond
            }
          }
        }
      },
    });

    // Ouvrir et sauvegarder le fichier PDF
    doc.output('dataurlnewwindow');
    doc.save('planningParChantierS' + this.idSemaine + '.pdf');
  }

  public salarie_cuppens() {
    if ($('#salaries_cuppens').prop('checked'))
      this.salarieCuppens = true
    else
      this.salarieCuppens = false
    this.loadData()
  }

  public interimaires() {
    if ($('#interims').prop('checked'))
      this.interims = true
    else
      this.interims = false
    this.loadData()
  }
  public sous_traitants() {
    if ($('#sous_traitant').prop('checked'))
      this.sous_traitant = true
    else
      this.sous_traitant = false
    this.loadData()
  }

  public myFunctionC(): void {
    // Déclare les variables
    let filter: string = (document.getElementById('parChantier') as HTMLInputElement)?.value.toUpperCase() || ''; // Conversion explicite en chaîne
    let table = document.getElementById("myTable");
    if (!table) {
      console.error("L'élément avec l'ID 'myTable' est introuvable.");
      return; // Arrêter l'exécution de la fonction si l'élément n'existe pas
    }

    let tr = table.getElementsByTagName("tr");
    if (!tr) return; // Vérifiez que les lignes existent avant de continuer

    for (let i = 1; i < tr.length; i++) {
      let success = false;
      let td = tr[i].getElementsByTagName("td");

      for (let k = 0; k < 6; k++) {
        if (td[k]) {
          let txtValue = td[k].textContent || td[k].innerText || ''; // Valeur sécurisée
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
            success = true;
            break; // Arrêtez la boucle dès qu'une correspondance est trouvée
          }
        }
      }
      tr[i].style.display = success ? "" : "none"; // Affiche ou cache la ligne
    }

    // Impression
    table = document.getElementById("TableImprimer");
    if (!table) {
      console.error("L'élément avec l'ID 'TableImprimer' est introuvable.");
      return; // Arrêtez la fonction si l'élément n'existe pas
    }
    tr = table.getElementsByTagName("tr");

    for (let i = 1; i < tr.length; i++) { // Ajoutez 'let' pour déclarer 'i'
      let success = false;
      for (let k = 0; k < 6; k++) { // Ajoutez 'let' ici également
        let td = tr[i].getElementsByTagName("td")[k];
        if (td) {
          let txtValue = td.textContent || td.innerText || "";
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
            success = true;
            break;
          }
        }
      }
      tr[i].style.display = success ? "" : "none";
    }
  }



  public semaineSuivante(): void {
    this.date.setDate(this.date.getDate() + 7);

    var dateFormate = this.datePipe.transform(this.date, 'yyyy-MM-dd');
    if (!dateFormate) {
      console.error('Erreur de formatage de la date');
      return; // Arrêtez l'exécution si `dateFormate` est null
    }

    localStorage.setItem('_lookingDate', dateFormate);
    this.loadData();
  }

  //Action lors du bouton de semaine précédente , charge les données de la semaine précédente pour les afficher
  public semainePrecedente(): void {
    if (this.idSemaine > 1) {
      this.date.setDate(this.date.getDate() - 7);

      var dateFormate = this.datePipe.transform(
        this.date,
        'yyyy' + '-' + 'MM' + '-' + 'dd'
      );
      if (!dateFormate) {
        console.error('Erreur de formatage de la date');
        return; // Arrêtez l'exécution si `dateFormate` est null
      }

      localStorage.setItem('_lookingDate', dateFormate);
      this.loadData();

      this.loadData();
    }
  }



}