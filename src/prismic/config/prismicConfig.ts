// node-fetch is used to make network requests to the Prismic Rest API.
// In Node.js Prismic projects, you must provide a fetch method to the

import fetch from 'node-fetch';
import * as prismic from '@prismicio/client';

export const client = async (): Promise<prismic.Client> => {
  const repoName = process.env.PRISMIC_REPO_NAME as string; // Fill in your repository name.
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN as string;
  return prismic.createClient(repoName, {
    fetch,
    accessToken,
  });
};
