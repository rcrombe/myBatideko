import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import get = Reflect.get;
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestion-vehicules',
  templateUrl: './gestion-vehicules.component.html',
  styleUrls: ['./gestion-vehicules.component.css']
})
export class GestionVehiculesComponent implements OnInit {

  private utilisateur;
  public vehicules: any[] = [];
  public chauffeurs: any[] = [];

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

  ngOnInit() {
  }

  ngAfterViewInit() {

    if (!$(".sidebar").hasClass("toggled")) {
      $("body").toggleClass("sidebar-toggled");
      $(".sidebar").toggleClass("toggled");
      if ($(".sidebar").hasClass("toggled")) {
        $('.sidebar .collapse').collapse('hide');
      };

    }
  }

  public loadData(): void {
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_vehicules').subscribe(
      (arr: Array<any>) => {
        this.vehicules = arr
        console.log(this.vehicules)
      },
    )
    this.http.get<Array<any>>(this.cst.apiUrl + 'gestion_vehicules/chauffeurs').subscribe(
      (arr: Array<any>) => { this.chauffeurs = arr },
    )
    window.location.reload();
  }

  public initModaleVente(immatriculation: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node)) {
    $("#vehiculeASupprimer").html(immatriculation);
  }

  //filtrer par nom d'utilisateur
  public myFunction(): void {
    // Declare variables
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("filtrer_vehicules") as HTMLInputElement | null;

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

  //ajouter un utilisateur dans la base de données
  public ajouterVehicule() {

    var matricule_resource, controle_technique, kilometrage, certificat_air, derniere_modif_km, domicile, fin_location, fin_stationnement, controle_pollution;
    var chauffeur = $("#chauffeur").val();
    var pos = (this.chauffeurs).map(function (e: { Nom: any; }) { return e.Nom; }).indexOf(chauffeur);
    var immat = (this.vehicules).map(function (e: { immatriculation: any; }) { return e.immatriculation; }).indexOf($("#immatriculation").val());
    var indexNBplaces = (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']).indexOf($("#nb_places").val() as string);


    if ($("#immatriculation").val() === '')
      this.toastr.error('Immatriculation requise ! ', this.cst.toastrTitle);
    else if (immat !== -1)
      this.toastr.error('Immatriculation déjà existente ! ', this.cst.toastrTitle);
    else if ($("#nb_places").val() == '')
      this.toastr.error('Nombre de places du véhicule requis ! ', this.cst.toastrTitle);
    else if (indexNBplaces === -1)
      this.toastr.error('Nombre de places incorrect ! ', this.cst.toastrTitle);
    else {
      matricule_resource = (pos === -1 ? null : this.chauffeurs[pos].matricule_resource)
      controle_technique = ($("#controle_technique").val() === '' ? null : $("#controle_technique").val())
      controle_pollution = ($("#controle_pollution").val() === '' ? null : $("#controle_pollution").val())
      fin_location = ($("#fin_location").val() === '' ? null : $("#fin_location").val())
      fin_stationnement = ($("#fin_stationnement").val() === '' ? null : $("#fin_stationnement").val())
      kilometrage = ($("#kilometrage").val() === '' ? null : $("#kilometrage").val())
      certificat_air = ($("#certificat_air").val() === '' ? null : $("#certificat_air").val())
      derniere_modif_km = ($("#derniere_modif_km").val() === '' ? null : $("#derniere_modif_km").val())
      domicile = ($("#domicile").prop('checked') ? 1 : 0)
      const body = {
        immatriculation: $("#immatriculation").val(),
        type: $("#type").val(),
        flocage: $("#flocage").val(),
        nom: $("#nom").val(),
        nb_places: $("#nb_places").val(),
        chauffeur: matricule_resource,
        controle_technique: controle_technique,
        controle_pollution: controle_pollution,
        kilometrage: kilometrage,
        derniere_modif_km: derniere_modif_km,
        certificat_air: certificat_air,
        carte: $("#carte").val(),
        gazole: $("#gazole").val(),
        fin_stationnement: fin_stationnement,
        fin_location: fin_location,
        commentaire: $("#commentaire").val(),
        domicile: domicile
      }

      this.http.post(this.cst.apiUrl + 'gestion_vehicules/creation', body).subscribe(
        prop => {
          if (prop) {
            this.toastr.success('Vehicule ajouté !', this.cst.toastrTitle);
            $('#ajoutVehicule').modal('hide');
            window.location.reload();
          } else {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
        }
      )
    }

  }

  public InitAjoutVehicule() {
    $("#immatriculation").val('');
    $("#type").val('');
    $("#flocage").val('');
    $("#chauffeur").val('');
    $("#nom").val('');
    $("#derniere_modif_km").val('');
    $("#nb_places").val('');
    $("#controle_technique").val('');
    $("#controle_pollution").val('');
    $("#kilometrage").val('');
    $("#certificat_air").val('');
    $("#carte").val('');
    $("#gazole").val('');
    $("#fin_location").val('');
    $("#fin_stationnement").val('');
    $("#commentaire").val('');
    $("#domicile").prop('checked', false);
  }

  //Afficher la modale de suppression d'utilisateur
  public supprimer(id: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node), nom: string | JQuery.Node | ((this: HTMLElement, index: number, oldhtml: JQuery.htmlString) => JQuery.htmlString | JQuery.Node)) {
    $("#idASupprimer").html(id);
    $("#nomASupprimer").html(nom);
    $('#supprimeUtilisateur').modal('show');
  }

  //Supprimer un vehicule de la base de données
  public vendreVehicule() {

    var immatriculation = $("#vehiculeASupprimer").html();

    const body = {
      vendu: 1,
      immatriculation: immatriculation
    }
    this.http.put(this.cst.apiUrl + 'gestion_vehicules/vendu', body).subscribe(
      prop => {
        if (prop) {
          this.toastr.success('Vehicule vendu !', this.cst.toastrTitle);
          window.location.reload();
        } else {
          this.toastr.error('Erreur !', this.cst.toastrTitle);
        }
      }
    )
  }

  //Afficher la modale de modification d'utilisateur
  public modalModifierVehicule(immatriculation: string): void {
    const pos = this.vehicules.map(e => e.immatriculation).indexOf(immatriculation);
    const pos2 = this.vehicules.map(e => e.matricule_resource).indexOf(this.vehicules[pos].chauffeur);

    const certif = this.datePipe.transform(this.vehicules[pos].certificat_air, 'yyyy-MM-dd') || '';
    const contr = this.datePipe.transform(this.vehicules[pos].controle_technique, 'yyyy-MM-dd') || '';
    const contr_pol = this.datePipe.transform(this.vehicules[pos].controle_pollution, 'yyyy-MM-dd') || '';
    const fin_loc = this.datePipe.transform(this.vehicules[pos].fin_location, 'yyyy-MM-dd') || '';
    const fin_stationnement = this.datePipe.transform(this.vehicules[pos].fin_stationnement, 'yyyy-MM-dd') || '';
    const derniere_modif_km = this.datePipe.transform(this.vehicules[pos].derniere_modif_km, 'yyyy-MM-dd') || '';

    let chauffeur = this.vehicules[pos].Nom || '';
    if (pos2 !== -1) {
      chauffeur = this.vehicules[pos2].Nom || '';
    }

    $("#modifierimmatriculation").val(this.vehicules[pos].immatriculation || '');
    $("#modifiertype").val(this.vehicules[pos].type || '');
    $("#modifierflocage").val(this.vehicules[pos].flocage || '');
    $("#modifiernom").val(this.vehicules[pos].nom || '');
    $("#modifiernb_places").val(this.vehicules[pos].nb_places || '');
    $("#modifierchauffeur").val(chauffeur || '');
    $("#modifierderniere_modif_km").val(derniere_modif_km || '');
    $("#modifiercontrole_technique").val(contr || '');
    $("#modifiercontrole_pollution").val(contr_pol || '');
    $("#modifierkilometrage").val(String(this.vehicules[pos].kilometrage || ''));
    $("#modifiercertificat_air").val(certif || '');
    $("#modifiercarte").val(this.vehicules[pos].carte || '');
    $("#modifiergazole").val(this.vehicules[pos].gazole || '');
    $("#modifiercommentaire").val(this.vehicules[pos].commentaire || '');
    $("#modifierfin_stationnement").val(fin_stationnement || '');
    $("#modifierfin_location").val(fin_loc || '');
    $("#modifierdomicile").prop('checked', this.vehicules[pos].domicile === 1 ? true : false);
  }

  //modofier un utilisateur dans la base de donnees
  public modifierVehicule(): void {
    var pos_veh = this.vehicules.map(e => e.immatriculation).indexOf($("#modifierimmatriculation").val() as string);
    var pos = this.chauffeurs.map(e => e.Nom).indexOf($("#modifierchauffeur").val() as string);

    if (pos === -1 && $("#modifierchauffeur").val()) {
      this.toastr.error('Resource non valide!', this.cst.toastrTitle);
      return;
    } else if (!['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes($("#modifiernb_places").val() as string)) {
      this.toastr.error('Nombre de places non valide!', this.cst.toastrTitle);
      return;
    } else {
      const chauffeur = pos === -1 ? null : this.chauffeurs[pos].matricule_resource;

      const body = {
        immatriculation: $("#modifierimmatriculation").val() as string || '',
        flocage: $("#modifierflocage").val() as string || '',
        nom: $("#modifiernom").val() as string || '',
        nb_places: $("#modifiernb_places").val() as string || '',
        chauffeur: chauffeur,
        controle_technique: $("#modifiercontrole_technique").val() as string || null,
        controle_pollution: $("#modifiercontrole_pollution").val() as string || null,
        derniere_modif_km: $("#modifierderniere_modif_km").val() as string || null,
        kilometrage: $("#modifierkilometrage").val() as string || null,
        certificat_air: $("#modifiercertificat_air").val() as string || null,
        carte: $("#modifiercarte").val() as string || '',
        gazole: $("#modifiergazole").val() as string || '',
        commentaire: $("#modifiercommentaire").val() as string || '',
        fin_location: $("#modifierfin_location").val() as string || null,
        fin_stationnement: $("#modifierfin_stationnement").val() as string || null,
        domicile: $("#modifierdomicile").prop('checked') ? 1 : 0,
        type: $("#modifiertype").val() as string || ''
      };

      this.http.put(this.cst.apiUrl + 'gestion_vehicules/modifier', body).subscribe(
        prop => {
          if (prop) {
            this.toastr.success('Véhicule modifié !', this.cst.toastrTitle);
            $('#modifierVehicule').modal('hide');
            window.location.reload();
          } else {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
        }
      );
    }
  }
  public changeDispo(id: any, dispo: number) {
    if (dispo == 1) {
      const body = {
        dispo: 0,
        id: id
      }
      this.http.put(this.cst.apiUrl + 'gestion_vehicules/dispo', body).subscribe(
        prop => {
          if (prop) {
            this.toastr.success('Vehicule modifié !', this.cst.toastrTitle);
            this.loadData();
          } else {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
        }
      )
    }
    else {
      const body = {
        dispo: 1,
        id: id
      }
      this.http.put(this.cst.apiUrl + 'gestion_vehicules/dispo', body).subscribe(
        prop => {
          if (prop) {
            this.toastr.success('Vehicule modifié !', this.cst.toastrTitle);
            this.loadData();
          } else {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
        }
      )
    }
  }

  public changeBureaux(id: any, dispo: number) {
    if (dispo == 1) {
      const body = {
        bureaux: 0,
        id: id
      }
      this.http.put(this.cst.apiUrl + 'gestion_vehicules/bureaux', body).subscribe(
        prop => {
          if (prop) {
            this.toastr.success('Vehicule modifié !', this.cst.toastrTitle);
            this.loadData();
          } else {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
        }
      )
    }
    else {
      const body = {
        bureaux: 1,
        id: id
      }
      this.http.put(this.cst.apiUrl + 'gestion_vehicules/bureaux', body).subscribe(
        prop => {
          if (prop) {
            this.toastr.success('Vehicule modifié !', this.cst.toastrTitle);
            this.loadData();
          } else {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
        }
      )
    }
  }

  public changeVente(id: any, vente: number) {
    if (vente == 1) {
      const body = {
        vendu: 0,
        id: id
      }
      this.http.put(this.cst.apiUrl + 'gestion_vehicules/vendu', body).subscribe(
        prop => {
          if (prop) {
            this.toastr.success('Vehicule modifié !', this.cst.toastrTitle);
            this.loadData();
          } else {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
        }
      )
    }
    else {
      const body = {
        vendu: 1,
        id: id
      }
      this.http.put(this.cst.apiUrl + 'gestion_vehicules/vendu', body).subscribe(
        prop => {
          if (prop) {
            this.toastr.success('Vehicule modifié !', this.cst.toastrTitle);
            this.loadData();
          } else {
            this.toastr.error('Erreur !', this.cst.toastrTitle);
          }
        }
      )
    }
  }


  public imprimer() {
    var doc = new jsPDF('p', 'mm', 'a2');

    doc.setFontSize(18);
    doc.text('Listing véhicules', 80, 10);
    doc.setFontSize(15);
    doc.setTextColor(100);

    (doc as any).autoTable({
      html: '#myTable',
      theme: 'grid',
      styles: { halign: 'center' },
    })
    doc.output('dataurlnewwindow')
    doc.save('listingVehicules.pdf');
  };

}