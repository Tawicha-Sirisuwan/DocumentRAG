import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

/**
 * Guard สำหรับล็อคเส้นทางที่ต้อง "เข้าสู่ระบบแล้ว"
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  
  // ถ้า Backend ยอมคืนข้อมูลมาแปลว่า Cookie ยังดีอยู่ อนุญาตให้เข้าได้
  return authService.getProfile().pipe(
    map(user => {
      if (user) return true;
      return router.createUrlTree(['/login']);
    }),
    catchError(() => {
      // ถ้ายิง API แล้วพัง (เช่น 401) แปลว่าไม่มี Cookie / หมดอายุ ให้เด้งไป Login
      return of(router.createUrlTree(['/login']));
    })
  );
};

/**
 * Guard สำหรับเส้นทางสาธารณะ (หน้า Login/Register)
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // วิธีเช็คแบบเดียวกัน ถ้ายิงผ่านแปลว่าล็อกอินค้างไว้อยู่ ให้โยนข้ามไปหน้า /home เลย
  return authService.getProfile().pipe(
    map(user => {
      if (user) return router.createUrlTree(['/home']);
      return true;
    }),
    catchError(() => {
      return of(true); // ไม่มี Cookie ก็อยู่หน้า Login ปกติไป
    })
  );
};
