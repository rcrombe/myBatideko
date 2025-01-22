import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
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

interface Assignation {
  matricule_resource: string;
  Nom_matricule: string;
  semaine: Array<Array<{
    code_chantier: any;
    nom_chantier: any;
    commentaires: any;
    conducteur: any;
    conducteur_couleur: string;
  }>>;
}
@Component({
  selector: 'app-planning-sous-traitant',
  templateUrl: './planning-sous-traitant.component.html',
  styleUrls: ['./planning-sous-traitant.component.css']
})
export class PlanningSousTraitantComponent implements OnInit {
  private MODULE_ID = null;

  private utilisateur;
  public error = "";
  public assignations: any;
  public assignations_fantome: any[] = [];
  public id!: string;
  public idCliques: { matricule: string; nom: any }[] = [];
  public assAmodifier: boolean | { semaine: any[][]; matricule_resource: string; Nom_matricule: string } = false;
  // public assAmodifier = false;
  public url!: string;
  public date;
  public idSemaine!: number;
  public dateFormate!: string | null;
  public semaine: any;
  public dateStart!: string | null;
  public dateEnd!: string | null;
  public chantiers: any[] = [];
  public activites: any[] = [];
  public samedi = false;
  public conducteur: boolean = false;
  public semaines: any[] = [];
  private _lookingDate: Date;
  private conducteurs: any[] = [];
  public pos!: number;
  absences: any;

  constructor(route: ActivatedRoute, private http: HttpClient, private cst: Constants,
    private jwt: JwtHelperService, private toastr: ToastrService, private datePipe: DatePipe) {
    this.utilisateur = this.jwt.decodeToken(
      localStorage.getItem('token') ?? ''
    );
    this.MODULE_ID = route.snapshot.data['module_id'];
    const lookingDateString = localStorage.getItem('_lookingDate');
    if (lookingDateString && !isNaN(Date.parse(lookingDateString))) {
      this._lookingDate = new Date(lookingDateString); // Conversion valide
    } else {
      this._lookingDate = new Date(); // Valeur par défaut (date actuelle)
    }

    if (this._lookingDate === null)
      this.date = new Date(Date.now());
    else
      this.date = new Date(this._lookingDate);
    this.loadData();
  }

  ngOnInit() {
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

  public hasAssigns(semaine: string | any[]) {
    for (var x = 0; x < semaine.length; x++) {
      if (semaine[x].length > 0)
        return true;
    }
    return false;
  }

  get nomMatricule(): string {
    if (typeof this.assAmodifier === 'object' && this.assAmodifier !== null) {
      return this.assAmodifier.Nom_matricule;
    }
    return '';
  }

  get week(): any[][] {
    if (typeof this.assAmodifier === 'object' && this.assAmodifier !== null) {
      return this.assAmodifier.semaine;
    }
    return [];
  }

  get matriculeResource(): string {
    if (typeof this.assAmodifier === 'object' && this.assAmodifier !== null) {
      return this.assAmodifier.matricule_resource;
    }
    return '';
  }

  //chargement des données du tableau à afficher
  public loadData() {
    let assignations: Assignation[] = [];
    let assignations_fantome: Assignation[] = [];
    this.samedi = false;
    this.assAmodifier = false

    this.http.get<Array<any>>(this.cst.apiUrl + 'planning/semaines/' + this.date.getFullYear()).subscribe(
      (semaines: Array<any>) => {
        semaines.forEach((el) => {

          var dateStart = new Date(el.date_start);
          var dateEnd = new Date(el.date_end);
          var lookingDate = new Date(this._lookingDate);

          if (dateStart <= lookingDate && dateEnd >= lookingDate) {
            this.idSemaine = el.id;
          }
        })

        this.semaines = semaines;
      });
    this.http.get<Array<any>>(this.cst.apiUrl + 'conducteurs').subscribe(
      (conducteurs: Array<any>) => {
        this.conducteurs = conducteurs;
      });
    this.http.get<Array<any>>(this.cst.apiUrl + 'planning_st/noms_chantiers').subscribe(
      (chantiers: Array<any>) => {
        this.chantiers = chantiers;
      });
    this.http.get<Array<any>>(this.cst.apiUrl + 'planning_st/activites').subscribe(
      (arr: Array<any>) => {
        this.activites = arr;
      });

    this.dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd');
    this.http.get<Array<any>>(this.cst.apiUrl + 'planning_st/assignations_st/' + this.dateFormate).subscribe(
      (arr: Array<any>) => {
        this.semaine = arr[0].nb_semaine;
        this.idSemaine = arr[0].id_semaine;
        this.dateStart = this.datePipe.transform(arr[0].date_start, 'dd' + '/' + 'MM' + '/' + 'yyyy');
        this.dateEnd = this.datePipe.transform(arr[0].date_end, 'dd' + '/' + 'MM' + '/' + 'yyyy');
        var today = new Date();
        today.setDate(today.getDate() + 7);
        this.conducteur = ((new Date(arr[0].date_end)).getTime() > today.getTime());
        for (let el of arr) {
          if (el.type_assignation === "ST") {
            if (el.jour === 5 && el.jour !== null) this.samedi = true;


            var predicat = (e: { initiales: any; }) => e.initiales == el.Conducteur;
            var idxArray = this.conducteurs.findIndex(predicat);
            var color = "#36b9cc";

            if (idxArray !== -1)
              color = this.conducteurs[idxArray].couleur;

            var body = {
              code_chantier: el.code_chantier,
              nom_chantier: el.nom_chantier,
              commentaires: el.commentaires,
              conducteur: el.Conducteur,
              conducteur_couleur: color
            }
            var existe = false;
            for (let ass of assignations) {
              if (ass.matricule_resource === el.id) {
                existe = true;
                if (el.jour !== null
                  && ass.semaine[el.jour].findIndex((i: { code_chantier: any; }) => i.code_chantier === el.code_chantier) === -1) {
                  ass.semaine[el.jour].push(body)
                }
              }
            }
            if (!existe) {
              assignations.push({
                matricule_resource: el.id,
                Nom_matricule: el.Nom,
                semaine: [[], [], [], [], [], []]
              });
              if (el.jour !== null) {
                assignations[assignations.length - 1].semaine[el.jour].push(body)
              }
            }
          }
          else {
            if (el.jour === 5 && el.jour !== null) this.samedi = true;

            var predicat = (e: { initiales: any; }) => e.initiales == el.Conducteur;
            var idxArray = this.conducteurs.findIndex(predicat);
            var color = "#36b9cc";

            if (idxArray !== -1)
              color = this.conducteurs[idxArray].couleur;

            var body_f = {
              code_chantier: el.code_chantier,
              nom_chantier: el.nom_chantier,
              commentaires: el.commentaires,
              conducteur: el.Conducteur,
              conducteur_couleur: color
            }
            var existe = false;
            for (let ass of assignations_fantome) {
              if (ass.matricule_resource === el.id) {
                existe = true;
                if (el.jour !== null
                  && ass.semaine[el.jour].findIndex((i: { code_chantier: any; }) => i.code_chantier === el.code_chantier) === -1) {
                  ass.semaine[el.jour].push(body_f);
                }
              }
            }
            if (!existe) {
              assignations_fantome.push({
                matricule_resource: el.id,
                Nom_matricule: el.Nom,
                semaine: [[], [], [], [], [], []]
              });
              if (el.jour !== null) {
                assignations_fantome[assignations_fantome.length - 1].semaine[el.jour].push(body_f);
              }
            }
          }
        }


        var tmp_ass_contenu: any[] = [];
        var tmp_ass_no_contenu: any[] = [];

        console.log(assignations)

        assignations.forEach((el) => {
          if (this.hasAssigns(el.semaine))
            tmp_ass_contenu.push(el);
          else
            tmp_ass_no_contenu.push(el);
        });

        tmp_ass_contenu.sort((a, b) => a.Nom_matricule.localeCompare(b.Nom_matricule));

        this.assignations = [];
        this.assignations = this.assignations.concat(tmp_ass_contenu).concat(tmp_ass_no_contenu);
        //this.assignations.concat(tmp_ass_no_contenu);

        console.log(this.assignations)

        this.assignations_fantome = assignations_fantome;
      },
      error => this.error = error // error path
    );
  }

  public initInput() {
    $("#chantier").val('');
    for (var i = 0; i < 6; i++)
      $("#case" + i).prop('checked', false);
    $("#casesemaine").prop('checked', false);
    $("#activite").val('');
    $("#search").val('');
    for (let el of this.assignations) {
      $("#boutonName_" + el.matricule_resource).removeClass();
      $("#boutonName_" + el.matricule_resource).addClass('btn btn-success')
    }
    this.idCliques = [];

  }

  public initCopierLigne(matricule_resource: any) {
    this.pos = this.assignations.map(function (e: { matricule_resource: any; }) { return e.matricule_resource; }).indexOf(matricule_resource)
  }

  public copierLigneSemainePrec() {
    var semaineAcopier = this.idSemaine - 1
    var semaine = this.idSemaine
    var assignations = this.assignations
    var pos = this.pos

    this.http.post(this.cst.apiUrl + 'planning_st/copierSem/' + assignations[pos].matricule_resource + '/' + semaineAcopier + '/' + semaine, {}).subscribe(
      (prop) => {
        if (prop) {
          this.toastr.success('Succés !', this.cst.toastrTitle);
          $('#copierLigne').modal('hide');
          this.pos = -1
          this.loadData()
        }
        else
          this.toastr.error('Erreur !', this.cst.toastrTitle);
      })
  }
  //affichage de la modale pour modifier une ligne du planning
  public modifierLigne(id: any, bool: any) {
    this.id = id;
    var url = '';
    if (bool) {
      this.assAmodifier = this.assignations_fantome[this.assignations_fantome.map(function (e: { matricule_resource: any; }) {
        return e.matricule_resource;
      }).indexOf(this.id)]
      this.url = '_fantome'
    }
    else {
      this.assAmodifier = this.assignations[this.assignations.map(function (e: { matricule_resource: any; }) {
        return e.matricule_resource;
      }).indexOf(this.id)]
      this.url = ''
    }
    $('#modale' + url).modal('show');
  }

  //Modifier les changements de la modale de modification de ligne
  public validerChangements() {
    if (typeof this.assAmodifier !== 'boolean') {
      for (let i = 0; i < 6; i++) {
        for (let el of this.assAmodifier.semaine[i]) {
          var escapedId = i + " " + el.code_chantier.trim() + " " + this.id.trim();
          var element = $("[id='" + escapedId.replace(/'/g, "\\'") + "']");

          if (element.length === 0) {
            console.error("L'élément avec l'ID spécifié n'existe pas :", escapedId);
            continue; // Passe à l'élément suivant sans déclencher d'autres erreurs
          }

          var ass = String(element.val())?.split('/')[0]?.trim() || '';
          console.log("Valeur extraite :", ass);

          if (!this.chantierExist(ass) && ass !== '') {
            this.toastr.error('Chantier inexistant', this.cst.toastrTitle);
            break;
          }

          var comm: string = $("[id='" + i + "_comm" + el.code_chantier + "_" + this.id + "']").val() as string ?? '';
          var suppr = 'autre';
          var old_ass = el.code_chantier;
          var old_comm = el.commentaires

          //Modification assignation et/ou commentaire
          if ((old_ass !== '' && (comm !== old_comm && !(comm === '' && old_comm === null)) && ass != '')
            || (ass !== '' && ass != old_ass && old_ass !== '')) {
            const body = {
              matricule_resource: this.id,
              chantier: ass,
              jour: i,
              semaine: this.idSemaine,
              comm: comm,
              ancien_chantier: old_ass,
              nb_semaine: this.semaine
            }
            this.http.put(this.cst.apiUrl + 'planning_st/modif' + this.url, body).subscribe(
              prop => {
                if (i === 5) {
                  this.assAmodifier = false;
                  $('#modale').modal('hide')
                }
                if (!prop) {
                  this.toastr.error('Erreur !', this.cst.toastrTitle);

                }
              }
            );
            console.log(JSON.stringify(body, null, 2));
          }
          //Suppression d'assignation chantier
          if (ass === '' && old_ass !== '') {
            this.http.delete(this.cst.apiUrl + 'planning_st/suppression' + this.url + '/' + this.id + '/'
              + this.idSemaine + '/' + i + '/' + suppr + '/' + old_ass).subscribe(
                remove => {
                  if (!remove) {
                    this.toastr.error('Erreur !', this.cst.toastrTitle);
                  } else {
                    if (i === 5) {
                      this.assAmodifier = false;
                      $('#modale').modal('hide')
                    }
                  }
                });
          }
        }
        //ajout assignation(s) chantier
        if ($("#newchantier" + i).val() !== '' && $("#newchantier" + i).val() !== undefined) {
          const chantierVal = $("#newchantier" + i).val();
          const code_chantier = typeof chantierVal === 'string' ? chantierVal.split('/')[0]?.trim() : '';

          const commentaireVal = $("#newcommentaire" + i).val();
          const comm = typeof commentaireVal === 'string' ? commentaireVal : '';

          var indexActivite = this.activites.map(function (e: { libelle: any; }) { return e.libelle; }).indexOf($("#newactivite" + i).val())

          const matriculeResource = typeof this.assAmodifier !== 'boolean' && this.assAmodifier?.matricule_resource
            ? this.assAmodifier.matricule_resource.replaceAll(" ", "_")
            : '';

          const body = {
            code_chantier: code_chantier,
            jour: i,
            matricule_resource: matriculeResource,
            semaine: this.idSemaine,
            activite: (indexActivite === -1 ? null : this.activites[indexActivite].code),
            nb_semaine: this.semaine,
            comm: $("#newcommentaire" + i).val(),
            // nom: this.assAmodifier.matricule_resource.replaceAll(" ", "_")
            nom: this.nomMatricule.replaceAll(" ", "_")
          }
          this.http.post(this.cst.apiUrl + 'planning_st/creation' + this.url, body).subscribe(
            prop => {
              if (!prop) {
                $('#exampleModalCenter').modal('hide');
                this.toastr.error('Assignation déjà existente', this.cst.toastrTitle);
                console.log("Body : " + JSON.stringify(body, null, 2))
              }
              else {
                $('#exampleModalCenter').modal('hide');
                this.toastr.success('Assignations ajoutées !', this.cst.toastrTitle);
              }
            }
          );
        }
      }
    }

    this.assAmodifier = false;
    window.location.reload();
    $('#modale').modal('hide')

  }

  //création d'assignations selon le remplissage de la modale 'modifier le planning'
  public modifierPlanning() {
    var indexActivite = this.activites.map(function (e: { libelle: any; }) { return e.libelle; }).indexOf($('#activite').val())
    const chantierVal = $("#chantier").val();
    if (!chantierVal || typeof chantierVal !== "string") {
      this.toastr.error('Chantier inexistant', this.cst.toastrTitle);
      return; // Sortez de la fonction si la valeur est invalide
    }

    const code_chantier = chantierVal.split('/')[0]?.trim();

    //chantier inexistant
    if (!this.chantierExist(code_chantier)) {
      this.toastr.error('Chantier inexistant', this.cst.toastrTitle);
    }
    else if (this.idCliques.length === 0) {
      this.toastr.error('Pas de ressource renseignée', this.cst.toastrTitle);
    }
    else if ($('#casesemaine').prop('checked')) {
      for (let i = 0; i < 5; i++) {
        for (let matricule of this.idCliques) {
          const body = {
            code_chantier: code_chantier,
            jour: i,
            matricule_resource: matricule,
            semaine: this.idSemaine,
            activite: (indexActivite !== -1 ? this.activites[indexActivite].code : null),
            nb_semaine: this.semaine
          }
          this.http.post(this.cst.apiUrl + 'planning_st/creation', body).subscribe(
            prop => {
              if (prop === 'Déjà existant') {
                $('#exampleModalCenter').modal('hide');
                this.toastr.error('Assignation déjà existente', this.cst.toastrTitle);
              }
              else {
                $('#exampleModalCenter').modal('hide');
                this.toastr.success('Assignations ajoutées !', this.cst.toastrTitle);
              }
            }
          );

        }
      }
      this.idCliques = [];
    }
    else {
      for (let i = 0; i < 6; i++) {
        if ($('#case' + i).prop('checked')) {
          for (let matricule of this.idCliques) {
            const body = {
              code_chantier: code_chantier,
              jour: i,
              matricule_resource: matricule,
              semaine: this.idSemaine,
              activite: (indexActivite !== -1 ? this.activites[indexActivite].code : null),
              nb_semaine: this.semaine,
            };
            this.http.post(this.cst.apiUrl + 'planning_st/creation', body).subscribe(
              prop => {
                if (prop === 'Déjà existant') {
                  $('#exampleModalCenter').modal('hide');
                  this.toastr.error('Assignation déjà existente', this.cst.toastrTitle);
                }
                else if (!prop) {
                  this.toastr.error('Erreur', this.cst.toastrTitle);
                  console.log("Body pour SQL : " + JSON.stringify(body, null, 2));
                  console.log("prop = " + prop);
                } else {
                  $('#exampleModalCenter').modal('hide');
                  this.toastr.success('Assignations ajoutées !', this.cst.toastrTitle);
                }
              }
            );
          };
        }
      }
      this.idCliques = [];
    }

    window.location.reload();
  }

  public ajouterLigne() {
    var matricule = $('#newnom').val();
    if (matricule === '')
      this.toastr.error('Resource non renseignée', this.cst.toastrTitle);
    else {
      if (this.samedi)
        var max = 6;
      else
        var max = 5;
      for (let i = 0; i < max; i++) {
        var indexAct = this.activites.map(function (e: { libelle: any; }) {
          return e.libelle;
        }).indexOf($('#newactivite_' + i).val());
        const chantierVal = $('#newchantier_' + i).val();
        if (chantierVal && typeof chantierVal === 'string') {
          const codeChantier = chantierVal.split('/')[0].trim();
          if (!this.chantierExist(codeChantier) && chantierVal !== '') {
            this.toastr.error('Chantier inexistant', this.cst.toastrTitle);
          }
          if (!matricule || typeof matricule !== 'string') {
            this.toastr.error('Matricule non valide', this.cst.toastrTitle);
            return;
          }
          else if (chantierVal !== '') {
            const body = {
              code_chantier: codeChantier,
              jour: i,
              nom: matricule,
              matricule_resource: matricule.replaceAll(" ", "_"),
              semaine: this.idSemaine,
              comm: '',
              nb_semaine: this.semaine,
              activite: (indexAct === -1 ? null : this.activites[indexAct].code),
            };
            this.http.post(this.cst.apiUrl + 'planning_st/creation_fantome', body).subscribe(
              (prop) => {
                if (!prop) {
                  this.toastr.error('Erreur !', this.cst.toastrTitle);
                }
              }
            );
          }
        }
      }
      window.location.reload();
      $('#newnom').val('')
      for (let i = 0; i < max; i++) {
        $('#newchantier_' + i).val('')
        $("#newactivite_" + i).val('')

      }
    }
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

  public filter() {
    let input = document.getElementById('search') as HTMLInputElement | null; // Cast explicite en HTMLInputElement
    if (!input) {
      console.error('Input element not found');
      return; // Arrêtez l'exécution si `input` est `null`
    }

    let filterValue = input.value.toUpperCase(); // Accès sécurisé à `value`
    let ul = document.getElementById('Menu');
    let li = ul?.getElementsByTagName('li');

    if (!li) return; // Vérifiez que `li` existe avant de continuer

    for (let i = 0; i < li.length; i++) {
      let button = li[i].getElementsByTagName('button')[0];
      if (button) {
        let txtValue = button.innerHTML || button.innerText || ''; // Sécuriser la récupération de texte
        if (txtValue.toUpperCase().indexOf(filterValue) > -1) {
          li[i].style.display = ''; // Affiche l'élément
        } else {
          li[i].style.display = 'none'; // Cache l'élément
        }
      }
    }
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
    this.loadData();
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

  public afficherModaleSuppressionLigne(id: any) {
    this.id = id;
    $('#supprimerAssignation').modal('show');
  }

  public afficherModaleSuppressionFantome(id: any) {
    this.id = id;
    $('#supprimerAssignationFantome').modal('show');
  }


  public supprimerAssignationFantome(matricule: string) {
    this.http.delete(this.cst.apiUrl + 'planning_st/suppression_fantome/' + matricule + '/' + this.idSemaine).subscribe(
      remove => {
        if (remove) {
          this.loadData()
        }
        else
          this.toastr.error('Erreur !', this.cst.toastrTitle);
      }
    )
    this.loadData()
    $('#supprimerAssignationFantome').modal('hide');
  }

  public supprimerAssignation(id: string) {
    this.http.delete(this.cst.apiUrl + 'planning_st/suppression/' + id + '/' + this.idSemaine).subscribe(
      remove => {
        if (remove) {
        }
        else
          this.toastr.error('Erreur !', this.cst.toastrTitle);
      }
    )
    this.loadData()
    $('#supprimerAssignation').modal('hide');
  }

  public copierSemainePrec() {
    var semaine = this.idSemaine - 1;
    var success = false;
    this.http.delete(this.cst.apiUrl + 'planning_st/suppression/' + this.idSemaine).subscribe(
      remove => {
        if (remove) {
          this.http.post<Array<any>>(this.cst.apiUrl + 'planning_st/copier_semaine/' + semaine
            + '/' + this.idSemaine, {}).subscribe(
              (arr: Array<any>) => {
                $('#copierSemainePrec').modal('hide');
                this.loadData();
              })

        }
        else
          this.toastr.error('Erreur !', this.cst.toastrTitle);
      }
    )


  }

  public couleur(
    jours: (string | number)[],
    res: {
      matricule_resource_searchable: string;
      semaine: { [x: string]: any };
    }
  ) {
    if (
      !$('#boutonName_' + res.matricule_resource_searchable).hasClass(
        'btn btn-info'
      )
    ) {
      var couleur = 'btn btn-success';
      var index = 0;
      while (couleur === 'btn btn-success' && jours[index] !== 6) {
        if (res.semaine[jours[index]].length !== null) {
          for (let ass of res.semaine[jours[index]]) {
            if (
              this.absences
                .map(function (e: { code_absence: any; }) {
                  return e.code_absence;
                })
                .indexOf(ass.code_chantier) !== -1
            )
              couleur = 'btn btn-danger';
            else if (ass !== null) couleur = 'btn btn-warning';
          }
        }
        index += 1;
      }
      $('#boutonName_' + res.matricule_resource_searchable).removeClass();
      $('#boutonName_' + res.matricule_resource_searchable).addClass(couleur);
    }
  }

  public changeCouleur(el: string, nom: any) {
    const boutonElement = document.getElementById('boutonName_' + el);


    if (boutonElement && boutonElement.className !== 'btn btn-info') {
      $(`#boutonName_${el}`).removeClass();
      $(`#boutonName_${el}`).addClass('btn btn-info');
      this.idCliques.push({ matricule: el, nom: nom });
    } else {
      var jours;
      var pos = this.assignations
        .map((e: { matricule_resource: any }) => e.matricule_resource)
        .indexOf(el);

      if ($('#casesemaine').prop('checked')) {
        jours = [0, 1, 2, 3, 4, 5, 6];
      } else {
        jours = [];
        for (let i of [0, 1, 2, 3, 4, 5]) {
          if ($(`#case${i}`).prop('checked')) {
            jours.push(i);
          }
        }
        jours.push(6);
      }

      this.couleur(jours, this.assignations[pos]);
      this.idCliques.splice(
        this.idCliques.indexOf({ matricule: el, nom: nom }),
        1
      );
    }
  }

  public chantierExist(code_chantier: any) {
    return (this.chantiers.map(function (e: { code_chantier: any; }) { return e.code_chantier; }).indexOf(code_chantier) !== -1)
  }

  public weekChecked() {
    var check = true
    var jour = 0
    while (check && jour < 5) {
      if (!$("#case" + jour).prop('checked')) {
        check = false;
        jour += 1;
      }
      else
        jour += 1;
    }
    if (check) {
      for (let i = 0; i < 5; i++) {
        $("#case" + i).prop('checked', false);
      }
      $("#casesemaine").prop('checked', false);
    }
    else {
      for (let i = 0; i < 5; i++) {
        $("#case" + i).prop('checked', true);
      }
      $("#casesemaine").prop('checked', true);
    }

  }


}
