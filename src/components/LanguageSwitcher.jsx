import i18n from "../i18n";

export default function LanguageSwitcher() {
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);

    localStorage.setItem("language", lng);
  };

  return (
    <div className="flex items-center gap-2">
      🌐
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent outline-none text-sm font-medium cursor-pointer"
      >
        <option value="en">English</option>
        <option value="am">አማርኛ</option>
      </select>
    </div>
  );
}
