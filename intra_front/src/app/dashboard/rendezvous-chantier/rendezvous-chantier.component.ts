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

interface RdvChantierBody {
  code_chantier: any;
  nom_chantier: any;
  heure: string;
  commentaires: any;
  annule: any;
}

interface RdvChantierItem {
  matricule_resource: any;
  Nom_matricule: any;
  semaine: RdvChantierBody[][];
}

@Component({
  selector: 'app-rendezvous-chantier',
  templateUrl: './rendezvous-chantier.component.html',
  styleUrls: ['./rendezvous-chantier.component.css']
})

export class RendezvousChantierComponent implements OnInit {
  private MODULE_ID = null;

  private utilisateur;
  public error = "";
  public rdv_chantier: RdvChantierItem[] = [];
  public chantiers: any[] = [];
  public date;
  public idSemaine!: number;
  public semaine: any;
  public dateStart!: string | null;
  public dateEnd!: string | null;
  public samedi: boolean = false;
  public pos = -1;
  public semaines: any = [];
  public conducteur: boolean = false;
  private _lookingDate;

  constructor(private route: ActivatedRoute, private http: HttpClient, private cst: Constants, private jwt: JwtHelperService, private toastr: ToastrService, private datePipe: DatePipe) {
    this.utilisateur = this.jwt.decodeToken(
      localStorage.getItem('token') ?? ''
    );
    this._lookingDate = localStorage.getItem('_lookingDate');

    this.MODULE_ID = route.snapshot.data['module_id'];

    if (this._lookingDate === null)
      this.date = new Date(Date.now());
    else
      this.date = new Date(this._lookingDate);
    this.loadData();
  }
  ngOnInit(): void {
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
    let rdv_chantier: RdvChantierItem[] = [];
    this.samedi = false;

    this.http.get<Array<any>>(this.cst.apiUrl + 'planning/semaines/' + this.date.getFullYear()).subscribe(
      (semaines: Array<any>) => {
        semaines.forEach((el) => {

          var dateStart = new Date(el.date_start);
          var dateEnd = new Date(el.date_end);
          var lookingDate = new Date(this._lookingDate || '1970-01-01');

          if (dateStart <= lookingDate && dateEnd >= lookingDate) {
            this.idSemaine = el.id;
          }
        })

        this.semaines = semaines;
      });

    this.http.get<Array<any>>(this.cst.apiUrl + 'planning/noms_chantiers').subscribe(
      (chantiers: Array<any>) => {
        this.chantiers = chantiers;
      });

    var dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd');
    this.http.get<Array<any>>(this.cst.apiUrl + 'rendezvous_chantier/' + dateFormate).subscribe(
      (arr: Array<any>) => {
        this.semaine = arr[0].nb_semaine;
        this.idSemaine = arr[0].id;
        this.dateStart = this.datePipe.transform(arr[0].date_start, 'dd' + '/' + 'MM' + '/' + 'yyyy');
        this.dateEnd = this.datePipe.transform(arr[0].date_end, 'dd' + '/' + 'MM' + '/' + 'yyyy');
        var today = new Date();
        today.setDate(today.getDate() + 7);
        this.conducteur = ((new Date(arr[0].date_end)).getTime() > today.getTime());

        for (let el of arr) {
          if (el.jour === 5 && el.heure !== null) this.samedi = true;
          var heure = ''
          if (el.heure !== null)
            heure = (el.heure).substr(0, 5)
          var body = {
            code_chantier: el.code_chantier,
            nom_chantier: el.nom_chantier,
            heure: heure,
            commentaires: el.commentaires,
            annule: el.annule,
          }
          var existe = false;
          for (let ass of rdv_chantier) {
            if (ass.matricule_resource === el.matricule_resource) {
              existe = true;
              if (
                el.heure !== null &&
                ass.semaine[el.jour].findIndex((i) => i.code_chantier === el.code_chantier) === -1
              ) {
                ass.semaine[el.jour].push(body);
              }
            }
          }
          if (!existe) {
            rdv_chantier.push({
              matricule_resource: el.matricule_resource,
              Nom_matricule: el.Nom,
              semaine: [[], [], [], [], [], []]
            });
            if (el.heure !== null) {
              rdv_chantier[rdv_chantier.length - 1].semaine[el.jour].push(body)
            }
          }
        }

        this.rdv_chantier = rdv_chantier;
      },
      error => this.error = error // error path
    );
  }

  public initCopierLigne(matricule_resource: any) {
    this.pos = this.rdv_chantier.map(function (e: { matricule_resource: any; }) { return e.matricule_resource; }).indexOf(matricule_resource)
  }

  public initModifierLigne(matricule_resource: any) {
    this.pos = this.rdv_chantier.map(function (e: { matricule_resource: any; }) { return e.matricule_resource; }).indexOf(matricule_resource)
  }

  public validerModificationLigne() {
    var pos = this.pos
    var rdv_chantier = this.rdv_chantier

    for (let i = 0; i < 6; i++) {
      const newChantierVal = $("#newChantier" + i).val();
      if (!newChantierVal) continue; // Passez à l'itération suivante si la valeur est undefined ou null

      const chantier = (newChantierVal as string).split('/')[0].trim();
      var index_chantier = this.chantiers.map(function (e: { code_chantier: any; }) { return e.code_chantier; }).indexOf(chantier)
      var heure = $("#newHeure" + i).val()

      if (index_chantier !== -1 && heure !== '') {
        const body = {
          matricule_resource: rdv_chantier[pos].matricule_resource,
          code_chantier: chantier,
          heure: heure,
          jour: i,
          id_semaine: this.idSemaine,
          commentaires: $("#newcommentaires" + i).val(),
          annule: ($("#newannule" + i).prop('checked') ? 1 : 0),
        }
        this.http.post(this.cst.apiUrl + 'rendezvous_chantier/creation', body).subscribe(
          prop => {
            if (prop) {
              $("#modificationLigne").modal('hide')
              this.pos = -1
            } else {
              this.toastr.error('Erreur !', this.cst.toastrTitle);
            }
          })
      }
      for (let attr of rdv_chantier[pos].semaine[i]) {
        var old_code_chantier = attr.code_chantier;
        var old_heure = attr.heure;
        var code_chantier_val = $("[id='" + "chantier" + i + attr.code_chantier + "']").val();
        if (!code_chantier_val) {
          code_chantier_val = '';
        }
        var code_chantier = (code_chantier_val as string).split('/')[0].trim();
        var heure = $('[id=\'' + "heure" + i + attr.code_chantier + '\']').val();
        var old_commentaires = attr.commentaires;
        var old_annule = attr.annule;
        var commentaires = $('[id=\'' + "commentaires" + i + attr.code_chantier + '\']').val();

        console.log('[id=\'' + "annule" + i + attr.code_chantier + '\']');
        console.log($('[id=\'' + "annule" + i + attr.code_chantier + '\']'));
        if (code_chantier == '') {
          this.http.delete(this.cst.apiUrl + 'rendezvous_chantier/supression/' +
            rdv_chantier[pos].matricule_resource + '/' + this.idSemaine + '/' + i + '/' + old_code_chantier + '/' + old_heure).subscribe(
              remove => {
                if (remove) {
                  $("#modificationLigne").modal('hide')
                  this.pos = -1
                }
              })
        }
        else if (old_heure != heure || old_code_chantier != code_chantier || old_commentaires != commentaires || old_annule != ($('[id=\'' + "annule" + i + attr.code_chantier + '\']').prop('checked') ? 1 : 0)) {
          const body = {
            matricule_resource: rdv_chantier[pos].matricule_resource,
            semaine: this.idSemaine,
            jour: i,
            code_chantier: code_chantier,
            heure: heure,
            old_code_chantier: old_code_chantier,
            commentaires: $('[id=\'' + "commentaires" + i + attr.code_chantier + '\']').val(),
            old_annule: old_annule,
            annule: ($('[id=\'' + "annule" + i + attr.code_chantier + '\']').prop('checked') ? 1 : 0),
          }
          this.http.put(this.cst.apiUrl + 'rendezvous_chantier/modifier_rdv', body).subscribe(
            prop => {
              console.log(prop);

              if (!prop) {
                this.toastr.error('Erreur !', this.cst.toastrTitle);
              }
              else {
                $("#modificationLigne").modal('hide')
                this.pos = -1
              }
            })

        }
        else {
          $("#modificationLigne").modal('hide')
          this.pos = -1
        }
      }
    }

    window.location.reload();
  }

  public initSuppression(matricule_resource: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node)) {
    $('#idAsupprimer').html(matricule_resource)
    var index = this.rdv_chantier.map(function (e: { matricule_resource: any; }) { return e.matricule_resource; }).indexOf(matricule_resource)
    $('#nomAsupprimer').html(this.rdv_chantier[index].Nom_matricule)
  }

  public supprimerRendezVous() {
    var matricule_resource = $('#idAsupprimer').html()
    this.http.delete(this.cst.apiUrl + 'rendezvous_chantier/supression_semaine/' +
      matricule_resource + '/' + this.idSemaine).subscribe(
        remove => {
          if (remove) {
            window.location.reload();
            $("#suppressionRendezVous").modal('hide')
          }
        })
  }
  public weekSelected(): void {
    const weekId = Number($('#weekSelector').val());
    if (isNaN(weekId)) {
      console.error('weekId n’est pas un nombre valide:', weekId);
      return; // Arrêtez l’exécution si weekId est invalide
    }
    const p = (e: { id: string | number | string[] | undefined }) =>
      e.id == weekId;
    var week = this.semaines[this.semaines.findIndex(p)];

    this.date = new Date(week.date_start);

    const dateFormate: string =
      this.datePipe.transform(this.date, 'yyyy-MM-dd') || '';
    localStorage.setItem('_lookingDate', dateFormate);

    this.idSemaine = weekId;
    window.location.reload();
  }

  //Action lors du bouton de semaine suivante , charge les données de la semaine suivante pour les afficher
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

  public copierSemainePrec() {
    var semaineAcopier = this.idSemaine - 1
    var semaine = this.idSemaine
    var rdv_chantier = this.rdv_chantier
    var pos = this.pos

    this.http.post(this.cst.apiUrl + 'rendezvous_chantier/copierSem/' + rdv_chantier[pos].matricule_resource + '/' + semaineAcopier + '/' + semaine, {}).subscribe(
      (prop) => {
        if (prop) {
          this.toastr.success('Succés !', this.cst.toastrTitle);
          $('#copierLigne').modal('hide');
          this.pos = -1
          window.location.reload();
        }
        else
          this.toastr.error('Erreur !', this.cst.toastrTitle);
      })
  }

  public myFunctionC(): void {
    // Déclare les variables
    let filter: string = (document.getElementById('parChantier') as HTMLInputElement)?.value.toUpperCase() || ''; // Conversion explicite en chaîne
    let table = document.getElementById("myTable");
    let tr = table?.getElementsByTagName("tr");
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
  }
}

