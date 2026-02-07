import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appDniValidator]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: DniValidatorDirective,
    multi: true
  }],
  standalone: true
})
export class DniValidatorDirective implements Validator {

  validate(control: AbstractControl): ValidationErrors | null {
    const dni = control.value;
    
    if (!dni) {
      return null; // Dejamos que RequiredValidator se encargue
    }

    const dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKET]$/i;
    
    if (!dniRegex.test(dni)) {
      return { 'dniFormat': true };
    }

    const numero = dni.substring(0, 8);
    const letra = dni.substring(8, 9).toUpperCase();
    const letrasValidas = 'TRWAGMYFPDXBNJZSQVHLCKET';
    const letraCorrecta = letrasValidas[parseInt(numero) % 23];

    if (letra !== letraCorrecta) {
      return { 'dniInvalid': true };
    }

    return null; // DNI válido
  }
}