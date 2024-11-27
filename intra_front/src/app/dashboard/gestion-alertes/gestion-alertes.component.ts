import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestion-alertes',
  templateUrl: './gestion-alertes.component.html',
  styleUrls: ['./gestion-alertes.component.css']
})
export class GestionAlertesComponent implements OnInit {
  private utilisateur;

  public alertes: any[] = [];

  constructor(private http: HttpClient, private cst: Constants, private jwt: JwtHelperService,
    private toastr: ToastrService) {
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
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_alertes').subscribe(
      (arr: Array<any>) => {
        this.alertes = arr;
        console.log(this.alertes);
      },
    )
  }

  public initAjoutAlerte() {
    $("#id").val("")
    $("#nom").val("")
    $("#url").val("")
  }

  //ajouter un utilisateur dans la base de données
  public ajouterAlerte() {

    const body = {
      id: $("#id").val(),
      nom: $("#nom").val(),
      url: $("#url").val()
    }

    this.http.post(this.cst.apiUrl + 'gestion_alertes/new', body).subscribe(
      prop => {
        if (prop) {
          this.toastr.success('Alerte ajoutée !', this.cst.toastrTitle);
          $('#ajoutAlerte').modal('hide');
          window.location.reload();
        } else {
          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    )
  }

  //Afficher la modale de suppression d'alerte
  public supprimer(id: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node), nom: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node)) {
    $("#idASupprimer").html(id);
    $("#nomASupprimer").html(nom);
    $('#supprimeAlerte').modal('show');
  }

  //Supprimer une alerte de la base de données
  public supprimerAlerte() {
    var id = $("#idASupprimer").html();

    $('#supprimeAlerte').modal('hide');

    this.http.delete(this.cst.apiUrl + 'gestion_alertes/remove/' + id).subscribe(
      remove => {
        if (remove) {
          this.toastr.success('Alerte supprimée !', this.cst.toastrTitle);
          window.location.reload();

        } else {

          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    );

  }
}
