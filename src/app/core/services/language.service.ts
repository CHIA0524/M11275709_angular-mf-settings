import { Injectable, signal } from '@angular/core';

export type SupportedLanguage = 'zh-TW' | 'en-US' | 'ja-JP';
export type TranslationKey = string;

interface LanguageChangedDetail {
  sourceId: string;
  language: SupportedLanguage;
}

const translations: Record<SupportedLanguage, Record<string, string>> = {
  'zh-TW': {
    '個人設定': '個人設定',
    '自訂您的應用程式偏好': '自訂您的應用程式偏好',
    '深色模式': '深色模式',
    '啟用深色背景以減輕眼睛疲勞': '啟用深色背景以減輕眼睛疲勞',
    '預設貨幣': '預設貨幣',
    '設定記帳預設使用的貨幣單位': '設定記帳預設使用的貨幣單位',
    '選擇貨幣': '選擇貨幣',
    '新台幣': '新台幣',
    '美金': '美金',
    '歐元': '歐元',
    '日圓': '日圓',
    '韓元': '韓元',
    '人民幣': '人民幣',
    '港幣': '港幣',
    '澳幣': '澳幣',
    '英鎊': '英鎊'
  },
  'en-US': {
    '個人設定': 'Preferences',
    '自訂您的應用程式偏好': 'Customize your application preferences',
    '深色模式': 'Dark mode',
    '啟用深色背景以減輕眼睛疲勞': 'Enable a dark background to reduce eye strain',
    '預設貨幣': 'Default currency',
    '設定記帳預設使用的貨幣單位': 'Choose the default currency used by bookkeeping',
    '選擇貨幣': 'Choose currency',
    '新台幣': 'New Taiwan dollar',
    '美金': 'US dollar',
    '歐元': 'Euro',
    '日圓': 'Japanese yen',
    '韓元': 'Korean won',
    '人民幣': 'Chinese yuan',
    '港幣': 'Hong Kong dollar',
    '澳幣': 'Australian dollar',
    '英鎊': 'British pound'
  },
  'ja-JP': {
    '個人設定': '個人設定',
    '自訂您的應用程式偏好': 'アプリケーション設定をカスタマイズします',
    '深色模式': 'ダークモード',
    '啟用深色背景以減輕眼睛疲勞': '目の負担を減らすためダーク背景を有効化します',
    '預設貨幣': '既定通貨',
    '設定記帳預設使用的貨幣單位': '記帳で使う既定通貨を設定します',
    '選擇貨幣': '通貨を選択',
    '新台幣': '台湾ドル',
    '美金': '米ドル',
    '歐元': 'ユーロ',
    '日圓': '日本円',
    '韓元': '韓国ウォン',
    '人民幣': '人民元',
    '港幣': '香港ドル',
    '澳幣': '豪ドル',
    '英鎊': '英ポンド'
  }
};

const storageKey = 'workspace.language';
const languageChangedEvent = 'microfrontends:language-changed';

const isSupportedLanguage = (value: string | null | undefined): value is SupportedLanguage =>
  value === 'zh-TW' || value === 'en-US' || value === 'ja-JP';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly currentLanguage = signal<SupportedLanguage>(this.resolveInitialLanguage());
  private readonly sourceId = Math.random().toString(36).slice(2);

  constructor() {
    this.applyLanguage(this.currentLanguage(), false);

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
      window.addEventListener(languageChangedEvent, this.handleLanguageChanged as EventListener);
    }
  }

  translate(key: TranslationKey): string {
    return translations[this.currentLanguage()][key] ?? translations['zh-TW'][key] ?? key;
  }

  private resolveInitialLanguage(): SupportedLanguage {
    if (typeof localStorage !== 'undefined') {
      const storedLanguage = localStorage.getItem(storageKey);
      if (isSupportedLanguage(storedLanguage)) {
        return storedLanguage;
      }
    }

    return 'zh-TW';
  }

  private applyLanguage(language: SupportedLanguage, shouldBroadcast: boolean): void {
    this.currentLanguage.set(language);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, language);
    }

    if (shouldBroadcast && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<LanguageChangedDetail>(languageChangedEvent, {
          detail: {
            sourceId: this.sourceId,
            language
          }
        })
      );
    }
  }

  private handleStorageChange = (event: StorageEvent): void => {
    if (event.key !== storageKey || !isSupportedLanguage(event.newValue)) {
      return;
    }

    this.applyLanguage(event.newValue, false);
  };

  private handleLanguageChanged = (event: Event): void => {
    const customEvent = event as CustomEvent<LanguageChangedDetail>;

    if (!customEvent.detail || customEvent.detail.sourceId === this.sourceId) {
      return;
    }

    this.applyLanguage(customEvent.detail.language, false);
  };
}