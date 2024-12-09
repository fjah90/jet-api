import { Injectable } from '@nestjs/common';
import { AgencyRemoteRepository } from './agency.remote-repository';
import { AgentListRequest } from './dto/agent-list.request';
import { AgentRequest } from './dto/agent-request';
import { ModifyAgentDto } from './dto/modify-agent.dto';
import { ViewCreditRequest } from './dto/view-credit.request';
import { ChangePassRequest } from './dto/change-pass.request';
@Injectable()
export class AgencyService {
  constructor(private agencyRemoteRepository: AgencyRemoteRepository) {}
  public async changePass(changePassDto: ChangePassRequest) {
    return await this.agencyRemoteRepository.changePassword(changePassDto);
  }

  public async viewCredit(viewCreditDto: ViewCreditRequest) {
    return await this.agencyRemoteRepository.viewCredit(viewCreditDto.token);
  }

  public async update(modifyAgentDto: ModifyAgentDto) {
    return await this.agencyRemoteRepository.update(modifyAgentDto, 'ModifyAgent');
  }

  public async updateStatus(updateStatus: ModifyAgentDto) {
    return await this.agencyRemoteRepository.update(updateStatus, 'ModifyAgentStatus');
  }

  public async getAgentsList(agentListRequest: AgentListRequest) {
    return await this.agencyRemoteRepository.getAgentsList(agentListRequest.token, agentListRequest.IATA);
  }

  public async getAgent(agentRequest: AgentRequest) {
    return await this.agencyRemoteRepository.getAgent(agentRequest.token, agentRequest.UserId, agentRequest.IATA);
  }
}
