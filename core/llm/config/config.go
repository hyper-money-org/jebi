package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
)

// Config holds LLM provider settings, persisted in settings.json.
type Config struct {
	Provider    string `json:"provider"`    // "ollama" | "llama-server" | "mimo"
	Model       string `json:"model"`       // ollama: model name; llama-server: full .gguf path; mimo: model ID
	EndpointURL string `json:"endpointURL"` // ollama default: "http://localhost:11434"; mimo default: "https://api.xiaomi.com/v1"
	Enabled     bool   `json:"enabled"`
	APIKey      string `json:"apiKey,omitempty"` // mimo: Xiaomi API key
}

// defaultModelsDir returns the platform-specific directory where jebi looks for
// local model files.
//
//   - macOS:       ~/Library/Application Support/jebi/models
//   - Linux/other: ~/.local/share/jebi/models
func defaultModelsDir() string {
	home, _ := os.UserHomeDir()
	if runtime.GOOS == "darwin" {
		return filepath.Join(home, "Library", "Application Support", "jebi", "models")
	}
	return filepath.Join(home, ".local", "share", "jebi", "models")
}

var Default = Config{
	Provider:    "llama-server",
	Model:       "",
	EndpointURL: "http://localhost:11434",
	Enabled:     true,
}

// SettingsPath returns ~/.config/jebi/settings.json.
func SettingsPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "jebi", "settings.json")
}

type settings struct {
	LLM *Config `json:"llm,omitempty"`
}

// Load reads the llm block from settings.json. Falls back to Default if the
// file is missing or the llm block is absent.
func Load() Config {
	data, err := os.ReadFile(SettingsPath())
	if err != nil {
		return Default
	}
	var s settings
	if err := json.Unmarshal(data, &s); err != nil || s.LLM == nil {
		return Default
	}
	cfg := *s.LLM
	if cfg.Provider == "" {
		cfg.Provider = Default.Provider
	}
	if cfg.Model == "" {
		cfg.Model = Default.Model
	}
	if cfg.EndpointURL == "" {
		cfg.EndpointURL = Default.EndpointURL
	}
	// Fallback: API key from environment variable
	if cfg.APIKey == "" {
		cfg.APIKey = os.Getenv("MIMO_API_KEY")
	}
	return cfg
}

// Save writes the llm block back to settings.json, preserving other top-level keys.
func Save(cfg Config) error {
	path := SettingsPath()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}

	var raw map[string]json.RawMessage
	if data, err := os.ReadFile(path); err == nil {
		_ = json.Unmarshal(data, &raw)
	}
	if raw == nil {
		raw = make(map[string]json.RawMessage)
	}

	llmData, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	raw["llm"] = llmData

	out, err := json.MarshalIndent(raw, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, out, 0o644)
}
