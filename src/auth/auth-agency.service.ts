import { Injectable } from '@nestjs/common';
import { Auth_AgencyRemoteRepository } from './auth-agency.remote-repository';
import { ConfigService } from '@nestjs/config';
import { Configuration } from './interface/configuration.interface';
import { AgencySignInDto } from './dto/agency-sign-in.dto';
import { AgentForgotPasswordDto } from './dto/agent-forgot-password.dto';
import { ValidateSecurityTokenDto } from './dto/validate-security-token.dto';
import { log } from 'console';

@Injectable()
export class Auth_AgencyService {
  private radixxUsername: string;
  private radixxPassword: string;

  constructor(
    private configService: ConfigService<Configuration>,
    private authRemoteRepository: Auth_AgencyRemoteRepository
  ) {
    this.radixxUsername = this.configService.get<string>('RADIXX_USERNAME');
    this.radixxPassword = this.configService.get<string>('RADIXX_PASSWORD');
  }

  public async retrieveSecurityToken() {
    
    return await this.authRemoteRepository.retrieveSecurityToken({
      username: this.radixxUsername,
      password: this.radixxPassword,
    });
  }

  public async validateSecurityToken(ValidateSecurityToken: ValidateSecurityTokenDto) {
    return await this.authRemoteRepository.validateSecurityToken({ token: ValidateSecurityToken.token });
  }
  async signIn(agencySignInDto: AgencySignInDto) {
    try {
      console.log('entro1');
      const token = await this.retrieveSecurityToken();
      console.log('entro2');
      const login = await this.authRemoteRepository.loginTravelAgent(token, agencySignInDto);
      console.log('entro3');
      if (login === true) {
        return token;
      }
      return login;
    } catch (error) {
      console.error(`[ERROR]: ${error}`);
    }
  }

  async forgotPassword(agentForgotDto: AgentForgotPasswordDto) {
    try {
      const result: boolean = await this.authRemoteRepository.forgottenUserPassword(
        await this.retrieveSecurityToken(),
        agentForgotDto.email,
        agentForgotDto.username
      );
      return result;
    } catch (error) {
      console.error(`[ERROR]: ${error}`);
    }
  }
}
