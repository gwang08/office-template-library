import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentsService } from './documents.service';

// ParseUUIDPipe on :id kills traversal-shaped ids structurally (same contract
// as the templates controller).
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documents.create(dto);
  }

  @Get()
  list() {
    return this.documents.list();
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.documents.detail(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDocumentDto) {
    return this.documents.update(id, dto);
  }

  @Get(':id/export')
  async export(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.documents.export(id);
    // filename is an ascii-only slug of the title (header-injection safe).
    res.set({
      'Content-Type': file.mime,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    return new StreamableFile(file.buffer);
  }
}
