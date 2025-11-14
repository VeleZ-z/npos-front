import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const Greetings = () => {
  const userData = useSelector(state => state.user);
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  };

  const formatTime = (date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

	return (
	  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
	    <div className="text-center md:text-left">
	      <h1 className="text-[#f5f5f5] text-2xl font-semibold tracking-wide">
	        Hola! {userData.name || "TEST USER"} 
	        <br />
	        Nos alegra tenerte de vuelta.
	      </h1>
	      <p className="text-[#ababab] text-sm mt-1">
	        Siempre brindamos el mejor servicio a nuestros clientes!
	      </p>
	    </div>
	    <div className="text-center md:text-right">
	      <h1 className="text-[#f5f5f5] text-3xl font-bold tracking-wide">
	        {formatTime(dateTime)}
	      </h1>
	      <p className="text-[#ababab] text-sm">{formatDate(dateTime)}</p>
	    </div>
	  </div>
	);
};

export default Greetings;
