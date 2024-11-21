import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestion-utilisateurs',
  templateUrl: './gestion-utilisateurs.component.html',
  styleUrls: ['./gestion-utilisateurs.component.css']
})
export class GestionUtilisateursComponent implements OnInit {
  public utilisateurs: any[] = [];
  public conducteurs: any[] = [];
  public alerts: any[] = [];
  public resources: any[] = [];
  public groupes: any[] | null = [];
  public noms_roles = ["Administrateur", "Gestion Travaux", "Gestion RH", "Utilisateur", "Conducteur"];

  private modaleAjoutUtilisateur!: Modal;
  private modaleSupprimeUtilisateur!: Modal;
  private modaleModifierUtilisateur!: Modal;
  private modaleModifierPassword!: Modal;

  constructor(private http: HttpClient, private cst: Constants, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadData();
    this.initBootstrapModals();
  }

  private initBootstrapModals(): void {
    const ajoutModalEl = document.getElementById('ajoutUtilisateur');
    const supprimeModalEl = document.getElementById('supprimeUtilisateur');
    const modifierUtilisateurModalEl = document.getElementById('modifierUtilisateur');
    const modifierPasswordModalEl = document.getElementById('modifierPassword');

    if (ajoutModalEl) this.modaleAjoutUtilisateur = new Modal(ajoutModalEl);
    if (supprimeModalEl) this.modaleSupprimeUtilisateur = new Modal(supprimeModalEl);
    if (modifierUtilisateurModalEl) this.modaleModifierUtilisateur = new Modal(modifierUtilisateurModalEl);
    if (modifierPasswordModalEl) this.modaleModifierPassword = new Modal(modifierPasswordModalEl);
  }

  public loadData(): void {
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_groupes').subscribe(arr => (this.groupes = arr));
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_utilisateurs').subscribe(arr => (this.utilisateurs = arr));
    this.http.get<Array<any>>(this.cst.apiUrl + 'conducteurs/all').subscribe(arr => (this.conducteurs = arr));
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_alertes/users').subscribe(arr => (this.alerts = arr));
    this.http.get<Array<any>>(this.cst.apiUrl + 'users/resources').subscribe(arr => (this.resources = arr));
  }

  public getGroupById(gid: any): string {
    let groupe = "Aucun rôle";
    if (this.groupes) {
      const group = this.groupes.find(el => el.id === gid);
      if (group) groupe = group.name;
    }
    return groupe;
  }

  public myFunction(tableauId: string, inputId: string): void {
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    if (!inputElement) {
      console.error('Input element not found');
      return;
    }

    const filter = inputElement.value.toUpperCase();
    const table = document.getElementById(tableauId) as HTMLTableElement;
    if (!table) {
      console.error('Table not found');
      return;
    }

    const tr = table.getElementsByTagName('tr');
    for (let i = 0; i < tr.length; i++) {
      const td = tr[i].getElementsByTagName('td')[0];
      if (td) {
        const txtValue = td.textContent || td.innerText;
        tr[i].style.display = txtValue.toUpperCase().includes(filter) ? '' : 'none';
      }
    }
  }

  public initAjoutUtilisateur(): void {
    this.modaleAjoutUtilisateur.show();
  }

  public ajouterUtilisateur(): void {
    const body = {
      nom: (document.getElementById('nom') as HTMLInputElement).value,
      prenom: (document.getElementById('prenom') as HTMLInputElement).value,
      email: (document.getElementById('mail') as HTMLInputElement).value,
      password: (document.getElementById('motdepasse') as HTMLInputElement).value,
      poste: (document.getElementById('poste') as HTMLInputElement).value,
      role: (document.getElementById('role-select') as HTMLSelectElement).value,
    };

    this.http.post(this.cst.apiUrl + 'register', body).subscribe(
      () => {
        // Affiche un message de succès
        this.toastr.success('Utilisateur ajouté avec succès', this.cst.toastrTitle);

        // Ferme la modale
        this.modaleAjoutUtilisateur.hide();

        // Recharge les données pour mettre à jour la liste
        this.loadData();
      },
      error => {
        // Gère les erreurs et affiche un message d'erreur
        this.toastr.error('Erreur lors de l\'ajout de l\'utilisateur', error.message);
        console.error('Erreur :', error);
      }
    );
  }


  public updateAlert(alerte: { alert_id: any; }, uid: any, val: any): void {
    const body = {
      alerte_id: alerte.alert_id,
      user_id: uid,
      val: val
    };

    this.http.post(this.cst.apiUrl + 'utilisateurs/alertes', body).subscribe(
      () => {
        this.toastr.success('Alertes modifiées !', this.cst.toastrTitle);
        this.loadData();
      },
      error => {
        this.toastr.error('Erreur lors de la modification des alertes', error.message);
      }
    );
  }

  public supprimer(id: string, nom: string): void {
    document.getElementById('idASupprimer')!.textContent = id;
    document.getElementById('nomASupprimer')!.textContent = nom;
    this.modaleSupprimeUtilisateur.show();
  }

  public supprimerUtilisateur(): void {
    const id = document.getElementById('idASupprimer')!.textContent;
    if (id) {
      this.http.delete(this.cst.apiUrl + `users/${id}`).subscribe(
        () => {
          this.toastr.success('Utilisateur supprimé !', this.cst.toastrTitle);
          this.modaleSupprimeUtilisateur.hide();
          this.loadData();
        },
        error => {
          this.toastr.error('Erreur lors de la suppression', error.message);
        }
      );
    }
  }

  public modifieUtilisateur(user: any): void {
    (document.getElementById('nomModifie') as HTMLInputElement).value = user.nom ?? '';
    (document.getElementById('prenomModifie') as HTMLInputElement).value = user.prenom ?? '';
    (document.getElementById('emailModifie') as HTMLInputElement).value = user.email ?? '';
    (document.getElementById('posteModifie') as HTMLInputElement).value = user.poste ?? '';
    (document.getElementById('roleModifie') as HTMLSelectElement).value = user.role ?? '';
    document.getElementById('idModifie')!.textContent = user.id ?? '';
    this.modaleModifierUtilisateur.show();
  }

  public modifierUtilisateur(): void {
    const body = {
      id: document.getElementById('idModifie')!.textContent,
      nom: (document.getElementById('nomModifie') as HTMLInputElement).value,
      prenom: (document.getElementById('prenomModifie') as HTMLInputElement).value,
      email: (document.getElementById('emailModifie') as HTMLInputElement).value,
      poste: (document.getElementById('posteModifie') as HTMLInputElement).value,
      role: (document.getElementById('roleModifie') as HTMLSelectElement).value,
    };

    this.http.put(this.cst.apiUrl + 'users/edit', body).subscribe(
      () => {
        this.toastr.success('Utilisateur modifié !', this.cst.toastrTitle);
        this.modaleModifierUtilisateur.hide();
        this.loadData();
      },
      error => {
        this.toastr.error('Erreur lors de la modification', error.message);
      }
    );
  }

  public modifiePassword(user: { nom: string; prenom: string; id: string | undefined; }): void {
    // Ajoute le nom complet dans le champ désactivé
    (document.getElementById('nomModifiePassword') as HTMLInputElement).value = `${user.nom} ${user.prenom}`;

    // Stocke l'ID de l'utilisateur dans un champ caché
    const idElement = document.getElementById('idModifiePassword');
    if (idElement) {
      idElement.textContent = user.id ?? ''; // Ajoute une chaîne vide si l'ID est undefined
    }

    // Affiche la modale de modification de mot de passe
    this.modaleModifierPassword.show();
  }

  public modifierPassword(): void {
    const idElement = document.getElementById('idModifiePassword');
    const passwordInput = document.getElementById('passwordModifie') as HTMLInputElement;

    if (idElement && passwordInput) {
      const body = {
        id: idElement.textContent, // Récupère l'ID de l'utilisateur
        _data_: passwordInput.value // Récupère le nouveau mot de passe
      };

      this.http.put(this.cst.apiUrl + 'users/_change', body).subscribe(
        () => {
          // Affiche un message de succès
          this.toastr.success('Mot de passe modifié avec succès !', this.cst.toastrTitle);

          // Ferme la modale
          this.modaleModifierPassword.hide();

          // Recharge les données pour refléter la modification
          this.loadData();
        },
        error => {
          // Gère les erreurs et affiche un message d'erreur
          this.toastr.error('Erreur lors de la modification du mot de passe', error.message);
        }
      );
    } else {
      console.error('Impossible de récupérer les éléments nécessaires pour la modification du mot de passe.');
    }
  }
}
