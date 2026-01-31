import { useUserStore } from '@/store/userStore';
import { translations, TranslationKey } from './translations';

export const useTranslation = () => {
  const language = useUserStore((state) => state.language);
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };
  
  const tNested = (path: string): string => {
    const keys = path.split('.');
    let value: any = translations[language];
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value || path;
  };
  
  return { t, tNested, language };
};
