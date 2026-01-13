"use client";

import { useEffect, useState } from "react";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { OverflowNode } from "@lexical/overflow";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import type { LexicalEditor } from "lexical";
import { ParagraphNode, TextNode } from "lexical";

import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { ActionsPlugin } from "@/components/editor/plugins/actions/actions-plugin";
import { CharacterLimitPlugin } from "@/components/editor/plugins/actions/character-limit-plugin";
import { ClearEditorActionPlugin } from "@/components/editor/plugins/actions/clear-editor-plugin";
import { CounterCharacterPlugin } from "@/components/editor/plugins/actions/counter-character-plugin";
import { EditModeTogglePlugin } from "@/components/editor/plugins/actions/edit-mode-toggle-plugin";
import { ImportExportPlugin } from "@/components/editor/plugins/actions/import-export-plugin";
import { MarkdownTogglePlugin } from "@/components/editor/plugins/actions/markdown-toggle-plugin";
import { MaxLengthPlugin } from "@/components/editor/plugins/actions/max-length-plugin";
import { ShareContentPlugin } from "@/components/editor/plugins/actions/share-content-plugin";
import { SpeechToTextPlugin } from "@/components/editor/plugins/actions/speech-to-text-plugin";
import { TreeViewPlugin } from "@/components/editor/plugins/actions/tree-view-plugin";
import { ThemeTogglePlugin } from "@/components/editor/plugins/actions/theme-toggle-plugin";
import { AutocompleteNode } from "@/components/editor/nodes/autocomplete-node";
import { TweetNode } from "@/components/editor/nodes/embeds/tweet-node";
import { YouTubeNode } from "@/components/editor/nodes/embeds/youtube-node";
import { EmojiNode } from "@/components/editor/nodes/emoji-node";
import { ImageNode } from "@/components/editor/nodes/image-node";
import { KeywordNode } from "@/components/editor/nodes/keyword-node";
import { LayoutContainerNode } from "@/components/editor/nodes/layout-container-node";
import { LayoutItemNode } from "@/components/editor/nodes/layout-item-node";
import { MentionNode } from "@/components/editor/nodes/mention-node";
import { AutoEmbedPlugin } from "@/components/editor/plugins/embeds/auto-embed-plugin";
import { TwitterPlugin } from "@/components/editor/plugins/embeds/twitter-plugin";
import { YouTubePlugin } from "@/components/editor/plugins/embeds/youtube-plugin";
import { AutocompletePlugin } from "@/components/editor/plugins/autocomplete-plugin";
import { AutoLinkPlugin } from "@/components/editor/plugins/auto-link-plugin";
import { CodeActionMenuPlugin } from "@/components/editor/plugins/code-action-menu-plugin";
import { CodeHighlightPlugin } from "@/components/editor/plugins/code-highlight-plugin";
import { ComponentPickerMenuPlugin } from "@/components/editor/plugins/component-picker-menu-plugin";
import { ContextMenuPlugin } from "@/components/editor/plugins/context-menu-plugin";
import { DragDropPastePlugin } from "@/components/editor/plugins/drag-drop-paste-plugin";
import { DraggableBlockPlugin } from "@/components/editor/plugins/draggable-block-plugin";
import { EmojiPickerPlugin } from "@/components/editor/plugins/emoji-picker-plugin";
import { EmojisPlugin } from "@/components/editor/plugins/emojis-plugin";
import { FloatingLinkEditorPlugin } from "@/components/editor/plugins/floating-link-editor-plugin";
import { FloatingTextFormatToolbarPlugin } from "@/components/editor/plugins/floating-text-format-plugin";
import { ImagesPlugin } from "@/components/editor/plugins/images-plugin";
import { KeywordsPlugin } from "@/components/editor/plugins/keywords-plugin";
import { LayoutPlugin } from "@/components/editor/plugins/layout-plugin";
import { LinkPlugin } from "@/components/editor/plugins/link-plugin";
import { ListMaxIndentLevelPlugin } from "@/components/editor/plugins/list-max-indent-level-plugin";
import { MentionsPlugin } from "@/components/editor/plugins/mentions-plugin";
import { TypingPerfPlugin } from "@/components/editor/plugins/typing-pref-plugin";
import { TabFocusPlugin } from "@/components/editor/plugins/tab-focus-plugin";
import { IndexedDBPersistencePlugin } from "@/components/editor/plugins/indexeddb-persistence-plugin";
import {
  TablePickerPlugin,
  DynamicTablePickerPlugin,
} from "@/components/editor/plugins/picker/table-picker-plugin";
import { AlignmentPickerPlugin } from "@/components/editor/plugins/picker/alignment-picker-plugin";
import { HeadingPickerPlugin } from "@/components/editor/plugins/picker/heading-picker-plugin";
import { ParagraphPickerPlugin } from "@/components/editor/plugins/picker/paragraph-picker-plugin";
import { QuotePickerPlugin } from "@/components/editor/plugins/picker/quote-picker-plugin";
import { BulletedListPickerPlugin } from "@/components/editor/plugins/picker/bulleted-list-picker-plugin";
import { NumberedListPickerPlugin } from "@/components/editor/plugins/picker/numbered-list-picker-plugin";
import { CheckListPickerPlugin } from "@/components/editor/plugins/picker/check-list-picker-plugin";
import { ColumnsLayoutPickerPlugin } from "@/components/editor/plugins/picker/columns-layout-picker-plugin";
import { DividerPickerPlugin } from "@/components/editor/plugins/picker/divider-picker-plugin";
import { ImagePickerPlugin } from "@/components/editor/plugins/picker/image-picker-plugin";
import { EmbedsPickerPlugin } from "@/components/editor/plugins/picker/embeds-picker-plugin";
import { CodePickerPlugin } from "@/components/editor/plugins/picker/code-picker-plugin";
import { ComponentPickerOption } from "@/components/editor/plugins/picker/component-picker-option";
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin";
import { BlockInsertPlugin } from "@/components/editor/plugins/toolbar/block-insert-plugin";
import { InsertEmbeds } from "@/components/editor/plugins/toolbar/block-insert/insert-embeds";
import { InsertImage } from "@/components/editor/plugins/toolbar/block-insert/insert-image";
import { InsertHorizontalRule } from "@/components/editor/plugins/toolbar/block-insert/insert-horizontal-rule";
import { InsertColumnsLayout } from "@/components/editor/plugins/toolbar/block-insert/insert-columns-layout";
import { InsertTable } from "@/components/editor/plugins/toolbar/block-insert/insert-table";
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin";
import { FormatParagraph } from "@/components/editor/plugins/toolbar/block-format/format-paragraph";
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading";
import { FormatNumberedList } from "@/components/editor/plugins/toolbar/block-format/format-numbered-list";
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list";
import { FormatCheckList } from "@/components/editor/plugins/toolbar/block-format/format-check-list";
import { FormatQuote } from "@/components/editor/plugins/toolbar/block-format/format-quote";
import { FormatCodeBlock } from "@/components/editor/plugins/toolbar/block-format/format-code-block";
import { ClearFormattingToolbarPlugin } from "@/components/editor/plugins/toolbar/clear-formatting-toolbar-plugin";
import { CodeLanguageToolbarPlugin } from "@/components/editor/plugins/toolbar/code-language-toolbar-plugin";
import { ElementFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/element-format-toolbar-plugin";
import { FontBackgroundToolbarPlugin } from "@/components/editor/plugins/toolbar/font-background-toolbar-plugin";
import { FontColorToolbarPlugin } from "@/components/editor/plugins/toolbar/font-color-toolbar-plugin";
import { FontFamilyToolbarPlugin } from "@/components/editor/plugins/toolbar/font-family-toolbar-plugin";
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import { FontSizeToolbarPlugin } from "@/components/editor/plugins/toolbar/font-size-toolbar-plugin";
import { HistoryToolbarPlugin } from "@/components/editor/plugins/toolbar/history-toolbar-plugin";
import { LinkToolbarPlugin } from "@/components/editor/plugins/toolbar/link-toolbar-plugin";
import { SubSuperToolbarPlugin } from "@/components/editor/plugins/toolbar/subsuper-toolbar-plugin";
import { editorTheme } from "@/components/editor/themes/editor-theme";
import { EMOJI } from "@/components/editor/transformers/markdown-emoji-transformer";
import { HR } from "@/components/editor/transformers/markdown-hr-transformer";
import { IMAGE } from "@/components/editor/transformers/markdown-image-transformer";
import { TABLE } from "@/components/editor/transformers/markdown-table-transformer";
import { TWEET } from "@/components/editor/transformers/markdown-tweet-transformer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const MAX_LENGTH = 1500;
const PLACEHOLDER =
  "Press '/' for commands, or start typing to capture your thoughts.";
const STORAGE_KEY = "qckdev";

type FullFeaturedEditorProps = {
  storageKey?: string;
  enableIndexedDBPersistence?: boolean;
  onEditorReady?: (editor: LexicalEditor) => void;
};

const MARKDOWN_TRANSFORMERS = [
  TABLE,
  HR,
  IMAGE,
  EMOJI,
  TWEET,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];

const componentPickerBaseOptions: ComponentPickerOption[] = [
  ParagraphPickerPlugin(),
  HeadingPickerPlugin({ n: 1 }),
  HeadingPickerPlugin({ n: 2 }),
  HeadingPickerPlugin({ n: 3 }),
  QuotePickerPlugin(),
  AlignmentPickerPlugin({ alignment: "left" }),
  AlignmentPickerPlugin({ alignment: "center" }),
  AlignmentPickerPlugin({ alignment: "right" }),
  AlignmentPickerPlugin({ alignment: "justify" }),
  BulletedListPickerPlugin(),
  NumberedListPickerPlugin(),
  CheckListPickerPlugin(),
  ColumnsLayoutPickerPlugin(),
  DividerPickerPlugin(),
  ImagePickerPlugin(),
  TablePickerPlugin(),
  EmbedsPickerPlugin({ embed: "tweet" }),
  EmbedsPickerPlugin({ embed: "youtube-video" }),
  CodePickerPlugin(),
];

function EditorReadyPlugin({
  onEditorReady,
}: {
  onEditorReady?: (editor: LexicalEditor) => void;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);
  return null;
}

const fullEditorConfig: InitialConfigType = {
  namespace: "AllInOneEditor",
  theme: editorTheme,
  onError: (error: Error) => {
    console.error(error);
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ParagraphNode,
    TextNode,
    ListNode,
    ListItemNode,
    AutoLinkNode,
    LinkNode,
    CodeNode,
    CodeHighlightNode,
    HashtagNode,
    HorizontalRuleNode,
    TableNode,
    TableRowNode,
    TableCellNode,
    OverflowNode,
    ImageNode,
    EmojiNode,
    KeywordNode,
    TweetNode,
    YouTubeNode,
    LayoutContainerNode,
    LayoutItemNode,
    AutocompleteNode,
    MentionNode,
  ],
};

const placeholderText = PLACEHOLDER;

export function FullFeaturedEditor({
  storageKey,
  enableIndexedDBPersistence = true,
  onEditorReady,
}: FullFeaturedEditorProps = {}) {
  const [anchorElem, setAnchorElem] = useState<HTMLDivElement | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const persistenceKey = storageKey ?? STORAGE_KEY;

  return (
    <div className="bg-card text-card-foreground w-full overflow-hidden rounded-2xl border shadow-sm">
      <LexicalComposer initialConfig={fullEditorConfig}>
        <TooltipProvider>
          <div className="flex flex-col gap-4">
            <ToolbarPlugin>
              {() => (
                <div className="border-border/80 border-b bg-muted/30 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <BlockInsertPlugin>
                      <InsertEmbeds />
                      <InsertImage />
                      <InsertHorizontalRule />
                      <InsertColumnsLayout />
                      <InsertTable />
                    </BlockInsertPlugin>
                    <HistoryToolbarPlugin />
                    <Separator orientation="vertical" className="h-6" />
                    <BlockFormatDropDown>
                      <FormatParagraph />
                      <FormatHeading levels={["h1", "h2", "h3"]} />
                      <FormatNumberedList />
                      <FormatBulletedList />
                      <FormatCheckList />
                      <FormatQuote />
                      <FormatCodeBlock />
                    </BlockFormatDropDown>
                    <ElementFormatToolbarPlugin />
                    <FontFormatToolbarPlugin />
                    <SubSuperToolbarPlugin />
                    <ClearFormattingToolbarPlugin />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <FontFamilyToolbarPlugin />
                    <FontSizeToolbarPlugin />
                    <FontColorToolbarPlugin />
                    <FontBackgroundToolbarPlugin />
                    <LinkToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
                    <CodeLanguageToolbarPlugin />
                  </div>
                </div>
              )}
            </ToolbarPlugin>

            <div className="relative">
              <RichTextPlugin
                contentEditable={
                  <div className="relative">
                    <div ref={setAnchorElem}>
                      <ContentEditable
                        placeholder={placeholderText}
                        className="ContentEditable__root relative block h-[520px] min-h-[520px] w-full overflow-auto px-6 py-4 text-base focus:outline-none"
                      />
                    </div>
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />

              <HistoryPlugin />
              <AutoFocusPlugin />
              <CheckListPlugin />
              <ListPlugin />
              <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
              <HorizontalRulePlugin />
              <TablePlugin />
              <HashtagPlugin />
              <LinkPlugin />
              <AutoLinkPlugin />
              <AutoEmbedPlugin />
              <TwitterPlugin />
              <YouTubePlugin />
              <AutocompletePlugin />
              <MentionsPlugin />
              <EmojiPickerPlugin />
              <EmojisPlugin />
              <KeywordsPlugin />
              <LayoutPlugin />
              <ImagesPlugin />
              <DragDropPastePlugin />
              <ContextMenuPlugin />
              <CodeHighlightPlugin />
              <CodeActionMenuPlugin anchorElem={anchorElem} />
              <DraggableBlockPlugin anchorElem={anchorElem} />
              <FloatingLinkEditorPlugin
                anchorElem={anchorElem}
                isLinkEditMode={isLinkEditMode}
                setIsLinkEditMode={setIsLinkEditMode}
              />
              <FloatingTextFormatToolbarPlugin
                anchorElem={anchorElem}
                setIsLinkEditMode={setIsLinkEditMode}
              />
              <ComponentPickerMenuPlugin
                baseOptions={componentPickerBaseOptions}
                dynamicOptionsFn={({ queryString }) =>
                  DynamicTablePickerPlugin({ queryString })
                }
              />
              <ListMaxIndentLevelPlugin maxDepth={7} />
              <TypingPerfPlugin />
              <TabFocusPlugin />
              {enableIndexedDBPersistence && (
                <IndexedDBPersistencePlugin storageKey={persistenceKey} />
              )}
              <EditorReadyPlugin onEditorReady={onEditorReady} />
            </div>

            <ActionsPlugin>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <MaxLengthPlugin maxLength={MAX_LENGTH} />
                  <CharacterLimitPlugin
                    maxLength={MAX_LENGTH}
                    charset="UTF-16"
                  />
                  <CounterCharacterPlugin />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SpeechToTextPlugin />
                  <EditModeTogglePlugin />
                  <ThemeTogglePlugin />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ImportExportPlugin />
                  <ShareContentPlugin />
                  <MarkdownTogglePlugin
                    transformers={MARKDOWN_TRANSFORMERS}
                    shouldPreserveNewLinesInMarkdown
                  />
                  <TreeViewPlugin />
                  <ClearEditorActionPlugin />
                </div>
              </div>
            </ActionsPlugin>
          </div>
        </TooltipProvider>
      </LexicalComposer>
    </div>
  );
}
