import { ApiProperty } from '@nestjs/swagger';
export class CreateTwitterDto {
    @ApiProperty({
        required: true,
    })
    text: string;
    @ApiProperty({
        required: true,
    })
    userName: string;
    @ApiProperty({
        required: true,
    })
    linkToTweet: string;
    
    @ApiProperty({
        required: true,
    })
    tweetEmbedCode: string;
    @ApiProperty({
        required: true,
    })
    createAt: string;
}
