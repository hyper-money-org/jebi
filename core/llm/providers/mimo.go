package providers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"terminal/core/llm"
	"terminal/core/llm/config"
)

const (
	mimoDefaultEndpoint = "https://api.xiaomi.com/v1"
	mimoDefaultModel    = "mimo-v2.5-pro"
)

// MiMoProvider routes queries through Xiaomi's MiMo API (OpenAI-compatible).
type MiMoProvider struct {
	client   *llm.StreamClient
	model    string
	apiKey   string
	endpoint string
}

func NewMiMoProvider(cfg config.Config) *MiMoProvider {
	endpoint := cfg.EndpointURL
	if endpoint == "" {
		endpoint = mimoDefaultEndpoint
	}
	model := cfg.Model
	if model == "" {
		model = mimoDefaultModel
	}
	return &MiMoProvider{
		client:   llm.NewStreamClientWithKey(endpoint, model, cfg.APIKey),
		model:    model,
		apiKey:   cfg.APIKey,
		endpoint: endpoint,
	}
}

func (p *MiMoProvider) Name() string { return "mimo" }

// IsAvailable returns true if the API key is set and the endpoint is reachable.
func (p *MiMoProvider) IsAvailable() bool {
	_, ok := p.CheckAvailability()
	return ok
}

// CheckAvailability returns (reason, ok). When ok is false, reason explains why.
func (p *MiMoProvider) CheckAvailability() (string, bool) {
	if p.apiKey == "" {
		return "MiMo API key not set — add it in Preferences → AI or in ~/.config/jebi/settings.json: {\"llm\":{\"provider\":\"mimo\",\"apiKey\":\"your-key\"}}", false
	}

	// Quick health check: try to reach the endpoint
	hc := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest("GET", p.endpoint+"/models", nil)
	if err != nil {
		return "MiMo: invalid endpoint URL: " + p.endpoint, false
	}
	req.Header.Set("Authorization", "Bearer "+p.apiKey)

	resp, err := hc.Do(req)
	if err != nil {
		return "MiMo: cannot reach " + p.endpoint + " — check internet connection", false
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return "MiMo: invalid API key", false
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Sprintf("MiMo: endpoint returned %d", resp.StatusCode), false
	}

	return "", true
}

func (p *MiMoProvider) StreamQuery(ctx context.Context, req llm.QueryRequest) (<-chan llm.ResponseChunk, error) {
	return p.client.Stream(ctx, llm.BuildMessages(req))
}

func (p *MiMoProvider) StreamMessages(ctx context.Context, msgs []llm.ChatMessage) (<-chan llm.ResponseChunk, error) {
	return p.client.Stream(ctx, msgs)
}
