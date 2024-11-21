import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Modal } from 'bootstrap';
import { Router } from '@angular/router';
import $ from 'jquery';

@Component({
  selector: 'app-gestion-modules',
  templateUrl: './gestion-modules.component.html',
  styleUrls: ['./gestion-modules.component.css']
})
export class GestionModulesComponent implements OnInit {
  private utilisateur;


  public modules: any[] | undefined;
  public moduleForm!: FormGroup;
  public moduleIdToDelete: string = '';
  public nomModuleToDelete: string = '';

  constructor(private http: HttpClient, private cst: Constants, private jwt: JwtHelperService, private toastr: ToastrService, private router: Router) {
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
    // Initialisation du FormGroup
    this.moduleForm = new FormGroup({
      id: new FormControl('', Validators.required),
      nom: new FormControl('', Validators.required),
      url: new FormControl('', Validators.required),
    });
    console.log(this.moduleForm);
  }

  public loadData(): void {
    console.log('Chargement des données...');
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_modules').subscribe(
      (arr: Array<any>) => {
        this.modules = arr;
        console.log('Modules chargés :', this.modules);
      },
      (error) => {
        console.error('Erreur lors du chargement des données :', error);
      }
    );
  }

  public initAjoutModule() {
    console.log("Afficher le formulaire pour ajouter un module");
    this.moduleForm.reset(); // Réinitialisation des champs du formulaire
  }

  //ajouter un module dans la base de données
  public ajouterModule() {
    if (this.moduleForm.valid) {
      const body = this.moduleForm.value;

      this.http.post(this.cst.apiUrl + 'gestion_modules/new', body).subscribe(
        (response: any) => {
          if (response) {
            this.toastr.success('Module ajouté avec succès !', this.cst.toastrTitle);

            // Fermez la modale
            const modalElement = document.getElementById('ajoutModule');
            if (modalElement) {
              const modalInstance = Modal.getInstance(modalElement);
              modalInstance?.hide();
            }

            // Recharger complètement la page
            window.location.reload();
          } else {
            this.toastr.error('Erreur lors de l’ajout du module.', this.cst.toastrTitle);
          }
        },
        (error) => {
          console.error('Erreur serveur :', error);
          this.toastr.error('Erreur serveur !', this.cst.toastrTitle);
        }
      );
    } else {
      this.toastr.error('Veuillez remplir tous les champs requis.');
    }
  }

  //Afficher la modale de suppression d'utilisateur
  public supprimer(id: string, nom: string) {
    // Configurez les valeurs nécessaires pour la suppression
    this.moduleIdToDelete = id;
    this.nomModuleToDelete = nom;

    // Sélectionnez et affichez la modale Bootstrap
    const modalElement = document.getElementById('supprimeModule'); // ID de votre modale
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show(); // Affiche la modale
    } else {
      console.error("Élément de la modale non trouvé");
    }
  }
  public resetModalState() {
    this.moduleForm.reset(); // Réinitialise le formulaire
    const modalElement = document.getElementById('ajoutModule');
    if (modalElement) {
      const modalInstance = Modal.getInstance(modalElement);
      modalInstance?.hide(); // Assurez-vous que la modale est bien fermée
    }
  }

  //Supprimer un utilisateur de la base de données
  public supprimerModule() {
    this.http.delete(this.cst.apiUrl + 'gestion_modules/remove/' + this.moduleIdToDelete).subscribe(
      response => {
        this.toastr.success('Module supprimé avec succès !');
        this.loadData(); // Rechargez les données

        // Fermez la modale après la suppression
        const modalElement = document.getElementById('supprimeModule');
        if (modalElement) {
          const modal = Modal.getInstance(modalElement); // Récupère l'instance de la modale
          modal?.hide(); // Ferme la modale
        }
      },
      error => {
        this.toastr.error('Erreur lors de la suppression du module.');
        console.error(error);
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
