import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { InformacionBasicaComponent } from './informacion-basica/informacion-basica.component';
import { PagesComponent } from './pages.component';
import { PreexistenciaComponent } from './preexistencia/preexistencia.component';
import { SaludActualComponent } from './salud-actual/salud-actual.component'
import { QrComponent } from './qr/qr.component';
import { QrscanComponent } from './qrscan/qrscan.component';
const routes: Routes = [{
  path: '',
  component: PagesComponent,
  children: [
    {
      path: 'dashboard',
      component: DashboardComponent,
    },
    {
      path: 'informacion_basica',
      component: InformacionBasicaComponent,
    },
    {
      path: 'caracterizacion',
      component: PreexistenciaComponent,
    },
    {
      path: 'sintomas',
      component: SaludActualComponent,
    },
    {
      path: 'ingreso',
      component: QrscanComponent,
    },
    {
      path: 'qrcode',
      component: QrComponent,
    },
    {
      path: '', redirectTo: 'dashboard', pathMatch: 'full',
    },
  ]
    
}]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
