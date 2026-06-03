package llm

import (
	"context"
	"strings"
)

// AskStream streams a conversational AI response given a pre-built message list.
// Calls onToken for each streamed token and onDone with the full text when complete.
// Returns silently if context is cancelled before completion.
func AskStream(ctx context.Context, provider Provider, messages []ChatMessage, onToken func(string), onDone func(string)) error {
	ch, err := provider.StreamMessages(ctx, messages)
	if err != nil {
		return err
	}
	var acc strings.Builder
	for chunk := range ch {
		if ctx.Err() != nil {
			return nil
		}
		acc.WriteString(chunk.Token)
		onToken(chunk.Token)
	}
	if ctx.Err() != nil {
		return nil
	}
	onDone(strings.TrimSpace(acc.String()))
	return nil
}
