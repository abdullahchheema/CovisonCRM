package utils

import (
	"encoding/json"
	"html"
	"strings"
)

// Lexical text format bitmask flags (from lexical's TextNode).
const (
	lexFormatBold          = 1 << 0
	lexFormatItalic        = 1 << 1
	lexFormatStrikethrough = 1 << 2
	lexFormatUnderline     = 1 << 3
	lexFormatCode          = 1 << 4
)

// lexFormat tolerates Lexical's "format" field, which is an int bitmask on
// text nodes but an alignment string ("", "left", …) on block nodes.
type lexFormat int

func (f *lexFormat) UnmarshalJSON(b []byte) error {
	if len(b) > 0 && b[0] == '"' {
		*f = 0
		return nil
	}
	var n int
	if err := json.Unmarshal(b, &n); err != nil {
		return err
	}
	*f = lexFormat(n)
	return nil
}

type lexicalNode struct {
	Type     string        `json:"type"`
	Tag      string        `json:"tag"`
	Text     string        `json:"text"`
	Format   lexFormat     `json:"format"`
	Children []lexicalNode `json:"children"`
}

type lexicalDoc struct {
	Root lexicalNode `json:"root"`
}

// LexicalToHTML converts a serialized Lexical editor state (the JSON the
// rich-text email body is stored as) into HTML suitable for an email. If the
// input isn't valid Lexical JSON, it's returned unchanged so plain-text or
// pre-rendered HTML bodies still work.
func LexicalToHTML(body string) string {
	trimmed := strings.TrimSpace(body)
	if !strings.HasPrefix(trimmed, "{") {
		return body
	}

	var doc lexicalDoc
	if err := json.Unmarshal([]byte(trimmed), &doc); err != nil || doc.Root.Type != "root" {
		return body
	}

	var sb strings.Builder
	for _, child := range doc.Root.Children {
		sb.WriteString(renderBlock(child))
	}
	return sb.String()
}

// Inline styles are used (rather than bare tags) because several email
// clients — notably the Gmail mobile app — strip default paragraph/heading
// margins, which collapses the message into one run-on block.
func renderBlock(n lexicalNode) string {
	switch n.Type {
	case "heading":
		tag := n.Tag
		if tag == "" {
			tag = "h2"
		}
		return "<" + tag + ` style="margin:0 0 8px 0;">` + renderInline(n.Children) + "</" + tag + ">"
	case "quote":
		return `<blockquote style="margin:0 0 16px 0;padding-left:12px;border-left:3px solid #ccc;color:#555;">` + renderInline(n.Children) + "</blockquote>"
	case "paragraph":
		inner := renderInline(n.Children)
		if inner == "" {
			// Preserve a deliberately blank line.
			return `<p style="margin:0 0 16px 0;">&nbsp;</p>`
		}
		return `<p style="margin:0 0 16px 0;">` + inner + "</p>"
	default:
		// Unknown block: render any children inline within a paragraph.
		if len(n.Children) > 0 {
			return `<p style="margin:0 0 16px 0;">` + renderInline(n.Children) + "</p>"
		}
		return ""
	}
}

func renderInline(children []lexicalNode) string {
	var sb strings.Builder
	for _, c := range children {
		switch {
		case c.Type == "linebreak":
			// Shift+Enter soft line break inside a paragraph.
			sb.WriteString("<br>")
		case c.Type == "text":
			sb.WriteString(formatText(c))
		case len(c.Children) > 0:
			sb.WriteString(renderInline(c.Children))
		}
	}
	return sb.String()
}

func formatText(n lexicalNode) string {
	text := html.EscapeString(n.Text)
	// Preserve any literal newlines within a text run as line breaks.
	text = strings.ReplaceAll(text, "\n", "<br>")
	format := int(n.Format)
	if format&lexFormatCode != 0 {
		text = "<code>" + text + "</code>"
	}
	if format&lexFormatBold != 0 {
		text = "<strong>" + text + "</strong>"
	}
	if format&lexFormatItalic != 0 {
		text = "<em>" + text + "</em>"
	}
	if format&lexFormatUnderline != 0 {
		text = "<u>" + text + "</u>"
	}
	if format&lexFormatStrikethrough != 0 {
		text = "<s>" + text + "</s>"
	}
	return text
}
