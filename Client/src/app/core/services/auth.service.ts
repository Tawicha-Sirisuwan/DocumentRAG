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
  private readonly apiUrl = 'http://127.0.0.1:8000/api/auth';
  
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

    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, body.toString(), { headers }).pipe(
      tap(response => {
        // เมื่อ Login สำเร็จ ให้บันทึก Token ลงใน Browser
        localStorage.setItem('access_token', response.access_token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getProfile(): Observable<User> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    // ดึงโปรไฟล์แล้วอัปเดตลง BehaviorSubject
    return this.http.get<User>(`${this.apiUrl}/me`, { headers }).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }
}
