import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <footer
    class="p-2 py-4 text-white border-t border-white/50 backdrop-brightness-75 bg-blue-300/75 font-bytesized backdrop-blur"
  >
    <span> v.1.1</span>
    <span class="float-right flex">
      made with
      <span class="mx-1 mr-2 mt-0.5"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-5"
          viewBox="0 0 60 60"
          xmlns:v="https://vecta.io/nano"
        >
          <path d="M12 18h6v6h-6z" fill="#fff"></path>
          <path d="M18 6h6v6h-6z"></path>
          <path d="M12 6h6v6h-6zm12 6h6v6h-6z"></path>
          <path d="M30 12h6v6h-6z"></path>
          <path d="M36 6h6v6h-6z"></path>
          <path d="M42 6h6v6h-6z"></path>
          <path d="M48 6h6v6h-6z"></path>
          <path d="M54 12h6v6h-6z"></path>
          <path d="M54 18h6v6h-6zM6 6h6v6H6z"></path>
          <path d="M0 12h6v6H0z"></path>
          <path d="M0 18h6v6H0z"></path>
          <path d="M0 24h6v6H0zm54 0h6v6h-6z"></path>
          <path d="M6 30h6v6H6z"></path>
          <path d="M12 36h6v6h-6z"></path>
          <path d="M18 42h6v6h-6z"></path>
          <path d="M24 48h6v6h-6z"></path>
          <path d="M30 48h6v6h-6z"></path>
          <path d="M36 42h6v6h-6z"></path>
          <path d="M42 36h6v6h-6z"></path>
          <path d="M48 30h6v6h-6z"></path>
          <path d="M6 12h6v6H6z" fill="#9d0000"></path>
          <g fill="red">
            <path d="M12 12h6v6h-6z"></path>
            <path d="M18 12h6v6h-6z"></path>
          </g>
          <path d="M6 18h6v6H6z" fill="#9d0000"></path>
          <g fill="red">
            <path d="M12 18h6v6h-6z"></path>
            <path d="M18 18h6v6h-6z"></path>
          </g>
          <path d="M6 24h6v6H6z" fill="#9d0000"></path>
          <g fill="red">
            <path d="M12 24h6v6h-6z"></path>
            <path d="M18 24h6v6h-6z"></path>
          </g>
          <path d="M12 30h6v6h-6z" fill="#9d0000"></path>
          <path d="M18 30h6v6h-6z" fill="red"></path>
          <path d="M18 36h6v6h-6z" fill="#9d0000"></path>
          <path d="M24 36h6v6h-6z" fill="red"></path>
          <path d="M24 42h6v6h-6z" fill="#9d0000"></path>
          <g fill="red">
            <path d="M30 42h6v6h-6z"></path>
            <path d="M30 36h6v6h-6z"></path>
            <path d="M24 30h6v6h-6z"></path>
            <path d="M30 30h6v6h-6z"></path>
            <path d="M30 24h6v6h-6z"></path>
            <path d="M24 24h6v6h-6z"></path>
            <path d="M24 18h6v6h-6z"></path>
            <path d="M30 18h6v6h-6z"></path>
            <path d="M36 24h6v6h-6z"></path>
            <path d="M42 30h6v6h-6z"></path>
            <path d="M36 30h6v6h-6z"></path>
            <path d="M36 36h6v6h-6zm6-12h6v6h-6z"></path>
          </g>
          <path d="M48 24h6v6h-6z" fill="#ff5757"></path>
          <g fill="red">
            <path d="M36 18h6v6h-6z"></path>
            <path d="M42 18h6v6h-6z"></path>
          </g>
          <g fill="#ff5757">
            <path d="M48 18h6v6h-6z"></path>
            <path d="M48 12h6v6h-6z"></path>
            <path d="M42 12h6v6h-6z"></path>
            <path d="M36 12h6v6h-6z"></path>
          </g></svg
      ></span>
      by
      <a
        href="https://vecho.me"
        target="_blank"
        class="mx-2 underline text-blue-600 underline-offset-4"
      >
        ohVecho
      </a></span
    >
  </footer>`,
  styles: ``,
})
export class FooterComponent {}
