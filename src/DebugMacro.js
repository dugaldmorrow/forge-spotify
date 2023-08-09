import ForgeUI, { render, Fragment, Macro, Text, Code, useState } from "@forge/ui";
import { searchSpotify } from './spotifyApiClient';

const RenderSpotifyAuthApp = () => {
  const [data] = useState(async () => {
    return await searchSpotify('cordiale', 2);
  })
  return (
    <Fragment>
      <Code text={JSON.stringify(data, null, 2)} language="json" showLineNumbers />
    </Fragment>
  );
};

export const renderSpotifyAuthMacro = render(
  <Macro
    app={<RenderSpotifyAuthApp />}
  />
);
