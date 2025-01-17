import { Component, ViewChild, AfterViewInit, OnInit, TemplateRef } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe, NgIfContext } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import get = Reflect.get;
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css'],
})
export class PlanningComponent implements OnInit {
  private MODULE_ID = null;

  private utilisateur;
  public error = '';
  public assignations: any;
  public assignations_non_actif: any[] = [];
  public assignations_interim: any;
  public assignations_fantome: any[] = [];
  public assignations_st: any[] = [];
  public id!: string;
  public pos = false;
  public pos_fantome = false;
  public idCliques: { matricule: string; nom: string }[] = [];
  public semaine: any;
  public dateFormate!: string | null;
  public date: Date;
  public idSemaine: number = 0;
  public dateStart!: string | number | Date;
  dateEnd!: Date;
  public chantiers: any[] = [];
  public activites: any[] = [];
  public absences: any[] = [];
  public planningPDF: any;
  public samedi = false;
  public samediImpression = false;
  public rdv_chantier: any[] = [];
  public conducteur: boolean = false;
  public attributs: any[] = [];
  // public idAssignation: any;

  public semaines: any[] = [];

  private conducteurs: any[] = [];
  private _lookingDate: Date;
  public i: any;
  public nouvelleAssignation: any;
  autre!: TemplateRef<NgIfContext<boolean>> | null;
  abs: any;

  public currentIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cst: Constants,
    private jwt: JwtHelperService,
    private toastr: ToastrService,
    private datePipe: DatePipe
  ) {
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

    if (this._lookingDate === null) this.date = new Date(Date.now());
    else this.date = new Date(this._lookingDate);
    this.loadData();
  }

  ngOnInit() { }

  public canRead(module: string | null) {
    return this.cst.canAccess_Read(
      this.utilisateur,
      module == null ? this.MODULE_ID : module
    );
  }
  public canWrite(module: null) {
    return this.cst.canAccess_Write(
      this.utilisateur,
      module == null ? this.MODULE_ID : module
    );
  }
  public canSpecial(module: null) {
    return this.cst.canAccess_Special(
      this.utilisateur,
      module == null ? this.MODULE_ID : module
    );
  }

  //chargement des données du tableau à afficher
  public loadData() {
    var assignations: any[] = [];
    var assignations_fantome: any[] = [];
    var assignations_st = [];
    var assignations_non_actif: any[] = [];
    var rdv_chantier:
      | {
        semaine: {
          [x: string]: {
            code_chantier: any;
            nom_chantier: any;
            heure: string;
          }[];
        };
      }[]
      | { matricule_resource: any; Nom_matricule: any; semaine: never[][] }[] =
      [];

    this.samedi = this.samediImpression = false;

    console.log('_Looking Date: ' + localStorage.getItem('_lookingDate'));
    this.http.get<Array<any>>(`${this.cst.apiUrl}planning/semaines/${this.date.getFullYear()}`)
      .subscribe((semaines: Array<any>) => {
        semaines.forEach((el) => {
          const dateStart = new Date(el.date_start);
          const dateEnd = new Date(el.date_end);
          let lookingDate: Date = new Date(this._lookingDate);

          if (dateStart <= lookingDate && dateEnd >= lookingDate) {
            this.idSemaine = el.id;
          }
        });
        this.semaines = semaines;
      });

    this.http
      .get<Array<any>>(this.cst.apiUrl + 'conducteurs')
      .subscribe((conducteurs: Array<any>) => {
        this.conducteurs = conducteurs;
      });
    this.http
      .get<Array<any>>(this.cst.apiUrl + 'planning/noms_chantiers')
      .subscribe((chantiers: Array<any>) => {
        this.chantiers = chantiers;
      });
    this.http
      .get<Array<any>>(this.cst.apiUrl + 'codes_nature')
      .subscribe((arr: Array<any>) => {
        this.activites = arr;
      });
    this.http
      .get<Array<any>>(this.cst.apiUrl + 'planning/attributs')
      .subscribe((arr: Array<any>) => {
        this.attributs = arr;
      });

    this.http
      .get<Array<any>>(this.cst.apiUrl + 'gestion_absences')
      .subscribe((arr: Array<any>) => {
        this.absences = arr;
        this.dateFormate = this.datePipe.transform(
          this.date,
          'yyyy' + '-' + 'MM' + '-' + 'dd'
        );
        this.http
          .get<Array<any>>(this.cst.apiUrl + 'assignations/' + this.dateFormate)
          .subscribe(
            (arr: Array<any>) => {
              this.semaine = arr[0].nb_semaine;
              this.idSemaine = arr[0].id;
              this.dateStart = new Date(arr[0].date_start);
              this.dateEnd = new Date(arr[0].date_end);
              this.conducteur = arr[0].verrouillee == 1 ? false : true;

              for (let el of arr) {
                //assignations_chantiers
                if (
                  el.type_assignation === 'chantier' ||
                  el.type_assignation === 'fantome'
                ) {
                  if (el.jour === 5) {
                    this.samediImpression = this.samedi = true;
                  }
                  var predicat = (e: { initiales: any }) =>
                    e.initiales == el.Conducteur;
                  var idxArray = this.conducteurs.findIndex(predicat);
                  var color = '#36b9cc';

                  if (idxArray !== -1)
                    color = this.conducteurs[idxArray].couleur;

                  var bodyC = {
                    code_chantier: el.code_chantier,
                    nom_chantier: el.nom_chantier,
                    chantier_code_pointage: el.chantier_code_pointage,
                    conducteur: el.Conducteur,
                    conducteur_couleur: color,
                    commentaires: el.commentaires,
                    chef_chantier: el.chef_chantier,
                    grand_deplacement: el.grand_deplacement,
                    journee: Number(el.journee),
                  };
                  var indexResource = assignations
                    .map(function (e) {
                      return e.matricule_resource;
                    })
                    .indexOf(el.matricule_resource);
                  var indexResourceNonActif = assignations_non_actif
                    .map(function (e) {
                      return e.matricule_resource;
                    })
                    .indexOf(el.matricule_resource);
                  if (el.Actif === 1) {
                    if (indexResource !== -1) {
                      if (
                        assignations[indexResource].semaine[el.jour]
                          .map(function (e: { code_chantier: any }) {
                            return e.code_chantier;
                          })
                          .indexOf(el.code_chantier) === -1
                      )
                        assignations[indexResource].semaine[el.jour].push(
                          bodyC
                        );
                    } else {
                      this.ajoutResourceDansAssignation(assignations, el);
                      if (
                        assignations[assignations.length - 1].semaine[el.jour]
                          .map(function (e: { code_chantier: any }) {
                            return e.code_chantier;
                          })
                          .indexOf(el.code_chantier) === -1
                      )
                        assignations[assignations.length - 1].semaine[
                          el.jour
                        ].push(bodyC);
                    }
                  } else {
                    if (indexResourceNonActif !== -1) {
                      if (
                        assignations_non_actif[indexResourceNonActif].semaine[
                          el.jour
                        ]
                          .map(function (e: { code_chantier: any }) {
                            return e.code_chantier;
                          })
                          .indexOf(el.code_chantier) === -1
                      ) {
                        assignations_non_actif[indexResourceNonActif].semaine[
                          el.jour
                        ].push(bodyC);
                      }
                    } else {
                      this.ajoutResourceDansAssignation(
                        assignations_non_actif,
                        el
                      );
                      if (
                        assignations_non_actif[
                          assignations_non_actif.length - 1
                        ].semaine[el.jour]
                          .map(function (e: { code_chantier: any }) {
                            return e.code_chantier;
                          })
                          .indexOf(el.code_chantier) === -1
                      )
                        assignations_non_actif[
                          assignations_non_actif.length - 1
                        ].semaine[el.jour].push(bodyC);
                    }
                  }
                }
                //assignations absences
                else if (el.type_assignation === 'absence') {
                  if (el.jour < 6) {
                    if (el.jour === 5) {
                      //this.samediImpression=this.samedi=true;
                    }
                    var indexAbsence = this.absences
                      .map(function (e) {
                        return e.code_absence;
                      })
                      .indexOf(el.code_chantier);
                    var indexResource = assignations
                      .map(function (e) {
                        return e.matricule_resource;
                      })
                      .indexOf(el.matricule_resource);
                    var bodyA = {
                      code_chantier: el.code_chantier,
                      nom_chantier: this.absences[indexAbsence].description,
                      commentaires: 'ABSENCE',
                      journee: Number(el.journee),
                    };

                    if (indexResource != -1) {
                      if (
                        assignations[indexResource].semaine[el.jour]
                          .map(function (e: { code_chantier: any }) {
                            return e.code_chantier;
                          })
                          .indexOf(el.code_chantier) === -1
                      )
                        assignations[indexResource].semaine[el.jour].push(
                          bodyA
                        );
                    } else {
                      this.ajoutResourceDansAssignation(assignations, el);
                      if (
                        assignations[assignations.length - 1].semaine[el.jour]
                          .map(function (e: { code_chantier: any }) {
                            return e.code_chantier;
                          })
                          .indexOf(el.code_chantier) === -1
                      )
                        assignations[assignations.length - 1].semaine[
                          el.jour
                        ].push(bodyA);
                    }
                  }
                }
                //assignations fantome
                else if (el.type_assignation === 'fantome') {
                  if (el.jour === 5) {
                    this.samediImpression = this.samedi = true;
                  }

                  var predicat = (e: { initiales: any }) =>
                    e.initiales == el.Conducteur;

                  var idxArray = this.conducteurs.findIndex(predicat);
                  var color = '#36b9cc';

                  if (idxArray !== -1)
                    color = this.conducteurs[idxArray].couleur;

                  var indexResource = assignations_fantome
                    .map(function (e) {
                      return e.matricule_resource;
                    })
                    .indexOf(el.matricule_resource);
                  var bodyF = {
                    code_chantier: el.code_chantier,
                    nom_chantier: el.nom_chantier,
                    chantier_code_pointage: el.chantier_code_pointage,
                    commentaires: el.commentaires,
                    conducteur: el.Conducteur,
                    conducteur_couleur: color,
                    chef_chantier: el.chef_chantier,
                    grand_deplacement: el.grand_deplacement,
                    journee: el.journee,
                  };

                  if (indexResource !== -1) {
                    if (
                      assignations_fantome[indexResource].semaine[el.jour]
                        .map(function (e: { code_chantier: any }) {
                          return e.code_chantier;
                        })
                        .indexOf(el.code_chantier) === -1
                    )
                      assignations_fantome[indexResource].semaine[el.jour].push(
                        bodyF
                      );
                  } else {
                    this.ajoutResourceDansAssignation(assignations_fantome, el);
                    if (
                      assignations_fantome[
                        assignations_fantome.length - 1
                      ].semaine[el.jour]
                        .map(function (e: { code_chantier: any }) {
                          return e.code_chantier;
                        })
                        .indexOf(el.code_chantier) === -1
                    )
                      assignations_fantome[
                        assignations_fantome.length - 1
                      ].semaine[el.jour].push(bodyF);
                  }
                }
                //ressources sans assignations
                else if (el.type_assignation === null && el.Actif === 1) {
                  if (
                    assignations
                      .map(function (e) {
                        return e.matricule_resource;
                      })
                      .indexOf(el.matricule_resource) === -1
                  )
                    this.ajoutResourceDansAssignation(assignations, el);
                }
              }
              for (let res of assignations) {
                for (let attr of this.attributs) {
                  if (attr.code_ressource == res.matricule_resource) {
                    res.attributs.push(attr.libelle);
                  }
                }
              }

              this.assignations = assignations;
              this.assignations_fantome = assignations_fantome;
              this.assignations_non_actif = assignations_non_actif;
            },
            (error) => (this.error = error) // error path
          );
        this.http
          .get<Array<any>>(
            this.cst.apiUrl +
            'planning_st/assignations_st/impression/' +
            this.dateFormate
          )
          .subscribe(
            (arr: Array<any>) => {
              var assignations_st: any[] = [];

              for (let el of arr) {
                if (el.jour === 5 && el.jour !== null) {
                  this.samediImpression = true;
                }
                var indexResource = assignations_st
                  .map(function (e) {
                    return e.matricule_resource;
                  })
                  .indexOf(el.matricule_resource);

                var bodyST = {
                  code_chantier: el.code_chantier,
                  nom_chantier: el.nom_chantier,
                  commentaires: el.commentaires,
                  conducteur: el.Conducteur,
                  journee: el.journee,
                };
                if (indexResource !== -1) {
                  if (
                    assignations_st[indexResource].semaine[el.jour]
                      .map(function (e: { code_chantier: any }) {
                        return e.code_chantier;
                      })
                      .indexOf(el.code_chantier) === -1
                  )
                    assignations_st[indexResource].semaine[el.jour].push(
                      bodyST
                    );
                } else {
                  this.ajoutResourceDansAssignationST(assignations_st, el);
                  if (
                    assignations_st[assignations_st.length - 1].semaine[el.jour]
                      .map(function (e: { code_chantier: any }) {
                        return e.code_chantier;
                      })
                      .indexOf(el.code_chantier) === -1
                  )
                    assignations_st[assignations_st.length - 1].semaine[
                      el.jour
                    ].push(bodyST);
                }
              }

              this.assignations_st = assignations_st;
            },
            (error) => (this.error = error) // error path
          );
        interface RdvChantier {
          matricule_resource: any;
          Nom_matricule: string;
          semaine: {
            [jour: string]: {
              code_chantier: any;
              nom_chantier: any;
              heure: string;
            }[];
          };
        }

        this.http
          .get<any[]>(
            this.cst.apiUrl + 'rendezvous_chantier/' + this.dateFormate
          )
          .subscribe(
            (arr: any[]) => {
              const rdv_chantier: RdvChantier[] = [];

              for (let el of arr) {
                if (el.jour === '' || el.heure === null) {
                  continue;
                }

                this.samediImpression = true;

                const heure = el.heure !== null ? el.heure.substr(0, 5) : '';
                const bodyRDV = {
                  code_chantier: el.code_chantier,
                  nom_chantier: el.nom_chantier,
                  heure: heure,
                };

                let existe = false;

                for (let ass of rdv_chantier) {
                  if (ass.matricule_resource === el.matricule_resource) {
                    existe = true;

                    if (el.heure !== null) {
                      if (!ass.semaine[el.jour]) {
                        ass.semaine[el.jour] = [];
                      }

                      if (
                        ass.semaine[el.jour].findIndex(
                          (i: { code_chantier: any }) =>
                            i.code_chantier === el.code_chantier
                        ) === -1
                      ) {
                        ass.semaine[el.jour].push(bodyRDV);
                      }
                    }
                  }
                }

                if (!existe) {
                  const newRdvChantier: RdvChantier = {
                    matricule_resource: el.matricule_resource,
                    Nom_matricule: el.Nom,
                    semaine: {},
                  };

                  if (el.heure !== null) {
                    newRdvChantier.semaine[el.jour] = [bodyRDV];
                  }

                  rdv_chantier.push(newRdvChantier);
                }
              }

              this.rdv_chantier = rdv_chantier;
              this.myFunctionC();
            },
            (error) => (this.error = error) // error path
          );
      });
  }

  public ajoutResourceDansAssignation(
    table: any[],
    resource: {
      nature: any;
      matricule_resource: string;
      Nom: any;
      Activite: any;
      Type: any;
      tuteur: any;
      tuteur_nom: any;
      apprentis: any;
      type_assignation: any;
      id_assignation: any;
    }
  ) {
    const p = (e: { code: any }) => e.code == resource.nature;

    var idx = this.activites.findIndex(p);
    var libelle = '';

    if (idx != -1) libelle = this.activites[idx].libelle;

    table.push({
      matricule_resource: resource.matricule_resource,
      matricule_resource_searchable: resource.matricule_resource.replace(
        /\s/g,
        '_'
      ),
      Nom_matricule: resource.Nom,
      code_nature: resource.nature,
      code_nature_nom: libelle,
      activite: resource.Activite,
      type: resource.Type,
      tuteur: resource.tuteur,
      tuteur_nom: resource.tuteur_nom,
      apprentis: resource.apprentis,
      semaine: [[], [], [], [], [], []],
      attributs: [],
      type_assignation: resource.type_assignation,
      id_assignation: resource.id_assignation, 
    });
  }

  public ajoutResourceDansAssignationST(
    table: any[],
    resource: { matricule_resource: string; Nom: any }
  ) {
    table.push({
      matricule_resource: resource.matricule_resource,
      matricule_resource_searchable: resource.matricule_resource.replace(
        /\s/g,
        ''
      ),
      Nom_matricule: resource.Nom,
      semaine: [[], [], [], [], [], []],
    });
  }

  public changerAccesPlanning() {
    if ($('#verrou').attr('class') === 'btn-circle btn-danger') {
      this.http
        .put(this.cst.apiUrl + 'planning/deverrouillage', {
          id_semaine: this.idSemaine,
        })
        .subscribe((remove) => {
          if (!remove) {
            this.cst.showError('Erreur !', 'X');
          } else {
            $('#verrou').toggleClass('btn-danger', false);
            $('#verrou').toggleClass('btn-success', true);
            $('#iconeVerrou').toggleClass('fa-lock', false);
            $('#iconeVerrou').toggleClass('fa-lock-open', true);
          }
        });
    } else if ($('#verrou').attr('class') === 'btn-circle btn-success') {
      this.http
        .put(this.cst.apiUrl + 'planning/verrouillage', {
          id_semaine: this.idSemaine,
        })
        .subscribe((remove) => {
          if (!remove) {
            this.cst.showError('Erreur !', 'X');
          } else {
            $('#verrou').toggleClass('btn-success', false);
            $('#verrou').toggleClass('btn-danger', true);
            $('#iconeVerrou').toggleClass('fa-lock-open', false);
            $('#iconeVerrou').toggleClass('fa-lock', true);
          }
        });
    }
  }

  public initCopierLigne(el: {
    Nom_matricule:
    | string
    | JQuery.Node
    | ((
      this: HTMLElement,
      index: number,
      oldhtml: JQuery.htmlString
    ) => JQuery.htmlString | JQuery.Node);
  }) {
    $('#resource').html(el.Nom_matricule);
    $('#resourceAcopier').val('');
  }

  public copierLigne() {
    const resourceAcopier = $('#resourceAcopier').val() as string | undefined;
    const resource = $('#resource').html() as string | undefined;

    // Vérifier que `resourceAcopier` et `resource` ne sont pas undefined
    if (!resourceAcopier || !resource) {
      this.cst.showError('Les ressources ne sont pas valides.', 'X');
      return;
    }

    const indexACopier = this.assignations
      .map((e: { Nom_matricule: string }) => e.Nom_matricule + ' ')
      .indexOf(resourceAcopier);

    const index = this.assignations
      .map((e: { Nom_matricule: any }) => e.Nom_matricule)
      .indexOf(resource);

    if (indexACopier === -1) {
      this.cst.showError('Ressource invalide !', 'X');
    } else {
      this.http
        .post(
          this.cst.apiUrl +
          'planning/copier_ligne/' +
          this.idSemaine +
          '/' +
          this.assignations[indexACopier].matricule_resource +
          '/' +
          this.assignations[index].matricule_resource,
          {}
        )
        .subscribe((remove) => {
          if (!remove) {
            this.cst.showError('Erreur !', 'X');
          } else {
            $('#copierLigne').modal('hide');
            this.loadData();
          }
        });
    }
  }

  public initInput() {
    $('#chantier').val('');
    for (var i = 0; i < 6; i++) {
      $('#case' + i).prop('checked', false);
    }
    $('#casesemaine').prop('checked', false);
    $('#absence').val('');
    $('#activite').val('');
    $('#commentaires').val('');
    $('#search').val(''); // Remplacement de null par une chaîne vide
  }

  public getAssignationAt(index: number | null): any | null {
    if (index !== null && index >= 0 && index < this.assignations.length) {
      return this.assignations[index];
    }
    return null;
  }

  //affichage de la modale pour modifier une ligne du planning
  modifierLigne(matricule: any, isFantome: boolean, index: number): void {
    console.log('Bouton fonctionne');
    console.log('Matricule:', matricule, 'Index:', index);

    // Assignez l'ID
    this.id = matricule;
    this.currentIndex = index;

    console.log("this.currentIndex: " + this.currentIndex)

    // Construisez l'URL en fonction du type
    const url = isFantome ? '_fantome' : '';

    // Trouvez la position dans les assignations
    if (!!isFantome) {
      console.log("isFantome")
      this.pos_fantome = this.assignations
          .map((e: { matricule_resource: any }) => e.matricule_resource)
          .indexOf(this.id) !== -1;
      
      console.log("pos_fantome: " + this.pos_fantome);
    } else {
      console.log("isChantier")
      this.pos =
        this.assignations
          .map((e: { matricule_resource: any }) => e.matricule_resource)
          .indexOf(this.id) !== -1;
    }

    // Affichez la modale en utilisant Bootstrap 5 Modal API
    const modalElement = document.getElementById(`modale${url}`);
    if (modalElement) {
      const myModal = new Modal(modalElement);
      myModal.show();
    } else {
      console.error(`Modale avec ID 'modale${url}' introuvable.`);
    }
  }

  //Modifier les changements de la modale de modification de ligne
  public validerChangements(bool: any) {
    if (bool) {
      var index = this.assignations
        .map(function (e: { matricule_resource: any }) {
          return e.matricule_resource;
        })
        .indexOf(this.id);
      var url = '_fantome';
      var tableau = this.assignations;
    } else {
      var index = this.assignations
        .map(function (e: { matricule_resource: any }) {
          return e.matricule_resource;
        })
        .indexOf(this.id);
      var url = '';
      var tableau = this.assignations;
    }

    this.modifLigne(index, tableau, url);
  }

  //modification par ligne
  public modifLigne(
    index: string | number,
    tableau: {
      [x: string]: {
        matricule_resource_searchable: string;
        code_nature: any;
        matricule_resource: any;
        Nom_matricule: any;
        semaine: any;
        type: any;
      };
    },
    url: string
  ) {
    var _samedi = this.samedi;
    for (let i = 0; i < 6; i++) {
      if (i !== 5 || _samedi) {
        for (let el of tableau[index].semaine[i]) {
          let suppr: string = '';
          let comm: string = '';
          let chef: number = 0;
          let journee: number = 0;
          let grand_deplacement: number = 0;

          if (el.commentaires === 'ABSENCE') {
            var ass = $(
              "[id='ABS" +
              i +
              '_' +
              el.code_chantier +
              '_' +
              this.id.replace(/\s/g, '_') +
              "']"
            ).val();
            if (!this.absenceExist(ass) && ass !== '') {
              this.toastr.error('Absence inexistante', this.cst.toastrTitle);
              break;
            }
            comm = 'ABSENCE';
            suppr = 'ABSENCE';
            journee = 0;
            if (
              $(
                "[id='abs" +
                i +
                '_matin' +
                el.code_chantier +
                '_' +
                this.id.replace(/\s/g, '_') +
                "']"
              ).prop('checked')
            )
              journee = 1;
            else if (
              $(
                "[id='abs" +
                i +
                '_apresmidi' +
                el.code_chantier +
                '_' +
                this.id.replace(/\s/g, '_') +
                "']"
              ).prop('checked')
            )
              journee = 2;
          }
          if (el.commentaires !== 'ABSENCE') {
            const value = $(
              `[id='ABS${i}_${el.code_chantier}_${this.id.replace(
                /\s/g,
                '_'
              )}${url}']`
            ).val();
            if (value !== undefined && typeof value === 'string') {
              ass = value.split('/')[0].trim();
            } else {
              console.error(
                "La valeur est indéfinie ou n'est pas une chaîne:",
                value
              );
            }

            console.log(
              "[id='" +
              i +
              '_' +
              el.code_chantier +
              '_' +
              this.id.replace(/\s/g, '_') +
              url +
              "']"
            );
            console.log(ass);

            if (!this.chantierExist(ass) && ass !== '') {
              this.toastr.error('Chantier inexistant', this.cst.toastrTitle);
              break;
            }

            console.log(el);

            console.log(index);
            console.log(tableau[index]);
            console.log(
              $(
                '#button' +
                i +
                tableau[index].matricule_resource_searchable +
                el.code_chantier
              )
            );
            console.log(
              $(
                '#button' +
                i +
                tableau[index].matricule_resource_searchable +
                el.code_chantier
              ).attr('class')
            );

            const buttonClasses = $(
              `#button${i}${tableau[index].matricule_resource_searchable}${el.code_chantier}`
            ).attr('class');
            if (buttonClasses && buttonClasses.includes('btn-secondary')) {
              chef = 0;
            } else {
              chef = 1;
            }
            console.log('afterChef');

            const deplacementClasses = $(
              `#deplacement${i}${tableau[index].matricule_resource_searchable}${el.code_chantier}`
            ).attr('class');
            if (
              deplacementClasses &&
              deplacementClasses.includes('btn-secondary')
            ) {
              grand_deplacement = 0;
            } else {
              grand_deplacement = 1;
            }

            console.log('afterGD');

            const commValue = $(
              `[id='${i}_comm${el.code_chantier}_${this.id.replace(
                /\s/g,
                '-'
              )}${url}']`
            ).val();

            if (commValue !== undefined && typeof commValue === 'string') {
              comm = commValue;
            } else if (commValue !== undefined) {
              comm = String(commValue); // Conversion explicite en chaîne
            } else {
              comm = ''; // Valeur par défaut en cas de `undefined`
            }

            if (url === '') {
              suppr = 'autre';
            } else {
              suppr = url;
            }
            console.log('afterSuppr');

            journee = 0;
            if (
              $(
                "[id='" +
                i +
                '_matin' +
                url +
                el.code_chantier +
                '_' +
                this.id.replace(/\s/g, '_') +
                "']"
              ).prop('checked')
            )
              journee = 1;
            else if (
              $(
                "[id='" +
                i +
                '_apresmidi' +
                url +
                el.code_chantier +
                '_' +
                this.id.replace(/\s/g, '_') +
                "']"
              ).prop('checked')
            )
              journee = 2;

            console.log('afterJournee');
          }
          var old_ass = el.code_chantier;
          var old_comm = el.commentaires;
          var old_chef = el.chef_chantier;
          var old_gd = el.grand_deplacement;
          var old_journee = el.journee;

          console.log(i);
          if (i == 5) {
            console.log(old_ass);
            console.log(old_comm);
            console.log(old_chef);
            console.log(old_gd);
            console.log(old_journee);
            console.log(ass);
          }
          //Supression d'assignation chantier
          if (ass === '' && old_ass !== '') {
            console.log('toDelete');
            this.http
              .delete(
                `${this.cst.apiUrl}assignation/suppression/${this.id}/${this.idSemaine}/${i}/${suppr}/${old_ass}`
              )
              .subscribe((remove) => {
                if (!remove) {
                  this.toastr.error('Erreur !', this.cst.toastrTitle);
                } else {
                  this.pos = false;
                  this.pos_fantome = false;
                  $('#modale' + url).modal('hide');
                }
              });
          }
          //Modification assignation et/ou commentaire et/ou chefchantier
          else if (
            (old_ass !== '' && comm !== old_comm && ass != '') ||
            (ass !== '' && ass != old_ass && old_ass !== '') ||
            old_chef != chef ||
            old_journee != journee ||
            old_gd != grand_deplacement
          ) {
            const body = {
              matricule_resource: this.id,
              chantier: ass,
              jour: i,
              semaine: this.idSemaine,
              comm: comm,
              ancien_chantier: old_ass,
              chef_chantier: chef,
              grand_deplacement: grand_deplacement,
              journee: journee,
              old_journee: old_journee,
            };
            this.http
              .put(this.cst.apiUrl + 'planning/modif' + url, body)
              .subscribe((prop) => {
                if (!prop) {
                  this.toastr.error('Erreur !', this.cst.toastrTitle);
                } else {
                  this.pos = false;
                  this.pos_fantome = false;
                  $('#modale' + url).modal('hide');
                }
              });
          } else {
            this.pos = false;
            this.pos_fantome = false;
            $('#modale' + url).modal('hide');
          }
        }
        //ajout d'un chantier
        if ($('#newchantier' + url + i).val() !== '') {
          var indexNature = this.activites
            .map(function (e) {
              return e.libelle;
            })
            .indexOf($('#newactivite' + url + i).val());
          var activite =
            $('#newactivite' + url + i).val() === ''
              ? tableau[index].code_nature
              : $('#newactivite' + url + i).val();
          if (
            $('#newchefchantier' + i).attr('class') ===
            'btn-circle btn-sm btn-secondary'
          )
            var chef = 0;
          else var chef = 1;

          if (
            $('#newdeplacement' + i).attr('class') ===
            'btn-circle btn-sm btn-secondary'
          )
            var grand_deplacement = 0;
          else var grand_deplacement = 1;

          var journee = 0;
          if ($('#newmatin' + url + i).prop('checked')) journee = 1;
          else if ($('#newapresmidi' + url + i).prop('checked')) journee = 2;

          const newChantierVal = $(`#newchantier${url}${i}`).val();
          const code_chantier =
            newChantierVal !== undefined && typeof newChantierVal === 'string'
              ? newChantierVal.split('/')[0].trim()
              : ''; // Valeur par défaut si la valeur est indéfinie

          const body = {
            code_chantier: code_chantier,
            jour: i,
            matricule_resource: tableau[index].matricule_resource,
            semaine: this.idSemaine,
            comm: $('#newcommentaire' + url + i).val(),
            nom: tableau[index].Nom_matricule,
            chef_chantier: chef,
            grand_deplacement: grand_deplacement,
            activite:
              indexNature === -1
                ? tableau[index].code_nature
                : this.activites[indexNature].code,
            id_utilisateur: this.utilisateur.id,
            nom_resource: tableau[index].Nom_matricule,
            journee: journee,
            type: tableau[index].type,
          };
          this.http
            .post(this.cst.apiUrl + 'planning/creation' + url, body)
            .subscribe((prop) => {
              if (prop === 1) {
                this.pos = false;
                this.pos_fantome = false;
                $('#modale' + url).modal('hide');
                this.toastr.error(
                  'Chantier ajouté mais ' + body.nom + ' absent(e)',
                  this.cst.toastrTitle
                );
              } else if (prop === 2) {
                this.toastr.error(
                  'Assignation(s) déjà existente(s) pour :' + body.nom,
                  this.cst.toastrTitle
                );
              } else {
                this.pos = false;
                this.pos_fantome = false;
                $('#modale' + url).modal('hide');
              }
            });
        }
      } else {
        this.pos = false;
        this.pos_fantome = false;
        $('#modale' + url).modal('hide');
      }
    }

    this.loadData();
  }

  //création d'assignations selon le remplissage de la modale 'modifier le planning'
  public modifierPlanning() {
    //initialisation
    var stringDelete, stringInsert;
    stringInsert = stringDelete = '';
    var datas = new Array();
    var indexAbs = this.absences
      .map(function (e) {
        return e.description;
      })
      .indexOf($('#absence').val());
    var absence = '';
    if (indexAbs !== -1) absence = this.absences[indexAbs].code_absence;

    var success = false;
    //absence inexistante
    if (!this.absenceExist(absence) && $('#absence').val() !== '') {
      this.cst.showError('Absence inexistante', 'X');
    }
    //chantier inexistant
    else if (
      !this.chantierExist(
        ($('#chantier').val() as string | undefined)?.split('/')[0]?.trim() ||
        ''
      ) &&
      $('#absence').val() === ''
    ) {
      this.cst.showError('Chantier inexistant', 'X');
    } else if (
      !this.activiteExist($('#activite').val()) &&
      $('#absence').val() === '' &&
      $('#activite').val() !== ''
    ) {
      this.cst.showError('Activité inexistante', 'X');
    } else if (this.idCliques.length === 0) {
      this.cst.showError('Pas de ressource renseignée', 'X');
    } else {
      for (let i = 0; i < 6; i++) {
        if ($('#case' + i).prop('checked')) {
          if ($('#absence').val() !== '') {
            for (let matricule of this.idCliques) {
              datas.push({
                matricule: matricule.matricule,
                semaine: this.idSemaine,
                jour: i,
                journee: 0,
                code_absence: absence,
              });
            }
          } else {
            for (let matricule of this.idCliques) {
              const index = this.assignations
                .map((e: { matricule_resource: any }) => e.matricule_resource)
                .indexOf(matricule.matricule);
              const indexNature = this.activites
                .map((e: { libelle: any }) => e.libelle)
                .indexOf($('#activite').val() as string);

              // Sécuriser la récupération de la valeur du champ #chantier
              const chantierValue = $('#chantier').val() as string | undefined;

              const code_chantier = chantierValue
                ? chantierValue.split('/')[0]?.trim()
                : ''; // Utiliser une chaîne vide par défaut si undefined

              const body = {
                code_chantier: code_chantier,
                jour: i,
                matricule_resource: matricule.matricule,
                semaine: this.idSemaine,
                comm: $('#commentaires').val(),
                nom: matricule.nom,
                chef_chantier: 0,
                grand_deplacement: 0,
                activite:
                  indexNature === -1
                    ? this.assignations[index].code_nature
                    : this.activites[indexNature].code,
                id_utilisateur: this.utilisateur.id,
                nom_resource: matricule.nom,
              };
              this.http
                .post(this.cst.apiUrl + 'planning/creation', body)
                .subscribe((prop) => {
                  if (prop === 1) {
                    $('#exampleModalCenter').modal('hide');
                    this.cst.showError(
                      'Chantier ajouté mais ' + body.nom + ' absent(e)',
                      'X'
                    );
                  } else if (prop === 2) {
                    this.cst.showError(
                      'Assignation(s) déjà existente(s) pour :' + body.nom,
                      'X'
                    );
                  } else {
                    $('#exampleModalCenter').modal('hide');
                  }
                });
            }
          }
        }
      }
      const dateDebutValue = $('#date_debut').val() as string | undefined;
      const dateFinValue = $('#date_fin').val() as string | undefined;
      if (!dateDebutValue || !dateFinValue) {
        this.cst.showError('Veuillez renseigner les dates correctement', 'X');
      } else if (dateDebutValue > dateFinValue) {
        this.cst.showError('Période invalide', 'X');
      } else if (dateDebutValue <= dateFinValue) {
        const dateDebut = new Date(dateDebutValue + ' 00:00:00');
        const dateFin = new Date(dateFinValue + ' 00:00:00');
        let dateStart = new Date(this.dateStart);
        let semaine = this.idSemaine;
        let jour: number | undefined = -1; // Initialisation à une valeur invalide par défaut

        // Trouver le jour correspondant à la date de début
        for (let i of [0, 1, 2, 3, 4, 5]) {
          if (dateDebut.getTime() === dateStart.getTime()) {
            jour = i;
          }
          dateStart.setDate(dateStart.getDate() + 1);
        }

        if (jour === -1) {
          this.cst.showError('Période invalide', 'X');
        } else {
          while (dateDebut.getTime() <= dateFin.getTime()) {
            while (jour < 5 && dateDebut.getTime() <= dateFin.getTime()) {
              if ($('#absence').val() !== '') {
                for (let matricule of this.idCliques) {
                  datas.push({
                    matricule: matricule.matricule,
                    semaine: semaine,
                    jour: jour,
                    journee: 0,
                    code_absence: $('#absence').val(),
                  });
                }
              } else {
                for (let matricule of this.idCliques) {
                  const index = this.assignations
                    .map(
                      (e: { matricule_resource: any }) => e.matricule_resource
                    )
                    .indexOf(matricule.matricule);
                  const indexNature = this.activites
                    .map((e: { libelle: any }) => e.libelle)
                    .indexOf($('#activite').val() as string);

                  const chantierValue = $('#chantier').val() as
                    | string
                    | undefined;
                  const code_chantier = chantierValue
                    ? chantierValue.split('/')[0]?.trim() || ''
                    : '';

                  const body = {
                    code_chantier: code_chantier,
                    jour: jour,
                    matricule_resource: matricule.matricule,
                    semaine: semaine,
                    comm:
                      ($('#commentaires').val() as string | undefined) || '',
                    nom: matricule.nom,
                    chef_chantier: 0,
                    grand_deplacement: 0,
                    activite:
                      indexNature === -1
                        ? this.assignations[index]?.code_nature
                        : this.activites[indexNature]?.code,
                    id_utilisateur: this.utilisateur.id,
                    nom_resource: matricule.nom,
                  };

                  this.http
                    .post(this.cst.apiUrl + 'planning/creation', body)
                    .subscribe((prop) => {
                      if (prop === 1) {
                        $('#exampleModalCenter').modal('hide');
                        this.cst.showError(
                          'Chantier ajouté mais ' + body.nom + ' absent(e)',
                          'X'
                        );
                      } else if (prop === 2) {
                        this.cst.showError(
                          'Assignation(s) déjà existente(s) pour :' + body.nom,
                          'X'
                        );
                      } else {
                        $('#exampleModalCenter').modal('hide');
                      }
                    });
                }
              }
              jour = (jour as number) + 1; // Conversion en `number` explicite
              dateDebut.setDate(dateDebut.getDate() + 1);
            }
            semaine++;
            jour = 0; // Réinitialisation pour la nouvelle semaine
            dateDebut.setDate(dateDebut.getDate() + 2); // Passer au lundi suivant
          }
        }
      }
    }
    if (datas.length !== 0) {
      const body = {
        listAttributions: JSON.stringify(datas),
      };
      this.http
        .post(this.cst.apiUrl + 'absences/attribution_absence', body)
        .subscribe((prop) => {
          if (!prop) {
            this.cst.showError('Erreur !', 'X');
          } else {
            this.cst.showSuccess('Absence(s) ajoutée(s) avec succès !', 'X');
            $('#exampleModalCenter').modal('hide');
          }
        });
    }

    window.location.reload();
  }

  // ajoute une ligne libre dans le tableau
  public ajouterLigne() {
    var matricule = $('#newnom').val();
    var type =
      $('#newtype').val() == 'INTERIM/STAGIAIRE'
        ? 'INTERIM'
        : $('#newtype').val();

    if (matricule === '') {
      this.cst.showError('Resource non renseignée !', 'X');
      return; // Arrête l'exécution si le matricule est vide
    }

    if (
      type !== 'SALARIE' &&
      type !== 'INTERIM' &&
      type !== 'ATELIER' &&
      type !== 'STAGIAIRE'
    ) {
      this.cst.showError('Type mal renseigné !', 'X');
      return; // Arrête l'exécution si le type est invalide
    }

    // Déclaration de `max` avec une valeur conditionnelle
    let max = this.samedi ? 6 : 5;

    for (let i = 0; i < max; i++) {
      let journee = 0;
      if ($('#newmatin_' + i).prop('checked')) {
        journee = 1;
      } else if ($('#newapresmidi_' + i).prop('checked')) {
        journee = 2;
      }

      let index = this.activites
        .map((e: { libelle: any }) => e.libelle)
        .indexOf($('#activite_fantome' + i).val());
      const chantierValue = $('#newchantier_' + i).val() as string | undefined;

      const code_chantier = chantierValue
        ? chantierValue.split('/')[0]?.trim() || '' // Si chantierValue est une chaîne vide
        : ''; // Valeur par défaut si undefined

      if (!this.chantierExist(code_chantier) && chantierValue !== '') {
        this.cst.showError('Chantier inexistant', 'X');
      } else if (chantierValue !== '') {
        // Sécurisation de la valeur de `matricule`
        const matriculeValue = matricule ? String(matricule) : ''; // Convertir en chaîne ou utiliser une valeur par défaut

        // Utilisation de replaceAll ou replace
        const matriculeResource = matriculeValue.replace(/ /g, '_');

        const body = {
          code_chantier: code_chantier,
          jour: i,
          nom: matricule,
          matricule_resource: matriculeResource,
          semaine: this.idSemaine,
          commentaires: $('#newcomm_' + i).val(),
          activite: index === -1 ? null : this.activites[index]?.code,
          journee: journee,
          type: type,
        };

        this.http
          .post(this.cst.apiUrl + 'planning/creation_fantome', body)
          .subscribe((prop) => {
            if (!prop) {
              this.cst.showError('Erreur !', 'X');
            }
          });
      }
    }

    this.loadData();
    $('#newnom').val('');
    $('#newtype').val('');
    for (let i = 0; i < max; i++) {
      $('#newchantier_' + i).val('');
      $('#activite_fantome' + i).val('');
      $('#newcomm_' + i).val('');
      $('#newmatin_' + i).prop('checked', false);
      $('#newapresmidi_' + i).prop('checked', false);
    }
  }

  public grandDeplacementSemaine(assignation: {
    matricule_resource: any;
    matricule_resource_searchable: any;
    semaine: any[];
  }) {
    var matricule_resource = assignation.matricule_resource;
    var matricule_resource_searchable =
      assignation.matricule_resource_searchable;
    const body = {
      matricule: matricule_resource,
      semaine: this.idSemaine,
    };
    $('#deplacement' + matricule_resource_searchable)
      .toggleClass('btn-secondary')
      .toggleClass('btn-success');
    if (
      $('#deplacement' + matricule_resource_searchable).attr('class') ===
      'btn-circle btn-sm btn-success'
    ) {
      for (let i of [0, 1, 2, 3, 4]) {
        for (let ass of assignation.semaine[i]) {
          $(
            '#deplacement' +
            i +
            matricule_resource_searchable +
            ass.code_chantier
          ).toggleClass('btn-secondary', false);
          $(
            '#deplacement' +
            i +
            matricule_resource_searchable +
            ass.code_chantier
          ).toggleClass('btn-success', true);
        }
      }
    } else {
      for (let i of [0, 1, 2, 3, 4]) {
        for (let ass of assignation.semaine[i]) {
          $(
            '#deplacement' +
            i +
            matricule_resource_searchable +
            ass.code_chantier
          ).toggleClass('btn-secondary', true);
          $(
            '#deplacement' +
            i +
            matricule_resource_searchable +
            ass.code_chantier
          ).toggleClass('btn-success', false);
        }
      }
    }
  }
  public chefChantierSemaine(assignation: {matricule_resource: any; matricule_resource_searchable: any; semaine: any[];}) {
    console.log("Test du bouton");
    var matricule_resource = assignation.matricule_resource;
    var matricule_resource_searchable =
      assignation.matricule_resource_searchable;
    const body = {
      matricule: matricule_resource,
      semaine: this.idSemaine,
    };
    $('#button' + matricule_resource_searchable)
      .toggleClass('btn-secondary')
      .toggleClass('btn-success');
    if (
      $('#button' + matricule_resource_searchable).attr('class') ===
      'btn-circle btn-sm btn-success'
    ) {
      for (let i of [0, 1, 2, 3, 4]) {
        for (let ass of assignation.semaine[i]) {
          $(
            '#button' + i + matricule_resource_searchable + ass.code_chantier
          ).toggleClass('btn-secondary', false);
          $(
            '#button' + i + matricule_resource_searchable + ass.code_chantier
          ).toggleClass('btn-success', true);
        }
      }
    } else {
      for (let i of [0, 1, 2, 3, 4]) {
        for (let ass of assignation.semaine[i]) {
          $(
            '#button' + i + matricule_resource_searchable + ass.code_chantier
          ).toggleClass('btn-secondary', true);
          $(
            '#button' + i + matricule_resource_searchable + ass.code_chantier
          ).toggleClass('btn-success', false);
        }
      }
    }
  }

  public grandDeplacement(id: string, matricule: string | boolean) {
    $('#' + id)
      .toggleClass('btn-secondary')
      .toggleClass('btn-success');
    if (
      $('#' + id).attr('class') === 'btn-circle btn-sm btn-secondary' &&
      matricule !== false
    ) {
      $('#button' + matricule).toggleClass('btn-success', false);
      $('#button' + matricule).toggleClass('btn-secondary', true);
    }
  }

  public chefChantier(id: string, matricule: string | boolean) {
    $('#' + id)
      .toggleClass('btn-secondary')
      .toggleClass('btn-success');
    if (
      $('#' + id).attr('class') === 'btn-circle btn-sm btn-secondary' &&
      matricule !== false
    ) {
      $('#button' + matricule).toggleClass('btn-success', false);
      $('#button' + matricule).toggleClass('btn-secondary', true);
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

  public initFilter() {
    let filterValue: string = String($('#search').val() || '').toUpperCase(); // Conversion explicite en chaîne
    let ul = document.getElementById('Menu');
    let li = ul?.getElementsByTagName('li');

    if (!li) return; // Vérifiez que `li` existe avant de continuer

    for (let i = 0; i < li.length; i++) {
      li[i].style.display = ''; // Réinitialisation de l'affichage pour toutes les lignes
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

  public copierSemainePrec() {
    var semaine = this.idSemaine - 1;
    this.http
      .delete(this.cst.apiUrl + 'assignation/suppression/' + this.idSemaine)
      .subscribe((remove) => {
        if (remove) {
          this.http
            .post<Array<any>>(
              this.cst.apiUrl +
              'copier_semaine/' +
              semaine +
              '/' +
              this.idSemaine,
              {}
            )
            .subscribe((arr: Array<any>) => {
              $('#copierSemainePrec').modal('hide');
              window.location.reload();
            });
        } else this.cst.showError('Erreur !', 'X');
      });
  }

  public afficherModaleSuppressionLigne(id: any) {
    this.id = id;
    $('#supprimerAssignationFantome').modal('show');
  }

  public supprimerAssignationFantome(matricule: string) {
    this.http
      .delete(
        this.cst.apiUrl +
        'assignation/suppression/' +
        matricule +
        '/' +
        this.idSemaine
      )
      .subscribe((remove) => {
        if (!remove) this.cst.showError('Erreur !', 'X');
      });
    window.location.reload();
    $('#supprimerAssignationFantome').modal('hide');
  }

  public couleurs() {
    var jours;
    if ($('#casesemaine').prop('checked')) {
      jours = [0, 1, 2, 3, 4, 5, 6];
      for (let res of this.assignations) this.couleur(jours, res);
    } else {
      jours = [];
      for (let i of [0, 1, 2, 3, 4, 5]) {
        if ($('#case' + i).prop('checked')) jours.push(i);
      }
      jours.push(6);
      for (let res of this.assignations) this.couleur(jours, res);
    }
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
                .map(function (e) {
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

  public chantierExist(code_chantier: string | number | string[] | undefined) {
    return (
      this.chantiers
        .map(function (e: { code_chantier: any }) {
          return e.code_chantier;
        })
        .indexOf(code_chantier) !== -1
    );
  }

  public absenceExist(code_absence: string | number | string[] | undefined) {
    return (
      this.absences
        .map(function (e) {
          return e.code_absence;
        })
        .indexOf(code_absence) !== -1
    );
  }

  public activiteExist(libelle: string | number | string[] | undefined) {
    return (
      this.activites
        .map(function (e: { libelle: any }) {
          return e.libelle;
        })
        .indexOf(libelle) !== -1
    );
  }

  public imprimer(format: string | undefined) {
    const absences = this.absences;
    const assignations_fantome = this.assignations_fantome;

    type PageFormatKeys = 'a0' | 'a1' | 'a2' | 'a3' | 'a4';

    const pageFormats: Record<PageFormatKeys, number[]> = {
      a0: [2383.94, 3370.39],
      a1: [1683.78, 2383.94],
      a2: [1190.55, 1683.78],
      a3: [841.89, 1190.55],
      a4: [595.28, 841.89],
    };

    // Validation du format
    if (!format || !(format in pageFormats)) {
      console.warn("Format non valide, utilisation par défaut : 'a4'");
      format = 'a4'; // Valeur par défaut
    }

    const pageFormatKey = format as PageFormatKeys; // Cast après validation
    const doc = new jsPDF('p', 'pt', pageFormatKey); // Utilisation de `pageFormatKey`

    doc.setFontSize(18);
    doc.text(
      'Planning chantiers ' + $('#date_planning').html().toLowerCase(),
      80,
      40
    );
    doc.setFontSize(13);
    doc.setTextColor(100);

    (doc as any).autoTable({
      html: '#maTable',
      margin: {
        right: format === 'a3' ? 20 : pageFormats[pageFormatKey][0] / 2 + 20,
      },
      theme: 'grid',
      styles: { halign: 'center' },
      startY: parseInt('50'),
      didParseCell: function (data: any) {
        var index = assignations_fantome
          .map((e: { Nom_matricule: any }) => e.Nom_matricule)
          .indexOf(data.row.raw[0].content);
        var rows = data.table.body;

        var s = data.cell.styles;
        s.lineColor = [0, 0, 0];
        s.lineWidth = 0.5;

        if (data.row.raw[0].content === 'Salariés BATIDEKO') {
          data.cell.styles.fillColor = [239, 154, 154];
        } else if (index !== -1) {
          data.cell.styles.fillColor = [239, 239, 109];
        } else {
          for (let i of ['1', '2', '3', '4', '5']) {
            if (
              absences
                .map((e) => e.code_absence)
                .indexOf(data.row.cells[i].text[0]) !== -1
            )
              data.row.cells[i].styles.textColor = [255, 0, 0];

            const regEx = /\*........\*/g;
            if (data.row.cells[i].text[0].match(regEx)) {
              0;
              data.row.cells[i].styles.textColor = [107, 142, 35];
            }
          }
        }
      },
    });
    format === 'a0' ? doc.setPage(1) : doc.addPage();
    (doc as any).autoTable({
      html: '#maTable2',
      margin: { left: format === 'a0' ? pageFormats[format][0] / 2 + 20 : 20 },
      theme: 'grid',
      startY: parseInt('50'),
      styles: { halign: 'center' },
      didParseCell: function (data: {
        row: {
          raw: { content: string }[];
          cells: {
            [x: string]: {
              text: any;
              styles: {
                fontStyle: string;
                textColor: number[];
              };
            };
          };
        };
        table: { body: any };
        cell: {
          styles: {
            lineWidth: number;
            lineColor: number[];
            fillColor: number[];
          };
        };
      }) {
        var index = assignations_fantome
          .map(function (e: { Nom_matricule: any }) {
            return e.Nom_matricule;
          })
          .indexOf(data.row.raw[0].content);
        var rows = data.table.body;

        var s = data.cell.styles;
        s.lineColor = [0, 0, 0];
        s.lineWidth = 0.5;

        if (
          data.row.raw[0].content === 'Salariés BATIDEKO' ||
          data.row.raw[0].content === 'Atelier' ||
          data.row.raw[0].content === 'Dépôt' ||
          data.row.raw[0].content === 'Intérims, Stagiaires' ||
          data.row.raw[0].content === 'Non actifs' ||
          data.row.raw[0].content === 'Sous Traitant' ||
          data.row.raw[0].content === 'RDV Chantier'
        ) {
          data.cell.styles.fillColor = [239, 154, 154];
        } else if (index !== -1) data.cell.styles.fillColor = [239, 239, 109];
        else {
          for (let i of ['1', '2', '3', '4', '5']) {
            if (
              absences
                .map(function (e) {
                  return e.code_absence;
                })
                .indexOf(data.row.cells[i].text[0]) !== -1
            )
              data.row.cells[i].styles.textColor = [255, 0, 0];

            const regEx = /\*........\*/g;
            if (data.row.cells[i].text[0].match(regEx)) {
              data.row.cells[i].styles.fontStyle = 'bold';
              data.row.cells[i].styles.textColor = [107, 142, 35];
            }
          }
        }
      },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();

    // For each page, print the page number and the total pages
    let options = {
      align: 'right',
    };

    for (var i = 1; i <= pageCount; i++) {
      // Go to page i
      doc.setPage(i);
      //Print Page 1 of 4 for example
      doc.text(
        'Page ' + String(i) + ' sur ' + String(pageCount),
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 20,
        'right' as any
      );
    }

    doc.output('dataurlnewwindow');
    doc.save('planningS' + this.idSemaine + '.pdf');
  }

  public findJournee1(tableau: any[]) {
    return (
      tableau
        .map(function (e: { journee: any }) {
          return e.journee;
        })
        .indexOf(1) !== -1
    );
  }
  public findJournee2(tableau: any[]) {
    return (
      tableau
        .map(function (e: { journee: any }) {
          return e.journee;
        })
        .indexOf(2) !== -1
    );
  }

  public journeeChecked(id: string) {
    $('#' + id).prop('checked', false);
  }

  public dayChecked(id: string) {
    if (!$('#' + id).prop('checked')) {
      $('#casesemaine').prop('checked', false);
    }
  }

  public weekChecked() {
    var check = true;
    var jour = 0;
    while (check && jour < 5) {
      if (!$('#case' + jour).prop('checked')) {
        check = false;
        jour += 1;
      } else jour += 1;
    }
    if (check) {
      for (let i = 0; i < 5; i++) {
        $('#case' + i).prop('checked', false);
      }
      $('#casesemaine').prop('checked', false);
    } else {
      for (let i = 0; i < 5; i++) {
        $('#case' + i).prop('checked', true);
      }
      $('#casesemaine').prop('checked', true);
    }
  }
}
