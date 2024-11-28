import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Modal } from 'bootstrap';


@Component({
  selector: 'app-gestion-codes-atelier',
  templateUrl: './gestion-codes-atelier.component.html',
  styleUrls: ['./gestion-codes-atelier.component.css']
})
export class GestionCodesAtelierComponent implements OnInit {
  private MODULE_ID = null;
  private utilisateur;
  public actions: any[] = [];

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


  public loadData(): void {
    var _actions: any[] = []

    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_codes_atelier').subscribe(
      (arr: Array<any>) => {
        console.log(arr);
        for (let el of arr) {
          _actions.push({
            id: el.id,
            nom_action: el.nom_action,
            nav_action: el.nav_action,
            nb_used: el.nbUsed
          })
        }

        this.actions = _actions;
      })

    $('#newAction').val('');
    $('#newCTT').val('');
  }

  public ajouterCodeAtelier(): void {
    const body = {
      nom_action: ($("#newAction").val() || '').toString().trim(),
      nav_action: ($("#newCTT").val() || '').toString().trim()
    };

    this.http.post(this.cst.apiUrl + 'gestion_codes_atelier/new', body).subscribe(
      prop => {
        if (!prop) {
          this.cst.showError('Erreur !', 'X');
        } else {
          this.loadData();
        }
      }
    );
  }

  public modalCodeAction(action: { id: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); nom_action: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); nav_action: string | number | string[] | ((this: HTMLElement, index: number, value: string) => string); }) {
    console.log(action)

    $("#modifID").val(action.id);
    $("#modifNom").val(action.nom_action)
    $("#modifNavId").val(action.nav_action)
  }

  public initModalSupprimer(code: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node)) {
    $("#actionAmodifier").html(code)
  }

  public modifierAction(): void {
    const body = {
      id: ($("#modifID").val() || '').toString().trim(),
      nom_action: ($("#modifNom").val() || '').toString().trim(),
      nav_action: ($("#modifNavId").val() || '').toString().trim()
    };

    this.http.put(this.cst.apiUrl + 'gestion_codes_atelier/edit', body).subscribe(
      prop => {
        if (!prop) {
          this.cst.showError('Erreur !', 'X');
        } else {
          window.location.reload();
          $('#modifierAction').modal('hide'); // Ferme le modal après modification
        }
      }
    );
  }

  public supprimerAction() {
    var id = $("#actionAmodifier").html()

    console.log('BIEN')

    this.http.delete(this.cst.apiUrl + 'gestion_codes_atelier/remove/' + id).subscribe(
      prop => {
        if (!prop) {
          this.cst.showError('Erreur !', 'X');
        } else {
          $('#supprimerAction').modal('hide');
          window.location.reload();
        }
      });
  }
  ngOnInit(): void {
  }

}
