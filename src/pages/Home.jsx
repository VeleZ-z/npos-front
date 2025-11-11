import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import BottomNav from "../components/shared/BottomNav";
import CustomerGreeting from "../components/home/CustomerGreeting";
import DiscountsTable from "../components/home/DiscountsTable";
import Greetings from "../components/home/Greetings";
import MiniCard from "../components/home/MiniCard";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import useTodayStats from "../hooks/useTodayStats";

const Home = () => {
  const { role } = useSelector((state) => state.user);
  const isStaff = role === "Admin" || role === "Cashier";
  const { data: todayStats, isLoading: statsLoading } = useTodayStats();

  const miniCards = useMemo(
    () => [
      {
        title: "Ganancias",
        icon: <BsCashCoin />,
        value: todayStats?.salesToday ?? 0,
        change: todayStats?.salesChangePct ?? 0,
        isCurrency: true,
      },
      {
        title: "Comandas Activas",
        icon: <GrInProgress />,
        value: todayStats?.activeToday ?? 0,
        change: todayStats?.activeChangePct ?? 0,
      },
    ],
    [todayStats]
  );

  useEffect(() => {
    document.title = "NPOS | Home";
  }, []);

  return (
    <section className="bg-[#1f1f1f]  h-[calc(100vh-5rem)] overflow-hidden flex gap-3">
      {/* Left Div */}
      <div className="flex-[3]">
        {isStaff ? (
          <>
            <Greetings />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-8 mt-8">
              {miniCards.map((card) => (
                <MiniCard
                  key={card.title}
                  title={card.title}
                  icon={card.icon}
                  number={card.value}
                  change={card.change}
                  isCurrency={card.isCurrency}
                  isLoading={statsLoading}
                />
              ))}
            </div>
            <RecentOrders />
          </>
        ) : (
          <>
            <CustomerGreeting />
            <div className="px-8 mt-6">
              <DiscountsTable />
            </div>
          </>
        )}
      </div>
      {/* Right Div */}
      <div className="flex-[2]">
        <PopularDishes />
      </div>
      <BottomNav />
    </section>
  );
};

export default Home;
