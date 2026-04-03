import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home_page/home.component';
import { LoginComponent } from './pages/login_page/login.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '' } // Redirect fallbacks ไปหน้า Home
];
