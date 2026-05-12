import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './_helpers';
import { Role } from './_models';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'account', loadChildren: () => import('./account/account.module').then(x => x.AccountModule) },
  { path: 'admin', loadChildren: () => import('./admin/admin.module').then(x => x.AdminModule), canActivate: [AuthGuard], data: { roles: [Role.Admin] } },
  { path: 'profile', loadChildren: () => import('./profile/profile.module').then(x => x.ProfileModule), canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
;