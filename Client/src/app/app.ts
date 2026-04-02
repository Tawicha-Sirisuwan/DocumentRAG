import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './share/navbar/navbar.component'; // เรียกใช้ชึิ้นส่วน Navbar

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent], // ปลั๊กอินเข้าไปตรงๆ
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('DocumentRAG');
}
