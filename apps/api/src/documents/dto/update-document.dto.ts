import { IsOptional, IsString, MaxLength } from 'class-validator';

// PATCH /api/documents/:id body — strictly partial: only the fields present
// are updated (a title-only PATCH must not clobber contentHtml).
// MaxLength caps are DoS guards (contentHtml ~2MB of editor HTML).
export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  contentHtml?: string;
}
