package llm

import (
	"strings"
	"testing"
)

func TestParseAnalysisResponse_WellFormedJSON(t *testing.T) {
	raw := `{"title":"3 build errors","items":[{"type":"error","text":"undefined: TokenExpiry","detail":"auth/auth.go:42"},{"type":"insight","text":"All errors in auth package","detail":""}],"action":{"label":"Run go mod tidy","command":"go mod tidy"}}`
	result, err := ParseAnalysisResponse(raw)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Title != "3 build errors" {
		t.Errorf("title = %q, want %q", result.Title, "3 build errors")
	}
	if len(result.Items) != 2 {
		t.Fatalf("items len = %d, want 2", len(result.Items))
	}
	if result.Items[0].Type != "error" {
		t.Errorf("item[0].type = %q, want %q", result.Items[0].Type, "error")
	}
	if result.Action == nil || result.Action.Command != "go mod tidy" {
		t.Errorf("action.command = %v, want %q", result.Action, "go mod tidy")
	}
}

func TestParseAnalysisResponse_NullAction(t *testing.T) {
	raw := `{"title":"47/50 tests passed","items":[{"type":"metric","text":"47 passed, 3 failed","detail":""}],"action":null}`
	result, err := ParseAnalysisResponse(raw)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Action != nil {
		t.Errorf("expected nil action, got %+v", result.Action)
	}
}

func TestParseAnalysisResponse_JSONEmbeddedInText(t *testing.T) {
	raw := `Here is the analysis:` + "\n" + `{"title":"build failed","items":[{"type":"error","text":"syntax error","detail":""}],"action":null}` + "\n" + `Done.`
	result, err := ParseAnalysisResponse(raw)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Title != "build failed" {
		t.Errorf("title = %q, want %q", result.Title, "build failed")
	}
}

func TestParseAnalysisResponse_InvalidJSON(t *testing.T) {
	raw := "I cannot analyze this output."
	_, err := ParseAnalysisResponse(raw)
	if err == nil {
		t.Error("expected error for invalid JSON, got nil")
	}
}

func TestParseAnalysisResponse_ItemsCapAt5(t *testing.T) {
	items := strings.Repeat(`{"type":"error","text":"err","detail":""},`, 7)
	items = strings.TrimSuffix(items, ",")
	raw := `{"title":"many errors","items":[` + items + `],"action":null}`
	result, err := ParseAnalysisResponse(raw)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.Items) > 5 {
		t.Errorf("items len = %d, want ≤ 5", len(result.Items))
	}
}
