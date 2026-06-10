import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { anneFlow, type FlowStep } from "@/data/anne-flow";
import { getZodiacSign } from "@/lib/zodiac";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { AudioMessage } from "./AudioMessage";
import { TextInputBar } from "./TextInputBar";
import { ChoiceButtons } from "./ChoiceButtons";
import { SingleButton } from "./SingleButton";
import { RichText } from "./RichText";
import donationButton from "@/assets/donation-button.png";

type Rendered =
  | { kind: "bot-text"; text: string; showAvatar: boolean }
  | { kind: "bot-system"; text: string }
  | { kind: "bot-audio"; src?: string; duration: number; showAvatar: boolean; audioIndex: number }
  | { kind: "bot-image"; src: string; caption?: string; showAvatar: boolean }
  | { kind: "donation-button"; label: string }
  | { kind: "user"; text: string };

const isValidDate = (v: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(v.trim());

export function ChatContainer() {
  const [index, setIndex] = useState(0);
  const [rendered, setRendered] = useState<Rendered[]>([]);
  const [typing, setTyping] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [, setDateError] = useState(false);
  const [waitingAudio, setWaitingAudio] = useState(false);
  const audioCountRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const interpolate = useMemo(
    () => (text: string) =>
      text
        .replace(/\{nom\}/g, answers.nom || "")
        .replace(/\{naissance\}/g, answers.naissance || "")
        .replace(/\{heure\}/g, answers.heure || "")
        .replace(/\{signe\}/g, answers.naissance ? getZodiacSign(answers.naissance) : ""),
    [answers]
  );

  // auto-advance bot steps
  useEffect(() => {
    if (waitingAudio) return;
    if (index >= anneFlow.length) return;
    const step = anneFlow[index];
    const isBot = step.type.startsWith("bot-");
    const isDonation = step.type === "ask-donation";
    if (!isBot && !isDonation) return;

    const lastRendered = rendered[rendered.length - 1];
    const lastIsBot =
      lastRendered?.kind === "bot-text" ||
      lastRendered?.kind === "bot-audio" ||
      lastRendered?.kind === "bot-image";
    const lastIsDonation = lastRendered?.kind === "donation-button";

    // Humanized typing: estimate from message length, like a real person texting on a phone.
    let totalDelay: number;
    if (isDonation) {
      totalDelay = 1200;
    } else if (lastIsDonation) {
      // First message after the donation button: fixed 4s wait
      totalDelay = 4000;
    } else if (step.type === "bot-text") {
      const len = interpolate(step.text).length;
      const estimated = 700 + len * 44;
      const clamped = Math.min(4400, Math.max(1100, estimated));
      const jitter = Math.floor(Math.random() * 500) - 160;
      totalDelay = clamped + jitter;
    } else if (step.type === "bot-system") {
      totalDelay = index === 0 ? 700 : 1000 + Math.floor(Math.random() * 400);
    } else if (step.type === "bot-image") {
      const lastIsImage = lastRendered?.kind === "bot-image";
      totalDelay = lastIsImage ? 5000 : 1400 + Math.floor(Math.random() * 500);
    } else {
      totalDelay = 1200 + Math.floor(Math.random() * 500);
    }
    const showTyping = !lastIsDonation && (step.type === "bot-text" || step.type === "bot-audio");
    const typingStart = setTimeout(() => {
      if (showTyping) setTyping(true);
    }, Math.max(0, totalDelay - Math.min(1800, totalDelay * 0.65)));

    const t = setTimeout(() => {
      setTyping(false);
      const showAvatar = !lastIsBot;
      if (isDonation && step.type === "ask-donation") {
        setRendered((r) => [...r, { kind: "donation-button", label: step.label }]);
        setIndex((i) => i + 1);
      } else if (step.type === "bot-text") {
        setRendered((r) => [...r, { kind: "bot-text", text: interpolate(step.text), showAvatar }]);
        setIndex((i) => i + 1);
      } else if (step.type === "bot-system") {
        setRendered((r) => [...r, { kind: "bot-system", text: interpolate(step.text) }]);
        setIndex((i) => i + 1);
      } else if (step.type === "bot-audio") {
        const audioIndex = audioCountRef.current;
        audioCountRef.current += 1;
        setRendered((r) => [
          ...r,
          { kind: "bot-audio", src: step.src, duration: step.duration ?? 30, showAvatar, audioIndex },
        ]);
        // Wait for the audio to finish before advancing
        setWaitingAudio(true);
      } else if (step.type === "bot-image") {
        setRendered((r) => [...r, { kind: "bot-image", src: step.src, caption: step.caption, showAvatar }]);
        setIndex((i) => i + 1);
      }
    }, totalDelay);
    return () => {
      clearTimeout(t);
      clearTimeout(typingStart);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, waitingAudio]);

  const handleAudioEnded = () => {
    if (!waitingAudio) return;
    setWaitingAudio(false);
    setIndex((i) => i + 1);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [rendered, typing]);

  const current = anneFlow[index] as FlowStep | undefined;

  const submitAnswer = (key: string, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setRendered((r) => [...r, { kind: "user", text: value }]);
    setIndex((i) => i + 1);
  };

  const handleDate = (key: string, value: string) => {
    setRendered((r) => [...r, { kind: "user", text: value }]);
    if (!isValidDate(value)) {
      setDateError(true);
      // queue the error messages, then re-ask the same question
      const nom = answers.nom || "";
      const errs: Rendered[] = [
        { kind: "bot-text", text: `Je suis désolé, ${nom}, mais la date que vous avez saisie ne semble pas valide.`, showAvatar: true },
        { kind: "bot-text", text: "Veuillez saisir à nouveau votre date de naissance en utilisant exactement le format suivant : **jj/MM/aaaa**", showAvatar: false },
        { kind: "bot-text", text: "Par exemple : 15/03/1990", showAvatar: false },
        { kind: "bot-text", text: "Redis-moi…", showAvatar: false },
        { kind: "bot-text", text: "Quelle est votre date de naissance ?", showAvatar: true },
      ];
      // simulate typing then append all
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setRendered((r) => [...r, ...errs]);
      }, 1400);
      return;
    }
    setDateError(false);
    setAnswers((a) => ({ ...a, [key]: value }));
    setIndex((i) => i + 1);
  };

  const renderInput = () => {
    if (!current) return null;
    if (current.type === "ask-text")
      return (
        <TextInputBar
          placeholder={current.placeholder}
          onSubmit={(v) => submitAnswer(current.key, v)}
        />
      );
    if (current.type === "ask-date")
      return (
        <TextInputBar
          placeholder={current.placeholder ?? "JJ/MM/AAAA"}
          onSubmit={(v) => handleDate(current.key, v)}
        />
      );
    if (current.type === "ask-email")
      return (
        <TextInputBar
          type="email"
          placeholder={current.placeholder}
          onSubmit={(v) => submitAnswer(current.key, v)}
        />
      );
    if (current.type === "ask-choice")
      return (
        <ChoiceButtons
          options={current.options}
          onPick={(v) => submitAnswer(current.key, v)}
        />
      );
    if (current.type === "ask-button")
      return (
        <SingleButton
          label={current.label}
          onClick={() => {
            setRendered((r) => [...r, { kind: "user", text: current.label }]);
            setIndex((i) => i + 1);
          }}
        />
      );
    return null;
  };

  const renderDonationButton = (label: string, key: number | string) => (
    <button
      key={key}
      type="button"
      onClick={() => {
        try {
          localStorage.setItem(
            "quiz_data",
            JSON.stringify({
              email: answers.email || "",
              name: answers.nom || "",
              naissance: answers.naissance || "",
              heure: answers.heure || "",
              timestamp: Date.now(),
            }),
          );
        } catch {
          // ignore storage errors
        }
        const params = new URLSearchParams();
        if (answers.nom) params.set("name", answers.nom);
        if (answers.email) params.set("email", answers.email);
        const qs = params.toString();
        window.location.href = `https://trk.edgequantumm.com/click${qs ? `?${qs}` : ""}`;
      }}
      aria-label={label}
      className="mx-auto block w-full max-w-[360px] transition active:scale-[0.98] hover:brightness-105 animate-[pulse_2.4s_ease-in-out_infinite]"
    >
      <img src={donationButton} alt={label} className="w-full h-auto" />
    </button>
  );

  return (
    <div className="chat-pattern flex h-dvh flex-col">
      <ChatHeader />
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
          <div className="mx-auto rounded-full bg-white/90 px-3.5 py-1 text-[11px] font-medium text-chat-text-bot/70 shadow-sm backdrop-blur">
            ⌛️ Votre chat commence !
          </div>
          {rendered.map((m, i) => {
            if (m.kind === "user") {
              return (
                <MessageBubble key={i} from="user">
                  {m.text}
                </MessageBubble>
              );
            }
            if (m.kind === "bot-system") {
              return (
                <div key={i} className="mx-auto rounded-md bg-white/95 px-3 py-1.5 text-[12.5px] italic underline text-chat-text-bot/80 shadow-sm">
                  {m.text}
                </div>
              );
            }
            if (m.kind === "bot-text") {
              return (
                <MessageBubble key={i} from="bot" showAvatar={m.showAvatar}>
                  <RichText text={m.text} />
                </MessageBubble>
              );
            }
            if (m.kind === "bot-audio") {
              const isLastAudio = m.audioIndex === audioCountRef.current - 1;
              return (
                <MessageBubble key={i} from="bot" showAvatar={m.showAvatar}>
                  <AudioMessage
                    src={m.src}
                    duration={m.duration}
                    autoPlay
                    onEnded={isLastAudio ? handleAudioEnded : undefined}
                  />
                </MessageBubble>
              );
            }
            if (m.kind === "bot-image") {
              return (
                <MessageBubble key={i} from="bot" showAvatar={m.showAvatar} noPadding>
                  <img src={m.src} alt="" loading="lazy" className="max-w-[260px]" />
                  {m.caption && (
                    <p className="px-3 py-2 text-[13px]">
                      <RichText text={m.caption} />
                    </p>
                  )}
                </MessageBubble>
              );
            }
            if (m.kind === "donation-button") {
              return <div key={i} className="my-1">{renderDonationButton(m.label, i)}</div>;
            }
            return null;
          })}
          {typing && <TypingIndicator />}
          {!typing && current && current.type.startsWith("ask-") && (
            <div className="mt-2">{renderInput()}</div>
          )}
        </div>
      </div>
    </div>
  );
}
