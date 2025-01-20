import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Modal } from 'bootstrap';

interface Resource {
  societe: string | null;
  matricule_resource: string;
}

@Component({
  selector: 'app-gestion-resources',
  templateUrl: './gestion-resources.component.html',
  styleUrls: ['./gestion-resources.component.css']
})
export class GestionResourcesComponent implements OnInit {

  public resources: any[] = [];
  public attributs: any[] = [];
  public societes: any[] = [];
  private utilisateur;

  constructor(private http: HttpClient, private cst: Constants, private jwt: JwtHelperService, private toastr: ToastrService) {

    const token = localStorage.getItem('token');
    if (token) {
      this.utilisateur = this.jwt.decodeToken(token);
    } else {
      console.error('Token non trouvé dans le localStorage');
      this.utilisateur = null; // Ou une valeur par défaut
    }

    this.loadData();
  }

  ngOnInit() {
  }

  public loadData(): void {
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion-resources').subscribe(
      (arr: Array<any>) => { console.log(arr); this.resources = arr; })
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion-resources/attributs').subscribe(
      (arr: Array<any>) => { this.attributs = arr; })
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_societes').subscribe(
      (arr: Array<any>) => { console.log("lol"); console.log(arr); this.societes = arr; })
  }


  public changeActif(id: any, Actif: number) {
    if (Actif == 1) {
      const body = {
        Actif: 0,
        id: id
      }
      this.http.put(this.cst.apiUrl + 'resources/actif', body).subscribe(
        prop => {
          if (prop) {
            this.cst.showSuccess('Utilisateur modifié !','X');
            this.loadData();
          } else {
            this.cst.showError('Erreur !', 'X');
          }
        }
      )
    }
    else {
      const body = {
        Actif: 1,
        id: id
      }
      this.http.put(this.cst.apiUrl + 'resources/actif', body).subscribe(
        prop => {
          if (prop) {
            this.cst.showSuccess('Utilisateur modifié !','X');
            this.loadData();
          } else {
            this.cst.showError('Erreur !', 'X');
          }
        }
      )
    }
  }

  public initGestionAttributs() {
    for (let res of this.resources) {
      for (let attr of this.attributs) {
        var index = res.attributs.map(function (e: { code_attribut: any; }) { return e.code_attribut }).indexOf(attr.code);
        if (index === -1)
          $("#" + res.matricule_resource + "_" + attr.code).prop('checked', false);
        else
          $("#" + res.matricule_resource + "_" + attr.code).prop('checked', true);
      }
    }
  };

  public modificationAttributs() {
    for (let res of this.resources) {
      for (let attr of this.attributs) {
        var index = res.attributs.map(function (e: { code_attribut: any; }) { return e.code_attribut }).indexOf(attr.code);
        if ($("#" + res.matricule_resource + "_" + attr.code).prop('checked') && index === -1) {
          var body = {
            code_ressource: res.matricule_resource,
            code_attribut: attr.code,
          }
          this.http.put(this.cst.apiUrl + 'gestion-resources/inserer', body).subscribe(
            prop => {
              if (!prop) {
                this.cst.showError('Erreur !', 'X');
              }
            })
        }
        else if (!$("#" + res.matricule_resource + "_" + attr.code).prop('checked') && index !== -1) {
          var body = {
            code_ressource: res.matricule_resource,
            code_attribut: attr.code,
          }
          this.http.put(this.cst.apiUrl + 'gestion-resources/suppression', body).subscribe(
            prop => {
              if (!prop) {
                this.cst.showError('Erreur !', 'X');
              }
            })
        }
      }
    }
    $("#gestionAttributs").modal('hide');
    window.location.reload();
  }

  public myFunction(tableau: string, inputId: string | null): void {
    // Declare variables
    let inputElement: HTMLInputElement | null, filter, table, tr, td, i, txtValue;

    inputElement = document.getElementById(inputId as string) as HTMLInputElement; // Type assertion
    if (!inputElement) return; // Vérification de sécurité
    filter = inputElement.value.toUpperCase();

    table = document.getElementById(tableau);
    if (!table) return; // Vérification de sécurité
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


  //Afficher la modale de modification de password
  public modifieTuteur(resource: { Nom: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); tuteur: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string) | null; matricule_resource: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node); }) {
    console.log(resource)

    $('#nomModifieTuteur').val(resource.Nom);
    if (resource.tuteur == null)
      $('#matriculeModifieTuteur').val('_NONE').change();
    else
      $('#matriculeModifieTuteur').val(resource.tuteur).change();

    $('#idModifieTuteur').html(resource.matricule_resource);

    $('#modifierTuteur').modal('show');
  }

  public modifierTuteur() {
    const body = {
      id: $('#idModifieTuteur').html(),
      _data_: $('#matriculeModifieTuteur').val()
    }
    console.log(body)

    this.http.put(this.cst.apiUrl + 'resources/tuteur', body).subscribe(
      prop => {
        if (prop) {
          this.cst.showSuccess('Ressource modifiée !', 'X');
          $('#modifierTuteur').modal('hide');
          this.loadData();
        } else {
          this.cst.showError('Erreur !', 'X');
        }
      }
    );
  }

  public modifieIDPointage(resource: { id_mytime: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); matricule_resource: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node); }) {
    console.log(resource)

    $('#idPointage').val(resource.id_mytime);

    $('#idModifierIdPointage').html(resource.matricule_resource);

    $('#modifierIdPointage').modal('show');
  }

  public modifierIDPointage() {
    const body = {
      id: $('#idModifierIdPointage').html(),
      _data_: $('#idPointage').val()
    }

    if (body._data_ == '' || body._data_ == null)
      body._data_ = '_NONE';
    console.log(body)

    this.http.put(this.cst.apiUrl + 'resources/idPointage', body).subscribe(
      prop => {
        if (prop) {
          this.cst.showSuccess('Ressource modifiée !', 'X');
          $('#modifierIdPointage').modal('hide');
          this.loadData();
        } else {
          this.cst.showError('Erreur !', 'X');
        }
      }
    );
  }

  public modifieSociete(resource: Resource): void {
    console.log("Ressource :", resource);

    // Utilisation de jQuery pour définir la valeur dans l'élément avec ID "idSociete"
    $('#idSociete').val(resource.societe != null ? resource.societe : 0);

    $('#idModifierSociete').html(resource.matricule_resource);

    $('#modifierSociete').modal('show');
  }

  public modifierSociete() {
    const body = {
      id: $('#idModifierSociete').html(),
      _data_: $('#idSociete').val()
    }

    if (body._data_ == '' || body._data_ == null)
      body._data_ = '_NONE';
    console.log(body)

    this.http.put(this.cst.apiUrl + 'resources/societe', body).subscribe(
      prop => {
        if (prop) {
          this.cst.showSuccess('Ressource modifiée !', 'X');
          $('#modifierSociete').modal('hide');
          this.loadData();
        } else {
          this.cst.showError('Erreur !', 'X');
        }
      }
    );
  }

}
