
import { useNavigate } from "react-router-dom";
import { getAvatarName, getBgColor } from "../../utils"
import { useDispatch } from "react-redux";
import { updateTable } from "../../redux/slices/customerSlice";
import { FaLongArrowAltRight } from "react-icons/fa";

const TableCard = ({id, name, status, initials, seats}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleClick = (name) => {
    if(status === "Booked") return;

    const table = { tableId: id, tableNo: name }
    dispatch(updateTable({table}))
    navigate(`/menu`);
  };

  const statusLabel = (() => {
    if (status === "Booked") return { text: "Ocupada", className: "text-red-500 bg-[#2a1515]" };
    if (status === "PendingApproval") return { text: "Por aprobar", className: "text-amber-400 bg-[#2a2415]" };
    return { text: status, className: "bg-[#664a04] text-white" };
  })();

  const cardClass =
    status === "Booked"
      ? "bg-[#2a1515] border border-red-500/70"
      : status === "PendingApproval"
      ? "bg-[#2a2415] border border-amber-400/70"
      : "bg-[#262626] border border-transparent";

  return (
    <div onClick={() => handleClick(name)} key={id} className={`w-[220px] h-[220px] hover:bg-[#2c2c2c] p-4 rounded-lg cursor-pointer ${cardClass}`}>
      <div className="flex items-center justify-between px-1">
        <h1 className="text-[#f5f5f5] text-xl font-semibold">Table <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" /> {name}</h1>
        <p className={`${statusLabel.className} px-2 py-1 rounded-lg`}>
          {statusLabel.text}
        </p>
      </div>
      <div className="flex items-center justify-center mt-5 mb-8">
        <h1 className={`text-white rounded-full p-5 text-xl`} style={{backgroundColor : initials ? getBgColor() : "#1f1f1f"}} >{getAvatarName(initials) || "N/A"}</h1>
      </div>
      <p className="text-[#ababab] text-xs">Seats: <span className="text-[#f5f5f5]">{seats}</span></p>
    </div>
  );
};

export default TableCard;
