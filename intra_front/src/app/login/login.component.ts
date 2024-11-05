import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Constants } from '../constants';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  public loginForm: FormGroup;

  constructor(private router: Router, private toastr: ToastrService, private cst: Constants, private http: HttpClient) {
    this.loginForm = new FormGroup({
      login: new FormControl('', [Validators.required, Validators.minLength(3)]),
      motdepasse: new FormControl('', [Validators.required, Validators.minLength(3)])
    });
  }

  public login(): void {
    const body = {
      login: this.loginForm.controls['login'].value,
      motdepasse: this.loginForm.controls['motdepasse'].value
    }
    this.http.post(this.cst.apiUrl + 'login', body).subscribe(
      (response: any) => { // Change 'login: string' to 'response: any'
        const login = response.token; // Access the token within the response object
        if (login) {
          localStorage.setItem('token', login);
          this.toastr.success('Vous êtes connecté !', this.cst.toastrTitle);
          this.router.navigate(['/']);
        } else {
          this.toastr.error('Identifiants incorrects !', this.cst.toastrTitle);
        }
      },
      err => {
        this.toastr.error('Erreur', this.cst.toastrTitle);
      }
    );
  }

}
