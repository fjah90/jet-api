import { CrudGlobalConfig } from '@nestjsx/crud';

export const CrudConfiguration: CrudGlobalConfig = {
  query: {
    limit: 10,
    maxLimit: 100,
    alwaysPaginate: true,
  },
  routes: {
    exclude: ['createManyBase'],
  },
};
