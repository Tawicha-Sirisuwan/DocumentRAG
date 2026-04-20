import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
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

  recentChats = signal<{id: number, title: string, active: boolean, pinned?: boolean}[]>([]);
  openMenuId = signal<number | null>(null);
  editingChatId = signal<number | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // ปิดเมนูเมื่อคลิกที่อื่น (เงื่อนไขพื้นฐาน)
    // การคลิกที่ตัวจุดจะถูกหยุดการทำ propagation ไว้แล้ว
    this.openMenuId.set(null);
  }

  constructor(private readonly router: Router) {}

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

  createNewChat() {
    const newChat = { 
      id: Date.now(), 
      title: 'แชทใหม่', 
      active: true,
      pinned: false 
    };
    
    // ให้ช่องอื่นๆ เป็น inactive และนำแชทใหม่ไปแทรกไว้บนสุด
    // ให้ช่องอื่นๆ เป็น inactive และนำแชทใหม่ไปแทรกไว้บนสุด (อันที่ไม่ได้ pin)
    // การเรียงลำดับใหม่: เอา pinned ไว้บนแล้วตามด้วยอันใหม่
    let updatedChats = this.recentChats().map(chat => ({ ...chat, active: false }));
    updatedChats = [newChat, ...updatedChats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    this.recentChats.set(updatedChats);
  }

  selectChat(chatId: number) {
    const updatedChats = this.recentChats().map(chat => ({
      ...chat,
      active: chat.id === chatId
    }));
    this.recentChats.set(updatedChats);
  }

  toggleMenu(event: MouseEvent, chatId: number) {
    event.stopPropagation();
    this.openMenuId.update(current => current === chatId ? null : chatId);
  }

  deleteChat(chatId: number) {
    const updated = this.recentChats().filter(c => c.id !== chatId);
    this.recentChats.set(updated);
    this.openMenuId.set(null);
  }

  pinChat(chatId: number) {
    const updated = this.recentChats().map(c => 
      c.id === chatId ? { ...c, pinned: !c.pinned } : c
    );
    // เรียงลำดับให้ Pinned ไปอยู่ด้านบนสุด
    updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    this.recentChats.set(updated);
    this.openMenuId.set(null);
  }

  startRename(chatId: number) {
    this.editingChatId.set(chatId);
    this.openMenuId.set(null);
  }

  saveRename(chatId: number, newTitle: string) {
    if (newTitle.trim()) {
      const updated = this.recentChats().map(c => 
        c.id === chatId ? { ...c, title: newTitle.trim() } : c
      );
      this.recentChats.set(updated);
    }
    this.editingChatId.set(null);
  }

  cancelRename() {
    this.editingChatId.set(null);
  }
}
