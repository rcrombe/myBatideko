import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './dashboard/home/home.component';
import { HomeMoisComponent } from './dashboard/home-mois/home-mois.component';
import { HomeAnneeComponent } from './dashboard/home-annee/home-annee.component';

import { AdministrationComponent } from './dashboard/administration/administration.component';
import { GestionUtilisateursComponent } from './dashboard/gestion-utilisateurs/gestion-utilisateurs.component';
import { GestionModulesComponent } from './dashboard/gestion-modules/gestion-modules.component';
import { GestionGroupesComponent } from './dashboard/gestion-groupes/gestion-groupes.component';
import { GestionResourcesComponent } from './dashboard/gestion-resources/gestion-resources.component';
import { GestionAdministratifComponent } from './dashboard/gestion-administratif/gestion-administratif.component';
import { GestionVehiculesComponent } from './dashboard/gestion-vehicules/gestion-vehicules.component';
import { GestionAbsencesComponent } from './dashboard/gestion-absences/gestion-absences.component';
import { HistoriqueComponent } from './dashboard/historique/historique.component';
import { GestionConducteursComponent } from './dashboard/gestion-conducteurs/gestion-conducteurs.component';
import { GestionAlertesComponent } from './dashboard/gestion-alertes/gestion-alertes.component';
import { GestionCodesAtelierComponent } from './dashboard/gestion-codes-atelier/gestion-codes-atelier.component';
import { GestionSocietesComponent } from './dashboard/gestion-societes/gestion-societes.component';

import { PlanningComponent } from './dashboard/planning/planning.component';
import { PlanningParChantierComponent } from './dashboard/planning-par-chantier/planning-par-chantier.component';
import { PlanningSousTraitantComponent } from './dashboard/planning-sous-traitant/planning-sous-traitant.component';
import { PlanningAbsencesViewerComponent } from './dashboard/planning-absences-viewer/planning-absences-viewer.component';
import { PlanningAtelierComponent } from './dashboard/planning-atelier/planning-atelier.component';
import { VehiculesComponent } from './dashboard/vehicules/vehicules.component';
import { RendezvousChantierComponent } from './dashboard/rendezvous-chantier/rendezvous-chantier.component';

import { PointagesComponent } from './dashboard/pointages/pointages.component';
import { Pointages2Component } from './dashboard/pointages2/pointages2.component';
import { CongesComponent } from './dashboard/conges/conges.component';
import { AbsencesComponent } from './dashboard/absences/absences.component';
import { GestionPointagesComponent } from './dashboard/gestion-pointages/gestion-pointages.component';
import { FichePaieComponent } from './dashboard/fiche-paie/fiche-paie.component';
import { GestionSynchronisationComponent } from './dashboard/gestion-synchronisation/gestion-synchronisation.component';
import { Pointages3Component } from './dashboard/pointages3/pointages3.component';
import { ArchivesPointagesComponent } from './dashboard/archives-pointages/archives-pointages.component';
import { ZonesComponent } from './dashboard/zones/zones.component';
import { PointagesSyntheseComponent } from './dashboard/pointages-synthese/pointages-synthese.component';
import { HistoriqueChantiersComponent } from './dashboard/historique-chantiers/historique-chantiers.component';
import { NotificationsComponent } from './dashboard/notifications/notifications.component';
import { GestionAtelierComponent } from './dashboard/gestion-atelier/gestion-atelier.component';
import { GestionOuvragesComponent } from './dashboard/gestion-ouvrages/gestion-ouvrages.component';
import { PointagesAtelierComponent } from './dashboard/pointages-atelier/pointages-atelier.component';
import { GestionPointagesAtelierComponent } from './dashboard/gestion-pointages-atelier/gestion-pointages-atelier.component';
import { PointagesAtelier2Component } from './dashboard/pointages-atelier2/pointages-atelier2.component';
import { PointagesAtelier3Component } from './dashboard/pointages-atelier3/pointages-atelier3.component';
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
      {
        path: 'home-annee',
        component: HomeAnneeComponent,
        data: {
          title: 'Tableau de bord',
          role: [1, 2, 3, 4, 5],
          module_id: 'M_DASHBOARD'
        }
      },
      {
        path: 'home-mois',
        component: HomeMoisComponent,
        data: {
          title: 'Tableau de bord',
          role: [1, 2, 3, 4, 5],
          module_id: 'M_DASHBOARD'
        }
      },
      {
        path: 'vehicules',
        component: VehiculesComponent,
        data: {
          title: 'Vehicules',
          role: [1,2,3,4,5],
          module_id: 'M_VEHICULES'
        }
      },

      //Administration
      {
        path: 'administration',
        component: AdministrationComponent,
        data: {
          title: 'Administration',
          role: [1, 2, 3],
          module_id: 'A_ADMINISTRATION'
        }
      },
      {
        path: 'gestion-modules',
        component: GestionModulesComponent,
        data: {
          title: 'Gestion des Modules',
          role: [1],
          module_id: 'A_GESTION_MODULES'
        }
      },
      {
        path: 'gestion-utilisateurs',
        component: GestionUtilisateursComponent,
        data: {
          title: 'Gestion Utilisateurs',
          role: [1],
          module_id: 'A_GESTION_USERS'
        }
      },
      {
        path: 'gestion-groupes',
        component: GestionGroupesComponent,
        data: {
          title: 'Gestion des groupes',
          role: [1],
          module_id: 'A_GESTION_GROUPES'
        }
      },
      {
        path: 'gestion-resources',
        component: GestionResourcesComponent,
        data: {
          title: 'Gestion Resources',
          role: [1, 2, 3],
          module_id: 'A_GESTION_RESSOURCES'
        }
      },
      {
        path: 'gestion-administratif',
        component: GestionAdministratifComponent,
        data: {
          title: "Gestion de l'administratif",
          role: [1],
          module_id: 'A_GESTION_ADMINISTRATIF'
        }
      },
      {
        path: 'gestion-vehicules',
        component: GestionVehiculesComponent,
        data: {
          title: 'Gestion Véhicules',
          role: [1, 2, 3],
          module_id: 'A_GESTION_VEHICULES'
        }
      },
      {
        path: 'gestion-absences',
        component: GestionAbsencesComponent,
        data: {
          title: 'Gestion Absences',
          role: [1, 3, 4],
          module_id: 'A_GESTION_ABSENCES'
        }
      },
      {
        path: 'historique',
        component: HistoriqueComponent,
        data: {
          title: 'Historique',
          role: [1],
          module_id: 'A_HISTORIQUE'
        }
      },
      {
        path: 'gestion-conducteurs',
        component: GestionConducteursComponent,
        data: {
          title: 'Gestion des conducteurs',
          role: [1, 2],
          module_id: 'A_GESTION_CTX'
        }
      },
      {
        path: 'gestion-alertes',
        component: GestionAlertesComponent,
        data: {
          title: 'Gestion des alertes',
          role: [1],
          module_id: 'A_GESTION_ALERTES'
        }
      },
      {
        path: 'gestion-codes-atelier',
        component: GestionCodesAtelierComponent,
        data: {
          title: 'Gestion des Pointages Atelier',
          role: [1, 2, 3, 4, 5],
          module_id: 'A_GESTION_CODES_ATELIER'
        }
      },
      {
        path: 'gestion-societes',
        component: GestionSocietesComponent,
        data: {
          title: 'Gestion des sociétés',
          role: [1, 2, 3, 4, 5],
          module_id: 'A_GESTION_SOCIETES'
        }
      },

      //Chantiers
      {
        path: 'planning',
        component: PlanningComponent,
        data: {
          title: 'Planning',
          role: [1, 2, 3, 4, 5],
          module_id: 'M_CHANTIERS_PLANNING_G'
        }
      },
      {
        path: 'planning-sous-traitant',
        component: PlanningSousTraitantComponent,
        data: {
          title: 'Planning sous-traitant',
          role: [1,2,3,4,5],
          module_id: 'M_CHANTIERS_PLANNING_ST'
        }
      },
      {
        path: 'rendezvous-chantier',
        component: RendezvousChantierComponent,
        data: {
          title: 'PLanning rendez-vous chantier',
          role: [1,2,3,4,5],
          module_id: 'M_CHANTIERS_PLANNING_RDV'
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
