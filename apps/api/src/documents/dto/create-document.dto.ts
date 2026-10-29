import { IsUUID } from 'class-validator';

// POST /api/documents body. The only client input into the copy-on-use flow:
// everything else (document id, storage key, title, content) is derived
// server-side from the template row.
export class CreateDocumentDto {
  @IsUUID()
  templateId: string;
}
