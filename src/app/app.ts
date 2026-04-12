import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FooterComponent } from './features/editor/components/footer.component.ts';
import { EditorComponent } from './features/editor/editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EditorComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page-shell">
      <section class="hero">
        <div>
          <h1>iiSU Home icon generator</h1>
        </div>
        <p class="hero-note">Unofficial. Not affiliated with iiSU.</p>
      </section>

      <section class="workspace " aria-label="Image mask editor">
        <app-editor></app-editor>
      </section>
    </main>
    <app-footer></app-footer>
  `,
  styleUrl: './app.css',
  host: {
    class: 'page-root',
  },
})
export class App {}
