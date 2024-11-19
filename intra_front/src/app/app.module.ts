import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgProgressbar } from 'ngx-progressbar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { NgxFileDropModule } from 'ngx-file-drop';
import { JwtModule } from '@auth0/angular-jwt';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import {MatProgressBarModule} from '@angular/material/progress-bar';

import { Constants } from "./constants";
import { AuthGuard } from "./guards/auth.guard";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './dashboard/home/home.component';
import { AbsencesComponent } from './dashboard/absences/absences.component';
import { AdministrationComponent } from './dashboard/administration/administration.component';
import { ArchivesPointagesComponent } from './dashboard/archives-pointages/archives-pointages.component';
import { CongesComponent } from './dashboard/conges/conges.component';
import { FichePaieComponent } from './dashboard/fiche-paie/fiche-paie.component';
import { GestionAbsencesComponent } from './dashboard/gestion-absences/gestion-absences.component';
import { GestionAdministratifComponent } from './dashboard/gestion-administratif/gestion-administratif.component';
import { GestionAlertesComponent } from './dashboard/gestion-alertes/gestion-alertes.component';
import { GestionCodesAtelierComponent } from './dashboard/gestion-codes-atelier/gestion-codes-atelier.component';
import { GestionConducteursComponent } from './dashboard/gestion-conducteurs/gestion-conducteurs.component';
import { GestionGroupesComponent } from './dashboard/gestion-groupes/gestion-groupes.component';
import { GestionModulesComponent } from './dashboard/gestion-modules/gestion-modules.component';
import { GestionOuvragesComponent } from './dashboard/gestion-ouvrages/gestion-ouvrages.component';
import { GestionPointagesComponent } from './dashboard/gestion-pointages/gestion-pointages.component';
import { GestionPointagesAtelierComponent } from './dashboard/gestion-pointages-atelier/gestion-pointages-atelier.component';
import { GestionResourcesComponent } from './dashboard/gestion-resources/gestion-resources.component';
import { GestionSocietesComponent } from './dashboard/gestion-societes/gestion-societes.component';
import { GestionSynchronisationComponent } from './dashboard/gestion-synchronisation/gestion-synchronisation.component';
import { GestionUtilisateursComponent } from './dashboard/gestion-utilisateurs/gestion-utilisateurs.component';
import { GestionVehiculesComponent } from './dashboard/gestion-vehicules/gestion-vehicules.component';
import { HistoriqueComponent } from './dashboard/historique/historique.component';
import { HistoriqueChantiersComponent } from './dashboard/historique-chantiers/historique-chantiers.component';
import { HomeAnneeComponent } from './dashboard/home-annee/home-annee.component';
import { HomeMoisComponent } from './dashboard/home-mois/home-mois.component';
import { NotificationsComponent } from './dashboard/notifications/notifications.component';
import { PermissionsComponent } from './dashboard/permissions/permissions.component';
import { PlanningComponent } from './dashboard/planning/planning.component';
import { PlanningAbsencesViewerComponent } from './dashboard/planning-absences-viewer/planning-absences-viewer.component';
import { PlanningAtelierComponent } from './dashboard/planning-atelier/planning-atelier.component';
import { PlanningParChantierComponent } from './dashboard/planning-par-chantier/planning-par-chantier.component';
import { PlanningSousTraitantComponent } from './dashboard/planning-sous-traitant/planning-sous-traitant.component';
import { PointagesComponent } from './dashboard/pointages/pointages.component';
import { PointagesAtelierComponent } from './dashboard/pointages-atelier/pointages-atelier.component';
import { PointagesAtelier2Component } from './dashboard/pointages-atelier2/pointages-atelier2.component';
import { PointagesAtelier3Component } from './dashboard/pointages-atelier3/pointages-atelier3.component';
import { PointagesSyntheseComponent } from './dashboard/pointages-synthese/pointages-synthese.component';
import { PointagesSyntheseChantiersComponent } from './dashboard/pointages-synthese-chantiers/pointages-synthese-chantiers.component';
import { Pointages2Component } from './dashboard/pointages2/pointages2.component';
import { Pointages3Component } from './dashboard/pointages3/pointages3.component';
import { PrintLayoutComponent } from './dashboard/print-layout/print-layout.component';
import { RendezvousChantierComponent } from './dashboard/rendezvous-chantier/rendezvous-chantier.component';
import { VehiculesComponent } from './dashboard/vehicules/vehicules.component';
import { ZonesComponent } from './dashboard/zones/zones.component';
import { LoginComponent } from './login/login.component';
import { GestionAtelierComponent } from "./dashboard/gestion-atelier/gestion-atelier.component";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
registerLocaleData(localeFr, 'fr');

export function tokenGetter() {
  return localStorage.getItem('token');
}

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    HomeComponent,
    AbsencesComponent,
    AdministrationComponent,
    ArchivesPointagesComponent,
    CongesComponent,
    FichePaieComponent,
    GestionAbsencesComponent,
    GestionAdministratifComponent,
    GestionAlertesComponent,
    GestionCodesAtelierComponent,
    GestionConducteursComponent,
    GestionGroupesComponent,
    GestionModulesComponent,
    GestionOuvragesComponent,
    GestionPointagesComponent,
    GestionPointagesAtelierComponent,
    GestionResourcesComponent,
    GestionSocietesComponent,
    GestionSynchronisationComponent,
    GestionUtilisateursComponent,
    GestionVehiculesComponent,
    HistoriqueComponent,
    HistoriqueChantiersComponent,
    HomeAnneeComponent,
    HomeMoisComponent,
    NotificationsComponent,
    PermissionsComponent,
    PlanningComponent,
    PlanningAbsencesViewerComponent,
    PlanningAtelierComponent,
    PlanningParChantierComponent,
    PlanningSousTraitantComponent,
    PointagesComponent,
    PointagesAtelierComponent,
    PointagesAtelier2Component,
    PointagesAtelier3Component,
    PointagesSyntheseComponent,
    PointagesSyntheseChantiersComponent,
    Pointages2Component,
    Pointages3Component,
    PrintLayoutComponent,
    RendezvousChantierComponent,
    VehiculesComponent,
    ZonesComponent,
    LoginComponent,
    GestionAtelierComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BaseChartDirective ,
    ReactiveFormsModule,
    HttpClientModule,
    NgProgressbar,
    BrowserAnimationsModule,
    NgxFileDropModule,
    MatProgressBarModule,
    ToastrModule.forRoot(),
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ['dev-api-my.batideko.fr', 'dev-api.batideko.fr'],
        disallowedRoutes: ['dev-api.batideko.fr/api/login', 'dev-api-my.batideko.fr/api/login']
      }
    })
  ],

  providers: [
    { provide: LOCALE_ID, useValue: "fr-FR" },
    Constants,
    AuthGuard,
    DatePipe,
    provideAnimationsAsync(),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
