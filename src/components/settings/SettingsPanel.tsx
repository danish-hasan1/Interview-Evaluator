'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Save, Key, Sliders, Zap, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MODEL_GROUPS = [
  {
    label: '✦ Google Gemini  —  Recommended (1M token free tier)',
    models: [
      { value: 'gemini-2.0-flash',        label: 'Gemini 2.0 Flash',        badge: 'Recommended', badgeVariant: 'success' as const },
      { value: 'gemini-1.5-flash',        label: 'Gemini 1.5 Flash',        badge: 'Stable',      badgeVariant: 'info'    as const },
      { value: 'gemini-1.5-flash-8b',     label: 'Gemini 1.5 Flash 8B',     badge: 'Fastest',     badgeVariant: 'teal'    as const },
    ],
  },
  {
    label: '⚡ Groq  —  Fast (12K–30K token/min free tier)',
    models: [
      { value: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B Instant',    badge: '30K TPM',  badgeVariant: 'success' as const },
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', badge: '12K TPM',  badgeVariant: 'warning' as const },
      { value: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B',            badge: '5K TPM',   badgeVariant: 'warning' as const },
    ],
  },
  {
    label: '🔀 OpenRouter  —  Free models, separate rate limits',
    models: [
      { value: 'meta-llama/llama-3.1-8b-instruct:free',  label: 'Llama 3.1 8B (free)',  badge: 'Free', badgeVariant: 'success' as const },
      { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (free)', badge: 'Free', badgeVariant: 'success' as const },
      { value: 'mistralai/mistral-7b-instruct:free',     label: 'Mistral 7B (free)',     badge: 'Free', badgeVariant: 'success' as const },
      { value: 'google/gemma-2-9b-it:free',              label: 'Gemma 2 9B (free)',     badge: 'Free', badgeVariant: 'teal'    as const },
    ],
  },
  {
    label: '🟠 Mistral AI  —  Free tier available',
    models: [
      { value: 'open-mistral-nemo',    label: 'Mistral Nemo',  badge: 'Free tier', badgeVariant: 'success' as const },
      { value: 'mistral-small-latest', label: 'Mistral Small', badge: 'Fast',      badgeVariant: 'info'    as const },
    ],
  },
];

function ApiKeyInput({
  id, label, placeholder, value, link, linkLabel,
  onChange,
}: {
  id: string; label: string; placeholder: string; value: string; link: string; linkLabel: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Get your free key at{' '}
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {linkLabel}
        </a>
        . Stored locally in your browser only.
      </p>
    </div>
  );
}

export function SettingsPanel() {
  const settings       = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [saved, setSaved]               = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...settings });

  const set = (patch: Partial<typeof localSettings>) =>
    setLocalSettings((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-base">API Keys</CardTitle>
              <CardDescription>Add as many keys as you have — unused ones become automatic fallbacks</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <ApiKeyInput
            id="geminiKey"
            label="Google Gemini API Key  (Recommended — 1M token free tier)"
            placeholder="AIza..."
            value={localSettings.geminiApiKey}
            link="https://aistudio.google.com/app/apikey"
            linkLabel="aistudio.google.com"
            onChange={(v) => set({ geminiApiKey: v })}
          />
          <div className="border-t border-border" />
          <div className="border-t border-border" />
          <ApiKeyInput
            id="groqKey"
            label="Groq  (fast, 12K–30K token/min free tier)"
            placeholder="gsk_..."
            value={localSettings.groqApiKey}
            link="https://console.groq.com"
            linkLabel="console.groq.com"
            onChange={(v) => set({ groqApiKey: v })}
          />
          <div className="border-t border-border" />
          <ApiKeyInput
            id="openrouterKey"
            label="OpenRouter  (free models, independent rate limits)"
            placeholder="sk-or-..."
            value={localSettings.openrouterApiKey}
            link="https://openrouter.ai/keys"
            linkLabel="openrouter.ai"
            onChange={(v) => set({ openrouterApiKey: v })}
          />
          <div className="border-t border-border" />
          <ApiKeyInput
            id="mistralKey"
            label="Mistral AI  (free tier available)"
            placeholder="..."
            value={localSettings.mistralApiKey}
            link="https://console.mistral.ai/api-keys"
            linkLabel="console.mistral.ai"
            onChange={(v) => set({ mistralApiKey: v })}
          />
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            <strong>Automatic fallback:</strong> If your primary provider hits a rate limit, the app silently tries the next configured provider — Groq → OpenRouter → Mistral → Gemini. Add all keys you have for maximum reliability.
          </div>
        </CardContent>
      </Card>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <CardTitle className="text-base">Model</CardTitle>
              <CardDescription>Choose which AI model to use for analysis</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Select value={localSettings.model} onValueChange={(v) => set({ model: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_GROUPS.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground py-2">
                      {group.label}
                    </SelectLabel>
                    {group.models.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex items-center gap-2">
                          <span>{m.label}</span>
                          <Badge variant={m.badgeVariant} className="text-[10px] px-1.5 py-0">
                            {m.badge}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Gemini has no practical token limit. Groq free tier is 12–30K tokens/min. OpenRouter &amp; Mistral free tiers have independent limits.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm font-mono text-primary">{localSettings.temperature.toFixed(1)}</span>
            </div>
            <Slider
              min={0} max={1} step={0.1}
              value={[localSettings.temperature]}
              onValueChange={([value]) => set({ temperature: value })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise (0.0)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-base">About</CardTitle>
              <CardDescription>Interview Intelligence v1.0</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>AI-powered interview transcript analysis. Supports Candidate, Interviewer, TA Summary, and Multi-transcript Audit modes.</p>
          <p>All data stays in your browser. Transcripts are only sent to the selected AI provider for analysis.</p>
        </CardContent>
      </Card>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button onClick={handleSave} size="lg" variant="gradient" className="w-full gap-2">
          {saved
            ? <><CheckCircle className="w-4 h-4" /> Settings Saved!</>
            : <><Save className="w-4 h-4" /> Save Settings</>}
        </Button>
      </motion.div>
    </motion.div>
  );
}
