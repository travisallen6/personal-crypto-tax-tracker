import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EstimatedTaxService } from './estimated-tax.service';
import { CreateEstimatedTaxDto } from './dto/create-estimated-tax.dto';
import { Express } from 'express';

@Controller('estimated-tax')
export class EstimatedTaxController {
  constructor(private readonly estimatedTaxService: EstimatedTaxService) {}

  @Post()
  @UseInterceptors(FileInterceptor('pdfConfirmation'))
  create(
    @Body() createEstimatedTaxDto: CreateEstimatedTaxDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file?.buffer) {
      createEstimatedTaxDto.pdfConfirmation = file.buffer;
    }
    return this.estimatedTaxService.create(createEstimatedTaxDto);
  }

  @Get()
  findAll() {
    return this.estimatedTaxService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.estimatedTaxService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('pdfConfirmation'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEstimatedTaxDto: Partial<CreateEstimatedTaxDto>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file?.buffer) {
      updateEstimatedTaxDto.pdfConfirmation = file.buffer;
    }
    return this.estimatedTaxService.update(id, updateEstimatedTaxDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.estimatedTaxService.remove(id);
  }
}
