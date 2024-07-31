import { ApiProperty } from '@nestjs/swagger';
export class queryReplyDto {
    @ApiProperty({
        required: true,
    })
    content: string;
}