import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SettingsSearchService } from '../settings-search.service';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss'
})
export class NotificationSettingsComponent {
  private readonly settingsSearchService = inject(SettingsSearchService);

  readonly previewEnabled = signal(true);
  readonly channel = signal('email');
  readonly frequency = signal('weekly');
  readonly threshold = signal('85%');
  readonly digestPreview = computed(() => this.previewEnabled() ? `${this.channel()} / ${this.frequency()}` : '已停用');

  readonly matchedEntries = this.settingsSearchService.search('notification');
}