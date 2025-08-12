import { useEffect, useRef, useState } from "react";
import * as tmi from "tmi.js";
import { useGetWordList } from "./useGetWordList.tsx";

function App() {
  const initialized = useRef<boolean>(false);

  const urlParams = new URLSearchParams(window.location.search);

  const CHANNEL = urlParams.get("channel");
  const WEBSITE = urlParams.get("site");
  const SPEED = urlParams.get("speed");
  const INITIAL_CLUES = urlParams.get("initialclues");
  const RESTART_SPEED = urlParams.get("restartspeed");
  const DELAY = urlParams.get("delay");

  const word = useRef<string>();
  const wordList = useRef<string[] | null>(null);
  const isGameOver = useRef<boolean>(false);
  const revealedCount = useRef<number>(INITIAL_CLUES ? Number(INITIAL_CLUES) : 2);
  const intervalIdRef = useRef<number | null>(null);

  const [displayWord, setDisplayWord] = useState<string[]>([]);
  const [winner, setWinner] = useState<string>();

  const [wordListInitialized, setWordListInitialized] = useState<boolean>(false);

  const clueSpeed = SPEED ? Number(SPEED) * 1000 : 15000;
  const clueDelay = DELAY ? Number(DELAY) * 1000 : 0;
  const restartSpeed = RESTART_SPEED ? Number(RESTART_SPEED) * 1000 : 5000;

  const fetchedWordList = useGetWordList();

  if (!CHANNEL)
    return (
      <>
        You need to put the twitch channel in the url! example:{" "}
        <a href="https://repo.pogly.gg/wordguesser/?channel=bobross&site=twitch">
          https://repo.pogly.gg/wordguesser/?channel=bobross&site=twitch
        </a>
        !
      </>
    );
  if (!WEBSITE)
    return (
      <>
        You need to put the website channel in the url! (Kick or Twitch) example:{" "}
        <a href="https://repo.pogly.gg/wordguesser/?channel=bobross&site=twitch">
          https://repo.pogly.gg/wordguesser/?channel=bobross&site=twitch
        </a>
        !
      </>
    );
  if (WEBSITE.toLowerCase() !== "twitch" && WEBSITE.toLowerCase() !== "kick") {
    return (
      <>
        <b>Error:</b> The <code>site</code> parameter must be either <code>twitch</code> or <code>kick</code>.<br />
        You provided: <code>{WEBSITE}</code>
      </>
    );
  }
  
  useEffect(() => {
    const channel: string = CHANNEL.toLowerCase();
    if (initialized.current) return;
    initialized.current = true;

    if (WEBSITE.toLowerCase() == "twitch") {
      const twitchClient = tmi.Client({ channels: [channel] });

      twitchClient.connect();

      twitchClient.on("connected", () => {
        console.log("Connected to twitch chat!");
      });

      twitchClient.on("message", (_channel: string, tags: tmi.ChatUserstate, message: string) => {
        if (!tags.username || !message) return;
        if (isGameOver.current) return;

        if (/[\u0020\uDBC0]/.test(message)) {
          message = message.slice(0, -3);
        }

        if (message.toLowerCase() === word.current!.toLowerCase()) {
          isGameOver.current = true;
          setDisplayWord(word.current!.split(""));

          if (intervalIdRef.current !== null) clearInterval(intervalIdRef.current);

          setWinner(tags.username);

          const timer = window.setInterval(() => {
            clearInterval(timer);
            initializeGame();
          }, restartSpeed);
        }
      });
    }
    else if (WEBSITE.toLowerCase() == "kick") {
      // Kick setup
      const wsURL =
        "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false";
      let socket: WebSocket;

      async function getKickChatroomID(): Promise<string> {
        const url = `https://kick.com/api/v2/channels/${channel}/chatroom`;
        const response = await fetch(url);
        const data = await response.json();
        return `chatrooms.${data.id}.v2`;
      }

      async function startKickChat() {
        const chatroom_id = await getKickChatroomID();
        socket = new WebSocket(wsURL);

        socket.onopen = () => {
          const subscribeMsg = JSON.stringify({
            event: "pusher:subscribe",
            data: { auth: "", channel: chatroom_id }
          });
          socket.send(subscribeMsg);
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.event === "App\\Events\\ChatMessageEvent") {
              const data = JSON.parse(parsed.data);
              const username = data.sender.username;
              const message = data.content;
              if (username && message && !isGameOver.current) {
                handleGuess(username, message);
              }
            }
          } catch (err) {
            console.error("Kick message parse error:", err);
          }
        };

        socket.onerror = (err) => {
          console.error("Kick WebSocket error:", err);
        };
      }

      startKickChat();
    }
  }, []);


  useEffect(() => {
    if (!fetchedWordList || wordListInitialized) return;
    setWordListInitialized(true);
    wordList.current = fetchedWordList;

    initializeGame();
  }, [fetchedWordList]);

  const handleGuess = (username: string, message: string) => {
    if (/[ \uDBC0]/.test(message)) {
      message = message.slice(0, -3);
    }

    if (message.toLowerCase() === word.current!.toLowerCase()) {
      isGameOver.current = true;
      setDisplayWord(word.current!.split(""));
      if (intervalIdRef.current !== null) clearInterval(intervalIdRef.current);
      setWinner(username);

      const timer = window.setInterval(() => {
        clearInterval(timer);
        initializeGame();
      }, restartSpeed);
    }
  };

  const initializeGame = () => {
    if (!wordList.current) return;
    const clueCount = INITIAL_CLUES ? Number(INITIAL_CLUES) : 2;
    revealedCount.current = clueCount;

    const selectedWord: string = wordList.current[Math.floor(Math.random() * wordList.current.length)];
    word.current = decodeURIComponent(selectedWord);

    setDisplayWord(selectedWord.split("").map((letter, index) => (index < clueCount ? letter : "_")));
    isGameOver.current = false;

    const interval = setInterval(() => {
      if (revealedCount.current >= word.current!.length) return clearInterval(interval);
      revealedCount.current += 1;

      setDisplayWord((prev) =>
        word.current!.split("").map((letter, index) => (index < revealedCount.current ? letter : prev[index] || "_"))
      );
    }, clueSpeed + clueDelay);

    intervalIdRef.current = interval;
    setWinner("");
  };

  return (
    <div className="game-container">
      <h2>Guess the word!</h2>
      <h3>{displayWord.join(" ")}</h3>
      {isGameOver.current ? <h3 className="congrats">🎉 {winner} guessed correctly! 🎉</h3> : <h3></h3>}
    </div>
  );
}

export default App;
