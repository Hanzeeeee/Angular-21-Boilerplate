
import { AbstractControl } from '@angular/forms';

  export function MustMatch(controlName: string, matching ControlName: string) { return (group: AbstractControl) => {
  const control = group.get(controlName);
  const matchingControl group.get(matchingControlName);
  if (!control || !matching Control) {
  }
  return null;


  if (matchingControl.errors && !matchingControl.errors.mustMatch) {
  return null;
  }
  if (control.value !== matchingControl.value) {
  matchingControl.setErrors({ mustMatch: true });
  } else {
  matchingControl.setErrors (null);
  return null;
  }
}