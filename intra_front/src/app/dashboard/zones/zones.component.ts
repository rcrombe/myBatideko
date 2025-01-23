import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import get = Reflect.get;
import { Modal } from 'bootstrap';
@Component({
  selector: 'app-zones',
  templateUrl: './zones.component.html',
  styleUrls: ['./zones.component.css']
})
export class ZonesComponent implements OnInit {

  private utilisateur;
  public error = "";
  public chantiers: any[] = [];
  public date;
  public idSemaine!: number;
  public semaine: any;
  public dateStart!: string | null;
  public dateEnd!: string | null;
  public samedi: any;
  public pos = -1;
  public conducteur: any;
  private _lookingDate;


  constructor(private route: ActivatedRoute, private http: HttpClient, private cst: Constants, private jwt: JwtHelperService, private toastr: ToastrService, private datePipe: DatePipe) {
    this.utilisateur = this.jwt.decodeToken(
      localStorage.getItem('token') ?? ''
    );
    this._lookingDate = localStorage.getItem('_lookingDate');

    if (this._lookingDate === null)
      this.date = new Date(Date.now());
    else
      this.date = new Date(this._lookingDate);
    this.loadData();
  }
  ngOnInit(): void {
  }

  public loadData() {
    var _chantiers = [];

    var dateFormate = this.datePipe.transform(this.date, 'yyyy' + '-' + 'MM' + '-' + 'dd');
    this.http.get<Array<any>>(this.cst.apiUrl + 'planning/chantiers_semaine_nozone/' + dateFormate).subscribe(
      (chantiers: Array<any>) => {
        if (chantiers.length > 0) {
          this.semaine = chantiers[0].nb_semaine;
          this.idSemaine = chantiers[0].id;
          this.dateStart = this.datePipe.transform(chantiers[0].date_start, 'dd' + '/' + 'MM' + '/' + 'yyyy');
          this.dateEnd = this.datePipe.transform(chantiers[0].date_end, 'dd' + '/' + 'MM' + '/' + 'yyyy');

          _chantiers = chantiers;

          this.chantiers = _chantiers;

          console.log(this.chantiers)
        }
      });
  }

  //Action lors du bouton de semaine suivante , charge les données de la semaine suivante pour les afficher
  public semaineSuivante(): void {
    this.date.setDate(this.date.getDate() + 7);

    var dateFormate = this.datePipe.transform(this.date, 'yyyy-MM-dd');
    if (!dateFormate) {
      console.error('Erreur de formatage de la date');
      return; // Arrêtez l'exécution si `dateFormate` est null
    }

    localStorage.setItem('_lookingDate', dateFormate);
    this.loadData();
  }

  //Action lors du bouton de semaine précédente , charge les données de la semaine précédente pour les afficher
  public semainePrecedente(): void {
    if (this.idSemaine > 1) {
      this.date.setDate(this.date.getDate() - 7);

      var dateFormate = this.datePipe.transform(
        this.date,
        'yyyy' + '-' + 'MM' + '-' + 'dd'
      );
      if (!dateFormate) {
        console.error('Erreur de formatage de la date');
        return; // Arrêtez l'exécution si `dateFormate` est null
      }

      localStorage.setItem('_lookingDate', dateFormate);
      this.loadData();

      this.loadData();
    }
  }

  // public imprimer(format: string | number[] | undefined) {
  //   var doc = new jsPDF('p', 'pt', format);

  //   var pageFormats = { // Size in pt of various paper formats
  //     'a0': [2383.94, 3370.39], 'a1': [1683.78, 2383.94],
  //     'a2': [1190.55, 1683.78], 'a3': [841.89, 1190.55],
  //     'a4': [595.28, 841.89]
  //   };

  //   doc.setFontSize(18);
  //   doc.text('Liste des chantiers du ' + this.dateStart + ' au ' + this.dateEnd, 80, 40);
  //   doc.setFontSize(13);
  //   doc.setTextColor(100);

  //   (doc as any).autoTable({
  //     html: '#myTable',
  //     margin: { right: 20 },
  //     theme: 'grid',
  //     styles: { halign: 'center' },
  //     startY: parseInt('50'),
  //     didParseCell: function (data: any) { }
  //   });

  //   const pageCount = (doc as any).internal.getNumberOfPages();

  //   // For each page, print the page number and the total pages
  //   let options = {
  //     'align': 'right',
  //   }

  //   for (var i = 1; i <= pageCount; i++) {
  //     // Go to page i
  //     doc.setPage(i);
  //     //Print Page 1 of 4 for example
  //     doc.text('Page ' + String(i) + ' sur ' + String(pageCount), doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 20, ("right" as any));
  //   }

  //   doc.output('dataurlnewwindow');
  //   doc.save('chantiersS' + this.idSemaine + '.pdf');;
  // }

  public imprimer() {
    var doc = new jsPDF('p', 'mm', 'a3');

    doc.setFontSize(18);
    doc.text('Liste des chantiers du ' + this.dateStart + ' au ' + this.dateEnd, 80, 40);
    doc.setFontSize(13);
    doc.setTextColor(100);

    (doc as any).autoTable({
      html: '#myTable',
      margin: { right: 20 },
      theme: 'grid',
      styles: { halign: 'center' },
      startY: parseInt('50'),
      didParseCell: function (data: any) { }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();

    // For each page, print the page number and the total pages
    let options = {
      'align': 'right',
    }

    for (var i = 1; i <= pageCount; i++) {
      // Go to page i
      doc.setPage(i);
      //Print Page 1 of 4 for example
      doc.text('Page ' + String(i) + ' sur ' + String(pageCount), doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 20, ("right" as any));
    }

    doc.output('dataurlnewwindow');
    doc.save('chantiersS' + this.idSemaine + '.pdf');
  }
}
