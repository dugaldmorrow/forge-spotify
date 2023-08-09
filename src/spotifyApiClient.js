import api, { route } from '@forge/api';

export const searchSpotify = async (searchText, maxTracks) => {
  const spotify = api.asUser().withProvider('spotify-api-auth', 'spotify-api')
  console.log(`Checking if user has Spotify credentials...`);
  if (!await spotify.hasCredentials()) {
    console.log(`Requesting Spotify credentials...`);
    await spotify.requestCredentials();
  }
  console.log(`Searching Spotify API for ${searchText}...`);
  const response = await spotify.fetch(route`/v1/search?q=${searchText}&type=track`);
  if (response.ok) {
    const searchData = await response.json();
    // console.log(JSON.stringify(searchData, null, 2));
    if (searchData.tracks && searchData.tracks.items) {
      const items = searchData.tracks.items;
      // console.log(JSON.stringify(items[0], null, 2));
      let itemUris = [];
      for (const item of items) {
        if (item && item.uri) {
          itemUris.push(item.uri);
          if (itemUris.length >= maxTracks) {
            break;
          }
        }
      }
      return {
        status: 200,
        statusText: `Success`,
        text: `Found ${items.length} tracks`,
        itemUris: itemUris
      }
    } else {
      return {
        status: 404,
        statusText: `Not Found`,
        text: `Could not find any tracks`,
      }
    }
  } else {
    return {
      status: response.status,
      statusText: response.statusText,
      text: await response.text(),
    }
  }
}
