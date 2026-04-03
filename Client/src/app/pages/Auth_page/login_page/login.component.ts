import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private readonly fb: FormBuilder, private readonly router: Router) {
    // 1. Initial State
    // ตั้งค่าฟอร์มด้วย FormBuilder พร้อมใส่ Validation
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // 2. Interaction
  // สลับการมองเห็นของรหัสผ่าน
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // 3. API Logic
  // การกดปุ่ม Login ส่งข้อมูล
  onSubmit(): void {
    // ป้องกันกรณีผู้ใช้กดข้ามระบบ Validation
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // จำลองการต่อ Backend API ชั่วคราว (รอ 1.5 วินาที)
    setTimeout(() => {
      this.isLoading = false;
      const { email, password } = this.loginForm.value;
      
      // ดัมมี่ออโต้เข้าสู่ระบบ
      if (email === 'admin@docurag.ai' && password === 'admin123') {
        this.router.navigate(['/home']); // Redirect ไปหน้าหลักของระบบเมื่อสำเร็จ
      } else {
        // กรณีผิด ให้ขึ้นแจ้งเตือนและเคลียร์ลืมรหัสผ่าน
        this.errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง';
      }
    }, 1500);
  }
}
