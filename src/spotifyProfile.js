import { AuthProfile } from '@forge/response';

/*interface ProfileRetrieverParameters {
  status: number;
  body: {
    [key: string]: any;
  };
}*/

export const retriever = (response /*: ProfileRetrieverParameters*/)/*: AuthProfile*/ => {
  const { status, body: externalProfile } = response;
  console.log(`response = `, response)
  console.log(`externalProfile = `, externalProfile)
  if (status === 200) {
    // https://developer.atlassian.com/platform/forge/implement-a-dynamic-profile-retriever-with-external-authentication/#limitations
    const displayName = externalProfile.email || externalProfile.display_name;
    return new AuthProfile({
      id: externalProfile.id,
      displayName: displayName,
      avatarUrl: externalProfile.images && externalProfile.images.length ? externalProfile.images[0].url : ''
    });
  } else {
    throw new Error(`Could not determine profile information. HTTP ${status}: ${externalProfile.error.message}`);
  }
}
