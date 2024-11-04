import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './dashboard/home/home.component';

const routes: Routes = [
  {
    path: '', component:DashboardComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        data: {
          title: 'Tableau de bord',
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
