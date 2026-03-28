import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavItem {
  path: string;
  exact: boolean;
  label: string;
  sublabel: string;
  accent: string;
  activeCls: string;
  dotCls: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    exact: true,
    label: 'PET Scan',
    sublabel: 'LOR · 511 keV',
    accent: 'cyan',
    activeCls: 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300',
    dotCls: 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]',
  },
  {
    path: '/blindaje',
    exact: false,
    label: 'Blindaje',
    sublabel: 'Beer-Lambert',
    accent: 'amber',
    activeCls: 'border-amber-500/60 bg-amber-950/30 text-amber-300',
    dotCls: 'bg-amber-400 shadow-[0_0_6px_rgba(251,146,60,0.8)]',
  },
  {
    path: '/decay',
    exact: false,
    label: 'Decaimiento',
    sublabel: 'A(t) = A₀·e^(−λt)',
    accent: 'violet',
    activeCls: 'border-violet-500/60 bg-violet-950/30 text-violet-300',
    dotCls: 'bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]',
  },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-950 font-mono flex flex-col">

      <!-- Top navigation bar -->
      <nav class="border-b border-slate-800/60 bg-slate-950/95 backdrop-blur-sm
                  px-4 py-2 flex items-center gap-4 shrink-0 z-20">

        <!-- Branding -->
        <div class="flex items-center gap-2 pr-4 border-r border-slate-800">
          <span class="text-[18px] leading-none">&#9763;</span>
          <div class="flex flex-col">
            <span class="text-slate-200 text-xs font-semibold tracking-widest uppercase leading-none">
              Nuclear Sim
            </span>
            <span class="text-slate-600 text-[9px] tracking-wide leading-tight">
              Monte Carlo · v1.0
            </span>
          </div>
        </div>

        <!-- Nav links -->
        <div class="flex items-center gap-2">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive
              #rla="routerLinkActive"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              [class]="'flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono ' +
                       'transition-all duration-150 cursor-pointer select-none ' +
                       (rla.isActive
                         ? item.activeCls
                         : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700/50')"
            >
              <span [class]="'w-1.5 h-1.5 rounded-full shrink-0 transition-all ' +
                             (rla.isActive ? item.dotCls : 'bg-slate-700')"></span>
              <span class="font-semibold tracking-wider">{{ item.label }}</span>
              <span class="text-[9px] tracking-wide opacity-60 hidden sm:inline">{{ item.sublabel }}</span>
            </a>
          }
        </div>

        <!-- Right side status -->
        <div class="ml-auto flex items-center gap-3 text-[10px] text-slate-600 tracking-wide">
          <span class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            nuclear-api:8000
          </span>
          <span class="text-slate-700">|</span>
          <span>Angular {{ angularVersion }} · NgRx 21</span>
        </div>
      </nav>

      <!-- Routed content fills remaining height -->
      <div class="flex flex-col flex-1 overflow-hidden">
        <router-outlet />
      </div>
    </div>
  `,
})
export class ShellComponent {
  readonly navItems = NAV_ITEMS;
  readonly angularVersion = '21';
}
