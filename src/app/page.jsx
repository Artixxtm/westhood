"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { MdOutlineArrowBack, MdOutlineArrowForward } from "react-icons/md";
import RoadGame from "@/components/RoadGame";

const ACCESS_STORAGE_KEY = "westhood-access";

function Arrow({ direction = "right" }) {
  const Icon =
    direction === "right" ? MdOutlineArrowForward : MdOutlineArrowBack;
  return <Icon className="arrow-icon" aria-hidden="true" focusable="false" />;
}

function DirectionArrows() {
  return (
    <span className="direction-icons" aria-hidden="true">
      <MdOutlineArrowBack focusable="false" />
      <MdOutlineArrowForward focusable="false" />
    </span>
  );
}

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Westhood home">
      <Image
        src="/logo.svg"
        alt="Westhood®"
        width={132}
        height={154}
        loading="eager"
      />
    </a>
  );
}

function Header() {
  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="Primary navigation">
        <button type="button">EST. 2026</button>
      </nav>
    </header>
  );
}

function WaitlistScene({ active, joined, unlocked, onJoined, onUnlocked }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const submitLockRef = useRef(false);
  const redirectTimerRef = useRef(null);
  const hasAccess = joined || status === "success";

  useEffect(
    () => () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    },
    [],
  );

  async function submit(event) {
    event.preventDefault();
    if (hasAccess) {
      if (unlocked) onUnlocked();
      else onJoined();
      return;
    }
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
      setMessage("YOU’RE ON THE LIST. OPENING THE TRIAL…");
      redirectTimerRef.current = window.setTimeout(onJoined, 900);
    } catch (error) {
      submitLockRef.current = false;
      setStatus("error");
      setMessage(error.message);
    }
  }

  return (
    <section
      className={`scene waitlist-scene ${active ? "is-active" : ""}`}
      aria-hidden={!active}
    >
      <div className="photo-panel">
        <Image
          src="/waitlist.jpg"
          alt="Sunlit road trip in a vintage car"
          preload
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
        />
        <div className="photo-shade" />
        <p className="photo-caption">
          <span>DROP 001</span>FIRST COME. FIRST SERVED.
        </p>
      </div>

      <div className="waitlist-content">
        <div className="content-inner">
          <p className="eyebrow">WESTHOOD® CLUB - COMING SOON</p>
          <h1>
            JOIN THE
            <br />
            WAITLIST.
          </h1>
          <p className="script-line">Be the first.</p>
          <p className="intro-copy">
            Westhood® is an independent West Coast lifestyle label built around
            limited drops, vintage sport energy and pieces made to be worn
            forever. Join the list for early access to Drop 001.
          </p>

          <form className="email-form" onSubmit={submit}>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="EMAIL ADDRESS"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={status === "loading" || hasAccess}
            />
            <button
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading"
                ? "SENDING"
                : unlocked
                  ? "VIEW DROP"
                  : hasAccess
                    ? "PLAY GAME"
                    : "JOIN"}
              <Arrow />
            </button>
          </form>
          <div className="form-meta" aria-live="polite">
            <span className={status === "error" ? "form-error" : ""}>
              {message || "NO SPAM. JUST THE GOOD STUFF.ACCESS"}
            </span>
            <span>01 / 03</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function GameScene({ active, onComplete, onBack }) {
  const [status, setStatus] = useState("idle");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(28);
  const [lane, setLane] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const scoreRef = useRef(0);
  const timeRef = useRef(28);
  const finishTimerRef = useRef(null);
  const wasActiveRef = useRef(active);

  const startGame = useCallback(() => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    scoreRef.current = 0;
    timeRef.current = 28;
    setScore(0);
    setTime(28);
    setLane(1);
    setResetKey((key) => key + 1);
    setStatus("playing");
  }, []);

  const move = useCallback(
    (direction) => {
      if (status !== "playing") return;
      setLane((current) => Math.max(0, Math.min(2, current + direction)));
    },
    [status],
  );

  const collect = useCallback(() => {
    if (scoreRef.current >= 3) return;
    scoreRef.current += 1;
    setScore(scoreRef.current);
    if (scoreRef.current === 3) {
      setStatus("won");
      finishTimerRef.current = window.setTimeout(onComplete, 1500);
    }
  }, [onComplete]);

  const crash = useCallback(() => {
    setStatus((current) => (current === "playing" ? "lost" : current));
  }, []);

  const leaveGame = useCallback(() => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    scoreRef.current = 0;
    timeRef.current = 28;
    setScore(0);
    setTime(28);
    setLane(1);
    setResetKey((key) => key + 1);
    setStatus("idle");
    onBack();
  }, [onBack]);

  useEffect(() => {
    if (status !== "playing") return undefined;
    const timer = window.setInterval(() => {
      timeRef.current -= 1;
      setTime(Math.max(0, timeRef.current));
      if (timeRef.current <= 0) setStatus("lost");
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (!active || status !== "playing") return undefined;

    function handleKey(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.matches("input, textarea, select, button") ||
          target.isContentEditable);
      if (isTyping) return;

      const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
      if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        move(-1);
      }
      if (key === "arrowright" || key === "d") {
        event.preventDefault();
        move(1);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, move, status]);

  useEffect(
    () => () => {
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (active && !wasActiveRef.current && status === "won") {
      scoreRef.current = 0;
      timeRef.current = 28;
      setScore(0);
      setTime(28);
      setLane(1);
      setResetKey((key) => key + 1);
      setStatus("idle");
    }
    wasActiveRef.current = active;
  }, [active, status]);

  return (
    <section
      className={`scene game-scene ${active ? "is-active" : ""}`}
      aria-hidden={!active}
    >
      <div className="game-instructions">
        <div>
          <p className="eyebrow">GET OUT THERE · 02</p>
          <h2>
            CATCH <span className="game-count">3</span>
            <br />W<sup className="registered-mark">®</sup> SIGNS
          </h2>
          <div className="instruction-rule" />
          <ul>
            <li>
              Use <DirectionArrows /> or <b>A D</b> to move
            </li>
            <li>Catch three Westhood® signs</li>
            <li>Don’t hit the other cars</li>
          </ul>
          <p className="script-line game-luck">Good luck, rider.</p>
        </div>
        <div className="game-instruction-footer" aria-hidden="true">
          <p>
            <span>ROUTE</span>COAST HIGHWAY
          </p>
          <p>
            <span>OBJECTIVE</span>03 SIGNS
          </p>
        </div>
      </div>

      <div className="game-viewport">
        <RoadGame
          active={active}
          lane={lane}
          playing={active && status === "playing"}
          resetKey={resetKey}
          crashed={active && status === "lost"}
          onCollect={collect}
          onCrash={crash}
        />
        <div className="game-grade" />
        <div className="game-hud">
          <span>
            SIGNS: <b>{score} / 3</b>
          </span>
          <span>
            TIME: <b>{String(time).padStart(2, "0")}</b>
          </span>
        </div>
        <div className="lane-status">
          <span className={lane === 0 ? "active" : ""} />
          <span className={lane === 1 ? "active" : ""} />
          <span className={lane === 2 ? "active" : ""} />
        </div>

        {status !== "playing" && (
          <div className={`game-overlay ${status}`}>
            {status === "idle" && (
              <>
                <p>WESTHOOD® DRIVING TRIAL</p>
                <h3>READY TO RIDE?</h3>
                <button type="button" onClick={startGame}>
                  START ENGINE <Arrow />
                </button>
              </>
            )}
            {status === "lost" && (
              <>
                <p>THE RIDE ENDS HERE</p>
                <h3>GAME OVER</h3>
                <div className="overlay-actions">
                  <button type="button" onClick={startGame}>
                    TRY AGAIN <Arrow />
                  </button>
                  <button type="button" onClick={leaveGame}>
                    LEAVE
                  </button>
                </div>
              </>
            )}
            {status === "won" && (
              <>
                <p>3 / 3 SIGNS COLLECTED</p>
                <h3>ACCESS GRANTED</h3>
                <span>OPENING DROP 001…</span>
              </>
            )}
          </div>
        )}

        <div className="game-controls">
          <button
            type="button"
            onPointerDown={() => move(-1)}
            aria-label="Move left"
          >
            <Arrow direction="left" />
          </button>
          <span>
            USE <DirectionArrows /> TO MOVE
          </span>
          <button
            type="button"
            onPointerDown={() => move(1)}
            aria-label="Move right"
          >
            <Arrow />
          </button>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ image, title, alt }) {
  return (
    <article className="product-card">
      <div className="product-visual">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(max-width: 900px) 46vw, 34vw"
          className="product-image"
        />
      </div>
      <div className="product-caption">
        <h3>{title}</h3>
        <span>DROP 001</span>
      </div>
    </article>
  );
}

function PreviewScene({ active, onBack }) {
  return (
    <section
      className={`scene preview-scene ${active ? "is-active" : ""}`}
      aria-hidden={!active}
    >
      <div className="preview-layout">
        <aside className="preview-copy">
          <div>
            <p className="eyebrow">YOU MADE IT WEST.</p>
            <p className="script-line preview-script">
              Here&apos;s a first look.
            </p>
            <div className="preview-rule" />
            <p className="preview-message">
              You caught all the signs.
              <br />
              Enjoy this early peek at
              <br />
              Drop 001.
            </p>
          </div>

          <div className="preview-lock">
            <p>
              THE REST STAYS LOCKED
              <br />
              UNTIL DROP 001.
            </p>
            <svg viewBox="0 0 24 28" aria-hidden="true">
              <path d="M6 12V8a6 6 0 0 1 12 0v4M4 12h16v14H4z" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </div>

          <button className="preview-return" type="button" onClick={onBack}>
            <Arrow direction="left" /> RETURN TO TRIAL
          </button>
        </aside>

        <ProductCard
          image="/first-t-shirt.png"
          alt="Westhood Rider graphic T-shirt"
          title="TEE / RIDER"
        />
        <ProductCard
          image="/first-hoodie.png"
          alt="Westhood Built Different hoodie"
          title="HOOD / INTENT"
        />
      </div>

      <footer className="preview-footer">
        <p>
          WESTHOOD® CLUB
          <br />
          LOS ANGELES, CA
        </p>
        <Image src="/logo.svg" alt="" width={58} height={58} />
        <p>
          BUILT DIFFERENT.
          <br />
          PLAY WITH INTENT.
        </p>
      </footer>
    </section>
  );
}

export default function Home() {
  const [scene, setScene] = useState(0);
  const [joined, setJoined] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const savedAccess = JSON.parse(window.localStorage.getItem(ACCESS_STORAGE_KEY));
        if (savedAccess?.joined) setJoined(true);
        if (savedAccess?.unlocked) {
          setJoined(true);
          setUnlocked(true);
        }
      } catch {}
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function saveAccess(nextAccess) {
    try {
      window.localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(nextAccess));
    } catch {}
  }

  function joinedList() {
    setJoined(true);
    saveAccess({ joined: true, unlocked });
    setScene(1);
  }

  function completedTrial() {
    setJoined(true);
    setUnlocked(true);
    saveAccess({ joined: true, unlocked: true });
    setScene(2);
  }

  return (
    <main id="top" className={`experience scene-${scene}`}>
      <Header />
      <div className="scene-stack">
        <WaitlistScene
          active={scene === 0}
          joined={joined}
          unlocked={unlocked}
          onJoined={joinedList}
          onUnlocked={() => setScene(2)}
        />
        <GameScene
          active={scene === 1}
          onComplete={completedTrial}
          onBack={() => setScene(0)}
        />
        <PreviewScene active={scene === 2} onBack={() => setScene(1)} />
      </div>
    </main>
  );
}
