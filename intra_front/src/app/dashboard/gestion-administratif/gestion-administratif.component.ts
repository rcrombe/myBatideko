import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestion-administratif',
  templateUrl: './gestion-administratif.component.html',
  styleUrls: ['./gestion-administratif.component.css']
})
export class GestionAdministratifComponent implements OnInit {
  private utilisateur;
  public personnes: any[] = [];
  public societes: any[] = [];


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
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion-administratif').subscribe(
      (arr: Array<any>) => { this.personnes = arr },
    )
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_societes').subscribe(
      (arr: Array<any>) => { console.log(arr); this.societes = arr; })
  }

  //filtrer par nom de personne
  public myFunction(): void {
    // Déclarer les variables
    let input = document.getElementById("filtrer_personnes") as HTMLInputElement | null;
    if (!input) {
      console.error("L'élément avec l'ID 'filtrer_personnes' est introuvable.");
      return;
    }
    const filter = input.value.toUpperCase();
    const table = document.getElementById("myTable") as HTMLTableElement | null;
    if (!table) {
      console.error("L'élément avec l'ID 'myTable' est introuvable.");
      return;
    }
    const tr = table.getElementsByTagName("tr");

    // Boucler sur toutes les lignes du tableau et masquer celles qui ne correspondent pas à la recherche
    for (let i = 0; i < tr.length; i++) {
      const td = tr[i].getElementsByTagName("td")[0];
      if (td) {
        const txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }
  }

  public initAjoutPersonne() {
    $("#nom").val("");
    $("#prenom").val("");
    $("#mail").val("");
  }

  //ajouter une personne dans la base de données
  public ajouterPersonne() {
    const body = {
      matricule: $("#nom").val(),
      nom: $("#prenom").val(),
      email: $("#mail").val()
    }

    this.http.post(this.cst.apiUrl + 'gestion-administratif/creation', body).subscribe(
      prop => {
        if (prop) {
          this.toastr.success('Personne ajoutée !', this.cst.toastrTitle);
          $('#ajoutPersonne').modal('hide');
          window.location.reload();
          var list = ['2', '3', '4', '5']
          if (list.indexOf(this.utilisateur.loglevel) !== -1)
            console.log('eheh')
        } else {
          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    )
  }

  //Afficher la modale de suppression de personne
  public supprimer(id: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node), nom: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node)) {
    $("#idASupprimer").html(id);
    $("#nomASupprimer").html(nom);
    $('#supprimePersonne').modal('show');
  }

  //Supprimer une personne de la base de données
  public supprimerPersonne() {
    var id = $("#idASupprimer").html();

    $('#supprimePersonne').modal('hide');

    this.http.delete(this.cst.apiUrl + 'gestion-administratif/' + id).subscribe(
      remove => {
        if (remove) {
          this.toastr.success('Personne supprimée !', this.cst.toastrTitle);
          this.loadData();

        } else {

          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    );

  }

  //Afficher la modale de modification de personne
  public modifiePersonne(personne: { matricule_resource: string | number | string[]; Nom: string; email: string; }) {
    $('#matriculeModifie').val(String(personne.matricule_resource));
    $('#nomModifie').val(personne.Nom);
    $('#emailModifie').val(personne.email);
    $('#idModifie').html(String(personne.matricule_resource));
    $('#modifierPersonne').modal('show');
  }

  //modofier une personne dans la base de donnees
  public modidiferPersonne() {
    const body = {
      id: $('#idModifie').html(),
      nom: $('#nomModifie').val(),
      matricule: $('#matriculeModifie').val(),
      email: $('#emailModifie').val(),
    }

    this.http.put(this.cst.apiUrl + 'gestion-administratif/edit', body).subscribe(
      prop => {
        if (prop) {
          this.toastr.success('Personne modifiée !', this.cst.toastrTitle);
          $('#modifierPersonne').modal('hide');
          this.loadData();
        } else {
          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    );
  }


  public modifieSociete(resource: { societe: string | number; matricule_resource: string }) {
    console.log("Ressource :", resource);

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
          this.toastr.success('Ressource modifiée !', this.cst.toastrTitle);
          $('#modifierSociete').modal('hide');
          this.loadData();
        } else {
          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    );
  }
}
