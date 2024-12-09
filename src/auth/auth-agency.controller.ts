import { Controller, Post, Body, ValidationPipe, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { Auth_AgencyService } from './auth-agency.service';
import { StatsdService } from 'src/statsd/statsd.service';
import { AgencySignInDto } from './dto/agency-sign-in.dto';
import { AgentForgotPasswordDto } from './dto/agent-forgot-password.dto';
import { ValidateSecurityTokenDto } from './dto/validate-security-token.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Auth-Agency')
@Controller('auth-agency')
export class Auth_AgencyController {
  constructor(private authAgencyService: Auth_AgencyService, private statsdService: StatsdService) {}

  @ApiOperation({
    summary: 'Retrieves a security token',
    description: 'This endpoint retrieves a security token (radixx) for the authenticated user.',
  })
  /*@Post('/login')
  async logIn() {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const response = await this.authAgencyService.retrieveSecurityToken();
    return response;
  }
*/
  @ApiOperation({
    summary: 'Login a Agent Travel',
    description: 'This endpoint authenticated a agent travel user.',
  })
  @Post('/signin')
  async signIn(@Body(ValidationPipe) agencySignInDto: AgencySignInDto) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const response = await this.authAgencyService.signIn(agencySignInDto);
    return response;
  }

  @ApiOperation({
    summary: 'Retrieves a Forgotten User Password',
    description: 'This endpoint retrieves a password for the user.',
  })
  @Post('/forgotpassword')
  async forgotPassword(@Body(ValidationPipe) agentForgotDto: AgentForgotPasswordDto) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const start = Date.now();
    const response = await this.authAgencyService.forgotPassword(agentForgotDto);
    const end = Date.now();
    await this.statsdService.timing('_authAgency_forgotPassword_post_response_time', end - start);
    return response;
  }
  @ApiOperation({
    summary: 'Validate a token',
    description: 'This endpoint validate if a token is secure',
  })
  @Post('/validatesecuritytoken')
  async validateSecurityToken(@Body(ValidationPipe) ValidateSecurityTokenDto: ValidateSecurityTokenDto) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const response = await this.authAgencyService.validateSecurityToken(ValidateSecurityTokenDto);
    return response;
  }
}
