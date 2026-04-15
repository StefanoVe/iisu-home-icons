import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-steamgriddb-api-key-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onClose()',
  },
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick()">
        <section
          class="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="steamgriddb-modal-title"
          aria-describedby="steamgriddb-modal-description"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-progress" aria-hidden="true">
            <span [class.is-active]="step() >= 1"></span>
            <span [class.is-active]="step() >= 2"></span>
          </div>

          @if (step() === 1) {
            <div class="modal-content">
              <p class="eyebrow">SteamGridDB Setup</p>
              <h3 id="steamgriddb-modal-title">Connect your personal API key</h3>
              <p id="steamgriddb-modal-description" class="modal-copy">
                Search uses your own SteamGridDB API key to fetch hero artwork for game backgrounds.
              </p>
              <p class="modal-note">
                Your SteamGridDB API key is saved only in this browser on this device.
              </p>
            </div>

            <div class="modal-actions">
              <button class="ghost-button" type="button" (click)="onClose()">Not now</button>
              <button class="primary-button" type="button" (click)="goToStep(2)">Continue</button>
            </div>
          } @else {
            <div class="modal-content">
              <p class="eyebrow">Step 2 of 2</p>
              <h3 id="steamgriddb-modal-title">Paste your API key</h3>
              <p id="steamgriddb-modal-description" class="modal-copy">
                You can create one from your SteamGridDB account preferences.
              </p>

              <label class="field" for="steamgriddb-modal-api-key">
                <span class="field-label">SteamGridDB API key</span>
                <input
                  id="steamgriddb-modal-api-key"
                  type="password"
                  placeholder="Paste your personal API key"
                  [value]="draftApiKey()"
                  (input)="onApiKeyInput($event)"
                  autocapitalize="off"
                  autocomplete="off"
                  spellcheck="false"
                />
              </label>

              <p class="modal-note">
                Your SteamGridDB API key is saved only in this browser on this device.
              </p>
            </div>

            <div class="modal-actions">
              <button class="ghost-button" type="button" (click)="goToStep(1)">Back</button>
              <button
                class="primary-button"
                type="button"
                [disabled]="!canSave()"
                (click)="onSave()"
              >
                Save and continue
              </button>
            </div>
          }
        </section>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 30;
      display: grid;
      place-items: center;
      padding: 24px;
      background: rgba(11, 37, 68, 0.42);
      backdrop-filter: blur(14px);
    }

    .modal-card {
      width: min(100%, 480px);
      display: grid;
      gap: 22px;
      padding: 24px;
      border: 1px solid rgba(139, 189, 236, 0.28);
      border-radius: 28px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 250, 255, 0.95)),
        rgba(255, 255, 255, 0.98);
      box-shadow: 0 32px 80px rgba(28, 80, 136, 0.24);
    }

    .modal-progress {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .modal-progress span {
      height: 6px;
      border-radius: 999px;
      background: rgba(148, 198, 243, 0.28);
    }

    .modal-progress span.is-active {
      background: linear-gradient(135deg, #1b94ea, #0a67c7);
    }

    .modal-content {
      display: grid;
      gap: 12px;
    }

    .eyebrow {
      margin: 0;
      color: var(--accent-deep, #0f67bf);
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h3 {
      margin: 0;
      color: var(--text-strong, #173154);
      font-size: clamp(1.35rem, 2vw, 1.7rem);
      line-height: 1.1;
      letter-spacing: -0.04em;
    }

    .modal-copy,
    .modal-note {
      margin: 0;
      color: var(--text-soft, #5a7798);
      line-height: 1.5;
    }

    .modal-note {
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(236, 246, 255, 0.92);
      color: var(--text-strong, #173154);
      font-size: 0.92rem;
    }

    .field {
      display: grid;
      gap: 6px;
    }

    .field-label {
      color: var(--text-strong, #173154);
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.01em;
    }

    .field input {
      width: 100%;
      min-height: 48px;
      padding: 0 14px;
      border: 1px solid rgba(42, 167, 242, 0.28);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.96);
      color: var(--text-strong, #173154);
      font-family: inherit;
      font-size: inherit;
      transition: all 0.2s ease;
    }

    .field input:focus-visible {
      outline: none;
      border-color: rgba(42, 167, 242, 0.6);
      box-shadow: 0 0 0 3px rgba(34, 139, 230, 0.1);
    }

    .modal-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .ghost-button,
    .primary-button {
      min-height: 44px;
      padding: 0 14px;
      border-radius: 999px;
      border: none;
      font-weight: 800;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .primary-button {
      background: linear-gradient(135deg, #1b94ea, #0a67c7);
      color: #ffffff;
      box-shadow: 0 16px 24px rgba(12, 104, 196, 0.2);
    }

    .primary-button:hover:not(:disabled) {
      box-shadow: 0 20px 32px rgba(12, 104, 196, 0.3);
      transform: translateY(-1px);
    }

    .primary-button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
      box-shadow: none;
    }

    .ghost-button {
      background: rgba(229, 242, 255, 0.95);
      color: var(--accent-deep, #0f67bf);
    }

    .ghost-button:hover {
      background: rgba(229, 242, 255, 1);
      box-shadow: 0 4px 12px rgba(34, 139, 230, 0.15);
    }

    .ghost-button:focus-visible,
    .primary-button:focus-visible {
      outline: 3px solid rgba(34, 139, 230, 0.32);
      outline-offset: 4px;
    }

    @media (max-width: 640px) {
      .modal-backdrop {
        padding: 16px;
      }

      .modal-card {
        padding: 20px;
      }

      .modal-actions {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class SteamGridDbApiKeyModalComponent {
  isOpen = input(false);
  currentApiKey = input('');

  close = output<void>();
  save = output<string>();

  protected readonly step = signal<1 | 2>(1);
  protected readonly draftApiKey = signal('');
  protected readonly canSave = signal(false);

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        return;
      }

      const currentApiKey = this.currentApiKey().trim();
      this.step.set(currentApiKey ? 2 : 1);
      this.draftApiKey.set(currentApiKey);
      this.canSave.set(currentApiKey.length > 0);
    });
  }

  protected goToStep(step: 1 | 2): void {
    this.step.set(step);
  }

  protected onApiKeyInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const value = input?.value ?? '';
    this.draftApiKey.set(value);
    this.canSave.set(value.trim().length > 0);
  }

  protected onBackdropClick(): void {
    this.onClose();
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected onSave(): void {
    const value = this.draftApiKey().trim();
    if (!value) {
      return;
    }

    this.save.emit(value);
  }
}
