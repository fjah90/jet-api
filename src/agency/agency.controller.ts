import { Body, Controller, HttpException, HttpStatus, Post, Put, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsdService } from 'src/statsd/statsd.service';
import { ChangePassRequest } from './dto/change-pass.request';
import { ViewCreditRequest } from './dto/view-credit.request';
import { ModifyAgentDto } from './dto/modify-agent.dto';
import { AgencyService } from './agency.service';
import { AgentListRequest } from './dto/agent-list.request';
import { AgentRequest } from './dto/agent-request';

@ApiTags('Agency')
@Controller('agency')
export class AgencyController {
  constructor(private agencyService: AgencyService, private statsdService: StatsdService) {}
  @ApiOperation({
    summary: 'Change a password',
    description: 'This endpoint changes the password for the authenticated user.',
  })
  @Post('/changepassword')
  async changePassword(@Body(ValidationPipe) changePassRequest: ChangePassRequest) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const response = await this.agencyService.changePass(changePassRequest);
    return response;
  }

  @ApiOperation({
    summary: 'Recover the agency credit',
    description: 'This endpoint recovers agency credit based on authenticated user.',
  })
  @Post('/viewcredit')
  async viewCredit(@Body(ValidationPipe) viewCreditRequest: ViewCreditRequest) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const response = await this.agencyService.viewCredit(viewCreditRequest);
    return response;
  }

  @ApiOperation({
    summary: 'Modify a user',
    description: 'This endpoint modifies a user data such as their status.',
  })
  @Put('/modifyagent')
  async modifyAgent(@Body(ValidationPipe) modifyAgentDto: ModifyAgentDto) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const response = await this.agencyService.update(modifyAgentDto);
    return response;
  }

  @ApiOperation({
    summary: 'Change status a user',
    description: 'This endpoint modifies a details and status.',
  })
  @Put('/changestatus')
  async changeStatus(@Body(ValidationPipe) modifyAgentDto: ModifyAgentDto) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const response = await this.agencyService.updateStatus(modifyAgentDto);
    return response;
  }

  @ApiOperation({
    summary: 'Recover agents',
    description: 'This endpoint retrieves the list of agents according to IATA',
  })
  @Post('/getagents')
  async GetAgents(@Body(ValidationPipe) agentListRequest: AgentListRequest) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const response = await this.agencyService.getAgentsList(agentListRequest);
    return response;
  }

  @ApiOperation({
    summary: 'Retrieve agent details',
    description: 'This endpoint retrieves agent details based on their ID',
  })
  @Post('/getagent')
  async GetAgent(@Body(ValidationPipe) agentRequest: AgentRequest) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const response = await this.agencyService.getAgent(agentRequest);
    return response;
  }
}
