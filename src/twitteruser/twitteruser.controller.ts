import { FileInterceptor } from '@nestjs/platform-express';
import { TwitteruserService } from './twitteruser.service';
import { Controller, Post, Body, Get, UploadedFile, UseInterceptors, ParseFilePipeBuilder, Param } from '@nestjs/common';
import { memoryStorage } from 'multer';

@Controller('twitteruser')
export class TwitteruserController {
  constructor(private readonly twitteruserService: TwitteruserService) {}

  @Post("/insertFollowings")
  @UseInterceptors(FileInterceptor('followings', { storage: memoryStorage() }))
  insertFollowings(@UploadedFile(new ParseFilePipeBuilder()
  .addFileTypeValidator({
    fileType: 'json',
  })
  .build(),) userList: Express.Multer.File) {

    const usersData = JSON.parse(userList.buffer.toString());

    // 插入数据库
    this.twitteruserService.storeUsersAndFilter(usersData);

    return "success";
  }

  @Post("/filterFollowings")
  filterFollowing() {
    return this.twitteruserService.filterFollowing(10);
  }

  @Get("/queryWorthUsers")
  queryWorthUsers() {
    return this.twitteruserService.queryWorthUsers();
  }

  @Post("/:name")
  addNewTwitterUser(@Param('name') name: string) {
    return this.twitteruserService.listenToNewUser(name);
  }
}
