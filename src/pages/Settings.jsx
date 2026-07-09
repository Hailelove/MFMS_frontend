import {
  User,
  Shield,
  Palette,
  Building2,
  Bell,
  Database,
  Info,
} from "lucide-react";

const sections = [
  {
    title: "Profile",
    icon: User,
    items: [
      "Full Name",
      "Email",
      "Phone Number",
      "Position",
      "Profile Picture",
    ],
  },
  {
    title: "Security",
    icon: Shield,
    items: ["Change Password", "Two-Factor Authentication", "Login Sessions"],
  },
  {
    title: "Preferences",
    icon: Palette,
    items: ["Theme", "Language", "Time Zone", "Date Format"],
  },
  {
    title: "Organization",
    icon: Building2,
    items: [
      "Organization Name",
      "Start Date",
      "Fiscal Year",
      "Currency",
      "Address",
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    items: [
      "Email Notifications",
      "SMS Notifications",
      "Browser Notifications",
    ],
  },
  {
    title: "System",
    icon: Database,
    items: ["Backup Database", "Restore Backup", "Export Data"],
  },
  {
    title: "About",
    icon: Info,
    items: ["Application Version", "License", "Support"],
  },
];

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-500">
          Manage your account and system preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <div
              key={section.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                  <Icon size={20} />
                </div>

                <h2 className="text-lg font-semibold">{section.title}</h2>
              </div>

              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="cursor-pointer rounded-lg px-3 py-2 transition hover:bg-slate-100"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
