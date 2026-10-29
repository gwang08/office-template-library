import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/** Empty query params (?kind=&search=) are treated as "not provided". */
const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class TemplateListQueryDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(['docx', 'pptx'], { message: 'kind must be one of: docx, pptx' })
  kind?: 'docx' | 'pptx';
}
