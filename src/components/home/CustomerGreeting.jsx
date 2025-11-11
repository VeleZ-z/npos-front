import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const CustomerGreeting = () => {
  const user = useSelector((s) => s.user);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-8 pt-6">
      <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
        ¡Hola, {user?.name || 'Cliente'}!
      </h1>
      <p className="text-[#ababab] mt-1">
        {now.toLocaleDateString()} {now.toLocaleTimeString()}
      </p>
    </div>
  );
};

export default CustomerGreeting;

