import React, { useState, useEffect, useMemo } from "react";
import classNames from "classnames/bind";
import styles from "./components/GlobalStyles/GlobalStyles.scss";
import "./scss/App.scss";

import { ReactComponent as MicrophoneIcon } from "./icons/microphone-solid.svg";
import { ReactComponent as PauseIcon } from "./icons/pause-solid.svg";
import { ReactComponent as SearchIcon } from "./icons/magnifying-glass-solid.svg";

const cx = classNames.bind(styles);

function App() {
    const [topk, setTopk] = useState(10); // state for topk
    const [videoList, setVideoList] = useState([]); // state for displaying video list
    const [query, setQuery] = useState(""); // state for saving user query (in text form)
    const [videoGallery, setVideoGallery] = useState([]); // Combined state for videos, metadata, and thumbnails
    const [isRecording, setIsRecording] = useState(false); // State for Recording button

    // Create memoized version of gallery render
    const videoGalleryRender = useMemo(() => {
        return videoGallery.map((video, index) => {
            console.log(video);
            return (
                <div key={index} className={cx("video-card")}>
                    <a
                        href={`${video.watch_url}&t=${
                            video.frame_start / 25 + 1
                        }s`}
                    >
                        <img src={video.thumbnail} alt={video.video} />
                    </a>
                </div>
            );
        });
    }, [videoGallery]);

    // This function works the same as zfill() in python
    function zfill(str, width) {
        while (str.length < width) {
            str = "0" + str;
        }
        return str;
    }

    // This function is to make sure we don't accidentally type letters into the "Top K" form
    function handleTopKInput(event) {
        const value = event.target.value;
        // Chỉ cho phép giữ lại các ký tự số
        const sanitizedValue = value.replace(/[^0-9]/g, "");
        setTopk(sanitizedValue);
    }

    // This function handles user query
    function handleQueryInput(event) {
        setQuery(event.target.value);
    }

    // This function returns videos from user query
    async function handleDisplayVideos() {
        try {
            const response = await fetch("http://localhost:4433/asr_search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ query, topk: parseInt(topk, 10) }),
            });

            if (response.ok) {
                const videoList = await response.json();
                const combinedData = await Promise.all(
                    videoList.map(async (video) => {
                        const metadataResponse = await fetchJsonData(
                            `${video.video}.json`
                        );
                        if (metadataResponse) {
                            // Construct the thumbnail file name
                            const thumbnail = zfill(
                                String(video.frame_start),
                                6
                            );
                            //Fetch the image URL using the fetchImageThumbnail function
                            const thumbnailUrl = await fetchImageThumbnail(
                                video.video.split("_")[0],
                                video.video,
                                thumbnail
                            );

                            return {
                                ...video,
                                watch_url: metadataResponse.watch_url,
                                thumbnail: thumbnailUrl,
                            };
                        }
                    })
                );
                setVideoGallery(combinedData);
            } else {
                console.error("API request failed");
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }

    // This function returns JSON metadata of every video in the result
    async function fetchJsonData(path) {
        try {
            const response = await fetch(
                `http://localhost:4433/json_data/${path}`,
                {
                    method: "GET",
                }
            );

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.error("API request failed");
                return null; // Return null if the fetch fails
            }
        } catch (error) {
            console.error("An error occurred:", error);
            return null; // Return null in case of an error
        }
    }

    // This function returns image metadata (video thumbnail) of every video in the result
    async function fetchImageThumbnail(batch, video, name) {
        try {
            const imageUrl = `http://localhost:4433/image_data/${batch}/${video}/${name}.jpg`;
            const response = await fetch(imageUrl);

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            // Since image data is a blob, we need to convert it to a URL
            const imageBlob = await response.blob();
            const imageObjectURL = URL.createObjectURL(imageBlob);
            return imageObjectURL;
        } catch (error) {
            console.error("Error fetching image thumbnail:", error);
            return ""; // Return an empty string or a placeholder image URL in case of an error
        }
    }

    // Function to toggle Recording state
    function toggleRecording() {
        setIsRecording(!isRecording);
    }

    // Effect will be launched everytime user hits the "Start Recording" button
    useEffect(() => {
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = "vi-VN";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            console.log("Recognition started");
        };

        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    setQuery(event.results[i][0].transcript);
                }
            }
        };

        recognition.onend = () => {
            console.log("Recognition ended");
            setIsRecording(false);
        };

        if (isRecording) {
            recognition.start();
        } else {
            recognition.stop();
        }

        // Cleanup
        return () => {
            recognition.stop();
            recognition.onresult = null;
            recognition.onend = null;
        };
    }, [isRecording]);

    return (
        <React.Fragment>
            <div className={cx("header")}>
                <div className={cx("input")}>
                    <span>
                        Query
                        <input
                            type="text"
                            value={query}
                            onInput={handleQueryInput}
                            className={cx("query")}
                        />
                    </span>
                    <span>
                        Top K
                        <input
                            type="text"
                            value={topk}
                            onInput={handleTopKInput}
                            className={cx("topk")}
                        />
                    </span>
                </div>
                <button
                    onClick={toggleRecording}
                    className={cx("record-button", {
                        "record-button-active": isRecording,
                    })}
                >
                    {isRecording ? (
                        <PauseIcon className={cx("pause-icon")} />
                    ) : (
                        <MicrophoneIcon className={cx("microphone-icon")} />
                    )}
                    {isRecording ? "Listening..." : "Record"}
                </button>
                <button
                    onClick={handleDisplayVideos}
                    className={cx("search-button")}
                >
                    <SearchIcon className={cx("search-icon")} />
                    Search
                </button>
            </div>
            <div className={cx("main")}>
                <div className={cx("gallery")}>{videoGalleryRender}</div>
            </div>
        </React.Fragment>
    );
}

export default App;
