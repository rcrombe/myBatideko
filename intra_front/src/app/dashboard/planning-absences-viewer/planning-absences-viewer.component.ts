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
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-planning-absences-viewer',
  templateUrl: './planning-absences-viewer.component.html',
  styleUrls: ['./planning-absences-viewer.component.css']
})
export class PlanningAbsencesViewerComponent implements OnInit {

  private MODULE_ID = null;

  private utilisateur;
  public listDates: Array<{ date: string; semaine: number; jour: number }> = [];
  public listeSemaines: any;
  public dateEnd: any;
  public dateStart: any;
  public idSemaine: any;
  public absences: any;
  public assignations_absences: any;
  public semaines: any;

  constructor(private route: ActivatedRoute, private http: HttpClient, private cst: Constants,
    private jwt: JwtHelperService, private toastr: ToastrService, private datePipe: DatePipe) {

    this.MODULE_ID = route.snapshot.data['module_id'];

    this.utilisateur = this.jwt.decodeToken(
      localStorage.getItem('token') ?? ''
    );
    this.loadData();
  }

  public canRead(module: string | null) {
    return this.cst.canAccess_Read(this.utilisateur, (module == null ? this.MODULE_ID : module));
  }
  public canWrite(module: null) {
    return this.cst.canAccess_Write(this.utilisateur, (module == null ? this.MODULE_ID : module));
  }
  public canSpecial(module: null) {
    return this.cst.canAccess_Special(this.utilisateur, (module == null ? this.MODULE_ID : module));
  }

  ngOnInit() {
  }

  public loadData() {

    this.http.get(this.cst.apiUrl + 'absences_viewer').subscribe(
      (obj: any) => {
        console.log(obj)
        var res = JSON.parse(obj);

        console.log(res.listAbsences)

        if (res.listAbsences != null)
          this.absences = res.listAbsences;

        if (res.listSemaines != null)
          this.semaines = res.listSemaines;

        console.log(this.semaines)
      });
  }

  public loadSelectedData() {

    var wk_start = $('#period_start').val();
    var wk_end = $('#period_end').val();

    var absences = [];
    var assignations_absences = [];

    this.http.get(this.cst.apiUrl + 'absences_viewer/temps/' + wk_start + '/' + wk_end).subscribe(
      (obj: any) => {
        var res = JSON.parse(obj);
        if (res.absences != null)
          this.absences = res.absences;

        // Vérifiez que res.listDates contient bien les données attendues
        if (res.listDates && Array.isArray(res.listDates)) {
          const listDates = res.listDates.map((el: any) => ({
            date: this.datePipe.transform(el.date, 'dd/MM'),
            semaine: el.semaine ?? 0,
            jour: el.jour ?? 0
          }));
          this.listDates = listDates;
        }

        console.log(this.listDates);

        this.dateStart = res.listDates[0].dateStart;
        this.dateEnd = res.listDates[0].dateEnd;
        var body = {
          listMonth: JSON.stringify(res.listMonth),
          results: JSON.stringify(res.results),
          absences: JSON.stringify(this.absences),
        }
        this.listeSemaines = res.results;

        this.http.post(this.cst.apiUrl + 'absences/assignations', body).subscribe(
          (arr: any) => {
            this.assignations_absences = JSON.parse(arr);
          });
      });
  }

  public myFunction(myInput: string, myTable: string): void {
    // Declare variables
    var input = document.getElementById(myInput) as HTMLInputElement | null;
    var filter, table, tr, td, i, txtValue;

    // Vérifier si l'input existe
    if (!input) {
      console.error(`Element with ID '${myInput}' not found.`);
      return;
    }

    filter = input.value.toUpperCase();

    table = document.getElementById(myTable);
    if (!table) {
      console.error(`Table with ID '${myTable}' not found.`);
      return;
    }

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
