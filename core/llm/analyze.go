package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

// Analyze runs the output analysis LLM call and returns a structured result.
// Returns nil when the provider is unavailable or output produces no useful analysis.
func Analyze(ctx context.Context, provider Provider, req AnalyzeRequest) (*AnalysisResult, error) {
	ch, err := provider.StreamMessages(ctx, BuildAnalyzeMessages(req))
	if err != nil {
		return nil, err
	}
	var acc strings.Builder
	for chunk := range ch {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		acc.WriteString(chunk.Token)
	}
	return ParseAnalysisResponse(acc.String())
}

// ParseAnalysisResponse extracts and validates an AnalysisResult from raw LLM output.
// Tries direct unmarshal first, then falls back to extracting the first '{' … last '}' substring.
// Caps items at 5.
func ParseAnalysisResponse(raw string) (*AnalysisResult, error) {
	raw = strings.TrimSpace(raw)

	var result AnalysisResult
	if err := json.Unmarshal([]byte(raw), &result); err == nil {
		capItems(&result)
		return &result, nil
	}

	start := strings.Index(raw, "{")
	end := strings.LastIndex(raw, "}")
	if start >= 0 && end > start {
		if err := json.Unmarshal([]byte(raw[start:end+1]), &result); err == nil {
			capItems(&result)
			return &result, nil
		}
	}

	return nil, fmt.Errorf("could not parse analysis response: %q", raw)
}

func capItems(r *AnalysisResult) {
	if len(r.Items) > 5 {
		r.Items = r.Items[:5]
	}
}
