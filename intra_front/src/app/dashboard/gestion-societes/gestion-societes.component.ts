import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestion-societes',
  templateUrl: './gestion-societes.component.html',
  styleUrls: ['./gestion-societes.component.css']
})
export class GestionSocietesComponent implements OnInit {
  private utilisateur;

  public societes: any[] = [];

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
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_societes').subscribe(
      (arr: Array<any>) => {
        this.societes = arr;
        console.log(this.societes);
      },
    )
  }

  public initAjoutSociete() {
    $("#id").val("")
    $("#nom").val("")
    $("#url").val("")
  }

  //ajouter un utilisateur dans la base de données
  public ajouterSociete() {

    const body = {
      id: $("#id").val(),
      nom: $("#nom").val(),
      url: $("#url").val()
    }

    this.http.post(this.cst.apiUrl + 'gestion_societes/new', body).subscribe(
      prop => {
        if (prop) {
          this.toastr.success('Société ajoutée !', this.cst.toastrTitle);
          $('#ajoutSociete').modal('hide');
          window.location.reload();
        } else {
          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    )
  }

  //Afficher la modale de suppression de société
  public supprimer(id: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node), nom: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node)) {
    $("#idASupprimer").html(id);
    $("#nomASupprimer").html(nom);
    $('#supprimeSociete').modal('show');
  }

  //Supprimer une société de la base de données
  public supprimerSociete() {
    var id = $("#idASupprimer").html();

    $('#supprimeSociete').modal('hide');

    this.http.delete(this.cst.apiUrl + 'gestion_societes/remove/' + id).subscribe(
      remove => {
        if (remove) {
          this.toastr.success('Société supprimée !', this.cst.toastrTitle);
          window.location.reload();

        } else {

          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    );

  }

}
