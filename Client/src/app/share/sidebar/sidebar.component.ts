import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';

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

  openMenuId = signal<number | null>(null);
  editingChatId = signal<number | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // ปิดเมนูเมื่อคลิกที่อื่น (เงื่อนไขพื้นฐาน)
    // การคลิกที่ตัวจุดจะถูกหยุดการทำ propagation ไว้แล้ว
    this.openMenuId.set(null);
  }

  constructor(
    private readonly router: Router,
    public readonly chatService: ChatService
  ) {}

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
    this.chatService.createNewChat();
  }

  selectChat(chatId: number) {
    this.chatService.selectChat(chatId);
  }

  toggleMenu(event: MouseEvent, chatId: number) {
    event.stopPropagation();
    this.openMenuId.update(current => current === chatId ? null : chatId);
  }

  deleteChat(chatId: number) {
    this.chatService.deleteChat(chatId);
    this.openMenuId.set(null);
  }

  pinChat(chatId: number) {
    this.chatService.pinChat(chatId);
    this.openMenuId.set(null);
  }

  startRename(chatId: number) {
    this.editingChatId.set(chatId);
    this.openMenuId.set(null);
  }

  saveRename(chatId: number, newTitle: string) {
    this.chatService.renameChat(chatId, newTitle);
    this.editingChatId.set(null);
  }

  cancelRename() {
    this.editingChatId.set(null);
  }
}
