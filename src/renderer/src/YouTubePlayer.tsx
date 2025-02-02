// src/components/YouTubePlayer.tsx
import React, { useEffect, useState } from 'react';

interface VideoData {
  video_id: string;
  title: string;
  author: string;
  duration: number;
}

interface YouTubePlayerProps {
  videoId?: string;
  playlistId?: string;
  width?: number;
  height?: number;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}


const postToSlack = async (player: any) => {
    console.log("Posting to Slack...")
  try {
    // Send the video data (e.g. title) to the main process.
    const result = await window.electron.ipcRenderer.invoke(
      'post-to-slack',
      player.getVideoData()
    );
    console.log("Slack update result:", result);
  } catch (error) {
    console.error("Error posting to Slack:", error);
  }
};

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  playlistId,
  width = 300,
  height = 200
}) => {
  const [playerStatus, setPlayerStatus] = useState<string>("Paused");
  const [currentVideoData, setCurrentVideoData] = useState<VideoData | null>(
    null
  );

  useEffect(() => {
    // Load YouTube IFrame API if not available
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = loadPlayer;
    } else {
      loadPlayer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId, videoId]);

  const loadPlayer = () => {
    const playerConfig: any = {
      height: `${height}`,
      width: `${width}`,
      playerVars: {
        autoplay: 0,
        controls: 1
      },
      events: {
        onReady: (event: any) => {
          console.log("Player ready:", event);
          updateVideoMetadata(event.target);
        },
        onStateChange: (event: any) => {
          console.log("Player state change:", event);
          setPlayerStatus(
            event.data === window.YT.PlayerState.PLAYING ? "Playing" : "Paused"
          );

          // When a video starts playing, update metadata and post to Slack.
          if (event.data === window.YT.PlayerState.PLAYING) {
            updateVideoMetadata(event.target);
            postToSlack(event.target);
          }
        }
      }
    };

    // If a playlistId is provided, configure the player to load the playlist.
    if (playlistId) {
      playerConfig.playerVars = {
        ...playerConfig.playerVars,
        listType: "playlist",
        list: playlistId
      };
      if (videoId) {
        playerConfig.videoId = videoId;
      }
    } else if (videoId) {
      playerConfig.videoId = videoId;
    }

    new window.YT.Player("yt-player", playerConfig);
  };

  const updateVideoMetadata = (player: any) => {
    const data = player.getVideoData();
    const duration = player.getDuration();
    console.log("Video data:", data, "Duration:", duration);
    const videoData: VideoData = {
      video_id: data.video_id,
      title: data.title,
      author: data.author,
      duration: duration
    };
    setCurrentVideoData(videoData);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>YouTube Mini Player</h2>
      <div id="yt-player" style={{ margin: "auto" }}></div>
      <p>Status: {playerStatus}</p>
      {currentVideoData && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Now Playing:</h3>
          <p>
            <strong>{currentVideoData.title}</strong> by{" "}
            {currentVideoData.author}
          </p>
          <p>
            Video ID: <code>{currentVideoData.video_id}</code>
          </p>
          <p>Duration: {currentVideoData.duration} seconds</p>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;
