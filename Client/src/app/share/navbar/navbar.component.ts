import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule], // นำเข้า RouterModule เพื่อให้สั่งลิงก์ข้ามหน้าได้
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  // สถานะเก็บการเปิด-ปิดเมนูสำหรับมุมมองมือถือ (Mobile Hamburger Menu)
  isMenuOpen = false;
  isUserMenuOpen = signal(false);
  isLoginPage = signal(false);
  isUsername = signal("Admin DocuRAG");

  constructor(private readonly router: Router, private readonly authService: AuthService) {
    // ติดตามการเปลี่ยนหน้า เพื่อเช็คว่าตอนนี้อยู่หน้า Login หรือ Register หรือไม่
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLoginPage.set(event.urlAfterRedirects.includes('/login') || event.urlAfterRedirects.includes('/register'));
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleUserMenu() {
    this.isUserMenuOpen.update(v => !v);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.isUserMenuOpen.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout failed', err);
        this.isUserMenuOpen.set(false);
        this.router.navigate(['/login']);
      }
    });
  }
}
