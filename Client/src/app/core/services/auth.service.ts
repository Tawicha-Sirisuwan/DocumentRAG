import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8000/api/auth';
  
  // สร้าง BehaviorSubject ไว้เก็บสถานะของ User แบบ Global (เผื่อเอาไปโชว์ใน Sidebar)
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  register(userData: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<TokenResponse> {
    // มาตรฐาน OAuth2 บังคับให้ส่งข้อมูลแบบ x-www-form-urlencoded
    const body = new URLSearchParams();
    body.set('username', credentials.email);
    body.set('password', credentials.password);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    // แปะ withCredentials: true เพื่ออนุญาตให้รับ HttpOnly Cookie จาก Backend มาเก็บไว้
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, body.toString(), { headers, withCredentials: true });
  }

  logout(): Observable<any> {
    // ยิง API ไปให้ Backend สั่งล้าง Cookie
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.currentUserSubject.next(null))
    );
  }

  // ลบฟังก์ชัน getToken() ทิ้ง เพราะฝั่งโค้ดอ่าน HttpOnly Cookie ไม่ได้แล้ว

  getProfile(): Observable<User> {
    // ไม่ต้องแนบ Header แบบ Bearer แล้ว ส่ง withCredentials ไป ระบบจะแนบ Cookie ให้อัตโนมัติ
    return this.http.get<User>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }
}
