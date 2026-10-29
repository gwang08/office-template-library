import { Controller, Get, Param, ParseUUIDPipe, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { TemplateListQueryDto } from './dto/template-list-query.dto';
import { TemplatesService } from './templates.service';

// ParseUUIDPipe on :id kills traversal-shaped ids structurally:
// "../../etc/passwd" never reaches the DB or the filesystem layer.
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@Query() query: TemplateListQueryDto) {
    return this.templates.list(query);
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.templates.detail(id);
  }

  @Get(':id/preview')
  preview(@Param('id', ParseUUIDPipe) id: string) {
    return this.templates.previewHtml(id);
  }

  @Get(':id/file')
  async file(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.templates.getFile(id);
    res.set({
      'Content-Type': file.mime,
      'Content-Disposition': `inline; filename="${file.filename}"`,
    });
    return file.stream;
  }
}
