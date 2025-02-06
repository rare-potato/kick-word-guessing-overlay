import { useEffect, useRef, useState } from "react";
import * as tmi from "tmi.js";

const defaultWords = [
  "apple",
  "banana",
  "cherry",
  "grapes",
  "orange",
  "peanut",
  "tomato",
  "butter",
  "cheese",
  "potato",
  "carrot",
  "pepper",
  "muffin",
  "cookie",
  "donuts",
  "coffee",
  "butter",
  "bottle",
  "pencil",
  "marker",
  "laptop",
  "tablet",
  "mobile",
  "window",
  "mirror",
  "guitar",
  "violin",
  "drums",
  "pillow",
  "cushion",
  "tissue",
  "basket",
  "hanger",
  "jacket",
  "sweater",
  "button",
  "breeze",
  "forest",
  "garden",
  "rocket",
  "planet",
  "cosmos",
  "galaxy",
  "shadow",
  "tunnel",
  "bridge",
  "castle",
  "island",
  "frozen",
  "sunset",
  "desert",
  "coffin",
  "turkey",
  "butter",
  "pencil",
  "cloudy",
  "friend",
  "school",
  "pocket",
  "singer",
  "artist",
  "dancer",
  "writer",
  "reader",
  "farmer",
  "hunter",
  "driver",
  "doctor",
  "lawyer",
  "baker",
  "sailor",
  "hammer",
  "socket",
  "branch",
  "silver",
  "gadget",
  "sponge",
  "anchor",
  "ladder",
  "helmet",
  "ribbon",
  "flames",
  "danger",
  "muscle",
  "shadow",
  "wallet",
  "pebble",
  "marble",
  "candle",
  "jungle",
  "desert",
  "winter",
  "summer",
  "spring",
  "autumn",
  "melody",
  "garden",
  "church",
  "theory",
  "saddle",
];

function App() {
  const initialized = useRef<boolean>(false);

  const urlParams = new URLSearchParams(window.location.search);

  const TWITCH_CHANNEL = urlParams.get("channel");
  const SPEED = urlParams.get("speed");
  const INITIAL_CLUES = urlParams.get("initialclues");
  const RESTART_SPEED = urlParams.get("restartspeed");
  const WORD_LIST = urlParams.get("wordlist");
  const DELAY = urlParams.get("delay");

  const word = useRef<string>();
  const isGameOver = useRef<boolean>(false);

  const [displayWord, setDisplayWord] = useState<string[]>([]);
  const [revealedCount, setRevealedCount] = useState<number>(INITIAL_CLUES ? Number(INITIAL_CLUES) : 2);
  const [winner, setWinner] = useState<string>();
  const [intervalId, setIntervalId] = useState<number | null>(null);

  const clueSpeed = SPEED ? Number(SPEED) * 1000 : 15000;
  const clueDelay = DELAY ? Number(DELAY) * 1000 : 0;
  const restartSpeed = RESTART_SPEED ? Number(RESTART_SPEED) * 1000 : 5000;

  if (!TWITCH_CHANNEL)
    return (
      <>
        You need to put the twitch channel in the url! example:{" "}
        <a href="https://repo.pogly.gg/wordguesser/?channel=bobross">
          https://repo.pogly.gg/wordguesser/?channel=bobross
        </a>
        !
      </>
    );

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const twitchChannel: string = TWITCH_CHANNEL.toLowerCase();
    const twitchClient = tmi.Client({ channels: [twitchChannel] });

    twitchClient.connect();

    twitchClient.on("connected", () => {
      console.log("Connected to twitch chat!");
    });

    twitchClient.on("message", (_channel: string, tags: tmi.ChatUserstate, message: string) => {
      if (!tags.username || !message) return;
      if (isGameOver.current) return;

      const guess = message.toLowerCase().replace(/[^a-z0-9]/gi, "");

      if (guess === word.current!.toLowerCase()) {
        isGameOver.current = true;
        setDisplayWord(word.current!.split(""));

        if (intervalId !== null) clearInterval(intervalId);

        setWinner(tags.username);
      }
    });

    initializeGame();
  }, []);

  const initializeGame = () => {
    if (intervalId) clearInterval(intervalId);
    const clueCount = INITIAL_CLUES ? Number(INITIAL_CLUES) : 2;
    setRevealedCount(clueCount);

    const wordlist = WORD_LIST ? WORD_LIST.split(",") : defaultWords;

    const selectedWord: string = wordlist[Math.floor(Math.random() * wordlist.length)];
    word.current = selectedWord;

    setDisplayWord(selectedWord.split("").map((letter, index) => (index < clueCount ? letter : "_")));
    isGameOver.current = false;

    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= word.current!.length) {
          clearInterval(intervalId!);
          return prev;
        }
        return prev + 1;
      });
    }, clueSpeed + clueDelay);

    setIntervalId(interval);

    setWinner("");
  };

  useEffect(() => {
    setDisplayWord((prev) =>
      word.current!.split("").map((letter, index) => (index < revealedCount ? letter : prev[index] || "_"))
    );
  }, [revealedCount, word]);

  useEffect(() => {
    if (isGameOver.current) {
      const timer = window.setInterval(() => {
        clearInterval(timer);
        clearInterval(intervalId!);
        initializeGame();
      }, restartSpeed);

      return () => clearInterval(timer);
    }
  }, [isGameOver.current]);

  return (
    <div className="game-container">
      <h2>Guess the word!</h2>
      <h3>{displayWord.join(" ")}</h3>
      {isGameOver.current ? <h3 className="congrats">🎉 {winner} guessed correctly! 🎉</h3> : <h3></h3>}
    </div>
  );
}

export default App;
