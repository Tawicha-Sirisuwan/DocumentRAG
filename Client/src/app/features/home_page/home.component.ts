import { Component, ChangeDetectionStrategy, signal, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { DocumentService } from '../../core/services/document.service';

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
  private readonly documentService = inject(DocumentService);
  
  messages = this.chatService.activeMessages;
  
  inputText = signal('');
  selectedFile = signal<File | null>(null);
  isTyping = signal(false);
  isUploading = signal(false); // สถานะการอัปโหลดไฟล์

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
      // ตรวจสอบนามสกุลไฟล์
      if (input.files[0].name.endsWith('.pdf')) {
        this.selectedFile.set(input.files[0]);
      } else {
        alert("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้นครับ");
      }
    }
  }
  
  removeSelectedFile() {
    this.selectedFile.set(null);
    if (this.fileInputForm) this.fileInputForm.nativeElement.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      if (event.dataTransfer.files[0].name.endsWith('.pdf')) {
        this.selectedFile.set(event.dataTransfer.files[0]);
      } else {
        alert("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้นครับ");
      }
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

    // เคลียร์กล่องข้อความทันทีให้ UX ดูเร็ว
    this.inputText.set('');
    this.selectedFile.set(null);
    if (this.fileInputForm) this.fileInputForm.nativeElement.value = '';

    if (file) {
      // แสดงข้อความฝั่งผู้ใช้ว่ากำลังส่งไฟล์
      const fileMessage: ChatMessage = {
        id: this.generateId(),
        sender: 'user',
        content: text ? text : `อัปโหลดเอกสาร: ${file.name}`,
        timestamp: new Date(),
        file: { name: file.name, size: file.size }
      };
      this.chatService.addMessageToActiveChat(fileMessage);

      // เรียก Service อัปโหลดไฟล์ตัวจริง!
      this.isUploading.set(true);
      this.documentService.uploadDocument(file).subscribe({
        next: (response) => {
          this.isUploading.set(false);
          // อัปโหลดสำเร็จ ให้ผูก Document ID กับแชทปัจจุบัน
          this.chatService.setDocumentIdToActiveChat(response.document_id);
          this.simulateAssistantReply(file, true);
        },
        error: (err) => {
          this.isUploading.set(false);
          const errorMsg: ChatMessage = {
            id: this.generateId(),
            sender: 'assistant',
            content: `❌ ขออภัยครับ เกิดข้อผิดพลาดในการอัปโหลดไฟล์ โปรดลองใหม่อีกครั้ง`,
            timestamp: new Date()
          };
          this.chatService.addMessageToActiveChat(errorMsg);
        }
      });
    } else if (text) {
      // ถ้าไม่มีไฟล์ ส่งข้อความไปหา AI
      const textMessage: ChatMessage = {
        id: this.generateId(),
        sender: 'user',
        content: text,
        timestamp: new Date()
      };
      this.chatService.addMessageToActiveChat(textMessage);
      
      const activeChat = this.chatService.chats().find(c => c.id === this.chatService.activeChatId());
      const docId = activeChat?.documentId;
      
      // ถ้ามีเอกสารผูกไว้ ให้ถาม AI ของจริงเลย
      if (docId) {
        this.askAI(docId, text);
      } else {
        this.simulateAssistantReply(null, false);
      }
    }
  }

  private askAI(documentId: string, question: string) {
    this.isTyping.set(true);

    // แสดงจุดไข่ปลาว่า AI กำลังคิด
    const typingMessage: ChatMessage = {
      id: 'typing',
      sender: 'assistant',
      content: '',
      isTyping: true,
      timestamp: new Date()
    };
    this.chatService.addMessageToActiveChat(typingMessage);

    // ยิง API ไปหา Backend เพื่อให้ Gemini คิดคำตอบ
    this.chatService.askQuestion(documentId, question).subscribe({
      next: (res) => {
        this.chatService.removeMessageFromActiveChat('typing');
        this.isTyping.set(false);

        const replyMessage: ChatMessage = {
          id: this.generateId(),
          sender: 'assistant',
          content: res.answer,
          timestamp: new Date()
        };
        this.chatService.addMessageToActiveChat(replyMessage);
      },
      error: (err) => {
        this.chatService.removeMessageFromActiveChat('typing');
        this.isTyping.set(false);
        const replyMessage: ChatMessage = {
          id: this.generateId(),
          sender: 'assistant',
          content: '❌ เกิดข้อผิดพลาดในการดึงข้อมูลจาก AI (ระบบ RAG)',
          timestamp: new Date()
        };
        this.chatService.addMessageToActiveChat(replyMessage);
      }
    });
  }

  private simulateAssistantReply(file: File | null, isFileSuccess: boolean = false) {
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
      if (file && isFileSuccess) {
         replyContent = `✅ ผมได้รับไฟล์ **${file.name}** เรียบร้อยแล้วครับ ระบบอ่านและแยกแยะเนื้อหาสำเร็จ คุณสามารถพิมพ์คำถามเกี่ยวกับเอกสารฉบับนี้ได้เลย!`;
      } else {
         replyContent = `⚠️ โปรดอัปโหลดไฟล์ PDF ก่อน เพื่อให้ผมสามารถดึงข้อมูลมาตอบคำถามคุณได้ครับ`;
      }

      const replyMessage: ChatMessage = {
        id: this.generateId(),
        sender: 'assistant',
        content: replyContent,
        timestamp: new Date()
      };
      
      this.chatService.addMessageToActiveChat(replyMessage);
    }, 1500);
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
