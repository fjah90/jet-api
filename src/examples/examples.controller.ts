import { Controller, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@nestjsx/crud';
import { BaseAuthGuard } from '../auth/guard/base.guard';
import { Example } from './entities/example.entity';
import { ExamplesService } from './examples.service';

@Crud({
  model: {
    type: Example,
  },
})
@UsePipes(ValidationPipe)
@UseGuards(BaseAuthGuard)
@ApiTags('Example')
@ApiBearerAuth()
@Controller('examples')
export class ExamplesController implements CrudController<Example> {
  constructor(public service: ExamplesService) {}
}
