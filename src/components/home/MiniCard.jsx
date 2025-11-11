import React from "react";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const MiniCard = ({
  title,
  icon,
  number,
  change,
  isCurrency = false,
  isLoading = false,
}) => {
  const changeValue = Number(change || 0);
  const changeLabel = `${changeValue >= 0 ? "+" : ""}${changeValue.toFixed(
    1
  )}%`;
  return (
    <div className="bg-[#1a1a1a] py-5 px-5 rounded-lg w-full">
      <div className="flex items-start justify-between">
        <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
          {title}
        </h1>
        <div className="bg-[#f6b100] p-3 rounded-lg text-[#1a1a1a] text-2xl">
          {icon}
        </div>
      </div>
      <div>
        <h1 className="text-[#f5f5f5] text-4xl font-bold mt-5">
          {isLoading
            ? "..."
            : isCurrency
            ? `$ ${formatCurrency(number)}`
            : Number(number || 0).toLocaleString("es-CO")}
        </h1>
        <h1 className="text-[#f5f5f5] text-lg mt-2">
          <span
            className={`${
              changeValue >= 0 ? "text-[#02ca3a]" : "text-red-400"
            }`}
          >
            {isLoading ? "..." : changeLabel}
          </span>{" "}
          que ayer
        </h1>
      </div>
    </div>
  );
};

export default MiniCard;
