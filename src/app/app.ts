import { Component, ChangeDetectionStrategy } from '@angular/core';
import { EditorComponent } from './features/editor/editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page-shell">
      <section class="hero">
        <div>
          <h1>iiSU Home icon generator</h1>
          <small>v1.0</small>
        </div>
        <p class="hero-note">Unofficial. Not affiliated with iiSU.</p>
      </section>

      <section class="workspace" aria-label="Image mask editor">
        <app-editor></app-editor>
      </section>
    </main>
  `,
  styleUrl: './app.css',
  host: {
    class: 'page-root',
  },
})
export class App {}
