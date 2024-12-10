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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Modal } from 'bootstrap'

type Mismatch = {
  matricule_resource: any;
  nom: any;
  immatriculation: any;
};

interface VehiculeAttributes {
  matricule_resource: any;
  immatriculation: any;
  nbr_passagers: number; // Ajoutez cette propriété
}

@Component({
  selector: 'app-vehicules',
  templateUrl: './vehicules.component.html',
  styleUrls: ['./vehicules.component.css']
})
export class VehiculesComponent implements OnInit {
  private MODULE_ID = null;

  private utilisateur;
  public error = 'error';
  public vehicules: any[] = [];
  public chantiers: any;
  public assignations_vehicules: any[] = [];
  public assignations: any[] = [];
  public date;
  public dateFormate!: string | null;
  public semaine: any;
  public dateStart!: string | null;
  public dateEnd!: string | null;
  public idSemaine: number = 0;
  public resources: any[] = [];
  public resources_non_traitees!: number;
  public planning_chantiers: Array<{
    code_chantier: string;
    nom_chantier: string;
    semaine: Array<Array<{
      matricule_resource: any;
      nom: any;
      chef_chantier: any;
      immatriculation: any;
      vehicle_assigned: boolean;
      selected: boolean;
    }>>;
  }> = [];
  public planning: Array<Array<{
    matricule_resource: any;
    nom: any;
    chef_chantier: any;
    immatriculation: any;
    vehicle_assigned: boolean;
    selected: boolean;
  }>> = [];
  public planning_chauffeur = [];
  public passagers: Array<{ numero: number; passager?: string }> = [];
  public passagersAmodifier = [];
  public samedi: boolean = false;
  public chantiers_mismatch: Mismatch[][] = [];
  public nb_mismatch = 0;
  public pos!: number;
  private _lookingDate;

  constructor(private route: ActivatedRoute, private http: HttpClient, private cst: Constants,
    private jwt: JwtHelperService, private toastr: ToastrService, private datePipe: DatePipe) {
    const token = localStorage.getItem('token');
    if (token) {
      this.utilisateur = this.jwt.decodeToken(token);
    } else {
      console.error('Token non trouvé dans le localStorage');
      this.utilisateur = null; // Ou une valeur par défaut
    }
    this._lookingDate = localStorage.getItem('_lookingDate');

    this.MODULE_ID = route.snapshot.data['module_id'];

    if (this._lookingDate === null)
      this.date = new Date(Date.now());
    else
      this.date = new Date(this._lookingDate);
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
    this.samedi = false;
    this.nb_mismatch = 0;
    var planning_chantiers: {
      code_chantier: string;
      nom_chantier: string;
      semaine: {
        matricule_resource: string;
        nom: string;
        chef_chantier: string;
        immatriculation: string;
        vehicle_assigned: boolean;
        selected: boolean;
      }[][];
    }[] = [];
    var assignations_vehicules: {
      immatriculation: string;
      nom: string;
      type: string;
      flocage: string;
      nb_places: number;
      dispo: boolean;
      chauffeurAttitre: string | null;
      domicile: string;
      semaine: {
        matricule_resource: string;
        nom: string;
        chauffeur: boolean;
      }[][];
    }[] = [];
    var assignations: any[] = [];
    this.http.get<Array<any>>(this.cst.apiUrl + 'vehicules').subscribe((vehicules: Array<any>) => {
      this.vehicules = vehicules.map(vehicule => ({
        ...vehicule,
        nb_semaine: vehicule.nb_semaine || 0 // Ajout d'une valeur par défaut
      }));
    }); 0
    this.http.get<Array<any>>(this.cst.apiUrl + 'resources/salaries').subscribe(
      (arr: Array<any>) => {
        this.resources = arr;
        // console.log("This.resources: " + this.resources)
        // console.log("Arr: " + JSON.stringify(arr));
        // console.log("Arr1: " + JSON.stringify(arr[0]));
      });
    this.dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd');
    console.log(this.dateFormate);
    this.http.get<Array<any>>(this.cst.apiUrl + 'assignations' + '/' + this.dateFormate).subscribe(
      (arr: Array<any>) => {
        console.log("Entrée dnas la fonction")
        console.log("Contenu brut de arr : ", arr);
        console.log("Type de arr :", typeof arr);
        console.log("Longueur de arr :", arr.length);
        for (let el of arr) {
          //assignations_chantiers
          console.log("Entrée dans le for. Type assignation = " + el.type_assignation);
          if (el.type_assignation === "chantier") {
            if (el.jour === 5)
              this.samedi = true;
            var bodyC = {
              code_chantier: el.code_chantier,
              nom_chantier: el.nom_chantier,
              conducteur: el.Conducteur,
              commentaires: el.commentaires,
              chef_chantier: el.chef_chantier,
              journee: Number(el.journee)
            }
            var indexResource = assignations.map(function (e) {
              return e.matricule_resource;
            }).indexOf(el.matricule_resource)
            if (indexResource !== -1) {
              if (assignations[indexResource].semaine[el.jour].map(function (e: { code_chantier: any; }) {
                return e.code_chantier;
              }).indexOf(el.code_chantier) === -1)
                assignations[indexResource].semaine[el.jour].push(bodyC)
            } else {
              this.ajoutResourceDansAssignation(assignations, el)
              if (assignations[assignations.length - 1].semaine[el.jour].map(function (e: { code_chantier: any; }) {
                return e.code_chantier;
              }).indexOf(el.code_chantier) === -1)
                assignations[assignations.length - 1].semaine[el.jour].push(bodyC)
            }
          }
          console.log("Test array: " + arr[0])
        }
        console.log("Sortie du for");
        if (!arr || arr.length === 0 || !arr[0].nb_semaine) {
          console.error('API Assignations: Données manquantes ou incorrectes.');
          return;
        }
        this.semaine = arr[0].nb_semaine;
        this.assignations = assignations;
        this.idSemaine = arr[0].id;
        console.log("Semaine: " + this.semaine);
        this.dateStart = this.datePipe.transform(arr[0].date_start, 'dd' + '/' + 'MM' + '/' + 'yyyy')
        this.dateEnd = this.datePipe.transform(arr[0].date_end, 'dd' + '/' + 'MM' + '/' + 'yyyy');
        for (let el of arr) {
          if (el.Type === 'SALARIE' && el.type_assignation === 'chantier') {
            if (el.jour === 5)
              this.samedi = true
            var body = {
              matricule_resource: el.matricule_resource,
              nom: el.Nom,
              chef_chantier: el.chef_chantier,
              immatriculation: el.immatriculation,
              vehicle_assigned: false,
              selected: false
            }
            var indexChantier = planning_chantiers.map(function (e) {
              return e.code_chantier;
            }).indexOf(el.code_chantier)
            if (indexChantier !== -1) {
              if (planning_chantiers[indexChantier].semaine[el.jour].map(function (e: { matricule_resource: any; }) {
                return e.matricule_resource;
              }).indexOf(el.matricule_resource) === -1)
                planning_chantiers[indexChantier].semaine[el.jour].push(body)
            } else {
              planning_chantiers.push({
                code_chantier: el.code_chantier,
                nom_chantier: el.nom_chantier,
                semaine: [[], [], [], [], [], []]
              });
              if (planning_chantiers[planning_chantiers.length - 1].semaine[el.jour].map(
                (e: { matricule_resource: any; nom: any; chef_chantier: any; immatriculation: any; vehicle_assigned: boolean; selected: boolean }) => e.matricule_resource
              ).indexOf(el.matricule_resource) === -1) {
                planning_chantiers[planning_chantiers.length - 1].semaine[el.jour].push(body);
              }

            }
          }
          var sortedArray = planning_chantiers.sort((n1, n2) => {
            return this.naturalCompare(
              (n1.code_chantier || '').toString(),
              (n2.code_chantier || '').toString()
            );
          });

          this.planning_chantiers = planning_chantiers
          this.http.get<Array<any>>(this.cst.apiUrl + 'vehicules/assignations/' + this.idSemaine).subscribe(
            (vehicules: Array<any>) => {

              for (let vehicule of vehicules) {
                if (vehicule.jour === 5)
                  this.samedi = true
                var existe = false;
                var body = {
                  jour: vehicule.jour,
                  matricule_resource: vehicule.matricule_resource,
                  nom: vehicule.Nom,
                  chauffeur: vehicule.chauffeur
                }
                for (let ass of assignations_vehicules) {
                  if (ass.immatriculation === vehicule.immatriculation) {
                    existe = true;
                    if (vehicule.nb_semaine !== null
                      && ass.semaine[vehicule.jour].findIndex((i: { matricule_resource: any; }) => i.matricule_resource === vehicule.matricule_resource) === -1) {
                      ass.semaine[vehicule.jour].push(body)
                    }
                  }
                }
                if (!existe) {
                  var indexChauff = this.resources.map(function (e: { matricule_resource: any; }) {
                    return e.matricule_resource;
                  }).indexOf(vehicule.chauffeurAttitre)
                  assignations_vehicules.push({
                    immatriculation: vehicule.immatriculation,
                    nom: vehicule.Nom,
                    type: vehicule.type,
                    flocage: vehicule.flocage,
                    nb_places: vehicule.nb_places,
                    dispo: vehicule.dispo,
                    chauffeurAttitre: (indexChauff != -1 ? this.resources[indexChauff].Nom : null),
                    domicile: vehicule.domicile,
                    semaine: [[], [], [], [], [], []]
                  });
                  if (vehicule.nb_semaine !== null) {
                    assignations_vehicules[assignations_vehicules.length - 1].semaine[vehicule.jour].push(body)
                  }
                }
              }
              this.assignations_vehicules = assignations_vehicules;

              console.log(this.assignations_vehicules)

              for (let el of assignations_vehicules) {
                for (var jour = 0; jour < el.semaine.length; jour++) {
                  for (let res of el.semaine[jour]) {
                    for (var x = 0; x < this.planning_chantiers.length; x++) {
                      for (var z = 0; z < this.planning_chantiers[x].semaine[jour].length; z++) {
                        if (this.planning_chantiers[x].semaine[jour][z].matricule_resource == res.matricule_resource)
                          this.planning_chantiers[x].semaine[jour][z].vehicle_assigned = true;
                      }
                    }
                  }
                }
              }

            });
          this.http.get<Array<any>>(this.cst.apiUrl + 'vehicules/non_attribues/' + this.idSemaine).subscribe(
            (arr: Array<any>) => {
              var resources_non_traitees = 0;
              if (arr.length !== 0) {
                var semaine = ['', '', '', '', '', '']
                for (let el of arr) {
                  semaine[el.jour] += el.Nom + ' | ';
                  resources_non_traitees++;
                }
                $('#tooltip').remove("title");
                $('#tooltip').attr("title", "Lundi : " + semaine[0] +
                  ' Mardi :' + semaine[1] +
                  ' Mercredi :' + semaine[2]
                  + ' Jeudi :' + semaine[3]
                  + ' Vendredi :' + semaine[4]
                  + ' Samedi :' + semaine[5]);
                //$('#tooltip').tooltip();
              }
              else
                $('#tooltip').attr("title", '');
              this.resources_non_traitees = resources_non_traitees;
            })
          this.http.get<Array<any>>(this.cst.apiUrl + 'vehicules/chantiers_mismatch/' + this.idSemaine).subscribe(
            (arr: Array<any>) => {
              var chantiers_mismatch = [[], [], [], [], [], []];

              var precEl = arr[0];

              var datas: any[] = [];

              arr.forEach((el) => {
                const p = (e: { matricule_resource: any; }) => e.matricule_resource == el.matricule_resource;
                var idx = datas.findIndex(p);

                if (idx == -1) {
                  var obj: any = {};
                  obj.matricule_resource = el.matricule_resource;
                  obj.nom = el.Nom;
                  obj.days = [
                    { chantiers: [], immatriculation: null },
                    { chantiers: [], immatriculation: null },
                    { chantiers: [], immatriculation: null },
                    { chantiers: [], immatriculation: null },
                    { chantiers: [], immatriculation: null },
                    { chantiers: [], immatriculation: null }
                  ];

                  obj.days[el.jour].immatriculation = el.immatriculation;
                  obj.days[el.jour].chantiers.push(el.code_chantier);

                  datas.push(obj);
                }
                else {
                  datas[idx].days[el.jour].immatriculation = el.immatriculation;

                  datas[idx].days[el.jour].chantiers.push(el.code_chantier);
                }
              });

              datas.forEach((el) => {
                for (var i = 0; i < 5; i++) {
                  if (el.days[i].chantiers.length > 0) {
                    for (let data of datas) {
                      if (data.matricule_resource != el.matricule_resource
                        && data.days[i].immatriculation == el.days[i].immatriculation
                        && el.days[i].immatriculation != '_CONVENANCE'
                        && el.days[i].immatriculation != '_PERSONNEL'
                      ) {
                        for (var idx = 0; idx < el.days[i].chantiers.length; idx++) {
                          if (!data.days[i].chantiers.includes(el.days[i].chantiers[idx])) {

                            /*console.log("-- Mismatch --");
                            console.log("Jour " + i);
                            console.log(data.nom + ' vs ' + el.nom);
                            console.log(data.days[i].immatriculation + ' vs ' + el.days[i].immatriculation);
                            console.log(data.days[i].chantiers);
                            console.log('VS');
                            console.log(el.days[i].chantiers[idx]);*/

                            const predicat = (e: { immatriculation: any; matricule_resource: any; }) => e.immatriculation == el.days[i].immatriculation && e.matricule_resource == el.matricule_resource;
                            var z = chantiers_mismatch[i].findIndex(predicat);

                            if (z === -1) {
                              const mismatch: Mismatch = {
                                matricule_resource: el.matricule_resource,
                                nom: el.nom,
                                immatriculation: el.days[i].immatriculation,
                              };

                              (chantiers_mismatch[i] as Mismatch[]).push(mismatch);
                              this.nb_mismatch++;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              });

              this.chantiers_mismatch = Array(6).fill(null).map(() => [] as Mismatch[]);
            });
        }
      });
    this.http.get<Array<any>>(this.cst.apiUrl + 'assignations/' + this.dateFormate).subscribe(
      (arr: Array<any>) => {

      })
  };

  public ajoutResourceDansAssignation(table: any[], resource: { matricule_resource: any; Nom: any; nature: any; Activite: any; Type: any; }) {
    table.push({
      matricule_resource: resource.matricule_resource,
      Nom_matricule: resource.Nom,
      code_nature: resource.nature,
      activite: resource.Activite,
      type: resource.Type,
      semaine: [[], [], [], [], [], []]
    });
  };

  public ModaleSuppression(immatriculation: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node)) {
    $("#matriculeAsupprimer").html(immatriculation)
  };

  public myFunction(): void {
    // Declare variables
    let filter: string | undefined, table, tr, td, i, txtValue, k, success;

    const inputValue = $("#myInput").val();
    filter = inputValue ? inputValue.toString().toUpperCase() : "";

    table = document.getElementById("myTable");
    tr = table?.getElementsByTagName("tr");

    if (!tr) return; // Exit early if `tr` is undefined.

    for (i = 1; i < tr.length; i++) {
      success = false;
      for (k = 0; k < 6; k++) {
        td = tr[i].getElementsByTagName("td")[k];
        if (td) {
          txtValue = td.textContent || td.innerText;
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
            success = true;
          }
        }
      }
      if (success) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }

  public initCopierLigne(immatriculation: any) {
    this.pos = this.assignations_vehicules.map(function (e: { immatriculation: any; }) { return e.immatriculation; }).indexOf(immatriculation)
  }


  public copierLigneSemainePrec() {
    var semaineAcopier = this.idSemaine - 1
    var semaine = this.idSemaine
    var assignations_vehicules = this.assignations_vehicules
    var pos = this.pos

    this.http.post(this.cst.apiUrl + 'vehicules/copierSem/' + assignations_vehicules[pos].immatriculation + '/' + semaineAcopier + '/' + semaine, {}).subscribe(
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

  public async modifierLigne(immatriculation: string | Element | Comment | Document | DocumentFragment | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node)) {
    //vider les input avant
    var index = this.assignations_vehicules.map(function (e: { immatriculation: any; }) { return e.immatriculation; }).indexOf(immatriculation)
    $("#immatriculationAmodifier").html(immatriculation)
    $("#typeAmodifier").html(this.assignations_vehicules[index].type)
    $("#flocageAmodifier").html(this.assignations_vehicules[index].flocage)

    if (immatriculation == '_PERSONNEL' || immatriculation == '_CONVENANCE') {
      for (var i = 0; i < 6; i++) {
        $("#chauffeurAreaLigne_" + i).hide();
      }
    }
    else
      for (var i = 0; i < 6; i++) {
        $("#chauffeurAreaLigne_" + i).show();
      }

    for (let jour of [0, 1, 2, 3, 4, 5]) {
      var index_chauffeur = this.assignations_vehicules[index].semaine[jour].map(function (e: { chauffeur: any; }) { return e.chauffeur; }).indexOf(1)
      if (index_chauffeur !== -1)
        $("#" + jour + "chauffeurAmodifier").val(this.assignations_vehicules[index].semaine[jour][index_chauffeur].nom)
      else
        $("#" + jour + "chauffeurAmodifier").val('')
      var index_passager = 0
      for (let i = 0; i < this.assignations_vehicules[index].nb_places - 1; i++) {
        $("#" + jour + "passager" + i + "Amodifier").css("display", "")
        $("#" + jour + "passager" + i + "Amodifier").val('')
      }
      for (var i = this.assignations_vehicules[index].nb_places - 1; i < 10; i++) {
        $("#" + jour + "passager" + i + "Amodifier").css("display", "none")
        $("#" + jour + "passager" + i + "Amodifier").val('')
      }
      for (let passager of this.assignations_vehicules[index].semaine[jour]) {
        if (passager.chauffeur === 0) {
          $("#" + jour + "passager" + index_passager + "Amodifier").val(passager.nom)
          index_passager++
        }
      }

    }

  };

  public modifierAttributionsVehicule() {
    var indexVeh = this.assignations_vehicules.map(function (e: { immatriculation: any; }) {
      return e.immatriculation;
    }).indexOf($("#immatriculationAmodifier").html())
    var immatriculation = this.assignations_vehicules[indexVeh].immatriculation
    //verifier les noms de poseurs
    var error = false
    for (let jour of [0, 1, 2, 3, 4, 5]) {
      if ($("#" + jour + "chauffeurAmodifier").val() != '') {
        var matriculeChauff = this.resources.map(function (e: { Nom: any; }) {
          return e.Nom;
        }).indexOf($("#" + jour + "chauffeurAmodifier").val())
        if (matriculeChauff === -1 && immatriculation != '_PERSONNEL' && immatriculation != '_CONVENANCE') {
          error = true

          this.toastr.error('Resource ' + $("#" + jour + "chauffeurAmodifier").val() + ' invalide', this.cst.toastrTitle);
        }
      }
      for (let i = 0; i < this.assignations_vehicules[indexVeh].nb_places - 1; i++) {
        if ($("#" + jour + "passager" + i + "Amodifier").val() != '') {
          var matricule = this.resources.map(function (e: { Nom: any; }) {
            return e.Nom;
          }).indexOf($("#" + jour + "passager" + i + "Amodifier").val())

          if (matricule === -1) {
            error = true
            this.toastr.error('Resource ' + $("#" + jour + "passager" + i + "Amodifier").val() + ' invalide', this.cst.toastrTitle);
          }
        }
      }

    }
    if (!error) {
      var listAttributions = [];
      var listDelete = [];

      for (let jour of [0, 1, 2, 3, 4, 5]) {
        var indexChauff = this.assignations_vehicules[indexVeh].semaine[jour].map(function (e: { chauffeur: any; }) {
          return e.chauffeur;
        }).indexOf(1)
        // ajoutChauff

        if (immatriculation != '_PERSONNEL' && immatriculation != '_CONVENANCE') {
          if ($("#" + jour + "chauffeurAmodifier").val() != '' && indexChauff === -1) {
            var matriculeChauffeur = this.resources.map(function (e: { Nom: any; }) {
              return e.Nom;
            }).indexOf($("#" + jour + "chauffeurAmodifier").val());

            var element: any = {};
            element.matricule_resource = matriculeChauffeur;
            element.immatriculation = immatriculation;
            element.chauffeur = 1;
            element.jour = jour;
            element.idSemaine = this.idSemaine;

            listAttributions.push(element);
          }
          //modificationChauff
          else if ($("#" + jour + "chauffeurAmodifier").val() != '' && indexChauff !== -1) {
            var matriculeChauff = this.resources.map(function (e: { Nom: any; }) {
              return e.Nom;
            }).indexOf($("#" + jour + "chauffeurAmodifier").val())
            if (this.assignations_vehicules[indexVeh].semaine[jour][indexChauff].matricule_resource !== this.resources[matriculeChauff].matricule_resource) {
              const bodyChauff = {
                matricule_resource: this.resources[matriculeChauff].matricule_resource,
                old_matricule_resource: this.assignations_vehicules[indexVeh].semaine[jour][indexChauff].matricule_resource,
                immatriculation: immatriculation,
                jour: jour,
                id_semaine: this.idSemaine,
                chauffeur: 1
              }
              this.http.put(this.cst.apiUrl + 'vehicules/modifier', bodyChauff).subscribe(
                prop => {
                  if (!prop)
                    this.toastr.error('Erreur!', this.cst.toastrTitle);
                  else {
                    window.location.reload();
                    $("#modificationVehicule").modal('hide')
                  }
                }
              )
            }
          }
          //suppressionChauff
          else if ($("#" + jour + "chauffeurAmodifier").val() == '' && indexChauff !== -1) {
            var element: any = {};
            element.matricule_resource = this.assignations_vehicules[indexVeh].semaine[jour][indexChauff].matricule_resource;
            element.immatriculation = immatriculation;
            element.chauffeur = 1;
            element.jour = jour;
            element.idSemaine = this.idSemaine;

            listDelete.push(element);
          }
        }


        // ajoutPass
        for (let i = 0; i < this.assignations_vehicules[indexVeh].nb_places - 1; i++) {
          if ($("#" + jour + "passager" + i + "Amodifier").val() != '') {
            var indexPassAmodifier = this.resources.map(function (e: { Nom: any; }) {
              return e.Nom;
            }).indexOf($("#" + jour + "passager" + i + "Amodifier").val())
            var indexPass = this.assignations_vehicules[indexVeh].semaine[jour].map(function (e: { matricule_resource: any; }) {
              return e.matricule_resource;
            }).indexOf(this.resources[indexPassAmodifier].matricule_resource)
            if (indexPass === -1) {
              var element: any = {};
              element.matricule_resource = this.resources[indexPassAmodifier].matricule_resource;
              element.immatriculation = immatriculation;
              element.chauffeur = 0;
              element.jour = jour;
              element.idSemaine = this.idSemaine;

              listAttributions.push(element);
            }
          }
        }

        //suppressionPass
        for (let resource of this.assignations_vehicules[indexVeh].semaine[jour]) {
          if (resource.chauffeur === 0) {
            var toDelete = true
            for (let i = 0; i < this.assignations_vehicules[indexVeh].nb_places - 1; i++) {
              if ($("#" + jour + "passager" + i + "Amodifier").val() != '') {
                var matricule_resource = this.resources.map(function (e: { Nom: any; }) {
                  return e.Nom;
                }).indexOf($("#" + jour + "passager" + i + "Amodifier").val())
                if (this.resources[matricule_resource].matricule_resource === resource.matricule_resource)
                  toDelete = false
              }
            }
            if (toDelete) {
              var element: any = {};
              element.matricule_resource = resource.matricule_resource;
              element.immatriculation = immatriculation;
              element.chauffeur = 1;
              element.jour = jour;
              element.idSemaine = this.idSemaine;

              listDelete.push(element);
            }
          }
        }
      }
      let body = {
        listAttributions: listAttributions,
        listDelete: listDelete
      }

      this.http.post(this.cst.apiUrl + 'vehicules/modifier', body).subscribe(
        prop => {
          if (!prop)
            this.toastr.error('Erreur ici !', this.cst.toastrTitle);
          else {
            $("#modificationVehicule").modal('hide');
            window.location.reload();
          }
        }
      )
    }
    $("#modificationVehicule").modal('hide')
  };

  public initInput() {
    for (let vehicule of this.vehicules) {
      var index = this.assignations_vehicules.map(function (e: { immatriculation: any; }) { return e.immatriculation; }).indexOf(vehicule.immatriculation);
      vehicule.nbr_passagers = this.assignations_vehicules[index].semaine[0].length + '/' + this.assignations_vehicules[index].nb_places;
    }
    $('#chantier').val('');
    $('#poseur').val('');
    $('#vehicule').val('');
    $('#chauffeur').val('');
    $('#passager').val('');
    $("#casesemaine").prop('checked', true);
    for (let i = 0; i < 6; i++)
      $("#case" + i).prop('checked', false);
    $("#casesSemaine").css('display', 'none')
    this.planning = []
    this.passagers = []
  };

  public attribuerVehicule() {
    var vehiculeVal = $("#vehicule").val();
    if (!vehiculeVal) {
      this.toastr.error('Le champ véhicule est requis', this.cst.toastrTitle);
      return;
    }
    var vehicule = (vehiculeVal as string).split(',')[0].trim();

    // Vérification que le champ chantier est une chaîne
    const chantierVal = $("#chantier").val();
    if (!chantierVal || typeof chantierVal !== 'string') {
      this.toastr.error('Le champ chantier est invalide ou non défini', this.cst.toastrTitle);
      return;
    }

    if (
      this.planning_chantiers.map((e) => e.code_chantier).indexOf(chantierVal.substr(0, 8)) === -1 &&
      chantierVal !== ''
    ) {
      this.toastr.error('Chantier non existant ou non attribué sur le planning chantiers!', this.cst.toastrTitle);
    } else if (vehicule === '') {
      this.toastr.error('Champs véhicule requis!', this.cst.toastrTitle);
    } else if (
      this.assignations_vehicules.map((e: { immatriculation: any }) => e.immatriculation).indexOf(vehicule) === -1
    ) {
      this.toastr.error('Véhicule non existant!', this.cst.toastrTitle);
    } else if ($("#chauffeur").val() === '' && vehicule !== '_PERSONNEL' && vehicule !== '_CONVENANCE') {
      this.toastr.error('Champs chauffeur requis!', this.cst.toastrTitle);
    } else if (
      this.resources.map((e: { Nom: any }) => e.Nom).indexOf($("#chauffeur").val()) === -1 &&
      vehicule !== '_PERSONNEL' &&
      vehicule !== '_CONVENANCE'
    ) {
      this.toastr.error('Chauffeur non existant', this.cst.toastrTitle);
    }
    // Parcourir la modal
    else {
      var indexchauffeur = this.resources
        .map((e: { Nom: any }) => e.Nom)
        .indexOf($("#chauffeur").val());
      var indexvehicule = this.assignations_vehicules
        .map((e: { immatriculation: any }) => e.immatriculation)
        .indexOf(vehicule);
      if ($("#casesemaine").prop('checked')) {
        for (let jour = 0; jour < 5; jour++) this.planifier(indexvehicule, indexchauffeur, jour, vehicule);
      } else {
        for (let jour = 0; jour < 6; jour++) {
          if ($("#case" + jour).prop('checked')) {
            this.planifier(indexvehicule, indexchauffeur, jour, vehicule);
          }
        }
      }
    }
  }

  public planifier(indexvehicule: number, indexchauffeur: number, jour: number, vehicule: string) {
    var indexchauffeurassigne = (this.assignations_vehicules[indexvehicule].semaine[jour] as Array<{ chauffeur: number }>).map(
      (e) => e.chauffeur
    ).indexOf(1);

    var mat = indexchauffeur == -1 ? null : this.resources[indexchauffeur].matricule_resource;

    const chantierVal = $("#chantier").val();
    if (!chantierVal) {
      this.toastr.error("Chantier non spécifié ou introuvable", this.cst.toastrTitle);
      return;
    }

    const chantierCode = String(chantierVal).substr(0, 8);

    const body = {
      chantier: chantierCode,
      immatriculation: vehicule,
      matricule_resource: mat,
      chauffeur: 1,
      id_semaine: this.idSemaine,
      jour: jour,
      old_matricule_resource: '',
    };

    if (indexchauffeurassigne === -1) {
      if (vehicule !== '_PERSONNEL' && vehicule !== '_CONVENANCE') {
        this.attribuer(body);
      }
    } else if (vehicule !== '_PERSONNEL' && vehicule !== '_CONVENANCE') {
      var old_chauffeur = this.assignations_vehicules[indexvehicule].semaine[jour][indexchauffeurassigne].matricule_resource;
      body.old_matricule_resource = old_chauffeur;
      if (old_chauffeur !== this.resources[indexchauffeur].matricule_resource) {
        this.modifier(body);
      }
    }

    for (let pass of this.passagers) {
      const passNumero = pass.numero; // Assurez-vous que 'numero' est bien défini
      var indexpassager = this.resources
        .map((e: { Nom: any }) => e.Nom)
        .indexOf($("#passager" + passNumero).val());

      if (indexpassager === -1 && $("#passager" + passNumero).val() !== "") {
        this.toastr.error("Passager non existant", this.cst.toastrTitle);
      } else {
        const i = this.resources
          .map((e: { Nom: any }) => e.Nom)
          .indexOf(pass.passager);

        const body1 = {
          chantier: chantierCode,
          immatriculation: vehicule,
          matricule_resource: "",
          chauffeur: 0,
          id_semaine: this.idSemaine,
          jour: jour,
          old_matricule_resource: "",
        };

        if (!pass.passager && $("#passager" + passNumero).val() !== "" && i === -1) {
          body1.matricule_resource = this.resources[indexpassager].matricule_resource;
          this.attribuer(body1);
        } else if ($("#passager" + passNumero).val() === "" && i !== -1) {
          body1.old_matricule_resource = this.resources[i].matricule_resource;
          this.supprimer(body1);
        } else if ($("#passager" + passNumero).val() !== pass.passager && i !== -1) {
          body1.old_matricule_resource = this.resources[i].matricule_resource;
          body1.matricule_resource = this.resources[indexpassager].matricule_resource;
          this.modifier(body1);
        }
      }
    }
  }

  public attribuer(body: { chantier?: any; immatriculation: any; matricule_resource: any; chauffeur: number; id_semaine: any; jour: any; old_matricule_resource?: string }): boolean {
    let prop = false;

    this.http.post(this.cst.apiUrl + 'vehicules/creation_assignation', body).subscribe({
      next: (response) => {
        prop = true;
      },
      error: () => {
        this.toastr.error('Erreur', this.cst.toastrTitle);
      },
      complete: () => {
        if (!prop) {
          this.toastr.error('Erreur', this.cst.toastrTitle);
          return false;
        } else {
          window.location.reload();
          $('#attributionVehicule').modal('hide');
          return true;
        }
      }
    });

    return false; // Assurez un retour par défaut pour tous les chemins.
  }

  public modifier(body: { chantier: any; immatriculation: any; matricule_resource: any; chauffeur: number; id_semaine: any; jour: any; old_matricule_resource: string; }) {
    this.http.put(this.cst.apiUrl + 'vehicules/modifier', body).subscribe(
      prop => {
        if (!prop)
          this.toastr.error('Erreur!', this.cst.toastrTitle);
        else {
          window.location.reload();
          $('#attributionVehicule').modal('hide')
        }
      }
    )
  };

  public supprimer(body: { chantier?: any; immatriculation: any; matricule_resource?: string; chauffeur?: number; id_semaine?: any; jour: any; old_matricule_resource: any; }) {
    this.http.delete(this.cst.apiUrl + 'vehicules/supression_assignation/' + body.immatriculation + '/' +
      this.idSemaine + '/' + body.jour + '/' + body.old_matricule_resource).subscribe(
        remove => {
          if (!remove)
            this.toastr.error('Erreur!', this.cst.toastrTitle);
          else {
            window.location.reload();
            $('#attributionVehicule').modal('hide')
          }
        }
      )
  };

  public casesSemaine() {
    if (!$("#casesemaine").prop('checked'))
      $("#casesSemaine").css('display', '')
    else {
      $("#casesSemaine").css('display', 'none')
      for (let i = 0; i < 6; i++)
        $("#case" + i).prop('checked', false)
    }

  };

  public supprimerAttributionVehicule() {
    var immatriculation = $("#matriculeAsupprimer").html()
    this.http.delete(this.cst.apiUrl + 'vehicules/supression/' + immatriculation + '/' + this.idSemaine).subscribe(
      remove => {
        if (!remove)
          this.toastr.error('Erreur !', this.cst.toastrTitle);
        else {
          this.toastr.success('Ligne supprimée !', this.cst.toastrTitle);
          window.location.reload();
          $('#supprimerLigneVehicule').modal('hide')
        }
      })
  };

  //dynamique de la modale attributions de vehicules

  public remplirPlanningSemaine() {
    // Récupérer la valeur du champ
    const chantierVal = $("#chantier").val();

    // Vérifier si la valeur est définie et est une chaîne
    if (!chantierVal || typeof chantierVal !== "string") {
      this.toastr.error("Chantier non spécifié ou introuvable", this.cst.toastrTitle);
      return;
    }

    // Extraire le code chantier
    const code_chantier = chantierVal.substr(0, 8);

    // Trouver l'index dans planning_chantiers
    const index = this.planning_chantiers.map((e) => e.code_chantier).indexOf(code_chantier);

    // Si le chantier n'est pas trouvé
    if (index === -1) {
      this.toastr.error("Code chantier non trouvé", this.cst.toastrTitle);
      return;
    }

    // Assignation des données de planification
    this.planning = this.planning_chantiers[index].semaine;

    // Parcourir les jours et ressources
    for (let jour of this.planning_chantiers[index].semaine) {
      for (let resource of jour) {
        if (resource.immatriculation !== null) {
          $("#poseur").val(resource.nom);
          this.remplirPlanningPoseur();
          $("#chauffeur").val(resource.nom);
          this.remplirChauffeur();
        }
      }
    }
  }

  public remplirPlanningPoseur() {
    var indexChauffeur = this.resources.map(function (e: { Nom: any; }) { return e.Nom; }).indexOf($("#poseur").val())
    if (indexChauffeur !== -1) {
      var chantier = this.assignations.map(function (e: { matricule_resource: any; }) {
        return e.matricule_resource;
      }).indexOf(this.resources[indexChauffeur].matricule_resource)
      if (chantier !== -1)
        this.planning_chauffeur = this.assignations[chantier].semaine;
      else
        this.planning_chauffeur = []
    }
    else
      this.planning_chauffeur = []
  };

  public personClicked(res: { nom: string; matricule_resource: any }) {
    let removed = false;

    for (let pass of this.passagers) {
      const passNumero = pass.numero; // Assurez-vous que `numero` est bien défini

      // Vérification et mise à jour des valeurs
      const passInput = $(`#passager${passNumero}`).val() as string | undefined;

      if (passInput === res.nom) {
        $(`#passager${passNumero}`).val(""); // Réinitialiser
        for (var x = 0; x < this.planning_chantiers.length; x++) {
          for (var y = 0; y < this.planning_chantiers[x].semaine.length; y++) {
            for (var z = 0; z < this.planning_chantiers[x].semaine[y].length; z++) {
              if (this.planning_chantiers[x].semaine[y][z].matricule_resource === res.matricule_resource) {
                this.planning_chantiers[x].semaine[y][z].selected = false;
              }
            }
          }
        }
        removed = true;
        break;
      }
    }

    if (!removed) {
      for (let pass of this.passagers) {
        const passNumero = pass.numero; // Assurez-vous que `numero` est bien défini
        const passInput = $(`#passager${passNumero}`).val() as string | undefined;

        if (passInput === "") {
          $(`#passager${passNumero}`).val(res.nom); // Assigner la valeur
          for (var x = 0; x < this.planning_chantiers.length; x++) {
            for (var y = 0; y < this.planning_chantiers[x].semaine.length; y++) {
              for (var z = 0; z < this.planning_chantiers[x].semaine[y].length; z++) {
                if (this.planning_chantiers[x].semaine[y][z].matricule_resource === res.matricule_resource) {
                  this.planning_chantiers[x].semaine[y][z].selected = true;
                }
              }
            }
          }
          break;
        }
      }
    }
  }

  public remplirVehicule() {
    this.passagers = [];

    const vehiculeVal = $("#vehicule").val(); // Récupère la valeur

    // Vérifie si la valeur est définie
    if (typeof vehiculeVal !== "string" || !vehiculeVal) {
      console.error("La valeur du champ 'vehicule' est introuvable ou invalide.");
      return;
    }

    // Traite la valeur
    const immatriculation = vehiculeVal.split(",")[0].trim();

    const indexVehicle = this.vehicules.map((e: { immatriculation: any }) => e.immatriculation).indexOf(immatriculation);

    if (immatriculation === "_PERSONNEL" || immatriculation === "_CONVENANCE") {
      $("#chauffeurArea").hide();
    } else {
      $("#chauffeurArea").show();
    }

    if (indexVehicle !== -1) {
      for (let i = 0; i < this.vehicules[indexVehicle].nb_places - 1; i++) {
        this.passagers.push({ numero: i });
      }
    } else {
      this.passagers = [];
    }

    if ($("#chauffeur").val() === "" && indexVehicle !== -1) {
      const indexAssignations = this.assignations_vehicules
        .map((e: { immatriculation: any }) => e.immatriculation)
        .indexOf(immatriculation);

      // Remplir les passagers et le chauffeur déjà assignés
      if (this.assignations_vehicules[indexAssignations].semaine[0].length !== 0) {
        let i = 0;
        for (const res of this.assignations_vehicules[indexAssignations].semaine[0]) {
          if (res.chauffeur === 1) {
            this.passagers[i].passager = res.nom;
          } else {
            $("#chauffeur").val(res.nom);
          }
          i++;
        }
      } else {
        // Pas encore d'attribution sur ce véhicule
        const indexChauffeur = this.resources.map((e: { matricule_resource: any }) => e.matricule_resource)
          .indexOf(this.vehicules[indexVehicle].chauffeur);

        if (indexChauffeur !== -1) {
          $("#chauffeur").val(this.resources[indexChauffeur].Nom);
        }
      }
    }
  }

  public remplirChauffeur() {
    const indexChauffeur = this.resources.map((e: { Nom: any }) => e.Nom)
      .indexOf($("#chauffeur").val()?.toString() || ""); // Ajoutez une valeur par défaut

    if (indexChauffeur === -1) {
      return; // Arrêtez si le chauffeur n'existe pas
    }

    const indexImmat = this.vehicules.map((e: { chauffeur: any }) => e.chauffeur)
      .indexOf(this.resources[indexChauffeur].matricule_resource);

    if (($("#vehicule").val()?.toString() || "") === "" && indexImmat !== -1) {
      if (($("#poseur").val()?.toString() || "") === "") {
        $("#poseur").val($("#chauffeur").val()?.toString() || ""); // Utilisez une valeur par défaut
      }
    }

    // Vérifiez les assignations
    const indexAssignations = this.assignations_vehicules.map((e: { immatriculation: any }) => e.immatriculation)
      .indexOf(this.vehicules[indexImmat]?.immatriculation);

    if (
      this.assignations_vehicules[indexAssignations]?.semaine[0]?.length > 0 &&
      this.assignations_vehicules[indexAssignations]?.semaine[0].some((e: { chauffeur: any }) =>
        e.chauffeur === this.resources[indexChauffeur]?.matricule_resource)
    ) {
      return;
    }

    // Remplir les passagers si aucune assignation existante
    if (($("#vehicule").val()?.toString() || "") === "") {
      const nbPlaces = this.vehicules[indexImmat]?.nb_places - 1 || 0;
      for (let i = 0; i < nbPlaces; i++) {
        this.passagers.push({ numero: i });
      }
    }
  }



  public async genererPlanning() {
    //parcourir les équipes chantier
    const vehicules_attribues_semaine: string[][] = [];

    for (let jour = 0; jour < 6; jour++) {
      const vehicules_attribues: string[] = [];
      const poseurs_attribues: string[][] = [];

      //parcourir les jours de la semaine
      for (let chantier of this.planning_chantiers) {
        const nbr_poseurs = chantier.semaine[jour]?.length || 0; // Vérification pour éviter erreurs si undefined
        const chauffeurs: { matricule_resource: string; immatriculation: string }[] = [];
        poseurs_attribues.push([]);

        var index_chantier = this.planning_chantiers.indexOf(chantier);

        //parcourir les équipes chantier
        for (let poseur of chantier.semaine[jour] || []) {
          if (poseur.immatriculation) {
            chauffeurs.push({
              matricule_resource: poseur.matricule_resource,
              immatriculation: poseur.immatriculation,
            });
          }
        }

        //remplir les vehicules avec chauffeur attribue
        if (chauffeurs.length !== 0) {
          for (let vehicule of chauffeurs) {
            const index_vehicule = this.vehicules.findIndex(
              (e) => e.immatriculation === vehicule.immatriculation
            );

            // Vérifier si le chauffeur n'est pas déjà attribué
            if (
              poseurs_attribues[index_chantier].indexOf(vehicule.matricule_resource) === -1 &&
              vehicules_attribues.indexOf(vehicule.immatriculation) === -1
            ) {
              // Attribuer le chauffeur
              const body = {
                immatriculation: vehicule.immatriculation,
                matricule_resource: vehicule.matricule_resource,
                chauffeur: 1,
                id_semaine: this.idSemaine,
                jour: jour,
              };
              await this.attribuer(body);
              vehicules_attribues.push(vehicule.immatriculation);
              poseurs_attribues[index_chantier].push(vehicule.matricule_resource);

              let nbr_passagers = 1;
              let index_poseur = 0;

              //attribuer les passagers
              while (
                nbr_passagers < (this.vehicules[index_vehicule]?.nb_places || 0) &&
                poseurs_attribues[index_chantier].length < nbr_poseurs &&
                index_poseur < nbr_poseurs
              ) {
                if (
                  poseurs_attribues[index_chantier].indexOf(
                    chantier.semaine[jour][index_poseur]?.matricule_resource
                  ) === -1
                ) {
                  const body = {
                    immatriculation: vehicule.immatriculation,
                    matricule_resource: chantier.semaine[jour][index_poseur]?.matricule_resource,
                    chauffeur: 0,
                    id_semaine: this.idSemaine,
                    jour: jour,
                  };
                  await this.attribuer(body);
                  poseurs_attribues[index_chantier].push(
                    chantier.semaine[jour][index_poseur]?.matricule_resource
                  );
                  nbr_passagers++;
                }
                index_poseur++;
              }
            }
          }
        }
      }
      for (let chantier of this.planning_chantiers) {
        var nbr_poseurs = chantier.semaine[jour].length;
        let index_vehicule = 0;
        const index_chantier = this.planning_chantiers.indexOf(chantier);

        while (poseurs_attribues[index_chantier].length < nbr_poseurs) {
          if (vehicules_attribues.indexOf(this.vehicules[index_vehicule].immatriculation) === -1) {

            //trouver chauffeur
            let index_poseur = 0;

            while (
              poseurs_attribues[index_chantier].indexOf(
                chantier.semaine[jour][index_poseur]?.matricule_resource || ""
              ) !== -1
            ) {
              index_poseur += 1
            }
            //attribuer un chauffeur
            var body = {
              immatriculation: this.vehicules[index_vehicule].immatriculation,
              matricule_resource: chantier.semaine[jour][index_poseur].matricule_resource,
              chauffeur: 1,
              id_semaine: this.idSemaine,
              jour: jour
            }
            this.attribuer(body)
            vehicules_attribues.push(this.vehicules[index_vehicule].immatriculation)
            poseurs_attribues[index_chantier].push(chantier.semaine[jour][index_poseur].matricule_resource)
            var nbr_passagers = 1
            //attribuer les passagers
            while (nbr_passagers < this.vehicules[index_vehicule].nb_places
              && poseurs_attribues[index_chantier].length < nbr_poseurs
              && index_poseur < nbr_poseurs) {
              if (poseurs_attribues[index_chantier].indexOf(chantier.semaine[jour][index_poseur].matricule_resource) === -1) {
                var body = {
                  immatriculation: this.vehicules[index_vehicule].immatriculation,
                  matricule_resource: chantier.semaine[jour][index_poseur].matricule_resource,
                  chauffeur: 0,
                  id_semaine: this.idSemaine,
                  jour: jour
                }
                this.attribuer(body)
                poseurs_attribues[index_chantier].push(chantier.semaine[jour][index_poseur].matricule_resource)
                nbr_passagers += 1
              }
              index_poseur += 1
            }
          }
          index_vehicule += 1
        }
      }
      vehicules_attribues_semaine.push(vehicules_attribues)
    }
  };

  //Action lors du bouton de semaine suivante , charge les données de la semaine suivante pour les afficher
  public semaineSuivante(): void {
    this.date.setDate(this.date.getDate() + 7);

    var dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'WW' + '-' + 'dd') || '';
    localStorage.setItem('_lookingDate', dateFormate);

    this.loadData();
  }

  //Action lors du bouton de semaine précédente , charge les données de la semaine précédente pour les afficher
  public semainePrecedente(): void {
    if (this.idSemaine > 1) {
      this.date.setDate(this.date.getDate() - 7);

      var dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd') || '';
      localStorage.setItem('_lookingDate', dateFormate);

      this.loadData();
    }
  }

  public copierSemainePrec() {
    var semaine = this.idSemaine - 1;
    this.http.post(this.cst.apiUrl + 'assignationsvehicules/copiersemaine/' + semaine + '/' + this.idSemaine, {}).subscribe(
      prop => {
        if (prop) {
          $('#copierSemainePrec').modal('hide');
          window.location.reload();
        }
        else
          this.toastr.error('Erreur !', this.cst.toastrTitle);
      })
  };

  public imprimer() {
    var doc = new jsPDF('p', 'mm', 'a2');

    doc.setFontSize(18);
    doc.text('Planning véhicules ' + $('#date_planning').html().toLowerCase(), 80, 10);
    doc.setFontSize(15);
    doc.setTextColor(100);

    (doc as any).autoTable({
      html: '#tableImpression',
      theme: 'grid',
      styles: { halign: 'center' },
    })
    doc.output('dataurlnewwindow')
    doc.save('planningS' + this.idSemaine + '.pdf');
  };

  public dejaAttribue(matricule_resource: any, jour: string | number) {
    for (let veh of this.assignations_vehicules) {
      if (veh.semaine[jour].map(function (e: { matricule_resource: any; }) { return e.matricule_resource; }).indexOf(matricule_resource) !== -1)
        return true
    }
    return false
  };

  public showDetails() {
    $('#mismatchDetails').modal('show');
  }


  private naturalCompare(a: string | any, b: string | any): number {
    const ax: any[][] = [];
    const bx: any[][] = [];

    (a || '').toString().replace(/(\d+)|(\D+)/g, function (_: any, $1: any, $2: any) {
      ax.push([$1 || Infinity, $2 || '']);
      return '';
    });

    (b || '').toString().replace(/(\d+)|(\D+)/g, function (_: any, $1: any, $2: any) {
      bx.push([$1 || Infinity, $2 || '']);
      return '';
    });

    while (ax.length && bx.length) {
      const an = ax.shift();
      const bn = bx.shift();

      // Vérifiez si 'an' et 'bn' ne sont pas undefined avant d'accéder à leurs éléments
      if (!an || !bn) {
        return (an ? 1 : -1) - (bn ? 1 : -1);
      }

      const nn = (an[0] as number) - (bn[0] as number) || (an[1] as string).localeCompare(bn[1] as string);
      if (nn) return nn;
    }

    return ax.length - bx.length;
  }

}
