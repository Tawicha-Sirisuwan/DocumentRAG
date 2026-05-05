import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UploadResponse {
  message: string;
  document_id: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly apiUrl = 'http://localhost:8000/api/documents';
  private readonly http = inject(HttpClient);

  /**
   * อัปโหลดไฟล์ PDF ไปยัง Backend ด้วย multipart/form-data
   * พร้อมส่ง Cookie ยืนยันตัวตน (withCredentials)
   */
  uploadDocument(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData, { 
      withCredentials: true 
    });
  }
}
