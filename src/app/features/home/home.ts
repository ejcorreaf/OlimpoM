/*import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  
}
*/
import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `<div class="p-3"><h2>Bienvenido al Frontend DAW</h2></div>`
})
export class Home {}
