import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Example } from './entities/example.entity';

@Injectable()
export class ExamplesService extends TypeOrmCrudService<Example> {
  constructor(@InjectRepository(Example) exampleRepository) {
    super(exampleRepository);
  }
}
