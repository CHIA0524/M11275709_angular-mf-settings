import { Injectable } from '@angular/core';
import Fuse from 'fuse.js';
import { z } from 'zod';

export interface SettingCatalogItem {
  id: string;
  title: string;
  section: string;
  keywords: string[];
  description: string;
}

const workspaceSchema = z.object({
  emailDigest: z.boolean(),
  weeklyReviewDay: z.string().min(1),
  defaultLandingPage: z.string().min(1),
  compactMode: z.boolean(),
  appearancePreset: z.string().min(1),
  palette: z.object({
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    toolbar: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    sidebar: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    textPrimary: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
  })
});

const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']),
  defaultCurrency: z.enum(['TWD', 'USD', 'EUR', 'JPY', 'KRW', 'CNY', 'HKD', 'AUD', 'GBP']),
  notificationsEnabled: z.boolean(),
  workspacePreferences: workspaceSchema
});

@Injectable({ providedIn: 'root' })
export class SettingsSearchService {
  private readonly catalog: SettingCatalogItem[] = [
    { id: 'theme', title: '深色模式', section: 'appearance', keywords: ['dark', 'theme', 'ui'], description: '切換介面主題與可視偏好。' },
    { id: 'palette', title: '配色預設', section: 'appearance', keywords: ['color', 'preset', 'palette', 'toolbar', 'sidebar'], description: '套用預設顏色組或自訂各部位顏色。' },
    { id: 'currency', title: '預設貨幣', section: 'currency', keywords: ['money', 'currency', 'default'], description: '調整系統預設幣別。' },
    { id: 'notifications', title: '通知規則', section: 'notifications', keywords: ['alert', 'digest', 'email'], description: '管理提醒與通知頻率。' },
    { id: 'workspace', title: '工作台偏好', section: 'workspace', keywords: ['landing', 'compact', 'layout'], description: '設定預設首頁與檢視密度。' }
  ];

  search(query: string): SettingCatalogItem[] {
    if (!query.trim()) {
      return this.catalog;
    }

    const fuse = new Fuse(this.catalog, { keys: ['title', 'section', 'keywords', 'description'], threshold: 0.35 });
    return fuse.search(query).map(result => result.item);
  }

  validateWorkspaceConfig(payload: unknown) {
    return workspaceSchema.parse(payload);
  }

  validateUserSettings(payload: unknown) {
    return userSettingsSchema.parse(payload);
  }
}