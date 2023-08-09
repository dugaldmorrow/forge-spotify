import React, { useEffect, useRef, useState } from 'react';
import { invoke, view } from '@forge/bridge';

const debug = false;

const SpotifyPlayer = () => {
  console.log(`Spotify: SpotifyPlayer rendering...`);
  const EMPTY_PLAYLIST = {
    playedItemUris: [],
    unplayedItemUris: []
  };

  const getMacroConfig = async () => {
    const context = await view.getContext();
    console.log(`Spotify: getMacroConfig: context = ${JSON.stringify(context, null, 2)}`);
    const config = context && context.extension && context.extension.config ? context.extension.config : {};
    console.log(`Spotify: getMacroConfig: config = ${JSON.stringify(config, null, 2)}`);
    return config;
  }

  const [searchResultStatus, setSearchResultStatus] = useState(0);
  const [playbackCompletionPercent, setPlaybackCompletionPercent] = useState(0);
  const [playlist, setPlaylist] = useState(EMPTY_PLAYLIST);
  const embedControllerRef = useRef({});

  const getPlaylist = () => {
    return playlist;
  }

  const getCurrentItemUriFromPlaylist = (playlist) => {
    console.log(`Spotify: Getting current item URI from ${JSON.stringify(playlist, null, 2)}`);
    return playlist.unplayedItemUris.length ? playlist.unplayedItemUris[0] : undefined
  }

  const getCurrentItemUri = () => {
    const playlist = getPlaylist();
    return getCurrentItemUriFromPlaylist(playlist);
  }

  const applySearchResult = (searchResultData) => {
    if (searchResultData && searchResultData.itemUris) {
      const newPlaylist = {
        playedItemUris: [],
        unplayedItemUris: searchResultData.itemUris
      };
      console.log(`Spotify: Setting item URIs to ${JSON.stringify(newPlaylist, null, 2)} from search result data...`);
      setPlaylist(newPlaylist);
      return newPlaylist;
    } else {
      return EMPTY_PLAYLIST;
    }
  }

  const isAtLastTrack = () => {
    const playlist = getPlaylist();
    return playlist.unplayedItemUris.length <= 1;
  }

  const nextItem = () => {
    const newPlaylist = {
      playedItemUris: [],
      unplayedItemUris: []
    }
    const playlist = getPlaylist();
    console.log(`Spotify: In nextItem, item URIs = ${JSON.stringify(playlist, null, 2)}.`);
    if (playlist.unplayedItemUris.length > 1) {
      for (const playedItemUri of playlist.playedItemUris) {
        newPlaylist.playedItemUris.push(playedItemUri);
      }
      for (let i = 0; i < playlist.unplayedItemUris.length; i++) {
        const itemUri = playlist.unplayedItemUris[i];
        if (i === 0) {
          newPlaylist.playedItemUris.push(itemUri);
        } else {
          newPlaylist.unplayedItemUris.push(itemUri);
        }
      }
    } else {
      for (const itemUri of playlist.playedItemUris) {
        newPlaylist.unplayedItemUris.push(itemUri);
      }
      for (const itemUri of playlist.unplayedItemUris) {
        newPlaylist.unplayedItemUris.push(itemUri);
      }
    }
    console.log(`Spotify: Setting item URIs to ${JSON.stringify(newPlaylist, null, 2)} after navigating to next...`);
    setPlaylist(newPlaylist);
    if (newPlaylist.unplayedItemUris.length) {
      console.log(`Spotify: Loading item ${newPlaylist.unplayedItemUris[0]}...`);
      embedControllerRef.current.loadUri(newPlaylist.unplayedItemUris[0]);
    }
  }

  const loadCurrentItemUriFromData = (playlist) => {
    const currentItemUri = getCurrentItemUriFromPlaylist(playlist);
    console.log(`Spotify: Loading current URI ${currentItemUri}...`);
    const embedController = embedControllerRef.current;
    console.log(`Spotify: embedController = `, embedController);
    if (embedController) {
      if (currentItemUri) {
        if (embedController.loadUri) {
          embedController.loadUri(currentItemUri);
        } else {
          console.error(`Spotify: embedController does not have a loadUri method!`);
        }
      }
      console.log(`Spotify: Finished setting item to ${currentItemUri}.`);
    } else {
      console.log(`Spotify: Deferred loading URI ${currentItemUri}.`);
    }
  }

  const isOptionSelected = (optionName, options) => {
    for (const option of options) {
      if (option === optionName) {
        return true;
      }
    }
    return false;
  }

  useEffect(() => {
    (async () => {
      try {
        if (playbackCompletionPercent === 100) {
          console.log(`Spotify: isAtLastTrack() = ${isAtLastTrack()}.`);
          let loadNextItem = false;
          if (isAtLastTrack()) {
            const macroConfig = await getMacroConfig();
            console.log(`Spotify: macroConfig = ${JSON.stringify(macroConfig, null, 2)}.`);
            loadNextItem = macroConfig && macroConfig.options && isOptionSelected('loop', macroConfig.options);
          } else {
            loadNextItem = true;
          }
          if (loadNextItem) {
            nextItem();
            embedControllerRef.current.play();
          }
        }
      } catch (error) {
        console.log(`Spotify: unexpected error trapped in playbackUpdateListener:`, error);
      }
    })();
  }, [playbackCompletionPercent]);
  
  const playbackUpdateListener = (event) => {
    console.log(`Spotify: Received playback event: ${JSON.stringify(event, null, 2)}`);
    const percent = Math.round(100.0 * event.data.position / event.data.duration);
    setPlaybackCompletionPercent(percent);
  }

  const initialisePlayer = () => {
    console.log(`Spotify: Initialising player...`);
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      try {
        console.log(`Spotify: onSpotifyIframeApiReady event received ${IFrameAPI}.`);
        const element = document.getElementById('spotify-frame');
        const currentItemUri = getCurrentItemUri();
        if (element) {
          let options = {
            width: '100%',
            height: 120,
            uri: currentItemUri
          };
          const createControllerCallback = (embedController) => {
            try {
              console.log(`Spotify: Setting embedController to `, embedController);
              console.log(`Spotify: embedController = ${embedController}.`);
              embedControllerRef.current = embedController;
              const currentItemUri = getCurrentItemUri();
              if (currentItemUri) {
                if (embedController.loadUri) {
                  embedController.loadUri(currentItemUri);
                } else {
                  console.error(`Spotify: embedController does not have a loadUri method!`);
                }
                console.log(`Spotify: Initialised player with URI ${currentItemUri}.`);
              } else {
                console.log(`Spotify: There is no current URI to load.`);
              }
              embedController.addListener('playback_update', playbackUpdateListener);
            } catch (error) {
              console.log(`Spotify: unexpected error trapped in createControllerCallback:`, error);
            }
          };
          IFrameAPI.createController(element, options, createControllerCallback);
        } else {
          console.error(`Spotify: Did not find the player container element!`);
        }
      } catch (error) {
        console.log(`Spotify: unexpected error trapped in onSpotifyIframeApiReady:`, error);
      }
    };
    console.log(`Spotify: setting onSpotifyIframeApiReadyDefined to true...`);

    return () => {
      if (embedControllerRef.current) {
        embedControllerRef.current.destroy();
      }
    }
  }
  useEffect(initialisePlayer, []);

  const searchForItems = async () => {
    console.log(`Spotify: Searching for tracks to play...`);
    try {
      setSearchResultStatus(0);
      const searchResult = await invoke('searchSpotify');
      console.log(`Spotify: searchResult = ${searchResult}.`);
      const searchResultData = JSON.parse(searchResult);
      setSearchResultStatus(searchResultData.status);
      // if (searchResultData.status === 200) {
        if (searchResultData.itemUris) {
          console.log(`Spotify: Updating items to ${JSON.stringify(searchResultData.itemUris)}...`);
          const currentUris = applySearchResult(searchResultData);
          loadCurrentItemUriFromData(currentUris);
        }
      // }
    } catch (error) {
      console.log(`Spotify: unexpected error trapped in searchForItems:`, error);
    }
  }
  useEffect(searchForItems, []);

  const renderSearchIndicator = () => {
    const message = searchResultStatus === 0 ? 'Searching for an item to play...' : `Search error: ${searchResultStatus}`;
    return (
      <div>
        {message}
      </div>
    );
  }
  const renderDebug = () => {
    return (
      <>
        <div>
          Playback completion = {playbackCompletionPercent}%
        </div>
          <div>
          {JSON.stringify(playlist)}
          </div>
      </>
    )
  }
  const renderPlayer = () => {
    const currentItemUri = getCurrentItemUri();
    const hasCurrentItem = !!currentItemUri;
    const style = {
      // display: hasCurrentItem ? 'block' : 'none'
    }
    const renderedLoadingItemIndicator = hasCurrentItem ? null : renderSearchIndicator();
    return (
      <>
        {renderedLoadingItemIndicator}
        <div id="spotify-frame" style={style}></div>
      </>
    );
  }
  return (
    <div>
      {debug ? renderDebug() : null}
      {renderPlayer()}
    </div>
  );
}

export default SpotifyPlayer;
