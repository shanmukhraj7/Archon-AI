import { useState } from "react";
import { useToast } from "../context/ToastContext";

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-b border-outline-variant last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-body-sm text-primary font-medium">{label}</p>
        {desc && <p className="font-body-sm text-on-surface-variant text-[13px] mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${checked ? "bg-primary" : "bg-outline-variant"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform duration-200 ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { showMessage } = useToast();

  const [settings, setSettings] = useState({
    depth: "deep",
    maxSources: "12",
    outputFormat: "markdown",
    streamingUpdates: true,
    autoSave: true,
    compactMode: false,
    emailNotifications: false,
    apiKey: "sk-•••••••••••••••••••••••••••••••••••••••••••••••••",
  });

  const set = (key, val) => setSettings((s) => ({ ...s, [key]: val }));

  const handleSave = () => {
    showMessage("Settings saved successfully.");
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 border-b border-outline-variant pb-8">
        <div className="flex gap-2 mb-4">
          <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
            CONFIGURATION
          </span>
        </div>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold text-primary tracking-tighter mb-2">
          Settings
        </h1>
        <p className="font-body-sm text-on-surface-variant">Configure research parameters, interface, and integrations.</p>
      </div>

      {/* Research Configuration */}
      <section className="mb-10">
        <h2 className="font-label-caps text-[10px] text-outline tracking-widest mb-4">RESEARCH CONFIGURATION</h2>
        <div className="architectural-card rounded px-6">
          <SettingRow label="Research Depth" desc="Controls how many sub-questions the agent expands into.">
            <select
              value={settings.depth}
              onChange={(e) => set("depth", e.target.value)}
              className="bg-[#0D0D0D] border border-[#333333] text-primary rounded py-2 px-4 focus:outline-none focus:border-primary font-label-caps text-[12px] cursor-pointer"
            >
              <option value="shallow">SHALLOW</option>
              <option value="balanced">BALANCED</option>
              <option value="deep">DEEP</option>
              <option value="exhaustive">EXHAUSTIVE</option>
            </select>
          </SettingRow>

          <SettingRow label="Max Sources" desc="Maximum number of sources per research report.">
            <select
              value={settings.maxSources}
              onChange={(e) => set("maxSources", e.target.value)}
              className="bg-[#0D0D0D] border border-[#333333] text-primary rounded py-2 px-4 focus:outline-none focus:border-primary font-label-caps text-[12px] cursor-pointer"
            >
              {["6", "12", "24", "48"].map((n) => (
                <option key={n} value={n}>{n} SOURCES</option>
              ))}
            </select>
          </SettingRow>

          <SettingRow label="Default Output Format" desc="Format for downloaded and exported reports.">
            <select
              value={settings.outputFormat}
              onChange={(e) => set("outputFormat", e.target.value)}
              className="bg-[#0D0D0D] border border-[#333333] text-primary rounded py-2 px-4 focus:outline-none focus:border-primary font-label-caps text-[12px] cursor-pointer"
            >
              <option value="markdown">MARKDOWN</option>
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
            </select>
          </SettingRow>

          <SettingRow label="Streaming Updates" desc="Show real-time agent steps while research runs.">
            <Toggle checked={settings.streamingUpdates} onChange={(v) => set("streamingUpdates", v)} />
          </SettingRow>

          <SettingRow label="Auto-Save Reports" desc="Automatically save completed reports to history.">
            <Toggle checked={settings.autoSave} onChange={(v) => set("autoSave", v)} />
          </SettingRow>
        </div>
      </section>

      {/* Interface */}
      <section className="mb-10">
        <h2 className="font-label-caps text-[10px] text-outline tracking-widest mb-4">INTERFACE</h2>
        <div className="architectural-card rounded px-6">
          <SettingRow label="Compact Mode" desc="Reduces padding and font sizes for denser layouts.">
            <Toggle checked={settings.compactMode} onChange={(v) => set("compactMode", v)} />
          </SettingRow>
          <SettingRow label="Email Notifications" desc="Receive an email when a long-running report completes.">
            <Toggle checked={settings.emailNotifications} onChange={(v) => set("emailNotifications", v)} />
          </SettingRow>
        </div>
      </section>

      {/* API */}
      <section className="mb-10">
        <h2 className="font-label-caps text-[10px] text-outline tracking-widest mb-4">API CONFIGURATION</h2>
        <div className="architectural-card rounded px-6">
          <SettingRow label="API Key" desc="Your Archon API key. Keep this secret.">
            <div className="flex items-center gap-2">
              <code className="font-label-caps text-[11px] text-on-surface-variant bg-surface-container-highest border border-outline-variant px-3 py-2 rounded max-w-[180px] truncate block">
                {settings.apiKey}
              </code>
              <button
                onClick={() => showMessage("Key regeneration coming soon.")}
                className="text-on-surface-variant hover:text-primary transition-colors p-1"
                aria-label="Regenerate key"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>
          </SettingRow>
          <SettingRow label="API Version" desc="Current backend agent version.">
            <span className="font-label-caps text-[12px] text-primary border border-outline-variant px-3 py-2 rounded">
              V2.0.4 CORE
            </span>
          </SettingRow>
        </div>
      </section>

      {/* Danger zone */}
      <section className="mb-10">
        <h2 className="font-label-caps text-[10px] text-error tracking-widest mb-4">DANGER ZONE</h2>
        <div className="border border-error/30 rounded px-6 bg-[#1A0505]">
          <SettingRow label="Clear All History" desc="Permanently delete all research history and reports. This cannot be undone.">
            <button
              onClick={() => showMessage("This action requires confirmation — feature coming soon.")}
              className="border border-error text-error font-label-caps text-[11px] py-2 px-4 rounded hover:bg-error/10 transition-colors"
            >
              CLEAR ALL
            </button>
          </SettingRow>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleSave}
          className="bg-primary text-background font-label-caps py-3 px-8 rounded hover:opacity-90 transition-opacity"
        >
          SAVE SETTINGS
        </button>
      </div>
    </div>
  );
}
