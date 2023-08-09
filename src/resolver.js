import Resolver from '@forge/resolver';
import { searchSpotify } from './spotifyApiClient';
import { defaultConfig } from './SpotifyPlayerConfig';

const resolver = new Resolver();

resolver.define('searchSpotify', async (req) => {
  // console.log(req);
  const context = req.context;
  const extension = context.extension;
  const searchText = extension && extension.config && extension.config.searchText ? extension.config.searchText : defaultConfig.searchText
  const maxTracks = extension && extension.config ? extension.config.maxTracks : 10
  console.log(`searchText = ${searchText}.`);
  const searchResult = await searchSpotify(searchText, maxTracks);
  return JSON.stringify(searchResult);
});

export const handler = resolver.getDefinitions();
