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

  constructor(private router: Router, private toastr: ToastrService, private cst: Constants, private http: HttpClient, private constants: Constants) {
    this.loginForm = new FormGroup({
      login: new FormControl('', [Validators.required, Validators.minLength(3)]),
      motdepasse: new FormControl('', [Validators.required, Validators.minLength(3)])
    });
  }

  public login(): void {
    const body = {
      login: this.loginForm.controls['login'].value,
      motdepasse: this.loginForm.controls['motdepasse'].value
    };
  
    this.http.post<{ token: string }>(this.cst.apiUrl + 'login', body).subscribe(
      (response) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.constants.showSuccess('Correctement connecté!', 'X');
          this.router.navigate(['']);
        } else {
          this.constants.showError('Identifiants incorrects!', 'X');
          console.log(body);
          console.log(response);
        }
      },
      (err) => {
        this.constants.showError('Erreur !', 'X');
      }
    );
  }  

}
