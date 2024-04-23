import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTwitterDto {
    @ApiProperty({
        required: true,
    })
    query_text: string;
    @ApiProperty({
        required: true,
        default: 100,
        description: 'The limit of items to fetch.'
    })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit: number = 100;
}