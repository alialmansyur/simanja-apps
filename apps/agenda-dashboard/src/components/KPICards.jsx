import React from 'react';
import { CalendarCheck, CalendarDays, Clock, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const KPICard = ({ title, value, icon: Icon, cardBgClass, textClass, iconBgClass, gradientClass }) => (
  <motion.div 
    variants={itemVariants}
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`relative overflow-hidden cursor-pointer rounded-2xl p-5 transition-all duration-300 group flex-1 min-w-[180px] ${cardBgClass}`}
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.15] group-hover:opacity-30 group-hover:scale-150 transition-all duration-700 ease-out ${gradientClass}`}></div>
    <div className={`absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-125 transition-all duration-700 ease-out ${gradientClass}`}></div>
    
    <div className="flex items-start justify-between relative z-10 gap-4">
      <div>
        <p className={`text-xs font-semibold mb-1.5 uppercase tracking-wider opacity-80 ${textClass}`}>{title}</p>
        <div className="flex items-end gap-2">
           <h3 className={`text-3xl font-extrabold tracking-tight leading-none ${textClass}`}>{value}</h3>
        </div>
      </div>
      <div className={`p-3 rounded-xl shrink-0 shadow-sm ${iconBgClass} ${textClass}`}>
        <Icon size={22} className="stroke-[2.5]" />
      </div>
    </div>
  </motion.div>
);

const KPICards = ({ data }) => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
    >
      <KPICard 
        title="Total Agenda Bulan Ini" 
        value={data?.totalAgendas || "0"} 
        icon={CalendarDays} 
        cardBgClass="bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60"
        textClass="text-blue-700 dark:text-blue-300"
        iconBgClass="bg-white/60 dark:bg-blue-900/50"
        gradientClass="bg-gradient-to-br from-blue-400 to-blue-600"
      />
      <KPICard 
        title="Agenda Diselesaikan" 
        value={data?.completedAgendas || "0"} 
        icon={CalendarCheck} 
        cardBgClass="bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
        textClass="text-emerald-700 dark:text-emerald-300"
        iconBgClass="bg-white/60 dark:bg-emerald-900/50"
        gradientClass="bg-gradient-to-br from-emerald-400 to-emerald-600"
      />
      <KPICard 
        title="Reminder Mendatang" 
        value={data?.upcomingReminders || "0"} 
        icon={Clock} 
        cardBgClass="bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60"
        textClass="text-amber-700 dark:text-amber-300"
        iconBgClass="bg-white/60 dark:bg-amber-900/50"
        gradientClass="bg-gradient-to-br from-amber-400 to-amber-600"
      />
      <KPICard 
        title="Agenda Hari Ini" 
        value={data?.todayAgendas || "0"} 
        icon={BellRing} 
        cardBgClass="bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60"
        textClass="text-purple-700 dark:text-purple-300"
        iconBgClass="bg-white/60 dark:bg-purple-900/50"
        gradientClass="bg-gradient-to-br from-purple-400 to-purple-600"
      />
    </motion.div>
  );
};

export default KPICards;
