import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { startWith } from 'rxjs';
import { ColorPreset, SettingsService } from '../../../core/services/settings.service';
import { SettingsSearchService } from '../settings-search.service';

type PaletteFieldKey = 'background' | 'surface' | 'toolbar' | 'sidebar' | 'accent' | 'textPrimary';

@Component({
  selector: 'app-settings-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  templateUrl: './settings-workspace.component.html',
  styleUrl: './settings-workspace.component.scss'
})
export class SettingsWorkspaceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('monacoHost') private monacoHost?: ElementRef<HTMLDivElement>;

  private readonly formBuilder = inject(FormBuilder);
  private readonly settingsSearchService = inject(SettingsSearchService);
  private readonly settingsService = inject(SettingsService);
  private editor: import('monaco-editor').editor.IStandaloneCodeEditor | null = null;

  readonly searchQuery = signal('');
  readonly searchResults = computed(() => this.settingsSearchService.search(this.searchQuery()));
  readonly validationMessage = signal('尚未驗證');
  readonly editorMessage = signal('Monaco 編輯器準備中');
  readonly editorValidationMessage = signal('尚未驗證 JSON 編輯器內容');
  readonly colorPresets = this.settingsService.getColorPresets();
  readonly activePreset = signal(this.settingsService.settings().workspacePreferences.appearancePreset);
  readonly palettePreview = signal(this.settingsService.settings().workspacePreferences.palette);
  readonly editorDraft = signal('');
  readonly paletteFields: Array<{ key: PaletteFieldKey; label: string; description: string }> = [
    { key: 'background', label: '頁面背景', description: '控制主要內容區的大面積底色。' },
    { key: 'surface', label: '卡片表面', description: '控制卡片與面板的底色層級。' },
    { key: 'toolbar', label: '頂部工具列', description: '控制 app toolbar 與標題列主色。' },
    { key: 'sidebar', label: '側欄背景', description: '控制導覽列與 footer 色調。' },
    { key: 'accent', label: '強調色', description: '控制啟用態、按鈕與標記重點色。' },
    { key: 'textPrimary', label: '主要文字', description: '控制版面主要文字與對比。' }
  ];

  readonly workspaceForm = this.formBuilder.nonNullable.group({
    emailDigest: true,
    weeklyReviewDay: 'Friday',
    defaultLandingPage: 'dashboard',
    compactMode: false,
    appearancePreset: 'ocean-balance',
    palette: this.formBuilder.nonNullable.group({
      background: '#F4F7FB',
      surface: '#FFFFFF',
      toolbar: '#2F5D7C',
      sidebar: '#17324D',
      accent: '#4C9F70',
      textPrimary: '#16202A'
    })
  });
  readonly paletteForm = this.workspaceForm.controls.palette;

  constructor() {
    const workspacePreferences = this.settingsService.settings().workspacePreferences;

    this.workspaceForm.patchValue(workspacePreferences, { emitEvent: false });
    this.activePreset.set(workspacePreferences.appearancePreset);
    this.palettePreview.set(this.workspaceForm.controls.palette.getRawValue());
    this.editorDraft.set(this.stringifySettingsPayload());

    this.workspaceForm.controls.palette.valueChanges
      .pipe(startWith(this.workspaceForm.controls.palette.getRawValue()), takeUntilDestroyed())
      .subscribe(palette => {
        this.palettePreview.set({
          background: palette.background ?? '#F4F7FB',
          surface: palette.surface ?? '#FFFFFF',
          toolbar: palette.toolbar ?? '#2F5D7C',
          sidebar: palette.sidebar ?? '#17324D',
          accent: palette.accent ?? '#4C9F70',
          textPrimary: palette.textPrimary ?? '#16202A'
        });
      });
  }

  async ngAfterViewInit(): Promise<void> {
    const host = this.monacoHost?.nativeElement;

    if (!host) {
      this.editorMessage.set('找不到 Monaco 掛載區域');
      return;
    }

    const loader = (await import('@monaco-editor/loader')).default;
    const monaco = await loader.init();
    const editor = monaco.editor.create(host, {
      value: this.editorDraft(),
      language: 'json',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      fontSize: 13
    });
    this.editor = editor;
    editor.onDidChangeModelContent(() => {
      this.editorDraft.set(editor.getValue());
    });
    this.editorMessage.set('Monaco 編輯器已載入，可直接編輯工作台 JSON');
  }

  ngOnDestroy(): void {
    this.editor?.dispose();
  }

  applyPreset(preset: ColorPreset): void {
    this.workspaceForm.patchValue({
      appearancePreset: preset.id,
      palette: preset.palette
    });
    this.activePreset.set(preset.id);
    this.persistWorkspaceSettings();
    this.syncEditorFromForm();
    this.validationMessage.set(`已套用 ${preset.label}`);
  }

  applyCustomPalette(): void {
    this.activePreset.set('custom');
    this.workspaceForm.patchValue({ appearancePreset: 'custom' });
    this.persistWorkspaceSettings();
    this.syncEditorFromForm();
    this.validationMessage.set('已套用自訂配色');
  }

  validateConfig(): void {
    try {
      this.settingsSearchService.validateWorkspaceConfig(this.workspaceForm.getRawValue());
      this.validationMessage.set('設定格式有效');
    } catch (error) {
      this.validationMessage.set(error instanceof Error ? error.message : '設定格式無效');
    }
  }

  syncEditorFromForm(): void {
    const json = this.stringifySettingsPayload();
    this.editorDraft.set(json);
    this.editor?.setValue(json);
    this.editorValidationMessage.set('已同步目前整份設定到編輯器');
  }

  validateEditorConfig(): void {
    try {
      const payload = JSON.parse(this.editor?.getValue() ?? this.editorDraft());
      this.settingsSearchService.validateUserSettings(payload);
      this.editorValidationMessage.set('整份設定 JSON 格式有效');
    } catch (error) {
      this.editorValidationMessage.set(error instanceof Error ? error.message : '編輯器 JSON 無效');
    }
  }

  applyEditorConfig(): void {
    try {
      const payload = JSON.parse(this.editor?.getValue() ?? this.editorDraft());
      const parsed = this.settingsSearchService.validateUserSettings(payload);
      this.settingsService.updateSettings(parsed);
      this.workspaceForm.patchValue(parsed.workspacePreferences);
      this.activePreset.set(parsed.workspacePreferences.appearancePreset);
      this.palettePreview.set(parsed.workspacePreferences.palette);
      this.syncEditorFromForm();
      this.editorValidationMessage.set('已從編輯器套用整份設定');
    } catch (error) {
      this.editorValidationMessage.set(error instanceof Error ? error.message : '無法套用編輯器設定');
    }
  }

  previewStyle(): Record<string, string> {
    const palette = this.palettePreview();
    return {
      '--preview-background': palette.background,
      '--preview-surface': palette.surface,
      '--preview-toolbar': palette.toolbar,
      '--preview-sidebar': palette.sidebar,
      '--preview-accent': palette.accent,
      '--preview-text': palette.textPrimary
    };
  }

  private persistWorkspaceSettings(): void {
    this.settingsService.updateWorkspacePreferences(this.workspaceForm.getRawValue());
  }

  private stringifySettingsPayload(): string {
    return JSON.stringify({
      ...this.settingsService.settings(),
      workspacePreferences: this.workspaceForm.getRawValue()
    }, null, 2);
  }
}