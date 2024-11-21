import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../constants';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
declare var $: any;
declare var require: any


@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.css']
})
export class AdministrationComponent implements OnInit {
  private MODULE_ID = null;


  private utilisateur;
  public utilisateurs = [];
  public error = "";
  public edited_user = null;


  constructor(private route: ActivatedRoute, private http: HttpClient, private cst: Constants, private jwt: JwtHelperService,
    private toastr: ToastrService) {
    const token = localStorage.getItem('token');
    if (token) {
      this.utilisateur = this.jwt.decodeToken(token);
    } else {
      console.error('Token non trouvé dans le localStorage');
      this.utilisateur = null; // Ou une valeur par défaut
    }
    this.MODULE_ID = route.snapshot.data['module_id'];

    this.loadData()
  }

  public accessTo(destination: any) {
    if (this.utilisateur.loglevel === '5')
      console.log('eheh')
  }

  public loadData(): void {
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


}
