export { formatFileSize } from "./lib/formatFileSize";
export { getFileKind, isAcceptedFileName } from "./lib/getFileKind";
export {
  getMaxAttachmentSizeBytes,
  isAcceptedFileSize,
} from "./lib/isAcceptedFileSize";
export {
  ACCEPTED_FILE_EXTENSIONS,
  FILE_INPUT_ACCEPT,
  MAX_ATTACHMENT_COUNT,
  MAX_DOCUMENT_ATTACHMENT_SIZE_BYTES,
  MAX_PLAIN_TEXT_ATTACHMENT_SIZE_BYTES,
} from "./model/constants";
export type { AttachmentItem, FileKind } from "./model/types";
export { AttachmentChip } from "./ui/AttachmentChip";
export { FileTypeIcon } from "./ui/FileTypeIcon";
