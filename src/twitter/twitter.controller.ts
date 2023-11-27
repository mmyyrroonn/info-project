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
    return this.twitterService.create(createTwitterDto, "like");
  }

  @Post("/new")
  storeNew(@Body() createTwitterDto: CreateTwitterDto) {
    return this.twitterService.create(createTwitterDto, "new");
  }

  @Post("/insertFollowings")
  @UseInterceptors(FileInterceptor('followings', { storage: memoryStorage() }))
  insertFollowings(@UploadedFile(new ParseFilePipeBuilder()
  .addFileTypeValidator({
    fileType: 'json',
  })
  .build(),) userList: Express.Multer.File) {

    const usersData = JSON.parse(userList.buffer.toString());

    // 插入数据库
    this.twitterService.storeUsersAndFilter(usersData);

    return "success";
  }

  @Post("/filterFollowings")
  filterFollowing() {
    return this.twitterService.filterFollowing(10);
  }

  @Get("/queryWorthUsers")
  queryWorthUsers() {
    return this.twitterService.queryWorthUsers();
  }

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
