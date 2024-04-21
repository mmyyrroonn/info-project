import { Controller, Post, Body, Get, UploadedFile, UseInterceptors, ParseFilePipeBuilder } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { CreateTwitterDto } from './dto/create-twitter.dto';
import { UpdateTwitterDto } from './dto/update-twitter.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { memoryStorage } from 'multer';

@Controller('twitter')
export class TwitterController {
  constructor(private readonly twitterService: TwitterService) {}

  @Post("/like")
  storeLike(@Body() createTwitterDto: CreateTwitterDto) {
    return this.twitterService.create(createTwitterDto, "Like");
  }

  @Post("/new")
  storeNew(@Body() createTwitterDto: CreateTwitterDto) {
    return this.twitterService.create(createTwitterDto, "New");
  }

  @Get("/queryLastDaySummary")
  queryLastDaySummary() {
    return this.twitterService.queryLastDaySummary();
  }

  // @Post("/migration")
  // testParse(@Body() createTwitterDto: CreateTwitterDto) {
  //   return this.twitterService.migrationDB();
  // }

  // @Get()
  // findAll() {
  //   return this.twitterService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.twitterService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateTwitterDto: UpdateTwitterDto) {
  //   return this.twitterService.update(+id, updateTwitterDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.twitterService.remove(+id);
  // }
}
