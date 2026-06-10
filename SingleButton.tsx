import { motion } from "framer-motion";

export function SingleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex justify-end"
    >
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className="max-w-[88%] rounded-2xl px-5 py-3 text-right text-[15px] font-semibold leading-snug tracking-wide text-white shadow-lg transition hover:brightness-110"
        style={{ backgroundColor: "#861657" }}
      >
        {label}
      </motion.button>
    </motion.div>
  );
}
