import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestion-absences',
  templateUrl: './gestion-absences.component.html',
  styleUrls: ['./gestion-absences.component.css']
})
export class GestionAbsencesComponent implements OnInit {
  private utilisateur;
  public absences: { code_absence: any; description: any; couleur: any; type: any; }[] = [];

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
    this.absences = []


    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_absences').subscribe(
      (arr: Array<any>) => {
        for (let el of arr) {
          var index = this.absences.findIndex(i => i.code_absence === el.code_absence);
          if (index === -1) {
            this.absences.push({
              code_absence: el.code_absence,
              description: el.description,
              couleur: el.couleur,
              type: el.type
            })
          }
          else {
            this.absences[index].couleur = el.couleur;
            this.absences[index].type = el.type
          }
          $("#couleur_" + el.code_absence).css("background-color", el.couleur)
        }
      })

    /*this.http.get('https://api.cuppens.fr/api/absences' ).subscribe(
        (abs: Array<any>) => {
          for (let el of abs["value"]) {
            if (this.absences.findIndex(i => i.code_absence === el.Code) === -1) {
              this.absences.push({code_absence: el.Code, description: el.Description})
            }
          }
          if (this.absences.findIndex(i => i.code_absence === 'CFA') === -1) {
            this.absences.push({code_absence: 'CFA', description: 'Formation'})
          }
        });*/

  }

  public ajouterAbsence() {
    const newCode = $("#newCode").val() as string | undefined;
    if (!newCode || newCode.trim() === '') {
      this.cst.showError('Erreur !', 'X');
      return;
    }

    const body = {
      couleur: $("#newColor").val() as string || '',
      code_absence: (newCode.replaceAll(' ', '_')) || '',
      description: $("#newDescription").val() as string || '',
      association: ($("#newAssociation").val() as string || '') === '' ? null : ($("#newAssociation").val() as string)
    };

    this.http.post(this.cst.apiUrl + 'absences/creation_absence', body).subscribe(
      prop => {
        if (!prop) {
          this.cst.showError('Code chantier requis!', 'X');
        } else {
          this.initAjoutAbsence();
          this.cst.showSuccess('Nouvelle absence ajoutée!', 'X');
          this.loadData();
        }
      }
    );
  }



  public initAjoutAbsence() {
    $("#newColor").val('');
    $("#newCode").val('')
    $("#newDescription").val('')
    $("#newAssociation").val('')
  }

  public modalAbsence(abs: { couleur: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); code_absence: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); description: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); type: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); }) {
    $("#modifColor").val(abs.couleur);
    $("#modifCode").val(abs.code_absence)
    $("#modifDescription").val(abs.description)
    $("#modifAssociation").val(abs.type)
  }

  public initModalSupprimer(code: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node), type: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node)) {
    $("#absenceAmodifier").html(code)
    $("#typeAmodifier").html(type)
  }

  public modifierAbsence() {
    const body = {
      couleur: $("#modifColor").val() as string || '',
      code_absence: ($("#modifCode").val() as string || '').replaceAll(' ', '_'),
      description: $("#modifDescription").val() as string || '',
      type: ($("#modifAssociation").val() as string || '').replaceAll(' ', '_')
    };

    this.http.put(this.cst.apiUrl + 'absences/modifColor', body).subscribe(
      prop => {
        if (!prop) {
          this.cst.showError('Erreur !', 'X');
        } else {
          window.location.reload();
          $("#modifierAbsence").modal('hide');
        }
      }
    );
  }

  public supprimerAbsence() {
    var code_absence = $("#absenceAmodifier").html()
    var type = $("#typeAmodifier").html()
    this.http.delete(this.cst.apiUrl + 'absences/supression/' + code_absence + '/' + type + '/' + this.utilisateur.id).subscribe(
      prop => {
        if (!prop) {
          this.cst.showError('Erreur !', 'X');
        } else {
          $('#supprimerAbsence').modal('hide');
          this.loadData()
        }
      });
  }

    //filtrer par nom d'utilisateur
    public myFunction(): void {
      // Declare variables
      var input, filter, table, tr, td, i, txtValue;
      input = document.getElementById("filtrer_utilisateurs") as HTMLInputElement | null;
  
      if (input && input.value) {
        filter = input.value.toUpperCase();
        table = document.getElementById("myTable");
        if (table) { // Vérifiez que `table` n'est pas null
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
      }
    }
  
}
