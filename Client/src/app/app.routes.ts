import { Routes } from '@angular/router';
import { HomeComponent } from './features/home_page/home.component';
import { LoginComponent } from './features/Auth_page/login_page/login.component';
import { RegisterComponent } from './features/Auth_page/register_page/register.component';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [publicGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' } 
];
