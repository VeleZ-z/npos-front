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
	  <section className="page-shell text-[#f5f5f5]">
	    <div className="page-shell__content">
	      <div className="flex flex-col xl:flex-row gap-6">
	        <div className="w-full xl:flex-[3] flex flex-col gap-6">
	          <div className="page-card">
	            <Greetings />
	          </div>
	          {isStaff ? (
	            <>
	              <div className="page-card">
	                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
	              </div>
	              <RecentOrders />
	            </>
	          ) : (
	            <div className="page-card space-y-6">
	              <CustomerGreeting />
	              <DiscountsTable />
	            </div>
	          )}
	        </div>
	        <div className="w-full xl:flex-[2]">
	          <PopularDishes />
	        </div>
	      </div>
	    </div>
	    <BottomNav />
	  </section>
	);
};

export default Home;
