import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './dashboard/home/home.component';
import { PointagesComponent } from './dashboard/pointages/pointages.component';
import { Pointages2Component } from './dashboard/pointages2/pointages2.component';
import { CongesComponent } from './dashboard/conges/conges.component';
import { HomeMoisComponent } from './dashboard/home-mois/home-mois.component';
import { HomeAnneeComponent } from './dashboard/home-annee/home-annee.component';
import { PlanningComponent } from './dashboard/planning/planning.component';
import { AdministrationComponent } from './dashboard/administration/administration.component';
import { GestionUtilisateursComponent } from './dashboard/gestion-utilisateurs/gestion-utilisateurs.component';
import { GestionResourcesComponent } from './dashboard/gestion-resources/gestion-resources.component';
import { GestionVehiculesComponent } from './dashboard/gestion-vehicules/gestion-vehicules.component';
import { PlanningParChantierComponent } from './dashboard/planning-par-chantier/planning-par-chantier.component';
import { PlanningSousTraitantComponent } from './dashboard/planning-sous-traitant/planning-sous-traitant.component';
import { VehiculesComponent } from './dashboard/vehicules/vehicules.component';
import { AbsencesComponent } from './dashboard/absences/absences.component';
import { GestionAbsencesComponent } from './dashboard/gestion-absences/gestion-absences.component';
import { GestionPointagesComponent } from './dashboard/gestion-pointages/gestion-pointages.component';
import { RendezvousChantierComponent } from './dashboard/rendezvous-chantier/rendezvous-chantier.component';
import { HistoriqueComponent } from './dashboard/historique/historique.component';
import { FichePaieComponent } from './dashboard/fiche-paie/fiche-paie.component';
import { GestionSynchronisationComponent } from './dashboard/gestion-synchronisation/gestion-synchronisation.component';
import { GestionAdministratifComponent } from './dashboard/gestion-administratif/gestion-administratif.component';
import { GestionConducteursComponent } from './dashboard/gestion-conducteurs/gestion-conducteurs.component';
import { Pointages3Component } from './dashboard/pointages3/pointages3.component';
import { ArchivesPointagesComponent } from './dashboard/archives-pointages/archives-pointages.component';
import { ZonesComponent } from './dashboard/zones/zones.component';
import { PointagesSyntheseComponent } from './dashboard/pointages-synthese/pointages-synthese.component';
import { HistoriqueChantiersComponent } from './dashboard/historique-chantiers/historique-chantiers.component';
import { GestionGroupesComponent } from './dashboard/gestion-groupes/gestion-groupes.component';
import { GestionModulesComponent } from './dashboard/gestion-modules/gestion-modules.component';
import { NotificationsComponent } from './dashboard/notifications/notifications.component';
import { GestionAlertesComponent } from './dashboard/gestion-alertes/gestion-alertes.component';
import { PlanningAbsencesViewerComponent } from './dashboard/planning-absences-viewer/planning-absences-viewer.component';
import { PlanningAtelierComponent } from './dashboard/planning-atelier/planning-atelier.component';
import { GestionAtelierComponent } from './dashboard/gestion-atelier/gestion-atelier.component';
import { GestionOuvragesComponent } from './dashboard/gestion-ouvrages/gestion-ouvrages.component';
import { PointagesAtelierComponent } from './dashboard/pointages-atelier/pointages-atelier.component';
import { GestionPointagesAtelierComponent } from './dashboard/gestion-pointages-atelier/gestion-pointages-atelier.component';
import { PointagesAtelier2Component } from './dashboard/pointages-atelier2/pointages-atelier2.component';
import { GestionCodesAtelierComponent } from './dashboard/gestion-codes-atelier/gestion-codes-atelier.component';
import { PointagesAtelier3Component } from './dashboard/pointages-atelier3/pointages-atelier3.component';
import { GestionSocietesComponent } from './dashboard/gestion-societes/gestion-societes.component';
import { PointagesSyntheseChantiersComponent } from './dashboard/pointages-synthese-chantiers/pointages-synthese-chantiers.component';

import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '', component: DashboardComponent,
    canActivateChild: [AuthGuard],
    children: [
      {
        path: '',
        component: HomeComponent,
        data: {
          title: 'Tableau de bord',
          role: [1, 2, 3, 4, 5],
          module_id: 'M_DASHBOARD'
        }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
