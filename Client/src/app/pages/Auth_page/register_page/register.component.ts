import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private readonly fb: FormBuilder, private readonly router: Router) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // ตัวตรวจสอบ Custom : เช็คว่าช่อง password ตรอกตรงกับช่อง confirmPassword หรือไม่
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    // ถ้าไม่ตรงกัน ให้พ่น Error ไปที่ช่อง confirmPassword ได้โดยตรง
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // ฟังก์ชันแยกสำหรับปุ่มกดรูปลูกตาของ 2 ฟิลด์รหัสผ่าน
  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // จำลองการเชื่อมต่อ Backend
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'สร้างบัญชีสำเร็จ! ระบบกำลังพาคุณไปยังหน้าเข้าสู่ระบบ...';
      
      // หน่วงเวลาให้ผู้ใช้ได้อ่านข้อความสักนิดก่อนพาไป Login
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }, 1500);
  }
}
