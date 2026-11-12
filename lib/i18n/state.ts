// Current UI language for non-React code (formatters, domain helpers). Kept in
// sync by LocaleProvider during render, so pure functions read the same
// language the components are rendering in.
export type Lang = "vi" | "en";

let current: Lang = "vi";

export const getLang = (): Lang => current;
export const setCurrentLang = (lang: Lang) => {
  current = lang;
};
export const dateLocale = (lang: Lang = current) => (lang === "en" ? "en-US" : "vi-VN");
