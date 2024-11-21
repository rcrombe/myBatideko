import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import $ from 'jquery';

@Component({
  selector: 'app-gestion-modules',
  templateUrl: './gestion-modules.component.html',
  styleUrls: ['./gestion-modules.component.css']
})
export class GestionModulesComponent implements OnInit {
  private utilisateur;

  public modules: any[] | undefined;

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
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_modules').subscribe(
      (arr: Array<any>) => {
        this.modules = arr;
        console.log(this.modules);
      },
    )
  }

  public initAjoutModule() {
    $("#id").val("")
    $("#nom").val("")
    $("#url").val("")
  }

  //ajouter un utilisateur dans la base de données
  public ajouterModule() {
    // Récupérer les valeurs avec jQuery
    const body = {
      id: ($("#id").val() as unknown as string) || "", // Surcharge pour préciser `string`
      nom: ($("#nom").val() as unknown as string) || "",
      url: ($("#url").val() as unknown as string) || "",
    };

    // Appeler l'API pour ajouter le module
    this.http.post(this.cst.apiUrl + 'gestion_modules/new', body).subscribe(
      (prop: any) => {
        if (prop) {
          this.toastr.success('Module ajouté !', this.cst.toastrTitle);
          $("#ajoutModule").modal('hide'); // Fermer la modal
          this.loadData(); // Recharger les données
        } else {
          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      },
      (error: any) => {
        console.error('Erreur serveur :', error);
        this.toastr.error('Erreur serveur !', this.cst.toastrTitle);
      }
    );
  }

  //Afficher la modale de suppression d'utilisateur
  public supprimer(id: string, nom: string) {
    $("#idASupprimer").html(id);
    $("#nomASupprimer").html(nom);
    $('#supprimeModule').modal('show');
  }

  //Supprimer un utilisateur de la base de données
  public supprimerModule() {
    var id = $("#idASupprimer").html();

    $('#supprimeModule').modal('hide');

    this.http.delete(this.cst.apiUrl + 'gestion_modules/remove/' + id).subscribe(
      remove => {
        if (remove) {
          this.toastr.success('Module supprimé !', this.cst.toastrTitle);
          this.loadData();

        } else {

          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    );

  }

  public toggleModuleStatus(module: { moduleId: any; enabled: any; }) {
    const body = {
      id: module.moduleId,
      status: module.enabled
    }
    this.http.post(this.cst.apiUrl + 'gestion_modules/toggle', body).subscribe(
      (res: any) => {
        if (res.affectedRows == 1) {
          this.toastr.success((body.status == 1 ? "Activation" : "Désactivation") + ' du module');
          this.loadData();
        }
        else {
          this.toastr.error("Erreur lors de l'exécution de la requête : " + res)
        }
      }
    );
  }
}
