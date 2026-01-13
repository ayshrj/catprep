"use client";

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { toast } from "sonner";

import { INSERT_IMAGE_COMMAND } from "@/components/editor/plugins/images-plugin";
import { uploadImageToCloudinary } from "@/lib/upload-image";

const ACCEPTABLE_IMAGE_TYPES = [
  "image/",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/webp",
];

export function DragDropPastePlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          for (const file of Array.from(files)) {
            if (!isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) continue;
            try {
              const { url } = await uploadImageToCloudinary(file, {
                folder: "cat99/notes",
              });
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText: file.name,
                src: url,
              });
            } catch (error: any) {
              console.error("Image upload failed", error);
              toast.error(error?.message ?? "Image upload failed.");
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);
  return null;
}
