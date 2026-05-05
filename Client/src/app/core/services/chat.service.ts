import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: Date;
  file?: { name: string; size: number };
  isTyping?: boolean;
}

export interface ChatSession {
  id: number;
  title: string;
  pinned?: boolean;
  messages: ChatMessage[];
  documentId?: string; // เก็บ ID ของเอกสารที่ผูกกับห้องแชทนี้
}

export interface ChatResponse {
  answer: string;
  sources: any[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/chat';
  chats = signal<ChatSession[]>([
    {
      id: 1,
      title: 'เส้นทางสู่ Software AI Engineer',
      pinned: true,
      messages: [
        {
          id: this.generateId(),
          sender: 'assistant',
          content: 'สวัสดีครับ! ผมคือ DocumentRAG AI ผู้ช่วยเจาะลึกเอกสารของคุณ มีเอกสารใดให้ผมช่วยอ่านหรือมีคำถามสงสัย สามารถพิมพ์ข้อความ หรือแนบไฟล์ส่งมาให้ผมได้เลยครับ ✨',
          timestamp: new Date()
        }
      ]
    },
    {
      id: 2,
      title: 'Test',
      pinned: false,
      messages: [
        {
          id: this.generateId(),
          sender: 'assistant',
          content: 'นี่คือห้องแชท Test ครับ มีอะไรให้ช่วยไหมครับ?',
          timestamp: new Date()
        }
      ]
    }
  ]);
  
  activeChatId = signal<number | null>(1);

  // Compute active variables for easy use in components
  activeMessages = computed(() => {
    const active = this.activeChatId();
    const chat = this.chats().find(c => c.id === active);
    return chat ? chat.messages : [];
  });

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  createNewChat() {
    const newChat: ChatSession = { 
      id: Date.now(), 
      title: 'แชทใหม่', 
      pinned: false,
      messages: [
        {
          id: this.generateId(),
          sender: 'assistant',
          content: 'สวัสดีครับ! เริ่มต้นแชทใหม่ได้เลยครับ มีเอกสารอะไรให้ผมช่วยไหมครับ? ✨',
          timestamp: new Date()
        }
      ]
    };
    
    // เรียงลำดับให้ Pinned ไว้บน แล้วตามด้วยอันใหม่
    let updatedChats = [...this.chats(), newChat];
    updatedChats.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    this.chats.set(updatedChats);
    this.activeChatId.set(newChat.id);
  }

  selectChat(chatId: number) {
    this.activeChatId.set(chatId);
  }

  deleteChat(chatId: number) {
    const updated = this.chats().filter(c => c.id !== chatId);
    this.chats.set(updated);
    
    // ถ้าลบแชทที่กำลังแอคทีฟอยู่ ให้เปลี่ยน active ไปที่อันแรกสุด หรือ null ถ้าไม่มีเลย
    if (this.activeChatId() === chatId) {
      this.activeChatId.set(updated.length > 0 ? updated[0].id : null);
    }
  }

  pinChat(chatId: number) {
    const updated = this.chats().map(c => 
      c.id === chatId ? { ...c, pinned: !c.pinned } : c
    );
    updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    this.chats.set(updated);
  }

  renameChat(chatId: number, newTitle: string) {
    if (newTitle.trim()) {
      const updated = this.chats().map(c => 
        c.id === chatId ? { ...c, title: newTitle.trim() } : c
      );
      this.chats.set(updated);
    }
  }

  addMessageToActiveChat(message: ChatMessage) {
    const active = this.activeChatId();
    if (!active) return;
    
    const updated = this.chats().map(c => {
      if (c.id === active) {
        return { ...c, messages: [...c.messages, message] };
      }
      return c;
    });
    this.chats.set(updated);
  }

  removeMessageFromActiveChat(messageId: string) {
    const active = this.activeChatId();
    if (!active) return;
    
    const updated = this.chats().map(c => {
      if (c.id === active) {
        return { ...c, messages: c.messages.filter(m => m.id !== messageId) };
      }
      return c;
    });
    this.chats.set(updated);
  }

  setDocumentIdToActiveChat(documentId: string) {
    const active = this.activeChatId();
    if (!active) return;
    const updated = this.chats().map(c => 
      c.id === active ? { ...c, documentId } : c
    );
    this.chats.set(updated);
  }

  askQuestion(documentId: string, message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/ask`, {
      document_id: documentId,
      message: message
    }, { withCredentials: true });
  }
}
