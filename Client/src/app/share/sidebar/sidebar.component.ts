import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = signal(false);
  isAuthPage = signal(false);
  private routerSub!: Subscription;

  recentChats = signal([
    { id: 1, title: 'ตรวจสอบและปรับปรุงเรซูเม่', active: true },
    { id: 2, title: 'ผมเป็นเด็กจบใหม่ ถ้าอยากยื่นงาน สามารถยื่น...', active: false },
    { id: 3, title: 'ตั้งค่า Equalizer APO สำหรับหูฟัง', active: false },
    { id: 4, title: 'ถ้าอยากลองทำ Project เกี่ยวกับ Ai เล่นๆ มี ...', active: false },
    { id: 5, title: 'ช่วยสรุป ลักษณะงานที่ปฏิบัติ สิ่งที่ได้เรียนรู้ ...', active: false },
    { id: 6, title: 'อธิบายโค้ดภาคผนวกโปรเจกต์', active: false },
  ]);

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkRoute(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((event: Event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkRoute(event.urlAfterRedirects);
      });
  }

  private checkRoute(url: string) {
    const isAuth = url.includes('/login') || url.includes('/register');
    this.isAuthPage.set(isAuth);
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  toggleSidebar() {
    this.isCollapsed.update(val => !val);
  }
}
