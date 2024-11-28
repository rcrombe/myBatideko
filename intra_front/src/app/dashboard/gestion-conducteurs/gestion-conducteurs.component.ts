import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestion-conducteurs',
  templateUrl: './gestion-conducteurs.component.html',
  styleUrls: ['./gestion-conducteurs.component.css']
})
export class GestionConducteursComponent implements OnInit {

  private utilisateur;
  public conducteurs: any[] = [];

  public g_redirection_editing = null;

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

  ngOnInit(): void {
  }

  public loadData(): void {
    var _conducteurs: any[] = []

    this.http.get<Array<any>>(this.cst.apiUrl + 'conducteurs').subscribe(
      (arr: Array<any>) => {
        for (let el of arr) {
          var index = _conducteurs.findIndex(i => i.initiales === el.initiales);
          if (index === -1) {
            _conducteurs.push({
              initiales: el.initiales,
              nom: el.nom,
              prenom: el.prenom,
              redirection_prenom: el.redirection_prenom,
              redirection_nom: el.redirection_nom,
              redirection_nav_id: el.redirection_nav_id,
              electricien: el.electricien,
              couleur: el.couleur
            })
          }
          else {
            _conducteurs[index].couleur = el.couleur;
            _conducteurs[index].nom = el.nom;
            _conducteurs[index].prenom = el.prenom;
            _conducteurs[index].redirection_prenom = el.redirection_prenom;
            _conducteurs[index].redirection_nom = el.redirection_nom;
            _conducteurs[index].redirection_nav_id = el.redirection_nav_id;
            _conducteurs[index].electricien = el.electricien;
            _conducteurs[index].initiales = el.initiales
          }
          $("#couleur_" + el.initiales).css("background-color", el.couleur)
        }

        this.conducteurs = _conducteurs;
      });

  }


  public modalConducteur(conducteur: { couleur: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); initiales: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); }) {
    $("#modifColor").val(conducteur.couleur);
    $("#modifCode").val(conducteur.initiales)
  }

  public modifierConducteur() {
    const body = {
      couleur: $("#modifColor").val(),
      initiales: $("#modifCode").val(),
    }
    this.http.put(this.cst.apiUrl + 'conducteurs/modifColor', body).subscribe(
      prop => {
        if (!prop) {
          this.cst.showError('Erreur !', 'X');
        } else {
          window.location.reload();
          $('#modifierConducteur').modal('hide');
        }
      });
  }

  public modalPointages(conducteur: { initiales: null; prenom: string; nom: string; redirection_nav_id: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); }) {
    this.g_redirection_editing = conducteur.initiales;
    $('#redirection_source').val(conducteur.prenom + ' ' + conducteur.nom);
    $('#redirection_destination').val(conducteur.redirection_nav_id);
  }

  public toggleElectricien(conducteur: { initiales: string; }) {
    var checked = $('#customSwitch_' + conducteur.initiales).prop('checked');

    const body = {
      nav_id: conducteur.initiales,
      status: checked,
    }
    this.http.put(this.cst.apiUrl + 'conducteurs/switchElectricien', body).subscribe(
      prop => {
        if (!prop) {
          this.cst.showError('Erreur !', 'X');
        } else {
          this.loadData();

          this.cst.showSuccess('Valeur modifiée !', 'X');
        }
      });
  }

  public redirigerConducteur() {
    var initialesRedirect = null;
    var valueRedirect = $('#redirection_destination').val();


    const p = (e: { initiales: string | number | string[] | undefined; }) => valueRedirect == e.initiales;
    var idx = this.conducteurs.findIndex(p);

    if (idx != -1) {
      initialesRedirect = this.conducteurs[idx].initiales;
    }

    const body = {
      source: this.g_redirection_editing,
      destination: initialesRedirect,
    }
    this.http.put(this.cst.apiUrl + 'conducteurs/redirigerPointages', body).subscribe(
      prop => {
        if (!prop) {
          this.cst.showError('Erreur !', 'X');
        } else {
          this.loadData();
          $('#redirigerPointages').modal('hide');

          this.cst.showSuccess('Les pointages ont bien été redirigés !', 'X');
        }
      });
  }

  public myFunction(): void {
    const input = document.getElementById("filtrer_utilisateur") as HTMLInputElement | null;
    const filter = input?.value.toUpperCase() || ""; // Récupère le texte, ou une chaîne vide si non défini
    const table = document.getElementById("myTable");

    if (table) {
      const tr = table.getElementsByTagName("tr");

      for (let i = 1; i < tr.length; i++) { // Ignore l'en-tête (première ligne)
        const td = tr[i].getElementsByTagName("td"); // Toutes les cellules de la ligne
        let isVisible = false;

        // Vérifie si une cellule correspond au filtre
        for (let j = 0; j < td.length; j++) {
          const txtValue = td[j].textContent || td[j].innerText;
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
            isVisible = true;
            break;
          }
        }

        // Affiche ou masque la ligne en fonction du filtre
        tr[i].style.display = isVisible ? "" : "none";
      }
    }
  }
}
