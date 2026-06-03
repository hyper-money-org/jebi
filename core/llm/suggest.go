package llm

import (
	"context"
	"strings"
)

// Suggest returns up to 3 suggested next commands based on the session context.
// Returns nil when the model produces no useful suggestions.
func Suggest(ctx context.Context, provider Provider, req SuggestRequest) ([]string, error) {
	ch, err := provider.StreamMessages(ctx, BuildSuggestMessages(req))
	if err != nil {
		return nil, err
	}
	var acc strings.Builder
	for chunk := range ch {
		acc.WriteString(chunk.Token)
	}
	results := ParseSuggestResponse(acc.String())
	// Discard any entry that echoes back the last failed command verbatim.
	if len(results) > 0 && len(req.Entries) > 0 {
		last := req.Entries[len(req.Entries)-1]
		if last.ExitCode != 0 {
			filtered := results[:0]
			for _, r := range results {
				if !strings.EqualFold(r, strings.TrimSpace(last.Command)) {
					filtered = append(filtered, r)
				}
			}
			results = filtered
		}
	}
	return results, nil
}
