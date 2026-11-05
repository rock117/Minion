import type { ReactNode } from "react";
import { useSettings, type Theme } from "../settings";
import type { Locale } from "../i18n";
import { useT } from "../i18n";
import { Monitor, Moon, Sun, X, Languages } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: Props) {
  const { theme, locale, setTheme, setLocale } = useSettings();
  const t = useT();

  const themes: { value: Theme; label: string; icon: ReactNode }[] = [
    { value: "dark", label: t("settings.themeDark"), icon: <Moon size={14} /> },
    { value: "light", label: t("settings.themeLight"), icon: <Sun size={14} /> },
    {
      value: "system",
      label: t("settings.themeSystem"),
      icon: <Monitor size={14} />,
    },
  ];

  const locales: { value: Locale; label: string }[] = [
    { value: "zh", label: t("settings.langZh") },
    { value: "en", label: t("settings.langEn") },
  ];

  return (
    <div className="dlg-mask" onClick={onClose}>
      <div className="dlg settings-dlg" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-head">
          <div className="dlg-title">{t("settings.title")}</div>
          <button className="pv-close" onClick={onClose} title="ESC">
            <X size={16} />
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-label">{t("settings.appearance")}</div>
          <div className="settings-row">
            <span className="settings-row-label">{t("settings.theme")}</span>
            <div className="segmented">
              {themes.map((th) => (
                <button
                  key={th.value}
                  className={theme === th.value ? "active" : ""}
                  onClick={() => setTheme(th.value)}
                >
                  {th.icon}
                  {th.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-label">
            <Languages size={13} /> {t("settings.language")}
          </div>
          <div className="settings-row">
            <div className="segmented">
              {locales.map((l) => (
                <button
                  key={l.value}
                  className={locale === l.value ? "active" : ""}
                  onClick={() => setLocale(l.value)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
