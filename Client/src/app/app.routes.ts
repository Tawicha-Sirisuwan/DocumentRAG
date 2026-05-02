import { Routes } from '@angular/router';
import { HomeComponent } from './features/home_page/home.component';
import { LoginComponent } from './features/Auth_page/login_page/login.component';
import { RegisterComponent } from './features/Auth_page/register_page/register.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: 'login' } 
];
