import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, FormsModule } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import get = Reflect.get;
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.css']
})

export class HistoriqueComponent implements OnInit {
  public historique: any[] = [];
  private utilisateur
  public utilisateurs: any[] = [];

  constructor(private http: HttpClient, private cst: Constants, private jwt: JwtHelperService,
    private toastr: ToastrService, private datePipe: DatePipe) {
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
    this.http.get<Array<any>>(this.cst.apiUrl + 'historique/utilisateurs').subscribe(
      (arr: Array<any>) => {
        this.utilisateurs = arr;
      });
  }

  public initParams() {
    const descriptions = ["Erreurs",
      "Erreurs, Modifications",
      "Erreurs, Modifications, Connexions",
      "Erreurs, Modifications, Connexions, Affichages"]
    $("#level").val(this.utilisateur.loglevel);
    $("#outputLevel").val(this.utilisateur.loglevel);
    $("#descriptifLevel").html(descriptions[this.utilisateur.loglevel])
  }

  public descriptifLevel() {
    const descriptions = [
      "Erreurs",
      "Erreurs, Modifications",
      "Erreurs, Modifications, Connexions",
      "Erreurs, Modifications, Connexions, Affichages"
    ];

    const level = $("#level").val() as string | undefined;

    // Vérifiez que `level` n'est pas undefined et qu'il est un entier valide
    if (level === undefined || isNaN(Number(level))) {
      console.error('Le niveau sélectionné est invalide ou non défini.');
      return;
    }

    const index = Number(level); // Convertit `level` en nombre

    // Vérifiez que l'index est dans les limites du tableau `descriptions`
    if (index < 0 || index >= descriptions.length) {
      console.error('Le niveau sélectionné est hors des limites.');
      return;
    }

    // Mettre à jour le contenu HTML de l'élément
    $("#descriptifLevel").html(descriptions[index]);
  }

  public initLogLevel() {
    this.utilisateur.loglevel = $("#level").val()
    const body = {
      loglevel: $("#level").val(),
      utilisateur: this.utilisateur
    }
    this.http.put(this.cst.apiUrl + 'historique/loglevel', body).subscribe(
      (token: any) => {
        if (token) {
          this.cst.showSuccess('Niveau des actions enregistrées modifié avec success ', 'X');
          localStorage.setItem('token', token);
        }
      }
    )
    $("#logLevel").modal("hide")
  }

  public filtrer(): void {

    var index = this.utilisateurs.map(function (e: { nom: any; }) {
      return e.nom;
    }).indexOf($("#resource").val())
    var date_debut = $("#date_debut").val();
    var date_fin = $("#date_fin").val();
    var module = $("#module").val();
    if ($("#module").val() === '')
      module = 'rien'
    var action = $("#action").val();
    if ($("#action").val() === '')
      action = 'rien'
    if (date_debut === '' || date_fin === '')
      this.cst.showError('Dates requises ! ', 'X');
    else {
      this.http.get<Array<any>>(this.cst.apiUrl + 'historique/' + (index == -1 && $("#resource").val() !== 'NULL' ? 'rien' :
        ($("#resource").val() === 'NULL' ? 'NULL' : this.utilisateurs[index].id)
      ) + '/' + date_debut +
        '/' + date_fin + '/' + module + '/' + action).subscribe(
          (arr: Array<any>) => {
            this.historique = arr
          },
        )
    }
  }

}
