import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// Regra de produto (vazia/só espaços/acima de 2000) vive no ChatService.ask e vira
// resposta 200 de assunto inválido — aqui o DTO só garante presença e tipo string
// (ausente ou não-string cai em 400 do ValidationPipe).
export class SendChatMessageDto {
  @ApiProperty({ example: 'onde você trabalhou com NestJS?' })
  @IsString()
  message: string;
}
