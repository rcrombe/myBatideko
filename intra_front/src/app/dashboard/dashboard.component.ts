import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from '../constants';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
// import * as jQuery from 'jquery';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import bootstrap, { Modal } from 'bootstrap';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private MODULE_ID = null;
  menuStates: { [key: string]: boolean } = {};

  public showScrollToTop: boolean = false;

  public pageTitle: any;
  public utilisateur;
  public scrollTop: number = 0;


  public icons = ["fa-igloo", "fa-lemon", "fa-life-ring", "fa-mobile-alt", "fa-mountain", "fa-octopus-deploy", "fa-otter", "fa-parachute-box",
    "fa-plane-departure", "fa-quidditch", "fa-robot", "fa-rocket", "fa-satellite"];

  public siteIcon = "fa-igloo";

  public notifications: any[] | undefined;
  public notifications_count: any;

  public isTableauBordCollapsed: boolean = true;

  constructor(private route: ActivatedRoute, private router: Router,private toastr: ToastrService, private http: HttpClient, private cst: Constants, private jwt: JwtHelperService) {
    this.MODULE_ID = route.snapshot.data['module_id'];

    // Récupération du titre de la page
    this.route.url.subscribe(() => {
      this.pageTitle = this.route.snapshot.firstChild?.data['title'];
    });

    this.siteIcon = this.icons[Math.floor(Math.random() * this.icons.length)];
    // Récupération des informations de l'utilisateur
    this.utilisateur = this.jwt.decodeToken(localStorage.getItem('token') ?? '');

    this.loadNotifications();
    
  }

  public loadNotifications(): void {
    this.http.get<Array<any>>(this.cst.apiUrl + 'notifications/navbar').subscribe(
      (arr: Array<any>) => {
        this.notifications = arr;
      },
    )
    this.http.get<Array<any>>(this.cst.apiUrl + 'notifications/count').subscribe(
      (arr: Array<any>) => {
        this.notifications_count = arr[0].nb_notifications;
      },
    )
  }

  public canRead(module: string | null): boolean {
    return this.cst.canAccess_Read(this.utilisateur, module === null ? this.MODULE_ID : module);
  }
  public canWrite(module: null) {
    return this.cst.canAccess_Write(this.utilisateur, (module == null ? this.MODULE_ID : module));
  }
  public canSpecial(module: null) {
    return this.cst.canAccess_Special(this.utilisateur, (module == null ? this.MODULE_ID : module));
  }

  public accessTo(destination: any) {
    if (this.utilisateur.loglevel === '3')
      console.log('eheh')
  }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closeAllMenus();
      }
    });

    // Détecter le défilement pour afficher/masquer le bouton
    // window.addEventListener('scroll', () => {
    //   const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    //   this.showScrollToTop = scrollPosition > 200; // Le bouton apparaît si le défilement dépasse 200px
    //   console.log('Scroll position:', scrollPosition, 'Show button:', this.showScrollToTop);
    // });
  }

  toggleMenu(event: MouseEvent, menuKey: string): void {
    event.preventDefault();
    this.menuStates[menuKey] = !this.menuStates[menuKey];
  }

  closeAllMenus(): void {
    this.menuStates = {}; // Réinitialiser tous les menus à leur état fermé
  }


  scrollToTop() {
    (function smoothscroll() {
      var currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
      if (currentScroll > 0) {
        window.requestAnimationFrame(smoothscroll);
        window.scrollTo(0, currentScroll - (currentScroll / 8));
      }
    })();
  }

  public logout(): void {
    localStorage.clear();
    this.router.navigate(['login']);
  }

  dropdownOpen = false;

  toggleDropdown(event: Event): void {
    event.preventDefault(); // Empêche la redirection due à href="#"
    this.dropdownOpen = !this.dropdownOpen; // Alterne l'état du dropdown
  }

  alertsDropdownOpen = false;

  toggleAlerts(event: Event): void {
    event.preventDefault(); // Empêche la redirection due à href="#"
    this.alertsDropdownOpen = !this.alertsDropdownOpen; // Alterne l'état du dropdown
  }

  navigateTo(url: string): void {
    // Logique pour naviguer vers une URL spécifique
    if (url) {
      window.location.href = url; // Exemple simple, peut être adapté pour Angular Router
    }
  }

  sidebarOpen = true;

  toggleSidebar(): void {
    
    const sidebar = document.getElementById('accordionSidebar'); // Cible la sidebar par son ID
    if (sidebar) {
      sidebar.classList.toggle('toggled'); // Ajoute/Retire la classe 'toggled'
    }
  }
}
