import { Controller, Patch, Query, BadRequestException } from '@nestjs/common';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Patch('accept')
  accept(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token diperlukan');
    return this.invitationsService.accept(token);
  }
}
