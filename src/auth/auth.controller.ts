import { Controller, Post, Body, ValidationPipe, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserSignInDto } from './dto/user-sign-in.dto';
import { StatsdService } from 'src/statsd/statsd.service';
import { RegenerateTokenDto } from './dto/regenerate-token.dto';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';

@UseInterceptors(SentryInterceptor)
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private statsdService: StatsdService) {}

  @ApiExcludeEndpoint()
  @Post('/signup')
  async signUp(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    await this.statsdService.increment('_auth_signup_post');
    const start = Date.now();
    const response = await this.authService.signUp(createUserDto);
    const end = Date.now();
    await this.statsdService.timing('_auth_signup_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Logs in a user',
    description: 'This endpoint logs in a user in the application.',
  })
  @Post('/signin')
  async signIn(@Body(ValidationPipe) userSignInDto: UserSignInDto) {
    // await this.statsdService.increment('auth_signin_post');
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const start = Date.now();
    const response = await this.authService.signIn(userSignInDto);
    const end = Date.now();
    // await this.statsdService.timing('auth_signin_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Retrieves a security token',
    description: 'This endpoint retrieves a security token (radixx) for the authenticated user.',
  })
  @Post('/login')
  async test() {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    // await this.statsdService.increment('auth_login_post');
    // const start = await Date.now();
    const response = await this.authService.retrieveSecurityToken();
    // const end = await Date.now();
    // await this.statsdService.timing('auth_login_post_response_time', end - start);
    return response;
  }

  @ApiExcludeEndpoint()
  @Post('/regenerate')
  async regenerateToken(@Body(ValidationPipe) regenerateTokenDto: RegenerateTokenDto) {
    if (!JSON.parse(process.env.SHOW_SWAGGER))
      throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const response = await this.authService.regenerateToken(regenerateTokenDto.token);
    return response;
  }
}
