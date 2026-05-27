import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  listActive(
    @Query('storeId') storeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.productsService.listActive(storeId, +page, +limit);
  }

  @Get('all')
  @UseGuards(ClerkAuthGuard)
  listAll(
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('archived') archived?: string,
  ) {
    const archivedBool = archived === 'true' ? true : archived === 'false' ? false : undefined;
    return this.productsService.listAll(userId, storeId, +page, +limit, archivedBool);
  }

  @Patch(':id/archive')
  @UseGuards(ClerkAuthGuard)
  archive(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.productsService.archive(id, userId, storeId);
  }

  @Patch(':id/unarchive')
  @UseGuards(ClerkAuthGuard)
  unarchive(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.productsService.unarchive(id, userId, storeId);
  }

  @Get('import/template')
  @UseGuards(ClerkAuthGuard)
  downloadTemplate(@Res() res: Response) {
    const buffer = this.productsService.getImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template-produk.xlsx"');
    res.send(buffer);
  }

  @Post('import')
  @UseGuards(ClerkAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  importProducts(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.productsService.importProducts(file.buffer, userId, storeId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.productsService.getOne(id);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.productsService.create(dto, userId, storeId);
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.productsService.update(id, dto, userId, storeId);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.productsService.remove(id, userId, storeId);
  }
}
