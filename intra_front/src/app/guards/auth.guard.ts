import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, CanActivateChild } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivateChild {

  constructor(private router: Router, public jwt: JwtHelperService) { }

  canActivateChild(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('token');
    let utilisateur: any; // Declare 'utilisateur' outside of the if block

    if (token) {
      utilisateur = this.jwt.decodeToken(token);
    } else {
      // Handle the case where the token is null, for example, by redirecting to login
      this.router.navigate(['/login']);
      return false; // Ensure function exits if token is null
    }

    localStorage.setItem('current_module', route.data['module_id']);
    console.log(utilisateur);

    console.log("Can access Module ID : " + route.data['module_id'] + " : " + this.canAccess(utilisateur, route));

    if (this.jwt.isTokenExpired(token) || !this.canAccess(utilisateur, route)) {
      localStorage.clear();
      this.router.navigate(['login']);
      return false;
    }

    return true;
  }

  private canAccess(utilisateur: { permissions: any[]; } | null, route: ActivatedRouteSnapshot) {
    if (utilisateur != null && typeof utilisateur.permissions != 'undefined') {
      var idx = utilisateur.permissions.findIndex((e) => e.module_id == route.data['module_id']);

      if (idx == -1 || utilisateur.permissions[idx].r != 1)
        return false;
      return true;
    }
    return false;
  }
}
