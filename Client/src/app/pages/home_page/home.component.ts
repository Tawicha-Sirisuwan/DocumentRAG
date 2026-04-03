import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  // สถานะการประมวลผล (State Management)
  status: 'idle' | 'uploading' | 'summarizing' | 'success' | 'error' = 'idle';
  selectedFileName: string | null = null;
  errorMessage: string | null = null;
  summaryResult: string | null = null;

  // จัดการเมื่อมีการเลือกไฟล์ผ่าน input
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  // จัดการเมื่อลากไฟล์มาวาง (Drag & Drop)
  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  // ต้องครอบคลุม dragover เพิ่อให้ onDrop ทำงานได้
  onDragOver(event: DragEvent) {
    event.preventDefault(); 
  }

  // ฟังก์ชันส่วนกลางประมวลผลไฟล์ (Security Check & Logic)
  private handleFile(file: File) {
    // กำหนดประเภทและขนาดไฟล์ (Security Best Practices)
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain' 
    ];
    
    // ตรวจสอบนามสกุล
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'ระบบรองรับเฉพาะไฟล์ .pdf, .docx และ .txt เท่านั้นครับ';
      this.status = 'error';
      return;
    }

    // ตรวจสอบขนาดไม่ให้เกิน 10MB เพื่อป้องกัน Server โอเวอร์โหลด
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) { 
      this.errorMessage = 'ขนาดไฟล์เกิน 10MB กรุณาอัปโหลดไฟล์ที่มีขนาดเล็กลงครับ';
      this.status = 'error';
      return;
    }

    this.selectedFileName = file.name;
    this.errorMessage = null;
    this.simulateUploadAndSummarize();
  }

  // จำลองพฤติกรรมการเรียก API (Mock Service)
  private simulateUploadAndSummarize() {
    this.status = 'uploading';
    
    setTimeout(() => {
      this.status = 'summarizing';
      
      setTimeout(() => {
        this.status = 'success';
        // สร้างผลลัพธ์จำลองเพื่อเป็นตัวอย่าง
        this.summaryResult = `📌 **ใจความสำคัญของเอกสาร (${this.selectedFileName}):**
        
- บริษัทตั้งเป้าที่จะเพิ่มรายได้ 25% ในไตรมาสที่ 3 ผ่านกลยุทธ์การขยายตลาดแบบใหม่
- ต้นทุนการดำเนินงานควรถูกควบคุมไม่ให้เกินเพดาน 15% ตามนโยบายส่วนกลาง
- กำหนดการทดสอบระบบ AI ให้ครอบคลุมทุกสาขาภายในวันศุกร์นี้
- โครงการ DocumentRAG นี้เป็นส่วนหนึ่งในการขับเคลื่อนองค์กรสู่ Digital Transformation อย่างเต็มรูปแบบ
`;
      }, 2500); 
    }, 1500); 
  }

  // ฟังก์ชันนำกลับสู่สถานะเริ่มต้น
  reset() {
    this.status = 'idle';
    this.selectedFileName = null;
    this.errorMessage = null;
    this.summaryResult = null;
  }
}
