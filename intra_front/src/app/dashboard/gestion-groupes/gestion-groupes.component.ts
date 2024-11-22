import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Modal } from 'bootstrap';

interface Groupe {
  permissions: any;
  nbMembres: any;
  administrateur: any;
  name: any;
  id: number; // Assurez-vous que le type correspond à vos données
  nom: string;
  admin: boolean;
}

@Component({
  selector: 'app-gestion-groupes',
  templateUrl: './gestion-groupes.component.html',
  styleUrls: ['./gestion-groupes.component.css']
})
export class GestionGroupesComponent implements OnInit {
  private utilisateur;

  public g_editing_group: Groupe | null = null; // Typage explicite
  public groupes: Groupe[] = [];
  public selectedId: number | null = null; // Pour stocker l'ID du groupe à supprimer
  public selectedName: string | null = null; // Pour stocker le nom du groupe à supprimer
  public showDeleteModal: boolean = false; // Contrôle l'affichage de la modale de suppression


  constructor(private http: HttpClient, private cst: Constants, private jwt: JwtHelperService, private toastr: ToastrService) {
    const token = localStorage.getItem('token');
    if (token) {
      this.utilisateur = this.jwt.decodeToken(token);
    } else {
      console.error('Token is missing in localStorage');
      this.utilisateur = null; // Ou une valeur par défaut
    }

    this.loadData();
  }

  ngOnInit() {
  }

  public loadData(): void {
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_groupes').subscribe(
      (arr: Array<any>) => {
        this.groupes = arr;

        if (this.g_editing_group) { // Vérifie si g_editing_group n'est pas null
          this.groupes.forEach((el) => {
            if (el.id === this.g_editing_group?.id) { // Vérification supplémentaire
              this.g_editing_group = el;
            }
          });
        }

        console.log(this.groupes);
      },
      error => {
        console.error('Erreur lors du chargement des groupes', error);
      }
    );
  }

  public initAjoutGroupe() {
    $("#nom").val("")
    $("#admin").val("Standard")
  }

  //ajouter un utilisateur dans la base de données
  public ajouterGroupe() {
    var adm = $('#admin').val();

    const body = {
      nom: $("#nom").val(),
      admin: (adm == 'Administrator' ? true : false)
    }

    this.http.post(this.cst.apiUrl + 'gestion_groupes/new', body).subscribe(
      prop => {
        if (prop) {
          this.toastr.success('Groupe ajouté !', this.cst.toastrTitle);
          $('#ajoutGroupe').modal('hide');
          window.location.reload();
        } else {
          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    )
  }

  //Afficher la modale de suppression d'utilisateur
  public supprimer(id: number, nom: string): void {
    console.log("Clique sur bouton supprimer");
    this.selectedId = id; // Stocke l'ID dans selectedId
    this.selectedName = nom; // Stocke le nom dans selectedName
    console.log('Suppression configurée pour ID:', id, 'Nom:', name);
  }


  //Supprimer un utilisateur de la base de données
  public supprimerGroupe(): void {
    console.log("Clique sur supp");
    if (this.selectedId !== null) {
      this.http.delete(this.cst.apiUrl + 'gestion_groupes/remove/' + this.selectedId).subscribe(
        (response) => {
          this.toastr.success('Groupe supprimé !', this.cst.toastrTitle);

          const modalElement = document.getElementById('supprimeGroupe');
          if (modalElement) {
            const modal = Modal.getInstance(modalElement); // Récupère l'instance de la modale
            modal?.hide(); // Ferme la modale
          }
          window.location.reload(); // Recharge les données
        },
        (error) => {
          this.toastr.error('Erreur lors de la suppression !', this.cst.toastrTitle);
        }
      );
    }
  }


  //Afficher la modale de modification de groupe
  public modifiePermissions(group: Groupe | null) {
    this.g_editing_group = group;

    $('#modifiePermissions').modal('show');
  }

  public updatePerm(module: { moduleId: any; }, perm: any, val: any): void {
    if (this.g_editing_group) { // Vérifie si g_editing_group n'est pas null
      const body = {
        module_id: module.moduleId,
        groupe_id: this.g_editing_group.id, // Accès sûr à id
        perm: perm,
        val: val
      };

      this.http.post(this.cst.apiUrl + 'gestion_groupes/permissions', body).subscribe(
        prop => {
          if (prop) {
            this.toastr.success('Permissions modifiées !', this.cst.toastrTitle);
            this.loadData();
          } else {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
        }
      );
    } else {
      this.toastr.error('Aucun groupe sélectionné pour la mise à jour des permissions', this.cst.toastrTitle);
    }
  }
}
