import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
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
  imports: [ReactiveFormsModule, RouterModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss'
})
export class NotificationSettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly settingsSearchService = inject(SettingsSearchService);

  readonly previewEnabled = signal(true);
  readonly digestPreview = computed(() => this.previewEnabled() ? `${this.form.value.channel} / ${this.form.value.frequency}` : '已停用');

  readonly form = this.formBuilder.group({
    channel: ['email'],
    frequency: ['weekly'],
    threshold: ['85%']
  });

  readonly matchedEntries = this.settingsSearchService.search('notification');
}