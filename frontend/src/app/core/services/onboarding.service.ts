import { Injectable, signal } from '@angular/core';

/**
 * Coordinates the post-login welcome showcase so it always appears before
 * any other first-run prompts (e.g. the location-permission modal on Home).
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  readonly showWelcome = signal(false);

  /** Call right after a successful customer login/registration. */
  triggerWelcome(): void {
    try {
      if (sessionStorage.getItem('mislice_welcome_seen')) return;
    } catch { /* ignore */ }
    this.showWelcome.set(true);
  }

  dismissWelcome(): void {
    this.showWelcome.set(false);
    try { sessionStorage.setItem('mislice_welcome_seen', '1'); } catch { /* ignore */ }
  }
}
