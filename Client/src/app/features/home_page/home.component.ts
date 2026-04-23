import { Component, ChangeDetectionStrategy, signal, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChatService, ChatMessage } from '../../core/services/chat.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements AfterViewChecked {
  @ViewChild('chatContainer') private readonly chatContainer!: ElementRef;
  @ViewChild('fileInputForm') private readonly fileInputForm!: ElementRef<HTMLInputElement>;
  
  public readonly chatService = inject(ChatService);
  
  messages = this.chatService.activeMessages;
  
  inputText = signal('');
  selectedFile = signal<File | null>(null);
  isTyping = signal(false);

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch(err) { console.error(err); }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  triggerFileInput() {
    this.fileInputForm.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }
  
  removeSelectedFile() {
    this.selectedFile.set(null);
    if (this.fileInputForm) this.fileInputForm.nativeElement.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectedFile.set(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); 
  }

  handleEnterKey(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const text = this.inputText().trim();
    const file = this.selectedFile();
    
    if (!text && !file) return;

    const newMessage: ChatMessage = {
      id: this.generateId(),
      sender: 'user',
      content: text,
      timestamp: new Date(),
      file: file ? { name: file.name, size: file.size } : undefined
    };
    
    this.chatService.addMessageToActiveChat(newMessage);
    this.inputText.set('');
    this.selectedFile.set(null);
    if (this.fileInputForm) this.fileInputForm.nativeElement.value = '';

    this.simulateAssistantReply(file);
  }

  private simulateAssistantReply(file: File | null) {
    this.isTyping.set(true);

    const typingMessage: ChatMessage = {
      id: 'typing',
      sender: 'assistant',
      content: '',
      isTyping: true,
      timestamp: new Date()
    };
    this.chatService.addMessageToActiveChat(typingMessage);

    setTimeout(() => {
      this.chatService.removeMessageFromActiveChat('typing');
      this.isTyping.set(false);

      let replyContent = '';
      if (file) {
         replyContent = `📌 **สรุปข้อมูลและใจความสำคัญ (${file.name}):**\n\n- ตรวจพบเป้าหมายทางการเงินและนโยบายการควบคุมต้นทุน\n- โครงการ DocumentRAG นี้เป็นส่วนหนึ่งในการสนับสนุนการวิเคราะห์ข้อมูล\n\nคุณมีคำถามเพิ่มเติมเกี่ยวกับข้อมูลชุดนี้หรือไม่ครับ?`;
      } else {
         replyContent = `ได้รับข้อความแล้วครับ ผมกำลังค้นหาและรวบรวมข้อมูลในบริบทที่คุณถาม เพื่อประมวลผลคำตอบที่ดีที่สุดให้ครับ`;
      }

      const replyMessage: ChatMessage = {
        id: this.generateId(),
        sender: 'assistant',
        content: replyContent,
        timestamp: new Date()
      };
      
      this.chatService.addMessageToActiveChat(replyMessage);
    }, 2500);
  }
  
  formatBytes(bytes: number, decimals = 2) {
      if (!+bytes) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
