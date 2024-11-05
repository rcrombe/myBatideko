import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from '../constants';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as jQuery from 'jquery';

declare var $: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private MODULE_ID = null;

  public pageTitle: any;
  public utilisateur;
  public scrollTop: number = 0;


  public icons = ["fa-igloo", "fa-lemon", "fa-life-ring", "fa-mobile-alt", "fa-mountain", "fa-octopus-deploy", "fa-otter", "fa-parachute-box",
    "fa-plane-departure", "fa-quidditch", "fa-robot", "fa-rocket", "fa-satellite"];

  public siteIcon = "fa-igloo";

  public notifications: any[] | undefined;
  public notifications_count: any;

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient, private cst: Constants, private jwt: JwtHelperService) {
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

  public canRead(module: null) {
    return this.cst.canAccess_Read(this.utilisateur, (module == null ? this.MODULE_ID : module));
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
    // jquery du template (traduit vers Angular)
    // Toggle the side navigation
    $("#sidebarToggle, #sidebarToggleTop").on('click', function (e: any) {
      $("body").toggleClass("sidebar-toggled");
      $(".sidebar").toggleClass("toggled");
      if ($(".sidebar").hasClass("toggled")) {
        $('.sidebar .collapse').collapse('hide');
      };
    });

    // Close any open menu accordions when window is resized below 768px
    $(window).resize(function () {
      if ($(window).width() < 768) {
        $('.sidebar .collapse').collapse('hide');
      };
    });

    // Prevent the content wrapper from scrolling when the fixed side navigation hovered over
    $('body.fixed-nav .sidebar').on('mousewheel DOMMouseScroll wheel', (e: { originalEvent: any; preventDefault: () => void; }) => {
      if ($(window).width() > 768) {
        const e0 = e.originalEvent;
        const delta = e0.wheelDelta || -e0.detail;
        this.scrollTop += (delta < 0 ? 1 : -1) * 30;
        e.preventDefault();
      }
    });

    // Scroll to top button appear
    $(document).on('scroll', (e: any) => {
      const scrollDistance = $(this).scrollTop();
      if (scrollDistance > 100) {
        $('.scroll-to-top').fadeIn();
      } else {
        $('.scroll-to-top').fadeOut();
      }
    });

    // Smooth scrolling using jQuery easing
    $(document).on('click', 'a', (e: JQuery.ClickEvent) => {
      const $anchor = $(e.currentTarget as HTMLAnchorElement);
      $('html, body').stop().animate(
        {
          scrollTop: $($anchor.attr('href')!).offset()!.top,
        },
        1000,
        'easeInOutExpo'
      );
      e.preventDefault();
    });

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

  public navigateTo(url: any) {
    this.router.navigate([url]);
  }
}
