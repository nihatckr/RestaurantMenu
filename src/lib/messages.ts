import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";

// UI chrome message catalog (I18N.md "static UI chrome"). Product/category text
// comes from the database (translations.ts); THIS is for the app's own static
// strings — footer, error/empty/404 states, metadata. Keyed by locale so the
// whole page renders in one language, matching the switcher.
type Messages = {
  footerNotice: string; // legal price-label notice (Law 6502 — see COMPLIANCE.md)
  emptyMenu: string;
  notFoundBody: string;
  backToMenu: string;
  errorTitle: string;
  errorBody: string;
  retry: string;
  scrollTop: string; // "back to top" button label
  metaMenuSuffix: string; // appended to venue name in <title>
  venueMenuDescription: (name: string) => string;
};

const MESSAGES: Record<Locale, Messages> = {
  tr: {
    footerNotice: "Tüm fiyatlarımıza KDV dâhildir · Servis ücreti alınmaz",
    emptyMenu: "Bu mekân için menü bulunamadı.",
    notFoundBody: "Sayfa bulunamadı.",
    backToMenu: "Menüye dön",
    errorTitle: "Bir şeyler ters gitti",
    errorBody: "Menü yüklenirken bir sorun oluştu.",
    retry: "Tekrar dene",
    scrollTop: "Yukarı çık",
    metaMenuSuffix: "Menü",
    venueMenuDescription: (name) => `${name} menüsü.`,
  },
  en: {
    footerNotice: "All prices include VAT · No service charge",
    emptyMenu: "No menu found for this venue.",
    notFoundBody: "Page not found.",
    backToMenu: "Back to menu",
    errorTitle: "Something went wrong",
    errorBody: "There was a problem loading the menu.",
    retry: "Try again",
    scrollTop: "Back to top",
    metaMenuSuffix: "Menu",
    venueMenuDescription: (name) => `${name} menu.`,
  },
  ru: {
    footerNotice: "Все цены включают НДС · Обслуживание не взимается",
    emptyMenu: "Меню для этого заведения не найдено.",
    notFoundBody: "Страница не найдена.",
    backToMenu: "Вернуться в меню",
    errorTitle: "Что-то пошло не так",
    errorBody: "При загрузке меню произошла ошибка.",
    retry: "Повторить",
    scrollTop: "Наверх",
    metaMenuSuffix: "Меню",
    venueMenuDescription: (name) => `Меню ${name}.`,
  },
};

/** UI messages for a locale, falling back to the default when unsupported. */
export function getMessages(locale: string): Messages {
  return MESSAGES[isLocale(locale) ? locale : DEFAULT_LOCALE];
}
