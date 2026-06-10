import { motion } from "framer-motion";

type Props = {
  options: string[];
  onPick: (value: string) => void;
};

export function ChoiceButtons({ options, onPick }: Props) {
  return (
    <div className="flex flex-col items-end gap-2">
      {options.map((opt, i) => (
        <motion.button
          key={opt}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.07, duration: 0.25 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onPick(opt)}
          className="max-w-[82%] rounded-2xl px-4 py-2.5 text-right text-[14.5px] font-medium leading-snug text-white shadow-sm transition hover:brightness-110"
          style={{ backgroundColor: "#861657" }}
        >
          {opt}
        </motion.button>
      ))}
    </div>
  );
}
